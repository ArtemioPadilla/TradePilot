# Portfolio Optimization Guide

Learn how to optimize portfolio weights using TradePilot's optimization module.

## Optimization Methods

TradePilot supports several portfolio optimization techniques:

| Method | Description | Use Case |
|--------|-------------|----------|
| MSR | Maximum Sharpe Ratio | Best risk-adjusted returns |
| GMV | Global Minimum Variance | Lowest volatility |
| Equal Weight | 1/N allocation | Simple baseline |
| Risk Parity | Equal risk contribution | Balanced risk |

## Maximum Sharpe Ratio (MSR)

```python
from tradepilot.optimization import optimize_portfolio

# Get historical returns
returns = prices.pct_change().dropna()

# Optimize for maximum Sharpe ratio
weights = optimize_portfolio(
    returns=returns,
    method="msr",
    risk_free_rate=0.02
)

print("Optimal Weights:")
for symbol, weight in weights.items():
    print(f"  {symbol}: {weight:.2%}")
```

## Global Minimum Variance (GMV)

```python
# Minimize portfolio volatility
weights = optimize_portfolio(
    returns=returns,
    method="gmv"
)
```

## With Constraints

```python
# Add weight constraints
weights = optimize_portfolio(
    returns=returns,
    method="msr",
    min_weight=0.05,    # Minimum 5% per asset
    max_weight=0.40,    # Maximum 40% per asset
    risk_free_rate=0.02
)
```

## Risk Parity

```python
weights = optimize_portfolio(
    returns=returns,
    method="risk_parity",
    target_volatility=0.15  # 15% annual volatility target
)
```

## Using in Backtests

Combine optimization with backtesting:

```python
from tradepilot.backtest import Backtest
from tradepilot.optimization import optimize_portfolio

def optimized_momentum_strategy(data, lookback=60, top_n=10):
    """
    Select assets by momentum, then optimize weights.
    """
    # Step 1: Select assets by momentum
    returns = data.pct_change()
    momentum = returns.rolling(lookback).mean().iloc[-1]
    top_symbols = momentum.nlargest(top_n).index.tolist()

    # Step 2: Optimize weights for selected assets
    selected_returns = returns[top_symbols].tail(lookback)
    optimal_weights = optimize_portfolio(
        returns=selected_returns,
        method="msr",
        min_weight=0.05,
        max_weight=0.30
    )

    # Return full weight dictionary
    return {s: optimal_weights.get(s, 0) for s in data.columns}

# Run backtest
backtest = Backtest(
    universe=data,
    strategy=optimized_momentum_strategy,
    initial_capital=100000,
    rebalance_frequency="monthly"
)
backtest.run(start="2020-01-01", end="2024-01-01")
```

## Efficient Frontier

Visualize the risk-return tradeoff:

```python
from tradepilot.optimization import compute_efficient_frontier
import matplotlib.pyplot as plt

# Compute frontier
frontier = compute_efficient_frontier(
    returns=returns,
    n_portfolios=100,
    risk_free_rate=0.02
)

# Plot
plt.figure(figsize=(10, 6))
plt.scatter(frontier['volatility'], frontier['return'], c=frontier['sharpe'], cmap='viridis')
plt.colorbar(label='Sharpe Ratio')
plt.xlabel('Volatility (Annualized)')
plt.ylabel('Return (Annualized)')
plt.title('Efficient Frontier')

# Mark optimal portfolio
optimal_idx = frontier['sharpe'].idxmax()
plt.scatter(
    frontier.loc[optimal_idx, 'volatility'],
    frontier.loc[optimal_idx, 'return'],
    marker='*', s=200, c='red', label='Max Sharpe'
)
plt.legend()
plt.show()
```

## Custom Objective Functions

For advanced users, define custom optimization objectives:

```python
from scipy.optimize import minimize
import numpy as np

def custom_optimize(returns, target_return=0.10):
    """
    Minimize volatility subject to target return.
    """
    n_assets = len(returns.columns)
    mean_returns = returns.mean() * 252
    cov_matrix = returns.cov() * 252

    def portfolio_volatility(weights):
        return np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))

    def portfolio_return(weights):
        return np.dot(weights, mean_returns)

    constraints = [
        {'type': 'eq', 'fun': lambda w: np.sum(w) - 1},  # Weights sum to 1
        {'type': 'eq', 'fun': lambda w: portfolio_return(w) - target_return}  # Target return
    ]

    bounds = [(0, 1) for _ in range(n_assets)]
    initial_weights = np.ones(n_assets) / n_assets

    result = minimize(
        portfolio_volatility,
        initial_weights,
        method='SLSQP',
        bounds=bounds,
        constraints=constraints
    )

    return dict(zip(returns.columns, result.x))
```

## Performance Metrics

After optimization, evaluate portfolio metrics:

```python
from tradepilot.metrics import calculate_metrics

# Calculate portfolio returns with optimal weights
portfolio_returns = (returns * pd.Series(weights)).sum(axis=1)

metrics = calculate_metrics(
    returns=portfolio_returns,
    risk_free_rate=0.02
)

print(f"Annualized Return: {metrics['annualized_return']:.2%}")
print(f"Annualized Volatility: {metrics['volatility']:.2%}")
print(f"Sharpe Ratio: {metrics['sharpe_ratio']:.2f}")
print(f"Max Drawdown: {metrics['max_drawdown']:.2%}")
```

## Next Steps

- Apply optimization in [backtests](backtesting.md)
- Create [custom strategies](strategies.md)
- Deploy to [live trading](live-trading.md)
