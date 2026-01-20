import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import minimize

def load_and_prepare_data(file_path):
    """
    Load data from CSV and prepare it for portfolio optimization.
    Expected format: Date, Asset, Return
    """
    df = pd.read_csv(file_path)
    # Convert Date to datetime if not already
    df['Date'] = pd.to_datetime(df['Date'])
    # Pivot to get assets as columns and dates as rows
    pivot_df = df.pivot(index='Date', columns='Asset', values='Return')
    return pivot_df

def equal_weight_portfolio(returns_df):
    """
    Create an equal-weight portfolio.
    
    Args:
        returns_df: DataFrame with dates as index and assets as columns, values are returns
        
    Returns:
        tuple: (weights, portfolio_returns, cumulative_returns, metrics)
    """
    n_assets = returns_df.shape[1]
    weights = np.ones(n_assets) / n_assets
    
    # Calculate portfolio returns
    portfolio_returns = returns_df.dot(weights)
    
    # Calculate cumulative returns (starting with $1)
    cumulative_returns = (1 + portfolio_returns).cumprod()
    
    # Calculate metrics
    metrics = calculate_metrics(portfolio_returns, weights, returns_df.columns)
    
    return weights, portfolio_returns, cumulative_returns, metrics

def negative_sharpe_ratio(weights, returns):
    """
    Calculate the negative Sharpe ratio (for minimization).
    
    Args:
        weights: Array of weights
        returns: DataFrame of returns
        
    Returns:
        float: Negative Sharpe ratio
    """
    portfolio_return = np.sum(returns.mean() * weights) * 252  # Annualized return
    portfolio_vol = np.sqrt(np.dot(weights.T, np.dot(returns.cov() * 252, weights)))
    sharpe = portfolio_return / portfolio_vol
    return -sharpe

def portfolio_volatility(weights, returns):
    """
    Calculate portfolio volatility.
    """
    return np.sqrt(np.dot(weights.T, np.dot(returns.cov() * 252, weights)))

def mean_variance_portfolio(returns_df, rebalance_freq='M'):
    """
    Create a mean-variance optimized portfolio with monthly rebalancing.
    
    Args:
        returns_df: DataFrame with dates as index and assets as columns, values are returns
        rebalance_freq: Rebalancing frequency ('M' for monthly)
        
    Returns:
        tuple: (all_weights, portfolio_returns, cumulative_returns, metrics)
    """
    # Group data by rebalance frequency
    grouped = returns_df.groupby(pd.Grouper(freq=rebalance_freq))
    
    all_weights = {}
    all_returns = []
    
    # For each period
    for period_name, period_data in grouped:
        if period_data.empty or period_data.shape[0] < 2:
            continue
            
        # Use data up to this period for optimization
        # In a real scenario, you'd use a lookback window
        historical_data = returns_df.loc[:period_data.index[-1]]
        
        # Skip if not enough data
        if historical_data.shape[0] < 30:  # Require at least 30 days of data
            if len(all_weights) == 0:  # If first period, use equal weights
                n_assets = period_data.shape[1]
                weights = np.ones(n_assets) / n_assets
            # Otherwise use previous weights
            else:
                weights = list(all_weights.values())[-1]
        else:
            # Optimize weights
            n_assets = period_data.shape[1]
            init_weights = np.ones(n_assets) / n_assets
            
            # Constraints: weights sum to 1 and are non-negative
            constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
            bounds = tuple((0, 1) for _ in range(n_assets))
            
            # Minimize negative Sharpe ratio
            result = minimize(
                negative_sharpe_ratio, 
                init_weights, 
                args=(historical_data,), 
                method='SLSQP', 
                bounds=bounds, 
                constraints=constraints
            )
            
            weights = result['x']
        
        # Store weights for this period
        all_weights[period_name] = weights
        
        # Calculate returns for this period using the optimized weights
        period_returns = period_data.dot(weights)
        all_returns.append(period_returns)
    
    # Combine all returns
    if all_returns:
        portfolio_returns = pd.concat(all_returns)
        
        # Calculate cumulative returns
        cumulative_returns = (1 + portfolio_returns).cumprod()
        
        # Calculate metrics using the entire return series
        metrics = calculate_metrics(portfolio_returns, None, returns_df.columns)
        
        return all_weights, portfolio_returns, cumulative_returns, metrics
    else:
        return {}, pd.Series(), pd.Series(), {}

