"""
Generate presentation charts for Scrooge.ai viva.
Run from scrooge root: python generate_charts.py
Saves charts to results/charts/
"""
import sys
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent / "scripts"))

from scripts.portfolio_optimization import equal_weight_portfolio, load_and_prepare_data, mean_variance_portfolio

OUTPUT_DIR = Path("results/charts")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

START = "2011-04-20"
END   = "2012-07-27"

GOLD   = "#E6A800"
GREEN  = "#1a9e6e"
RED    = "#e05252"
BLUE   = "#3b82f6"
PINK   = "#d946a8"
BG     = "#ffffff"
CARD   = "#ffffff"
BORDER = "#dddddd"
TEXT   = "#111111"
MUTED  = "#555555"

def style_ax(ax):
    ax.set_facecolor(CARD)
    ax.tick_params(colors=MUTED, labelsize=9)
    ax.xaxis.label.set_color(MUTED)
    ax.yaxis.label.set_color(MUTED)
    for spine in ax.spines.values():
        spine.set_edgecolor(BORDER)

def save(fig, name):
    path = OUTPUT_DIR / name
    fig.savefig(path, dpi=180, bbox_inches="tight", facecolor=BG)
    plt.close(fig)
    print(f"  Saved: {path}")


# ── 1. Portfolio Growth Curve ─────────────────────────────────────────────────
print("Generating Chart 1: Portfolio Growth Curve...")

returns_df = load_and_prepare_data("data/features.csv")
returns_df_sim = returns_df[(returns_df.index >= START) & (returns_df.index <= END)]

eq = equal_weight_portfolio(returns_df_sim)
mv = mean_variance_portfolio(returns_df_sim, lookback=60)

ppo_df = pd.read_csv("results/decision_log.csv")
ppo_df["date"] = pd.to_datetime(ppo_df["date"])
ppo_df = ppo_df[(ppo_df["date"] >= START) & (ppo_df["date"] <= END)].reset_index(drop=True)

def to_cumulative(returns_series):
    return (np.cumprod(1 + np.asarray(returns_series)) - 1) * 100

eq_cum  = to_cumulative(eq["returns"].values)
mv_cum  = to_cumulative(mv["returns"].values)
ppo_cum = to_cumulative(ppo_df["portfolio_return"].values)

dates = pd.to_datetime(ppo_df["date"].values)
n = min(len(dates), len(eq_cum), len(mv_cum), len(ppo_cum))

fig, ax = plt.subplots(figsize=(10, 5))
fig.patch.set_facecolor(BG)
style_ax(ax)

ax.plot(dates[:n], ppo_cum[:n], color=GOLD,  linewidth=2.2, label="PPO Agent (Scrooge.ai)", zorder=3)
ax.plot(dates[:n], eq_cum[:n],  color=GREEN, linewidth=1.6, label="Equal Weight",           zorder=2, alpha=0.8)
ax.plot(dates[:n], mv_cum[:n],  color=RED,   linewidth=1.6, label="Mean Variance",           zorder=2, alpha=0.8)

ax.axhline(0, color=BORDER, linewidth=0.8, linestyle="--")
ax.fill_between(dates[:n], ppo_cum[:n], 0, alpha=0.12, color=GOLD)

ax.set_title("Portfolio Growth — PPO Agent vs Classical Strategies", color=TEXT, fontsize=13, fontweight="bold", pad=14)
ax.set_ylabel("Cumulative Return (%)", color=MUTED, fontsize=10)
ax.set_xlabel("Date", color=MUTED, fontsize=10)

legend = ax.legend(facecolor=CARD, edgecolor=BORDER, labelcolor=TEXT, fontsize=9, loc="upper left")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"{x:+.1f}%"))

fig.tight_layout()
save(fig, "1_portfolio_growth.png")


# ── 2. Strategy Comparison Bar Chart ─────────────────────────────────────────
print("Generating Chart 2: Strategy Comparison...")

strategies = ["Mean Variance", "Equal Weight", "PPO Agent"]
returns_vals  = [-0.94,  9.56, 14.12]
sharpe_vals   = [-0.19,  1.12,  1.43]
drawdown_vals = [-6.08, -5.04, -6.03]
colors        = [RED, GREEN, GOLD]

fig, axes = plt.subplots(1, 3, figsize=(13, 5))
fig.patch.set_facecolor(BG)

metrics = [
    ("Total Return (%)",  returns_vals,  True),
    ("Sharpe Ratio",      sharpe_vals,   False),
    ("Max Drawdown (%)",  drawdown_vals, True),
]

