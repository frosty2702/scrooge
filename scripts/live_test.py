"""
Live / Out-of-Sample Test for Scrooge.ai
=========================================
Fetches NIFTY 50 data from Jan 2026 onwards (unseen by the model),
generates synthetic multi-asset features using the same pipeline as training,
runs the trained DirichletPPO agent on this new data, and compares
against Equal-Weight and Mean-Variance baselines.

Run from the project root:
    python live_test.py
"""

import json
from pathlib import Path
import numpy as np
import pandas as pd
import torch
import yfinance as yf

from trading_env import TradingEnv
from src.dirichlet_policy import DirichletPolicy, DirichletPPO

# ── Config ─────────────────────────────────────────────────────────────────────
LIVE_START     = "2026-01-01"
LIVE_END       = "2026-04-30"          # adjust to today if needed
TICKER         = "^NSEI"
MODEL_PATH     = "models/ppo_trading_model"
WINDOW_SIZE    = 20
LIVE_CSV       = "data/live_features.csv"
RESULTS_PATH   = "results/live_test_results.json"

np.random.seed(0)
torch.manual_seed(0)

# ── Step 1: Fetch live NIFTY data ──────────────────────────────────────────────
print("=" * 60)
print("SCROOGE.AI — OUT-OF-SAMPLE LIVE TEST")
print("=" * 60)
print(f"\n[1/5] Fetching NIFTY 50 data from {LIVE_START} to {LIVE_END}...")

raw = yf.download(TICKER, start=LIVE_START, end=LIVE_END, interval="1d", progress=False)
if isinstance(raw.columns, pd.MultiIndex):
    raw.columns = raw.columns.get_level_values(0)
raw.reset_index(inplace=True)
raw.columns = raw.columns.str.lower().str.replace(" ", "_")
raw.dropna(subset=["close"], inplace=True)
raw.sort_values("date", inplace=True)
raw["return"] = raw["close"].pct_change()
raw.dropna(subset=["return"], inplace=True)

print(f"    Fetched {len(raw)} trading days ({raw['date'].iloc[0].date()} → {raw['date'].iloc[-1].date()})")

if len(raw) < WINDOW_SIZE + 5:
    print(f"\n⚠  Not enough data ({len(raw)} days). Need at least {WINDOW_SIZE + 5}.")
    print("   Try expanding LIVE_END or check your internet connection.")
    exit(1)

# ── Step 2: Generate synthetic multi-asset features (same as prepare_data.py) ──
print("\n[2/5] Generating multi-asset features (same pipeline as training)...")

base   = raw["return"].values
dates  = raw["date"].values
n      = len(base)

assets = {
    "Equity":    base * 1.0  + np.random.normal(0.0003,  0.008, n),
    "Bond":      base * -0.1 + np.random.normal(0.00012, 0.003, n),
    "Commodity": base * 0.2  + np.random.normal(0.0002,  0.006, n),
    "Defensive": np.random.normal(0.00008, 0.002, n),
}

frames = []
for name, rets in assets.items():
    frames.append(pd.DataFrame({"Date": dates, "Asset": name, "Return": rets}))
live_df = pd.concat(frames).reset_index(drop=True)

Path(LIVE_CSV).parent.mkdir(parents=True, exist_ok=True)
live_df.to_csv(LIVE_CSV, index=False)
print(f"    Live features saved to {LIVE_CSV}")

# ── Step 3: Load model and run on live data ────────────────────────────────────
print("\n[3/5] Loading trained model and running on live data...")

env = TradingEnv(csv_file=LIVE_CSV, window_size=WINDOW_SIZE)
if len(env.returns) < WINDOW_SIZE + 2:
    print("⚠  Still not enough data after feature generation. Exiting.")
    exit(1)

model = DirichletPPO.load(MODEL_PATH, custom_objects={"policy_class": DirichletPolicy})
model.policy.set_training_mode(False)

env.current_step  = WINDOW_SIZE
env.portfolio_value = 1.0
env.prev_weights  = np.ones(env.n_assets) / env.n_assets

obs              = env._get_observation()
ppo_values       = [1.0]
ew_values        = [1.0]
mv_values        = [1.0]
all_weights      = []

# Equal-Weight baseline
ew_weights = np.ones(env.n_assets) / env.n_assets

# Collect returns for MV baseline (use full window available)
hist_returns = env.returns.values  # shape: (T, n_assets)

