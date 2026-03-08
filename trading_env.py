import gymnasium as gym
from gymnasium import spaces
import numpy as np
import pandas as pd

class TradingEnv(gym.Env):
    metadata = {"render.modes": ["human"]}

    def __init__(self, csv_file="data/features.csv", window_size=20):
        super(TradingEnv, self).__init__()
        self.data = pd.read_csv(csv_file)
        self.data['Date'] = pd.to_datetime(self.data['Date'])
        self.returns = self.data.pivot(index='Date', columns='Asset', values='Return')
        self.dates = self.returns.index
        self.n_assets = self.returns.shape[1]
        self.window_size = window_size
        self.current_step = window_size

        self.action_space = spaces.Box(low=0, high=1, shape=(self.n_assets,), dtype=np.float32)
        self.observation_space = spaces.Box(low=-np.inf, high=np.inf, shape=(window_size, self.n_assets), dtype=np.float32)

        self.portfolio_value = 1.0
        self.prev_weights = np.ones(self.n_assets) / self.n_assets

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)  # sets self.np_random for Gymnasium compliance
        self.current_step = self.window_size
        self.portfolio_value = 1.0
        self.prev_weights = np.ones(self.n_assets) / self.n_assets
        return self._get_observation(), {}

    def _get_observation(self):
        return self.returns.iloc[self.current_step - self.window_size:self.current_step].values.astype(np.float32)

    def step(self, action):
        action = np.array(action)
        action = np.clip(action, 0, 1)
        action_sum = np.sum(action)

        # Force uniform weights if action collapses to zero
        if action_sum < 1e-6:
            action = np.ones(self.n_assets) / self.n_assets
        else:
            action = action / action_sum

        # Cap any single asset at 60%
        action = np.clip(action, 0, 0.6)
        action = action / (np.sum(action) + 1e-8)

        ret = self.returns.iloc[self.current_step].values
        portfolio_return = np.dot(action, ret)

        # Risk-adjusted reward (Sharpe-like)
        recent_returns = self.returns.iloc[max(0, self.current_step - 20) : self.current_step]
        weights_matrix = np.tile(action, (len(recent_returns), 1))
        portfolio_hist = (recent_returns.values * weights_matrix).sum(axis=1)
        mean_r = np.mean(portfolio_hist)
        std_r = np.std(portfolio_hist) + 1e-8
        # Diversification entropy bonus
        weights_entropy = -np.sum(action * np.log(action + 1e-8))
        max_entropy = np.log(self.n_assets)
        diversification_bonus = weights_entropy / max_entropy

        reward = (mean_r / std_r) * np.sqrt(252) + 0.5 * portfolio_return + 0.3 * diversification_bonus

        transaction_cost = 0.001 * np.sum(np.abs(action - self.prev_weights))
        self.portfolio_value *= (1 + portfolio_return - transaction_cost)
        self.prev_weights = action.copy()
        self.current_step += 1
        done = self.current_step >= len(self.returns)

        return self._get_observation(), reward, done, False, {"portfolio_value": self.portfolio_value}

    def render(self):
        print(f"Step: {self.current_step}, Portfolio Value: {self.portfolio_value:.4f}")