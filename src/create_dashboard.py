"""
Create a performance dashboard for all strategies.
"""

import os
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import numpy as np

def format_percentage(value):
    """Format value as percentage."""
    return f"{value * 100:.2f}%"

def format_ratio(value):
    """Format value as ratio."""
    return f"{value:.2f}"

def create_dashboard(comparison_file='results/strategy_comparison.csv', 
                     output_file='results/performance_dashboard.png'):
    """
    Create a performance dashboard for all strategies.
    
    Args:
        comparison_file: Path to CSV file with strategy comparison
        output_file: Path to save the dashboard
    """
    # Load comparison data
    comparison = pd.read_csv(comparison_file)
    
    # Create figure
    fig = plt.figure(figsize=(12, 10))
    gs = gridspec.GridSpec(3, 2, height_ratios=[1, 2, 2])
    
    # Create table
    ax_table = plt.subplot(gs[0, :])
    ax_table.axis('off')
    
    # Format data for table
    table_data = []
    for _, row in comparison.iterrows():
        table_data.append([
            row['Strategy'],
            f"{row['Cumulative_Return']:.2f}",
            f"{row['Volatility'] * 100:.2f}%",
            f"{row['Sharpe_Ratio']:.2f}",
            f"{row['Max_Drawdown'] * 100:.2f}%"
        ])
    
    # Create table
    table = ax_table.table(
        cellText=table_data,
        colLabels=['Strategy', 'Cumulative Return', 'Volatility', 'Sharpe Ratio', 'Max Drawdown'],
        loc='center',
        cellLoc='center',
        colWidths=[0.15, 0.2, 0.2, 0.2, 0.2]
    )
    
    # Style table
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    table.scale(1.2, 1.5)
    
    # Highlight best values
    best_cum_return_idx = comparison['Cumulative_Return'].idxmax()
    best_sharpe_idx = comparison['Sharpe_Ratio'].idxmax()
    best_drawdown_idx = comparison['Max_Drawdown'].idxmax()
    
    # Color cells for best values
    for i, row in enumerate(table_data):
        if i == best_cum_return_idx:
            table[(i+1, 1)].set_facecolor('#c7f0d8')
        if i == best_sharpe_idx:
            table[(i+1, 3)].set_facecolor('#c7f0d8')
        if i == best_drawdown_idx:
            table[(i+1, 4)].set_facecolor('#c7f0d8')
    
    # Add title
    plt.suptitle('Portfolio Strategy Comparison', fontsize=16, y=0.98)
    
    # Create bar charts for key metrics
    ax_returns = plt.subplot(gs[1, 0])
    ax_sharpe = plt.subplot(gs[1, 1])
    ax_drawdown = plt.subplot(gs[2, 0])
    ax_volatility = plt.subplot(gs[2, 1])
    
    # Bar colors
    colors = ['#1f77b4', '#ff7f0e', '#2ca02c']
    
    # Plot cumulative returns
    strategies = comparison['Strategy']
    returns = comparison['Cumulative_Return']
    ax_returns.bar(strategies, returns, color=colors)
    ax_returns.set_title('Cumulative Return')
    ax_returns.set_ylabel('Return')
    ax_returns.grid(axis='y', linestyle='--', alpha=0.7)
    
    # Add value labels
    for i, v in enumerate(returns):
        ax_returns.text(i, v + 0.1, f"{v:.2f}", ha='center')
    
    # Plot Sharpe ratios
    sharpe = comparison['Sharpe_Ratio']
    ax_sharpe.bar(strategies, sharpe, color=colors)
    ax_sharpe.set_title('Sharpe Ratio')
    ax_sharpe.grid(axis='y', linestyle='--', alpha=0.7)
    
    # Add value labels
    for i, v in enumerate(sharpe):
        ax_sharpe.text(i, v + 0.05, f"{v:.2f}", ha='center')
    
    # Plot max drawdowns
    drawdowns = comparison['Max_Drawdown']
    ax_drawdown.bar(strategies, drawdowns, color=colors)
    ax_drawdown.set_title('Maximum Drawdown')
    ax_drawdown.set_ylabel('Drawdown')
    ax_drawdown.grid(axis='y', linestyle='--', alpha=0.7)
    
    # Add value labels
    for i, v in enumerate(drawdowns):
        ax_drawdown.text(i, v - 0.05, f"{v:.2f}", ha='center')
    
    # Plot volatility
    volatility = comparison['Volatility']
    ax_volatility.bar(strategies, volatility, color=colors)
    ax_volatility.set_title('Volatility')
    ax_volatility.grid(axis='y', linestyle='--', alpha=0.7)
    
    # Add value labels
    for i, v in enumerate(volatility):
        ax_volatility.text(i, v + 0.01, f"{v:.2f}", ha='center')
    
    # Adjust layout
    plt.tight_layout(rect=[0, 0, 1, 0.95])
    
    # Save figure
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    print(f"Dashboard saved to {output_file}")

if __name__ == "__main__":
    # Create directories if they don't exist
    os.makedirs('results', exist_ok=True)
    
    # Create dashboard
    create_dashboard()
    
    print("Done!")