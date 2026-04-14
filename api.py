"""
FastAPI backend for portfolio simulation.
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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

PERIOD_DAYS = {"6months": 126, "1year": 252}
MODEL_PATH = "models/ppo_trading_model"
DATA_PATH = "data/features.csv"
WINDOW_SIZE = 20


class SimulateRequest(BaseModel):
    amount: float
    period: str


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/simulate")
def simulate(request: SimulateRequest):
    amount = request.amount
    period = request.period

    if period not in PERIOD_DAYS:
        raise HTTPException(status_code=400, detail="period must be '6months' or '1year'")

    period_days = PERIOD_DAYS[period]
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

    # Fixed: use DirichletPPO to load the model correctly
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)