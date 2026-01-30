# TradePilot Backend Architecture

> Python library architecture for algorithmic trading, backtesting, and live execution.

## Overview

The TradePilot Python backend provides:

1. **Backtesting Engine (TPS)** - Historical simulation of portfolio strategies
2. **Live Trading (TPT)** - Real-time order execution via broker APIs
3. **Market Data** - Historical and live price retrieval
4. **Portfolio Optimization** - Weight calculation using multiple techniques
5. **Metrics & Analysis** - Performance measurement and risk metrics

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            User Application                                  │
│              (Python scripts, Jupyter notebooks, Web API)                   │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Backtest (backtest.py)         │          TPT (trader.py)                  │
│  - Run historical simulations   │  - Live trading loop                      │
│  - Performance evaluation       │  - Periodic rebalancing                   │
│  - Metrics calculation          │  - Order execution                        │
└───────────────────┬─────────────┴──────────────────┬────────────────────────┘
                    │                                │
                    ▼                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TPS - simulator.py                                    │
│  - Portfolio state management    - Rebalancing logic                         │
│  - Position tracking             - Valuation calculation                     │
│  - Trade simulation              - Holdings management                       │
└───────────────────┬─────────────────────────────────────────────────────────┘
                    │
         ┌──────────┼──────────┐
         ▼          ▼          ▼
┌─────────────┐ ┌──────────┐ ┌─────────────┐
│ ranking.py  │ │metrics.py│ │optimization │
│             │ │          │ │    .py      │
│ - momentum  │ │- returns │ │ - msr()     │
│ - random    │ │- sharpe  │ │ - gmv()     │
│             │ │- drawdown│ │ - eq_weight │
└─────────────┘ └──────────┘ └─────────────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
┌─────────────────────┐ ┌─────────────────────┐
│    data.py          │ │    broker.py        │
│                     │ │                     │
│ - MarketData        │ │ - BrokerAPI         │
│ - OpenData          │ │ - Alpaca REST API   │
│ - yfinance source   │ │ - Order execution   │
└─────────────────────┘ └─────────────────────┘
```

## Module Reference

### Core Classes

| Module | Class | Purpose |
|--------|-------|---------|
| `simulator.py` | `TPS` | Core simulation engine for backtesting |
| `trader.py` | `TPT` | Live trading loop with rebalancing |
| `backtest.py` | `Backtest` | High-level backtest wrapper with evaluation |
| `broker.py` | `BrokerAPI` | Broker API integration (Alpaca) |
| `data.py` | `MarketData` | Historical and live price retrieval |
| `data.py` | `OpenData` | Risk-free rate and open data |

### Strategy Functions

| Module | Function | Purpose |
|--------|----------|---------|
| `ranking.py` | `momentum_ranking()` | Select assets by price momentum |
| `ranking.py` | `random_ranking()` | Random asset selection |
| `optimization.py` | `msr()` | Maximum Sharpe Ratio weights |
| `optimization.py` | `gmv()` | Global Minimum Variance weights |
| `optimization.py` | `eq_weighted()` | Equal weight allocation |

### Metrics Functions

| Module | Function | Purpose |
|--------|----------|---------|
| `metrics.py` | `get_returns()` | Calculate period returns |
| `metrics.py` | `annualize_returns()` | Annualize return series |
| `metrics.py` | `sharpe_ratio()` | Risk-adjusted return metric |
| `metrics.py` | `max_drawdown()` | Maximum peak-to-trough decline |
| `metrics.py` | `momentum()` | Price momentum calculation |

## Data Flow

### Backtesting Flow

```
1. Load Universe
   MarketData.get_historical_data(symbols, start, end)
   └─→ Returns DataFrame of closing prices

2. Initialize Backtest
   Backtest(universe, strategy, capital, risk_free)
   └─→ Creates TPS simulator instance

3. Run Simulation
   TPS.run(start, end)
   ├─→ For each rebalancing date:
   │   ├─→ ranking.momentum_ranking() → Select assets
   │   ├─→ optimization.msr() → Calculate weights
   │   └─→ Simulate trades, update holdings
   └─→ Track portfolio valuations

