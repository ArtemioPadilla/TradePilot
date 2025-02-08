# examples/example_backtest.py
from tradepilot.backtest import Backtest
from tradepilot.data import MarketData
from strategies.momentum import momentum_strategy

# Retrieve historical data for an asset (e.g., AAPL)
market_data = MarketData()
# For demonstration, we use a single asset; in real applications, use a DataFrame of multiple assets.
universe = market_data.get_historical_data("AAPL", "2020-01-01", "2024-01-01")

# Set up the backtest with the momentum strategy
backtest = Backtest(universe, momentum_strategy, initial_capital=10000, risk_free=0.02)
backtest.run(start="2020-01-01", end="2024-01-01")
results = backtest.evaluate()

print("Backtest Metrics:")
for key, value in results.items():
    print(f"{key}: {value}")