def calculate_metrics(returns, weights=None, assets=None):
    """
    Calculate portfolio performance metrics.
    
    Args:
        returns: Series of portfolio returns
        weights: Array of weights (optional)
        assets: List of asset names (optional)
        
    Returns:
        dict: Performance metrics
    """
    # Annualized return
    ann_return = returns.mean() * 252
    
    # Annualized volatility
    ann_vol = returns.std() * np.sqrt(252)
    
    # Sharpe ratio (assuming risk-free rate = 0)
    sharpe = ann_return / ann_vol if ann_vol > 0 else 0
    
    metrics = {
        'annualized_return': ann_return,
        'annualized_volatility': ann_vol,
        'sharpe_ratio': sharpe,
        'total_return': (1 + returns).prod() - 1,
        'max_drawdown': calculate_max_drawdown(returns)
    }
    
    # Add weights if provided
    if weights is not None and assets is not None:
        metrics['weights'] = dict(zip(assets, weights))
        
    return metrics

def calculate_max_drawdown(returns):
    """
    Calculate the maximum drawdown of a return series.
    """
    cumulative = (1 + returns).cumprod()
    peak = cumulative.expanding().max()
    drawdown = (cumulative / peak) - 1
    return drawdown.min()

def plot_cumulative_returns(eq_cum_returns, mv_cum_returns):
    """
    Plot cumulative returns of both portfolios.
    
    Args:
        eq_cum_returns: Series of equal-weight cumulative returns
        mv_cum_returns: Series of mean-variance cumulative returns
    """
    plt.figure(figsize=(12, 6))
    plt.plot(eq_cum_returns, label='Equal Weight')
    plt.plot(mv_cum_returns, label='Mean-Variance')
    plt.title('Cumulative Returns')
    plt.xlabel('Date')
    plt.ylabel('Cumulative Return')
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    
def plot_weights_over_time(weights_dict, assets):
    """
    Plot how weights change over time for the mean-variance portfolio.
    
    Args:
        weights_dict: Dictionary with dates as keys and weight arrays as values
        assets: List of asset names
    """
    # Convert dictionary to DataFrame
    weights_df = pd.DataFrame(weights_dict).T
    weights_df.columns = assets
    
    plt.figure(figsize=(12, 8))
    plt.stackplot(weights_df.index, weights_df.T, labels=assets, alpha=0.7)
    plt.title('Portfolio Weights Over Time (Mean-Variance)')
    plt.xlabel('Date')
    plt.ylabel('Weight')
    plt.legend(loc='upper left', bbox_to_anchor=(1, 1))
    plt.grid(True)
    plt.tight_layout()

def run_portfolio_analysis(file_path, plot=True):
    """
    Run the full portfolio analysis.
    
    Args:
        file_path: Path to the CSV file
        plot: Whether to generate plots
        
    Returns:
        tuple: (eq_metrics, mv_metrics, eq_cum_returns, mv_cum_returns)
    """
    # Load and prepare data
    returns_df = load_and_prepare_data(file_path)
    
    # Equal-weight portfolio
    eq_weights, eq_returns, eq_cum_returns, eq_metrics = equal_weight_portfolio(returns_df)
    
    # Mean-variance portfolio
    mv_weights, mv_returns, mv_cum_returns, mv_metrics = mean_variance_portfolio(returns_df)
    
    # Print results
    print("\nEqual-Weight Portfolio Metrics:")
    for key, value in eq_metrics.items():
        if key != 'weights':
            print(f"{key}: {value:.4f}")
    
    print("\nMean-Variance Portfolio Metrics:")
    for key, value in mv_metrics.items():
        if key != 'weights':
            print(f"{key}: {value:.4f}")
    
    # Plot results if requested
    if plot:
        plot_cumulative_returns(eq_cum_returns, mv_cum_returns)
        
        # Plot weights over time for mean-variance portfolio
        if mv_weights:
            plot_weights_over_time(mv_weights, returns_df.columns)
        
        plt.show()
    
    return eq_metrics, mv_metrics, eq_cum_returns, mv_cum_returns

if __name__ == "__main__":
    # Example usage
    file_path = "data/features.csv"
    eq_metrics, mv_metrics, eq_cum_returns, mv_cum_returns = run_portfolio_analysis(file_path)