for i, (ax, (title, vals, is_pct)) in enumerate(zip(axes, metrics)):
    style_ax(ax)
    bars = ax.bar(strategies, vals, color=colors, width=0.5, zorder=2)
    ax.set_facecolor(CARD)
    ax.set_title(title, color=TEXT, fontsize=11, fontweight="bold", pad=10)
    ax.set_xticks(range(len(strategies)))
    ax.set_xticklabels(strategies, color=MUTED, fontsize=8.5, rotation=10)
    ax.axhline(0, color=BORDER, linewidth=0.8)
    ax.grid(axis="y", color=BORDER, linewidth=0.5, alpha=0.5)

    for bar, val in zip(bars, vals):
        label = f"{val:+.2f}%" if is_pct else f"{val:.2f}"
        ypos = val + (0.3 if val >= 0 else -0.8)
        ax.text(bar.get_x() + bar.get_width() / 2, ypos, label,
                ha="center", va="bottom", color=TEXT, fontsize=9, fontweight="bold")

fig.suptitle("Performance Analysis — Same Period (Apr 2011 – Jul 2012)", color=TEXT, fontsize=13, fontweight="bold", y=1.02)
fig.tight_layout()
save(fig, "2_strategy_comparison.png")


# ── 3. XAI Feature Importance ────────────────────────────────────────────────
print("Generating Chart 3: XAI Feature Importance...")

features    = ["Volatility", "MA Ratio", "Returns", "Regime"]
importance  = [32, 32, 31, 5]
feat_colors = [GOLD, GREEN, BLUE, PINK]

fig, ax = plt.subplots(figsize=(8, 4.5))
fig.patch.set_facecolor(BG)
style_ax(ax)

bars = ax.barh(features, importance, color=feat_colors, height=0.5, zorder=2)
ax.set_facecolor(CARD)
ax.set_title("XAI — Feature Importance Across Decisions", color=TEXT, fontsize=13, fontweight="bold", pad=14)
ax.set_xlabel("Influence (%)", color=MUTED, fontsize=10)
ax.set_xlim(0, 45)
ax.grid(axis="x", color=BORDER, linewidth=0.5, alpha=0.5)
ax.invert_yaxis()

for bar, val, color in zip(bars, importance, feat_colors):
    ax.text(val + 0.8, bar.get_y() + bar.get_height() / 2,
            f"{val}%", va="center", color=color, fontsize=11, fontweight="bold")

for feat, val, color in zip(features, importance, feat_colors):
    ax.text(-0.5, features.index(feat), feat, ha="right", va="center",
            color=TEXT, fontsize=10)

ax.set_yticks([])
fig.tight_layout()
save(fig, "3_xai_importance.png")


# ── 4. Asset Allocation Pie ───────────────────────────────────────────────────
print("Generating Chart 4: Final Asset Allocation...")

assets = ["Bond", "Equity", "Defensive", "Commodity"]
alloc  = [44, 34, 23, 0]
colors_pie = [GOLD, RED, GREEN, MUTED]

# Filter out zero allocations for cleaner pie
non_zero = [(a, v, c) for a, v, c in zip(assets, alloc, colors_pie) if v > 0]
labels_nz = [x[0] for x in non_zero]
vals_nz   = [x[1] for x in non_zero]
cols_nz   = [x[2] for x in non_zero]

fig, ax = plt.subplots(figsize=(7, 5))
fig.patch.set_facecolor(BG)
ax.set_facecolor(BG)

wedges, texts, autotexts = ax.pie(
    vals_nz, labels=None, colors=cols_nz,
    autopct="%1.0f%%", startangle=140,
    pctdistance=0.75,
    wedgeprops={"linewidth": 2, "edgecolor": BG}
)

for at in autotexts:
    at.set_color(BG)
    at.set_fontsize(12)
    at.set_fontweight("bold")

legend_patches = [mpatches.Patch(color=c, label=l) for l, c in zip(labels_nz, cols_nz)]
ax.legend(handles=legend_patches, facecolor=CARD, edgecolor=BORDER,
          labelcolor=TEXT, fontsize=10, loc="lower right")

ax.set_title("Final Asset Allocation — PPO Agent", color=TEXT, fontsize=13, fontweight="bold", pad=14)
fig.tight_layout()
save(fig, "4_asset_allocation.png")


print("\nAll charts saved to results/charts/")
print("Files:")
for f in sorted(OUTPUT_DIR.glob("*.png")):
    print(f"  {f.name}")
