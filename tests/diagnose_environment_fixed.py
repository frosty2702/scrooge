"""
Diagnose the trading environment issue by examining the data and calculations.
"""

import os
import sys
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def load_and_analyze_data(file_path='data/features.csv'):
    """Load and analyze the features data to identify issues."""
    # Load data
    data = pd.read_csv(file_path)
    data['Date'] = pd.to_datetime(data['Date'])
    
    # Pivot to get returns by date and asset
    returns = data.pivot(index='Date', columns='Asset', values='Return')
    
    # Basic statistics
    print(f"Data shape: {returns.shape}")
    print(f"Date range: {returns.index.min()} to {returns.index.max()}")
    print(f"Assets: {returns.columns.tolist()}")
    
    # Check for missing values
    missing = returns.isna().sum()
    print(f"Missing values per asset: {missing.to_dict()}")
    
    # Check for extreme values
    print(f"Min returns: {returns.min().to_dict()}")
    print(f"Max returns: {returns.max().to_dict()}")
    
    # Calculate equal-weight returns
    n_assets = returns.shape[1]
    equal_weights = np.ones(n_assets) / n_assets
    portfolio_returns = returns.dot(equal_weights)
    
    # Calculate cumulative returns
    cumulative_returns = (1 + portfolio_returns).cumprod()
    
    # Calculate statistics
    print(f"Equal-weight mean daily return: {portfolio_returns.mean():.6f}")
    print(f"Equal-weight final cumulative return: {cumulative_returns.iloc[-1]:.6f}")
    
    return returns, portfolio_returns, cumulative_returns

def simulate_environment_manually(returns):
    """Simulate the environment's behavior manually to identify issues."""
    n_assets = returns.shape[1]
    equal_weights = np.ones(n_assets) / n_assets
    
    # Initialize
    portfolio_value = 1.0
    portfolio_values = [portfolio_value]
    dates = []
    
    # Iterate through returns (skipping first window_size days)
    window_size = 20
    for i in range(window_size, len(returns)):
        # Get returns for current day
        day_returns = returns.iloc[i].values
        
        # Calculate portfolio return
        portfolio_return = np.dot(equal_weights, day_returns)
        
        # Update portfolio value
        portfolio_value *= (1 + portfolio_return)
        portfolio_values.append(portfolio_value)
        dates.append(returns.index[i])
    
    # Create DataFrame with results
    results = pd.DataFrame({
        'Date': dates,
        'PortfolioValue': portfolio_values[:-1]  # Remove last value as it doesn't have a date
    })
    
    return results

def compare_calculations(manual_sim, baseline):
    """Compare manual simulation with baseline to identify discrepancies."""
    # Ensure baseline has Date as a column, not an index
    if isinstance(baseline.index, pd.DatetimeIndex) and baseline.index.name == 'Date':
        baseline = baseline.reset_index()
    
    # Merge results
    merged = pd.merge(
        manual_sim,
        baseline,
        on='Date',
        suffixes=('_sim', '_baseline')
    )
    
    # Calculate differences
    merged['Diff'] = merged['PortfolioValue_sim'] - merged['PortfolioValue_baseline']
    merged['Diff_Pct'] = (merged['Diff'] / merged['PortfolioValue_baseline']) * 100
    
    # Print statistics
    print(f"Mean difference: {merged['Diff'].mean():.6f}")
    print(f"Max difference: {merged['Diff'].max():.6f}")
    print(f"Final difference: {merged['Diff'].iloc[-1]:.6f}")
    print(f"Final difference (%): {merged['Diff_Pct'].iloc[-1]:.2f}%")
    
    # Plot differences
    plt.figure(figsize=(12, 8))
    
    plt.subplot(2, 1, 1)
    plt.plot(merged['Date'], merged['PortfolioValue_sim'], label='Simulation')
    plt.plot(merged['Date'], merged['PortfolioValue_baseline'], label='Baseline')
    plt.title('Portfolio Value Comparison')
    plt.legend()
    plt.grid(True)
    
    plt.subplot(2, 1, 2)
    plt.plot(merged['Date'], merged['Diff_Pct'])
    plt.title('Percentage Difference')
    plt.axhline(y=0, color='r', linestyle='-')
    plt.grid(True)
    
    plt.tight_layout()
    plt.savefig('results/environment_diagnosis.png')
    
    return merged

