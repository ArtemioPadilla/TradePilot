# Phase 4: Backtesting

## 4.0 E2E Tests (Required)
- [x] Write E2E tests for strategy selector (category filter, search, selection)
- [x] Write E2E tests for strategy config forms (all 6 types)
- [x] Write E2E tests for backtest config form (wizard flow)
- [x] Write E2E tests for backtest results visualization
- [x] Write E2E tests for backtest execution service
- [x] Write E2E tests for backtest history
- [x] Ensure all tests pass (666 tests passing)

## 4.1 Pre-built Strategy UI
- [x] Create strategy selector component
- [x] Build Momentum strategy config form
  - [x] Lookback period slider
  - [x] Top N assets input
  - [x] Rebalance frequency dropdown
- [x] Build Mean Reversion config form
  - [x] MA period input
  - [x] Deviation threshold slider
- [x] Build Equal Weight config form
  - [x] Asset list input
  - [x] Rebalance frequency dropdown
- [x] Build Risk Parity config form
- [x] Build Smart Beta config form

## 4.2 Backtest Configuration
- [x] Create backtest config form
  - [x] Strategy selector
  - [x] Universe selector (S&P 500, custom)
  - [x] Custom symbol input
  - [x] Date range picker
  - [x] Initial capital input
  - [x] Benchmark selector
- [x] Validate date range
- [x] Estimate backtest size/duration
- [x] Save config as preset

## 4.3 PyScript Integration
- [x] Create execution service interface
- [x] Implement simulated execution (mock)
- [ ] Install actual PyScript in Astro
- [ ] Configure Python environment
- [ ] Bundle TradePilot library for browser
- [ ] Create Python-JS bridge
- [ ] Test basic execution
- [x] Handle loading state (BacktestProgress component)
- [x] Implement error handling

## 4.4 Client-side Backtest Execution
- [x] Determine size threshold for client-side
- [x] Create execution service with progress updates
- [ ] Load historical data (cached or fetch)
- [ ] Execute strategy via PyScript
- [x] Stream progress updates to UI
- [x] Collect and format results
- [x] Handle execution errors
- [x] Implement cancellation

## 4.5 Cloud Function: Large Backtests
- [x] Create `runBacktest` Cloud Function
- [x] Accept backtest configuration
- [x] Fetch historical data
- [x] Execute TradePilot backtest
- [x] Store results in Firestore
- [x] Return job ID for polling
- [x] Implement timeout handling
- [x] Clean up on completion

## 4.6 Results Visualization
- [x] Build equity curve chart
  - [x] Strategy line
  - [x] Benchmark line
  - [x] Drawdown shading
- [x] Build drawdown chart
- [x] Build monthly returns heatmap
- [x] Create metrics summary table
  - [x] CAGR
  - [x] Sharpe ratio
  - [x] Sortino ratio
  - [x] Max drawdown
  - [x] Win rate
  - [x] Profit factor
- [x] Build trade log table
- [x] Build position history chart

## 4.7 Backtest History
- [x] Create backtest history service
- [x] Build backtest history list
- [x] Show config summary
- [x] Show key metrics
- [x] Enable re-run with same config
- [x] Enable comparison between backtests
- [x] Implement result expiration cleanup
- [ ] Store backtest results in Firestore (requires Firebase setup)
