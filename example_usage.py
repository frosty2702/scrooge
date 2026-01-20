import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from portfolio_optimization import run_portfolio_analysis

if __name__ == "__main__":
    file_path = "data/features.csv"
    
    eq_metrics, mv_metrics, eq_cum_returns, mv_cum_returns = run_portfolio_analysis(file_path)
    
    print("\nEqual-Weight Portfolio Total Return:", eq_metrics['total_return'])
    print("Mean-Variance Portfolio Total Return:", mv_metrics['total_return'])
    
    print("\nSharpe Ratio Improvement:", 
          (mv_metrics['sharpe_ratio'] - eq_metrics['sharpe_ratio']) / eq_metrics['sharpe_ratio'] * 100, "%")
    
    plt.figure(figsize=(12, 6))
    plt.plot(eq_cum_returns, label='Equal Weight')
    plt.plot(mv_cum_returns, label='Mean-Variance')
    plt.title('Cumulative Returns Comparison')
    plt.xlabel('Date')
    plt.ylabel('Cumulative Return')
    plt.legend()
    plt.grid(True)
    plt.savefig('plots/cumulative_returns.png')
    plt.close()
    
    print("\nAnalysis complete. Plots saved to disk.")