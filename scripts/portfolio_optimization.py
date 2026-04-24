import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import minimize

def load_and_prepare_data(file_path):
    df = pd.read_csv(file_path)
    df['Date'] = pd.to_datetime(df['Date'])
    pivot_df = df.pivot(index='Date', columns='Asset', values='Return')
    return pivot_df

def equal_weight_portfolio(returns_df):
    n_assets = returns_df.shape[1]
    weights = np.ones(n_assets) / n_assets
    
    portfolio_returns = returns_df.dot(weights)
    cumulative_returns = (1 + portfolio_returns).cumprod()
    
    total_return = cumulative_returns.iloc[-1] - 1
    volatility = portfolio_returns.std() * np.sqrt(252)
    sharpe_ratio = portfolio_returns.mean() / portfolio_returns.std() * np.sqrt(252)
    
    metrics = {
        'weights': weights,
        'returns': portfolio_returns,
        'cumulative_returns': cumulative_returns,
        'total_return': total_return,
        'volatility': volatility,
        'sharpe_ratio': sharpe_ratio
    }
    
    return metrics

def portfolio_volatility(weights, cov_matrix):
    return np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))

def portfolio_return(weights, returns):
    return np.sum(returns.mean() * weights)

def negative_sharpe_ratio(weights, returns, cov_matrix, risk_free_rate=0):
    p_ret = portfolio_return(weights, returns)
    p_vol = portfolio_volatility(weights, cov_matrix)
    return -(p_ret - risk_free_rate) / p_vol

def mean_variance_portfolio(returns_df, lookback=60, risk_aversion=1.0):
    n_assets = returns_df.shape[1]
    
    all_weights = []
    portfolio_returns = []
    
    for t in range(lookback, len(returns_df)):
        hist_returns = returns_df.iloc[t-lookback:t]
        
        mean_returns = hist_returns.mean()
        cov_matrix = hist_returns.cov()
        
        constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
        bounds = tuple((0, 1) for asset in range(n_assets))
        
        initial_guess = np.array([1/n_assets] * n_assets)
        
        try:
            result = minimize(negative_sharpe_ratio, 
                             initial_guess,
                             args=(hist_returns, cov_matrix),
                             method='SLSQP',
                             bounds=bounds,
                             constraints=constraints)
            
            optimal_weights = result['x']
        except:
            optimal_weights = np.ones(n_assets) / n_assets
        
        all_weights.append(optimal_weights)
        
        next_return = returns_df.iloc[t].values
        portfolio_return = np.dot(optimal_weights, next_return)
        portfolio_returns.append(portfolio_return)
    
    portfolio_returns_series = pd.Series(portfolio_returns, index=returns_df.index[lookback:])
    cumulative_returns = (1 + portfolio_returns_series).cumprod()
    
    total_return = cumulative_returns.iloc[-1] - 1
    volatility = portfolio_returns_series.std() * np.sqrt(252)
    sharpe_ratio = portfolio_returns_series.mean() / portfolio_returns_series.std() * np.sqrt(252)
    
    metrics = {
        'weights': all_weights,
        'returns': portfolio_returns_series,
        'cumulative_returns': cumulative_returns,
        'total_return': total_return,
        'volatility': volatility,
        'sharpe_ratio': sharpe_ratio
    }
    
    return metrics

def run_portfolio_analysis(file_path, lookback=60, risk_aversion=1.0):
    returns_df = load_and_prepare_data(file_path)
    
    eq_metrics = equal_weight_portfolio(returns_df)
    mv_metrics = mean_variance_portfolio(returns_df, lookback, risk_aversion)
    
    print("Equal-Weight Portfolio:")
    print(f"Total Return: {eq_metrics['total_return']:.4f}")
    print(f"Volatility: {eq_metrics['volatility']:.4f}")
    print(f"Sharpe Ratio: {eq_metrics['sharpe_ratio']:.4f}")
    
    print("\nMean-Variance Portfolio:")
    print(f"Total Return: {mv_metrics['total_return']:.4f}")
    print(f"Volatility: {mv_metrics['volatility']:.4f}")
    print(f"Sharpe Ratio: {mv_metrics['sharpe_ratio']:.4f}")
    
    return eq_metrics, mv_metrics, eq_metrics['cumulative_returns'], mv_metrics['cumulative_returns']