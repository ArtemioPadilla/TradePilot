# Phase 5.5: Plugin Architecture

> **Status:** NEW — enables community contributions and extensibility.
> **Goal:** Adding a broker, data source, strategy, or widget = 1 file + register.

## 5.5.1 Core Interfaces (Python)

- [ ] Define `BrokerAdapter` abstract base class
- [ ] Define `DataProvider` abstract base class
- [ ] Define `Strategy` abstract base class (already exists, formalize)
- [ ] Define `RiskModel` abstract base class
- [ ] Create plugin registry (`tradepilot/plugins/registry.py`)
- [ ] Auto-discover plugins from `tradepilot/plugins/` directory

```
subagent: S5.5.1-python-interfaces
  input: tradepilot/strategy.py, tradepilot/broker/alpaca.py, tradepilot/data/
  output: tradepilot/plugins/__init__.py, tradepilot/plugins/registry.py,
          tradepilot/plugins/base_broker.py, tradepilot/plugins/base_provider.py,
          tradepilot/plugins/base_risk.py
  acceptance: python -m pytest passes, `from tradepilot.plugins import registry` works
  est: 45min
  deps: none
```

## 5.5.2 Refactor Alpaca as Plugin

- [ ] Move Alpaca broker to `tradepilot/plugins/brokers/alpaca.py`
- [ ] Implement `BrokerAdapter` interface
- [ ] Register via plugin registry
- [ ] Ensure all existing tests pass unchanged

```
subagent: S5.5.2-alpaca-plugin
  input: tradepilot/broker/alpaca.py, tradepilot/plugins/base_broker.py
  output: tradepilot/plugins/brokers/alpaca.py (refactored)
  acceptance: python -m pytest (83/83 still pass), alpaca loads via registry
  est: 30min
  deps: S5.5.1
```

## 5.5.3 Widget Interface (React)

- [ ] Define `DashboardWidget` TypeScript interface
- [ ] Create widget registry (`web/src/lib/widgets/registry.ts`)
- [ ] Refactor existing dashboard components as widgets
- [ ] Allow community widgets via config

```
subagent: S5.5.3-widget-interface
  input: web/src/components/dashboard/
  output: web/src/lib/widgets/registry.ts, web/src/lib/widgets/types.ts
  acceptance: npm run build passes, existing dashboard works unchanged
  est: 30min
  deps: none
```

## 5.5.4 CONTRIBUTING.md — Plugin Guide

- [ ] How to add a broker adapter (Python)
- [ ] How to add a data provider (Python)
- [ ] How to add a strategy (Python)
- [ ] How to add a dashboard widget (React)
- [ ] Example: stub IBKR adapter
- [ ] Example: stub Polygon.io provider

```
subagent: S5.5.4-contributing-guide
  input: tradepilot/plugins/, web/src/lib/widgets/, doc/COMPETITIVE_ANALYSIS.md
  output: CONTRIBUTING.md (updated), doc/PLUGIN_ARCHITECTURE.md
  acceptance: CONTRIBUTING.md has 4 plugin guides with examples
  est: 30min
  deps: S5.5.1, S5.5.3
```
