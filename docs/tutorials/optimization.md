# Portfolio Optimization

This tutorial compares TradePilot's three optimization techniques and helps you
choose the right one for your goals.

## The Three Optimizers

TradePilot provides three portfolio optimization methods:

| Method | Function | Goal |
|--------|----------|------|
| **Max Sharpe Ratio (MSR)** | `msr()` | Maximize risk-adjusted return |
| **Global Minimum Variance (GMV)** | `gmv()` | Minimize portfolio volatility |
| **Equal Weight (EW)** | `eq_weighted()` | Simple 1/N allocation |

## Setup

```python
from tradepilot import MarketData, OpenData, Backtest

md = MarketData()
universe = md.get_historical_data(
    ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "JPM", "V", "JNJ"],
    start="2021-01-01",
    end="2023-12-31",
)

od = OpenData()
risk_free = od.get_risk_free_rate(start="2021-01-01", end="2023-12-31")

def momentum_strategy(prices, t=10):
    momentum = prices.iloc[-1] - prices.iloc[-t]
    return list(momentum.sort_values(ascending=False).index)
```

## Run All Three Optimizers

```python
results = {}
metrics = {}

for opt in ["MSR", "GMV", "EW"]:
    bt = Backtest(
        universe=universe,
        strategy=momentum_strategy,
        initial_capital=100_000,
        risk_free=risk_free,
        rebalance_freq="W-MON",
        n_stocks=5,
        opt_tech=opt,
    )
    results[opt] = bt.run(start="2022-01-01", end="2023-12-31")
    metrics[opt] = bt.evaluate()
```

## Compare Results

```python
import pandas as pd

comparison = pd.DataFrame(metrics).T
print(comparison.to_string(float_format="{:.4f}".format))
```

Example output:

```text
     Annual Return  Sharpe Ratio  Max Drawdown
MSR         0.1523        0.9120     -0.1280
GMV         0.0987        0.7650     -0.0890
EW          0.1150        0.8200     -0.1050
```

## Visualize the Comparison

```python
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(10, 5))
for opt, vals in results.items():
    vals.plot(ax=ax, label=opt)
ax.set_title("Optimizer Comparison: Same Strategy, Different Weights")
ax.set_ylabel("Portfolio Value ($)")
ax.set_xlabel("Date")
ax.legend()
plt.tight_layout()
plt.show()
```

## Understanding the Optimizers

### Max Sharpe Ratio (MSR)

MSR maximizes the Sharpe ratio by solving:

```
maximize  (portfolio_return - risk_free_rate) / portfolio_volatility
```

It finds weights that give the best return per unit of risk. This tends to
concentrate weights in high-performing assets.

```python
from tradepilot import msr, get_returns, annualize_returns
import numpy as np

prices = universe[["AAPL", "MSFT", "GOOGL", "AMZN", "META"]].dropna()
returns = get_returns(prices)
cov = returns.cov()
exp_rets = annualize_returns(returns)

weights_msr = msr(0.04, exp_rets, cov)
for stock, w in zip(prices.columns, weights_msr):
    print(f"  {stock}: {w:.2%}")
```

### Global Minimum Variance (GMV)

GMV ignores expected returns entirely and minimizes portfolio variance:

```
minimize  w^T * Cov * w
```

This is the most conservative approach and works well when return estimates are
unreliable.

```python
from tradepilot import gmv

weights_gmv = gmv(cov)
for stock, w in zip(prices.columns, weights_gmv):
    print(f"  {stock}: {w:.2%}")
```

### Equal Weight (EW)

Equal weight assigns 1/N to each asset. No optimization is performed.

```python
from tradepilot import eq_weighted

weights_ew = eq_weighted(exp_rets)
for stock, w in zip(prices.columns, weights_ew):
    print(f"  {stock}: {w:.2%}")
```

## Choosing an Optimizer

| Scenario | Recommended | Why |
|----------|-------------|-----|
| Strong conviction in return forecasts | MSR | Exploits return predictions |
| Uncertain about returns | GMV | Ignores returns, focuses on risk |
| Quick baseline / simple deployment | EW | No estimation error, easy to explain |
| High-volatility universe | GMV | Controls downside risk |
| Diversified large-cap universe | MSR | Stable covariance estimates |

:::{tip}
Start with Equal Weight as a baseline. If MSR or GMV consistently beat it out of
sample, adopt the better optimizer. If they don't, the simpler approach wins.
:::

## Next Steps

- {doc}`custom-strategy` -- Build a custom ranking strategy to pair with your optimizer.
- {doc}`paper-trading` -- Take your optimized portfolio live with Alpaca.
