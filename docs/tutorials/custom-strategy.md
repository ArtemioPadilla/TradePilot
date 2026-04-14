# Building a Custom Strategy

This tutorial walks you through creating a custom trading strategy from scratch,
backtesting it, and analyzing the results.

## How Strategies Work in TradePilot

A strategy in TradePilot is a plain Python function that:

1. Receives a `pd.DataFrame` of historical prices (datetime index, asset symbols as columns).
2. Returns an ordered list of asset symbols (best first).

TradePilot then selects the top N symbols and optimizes portfolio weights using
your chosen optimization technique (MaxSharpe, MinVariance, or EqualWeight).

## Step 1: Create a Mean-Reversion Strategy

Mean reversion assumes that assets trading below their moving average are likely
to revert upward. We select the most "oversold" assets.

```python
import pandas as pd

def mean_reversion_strategy(prices, window=20):
    """
    Select assets that are furthest below their moving average.

    Assets trading below their moving average are considered oversold
    and are ranked by how far below the average they are.
    """
    moving_avg = prices.rolling(window=window).mean()

    # Ratio of current price to moving average (lower = more oversold)
    ratio = prices.iloc[-1] / moving_avg.iloc[-1]

    # Sort ascending: most oversold first
    return list(ratio.sort_values(ascending=True).index)
```

## Step 2: Fetch Data

```python
from tradepilot import MarketData, OpenData

md = MarketData()
universe = md.get_historical_data(
    ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "JPM", "V", "JNJ"],
    start="2021-01-01",
    end="2023-12-31",
)

od = OpenData()
risk_free = od.get_risk_free_rate(start="2021-01-01", end="2023-12-31")
```

## Step 3: Backtest the Strategy

```python
from tradepilot import Backtest

bt = Backtest(
    universe=universe,
    strategy=mean_reversion_strategy,
    initial_capital=100_000,
    risk_free=risk_free,
    rebalance_freq="W-MON",
    n_stocks=5,
    opt_tech="MSR",
)

results = bt.run(start="2022-01-01", end="2023-12-31")
```

## Step 4: Analyze Results

```python
metrics = bt.evaluate()
for name, value in metrics.items():
    print(f"{name}: {value:.4f}")
```

## Step 5: Compare Against Momentum

Run the same backtest with a momentum strategy and compare:

```python
def momentum_strategy(prices, t=10):
    """Select assets with highest recent momentum."""
    momentum = prices.iloc[-1] - prices.iloc[-t]
    return list(momentum.sort_values(ascending=False).index)

bt_momentum = Backtest(
    universe=universe,
    strategy=momentum_strategy,
    initial_capital=100_000,
    risk_free=risk_free,
    rebalance_freq="W-MON",
    n_stocks=5,
    opt_tech="MSR",
)

results_momentum = bt_momentum.run(start="2022-01-01", end="2023-12-31")
metrics_momentum = bt_momentum.evaluate()

print("\n--- Mean Reversion ---")
for k, v in metrics.items():
    print(f"  {k}: {v:.4f}")

print("\n--- Momentum ---")
for k, v in metrics_momentum.items():
    print(f"  {k}: {v:.4f}")
```

## Step 6: Visualize Both Strategies

```python
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(10, 5))
results.plot(ax=ax, label="Mean Reversion")
results_momentum.plot(ax=ax, label="Momentum")
ax.set_title("Strategy Comparison")
ax.set_ylabel("Portfolio Value ($)")
ax.set_xlabel("Date")
ax.legend()
plt.tight_layout()
plt.show()
```

## Strategy Design Tips

**Keep it simple.** Start with a clear hypothesis (e.g., "oversold stocks bounce back")
and express it in as few lines as possible. Complex strategies are harder to debug and
more prone to overfitting.

**Use enough history.** Your strategy function receives all prices up to the current
date. Make sure your lookback window (moving average, momentum period) doesn't exceed
the available data.

**Return all assets.** Your function should return all symbols in ranked order, not just
the ones you want to buy. TradePilot handles the top-N selection.

## Next Steps

- {doc}`optimization` -- Compare optimization techniques for weight allocation.
- {doc}`paper-trading` -- Deploy your strategy with real market data.
