# Getting Started

This guide will help you get started with TradePilot for backtesting and live trading.

## Installation

```bash
# Clone the repository
git clone https://github.com/aspadillar/TradePilot.git
cd TradePilot

# Install in development mode
pip install -e .

# Or install dependencies only
pip install -r requirements.txt
```

## Quick Start: Backtesting

```python
from tradepilot.backtest import Backtest
from tradepilot.data import MarketData
from strategies.momentum import momentum_strategy

# Retrieve historical data
market_data = MarketData()
universe = market_data.get_historical_data("AAPL", "2020-01-01", "2024-01-01")

# Set up and run the backtest
backtest = Backtest(
    universe=universe,
    strategy=momentum_strategy,
    initial_capital=10000,
    risk_free=0.02
)
backtest.run(start="2020-01-01", end="2024-01-01")
results = backtest.evaluate()

print("Backtest Results:")
for key, value in results.items():
    print(f"{key}: {value}")
```

## Quick Start: Live Trading

```{warning}
Ensure you have valid broker credentials and use paper trading first.
```

```python
from tradepilot.trader import TPT
from tradepilot.data import MarketData
from strategies.momentum import momentum_strategy

# Retrieve recent data
market_data = MarketData()
universe = market_data.get_historical_data("AAPL", "2023-01-01", "2024-01-01")

# Set up live trading
trader = TPT(
    broker_api="alpaca",
    universe=universe,
    strategy=momentum_strategy,
    capital=10000,
    risk_free=0.02
)

# Start trading (runs indefinitely)
trader.run()
```

## Key Concepts

### TPS (Trade Pilot Simulator)
The core simulation engine for backtesting. It handles:
- Portfolio management
- Rebalancing logic
- Performance tracking

### TPT (TradePilot Trader)
The live trading module that:
- Connects to broker APIs (Alpaca)
- Executes trades in real-time
- Manages positions

### Strategies
Strategies define how assets are selected and weighted:
- **Momentum**: Select assets based on recent price performance
- **Mean Reversion**: Select oversold assets below moving average
- **Smart Beta**: Rank by Sharpe ratio

### Optimization
Portfolio weight optimization techniques:
- **MSR**: Maximum Sharpe Ratio
- **GMV**: Global Minimum Variance
- **Equal Weight**: Simple equal allocation

## Next Steps

- Read the [Backtesting Guide](guides/backtesting.md) for detailed backtest configuration
- Learn about [Custom Strategies](guides/strategies.md)
- Explore the [API Reference](api/modules.rst) for all available functions
