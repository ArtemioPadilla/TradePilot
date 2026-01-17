# Live Trading Guide

This guide covers setting up and running live trading with TradePilot.

```{warning}
Live trading involves real money. Always start with paper trading to validate your strategy.
```

## Prerequisites

1. Alpaca brokerage account
2. API credentials (key and secret)
3. Tested and validated strategy

## Setting Up Alpaca

### 1. Create Account

Visit [Alpaca](https://alpaca.markets/) and create an account. Start with a paper trading account.

### 2. Generate API Keys

From your Alpaca dashboard:
1. Navigate to API Keys
2. Generate a new API key pair
3. Store credentials securely

### 3. Configure Environment

```bash
# For paper trading
export ALPACA_API_KEY="your-api-key"
export ALPACA_SECRET_KEY="your-secret-key"
export ALPACA_BASE_URL="https://paper-api.alpaca.markets"

# For live trading (use with caution)
export ALPACA_BASE_URL="https://api.alpaca.markets"
```

## Basic Live Trading Setup

```python
from tradepilot.trader import TPT
from tradepilot.data import MarketData
from strategies.momentum import momentum_strategy

# Get recent market data
market_data = MarketData()
universe = market_data.get_historical_data(
    ["AAPL", "MSFT", "GOOGL", "AMZN"],
    "2023-01-01",
    "2024-01-01"
)

# Initialize trader
trader = TPT(
    broker_api="alpaca",
    universe=universe,
    strategy=momentum_strategy,
    capital=10000,
    risk_free=0.02
)

# Verify connection
account = trader.get_account_info()
print(f"Account Status: {account['status']}")
print(f"Buying Power: ${account['buying_power']:,.2f}")
print(f"Portfolio Value: ${account['portfolio_value']:,.2f}")
```

## Running the Trader

### Manual Execution

```python
# Execute one rebalance cycle
trader.rebalance()
```

### Scheduled Execution

```python
# Run continuously with scheduled rebalancing
trader.run(
    schedule="daily",      # daily, weekly, monthly
    market_hours_only=True,
    max_position_size=0.25  # Max 25% in any single position
)
```

## Position Management

### View Current Positions

```python
positions = trader.get_positions()
for pos in positions:
    print(f"{pos['symbol']}: {pos['qty']} shares @ ${pos['avg_entry_price']:.2f}")
    print(f"  P&L: ${pos['unrealized_pl']:.2f} ({pos['unrealized_plpc']:.2%})")
```

### Close All Positions

```python
# Liquidate entire portfolio
trader.close_all_positions()
```

### Close Specific Position

```python
# Close a single position
trader.close_position("AAPL")
```

## Order Management

### Place Market Order

```python
order = trader.place_order(
    symbol="AAPL",
    qty=10,
    side="buy",
    type="market"
)
print(f"Order ID: {order['id']}")
print(f"Status: {order['status']}")
```

### Place Limit Order

```python
order = trader.place_order(
    symbol="AAPL",
    qty=10,
    side="buy",
    type="limit",
    limit_price=175.00,
    time_in_force="gtc"  # Good 'til canceled
)
```

### View Open Orders

```python
orders = trader.get_orders(status="open")
for order in orders:
    print(f"{order['symbol']}: {order['side']} {order['qty']} @ {order['type']}")
```

### Cancel Order

```python
trader.cancel_order(order_id="order-id-here")
```

## Risk Management

### Position Sizing

```python
trader = TPT(
    broker_api="alpaca",
    universe=universe,
    strategy=momentum_strategy,
    capital=10000,
    max_position_pct=0.20,      # Max 20% per position
    min_position_pct=0.05,      # Min 5% per position
    cash_buffer=0.10            # Keep 10% in cash
)
```

### Stop Loss

```python
# Place order with stop loss
trader.place_order(
    symbol="AAPL",
    qty=10,
    side="buy",
    type="market"
)

# Immediately place stop loss
trader.place_order(
    symbol="AAPL",
    qty=10,
    side="sell",
    type="stop",
    stop_price=165.00  # 5% below entry
)
```

### Trailing Stop

```python
trader.place_order(
    symbol="AAPL",
    qty=10,
    side="sell",
    type="trailing_stop",
    trail_percent=5.0  # 5% trailing stop
)
```

## Monitoring

### Real-time Logging

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tradepilot")

# Trader will log all activities
trader.run()
```

### Performance Tracking

```python
# Get trading history
history = trader.get_trade_history(days=30)

# Calculate performance
total_pnl = sum(t['realized_pl'] for t in history)
win_rate = len([t for t in history if t['realized_pl'] > 0]) / len(history)

print(f"30-Day P&L: ${total_pnl:,.2f}")
print(f"Win Rate: {win_rate:.1%}")
```

## Best Practices

### 1. Paper Trade First

Always test with paper trading for at least 30 days before going live.

```python
# Paper trading setup
trader = TPT(
    broker_api="alpaca",
    environment="paper",  # Explicit paper trading
    ...
)
```

### 2. Start Small

When going live, start with a fraction of your intended capital.

### 3. Monitor Closely

During the first few live trading sessions, monitor all activities closely.

### 4. Set Alerts

```python
# Configure alerts
trader.set_alert(
    type="drawdown",
    threshold=-0.05,  # Alert at 5% drawdown
    action="notify"   # or "stop_trading"
)
```

### 5. Have an Exit Plan

```python
# Emergency stop
trader.set_emergency_stop(
    max_daily_loss=-500,      # Stop if down $500 in a day
    max_drawdown=-0.10        # Stop if 10% drawdown
)
```

## Troubleshooting

### Connection Issues

```python
# Test connectivity
if trader.test_connection():
    print("Connected successfully")
else:
    print("Connection failed - check credentials")
```

### Order Rejections

Common reasons:
- Insufficient buying power
- Market closed
- Symbol not tradeable
- Invalid order parameters

```python
# Check order status and error message
order = trader.get_order(order_id)
if order['status'] == 'rejected':
    print(f"Rejection reason: {order['error_message']}")
```

## Next Steps

- Review [backtesting results](backtesting.md) before live trading
- Create [custom strategies](strategies.md)
- Learn about [optimization](optimization.md) techniques
