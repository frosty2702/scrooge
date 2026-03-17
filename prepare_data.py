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
    # Equity: realistic stock market ~12% annual, moderate vol
    'Equity': base * 1.0 + np.random.normal(0.0003, 0.008, n),
    
    # Bond: low return ~3% annual, low vol, slight negative correlation
    'Bond': base * -0.1 + np.random.normal(0.00012, 0.003, n),
    
    # Commodity: medium return ~5% annual, medium vol
    'Commodity': base * 0.2 + np.random.normal(0.0002, 0.006, n),
    
    # Defensive: low return ~2% annual, very low vol
    'Defensive': np.random.normal(0.00008, 0.002, n),
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