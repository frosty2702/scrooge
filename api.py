"""
FastAPI backend for portfolio simulation.
"""
import json
from datetime import datetime
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
import torch
from fastapi import Depends, FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import create_token, decode_token, hash_password, verify_password
from database import get_db, init_db
from models import Simulation, User
from src.decision_logger import DecisionLogger
from src.dirichlet_policy import DirichletPolicy, DirichletPPO
from src.explainability import compute_aggregate_feature_importance, get_explanation_data
from trading_env import TradingEnv

# Seeds for determinism
np.random.seed(42)
torch.manual_seed(42)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup
@app.on_event("startup")
def on_startup():
    init_db()


MODEL_PATH = "models/ppo_trading_model"
DATA_PATH = "data/features.csv"
WINDOW_SIZE = 20
TRADING_DAYS_PER_MONTH = 21


# ── Pydantic schemas ───────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    risk_profile: str        # conservative / moderate / aggressive
    investment_goal: str


class LoginRequest(BaseModel):
    email: str
    password: str


class SimulateRequest(BaseModel):
    amount: float
    months: int              # e.g. 6, 12, 24 — any positive integer


# ── Auth helpers ───────────────────────────────────────────────────────────────

def get_current_user_id(authorization: Optional[str] = Header(default=None)) -> Optional[int]:
    """Extract user_id from Bearer token. Returns None if missing/invalid."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    return decode_token(token)


def require_auth(authorization: Optional[str] = Header(default=None)) -> int:
    """Same as above but raises 401 if not authenticated."""
    user_id = get_current_user_id(authorization)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or missing token")
    return user_id


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    valid_profiles = {"conservative", "moderate", "aggressive"}
    if request.risk_profile not in valid_profiles:
        raise HTTPException(status_code=400, detail=f"risk_profile must be one of {valid_profiles}")

    user = User(
        name=request.name,
        email=request.email,
        password=hash_password(request.password),
        risk_profile=request.risk_profile,
        investment_goal=request.investment_goal,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"token": create_token(user.id), "user": {"id": user.id, "name": user.name, "email": user.email}}


@app.post("/api/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {"token": create_token(user.id), "user": {"id": user.id, "name": user.name, "email": user.email}}


@app.post("/api/simulate")
def simulate(
    request: SimulateRequest,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id),
):
    amount = request.amount
    months = request.months

    if months < 1 or months > 120:
        raise HTTPException(status_code=400, detail="months must be between 1 and 120")

    period_days = months * TRADING_DAYS_PER_MONTH
    np.random.seed(42)
    torch.manual_seed(42)

    env = TradingEnv(csv_file=DATA_PATH, window_size=WINDOW_SIZE)
    env.action_space.seed(42)

    max_start = len(env.returns) - period_days - 1
    if max_start < env.window_size:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough data for {period}. Need at least {env.window_size + period_days} days.",
        )
    start_step = int(np.random.randint(env.window_size, max_start + 1))
    env.current_step = start_step
    env.portfolio_value = 1.0
    env.prev_weights = np.ones(env.n_assets) / env.n_assets

    model = DirichletPPO.load(
        MODEL_PATH,
        custom_objects={"policy_class": DirichletPolicy}
    )
    model.policy.set_training_mode(False)

    log_path = Path("results/api_simulate_log.csv")
    log_path.parent.mkdir(parents=True, exist_ok=True)
    if log_path.exists():
        log_path.unlink()
    logger = DecisionLogger(output_path=str(log_path))

    obs = env._get_observation()
    timestep = start_step
    steps_run = 0
    portfolio_values = [env.portfolio_value]

    with torch.no_grad():
        while steps_run < period_days:
            action, _ = model.predict(obs, deterministic=True)
            action = np.array(action)
            action = np.clip(action, 0, 1)
            raw_sum = np.sum(action)
            if raw_sum < 1e-6:
                action = np.ones(len(action)) / len(action)
            else:
                action = action / raw_sum

            date_str = str(env.dates[env.current_step])
            obs_next, reward, done, _, info = env.step(action)

            snapshot = logger.log(
                timestep=timestep,
                date=date_str,
                obs=obs,
                action=action,
                reward=reward,
                capital=info["portfolio_value"],
            )

            portfolio_values.append(info["portfolio_value"])
            obs = obs_next
            timestep += 1
            steps_run += 1

            if done:
                break

    scale = amount / portfolio_values[0]
    scaled_values = [v * scale for v in portfolio_values]
    final_amount = scaled_values[-1]
    total_return_pct = (final_amount / amount - 1) * 100

    snapshots = logger.get_all_snapshots()
    decisions = []
    final_weights = None
    for i, s in enumerate(snapshots):
        if i % 5 == 0:
            exp = get_explanation_data(s)
            decisions.append(
                {
                    "timestep": s.timestep,
                    "date": s.date,
                    "weights": s.weights.tolist(),
                    "capital": float(s.capital * scale),
                    "feature_importance": exp["feature_importance"],
                }
            )
        if i == len(snapshots) - 1:
            final_weights = s.weights.tolist()

    returns = np.diff(portfolio_values) / np.array(portfolio_values[:-1])
    returns = returns[~np.isnan(returns)]
    if len(returns) < 2:
        sharpe = 0.0
        volatility = 0.0
    else:
        volatility = float(np.std(returns) * np.sqrt(252) * 100)
        sharpe = float(np.mean(returns) / (np.std(returns) + 1e-8) * np.sqrt(252))
    cum = np.cumprod(1 + np.concatenate([[0], returns]))
    running_max = np.maximum.accumulate(cum)
    drawdowns = (cum / running_max) - 1
    max_drawdown = float(np.min(drawdowns) * 100)

    asset_names = env.returns.columns.tolist()

    # Save to DB if a user is logged in
    if user_id is not None:
        sim = Simulation(
            user_id=user_id,
            amount=amount,
            period=str(months),
            final_amount=final_amount,
            total_return_pct=total_return_pct,
            sharpe=sharpe,
            volatility=volatility,
            max_drawdown=max_drawdown,
            weights=json.dumps(final_weights),
            decisions=json.dumps(decisions),
            asset_names=json.dumps(asset_names),
        )
        db.add(sim)
        db.commit()

    return {
        "initial_amount": amount,
        "final_amount": final_amount,
        "total_return_pct": total_return_pct,
        "decisions": decisions,
        "metrics": {
            "sharpe": sharpe,
            "volatility": volatility,
            "max_drawdown": max_drawdown,
        },
        "asset_names": asset_names,
    }


def _serialize_sim(s):
    return {
        "id": s.id,
        "amount": s.amount,
        "period": s.period,
        "initial_amount": s.amount,
        "final_amount": s.final_amount,
        "total_return_pct": s.total_return_pct,
        "metrics": {
            "sharpe": s.sharpe,
            "volatility": s.volatility,
            "max_drawdown": s.max_drawdown,
        },
        "weights": json.loads(s.weights) if s.weights else None,
        "decisions": json.loads(s.decisions) if s.decisions else [],
        "asset_names": json.loads(s.asset_names) if s.asset_names else [],
        "created_at": s.created_at.isoformat(),
    }


@app.get("/api/my-simulations")
def my_simulations(
    db: Session = Depends(get_db),
    user_id: int = Depends(require_auth),
):
    sims = (
        db.query(Simulation)
        .filter(Simulation.user_id == user_id)
        .order_by(Simulation.created_at.desc())
        .all()
    )
    return [_serialize_sim(s) for s in sims]


@app.get("/api/latest-simulation")
def latest_simulation(
    db: Session = Depends(get_db),
    user_id: int = Depends(require_auth),
):
    sim = (
        db.query(Simulation)
        .filter(Simulation.user_id == user_id)
        .order_by(Simulation.created_at.desc())
        .first()
    )
    if not sim:
        raise HTTPException(status_code=404, detail="No simulations found")
    return _serialize_sim(sim)


@app.get("/api/comparison")
def comparison():
    cache_path = Path("results/comparison_cache.json")
    if not cache_path.exists():
        raise HTTPException(
            status_code=503,
            detail="Cache not found. Run: python src/precompute.py"
        )
    with open(cache_path) as f:
        return json.load(f)


@app.get("/api/portfolio-history")
def portfolio_history():
    log_path = Path("results/decision_log.csv")
    if not log_path.exists():
        return {"history": []}
    df = pd.read_csv(log_path)
    if "date" not in df.columns or "capital" not in df.columns:
        return {"history": []}
    capital = df["capital"].values
    if len(capital) == 0:
        return {"history": []}
    scale = 100.0 / capital[0]
    scaled = (capital * scale).tolist()
    dates = df["date"].astype(str).str[:10].tolist()
    history = [{"date": d, "capital": float(c)} for d, c in zip(dates, scaled)]
    return {"history": history}


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    risk_profile: Optional[str] = None
    investment_goal: Optional[str] = None


@app.get("/api/me")
def get_me(db: Session = Depends(get_db), user_id: int = Depends(require_auth)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "risk_profile": user.risk_profile,
        "investment_goal": user.investment_goal,
        "created_at": user.created_at.isoformat(),
    }


@app.put("/api/me")
def update_me(
    request: UpdateProfileRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(require_auth),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if request.name:
        user.name = request.name
    if request.risk_profile:
        valid = {"conservative", "moderate", "aggressive"}
        if request.risk_profile not in valid:
            raise HTTPException(status_code=400, detail=f"risk_profile must be one of {valid}")
        user.risk_profile = request.risk_profile
    if request.investment_goal:
        user.investment_goal = request.investment_goal
    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "risk_profile": user.risk_profile,
        "investment_goal": user.investment_goal,
    }


@app.get("/api/market-regime")
def market_regime():
    df = pd.read_csv(DATA_PATH)
    df["Date"] = pd.to_datetime(df["Date"])
    returns = df.pivot(index="Date", columns="Asset", values="Return")

    recent_20 = returns.tail(20)
    recent_30 = returns.tail(30)

    avg_return = float(recent_20.mean().mean())
    volatility = float(recent_20.std().mean())
    trend_30d_pct = round(float(recent_30.mean().mean() * 252 * 100), 2)

    if avg_return > 0.001:
        regime, stance, recommendation = "Bull Market", "Growth-oriented", "Hold Equity"
    elif avg_return < -0.001:
        regime, stance, recommendation = "Bear Market", "Defensive", "Reduce Equity"
    else:
        regime, stance, recommendation = "Sideways", "Balanced", "Diversify"

    if volatility < 0.007:
        vol_level = "Low"
    elif volatility > 0.015:
        vol_level = "High"
    else:
        vol_level = "Moderate"

    return {
        "regime": regime,
        "stance": stance,
        "recommendation": recommendation,
        "volatility_level": vol_level,
        "trend_30d_pct": trend_30d_pct,
        "last_date": str(returns.index[-1].date()),
    }


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@app.post("/api/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    import secrets
    from datetime import timedelta
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Return success regardless to avoid email enumeration
        return {"message": "If that email exists, a reset code has been generated."}

    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    # In production this would be emailed. For demo we return it directly.
    return {
        "message": "Reset code generated successfully.",
        "reset_token": token,   # demo only — in production this goes to email
        "expires_in": "1 hour",
    }


@app.post("/api/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user = db.query(User).filter(User.reset_token == request.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    if user.reset_token_expires and datetime.utcnow() > user.reset_token_expires:
        raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")

    user.password = hash_password(request.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    return {"message": "Password reset successfully. You can now log in."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
