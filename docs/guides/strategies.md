# Custom Strategies Guide

Learn how to create and configure trading strategies with TradePilot.

## Strategy Function Signature

A strategy is a function that takes price data and returns portfolio weights:

```python
def my_strategy(data: pd.DataFrame) -> dict[str, float]:
    """
    Args:
        data: DataFrame with dates as index, symbols as columns, prices as values

    Returns:
        Dictionary mapping symbols to portfolio weights (should sum to 1.0)
    """
    weights = {}
    # Your logic here
    return weights
```

## Built-in Strategies

### Equal Weight

```python
from strategies.equal_weight import equal_weight_strategy

# Allocates equally across all assets
weights = equal_weight_strategy(data)
# {"AAPL": 0.2, "MSFT": 0.2, "GOOGL": 0.2, "AMZN": 0.2, "META": 0.2}
```

### Momentum

```python
from strategies.momentum import momentum_strategy

def momentum_strategy(data, lookback=20, top_n=5):
    """
    Select top N assets by price momentum.

    Args:
        data: Price DataFrame
        lookback: Period for momentum calculation
        top_n: Number of assets to hold
    """
    returns = data.pct_change(lookback).iloc[-1]
    top_symbols = returns.nlargest(top_n).index
    weight = 1.0 / top_n
    return {s: weight if s in top_symbols else 0 for s in data.columns}
```

### Mean Reversion

```python
def mean_reversion_strategy(data, ma_period=50, deviation_threshold=0.05, top_n=5):
    """
    Select oversold assets trading below their moving average.

    Args:
        data: Price DataFrame
        ma_period: Moving average period
        deviation_threshold: Minimum deviation below MA
        top_n: Number of assets to hold
    """
    current_prices = data.iloc[-1]
    moving_avg = data.rolling(ma_period).mean().iloc[-1]
    deviation = (current_prices - moving_avg) / moving_avg

    # Select most oversold
    oversold = deviation[deviation < -deviation_threshold]
    selected = oversold.nsmallest(top_n).index

    if len(selected) == 0:
        return {s: 1.0 / len(data.columns) for s in data.columns}

    weight = 1.0 / len(selected)
    return {s: weight if s in selected else 0 for s in data.columns}
```

### Smart Beta (Sharpe-based)

```python
def smart_beta_strategy(data, lookback=252, top_n=10):
    """
    Rank assets by historical Sharpe ratio.
    """
    returns = data.pct_change().dropna()

    sharpe_ratios = {}
    for symbol in data.columns:
        ret = returns[symbol].tail(lookback)
        sharpe_ratios[symbol] = ret.mean() / ret.std() * (252 ** 0.5)

    sorted_symbols = sorted(sharpe_ratios.items(), key=lambda x: x[1], reverse=True)
    top_symbols = [s for s, _ in sorted_symbols[:top_n]]

    weight = 1.0 / top_n
    return {s: weight if s in top_symbols else 0 for s in data.columns}
```

## Strategy with Parameters

Create configurable strategies using closures:

```python
def create_momentum_strategy(lookback=20, top_n=5, min_weight=0.05, max_weight=0.40):
    """Factory function for configurable momentum strategy."""

    def strategy(data):
        returns = data.pct_change(lookback).iloc[-1]
        top_symbols = returns.nlargest(top_n).index

        # Base equal weight
        base_weight = 1.0 / top_n

        # Apply constraints
        weight = max(min_weight, min(max_weight, base_weight))

        weights = {}
        total = 0
        for s in data.columns:
            if s in top_symbols:
                weights[s] = weight
                total += weight
            else:
                weights[s] = 0

        # Normalize
        if total > 0:
            weights = {s: w / total for s, w in weights.items()}

        return weights

    return strategy

# Usage
my_momentum = create_momentum_strategy(lookback=30, top_n=3, max_weight=0.5)
```

## Strategy with State

For strategies that need to track state across rebalances:

```python
class StatefulStrategy:
    def __init__(self, lookback=20):
        self.lookback = lookback
        self.previous_weights = {}
        self.trade_count = 0

    def __call__(self, data):
        returns = data.pct_change(self.lookback).iloc[-1]
        top_symbols = returns.nlargest(5).index

        new_weights = {}
        for s in data.columns:
            if s in top_symbols:
                new_weights[s] = 0.2
            else:
                new_weights[s] = 0

        # Track trades
        for s, w in new_weights.items():
            if w != self.previous_weights.get(s, 0):
                self.trade_count += 1

        self.previous_weights = new_weights.copy()
        return new_weights

# Usage
strategy = StatefulStrategy(lookback=30)
backtest = Backtest(universe=data, strategy=strategy)
```

## Combining Strategies

```python
def combined_strategy(data, strategies, weights):
    """
    Combine multiple strategies with specified weights.

    Args:
        data: Price DataFrame
        strategies: List of strategy functions
        weights: List of strategy weights (should sum to 1.0)
    """
    combined_weights = {s: 0 for s in data.columns}

    for strategy, strat_weight in zip(strategies, weights):
        strat_weights = strategy(data)
        for symbol, w in strat_weights.items():
            combined_weights[symbol] += w * strat_weight

    return combined_weights

# Usage
momentum = create_momentum_strategy(lookback=20, top_n=5)
mean_rev = mean_reversion_strategy

combined = lambda data: combined_strategy(
    data,
    strategies=[momentum, mean_rev],
    weights=[0.6, 0.4]
)
```

## Next Steps

- Learn about [portfolio optimization](optimization.md)
- Run [backtests](backtesting.md) with your strategies
- Deploy to [live trading](live-trading.md)
