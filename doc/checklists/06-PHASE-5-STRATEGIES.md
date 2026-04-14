# Phase 5: Strategy Builder

> **Status:** 60% complete. Templates + management done. Monaco, validation, sandbox pending.
> **Blocker:** Firebase Auth with real API key needed for end-to-end testing.
> **Services needed:** strategy-presets.ts, backtest-execution.ts, backtest-history.ts

## 5.1 Monaco Editor Setup
- [ ] Install Monaco Editor package
- [ ] Configure Python language support
- [ ] Set up custom theme matching app
- [ ] Configure editor options (line numbers, minimap)
- [ ] Handle editor resize

```
subagent: S5.1-monaco-editor
  input: web/package.json, web/src/components/strategies/
  output: web/src/components/editor/StrategyEditor.tsx, web/src/components/editor/monacoConfig.ts
  acceptance: npm run build passes, editor renders in /strategies/new
  est: 45min
  deps: none
```

## 5.2 TradePilot Autocomplete
- [ ] Generate API type definitions from Python docstrings
- [ ] Create autocomplete provider for Monaco
- [ ] Add TradePilot imports + strategy base class snippets
- [ ] Add common pattern snippets

```
subagent: S5.2-autocomplete
  input: tradepilot/*.py (Python API), web/src/components/editor/
  output: web/src/components/editor/autocomplete.ts, web/src/components/editor/snippets.ts
  acceptance: npm run build passes, typing "class My" shows strategy autocomplete
  est: 30min
  deps: S5.1
```

## 5.3 Strategy Templates ✅ DONE
- [x] Create all 7 strategy templates (momentum, mean reversion, equal weight, risk parity, multi-factor, buy-hold 60/40, blank)
- [x] Build template selector UI

## 5.4 Strategy Validation
- [ ] Implement syntax checking
- [ ] Validate strategy class structure
- [ ] Check required methods exist
- [ ] Validate return types
- [ ] Display validation errors inline
- [ ] Block save on validation failure

```
subagent: S5.4-validation
  input: web/src/components/editor/, tradepilot/strategy.py (base class)
  output: web/src/lib/validation/strategyValidator.ts
  acceptance: npm run build passes, invalid strategy shows inline errors
  est: 30min
  deps: S5.1
```

## 5.5 Sandbox Execution
- [ ] Create isolated execution environment via FastAPI bridge
- [ ] Run strategy with sample data, capture output/errors
- [ ] Display execution results
- [ ] Implement execution timeout (30s default)
- [ ] Prevent dangerous operations (no file I/O, no network)

```
subagent: S5.5-sandbox
  input: api/server.py, web/src/lib/services/backtest-execution.ts
  output: api/sandbox.py, web/src/components/editor/ExecutionPanel.tsx
  acceptance: python -m pytest passes, can run momentum strategy from UI and see results
  est: 60min
  deps: S5.1, S5.4
```

## 5.6 Strategy Management ✅ DONE
- [x] Strategies Firestore collection + CRUD + list page + metadata

## 5.7 Pre-built Strategy Parameters ✅ DONE
- [x] Dynamic form generator with all input types

## 5.8 Backtest History Service
- [ ] Implement backtest-history.ts (currently stub)
- [ ] Store backtest results in Firestore
- [ ] List past backtests with filters
- [ ] Compare backtest runs side-by-side

```
subagent: S5.8-backtest-history
  input: web/src/lib/services/backtest-history.ts, web/src/types/
  output: web/src/lib/services/backtest-history.ts (real impl), web/src/components/backtests/HistoryTable.tsx
  acceptance: npm run build passes, backtest results persist and display
  est: 30min
  deps: none
```
