# Phase 4: Backtesting

## 4.1 Pre-built Strategy UI
- [ ] Create strategy selector component
- [ ] Build Momentum strategy config form
  - [ ] Lookback period slider
  - [ ] Top N assets input
  - [ ] Rebalance frequency dropdown
- [ ] Build Mean Reversion config form
  - [ ] MA period input
  - [ ] Deviation threshold slider
- [ ] Build Equal Weight config form
  - [ ] Asset list input
  - [ ] Rebalance frequency dropdown
- [ ] Build Risk Parity config form
- [ ] Build Smart Beta config form

## 4.2 Backtest Configuration
- [ ] Create backtest config form
  - [ ] Strategy selector
  - [ ] Universe selector (S&P 500, custom)
  - [ ] Custom symbol input
  - [ ] Date range picker
  - [ ] Initial capital input
  - [ ] Benchmark selector
- [ ] Validate date range
- [ ] Estimate backtest size/duration
- [ ] Save config as preset

## 4.3 PyScript Integration
- [ ] Install PyScript in Astro
- [ ] Configure Python environment
- [ ] Bundle TradePilot library for browser
- [ ] Create Python-JS bridge
- [ ] Test basic execution
- [ ] Handle PyScript loading state
- [ ] Implement error handling

## 4.4 Client-side Backtest Execution
- [ ] Determine size threshold for client-side
- [ ] Load historical data (cached or fetch)
- [ ] Execute strategy via PyScript
- [ ] Stream progress updates to UI
- [ ] Collect results
- [ ] Handle execution errors
- [ ] Implement cancellation

## 4.5 Cloud Function: Large Backtests
- [ ] Create `runBacktest` Cloud Function
- [ ] Accept backtest configuration
- [ ] Fetch historical data
- [ ] Execute TradePilot backtest
- [ ] Store results in Firestore
- [ ] Return job ID for polling
- [ ] Implement timeout handling
- [ ] Clean up on completion

## 4.6 Results Visualization
- [ ] Build equity curve chart
  - [ ] Strategy line
  - [ ] Benchmark line
  - [ ] Drawdown shading
- [ ] Build drawdown chart
- [ ] Build monthly returns heatmap
- [ ] Create metrics summary table
  - [ ] CAGR
  - [ ] Sharpe ratio
  - [ ] Sortino ratio
  - [ ] Max drawdown
  - [ ] Win rate
  - [ ] Profit factor
- [ ] Build trade log table
- [ ] Build position history chart

## 4.7 Backtest History
- [ ] Store backtest results in Firestore
- [ ] Build backtest history list
- [ ] Show config summary
- [ ] Show key metrics
- [ ] Enable re-run with same config
- [ ] Enable comparison between backtests
- [ ] Implement result expiration cleanup
