"""
Decision logging layer for RL portfolio agent.
Logs: timestep | date | returns | volatility | ma_ratio | regime | w1..wN | reward | portfolio_return | capital | prev_capital | capital_change | action_norm
Stores history for get_decision_snapshot(timestep).
"""
import csv
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

import numpy as np


class DecisionLoggerError(Exception):
    """Raised when decision logging fails safety checks."""
    pass


@dataclass
class DecisionSnapshot:
    """Single decision record for inspection."""

    timestep: int
    date: str
    features: dict[str, float]  # volatility, returns, ma_ratio, regime
    state_vector: np.ndarray
    weights: np.ndarray
    prev_weights: np.ndarray
    weight_change: np.ndarray
    reward: float
    portfolio_return: float  # financial return (may differ from RL reward)
    capital: float
    prev_capital: float
    capital_change: float  # capital - prev_capital (for spike debugging)
    action_norm: float


def compute_state_features(obs: np.ndarray) -> dict[str, float]:
    """Derive interpretable features from raw observation (window x n_assets)."""
    flat = obs.flatten()
    vol = float(np.std(flat))
    ret = float(np.mean(obs[-1])) if obs.size > 0 else 0.0

    # MA ratio: short-term mean / long-term mean (proxy for momentum)
    if obs.shape[0] >= 5:
        short_ma = float(np.mean(obs[-5:]))
        long_ma = float(np.mean(obs))
        ma_ratio = short_ma / (long_ma + 1e-8)
    else:
        ma_ratio = 1.0

    regime = 1.0 if vol > np.percentile(np.abs(flat), 75) else 0.0
    return {"volatility": vol, "returns": ret, "ma_ratio": ma_ratio, "regime": regime}


