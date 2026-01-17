# Backtesting Guide

This guide covers how to run comprehensive backtests with TradePilot.

## Basic Backtest

```python
from tradepilot.backtest import Backtest
from tradepilot.data import MarketData

# Retrieve historical data
market_data = MarketData()
universe = market_data.get_historical_data("AAPL", "2020-01-01", "2024-01-01")

# Define a simple strategy
def my_strategy(data):
    """Equal weight strategy."""
    symbols = data.columns.tolist()
    return {symbol: 1.0 / len(symbols) for symbol in symbols}

# Create and run backtest
backtest = Backtest(
    universe=universe,
    strategy=my_strategy,
    initial_capital=100000,
    risk_free=0.02
)

backtest.run(start="2020-01-01", end="2024-01-01")
results = backtest.evaluate()
```

## Multi-Asset Backtest

```python
# Get data for multiple assets
tickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "META"]
universe = market_data.get_historical_data(tickers, "2020-01-01", "2024-01-01")

# Momentum strategy
def momentum_strategy(data, lookback=20, top_n=3):
    """Select top N performers by momentum."""
    returns = data.pct_change(lookback).iloc[-1]
    top_symbols = returns.nlargest(top_n).index.tolist()
    weight = 1.0 / top_n
    return {symbol: weight if symbol in top_symbols else 0 for symbol in data.columns}

backtest = Backtest(
    universe=universe,
    strategy=lambda data: momentum_strategy(data, lookback=20, top_n=3),
    initial_capital=100000
)
```

## Backtest Configuration

### Rebalancing Frequency

```python
backtest = Backtest(
    universe=universe,
    strategy=my_strategy,
    rebalance_frequency="monthly",  # daily, weekly, monthly, quarterly
    initial_capital=100000
)
```

### Transaction Costs

```python
backtest = Backtest(
    universe=universe,
    strategy=my_strategy,
    transaction_cost=0.001,  # 0.1% per trade
    slippage=0.0005,         # 0.05% slippage
    initial_capital=100000
)
```

## Analyzing Results

The `evaluate()` method returns comprehensive metrics:

```python
results = backtest.evaluate()

print(f"Total Return: {results['total_return']:.2%}")
print(f"Annualized Return: {results['annualized_return']:.2%}")
print(f"Sharpe Ratio: {results['sharpe_ratio']:.2f}")
print(f"Sortino Ratio: {results['sortino_ratio']:.2f}")
print(f"Max Drawdown: {results['max_drawdown']:.2%}")
print(f"Calmar Ratio: {results['calmar_ratio']:.2f}")
print(f"Win Rate: {results['win_rate']:.2%}")
```

## Equity Curve Visualization

```python
import matplotlib.pyplot as plt

equity_curve = backtest.get_equity_curve()
plt.figure(figsize=(12, 6))
plt.plot(equity_curve.index, equity_curve.values)
plt.title("Portfolio Equity Curve")
plt.xlabel("Date")
plt.ylabel("Portfolio Value")
plt.show()
```

## Comparing Strategies

```python
strategies = {
    "Momentum": momentum_strategy,
    "Equal Weight": equal_weight_strategy,
    "Mean Reversion": mean_reversion_strategy,
}

results = {}
for name, strategy in strategies.items():
    bt = Backtest(universe=universe, strategy=strategy, initial_capital=100000)
    bt.run(start="2020-01-01", end="2024-01-01")
    results[name] = bt.evaluate()

# Compare Sharpe ratios
for name, res in results.items():
    print(f"{name}: Sharpe = {res['sharpe_ratio']:.2f}")
```

## Next Steps

- Learn about [optimization techniques](optimization.md)
- Create [custom strategies](strategies.md)
- Set up [live trading](live-trading.md)
