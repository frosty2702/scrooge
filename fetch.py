import yfinance as yf
import pandas as pd

TICKER = "^NSEI"
START_DATE = "2005-01-01"
END_DATE = "2025-01-01"
OUTPUT_FILE = "cleaned.csv"

data = yf.download(
    TICKER,
    start=START_DATE,
    end=END_DATE,
    interval="1d"
)

# FIX: Flatten MultiIndex columns
if isinstance(data.columns, pd.MultiIndex):
    data.columns = data.columns.get_level_values(0)

# Reset index
data.reset_index(inplace=True)

# Normalize column names
data.columns = data.columns.str.lower().str.replace(" ", "_")

# Drop rows with missing OHLC
data.dropna(subset=["open", "high", "low", "close"], inplace=True)

# Sort by date
data.sort_values(by="date", inplace=True)

# Save CSV
data.to_csv(OUTPUT_FILE, index=False)

print(f"Saved cleaned data to {OUTPUT_FILE}")
print(f"Rows: {len(data)}")
print(data.head())
