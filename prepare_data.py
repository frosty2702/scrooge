import pandas as pd
import numpy as np

def prepare_data_for_portfolio(input_file, output_file="data/features.csv"):
    df = pd.read_csv(input_file)
    df['date'] = pd.to_datetime(df['date'])
    df['return'] = df['close'].pct_change()
    df = df.dropna(subset=['return'])
    df['asset'] = 'Asset1'
    result = df[['date', 'asset', 'return']].rename(
        columns={'date': 'Date', 'asset': 'Asset', 'return': 'Return'}
    )
    
    result.to_csv(output_file, index=False)
    print(f"Data prepared and saved to {output_file}")
    
    return result

def simulate_multi_asset_data(input_file, num_assets=5, output_file="data/features.csv"):
    df = pd.read_csv(input_file)
    df['date'] = pd.to_datetime(df['date'])
    df['return'] = df['close'].pct_change()
    df = df.dropna(subset=['return'])
    all_assets = []
    
    all_assets = []
    for i in range(1, num_assets + 1):
        asset_df = df.copy()
        asset_df['asset'] = f'Asset{i}'
        if i > 1:
            base_return = asset_df['return'].values
            asset_df['return'] = base_return * (0.8 + 0.4 * (i / num_assets))
        all_assets.append(asset_df)
    result = pd.concat(all_assets)
  
    result = result[['date', 'asset', 'return']].rename(
        columns={'date': 'Date', 'asset': 'Asset', 'return': 'Return'}
    )
    
   
    result.to_csv(output_file, index=False)
    print(f"Multi-asset data prepared and saved to {output_file}")
    
    return result

if __name__ == "__main__":
    
    simulate_multi_asset_data("data/cleaned.csv", num_assets=5)