4. Evaluate Results
   Backtest.evaluate()
   └─→ Returns metrics: annual_return, sharpe_ratio, max_drawdown
```

### Live Trading Flow

```
1. Initialize Trader
   TPT(broker="alpaca", universe, strategy, capital)
   └─→ Creates BrokerAPI connection

2. Trading Loop
   TPT.run()
   ├─→ Check rebalancing schedule
   ├─→ Get live prices: MarketData.get_live_price()
   ├─→ Calculate target weights
   ├─→ Determine rebalancing trades
   └─→ Execute: BrokerAPI.execute_trade()

3. Position Monitoring
   BrokerAPI.get_positions()
   BrokerAPI.get_account()
```

## Data Models

### Price Data

```python
# Historical prices from MarketData
pd.DataFrame
├── Index: DatetimeIndex (trading days)
├── Columns: Asset symbols (AAPL, GOOGL, etc.)
└── Values: Closing prices (float)

# Example:
#             AAPL     GOOGL    MSFT
# 2024-01-02  185.64   140.25   375.30
# 2024-01-03  184.25   139.90   374.15
```

### Portfolio State

```python
# TPS internal state
{
    'holdings': {
        'AAPL': 50,      # shares
        'GOOGL': 30,
        'MSFT': 20,
    },
    'cash': 5000.00,
    'portfolio_value': 45000.00,
    'weights': {
        'AAPL': 0.35,
        'GOOGL': 0.40,
        'MSFT': 0.25,
    }
}
```

### Order Model

```python
# BrokerAPI order
{
    'symbol': 'AAPL',
    'qty': '10',
    'side': 'buy',           # 'buy' | 'sell'
    'type': 'market',        # 'market' | 'limit'
    'time_in_force': 'gtc',  # 'gtc' | 'day' | 'ioc'
}

# Response from Alpaca
{
    'id': 'order-uuid',
    'status': 'filled',
    'filled_qty': '10',
    'filled_avg_price': '185.50',
    'filled_at': '2024-01-15T10:30:00Z',
}
```

## Error Handling

### Exception Hierarchy

```
Exception
├── DataError
│   ├── DataNotFoundError    # Symbol/data not found
│   └── DataValidationError  # Invalid data format
│
└── BrokerError
    ├── BrokerAuthenticationError  # 401/403 responses
    ├── BrokerRateLimitError       # 429 responses
    ├── BrokerServerError          # 5xx responses
    └── BrokerValidationError      # 400/422 responses
```

### Usage

```python
from tradepilot import (
    MarketData,
    DataError,
    DataNotFoundError,
    BrokerAPI,
    BrokerError,
)

# Data retrieval with error handling
try:
    market_data = MarketData()
    prices = market_data.get_historical_data('INVALID', '2024-01-01', '2024-12-31')
except DataNotFoundError:
    print("Symbol not found")
except DataError as e:
    print(f"Data error: {e}")

# Trading with error handling
try:
    broker = BrokerAPI('alpaca', use_paper=True)
    result = broker.execute_trade('AAPL', 10, side='buy')
except BrokerError as e:
    print(f"Trade failed: {e}")
```

## Configuration

### API Credentials

```python
# tradepilot/config.py
API_KEYS = {
    "alpaca": {
        "key_id": "YOUR_ALPACA_API_KEY",
        "secret": "YOUR_ALPACA_SECRET_KEY",
    }
}

# Environment variable support
import os
API_KEYS = {
    "alpaca": {
        "key_id": os.environ.get("ALPACA_API_KEY"),
        "secret": os.environ.get("ALPACA_SECRET_KEY"),
    }
}
```

### Validation

```python
from tradepilot import validate_config, is_configured

# Check if credentials are set
if is_configured('alpaca'):
    broker = BrokerAPI('alpaca')
else:
    print("Please configure Alpaca API credentials")

