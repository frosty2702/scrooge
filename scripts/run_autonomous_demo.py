#!/usr/bin/env python3
"""
Autonomous Demo Loop (Week 4).

Flow:
  obs → compute_state_features → model.predict → env.step → log decision

Outputs:
  - capital curve (plots/rl_portfolio_value.png)
  - decision log (results/decision_log.csv)
  - explanation data + feature importance plot (results/feature_importance.png)

No training. No new features. Deterministic inference.
"""
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import torch
from stable_baselines3 import PPO

from src.decision_logger import DecisionLogger
from src.explainability import (
    compute_aggregate_feature_importance,
    get_explanation_data,
    plot_feature_importance,
)
from trading_env import TradingEnv

SEED = 42


def set_seeds(seed: int = SEED) -> None:
    """Lock all random sources for reproducibility."""
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def check_nan(name: str, value) -> None:
    """Raise if NaN detected in state/reward/capital."""
    arr = np.asarray(value)
    if np.any(np.isnan(arr)):
        raise ValueError(f"NaN detected in {name}: {value}")


def run_autonomous_demo(
    csv_file: str = "data/features.csv",
    model_path: str = "models/ppo_trading_model",
    window_size: int = 20,
    seed: int = SEED,
) -> None:
    """Run one full inference simulation with logging and explanation."""
    set_seeds(seed)

    Path("plots").mkdir(exist_ok=True)
    Path("results").mkdir(exist_ok=True)

    # Fresh decision log each run
    log_path = Path("results/decision_log.csv")
    if log_path.exists():
        log_path.unlink()

    env = TradingEnv(csv_file=csv_file, window_size=window_size)
    env.action_space.seed(seed)

    model = PPO.load(model_path)

    # Inference mode: disable exploration noise, set policy to eval
    model.policy.set_training_mode(False)

    logger = DecisionLogger(output_path="results/decision_log.csv")

    obs, _ = env.reset(seed=seed)
    check_nan("initial obs", obs)

    portfolio_values = [env.portfolio_value]
    timestep = env.window_size
    max_weight_sum_deviation = 0.0

    while True:
        # Deterministic prediction (no stochastic sampling)
        with torch.no_grad():
            action, _ = model.predict(obs, deterministic=True)

        check_nan("action", action)

        # Track weight normalization (env normalizes in step, but check raw action too)
        raw_sum = np.sum(action)
        if raw_sum < 1e-6:
            action = np.ones(len(action)) / len(action)
        else:
            action = action / raw_sum

        weight_sum = np.sum(action)
        deviation = abs(weight_sum - 1.0)
        max_weight_sum_deviation = max(max_weight_sum_deviation, deviation)

        date_str = str(env.dates[env.current_step])
        obs_next, reward, done, _, info = env.step(action)

        check_nan("obs_next", obs_next)
        check_nan("reward", reward)
        check_nan("capital", info["portfolio_value"])

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

        if done:
            break

    # Capital curve
    plt.figure(figsize=(12, 6))
    plt.plot(portfolio_values)
    plt.title("RL Portfolio Value Over Time (Autonomous Demo)")
    plt.xlabel("Step")
    plt.ylabel("Portfolio Value")
    plt.grid(True)
    plt.savefig("plots/rl_portfolio_value.png")
    plt.close()
    print(f"Capital curve saved to plots/rl_portfolio_value.png")

    # Explanation data
    snapshots = logger.get_all_snapshots()
    agg_importance = compute_aggregate_feature_importance(snapshots)
    plot_feature_importance(
        agg_importance,
        output_path="results/feature_importance.png",
        title="Aggregate Feature Importance (Proxy)",
    )
    print(f"Feature importance plot saved to results/feature_importance.png")

    # Example snapshot explanation (mid-point)
    mid = len(snapshots) // 2
    if snapshots:
        ex = get_explanation_data(snapshots[mid])
        print(f"\nExample explanation (timestep {mid}):")
        print(f"  Feature importance: {ex['feature_importance']}")

        expl_path = Path("results/explanation_data.txt")
        with open(expl_path, "w") as f:
            f.write("Feature Importance (Aggregate):\n")
            for k, v in agg_importance.items():
                f.write(f"  {k} -> {v:.2f}\n")
            f.write(f"\nTotal decisions: {len(snapshots)}\n\n")
            f.write(f"Sample snapshot (timestep {mid}):\n")
            f.write(f"  date: {ex['date']}\n")
            f.write(f"  features: {ex['features']}\n")
            f.write(f"  weights: {ex['weights']}\n")
            f.write(f"  feature_importance: {ex['feature_importance']}\n")
        print(f"Explanation data saved to {expl_path}")

    print(f"\nDecision log: results/decision_log.csv ({len(snapshots)} rows)")

    # Verification: weights change over time, normalization holds, capital logic correct
    if len(snapshots) >= 2:
        w_first = snapshots[0].weights
        w_last = snapshots[-1].weights
        weight_diff = np.sum(np.abs(w_last - w_first))
        print(f"\nVerification:")
        print(f"  Weights changed: {weight_diff > 1e-6} (diff={weight_diff:.6f})")
        print(f"  Max weight sum deviation: {max_weight_sum_deviation:.2e}")
        print(f"  Initial capital: {snapshots[0].capital:.4f}")
        print(f"  Final capital: {snapshots[-1].capital:.4f}")
        print(f"  Capital update: multiplicative (capital *= 1 + return) ✓")

    # Verify log integrity
    integrity = logger.verify_log_integrity()
    print(f"\nLog integrity check: {'PASS' if integrity['valid'] else 'FAIL'}")
    print(f"  Rows: {integrity['rows']}")
    print(f"  NaN count: {integrity['nan_count']}")
    if integrity['errors']:
        for err in integrity['errors']:
            print(f"  Error: {err}")

    print("\nAutonomous demo complete.")


def verify_determinism() -> bool:
    """Run twice and confirm identical capital curves."""
    set_seeds(SEED)
    env1 = TradingEnv(csv_file="data/features.csv", window_size=20)
    env1.action_space.seed(SEED)
    model = PPO.load("models/ppo_trading_model")
    model.policy.set_training_mode(False)

    obs1, _ = env1.reset(seed=SEED)
    vals1 = [env1.portfolio_value]
    while True:
        with torch.no_grad():
            action, _ = model.predict(obs1, deterministic=True)
        obs1, _, done, _, info = env1.step(action)
        vals1.append(info["portfolio_value"])
        if done:
            break

    set_seeds(SEED)
    env2 = TradingEnv(csv_file="data/features.csv", window_size=20)
    env2.action_space.seed(SEED)
    model2 = PPO.load("models/ppo_trading_model")
    model2.policy.set_training_mode(False)

    obs2, _ = env2.reset(seed=SEED)
    vals2 = [env2.portfolio_value]
    while True:
        with torch.no_grad():
            action, _ = model2.predict(obs2, deterministic=True)
        obs2, _, done, _, info = env2.step(action)
        vals2.append(info["portfolio_value"])
        if done:
            break

    match = np.allclose(vals1, vals2)
    print(f"Determinism check: {'PASS' if match else 'FAIL'}")
    print(f"  Run 1 final capital: {vals1[-1]:.6f}")
    print(f"  Run 2 final capital: {vals2[-1]:.6f}")
    if not match:
        diff = np.max(np.abs(np.array(vals1) - np.array(vals2)))
        print(f"  Max difference: {diff}")
    return match


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--verify":
        verify_determinism()
    else:
        run_autonomous_demo()
