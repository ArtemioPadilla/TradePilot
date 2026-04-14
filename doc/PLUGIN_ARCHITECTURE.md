# Plugin Architecture

TradePilot uses a plugin system to support extensibility across four domains: **Broker Adapters**, **Data Providers**, **Strategies**, and **Dashboard Widgets**. Each plugin type has an abstract base class, a registration mechanism, and auto-discovery so that dropping a module into the right directory is all it takes to activate a new plugin.

## Table of Contents

- [Overview](#overview)
- [Broker Plugins](#broker-plugins)
- [Data Provider Plugins](#data-provider-plugins)
- [Strategy Plugins](#strategy-plugins)
- [Widget Plugins](#widget-plugins)
- [Risk Model Plugins](#risk-model-plugins)
- [Auto-Discovery](#auto-discovery)
- [Testing Plugins](#testing-plugins)

---

## Overview

```
tradepilot/plugins/
  __init__.py          # Public API (base classes + registry functions)
  registry.py          # PluginRegistry singleton with auto-discovery
  base_broker.py       # BrokerAdapter ABC
  base_provider.py     # DataProvider ABC
  base_strategy.py     # StrategyBase ABC
  base_risk.py         # RiskModel ABC
  brokers/             # Drop broker plugins here
  providers/           # Drop data provider plugins here
  strategies/          # Drop strategy plugins here
  risk_models/         # Drop risk model plugins here
```

The registry is a singleton (`tradepilot.plugins.registry._registry`). Convenience functions are re-exported from `tradepilot.plugins`:

```python
from tradepilot.plugins import (
    register_broker, get_broker, list_brokers,
    register_provider, get_provider, list_providers,
    register_strategy, get_strategy, list_strategies,
    register_risk_model, get_risk_model, list_risk_models,
    discover_plugins,
)
```

---

## Broker Plugins

Broker plugins connect TradePilot to a brokerage API for live trading.

### Interface

Extend `BrokerAdapter` and implement all abstract methods:

| Method | Signature | Purpose |
|--------|-----------|---------|
| `connect` | `(credentials: dict) -> bool` | Authenticate with the broker |
| `disconnect` | `() -> None` | Close connection and release resources |
| `get_account` | `() -> dict` | Return `buying_power`, `portfolio_value`, `currency` |
| `get_positions` | `() -> list` | Return list of `{symbol, quantity, market_value, avg_entry_price}` |
| `submit_order` | `(symbol, quantity, side, order_type="market", time_in_force="gtc") -> dict` | Submit an order, return `{order_id, status, symbol, quantity, side}` |
| `cancel_order` | `(order_id: str) -> bool` | Cancel an open order |
| `get_order_status` | `(order_id: str) -> dict` | Return `{order_id, status, filled_quantity}` |
| `stream_prices` | `(symbols: list, callback: callable) -> dict` | Start price streaming, return `{stream_id, symbols}` |

### Step-by-Step Creation

1. Create a new file in `tradepilot/plugins/brokers/`, e.g. `ibkr.py`.
2. Import the base class and registry function:
   ```python
   from tradepilot.plugins import BrokerAdapter, register_broker
   ```
3. Define your class extending `BrokerAdapter`.
4. Implement every abstract method.
5. Self-register at the bottom of the module:
   ```python
   register_broker("ibkr", InteractiveBrokersAdapter)
   ```
6. The auto-discovery system will import your module automatically.

### Example: Interactive Brokers Stub

See [`examples/plugins/ibkr_broker.py`](../examples/plugins/ibkr_broker.py) for a full stub implementation.

```python
from tradepilot.plugins import BrokerAdapter, register_broker

class InteractiveBrokersAdapter(BrokerAdapter):
    def connect(self, credentials: dict) -> bool:
        # Authenticate via IBKR Client Portal or TWS API
        ...

    def submit_order(self, symbol, quantity, side, order_type="market", time_in_force="gtc"):
        # Place order via IBKR API
        ...

register_broker("ibkr", InteractiveBrokersAdapter)
```

### Testing

```python
def test_ibkr_connect():
    adapter = InteractiveBrokersAdapter()
    result = adapter.connect({"host": "127.0.0.1", "port": 7497, "client_id": 1})
    assert result is True

def test_ibkr_submit_order():
    adapter = InteractiveBrokersAdapter()
    adapter.connect({...})
    order = adapter.submit_order("AAPL", 10, "buy")
    assert "order_id" in order
    assert order["status"] in ("pending", "submitted", "filled")
```

---

## Data Provider Plugins

Data provider plugins supply historical and real-time market data.

### Interface

Extend `DataProvider` and implement all abstract methods:

| Method | Signature | Purpose |
|--------|-----------|---------|
| `get_historical` | `(symbol, start, end, interval="1d") -> pd.DataFrame` | OHLCV data with DatetimeIndex |
| `get_current_price` | `(symbol: str) -> float` | Latest price for one symbol |
| `get_multiple_prices` | `(symbols: list) -> dict` | `{symbol: price}` for batch lookup |
| `search_symbols` | `(query: str) -> list` | Return `[{symbol, name, exchange}]` |
| `supported_intervals` | `() -> list` | e.g. `["1m", "5m", "1h", "1d"]` |

### Step-by-Step Creation

1. Create a new file in `tradepilot/plugins/providers/`, e.g. `polygon.py`.
2. Import the base class and registry function:
   ```python
   from tradepilot.plugins import DataProvider, register_provider
   ```
3. Define your class extending `DataProvider`.
4. Implement every abstract method.
5. Self-register at the bottom of the module:
   ```python
   register_provider("polygon", PolygonProvider)
   ```

### Example: Polygon.io Stub

See [`examples/plugins/polygon_provider.py`](../examples/plugins/polygon_provider.py) for a full stub implementation.

```python
from tradepilot.plugins import DataProvider, register_provider

class PolygonProvider(DataProvider):
    def get_historical(self, symbol, start, end, interval="1d"):
        # GET /v2/aggs/ticker/{symbol}/range/...
        ...

    def supported_intervals(self):
        return ["1m", "5m", "15m", "1h", "1d", "1wk"]

register_provider("polygon", PolygonProvider)
```

### Testing

```python
def test_polygon_historical():
    provider = PolygonProvider(api_key="test_key")
    df = provider.get_historical("AAPL", "2024-01-01", "2024-01-31")
    assert list(df.columns) >= ["Open", "High", "Low", "Close", "Volume"]
    assert len(df) > 0
```

---

## Strategy Plugins

Strategy plugins rank assets to determine portfolio composition.

### Interface

Extend `StrategyBase` and implement:

| Method / Property | Signature | Purpose |
|-------------------|-----------|---------|
| `name` (property) | `-> str` | Human-readable strategy name |
| `rank` | `(prices: pd.DataFrame, **kwargs) -> pd.Series` | Score assets; higher = stronger candidate |

### Step-by-Step Creation

1. Create a new file in `tradepilot/plugins/strategies/`, e.g. `pairs_trading.py`.
2. Import base class and registry:
   ```python
   from tradepilot.plugins import StrategyBase, register_strategy
   ```
3. Define your class with a `name` property and `rank()` method.
4. Self-register:
   ```python
   register_strategy("pairs-trading", PairsTradingStrategy)
   ```

### Example

```python
from tradepilot.plugins import StrategyBase, register_strategy
import pandas as pd

class PairsTradingStrategy(StrategyBase):
    @property
    def name(self) -> str:
        return "pairs-trading"

    def rank(self, prices: pd.DataFrame, **kwargs) -> pd.Series:
        lookback = kwargs.get("lookback", 20)
        spread = prices.diff(lookback).iloc[-1]
        return -spread.abs()  # prefer tighter spreads

register_strategy("pairs-trading", PairsTradingStrategy)
```

### Testing

```python
import pandas as pd

def test_pairs_strategy_rank():
    prices = pd.DataFrame({"AAPL": [150, 152, 151], "GOOG": [2800, 2810, 2795]})
    strategy = PairsTradingStrategy()
    scores = strategy.rank(prices)
    assert isinstance(scores, pd.Series)
    assert len(scores) == 2
```

---

## Widget Plugins

Dashboard widgets are React components registered with the web widget system.

### Interface

Implement the `DashboardWidget` TypeScript interface:

```typescript
interface DashboardWidget {
  id: string;                                    // Unique identifier
  name: string;                                  // Display name
  description: string;                           // Short description
  component: ComponentType<WidgetProps>;          // React component
  defaultSize: { cols: number; rows: number };    // Default grid size
  minSize: { cols: number; rows: number };        // Minimum grid size
  category: 'portfolio' | 'trading' | 'analytics' | 'social';
}

interface WidgetProps {
  width: number;
  height: number;
  isEditing: boolean;
}
```

### Step-by-Step Creation

1. Create your React component in `web/src/components/widgets/`:
   ```tsx
   // web/src/components/widgets/HeatmapWidget.tsx
   import type { WidgetProps } from '../../lib/widgets/types';

   export default function HeatmapWidget({ width, height, isEditing }: WidgetProps) {
     return <div style={{ width, height }}>Sector Heatmap</div>;
   }
   ```

2. Register in `web/src/lib/widgets/dashboard-widgets.ts`:
   ```typescript
   import HeatmapWidget from '../../components/widgets/HeatmapWidget';

   registerWidget({
     id: 'sector-heatmap',
     name: 'Sector Heatmap',
     description: 'Visual heatmap of sector performance',
     component: HeatmapWidget,
     defaultSize: { cols: 4, rows: 3 },
     minSize: { cols: 2, rows: 2 },
     category: 'analytics',
   });
   ```

### Testing

```typescript
// web/tests/e2e/widgets.spec.ts
import { test, expect } from '@playwright/test';

test('heatmap widget renders', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('Sector Heatmap')).toBeVisible();
});
```

---

## Risk Model Plugins

Risk model plugins provide quantitative risk assessment.

### Interface

Extend `RiskModel` and implement:

| Method | Signature | Purpose |
|--------|-----------|---------|
| `calculate_var` | `(returns: pd.Series, confidence=0.95, horizon=1) -> float` | Value at Risk |
| `calculate_max_drawdown` | `(prices: pd.Series) -> float` | Max peak-to-trough drawdown (negative float) |
| `calculate_sharpe` | `(returns: pd.Series, risk_free_rate=0.0, periods_per_year=252) -> float` | Annualized Sharpe ratio |
| `assess_portfolio_risk` | `(returns: pd.DataFrame) -> dict` | Full report: `var_95`, `max_drawdown`, `sharpe_ratio`, `volatility`, `correlation_matrix` |

### Step-by-Step Creation

1. Create a new file in `tradepilot/plugins/risk_models/`, e.g. `monte_carlo.py`.
2. Import base class and registry:
   ```python
   from tradepilot.plugins import RiskModel, register_risk_model
   ```
3. Implement all four abstract methods.
4. Self-register:
   ```python
   register_risk_model("monte-carlo", MonteCarloRiskModel)
   ```

---

## Auto-Discovery

The registry uses **lazy auto-discovery**. On the first call to any `get_*` or `list_*` function, `PluginRegistry.discover_plugins()` scans the four subdirectories under `tradepilot/plugins/`:

```
tradepilot/plugins/brokers/      -> imports all .py modules
tradepilot/plugins/providers/    -> imports all .py modules
tradepilot/plugins/strategies/   -> imports all .py modules
tradepilot/plugins/risk_models/  -> imports all .py modules
```

Each module is expected to self-register by calling the appropriate `register_*` function at import time. No manual imports or configuration files are needed.

To trigger discovery explicitly:

```python
from tradepilot.plugins import discover_plugins
discover_plugins()
```

---

## Testing Plugins

### Unit Test Pattern

Every plugin should have a corresponding test file under `tests/`:

```python
# tests/test_my_broker.py
import pytest
from tradepilot.plugins import get_broker, list_brokers

def test_broker_registered():
    assert "my-broker" in list_brokers()

def test_broker_connect():
    BrokerClass = get_broker("my-broker")
    broker = BrokerClass()
    assert broker.connect({"api_key": "test"}) is True

def test_broker_account():
    BrokerClass = get_broker("my-broker")
    broker = BrokerClass()
    broker.connect({"api_key": "test"})
    account = broker.get_account()
    assert "buying_power" in account
    assert "portfolio_value" in account
    assert "currency" in account
```

### Integration Test Checklist

- [ ] Plugin registers without errors
- [ ] All abstract methods are implemented (no `TypeError` on instantiation)
- [ ] Return types match the interface contract
- [ ] Error handling works for invalid inputs
- [ ] Plugin appears in `list_*()` output after discovery