# Validate configuration
errors = validate_config()
if errors:
    for error in errors:
        print(f"Config error: {error}")
```

## Logging

All modules use Python's standard logging:

```python
import logging

# Enable debug logging
logging.basicConfig(level=logging.DEBUG)

# Logs go to tradepilot.log and console
# Format: timestamp - module - level - message
```

## Integration with Web Application

The Python backend can be used by the web application in several ways:

### 1. Direct Import (Server-Side)

```python
# Firebase Cloud Functions or API endpoint
from tradepilot import Backtest, MarketData

def run_backtest(request):
    market_data = MarketData()
    prices = market_data.get_historical_data(
        request['symbols'],
        request['start'],
        request['end']
    )

    backtest = Backtest(prices, strategy, capital=request['capital'])
    backtest.run(request['start'], request['end'])
    return backtest.evaluate()
```

### 2. REST API Bridge

```python
# Flask/FastAPI endpoint
from flask import Flask, jsonify
from tradepilot import BrokerAPI

app = Flask(__name__)

@app.route('/api/trade', methods=['POST'])
def execute_trade():
    broker = BrokerAPI('alpaca', use_paper=True)
    result = broker.execute_trade(
        symbol=request.json['symbol'],
        amount=request.json['qty'],
        side=request.json['side']
    )
    return jsonify(result)
```

### 3. Shared Data Models

The web application's TypeScript types are designed to be compatible with Python data structures:

```typescript
// Web: web/src/types/alpaca.ts
interface AlpacaOrder {
  symbol: string;
  qty: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  time_in_force: 'gtc' | 'day' | 'ioc';
}

// Python: tradepilot/broker.py
order = {
    'symbol': symbol,
    'qty': str(amount),
    'side': side,
    'type': order_type,
    'time_in_force': time_in_force,
}
```

## CyberEco Platform Compatibility

The backend is designed for future integration with CyberEco Platform:

### Data Export Format

```python
# Export portfolio data in CyberEco-compatible JSON
def export_portfolio(holdings, user_id):
    return {
        'schemaVersion': '1.0',
        'exportedAt': datetime.now().isoformat(),
        'dataType': 'portfolio',
        'userId': user_id,
        'holdings': [
            {
                'symbol': symbol,
                'quantity': qty,
                'assetClass': 'equity',
            }
            for symbol, qty in holdings.items()
        ],
        # CyberEco fields
        'visibility': 'private',
        'consent': {
            'analytics': False,
            'sharing': False,
        }
    }
```

### Privacy-Aware Queries

```python
# Filter data based on visibility settings
def get_portfolio_for_viewer(portfolio, viewer_id, owner_settings):
    if portfolio.owner_id == viewer_id:
        return portfolio  # Full access

    if owner_settings.visibility == 'private':
        return None

    if owner_settings.visibility == 'confidential':
        if viewer_id not in owner_settings.shared_with:
            return None

    # Apply anonymization if needed
    if owner_settings.anonymize_public:
        portfolio = anonymize(portfolio)

    return portfolio
```

### Hub Gateway Detection

```python
# Detect CyberEco Hub proxy
def is_hub_request(request):
    return request.headers.get('X-Hub-Proxy') == 'true'

def get_user_auth(request):
    if is_hub_request(request):
        return get_hub_auth(request)  # CyberEco SSO
    return get_firebase_auth(request)  # Direct Firebase
```

## Testing

```bash
# Run all tests
pytest tests/

# Run specific module tests
pytest tests/test_data.py
pytest tests/test_metrics.py
pytest tests/test_ranking.py

# Run with coverage
pytest --cov=tradepilot tests/
```

## Best Practices

1. **Use Paper Trading First** - Always test with `use_paper=True`
2. **Handle Errors** - Wrap broker/data calls in try/except
3. **Log Everything** - Enable logging for debugging
4. **Validate Config** - Check `is_configured()` before trading
5. **Rate Limit Awareness** - Handle `BrokerRateLimitError`
6. **Data Validation** - Verify data integrity before processing
