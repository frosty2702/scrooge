"""
Compute Equal Weight and Mean Variance returns for the same period
as the most recent PPO simulation, for a fair apples-to-apples comparison.
Run from scrooge root: python compare_simulation.py
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent / "scripts"))

from scripts.portfolio_optimization import equal_weight_portfolio, load_and_prepare_data, mean_variance_portfolio


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
    # Filter to exact simulation period from the app screenshot
    START = "2011-04-20"
    END = "2012-07-27"

    ppo_df = pd.read_csv("results/decision_log.csv")
    ppo_df["date"] = pd.to_datetime(ppo_df["date"])
    ppo_df = ppo_df[(ppo_df["date"] >= START) & (ppo_df["date"] <= END)]
    start_date = pd.Timestamp(START)
    end_date = pd.Timestamp(END)
    print(f"PPO simulation period: {start_date.date()} → {end_date.date()} ({len(ppo_df)} days)")

    # Compute PPO metrics
    ppo_metrics = compute_metrics(ppo_df["portfolio_return"].values)
    print(f"PPO Agent: Return={ppo_metrics['total_return_pct']:.2f}%, Sharpe={ppo_metrics['sharpe']:.4f}, Drawdown={ppo_metrics['max_drawdown']:.2f}%")

    # Load full market data and filter to same period
    returns_df = load_and_prepare_data("data/features.csv")
    returns_df = returns_df[(returns_df.index >= start_date) & (returns_df.index <= end_date)]
    print(f"Market data filtered to {len(returns_df)} trading days")

    # Equal Weight over same period
    print("\nComputing Equal Weight...")
    eq = equal_weight_portfolio(returns_df)
    eq_metrics = compute_metrics(eq["returns"].values)
    print(f"Equal Weight: Return={eq_metrics['total_return_pct']:.2f}%, Sharpe={eq_metrics['sharpe']:.4f}, Drawdown={eq_metrics['max_drawdown']:.2f}%")

    # Mean Variance over same period
    print("\nComputing Mean Variance...")
    mv = mean_variance_portfolio(returns_df, lookback=60)
    mv_metrics = compute_metrics(mv["returns"].values)
    print(f"Mean Variance: Return={mv_metrics['total_return_pct']:.2f}%, Sharpe={mv_metrics['sharpe']:.4f}, Drawdown={mv_metrics['max_drawdown']:.2f}%")

    # Print final comparison table
    print("\n" + "="*65)
    print(f"{'Strategy':<20} {'Return':>10} {'Sharpe':>10} {'Drawdown':>12}")
    print("="*65)
    for name, m in [("Equal Weight", eq_metrics), ("Mean Variance", mv_metrics), ("PPO Agent", ppo_metrics)]:
        print(f"{name:<20} {m['total_return_pct']:>9.2f}% {m['sharpe']:>10.4f} {m['max_drawdown']:>11.2f}%")
    print("="*65)

    # Save to file
    result = {
        "period": {"start": str(start_date.date()), "end": str(end_date.date()), "days": len(ppo_df)},
        "strategies": [
            {"name": "Equal Weight", **eq_metrics},
            {"name": "Mean Variance", **mv_metrics},
            {"name": "PPO Agent", **ppo_metrics},
        ]
    }
    with open("results/simulation_comparison.json", "w") as f:
        json.dump(result, f, indent=2)
    print("\nSaved to results/simulation_comparison.json")


if __name__ == "__main__":
    main()
