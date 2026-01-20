import gymnasium as gym
from gymnasium import spaces
import numpy as np
import pandas as pd

class TradingEnv(gym.Env):
    """
    Custom trading environment for RL.
    State = last 20 days of returns for 5 assets
    Action = portfolio weights for 5 assets
    Reward = next-day portfolio return
    """
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

        # Action = weights for each asset
        self.action_space = spaces.Box(low=0, high=1, shape=(self.n_assets,), dtype=np.float32)

        # State = last window_size returns for all assets
        self.observation_space = spaces.Box(low=-np.inf, high=np.inf, shape=(window_size, self.n_assets), dtype=np.float32)

        # Portfolio value
        self.portfolio_value = 1.0

    def reset(self, seed=None, options=None):
        self.current_step = self.window_size
        self.portfolio_value = 1.0
        return self._get_observation(), {}

    def _get_observation(self):
        return self.returns.iloc[self.current_step - self.window_size:self.current_step].values.astype(np.float32)

    def step(self, action):
        action = np.array(action)
        # normalize weights to sum to 1
        action = action / (np.sum(action) + 1e-8)

        # next day returns
        ret = self.returns.iloc[self.current_step].values
        # portfolio return
        portfolio_return = np.dot(action, ret)
        self.portfolio_value *= (1 + portfolio_return)

        reward = portfolio_return
        self.current_step += 1
        done = self.current_step >= len(self.returns)

        return self._get_observation(), reward, done, False, {"portfolio_value": self.portfolio_value}

    def render(self):
        print(f"Step: {self.current_step}, Portfolio Value: {self.portfolio_value:.4f}")
