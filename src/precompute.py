"""
Pre-compute strategy comparison metrics and cache to results/comparison_cache.json.
Run this once after training: python src/precompute.py
"""
import json
import sys
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent))

from portfolio_optimization import equal_weight_portfolio, load_and_prepare_data, mean_variance_portfolio


def compute_metrics(returns):
    returns = np.asarray(returns)
    returns = returns[~np.isnan(returns)]
    if len(returns) < 2:
        return {"total_return_pct": 0.0, "sharpe": 0.0, "volatility": 0.0, "max_drawdown": 0.0}
    cum = np.cumprod(1 + returns)
    total_return_pct = float((cum[-1] - 1) * 100)
    volatility = float(np.std(returns) * np.sqrt(252) * 100)
    sharpe = float(np.mean(returns) / (np.std(returns) + 1e-8) * np.sqrt(252))
    running_max = np.maximum.accumulate(cum)
    drawdowns = (cum / running_max) - 1
    max_drawdown = float(np.min(drawdowns) * 100)
    return {"total_return_pct": total_return_pct, "sharpe": sharpe, "volatility": volatility, "max_drawdown": max_drawdown}


def main():
    output_path = Path("results/comparison_cache.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print("Loading data...")
    returns_df = load_and_prepare_data("data/features.csv")

    print("Computing equal-weight...")
    eq = equal_weight_portfolio(returns_df)
    eq_metrics = compute_metrics(eq["returns"].values)
    print(f"  Done: Return={eq_metrics['total_return_pct']:.2f}%, Sharpe={eq_metrics['sharpe']:.4f}")

    print("Computing mean-variance (1-2 mins)...")
    mv = mean_variance_portfolio(returns_df, lookback=60)
    mv_metrics = compute_metrics(mv["returns"].values)
    print(f"  Done: Return={mv_metrics['total_return_pct']:.2f}%, Sharpe={mv_metrics['sharpe']:.4f}")

    print("Loading PPO results...")
    ppo_df = pd.read_csv("results/decision_log.csv")
    ppo_metrics = compute_metrics(ppo_df["portfolio_return"].values)
    print(f"  Done: Return={ppo_metrics['total_return_pct']:.2f}%, Sharpe={ppo_metrics['sharpe']:.4f}")

    cache = {
        "strategies": [
            {"name": "Equal Weight", **eq_metrics},
            {"name": "Mean Variance", **mv_metrics},
            {"name": "PPO Agent", **ppo_metrics},
        ],
        "computed_at": datetime.now().isoformat(),
    }

    with open(output_path, "w") as f:
        json.dump(cache, f, indent=2)

    print(f"\nSaved to {output_path}")
    print("\nFinal comparison:")
    for s in cache["strategies"]:
        print(f"  {s['name']}: Return={s['total_return_pct']:.2f}%, Sharpe={s['sharpe']:.2f}, Drawdown={s['max_drawdown']:.2f}%")


if __name__ == "__main__":
    main()