class DecisionLogger:
    """Logs each RL decision and stores snapshots for explanation."""

    def __init__(self, output_path: str = "results/decision_log.csv", asset_names: Optional[list[str]] = None):
        self.output_path = Path(output_path)
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        self.asset_names = asset_names or []
        self._history: list[dict[str, Any]] = []
        self._header_written = False
        self._prev_weights: Optional[np.ndarray] = None
        self._prev_capital: float = 1.0
        self._expected_timestep: Optional[int] = None

    def log(
        self,
        timestep: int,
        date: str,
        obs: np.ndarray,
        action: np.ndarray,
        reward: float,
        capital: float,
    ) -> DecisionSnapshot:
        """Log one decision and append to history with safety checks."""
        # Safety check: no missing timesteps
        if self._expected_timestep is not None and timestep != self._expected_timestep:
            raise DecisionLoggerError(
                f"Missing timestep: expected {self._expected_timestep}, got {timestep}"
            )
        self._expected_timestep = timestep + 1

        features = compute_state_features(obs)

        # Action norm (L2 of raw action before normalization)
        raw_action = np.asarray(action)
        action_norm = float(np.linalg.norm(raw_action))

        # Normalize weights
        weights = raw_action / (np.sum(raw_action) + 1e-8)

        # Safety checks
        assert not np.isnan(capital), f"NaN capital at timestep {timestep}"
        assert not np.isnan(reward), f"NaN reward at timestep {timestep}"
        assert np.isclose(weights.sum(), 1.0, atol=1e-5), \
            f"Weights sum {weights.sum()} != 1.0 at timestep {timestep}"
        assert (weights >= 0).all(), \
            f"Negative weights {weights} at timestep {timestep}"
        assert not np.any(np.isnan(weights)), \
            f"NaN in weights at timestep {timestep}"
        assert not np.any(np.isnan(obs)), \
            f"NaN in observation at timestep {timestep}"

        prev = self._prev_weights if self._prev_weights is not None else np.zeros_like(weights)
        weight_change = weights - prev
        self._prev_weights = weights.copy()

        prev_capital = self._prev_capital
        self._prev_capital = capital

        # Derived metrics for debugging
        capital_change = capital - prev_capital
        portfolio_return = (capital / prev_capital - 1.0) if prev_capital > 0 else 0.0

        n = len(weights)
        row: dict[str, Any] = {
            "timestep": timestep,
            "date": date,
            "returns": features["returns"],
            "volatility": features["volatility"],
            "ma_ratio": features["ma_ratio"],
            "regime": features["regime"],
            "reward": reward,
            "portfolio_return": portfolio_return,
            "capital": capital,
            "prev_capital": prev_capital,
            "capital_change": capital_change,
            "action_norm": action_norm,
        }
        for i in range(n):
            row[f"w{i+1}"] = float(weights[i])

        self._history.append({
            "timestep": timestep,
            "date": date,
            "features": features,
            "obs": obs.copy(),
            "weights": weights.copy(),
            "prev_weights": prev.copy(),
            "weight_change": weight_change.copy(),
            "reward": reward,
            "portfolio_return": portfolio_return,
            "capital": capital,
            "prev_capital": prev_capital,
            "capital_change": capital_change,
            "action_norm": action_norm,
        })

        self._write_row(row, n)
        return DecisionSnapshot(
            timestep=timestep,
            date=date,
            features=features,
            state_vector=obs,
            weights=weights,
            prev_weights=prev,
            weight_change=weight_change,
            reward=reward,
            portfolio_return=portfolio_return,
            capital=capital,
            prev_capital=prev_capital,
            capital_change=capital_change,
            action_norm=action_norm,
        )

    def _write_row(self, row: dict, n_weights: int) -> None:
        """Append one row to CSV."""
        base_cols = ["timestep", "date", "returns", "volatility", "ma_ratio", "regime"]
        weight_cols = [f"w{i+1}" for i in range(n_weights)]
        end_cols = ["reward", "portfolio_return", "capital", "prev_capital", "capital_change", "action_norm"]
        cols = base_cols + weight_cols + end_cols
        with open(self.output_path, "a", newline="") as f:
            w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
            if not self._header_written:
                w.writeheader()
                self._header_written = True
            w.writerow({k: row.get(k, "") for k in cols})

    def get_decision_snapshot(self, timestep: int) -> Optional[DecisionSnapshot]:
        """Pause and inspect AI brain at this moment."""
        for h in self._history:
            if h["timestep"] == timestep:
                return DecisionSnapshot(
                    timestep=h["timestep"],
                    date=h["date"],
                    features=h["features"],
                    state_vector=h["obs"],
                    weights=h["weights"],
                    prev_weights=h["prev_weights"],
                    weight_change=h["weight_change"],
                    reward=h["reward"],
                    portfolio_return=h["portfolio_return"],
                    capital=h["capital"],
                    prev_capital=h["prev_capital"],
                    capital_change=h["capital_change"],
                    action_norm=h["action_norm"],
                )
        return None

    def get_all_snapshots(self) -> list[DecisionSnapshot]:
        """Return all stored snapshots."""
        return [
            DecisionSnapshot(
                timestep=h["timestep"],
                date=h["date"],
                features=h["features"],
                state_vector=h["obs"],
                weights=h["weights"],
                prev_weights=h["prev_weights"],
                weight_change=h["weight_change"],
                reward=h["reward"],
                portfolio_return=h["portfolio_return"],
                capital=h["capital"],
                prev_capital=h["prev_capital"],
                capital_change=h["capital_change"],
                action_norm=h["action_norm"],
            )
            for h in self._history
        ]

    def verify_log_integrity(self) -> dict[str, Any]:
        """Verify decision log can be read cleanly and has no issues."""
        import pandas as pd

        result = {"valid": True, "errors": [], "rows": 0, "nan_count": 0}

        try:
            df = pd.read_csv(self.output_path)
            result["rows"] = len(df)

            # Check for NaNs
            nan_count = df.isna().sum().sum()
            result["nan_count"] = int(nan_count)
            if nan_count > 0:
                result["errors"].append(f"Found {nan_count} NaN values")
                result["valid"] = False

            # Check for missing timesteps
            if "timestep" in df.columns:
                timesteps = df["timestep"].tolist()
                expected = list(range(timesteps[0], timesteps[-1] + 1))
                missing = set(expected) - set(timesteps)
                if missing:
                    result["errors"].append(f"Missing timesteps: {sorted(missing)}")
                    result["valid"] = False

            # Check weight columns sum to ~1
            w_cols = [c for c in df.columns if c.startswith("w")]
            if w_cols:
                weight_sums = df[w_cols].sum(axis=1)
                bad_sums = weight_sums[~np.isclose(weight_sums, 1.0, atol=1e-4)]
                if len(bad_sums) > 0:
                    result["errors"].append(f"Weight sums != 1.0 in {len(bad_sums)} rows")
                    result["valid"] = False

        except Exception as e:
            result["valid"] = False
            result["errors"].append(f"Failed to read CSV: {e}")

        return result
