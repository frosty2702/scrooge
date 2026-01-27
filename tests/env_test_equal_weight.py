"""
Test the trading environment with equal-weight actions and compare to baseline.
This script runs the environment with equal-weight portfolio allocation and compares
the results to the week-1 equal-weight baseline.
"""

import os
import sys
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import logging
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from trading_env import TradingEnv

# Set up logging
logging.basicConfig(
    filename='logs/equal_weight_test.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def run_equal_weight_strategy(env):
    """
    Run the environment with equal-weight portfolio allocation.
    
    Args:
        env: TradingEnv instance
        
    Returns:
        DataFrame with date and portfolio value
    """
    observation, _ = env.reset()
    done = False
    portfolio_values = [1.0]
    dates = []
    
    # Get the first date
    start_idx = env.current_step
    current_date = env.dates[start_idx]
    dates.append(current_date)
    
    while not done:
        # Equal weight across all assets
        n_assets = env.action_space.shape[0]
        action = np.ones(n_assets) / n_assets
        
        # Take step in environment
        observation, reward, done, _, info = env.step(action)
        
        # Store results
        portfolio_values.append(info['portfolio_value'])
        if not done:
            current_date = env.dates[env.current_step]
            dates.append(current_date)
    
    # Create DataFrame with results
    results = pd.DataFrame({
        'Date': dates,
        'PortfolioValue': portfolio_values[:-1]  # Remove last value as it doesn't have a date
    })
    
    return results

def create_baseline_equal_weight(data_file='data/features.csv'):
    """
    Create a baseline equal-weight strategy directly from the data.
    This simulates what would have been done in week 1.
    
    Args:
        data_file: Path to features CSV file
        
    Returns:
        DataFrame with date and portfolio value
    """
    # Read data
    data = pd.read_csv(data_file)
    data['Date'] = pd.to_datetime(data['Date'])
    
    # Pivot to get returns by date and asset
    returns = data.pivot(index='Date', columns='Asset', values='Return')
    
    # Calculate equal-weight portfolio returns
    n_assets = returns.shape[1]
    equal_weights = np.ones(n_assets) / n_assets
    portfolio_returns = returns.dot(equal_weights)
    
    # Calculate cumulative portfolio value
    portfolio_values = (1 + portfolio_returns).cumprod()
    
    # Create DataFrame with results
    results = pd.DataFrame({
        'Date': portfolio_values.index,
        'PortfolioValue': portfolio_values.values
    })
    
    return results

def compare_and_plot(env_results, baseline_results, save_path='results/env_equal_weight_vs_week1_equal_weight.png'):
    """
    Compare environment results with baseline and create plot.
    
    Args:
        env_results: DataFrame with environment results
        baseline_results: DataFrame with baseline results
        save_path: Path to save the plot
        
    Returns:
        Dictionary with comparison metrics
    """
    # Merge results on Date
    merged = pd.merge(
        env_results, 
        baseline_results, 
        on='Date', 
        suffixes=('_env', '_baseline')
    )
    
    # Calculate metrics
    correlation = merged['PortfolioValue_env'].corr(merged['PortfolioValue_baseline'])
    mean_abs_diff = np.mean(np.abs(merged['PortfolioValue_env'] - merged['PortfolioValue_baseline']))
    final_diff_pct = (
        (merged['PortfolioValue_env'].iloc[-1] - merged['PortfolioValue_baseline'].iloc[-1]) / 
        merged['PortfolioValue_baseline'].iloc[-1]
    ) * 100
    
    # Plot results
    plt.figure(figsize=(12, 6))
    plt.plot(merged['Date'], merged['PortfolioValue_env'], label='Environment Equal-Weight')
    plt.plot(merged['Date'], merged['PortfolioValue_baseline'], label='Week-1 Equal-Weight Baseline')
    plt.title('Equal-Weight Strategy: Environment vs. Week-1 Baseline')
    plt.xlabel('Date')
    plt.ylabel('Portfolio Value')
    plt.legend()
    plt.grid(True)
    
    # Add metrics to plot
    plt.figtext(0.15, 0.15, f"Correlation: {correlation:.4f}", fontsize=10)
    plt.figtext(0.15, 0.12, f"Mean Abs Diff: {mean_abs_diff:.4f}", fontsize=10)
    plt.figtext(0.15, 0.09, f"Final Diff: {final_diff_pct:.2f}%", fontsize=10)
    
    # Save plot
    plt.savefig(save_path)
    logging.info(f"Plot saved to {save_path}")
    
    # Log metrics
    logging.info(f"Correlation: {correlation:.4f}")
    logging.info(f"Mean Absolute Difference: {mean_abs_diff:.4f}")
    logging.info(f"Final Value Difference: {final_diff_pct:.2f}%")
    
    # Create validation result
    with open('results/validation_result.txt', 'w') as f:
        if correlation > 0.99 and abs(final_diff_pct) < 1.0:
            f.write("Equal-weight environment behavior CONSISTENT with baseline")
            logging.info("VALIDATION PASSED: Environment consistent with baseline")
        else:
            f.write("Equal-weight environment behavior INCONSISTENT with baseline")
            logging.error("VALIDATION FAILED: Environment inconsistent with baseline")
    
    return {
        'correlation': correlation,
        'mean_abs_diff': mean_abs_diff,
        'final_diff_pct': final_diff_pct
    }

if __name__ == "__main__":
    # Create directories if they don't exist
    os.makedirs('logs', exist_ok=True)
    os.makedirs('results', exist_ok=True)
    
    # Initialize environment
    env = TradingEnv()
    
    # Run equal-weight strategy in environment
    logging.info("Running equal-weight strategy in environment")
    env_results = run_equal_weight_strategy(env)
    
    # Create baseline equal-weight strategy
    logging.info("Creating baseline equal-weight strategy")
    baseline_results = create_baseline_equal_weight()
    
    # Compare and plot results
    logging.info("Comparing results")
    metrics = compare_and_plot(env_results, baseline_results)
    
    # Print final assessment
    if metrics['correlation'] > 0.99 and abs(metrics['final_diff_pct']) < 1.0:
        print("✅ PASSED: Environment equal-weight behavior consistent with baseline")
    else:
        print("❌ FAILED: Environment equal-weight behavior inconsistent with baseline")
        print(f"- Correlation: {metrics['correlation']:.4f} (should be > 0.99)")
        print(f"- Final difference: {metrics['final_diff_pct']:.2f}% (should be < 1.0%)")