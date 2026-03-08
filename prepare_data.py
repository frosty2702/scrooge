import pandas as pd
import numpy as np

def simulate_multi_asset_data(input_file, output_file="data/features.csv", seed=42):
    np.random.seed(seed)
    
    df = pd.read_csv(input_file)
    df['date'] = pd.to_datetime(df['date'])
    df['return'] = df['close'].pct_change()
    df = df.dropna(subset=['return'])
    
    base = df['return'].values
    dates = df['date'].values
    n = len(base)
    
    assets = {
        'Equity': base * 1.2 + np.random.normal(0, 0.003, n) + 0.0008,
        'Bond': base * -0.2 + np.random.normal(0, 0.001, n) + 0.0002,
        'Commodity': base * 0.3 + np.random.normal(0, 0.008, n),
        'Defensive': np.random.normal(0.0002, 0.001, n),
    }
    
    all_assets = []
    for asset_name, returns in assets.items():
        asset_df = pd.DataFrame({
            'Date': dates,
            'Asset': asset_name,
            'Return': returns
        })
        all_assets.append(asset_df)
    
    result = pd.concat(all_assets).reset_index(drop=True)
    result.to_csv(output_file, index=False)
    print(f"Multi-asset data saved to {output_file}")
    print(f"Assets: {list(assets.keys())}")
    print(f"Rows: {len(result)}")
    
    return result

if __name__ == "__main__":
    simulate_multi_asset_data("data/cleaned.csv")