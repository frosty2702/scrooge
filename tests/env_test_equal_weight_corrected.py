import os
import sys
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import logging
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from trading_env_corrected import TradingEnv

logging.basicConfig(
    filename='logs/equal_weight_test_corrected.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def run_equal_weight_strategy(env):
    observation, _ = env.reset()
    done = False
    
    start_idx = env.current_step
    
    while not done:
        n_assets = env.action_space.shape[0]
        action = np.ones(n_assets) / n_assets
        
        observation, reward, done, _, info = env.step(action)
    
    portfolio_values = env.portfolio_values
    dates = [env.dates[i] for i in range(env.window_size, env.current_step)]
    
    results = pd.DataFrame({
        'Date': dates,
        'PortfolioValue': portfolio_values[:-1]
    })
    
    return results

def create_baseline_equal_weight(env):
    return env.get_equal_weight_baseline()

def compare_and_plot(env_results, baseline_results, save_path='results/env_equal_weight_vs_week1_equal_weight_corrected.png'):
    merged = pd.merge(
        env_results, 
        baseline_results, 
        on='Date', 
        suffixes=('_env', '_baseline')
    )
    
    correlation = merged['PortfolioValue_env'].corr(merged['PortfolioValue_baseline'])
    mean_abs_diff = np.mean(np.abs(merged['PortfolioValue_env'] - merged['PortfolioValue_baseline']))
    final_diff_pct = (
        (merged['PortfolioValue_env'].iloc[-1] - merged['PortfolioValue_baseline'].iloc[-1]) / 
        merged['PortfolioValue_baseline'].iloc[-1]
    ) * 100
    
    plt.figure(figsize=(12, 6))
    plt.plot(merged['Date'], merged['PortfolioValue_env'], label='Environment Equal-Weight')
    plt.plot(merged['Date'], merged['PortfolioValue_baseline'], label='Week-1 Equal-Weight Baseline')
    plt.title('Equal-Weight Strategy: Environment vs. Week-1 Baseline')
    plt.xlabel('Date')
    plt.ylabel('Portfolio Value')
    plt.legend()
    plt.grid(True)
    
    plt.figtext(0.15, 0.15, f"Correlation: {correlation:.4f}", fontsize=10)
    plt.figtext(0.15, 0.12, f"Mean Abs Diff: {mean_abs_diff:.4f}", fontsize=10)
    plt.figtext(0.15, 0.09, f"Final Diff: {final_diff_pct:.2f}%", fontsize=10)
    
    plt.savefig(save_path)
    logging.info(f"Plot saved to {save_path}")
    
    logging.info(f"Correlation: {correlation:.4f}")
    logging.info(f"Mean Absolute Difference: {mean_abs_diff:.4f}")
    logging.info(f"Final Value Difference: {final_diff_pct:.2f}%")
    
    with open('results/validation_result_corrected.txt', 'w') as f:
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
    os.makedirs('logs', exist_ok=True)
    os.makedirs('results', exist_ok=True)
    
    env = TradingEnv()
    
    logging.info("Running equal-weight strategy in environment")
    env_results = run_equal_weight_strategy(env)
    
    logging.info("Creating baseline equal-weight strategy")
    baseline_results = create_baseline_equal_weight(env)
    
    logging.info("Comparing results")
    metrics = compare_and_plot(env_results, baseline_results)
    
    if metrics['correlation'] > 0.99 and abs(metrics['final_diff_pct']) < 1.0:
        print("✅ PASSED: Environment equal-weight behavior consistent with baseline")
    else:
        print("❌ FAILED: Environment equal-weight behavior inconsistent with baseline")
        print(f"- Correlation: {metrics['correlation']:.4f} (should be > 0.99)")
        print(f"- Final difference: {metrics['final_diff_pct']:.2f}% (should be < 1.0%)")