with torch.no_grad():
    while env.current_step < len(env.returns):
        # PPO agent
        action, _ = model.predict(obs, deterministic=True)
        action = np.clip(action, 0, 1)
        s = np.sum(action)
        action = action / s if s > 1e-6 else ew_weights.copy()

        step_ret = env.returns.iloc[env.current_step].values
        ppo_ret  = float(np.dot(action, step_ret))

        # Equal-weight
        ew_ret = float(np.dot(ew_weights, step_ret))

        # Mean-Variance (rolling 60-day cov if enough history, else equal-weight)
        mv_w = ew_weights.copy()
        start_idx = max(0, env.current_step - 60)
        window_ret = env.returns.iloc[start_idx:env.current_step].values
        if window_ret.shape[0] >= env.n_assets + 1:
            try:
                mu  = np.mean(window_ret, axis=0)
                cov = np.cov(window_ret.T) + np.eye(env.n_assets) * 1e-6
                inv = np.linalg.inv(cov)
                raw_w = inv @ mu
                raw_w = np.maximum(raw_w, 0)
                if np.sum(raw_w) > 1e-6:
                    mv_w = raw_w / np.sum(raw_w)
            except Exception:
                mv_w = ew_weights.copy()
        mv_ret = float(np.dot(mv_w, step_ret))

        ppo_values.append(ppo_values[-1] * (1 + ppo_ret))
        ew_values.append(ew_values[-1]   * (1 + ew_ret))
        mv_values.append(mv_values[-1]   * (1 + mv_ret))
        all_weights.append(action.tolist())

        obs, _, done, _, _ = env.step(action)
        if done:
            break

print(f"    Ran {len(ppo_values)-1} steps on live data.")

# ── Step 4: Compute metrics ────────────────────────────────────────────────────
print("\n[4/5] Computing performance metrics...")

def metrics(values):
    v   = np.array(values)
    ret = np.diff(v) / v[:-1]
    ret = ret[~np.isnan(ret)]
    total_ret   = (v[-1] / v[0] - 1) * 100
    ann_ret     = ((v[-1] / v[0]) ** (252 / max(len(ret), 1)) - 1) * 100
    volatility  = float(np.std(ret) * np.sqrt(252) * 100) if len(ret) > 1 else 0
    sharpe      = float(np.mean(ret) / (np.std(ret) + 1e-8) * np.sqrt(252)) if len(ret) > 1 else 0
    cum         = np.cumprod(1 + np.concatenate([[0], ret]))
    running_max = np.maximum.accumulate(cum)
    drawdowns   = (cum / running_max) - 1
    max_dd      = float(np.min(drawdowns) * 100)
    return {
        "total_return_pct": round(total_ret, 2),
        "annualised_return_pct": round(ann_ret, 2),
        "sharpe_ratio": round(sharpe, 3),
        "volatility_pct": round(volatility, 2),
        "max_drawdown_pct": round(max_dd, 2),
        "final_value": round(v[-1], 4),
    }

ppo_m = metrics(ppo_values)
ew_m  = metrics(ew_values)
mv_m  = metrics(mv_values)

asset_names = env.returns.columns.tolist()
avg_weights = np.mean(all_weights, axis=0).tolist() if all_weights else []

results = {
    "test_period": {"start": LIVE_START, "end": LIVE_END},
    "trading_days": len(ppo_values) - 1,
    "note": "Data from Jan 2026 onward — entirely unseen during training (training ended Dec 2025)",
    "PPO_Agent":        ppo_m,
    "Equal_Weight":     ew_m,
    "Mean_Variance":    mv_m,
    "avg_allocation":   dict(zip(asset_names, [round(w, 4) for w in avg_weights])),
}

Path(RESULTS_PATH).parent.mkdir(parents=True, exist_ok=True)
with open(RESULTS_PATH, "w") as f:
    json.dump(results, f, indent=2)

# ── Step 5: Print report ───────────────────────────────────────────────────────
print("\n[5/5] Results\n")
print(f"  Test Period  : {LIVE_START}  →  {LIVE_END}")
print(f"  Trading Days : {len(ppo_values)-1}  (entirely unseen — training ended Dec 2025)")
print()
print(f"  {'Metric':<30} {'PPO Agent':>12} {'Equal-Weight':>14} {'Mean-Variance':>15}")
print("  " + "-" * 73)
rows = [
    ("Total Return (%)",          "total_return_pct"),
    ("Annualised Return (%)",      "annualised_return_pct"),
    ("Sharpe Ratio",               "sharpe_ratio"),
    ("Volatility (%)",             "volatility_pct"),
    ("Max Drawdown (%)",           "max_drawdown_pct"),
]
for label, key in rows:
    print(f"  {label:<30} {str(ppo_m[key]):>12} {str(ew_m[key]):>14} {str(mv_m[key]):>15}")

print()
print("  Average Portfolio Allocation (PPO Agent):")
for asset, w in zip(asset_names, avg_weights):
    bar = "█" * int(w * 40)
    print(f"    {asset:<12} {w*100:5.1f}%  {bar}")

print()
print(f"  Full results saved to: {RESULTS_PATH}")
print()
if ppo_m["sharpe_ratio"] > ew_m["sharpe_ratio"]:
    print("  ✅ PPO agent outperforms Equal-Weight on unseen live data (Sharpe).")
else:
    print("  ℹ  Equal-Weight leads on Sharpe — consistent with DeMiguel et al. (2009).")
if ppo_m["sharpe_ratio"] > mv_m["sharpe_ratio"]:
    print("  ✅ PPO agent outperforms Mean-Variance on unseen live data (Sharpe).")
print()
print("=" * 60)
