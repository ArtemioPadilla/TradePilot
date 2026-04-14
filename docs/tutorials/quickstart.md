# Quickstart: Your First Backtest

This tutorial gets you from zero to a working backtest in under 5 minutes.

## Install TradePilot

```bash
pip install -e .
```

Or install dependencies only:

```bash
pip install -r requirements.txt
```

## Fetch Market Data

TradePilot pulls historical prices from Yahoo Finance via the `MarketData` class.

```python
from tradepilot import MarketData

md = MarketData()
universe = md.get_historical_data(
    ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "JPM", "V", "JNJ"],
    start="2022-01-01",
    end="2023-12-31",
)
print(universe.head())
```

## Get the Risk-Free Rate

The `OpenData` class fetches the 13-week U.S. Treasury Bill rate:

```python
from tradepilot import OpenData

od = OpenData()
risk_free = od.get_risk_free_rate(start="2022-01-01", end="2023-12-31")
print(risk_free.head())
```

## Define a Momentum Strategy

A strategy function receives a DataFrame of prices and returns an ordered list of
symbols. TradePilot ships with `momentum_ranking`, but you can write your own:

```python
def my_momentum_strategy(prices):
    """Select assets with highest recent price momentum."""
    t = 10  # look back 10 periods
    momentum = prices.iloc[-1] - prices.iloc[-t]
    return list(momentum.sort_values(ascending=False).index)
```

## Run the Backtest

```python
from tradepilot import Backtest

bt = Backtest(
    universe=universe,
    strategy=my_momentum_strategy,
    initial_capital=100_000,
    risk_free=risk_free,
    rebalance_freq="W-MON",
    n_stocks=5,
    opt_tech="MSR",
)

results = bt.run(start="2022-06-01", end="2023-12-31")
print(results.tail())
```

## Evaluate Performance

```python
metrics = bt.evaluate()
for name, value in metrics.items():
    print(f"{name}: {value:.4f}")
```

Output will look like:

```text
Annual Return: 0.1234
Sharpe Ratio: 0.8765
Max Drawdown: -0.1500
```

## Plot the Results

```python
import matplotlib.pyplot as plt

results.plot(title="Portfolio Value Over Time", figsize=(10, 5))
plt.ylabel("Portfolio Value ($)")
plt.xlabel("Date")
plt.tight_layout()
plt.show()
```

## Next Steps

- {doc}`custom-strategy` -- Build your own ranking and optimization strategy.
- {doc}`optimization` -- Compare MaxSharpe, MinVariance, and EqualWeight.
- {doc}`paper-trading` -- Go live with Alpaca paper trading.
