# Contributing to TradePilot

Thank you for your interest in contributing to TradePilot! This guide covers everything from setting up your development environment to submitting a pull request.

## Table of Contents

- [Getting Started](#getting-started)
- [Code Style](#code-style)
- [Adding a Broker Plugin](#adding-a-broker-plugin)
- [Adding a Data Provider Plugin](#adding-a-data-provider-plugin)
- [Adding a Strategy](#adding-a-strategy)
- [Adding a Dashboard Widget](#adding-a-dashboard-widget)
- [Testing Your Plugin](#testing-your-plugin)
- [Submitting a PR](#submitting-a-pr)

---

## Getting Started

1. **Fork** the repository on GitHub.

2. **Clone** your fork:
   ```bash
   git clone https://github.com/<your-username>/tradepilot.git
   cd tradepilot
   ```

3. **Install the Python package** in development mode:
   ```bash
   pip install -e .
   pip install -r requirements.txt
   ```

4. **Install web dependencies** (if working on the dashboard):
   ```bash
   cd web
   npm install
   npx playwright install --with-deps chromium
   ```

5. **Run tests** to verify your setup:
   ```bash
   # Python tests
   pytest tests/

   # Web E2E tests
   cd web && npx playwright test --project=chromium
   ```

6. **Create a branch** for your work:
   ```bash
   git checkout -b feat/my-plugin
   ```

---

## Code Style

### Python

- **Formatter**: [Black](https://github.com/psf/black) with default settings.
- **Import sorting**: [isort](https://pycqa.github.io/isort/) with Black-compatible profile.
- **Type hints**: Preferred for public APIs.

```bash
black tradepilot/ tests/
isort tradepilot/ tests/
```

### TypeScript / React

- **Formatter**: [Prettier](https://prettier.io/) with project defaults.
- **Linting**: ESLint where configured.

```bash
cd web
npx prettier --write src/
```

### General

- Keep functions focused and small.
- Write docstrings for public classes and methods.
- Avoid adding dependencies unless necessary.

---

## Adding a Broker Plugin

Broker plugins connect TradePilot to a brokerage API for live trading.

1. **Create the file** at `tradepilot/plugins/brokers/<broker_name>.py`.

2. **Extend `BrokerAdapter`** and implement all required methods:
   ```python
   from tradepilot.plugins import BrokerAdapter, register_broker

   class MyBrokerAdapter(BrokerAdapter):
       def connect(self, credentials: dict) -> bool:
           # Authenticate with the broker
           ...

       def disconnect(self) -> None:
           ...

       def get_account(self) -> dict:
           # Return {"buying_power": ..., "portfolio_value": ..., "currency": ...}
           ...

       def get_positions(self) -> list:
           # Return [{"symbol": ..., "quantity": ..., "market_value": ..., "avg_entry_price": ...}]
           ...

       def submit_order(self, symbol, quantity, side, order_type="market", time_in_force="gtc") -> dict:
           # Return {"order_id": ..., "status": ..., "symbol": ..., "quantity": ..., "side": ...}
           ...

       def cancel_order(self, order_id: str) -> bool:
           ...

       def get_order_status(self, order_id: str) -> dict:
           # Return {"order_id": ..., "status": ..., "filled_quantity": ...}
           ...

       def stream_prices(self, symbols: list, callback: callable) -> dict:
           # Return {"stream_id": ..., "symbols": ...}
           ...

   # Self-register at module level
   register_broker("my-broker", MyBrokerAdapter)
   ```

3. **That's it.** The auto-discovery system imports all modules in `tradepilot/plugins/brokers/` automatically.

See [`examples/plugins/ibkr_broker.py`](examples/plugins/ibkr_broker.py) for a complete Interactive Brokers stub.

---

## Adding a Data Provider Plugin

Data provider plugins supply market data (historical OHLCV, live prices, symbol search).

1. **Create the file** at `tradepilot/plugins/providers/<provider_name>.py`.

2. **Extend `DataProvider`** and implement all required methods:
   ```python
   from tradepilot.plugins import DataProvider, register_provider

   class MyProvider(DataProvider):
       def __init__(self, api_key: str):
           self._api_key = api_key

       def get_historical(self, symbol, start, end, interval="1d"):
           # Return pd.DataFrame with Open, High, Low, Close, Volume columns
           ...

       def get_current_price(self, symbol: str) -> float:
           ...

       def get_multiple_prices(self, symbols: list) -> dict:
           # Return {"AAPL": 150.0, "GOOG": 2800.0}
           ...

       def search_symbols(self, query: str) -> list:
           # Return [{"symbol": ..., "name": ..., "exchange": ...}]
           ...

       def supported_intervals(self) -> list:
           return ["1m", "5m", "1h", "1d"]

   register_provider("my-provider", MyProvider)
   ```

See [`examples/plugins/polygon_provider.py`](examples/plugins/polygon_provider.py) for a complete Polygon.io stub.

---

## Adding a Strategy

Strategy plugins rank assets for portfolio construction.

1. **Create the file** at `tradepilot/plugins/strategies/<strategy_name>.py`.

2. **Extend `StrategyBase`**:
   ```python
   from tradepilot.plugins import StrategyBase, register_strategy
   import pandas as pd

   class MyStrategy(StrategyBase):
       @property
       def name(self) -> str:
           return "my-strategy"

       def rank(self, prices: pd.DataFrame, **kwargs) -> pd.Series:
           # Return a Series indexed by symbol with numeric scores
           # Higher scores = stronger candidates for portfolio inclusion
           lookback = kwargs.get("lookback", 20)
           returns = prices.pct_change(lookback).iloc[-1]
           return returns

   register_strategy("my-strategy", MyStrategy)
   ```

You can also look at the built-in strategies in `strategies/` (momentum, mean reversion, smart beta) for reference.

---

## Adding a Dashboard Widget

Dashboard widgets are React components displayed on the user's dashboard.

1. **Create a React component** in `web/src/components/widgets/`:
   ```tsx
   // web/src/components/widgets/MyWidget.tsx
   import type { WidgetProps } from '../../lib/widgets/types';

   export default function MyWidget({ width, height, isEditing }: WidgetProps) {
     return (
       <div style={{ width, height }}>
         <h3>My Widget</h3>
         {/* Your widget content */}
       </div>
     );
   }
   ```

2. **Register it** in `web/src/lib/widgets/dashboard-widgets.ts`:
   ```typescript
   import MyWidget from '../../components/widgets/MyWidget';

   registerWidget({
     id: 'my-widget',
     name: 'My Widget',
     description: 'Description of what this widget shows',
     component: MyWidget,
     defaultSize: { cols: 4, rows: 3 },
     minSize: { cols: 2, rows: 2 },
     category: 'analytics', // 'portfolio' | 'trading' | 'analytics' | 'social'
   });
   ```

3. **Write an E2E test** in `web/tests/e2e/`:
   ```typescript
   test('my widget renders on dashboard', async ({ page }) => {
     await page.goto('/dashboard');
     await expect(page.getByText('My Widget')).toBeVisible();
   });
   ```

---

## Testing Your Plugin

### Python Plugins

Write tests in `tests/test_<plugin_name>.py`:

```python
import pytest
from tradepilot.plugins import list_brokers, get_broker

def test_plugin_registered():
    """Plugin should appear in the registry after discovery."""
    assert "my-broker" in list_brokers()

def test_plugin_instantiates():
    """Plugin class should be instantiable without errors."""
    BrokerClass = get_broker("my-broker")
    broker = BrokerClass()
    assert broker is not None

def test_connect():
    """connect() should return True on success."""
    BrokerClass = get_broker("my-broker")
    broker = BrokerClass()
    result = broker.connect({"api_key": "test"})
    assert result is True

def test_account_contract():
    """get_account() must return the required keys."""
    broker = get_broker("my-broker")()
    broker.connect({"api_key": "test"})
    account = broker.get_account()
    assert "buying_power" in account
    assert "portfolio_value" in account
    assert "currency" in account
```

Run with:
```bash
pytest tests/test_my_broker.py -v
```

### Web Widgets

```bash
cd web
npx playwright test tests/e2e/widgets.spec.ts --project=chromium
```

---

## Submitting a PR

1. **Ensure all tests pass**:
   ```bash
   pytest tests/
   cd web && npx playwright test --project=chromium
   ```

2. **Format your code**:
   ```bash
   black tradepilot/ tests/
   isort tradepilot/ tests/
   cd web && npx prettier --write src/
   ```

3. **Commit** with a descriptive message:
   ```bash
   git add -A
   git commit -m "feat: add <broker/provider/strategy> plugin for <name>"
   ```

4. **Push** and open a PR:
   ```bash
   git push origin feat/my-plugin
   ```

5. In your PR description, include:
   - What the plugin does and which service it integrates.
   - How to configure credentials (without including actual secrets).
   - Test results showing all tests pass.

### PR Checklist

- [ ] All abstract methods implemented
- [ ] Plugin self-registers at module level
- [ ] Tests written and passing
- [ ] Code formatted with Black/Prettier
- [ ] No secrets or API keys committed
- [ ] Documentation updated if needed
