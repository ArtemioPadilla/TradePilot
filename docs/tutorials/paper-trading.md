# Paper Trading with Alpaca

This tutorial shows you how to deploy a TradePilot strategy to Alpaca's paper
trading environment. Paper trading uses real market data with simulated money,
so you can validate your strategy without risking capital.

## Prerequisites

- A free Alpaca account (paper trading is free)
- TradePilot installed (`pip install -e .`)
- A strategy you've already backtested (see {doc}`quickstart`)

## Step 1: Create an Alpaca Paper Trading Account

1. Sign up at [alpaca.markets](https://alpaca.markets).
2. Navigate to the **Paper Trading** section in your dashboard.
3. Generate API keys (Key ID and Secret Key).

:::{warning}
Never commit API keys to version control. Always use environment variables.
:::

## Step 2: Configure Environment Variables

Set your Alpaca credentials as environment variables:

```bash
export ALPACA_KEY_ID="your-paper-key-id"
export ALPACA_SECRET_KEY="your-paper-secret-key"
```

For persistent configuration, add these to your shell profile (`~/.bashrc`,
`~/.zshrc`, etc.).

## Step 3: Verify Configuration

```python
from tradepilot import is_configured, validate_config

# Quick check
print(f"Alpaca configured: {is_configured()}")

# Detailed validation (raises ValueError if misconfigured)
validate_config("alpaca")
```

## Step 4: Check Your Account

```python
from tradepilot import BrokerAPI

broker = BrokerAPI("alpaca", use_paper=True)

account = broker.get_account()
print(f"Account status: {account['status']}")
print(f"Buying power:   ${float(account['buying_power']):,.2f}")
print(f"Portfolio value: ${float(account['portfolio_value']):,.2f}")
```

## Step 5: Define Your Strategy

Use the same strategy function you backtested:

```python
def momentum_strategy(prices):
    """Select assets with highest recent price momentum."""
    t = 10
    momentum = prices.iloc[-1] - prices.iloc[-t]
    return list(momentum.sort_values(ascending=False).index)
```

## Step 6: Fetch Live Data

```python
from tradepilot import MarketData

md = MarketData()
universe = md.get_historical_data(
    ["AAPL", "MSFT", "GOOGL", "AMZN", "META"],
    start="2023-01-01",
    end="2024-01-01",
)
```

## Step 7: Launch the Live Trader

The `TPT` (Trade Pilot Trader) class runs a continuous loop that rebalances
your portfolio at the specified interval.

```python
from tradepilot import TPT

trader = TPT(
    broker_api="alpaca",
    universe=universe,
    strategy=momentum_strategy,
    capital=100_000,
    risk_free=0.04,
    rebalance_interval=60 * 60 * 24 * 7,  # rebalance weekly (seconds)
)

# This runs until you press Ctrl+C
trader.run()
```

The trader handles graceful shutdown: pressing `Ctrl+C` or sending `SIGTERM`
stops the loop after the current cycle finishes.

## Step 8: Monitor Positions

While the trader is running (or after it stops), check your positions:

```python
broker = BrokerAPI("alpaca", use_paper=True)

positions = broker.get_positions()
for pos in positions:
    print(f"{pos['symbol']}: {pos['qty']} shares @ ${float(pos['avg_entry_price']):.2f}")
```

## Step 9: Execute a Single Trade (Manual)

You can also execute individual trades for testing:

```python
broker = BrokerAPI("alpaca", use_paper=True)

# Buy 10 shares of AAPL
result = broker.execute_trade("AAPL", amount=10, side="buy")
print(f"Order ID: {result['id']}")
print(f"Status:   {result['status']}")

# Sell 5 shares of AAPL
result = broker.execute_trade("AAPL", amount=5, side="sell")
print(f"Order ID: {result['id']}")
print(f"Status:   {result['status']}")
```

## Safety Checklist Before Real Money

Before switching from paper to live trading, verify:

- [ ] **Backtest is profitable** -- Your strategy shows positive returns over
  multiple time periods, not just one lucky window.
- [ ] **Paper trading matches expectations** -- Live paper results roughly match
  your backtest. Large discrepancies indicate data issues or overfitting.
- [ ] **Risk controls are in place** -- Set `max_weight` and `min_weight` in TPS
  to prevent over-concentration in a single asset.
- [ ] **You understand the costs** -- Real trading has commissions, slippage, and
  market impact that paper trading doesn't fully capture.
- [ ] **Start small** -- Begin with a fraction of your intended capital.
- [ ] **Monitor actively** -- Check positions daily for the first few weeks.

:::{danger}
Switching to live trading uses real money. TradePilot's `BrokerAPI` defaults to
`use_paper=True` for safety. To trade with real money, you must explicitly set
`use_paper=False`. Do this only after thorough testing.
:::

## Logging

TradePilot logs trading activity to `pmt.log`. Monitor this file for errors:

```bash
tail -f pmt.log
```

## Next Steps

- {doc}`optimization` -- Tune your portfolio weights before going live.
- {doc}`custom-strategy` -- Build a more sophisticated strategy.