def find_root_cause(returns, portfolio_returns):
    """Analyze the data to find the root cause of the discrepancy."""
    # Check if there's a systematic bias in the returns
    window_size = 20
    
    # Calculate returns starting from window_size
    truncated_returns = portfolio_returns.iloc[window_size:]
    
    # Calculate cumulative returns for both full and truncated series
    full_cumulative = (1 + portfolio_returns).cumprod()
    truncated_cumulative = (1 + truncated_returns).cumprod()
    
    # Compare final values
    full_final = full_cumulative.iloc[-1]
    trunc_final = truncated_cumulative.iloc[-1]
    
    print(f"Full data cumulative return: {full_final:.6f}")
    print(f"Truncated data (skipping first {window_size} days) cumulative return: {trunc_final:.6f}")
    print(f"Difference: {(full_final - trunc_final):.6f}")
    print(f"Difference (%): {((full_final - trunc_final) / trunc_final * 100):.2f}%")
    
    # Check the first window_size days
    first_window = portfolio_returns.iloc[:window_size]
    first_window_cum = (1 + first_window).cumprod()
    print(f"First {window_size} days cumulative return: {first_window_cum.iloc[-1]:.6f}")
    
    # Create a corrected baseline that starts from the same point as the environment
    corrected_baseline = pd.DataFrame({
        'Date': returns.index[window_size:],
        'PortfolioValue': (1 + portfolio_returns.iloc[window_size:]).cumprod()
    })
    
    return corrected_baseline

def create_fixed_environment():
    """Create a fixed version of the trading environment."""
    # Load data
    data = pd.read_csv('data/features.csv')
    data['Date'] = pd.to_datetime(data['Date'])
    
    # Pivot to get returns by date and asset
    returns = data.pivot(index='Date', columns='Asset', values='Return')
    
    # Calculate equal-weight returns
    n_assets = returns.shape[1]
    equal_weights = np.ones(n_assets) / n_assets
    portfolio_returns = returns.dot(equal_weights)
    
    # Calculate cumulative returns
    window_size = 20
    
    # For the environment simulation (starts at window_size)
    env_returns = portfolio_returns.iloc[window_size:]
    env_cumulative = (1 + env_returns).cumprod()
    
    # For the baseline (full data)
    baseline_cumulative = (1 + portfolio_returns).cumprod()
    
    # Calculate the scaling factor
    scaling_factor = baseline_cumulative.iloc[window_size-1]
    print(f"Scaling factor: {scaling_factor:.6f}")
    
    # Create corrected environment values
    corrected_env_cumulative = env_cumulative * scaling_factor
    
    # Create DataFrames
    env_df = pd.DataFrame({
        'Date': returns.index[window_size:],
        'PortfolioValue': env_cumulative.values
    })
    
    baseline_df = pd.DataFrame({
        'Date': returns.index,
        'PortfolioValue': baseline_cumulative.values
    })
    
    corrected_df = pd.DataFrame({
        'Date': returns.index[window_size:],
        'PortfolioValue': corrected_env_cumulative.values
    })
    
    # Compare final values
    print(f"Environment final value: {env_cumulative.iloc[-1]:.6f}")
    print(f"Baseline final value: {baseline_cumulative.iloc[-1]:.6f}")
    print(f"Corrected environment final value: {corrected_env_cumulative.iloc[-1]:.6f}")
    
    # Calculate difference
    env_baseline_diff = (env_cumulative.iloc[-1] - baseline_cumulative.iloc[-1]) / baseline_cumulative.iloc[-1] * 100
    corrected_baseline_diff = (corrected_env_cumulative.iloc[-1] - baseline_cumulative.iloc[-1]) / baseline_cumulative.iloc[-1] * 100
    
    print(f"Environment vs Baseline difference: {env_baseline_diff:.2f}%")
    print(f"Corrected vs Baseline difference: {corrected_baseline_diff:.2f}%")
    
    return env_df, baseline_df, corrected_df, scaling_factor

if __name__ == "__main__":
    # Create directories if they don't exist
    os.makedirs('results', exist_ok=True)
    
    # Load and analyze data
    print("Analyzing data...")
    returns, portfolio_returns, cumulative_returns = load_and_analyze_data()
    
    # Create fixed environment
    print("\nCreating fixed environment...")
    env_df, baseline_df, corrected_df, scaling_factor = create_fixed_environment()
    
    # Save results
    env_df.to_csv('results/environment_simulation.csv', index=False)
    baseline_df.to_csv('results/baseline.csv', index=False)
    corrected_df.to_csv('results/corrected_environment.csv', index=False)
    
    # Plot results
    plt.figure(figsize=(12, 6))
    plt.plot(baseline_df['Date'], baseline_df['PortfolioValue'], label='Baseline (Full Data)')
    plt.plot(env_df['Date'], env_df['PortfolioValue'], label='Environment Simulation')
    plt.plot(corrected_df['Date'], corrected_df['PortfolioValue'], label='Corrected Environment')
    plt.title('Portfolio Value Comparison')
    plt.xlabel('Date')
    plt.ylabel('Portfolio Value')
    plt.legend()
    plt.grid(True)
    plt.savefig('results/fixed_environment_comparison.png')
    
    # Write scaling factor to file
    with open('results/scaling_factor.txt', 'w') as f:
        f.write(f"Scaling factor: {scaling_factor:.6f}\n")
        f.write(f"To fix the environment, multiply portfolio values by this factor.\n")
        f.write(f"This accounts for the returns in the first {20} days that the environment skips.")