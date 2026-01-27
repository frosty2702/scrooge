"""
Test the trading environment with random actions.
This script runs multiple episodes with random actions and logs the results.
"""

import os
import sys
import numpy as np
import matplotlib.pyplot as plt
import logging
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from trading_env import TradingEnv

# Set up logging
logging.basicConfig(
    filename='logs/random_action_test.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def test_random_actions(n_episodes=5, max_steps=None):
    """
    Test the environment with random actions for multiple episodes.
    
    Args:
        n_episodes: Number of episodes to run
        max_steps: Maximum steps per episode (None for full episode)
    
    Returns:
        Dictionary with test results
    """
    env = TradingEnv()
    results = {
        'portfolio_values': [],
        'rewards': [],
        'actions': []
    }
    
    for episode in range(n_episodes):
        logging.info(f"Starting episode {episode+1}/{n_episodes}")
        observation, _ = env.reset()
        done = False
        step = 0
        episode_portfolio_values = [1.0]  # Start with initial portfolio value
        episode_rewards = []
        episode_actions = []
        
        while not done:
            # Generate random action (portfolio weights)
            action = np.random.random(env.action_space.shape)
            action = action / np.sum(action)  # Normalize to sum to 1
            
            # Take step in environment
            observation, reward, done, _, info = env.step(action)
            
            # Log information
            portfolio_value = info['portfolio_value']
            episode_portfolio_values.append(portfolio_value)
            episode_rewards.append(reward)
            episode_actions.append(action)
            
            # Check for abnormalities
            if portfolio_value <= 0:
                logging.error(f"Negative portfolio value detected: {portfolio_value}")
            if portfolio_value > episode_portfolio_values[-2] * 10:
                logging.warning(f"Large portfolio jump: {episode_portfolio_values[-2]} -> {portfolio_value}")
            if not np.isfinite(reward):
                logging.error(f"Non-finite reward detected: {reward}")
            
            step += 1
            if max_steps and step >= max_steps:
                break
                
        # Log episode summary
        final_value = episode_portfolio_values[-1]
        logging.info(f"Episode {episode+1} completed: {step} steps, final portfolio value: {final_value:.4f}")
        
        # Store episode results
        results['portfolio_values'].append(episode_portfolio_values)
        results['rewards'].append(episode_rewards)
        results['actions'].append(episode_actions)
    
    return results

def plot_results(results, save_path='results/random_action_test_plot.png'):
    """Plot portfolio values over time for all episodes"""
    plt.figure(figsize=(10, 6))
    
    for i, portfolio_values in enumerate(results['portfolio_values']):
        plt.plot(portfolio_values, label=f'Episode {i+1}')
    
    plt.title('Portfolio Value vs. Time (Random Actions)')
    plt.xlabel('Time Step')
    plt.ylabel('Portfolio Value')
    plt.legend()
    plt.grid(True)
    
    # Save plot
    plt.savefig(save_path)
    logging.info(f"Plot saved to {save_path}")
    
    # Check for any issues in the results
    all_values = np.concatenate([np.array(pv) for pv in results['portfolio_values']])
    min_value = np.min(all_values)
    max_value = np.max(all_values)
    
    summary = {
        'min_value': min_value,
        'max_value': max_value,
        'max_jump_ratio': 0,
        'negative_values': False,
        'non_finite_values': False
    }
    
    # Check for jumps, negative values, and non-finite values
    for portfolio_values in results['portfolio_values']:
        for i in range(1, len(portfolio_values)):
            if portfolio_values[i-1] > 0:
                jump_ratio = portfolio_values[i] / portfolio_values[i-1]
                summary['max_jump_ratio'] = max(summary['max_jump_ratio'], jump_ratio)
            
            if portfolio_values[i] < 0:
                summary['negative_values'] = True
                
            if not np.isfinite(portfolio_values[i]):
                summary['non_finite_values'] = True
    
    # Log summary
    logging.info(f"Test Summary:")
    logging.info(f"  Min portfolio value: {summary['min_value']:.4f}")
    logging.info(f"  Max portfolio value: {summary['max_value']:.4f}")
    logging.info(f"  Max step-to-step ratio: {summary['max_jump_ratio']:.4f}")
    logging.info(f"  Negative values detected: {summary['negative_values']}")
    logging.info(f"  Non-finite values detected: {summary['non_finite_values']}")
    
    # Write summary to file
    with open('results/environment_test_summary.txt', 'w') as f:
        f.write(f"Random Action Test Summary ({datetime.now().strftime('%Y-%m-%d %H:%M')})\n")
        f.write(f"----------------------------------------\n")
        f.write(f"Min portfolio value: {summary['min_value']:.4f}\n")
        f.write(f"Max portfolio value: {summary['max_value']:.4f}\n")
        f.write(f"Max step-to-step ratio: {summary['max_jump_ratio']:.4f}\n")
        f.write(f"Negative values detected: {summary['negative_values']}\n")
        f.write(f"Non-finite values detected: {summary['non_finite_values']}\n\n")
        
        # Overall assessment
        if (summary['negative_values'] or 
            summary['non_finite_values'] or 
            summary['max_jump_ratio'] > 5):
            f.write("ASSESSMENT: FAILED - Environment has critical issues\n")
        else:
            f.write("ASSESSMENT: PASSED - Environment behaves as expected with random actions\n")
    
    return summary

if __name__ == "__main__":
    # Create directories if they don't exist
    os.makedirs('logs', exist_ok=True)
    os.makedirs('results', exist_ok=True)
    
    # Run test
    logging.info("Starting random action test")
    results = test_random_actions(n_episodes=5)
    
    # Plot and analyze results
    summary = plot_results(results)
    
    # Print final assessment
    if (summary['negative_values'] or 
        summary['non_finite_values'] or 
        summary['max_jump_ratio'] > 5):
        print("❌ FAILED: Environment has critical issues")
        for issue in ["negative_values", "non_finite_values"]:
            if summary[issue]:
                print(f"- {issue.replace('_', ' ').title()}")
        if summary['max_jump_ratio'] > 5:
            print(f"- Large jumps detected (max ratio: {summary['max_jump_ratio']:.2f})")
    else:
        print("✅ PASSED: Environment behaves as expected with random actions")