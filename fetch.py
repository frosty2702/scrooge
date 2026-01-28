import yfinance as yf
import pandas as pd

TICKER = "^NSEI"
START_DATE = "2005-01-01"
END_DATE = "2026-01-01"
OUTPUT_FILE = "data/cleaned.csv"

data = yf.download(
    TICKER,
    start=START_DATE,
    end=END_DATE,
    interval="1d"
)

if isinstance(data.columns, pd.MultiIndex):
    data.columns = data.columns.get_level_values(0)

data.reset_index(inplace=True)

data.columns = data.columns.str.lower().str.replace(" ", "_")

data.dropna(subset=["open", "high", "low", "close"], inplace=True)

data.sort_values(by="date", inplace=True)

data.to_csv(OUTPUT_FILE, index=False)

print(f"Saved cleaned data to {OUTPUT_FILE}")
print(f"Rows: {len(data)}")
print(data.head())