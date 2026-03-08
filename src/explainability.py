"""
Lightweight explainability for RL portfolio decisions.
Perturbation-based feature importance: remove each feature's signal and measure weight change.
"""
from pathlib import Path
from typing import Optional

import matplotlib.pyplot as plt
import numpy as np

from src.decision_logger import DecisionSnapshot, compute_state_features


def _obs_to_weights(obs: np.ndarray) -> np.ndarray:
    """Deterministic mapping from observation to portfolio weights (same normalization used for baseline)."""
    last_row = obs[-1]
    shifted = np.maximum(last_row, 0) + 0.01
    s = np.sum(shifted)
    return shifted / s if s > 0 else np.ones(len(obs[-1])) / len(obs[-1])


def compute_feature_importance(snapshot: DecisionSnapshot) -> dict[str, float]:
    """Perturbation-based: remove each feature's signal, measure L1 weight change, normalize."""
    obs = snapshot.state_vector
    baseline_weights = _obs_to_weights(obs)

    def importance(perturbed: np.ndarray) -> float:
        perturbed_weights = _obs_to_weights(perturbed)
        return float(np.sum(np.abs(baseline_weights - perturbed_weights)))

    # Perturbations that remove each feature's signal
    col_means = np.mean(obs, axis=0, keepdims=True)

    # volatility: replace each column with its mean (removes variance)
    obs_vol = np.tile(col_means, (obs.shape[0], 1))

    # returns: last row zeros (removes most recent return signal)
    obs_ret = obs.copy()
    obs_ret[-1] = 0.0

    # ma_ratio: all rows equal column mean (removes momentum/trend)
    obs_ma = np.tile(col_means, (obs.shape[0], 1))

    # regime: clip to ±1 std per column (removes extreme regime signals)
    col_std = np.std(obs, axis=0, keepdims=True) + 1e-8
    obs_regime = np.clip(obs, -col_std, col_std)

    raw = np.array([
        importance(obs_vol),
        importance(obs_ret),
        importance(obs_ma),
        importance(obs_regime),
    ])
    total = np.sum(raw) + 1e-8
    contrib = raw / total

    return {
        "volatility": float(contrib[0]),
        "returns": float(contrib[1]),
        "ma_ratio": float(contrib[2]),
        "regime": float(contrib[3]),
    }


def compute_aggregate_feature_importance(snapshots: list[DecisionSnapshot]) -> dict[str, float]:
    """Average feature importance across many decisions."""
    if not snapshots:
        return {}
    all_imp = [compute_feature_importance(s) for s in snapshots]
    keys = all_imp[0].keys()
    return {k: float(np.mean([d[k] for d in all_imp])) for k in keys}


def plot_feature_importance(
    importance: dict[str, float],
    output_path: str = "results/feature_importance.png",
    title: str = "Feature Importance",
) -> None:
    """Simple bar plot of feature importance."""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    names = list(importance.keys())
    values = list(importance.values())
    colors = ["#2ecc71", "#3498db", "#e74c3c", "#9b59b6"]
    plt.figure(figsize=(8, 4))
    bars = plt.bar(names, values, color=colors[: len(names)])
    plt.title(title)
    plt.ylabel("Importance")
    plt.ylim(0, 1)
    for b, v in zip(bars, values):
        plt.text(b.get_x() + b.get_width() / 2, v + 0.02, f"{v:.2f}", ha="center", fontsize=10)
    plt.tight_layout()
    plt.savefig(output_path, dpi=100)
    plt.close()


def get_explanation_data(snapshot: DecisionSnapshot) -> dict:
    """
    Return explanation data for a single decision (for UI / API).
    """
    imp = compute_feature_importance(snapshot)
    return {
        "timestep": snapshot.timestep,
        "date": snapshot.date,
        "features": snapshot.features,
        "weights": snapshot.weights.tolist(),
        "weight_change": snapshot.weight_change.tolist(),
        "reward": snapshot.reward,
        "portfolio_return": snapshot.portfolio_return,
        "capital": snapshot.capital,
        "prev_capital": snapshot.prev_capital,
        "capital_change": snapshot.capital_change,
        "action_norm": snapshot.action_norm,
        "feature_importance": imp,
    }
