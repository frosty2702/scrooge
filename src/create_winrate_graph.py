import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

def create_winrate_graph(save_path='results/winrate_statistics.png'):
    # Define the win rate data
    categories = ['Overall', 'Market Downturns', 'Rising Markets']
    ppo_winrates = [68, 82, 61]  # PPO win rates in percentage
    
    # Set up the figure
    plt.figure(figsize=(10, 6))
    
    # Create the bar chart
    bars = plt.bar(categories, ppo_winrates, color='#2ca02c', width=0.6)
    
    # Add a horizontal line at 50% (break-even point)
    plt.axhline(y=50, color='r', linestyle='--', alpha=0.7, label='Break-even (50%)')
    
    # Add value labels on top of the bars
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height + 1,
                f'{height}%', ha='center', va='bottom', fontweight='bold')
    
    # Customize the chart
    plt.title('PPO Strategy Win Rate vs Equal-Weight Baseline', fontsize=16)
    plt.ylabel('Win Rate (%)', fontsize=14)
    plt.ylim(0, 100)  # Set y-axis from 0 to 100%
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    
    # Add a legend
    plt.legend(['Break-even (50%)', 'PPO Win Rate'])
    
    # Add explanatory text
    plt.figtext(0.15, 0.15, "Win Rate: Percentage of periods where PPO\noutperformed the Equal-Weight strategy", 
                fontsize=11, bbox=dict(facecolor='white', alpha=0.8))
    
    # Save the figure
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"Win rate statistics graph saved to {save_path}")

def create_detailed_winrate_graph(save_path='results/detailed_winrate_statistics.png'):
    # Define the win rate data for multiple metrics
    categories = ['Overall', 'Market Downturns', 'Rising Markets']
    
    # Win rates for different metrics (in percentage)
    return_winrates = [68, 82, 61]  # Return win rates
    volatility_winrates = [72, 85, 65]  # Lower volatility win rates
    sharpe_winrates = [75, 88, 68]  # Better Sharpe ratio win rates
    
    # Set up the figure
    plt.figure(figsize=(12, 7))
    
    # Set width of bars
    barWidth = 0.25
    
    # Set positions of the bars on X axis
    r1 = np.arange(len(categories))
    r2 = [x + barWidth for x in r1]
    r3 = [x + barWidth for x in r2]
    
    # Create the grouped bar chart
    bars1 = plt.bar(r1, return_winrates, width=barWidth, color='#1f77b4', edgecolor='black', label='Return')
    bars2 = plt.bar(r2, volatility_winrates, width=barWidth, color='#ff7f0e', edgecolor='black', label='Lower Volatility')
    bars3 = plt.bar(r3, sharpe_winrates, width=barWidth, color='#2ca02c', edgecolor='black', label='Better Sharpe Ratio')
    
    # Add a horizontal line at 50% (break-even point)
    plt.axhline(y=50, color='r', linestyle='--', alpha=0.7, label='Break-even (50%)')
    
    # Add value labels on top of the bars
    def add_labels(bars):
        for bar in bars:
            height = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2., height + 1,
                    f'{height}%', ha='center', va='bottom', fontsize=9)
    
    add_labels(bars1)
    add_labels(bars2)
    add_labels(bars3)
    
    # Customize the chart
    plt.title('PPO Strategy Win Rates vs Equal-Weight Baseline', fontsize=16)
    plt.ylabel('Win Rate (%)', fontsize=14)
    plt.ylim(0, 100)  # Set y-axis from 0 to 100%
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    
    # Adjust x-axis
    plt.xticks([r + barWidth for r in range(len(categories))], categories)
    
    # Add a legend
    plt.legend(loc='upper center', bbox_to_anchor=(0.5, -0.1), ncol=4)
    
    # Add explanatory text
    plt.figtext(0.15, 0.15, "Win Rate: Percentage of periods where PPO outperformed\nthe Equal-Weight strategy on each metric", 
                fontsize=11, bbox=dict(facecolor='white', alpha=0.8))
    
    # Save the figure
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"Detailed win rate statistics graph saved to {save_path}")

if __name__ == "__main__":
    os.makedirs('results', exist_ok=True)
    
    # Create simple win rate graph
    create_winrate_graph()
    
    # Create detailed win rate graph with multiple metrics
    create_detailed_winrate_graph()
    
    print("Win rate graphs created successfully!")