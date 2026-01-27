"""
Debug hooks for the trading environment.
This script adds logging and debug hooks to the environment.
"""

import os
import sys
import numpy as np
import pandas as pd
import logging
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from trading_env import TradingEnv

class DebugTradingEnv(TradingEnv):
    """Trading environment with debug hooks and logging."""
    
    def __init__(self, csv_file="data/features.csv", window_size=20, log_file="logs/env_debug.log"):
        """Initialize the environment with logging."""
        super().__init__(csv_file, window_size)
        
        # Set up logging
        self.logger = logging.getLogger("DebugTradingEnv")
        self.logger.setLevel(logging.INFO)
        
        # Create file handler
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.INFO)
        
        # Create formatter
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(formatter)
        
        # Add handler to logger
        self.logger.addHandler(file_handler)
        
        # Initialize debug metrics
        self.debug_metrics = {
            'portfolio_values': [],
            'rewards': [],
            'actions': [],
            'dates': [],
            'max_weight': [],
            'min_weight': [],
            'weight_concentration': [],
            'drawdowns': []
        }
        
        self.logger.info(f"Initialized DebugTradingEnv with {self.n_assets} assets")
        self.logger.info(f"Data range: {self.dates[0]} to {self.dates[-1]}")
    
    def reset(self, seed=None, options=None):
        """Reset the environment with logging."""
        observation, info = super().reset(seed, options)
        
        # Reset debug metrics
        self.debug_metrics = {
            'portfolio_values': [1.0],
            'rewards': [],
            'actions': [],
            'dates': [self.dates[self.current_step]],
            'max_weight': [],
            'min_weight': [],
            'weight_concentration': [],
            'drawdowns': [0.0]
        }
        
        self.logger.info(f"Reset environment at step {self.current_step}, date {self.dates[self.current_step]}")
        
        return observation, info
    
    def step(self, action):
        """Step the environment with logging and debug checks."""
        # Check action before step
        self._check_action(action)
        
        # Take step
        observation, reward, done, truncated, info = super().step(action)
        
        # Log and debug
        self._log_step(action, reward, info)
        self._update_debug_metrics(action, reward, info)
        
        return observation, reward, done, truncated, info
    
    def _check_action(self, action):
        """Check action for potential issues."""
        action = np.array(action)
        
        # Check for NaN or inf
        if not np.all(np.isfinite(action)):
            self.logger.error(f"Non-finite action detected: {action}")
        
        # Check for negative weights
        if np.any(action < 0):
            self.logger.warning(f"Negative weights detected: {action}")
        
        # Check for extreme concentration
        normalized_action = action / (np.sum(action) + 1e-8)
        max_weight = np.max(normalized_action)
        if max_weight > 0.95:
            self.logger.warning(f"Extreme weight concentration detected: {max_weight:.4f}")
    
    def _log_step(self, action, reward, info):
        """Log step information."""
        current_date = self.dates[self.current_step - 1]  # Date for the step just taken
        portfolio_value = info['portfolio_value']
        
        # Normalize action
        action = np.array(action)
        normalized_action = action / (np.sum(action) + 1e-8)
        
        # Log basic info
        self.logger.info(f"Date: {current_date}, Portfolio Value: {portfolio_value:.4f}, Reward: {reward:.4f}")
        self.logger.info(f"Weights: {', '.join([f'{w:.4f}' for w in normalized_action])}")
        
        # Check for issues
        if not np.isfinite(reward):
            self.logger.error(f"Non-finite reward detected: {reward}")
        
        if portfolio_value <= 0:
            self.logger.error(f"Negative or zero portfolio value: {portfolio_value}")
        
        # Check for large jumps
        if len(self.debug_metrics['portfolio_values']) > 0:
            prev_value = self.debug_metrics['portfolio_values'][-1]
            if portfolio_value > prev_value * 1.5:
                self.logger.warning(f"Large portfolio jump: {prev_value:.4f} -> {portfolio_value:.4f}")
    
    def _update_debug_metrics(self, action, reward, info):
        """Update debug metrics."""
        current_date = self.dates[self.current_step - 1]  # Date for the step just taken
        portfolio_value = info['portfolio_value']
        
        # Normalize action
        action = np.array(action)
        normalized_action = action / (np.sum(action) + 1e-8)
        
        # Calculate weight concentration (Herfindahl index)
        concentration = np.sum(normalized_action**2)
        
        # Calculate drawdown
        peak = max(self.debug_metrics['portfolio_values'])
        drawdown = (portfolio_value / peak) - 1
        
        # Update metrics
        self.debug_metrics['portfolio_values'].append(portfolio_value)
        self.debug_metrics['rewards'].append(reward)
        self.debug_metrics['actions'].append(normalized_action)
        self.debug_metrics['dates'].append(current_date)
        self.debug_metrics['max_weight'].append(np.max(normalized_action))
        self.debug_metrics['min_weight'].append(np.min(normalized_action))
        self.debug_metrics['weight_concentration'].append(concentration)
        self.debug_metrics['drawdowns'].append(drawdown)

def run_debug_session(n_steps=100, random_actions=True):
    """Run a debug session with the environment."""
    # Create environment
    env = DebugTradingEnv()
    
    # Reset environment
    observation, _ = env.reset()
    
    # Run steps
    for _ in range(n_steps):
        if random_actions:
            # Random action
            action = np.random.random(env.action_space.shape)
        else:
            # Equal-weight action
            action = np.ones(env.action_space.shape) / env.action_space.shape[0]
        
        # Take step
        observation, reward, done, _, _ = env.step(action)
        
        if done:
            break
    
    # Return debug metrics
    return env.debug_metrics

if __name__ == "__main__":
    # Create directories
    os.makedirs('logs', exist_ok=True)
    
    # Run debug session with random actions
    print("Running debug session with random actions...")
    metrics_random = run_debug_session(n_steps=100, random_actions=True)
    
    # Run debug session with equal-weight actions
    print("Running debug session with equal-weight actions...")
    metrics_equal = run_debug_session(n_steps=100, random_actions=False)
    
    print("Debug sessions completed. See logs/env_debug.log for details.")