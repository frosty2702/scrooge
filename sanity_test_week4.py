#!/usr/bin/env python3
"""
Week 4 Sanity Test.
Checks: decisions logged every step, weights change over time,
explanation chart renders, full simulation runs without crash.
"""
from pathlib import Path

import pandas as pd

from run_autonomous_demo import run_autonomous_demo


def sanity_test():
    run_autonomous_demo()

    log_path = Path("results/decision_log.csv")
    assert log_path.exists(), "Decision log not found"
    df = pd.read_csv(log_path)

    assert len(df) > 0, "No decisions logged"
    assert "w1" in df.columns and "reward" in df.columns and "capital" in df.columns

    weight_cols = [c for c in df.columns if c.startswith("w")]
    weight_std = df[weight_cols].std()
    assert weight_std.sum() > 0, "Weights do not change over time"

    feat_path = Path("results/feature_importance.png")
    assert feat_path.exists(), "Feature importance chart not rendered"

    expl_path = Path("results/explanation_data.txt")
    assert expl_path.exists(), "Explanation data not found"

    cap_path = Path("plots/rl_portfolio_value.png")
    assert cap_path.exists(), "Capital curve not saved"

    print("\n[PASS] All sanity checks passed:")
    print(f"  - Decisions logged: {len(df)} steps")
    print(f"  - Weights vary over time")
    print(f"  - Explanation chart: {feat_path}")
    print(f"  - Full simulation completed without crash")


if __name__ == "__main__":
    sanity_test()
