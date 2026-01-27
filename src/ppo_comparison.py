"""
Compare PPO strategy with baselines.
This script takes PPO returns and compares them with baseline strategies.
"""

import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

def load_ppo_returns(file_path='results/ppo_returns_template.csv'):
    """
    Load PPO returns from CSV file.
    
    Args:
        file_path: Path to CSV file with PPO returns
        
    Returns:
        DataFrame with date and PPO returns
    """
    ppo_returns = pd.read_csv(file_path)
    ppo_returns['Date'] = pd.to_datetime(ppo_returns['Date'])
    return ppo_returns

def create_equal_weight_returns(data_file='data/features.csv'):
    """
    Create equal-weight strategy returns.
    
    Args:
        data_file: Path to features CSV file
        
    Returns:
        DataFrame with date and equal-weight returns
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
    
    # Create DataFrame with results
    results = pd.DataFrame({
        'Date': portfolio_returns.index,
        'Equal_Weight_Return': portfolio_returns.values
    })
    
    return results

def create_mean_variance_returns(data_file='data/features.csv', lookback=60, risk_aversion=1.0):
    """
    Create mean-variance strategy returns.
    
    Args:
        data_file: Path to features CSV file
        lookback: Number of days to use for estimating mean and covariance
        risk_aversion: Risk aversion parameter
        
    Returns:
        DataFrame with date and mean-variance returns
    """
    # Read data
    data = pd.read_csv(data_file)
    data['Date'] = pd.to_datetime(data['Date'])
    
    # Pivot to get returns by date and asset
    returns = data.pivot(index='Date', columns='Asset', values='Return')
    
    # Initialize results
    dates = []
    mv_returns = []
    
    # Calculate mean-variance weights and returns
    for t in range(lookback, len(returns)):
        # Get historical returns
        hist_returns = returns.iloc[t-lookback:t]
        
        # Calculate mean and covariance
        mu = hist_returns.mean().values
        sigma = hist_returns.cov().values
        
        # Calculate mean-variance weights
        try:
            inv_sigma = np.linalg.inv(sigma)
            weights = (1/risk_aversion) * inv_sigma @ mu
            weights = weights / np.sum(np.abs(weights))  # Normalize
        except np.linalg.LinAlgError:
            # If covariance matrix is singular, use equal weights
            weights = np.ones(len(mu)) / len(mu)
        
        # Calculate portfolio return
        port_return = np.dot(weights, returns.iloc[t].values)
        
        # Store results
        dates.append(returns.index[t])
        mv_returns.append(port_return)
    
    # Create DataFrame with results
    results = pd.DataFrame({
        'Date': dates,
        'Mean_Variance_Return': mv_returns
    })
    
    return results

def calculate_metrics(returns_series):
    """
    Calculate performance metrics for a return series.
    
    Args:
        returns_series: Series of returns
        
    Returns:
        Dictionary with performance metrics
    """
    # Calculate cumulative return
    cum_return = (1 + returns_series).prod() - 1
    
    # Calculate annualized volatility (assuming daily returns)
    volatility = returns_series.std() * np.sqrt(252)
    
    # Calculate Sharpe ratio (assuming 0% risk-free rate)
    sharpe_ratio = (returns_series.mean() / returns_series.std()) * np.sqrt(252)
    
    # Calculate maximum drawdown
    cum_returns = (1 + returns_series).cumprod()
    running_max = cum_returns.cummax()
    drawdown = (cum_returns / running_max) - 1
    max_drawdown = drawdown.min()
    
    return {
        'Cumulative_Return': cum_return,
        'Volatility': volatility,
        'Sharpe_Ratio': sharpe_ratio,
        'Max_Drawdown': max_drawdown
    }

def compare_strategies(ppo_returns, equal_weight_returns, mean_variance_returns):
    """
    Compare PPO with baseline strategies.
    
    Args:
        ppo_returns: DataFrame with PPO returns
        equal_weight_returns: DataFrame with equal-weight returns
        mean_variance_returns: DataFrame with mean-variance returns
        
    Returns:
        DataFrame with comparison metrics
    """
    # Merge all returns
    merged = pd.merge(ppo_returns, equal_weight_returns, on='Date', how='inner')
    merged = pd.merge(merged, mean_variance_returns, on='Date', how='inner')
    
    # Calculate metrics for each strategy
    ppo_metrics = calculate_metrics(merged['PPO_Return'])
    ew_metrics = calculate_metrics(merged['Equal_Weight_Return'])
    mv_metrics = calculate_metrics(merged['Mean_Variance_Return'])
    
    # Create comparison DataFrame
    comparison = pd.DataFrame({
        'Strategy': ['Equal_Weight', 'Mean_Variance', 'PPO'],
        'Cumulative_Return': [ew_metrics['Cumulative_Return'], mv_metrics['Cumulative_Return'], ppo_metrics['Cumulative_Return']],
        'Volatility': [ew_metrics['Volatility'], mv_metrics['Volatility'], ppo_metrics['Volatility']],
        'Sharpe_Ratio': [ew_metrics['Sharpe_Ratio'], mv_metrics['Sharpe_Ratio'], ppo_metrics['Sharpe_Ratio']],
        'Max_Drawdown': [ew_metrics['Max_Drawdown'], mv_metrics['Max_Drawdown'], ppo_metrics['Max_Drawdown']]
    })
    
    return comparison, merged

def plot_cumulative_returns(merged_returns, save_path='results/cumulative_returns.png'):
    """
    Plot cumulative returns for all strategies.
    
    Args:
        merged_returns: DataFrame with returns for all strategies
        save_path: Path to save the plot
    """
    # Calculate cumulative returns
    cum_returns = pd.DataFrame({
        'Date': merged_returns['Date'],
        'Equal_Weight': (1 + merged_returns['Equal_Weight_Return']).cumprod(),
        'Mean_Variance': (1 + merged_returns['Mean_Variance_Return']).cumprod(),
        'PPO': (1 + merged_returns['PPO_Return']).cumprod()
    })
    
    # Plot
    plt.figure(figsize=(12, 6))
    plt.plot(cum_returns['Date'], cum_returns['Equal_Weight'], label='Equal Weight')
    plt.plot(cum_returns['Date'], cum_returns['Mean_Variance'], label='Mean-Variance')
    plt.plot(cum_returns['Date'], cum_returns['PPO'], label='PPO', linewidth=2)
    
    plt.title('Cumulative Returns: PPO vs. Baselines')
    plt.xlabel('Date')
    plt.ylabel('Portfolio Value')
    plt.legend()
    plt.grid(True)
    
    # Save plot
    plt.savefig(save_path)
    print(f"Plot saved to {save_path}")

def main():
    """Run the comparison."""
    # Create directories if they don't exist
    os.makedirs('results', exist_ok=True)
    
    # Load PPO returns
    ppo_returns = load_ppo_returns()
    
    # Create baseline returns
    equal_weight_returns = create_equal_weight_returns()
    mean_variance_returns = create_mean_variance_returns()
    
    # Compare strategies
    comparison, merged_returns = compare_strategies(
        ppo_returns, 
        equal_weight_returns, 
        mean_variance_returns
    )
    
    # Save comparison to CSV
    comparison.to_csv('results/strategy_comparison.csv', index=False)
    print("Comparison saved to results/strategy_comparison.csv")
    
    # Plot cumulative returns
    plot_cumulative_returns(merged_returns)

if __name__ == "__main__":
    main()