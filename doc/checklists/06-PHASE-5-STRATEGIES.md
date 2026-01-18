# Phase 5: Strategy Builder

## 5.1 Monaco Editor Setup
- [ ] Install Monaco Editor package
- [ ] Configure Python language support
- [ ] Set up custom theme matching app
- [ ] Configure editor options (line numbers, minimap)
- [ ] Handle editor resize

## 5.2 TradePilot Autocomplete
- [ ] Generate API type definitions
- [ ] Create autocomplete provider
- [ ] Add TradePilot imports
- [ ] Add strategy base class snippets
- [ ] Add common patterns snippets

## 5.3 Strategy Templates
- [x] Create blank strategy template (start from scratch)
- [x] Create momentum strategy template
- [x] Create mean reversion template
- [x] Create equal weight template
- [x] Create risk parity template
- [x] Create multi-factor template
- [x] Create buy-hold 60/40 template
- [x] Build template selector UI

## 5.4 Strategy Validation
- [ ] Implement syntax checking
- [ ] Validate strategy class structure
- [ ] Check required methods exist
- [ ] Validate return types
- [ ] Display validation errors inline
- [ ] Block save on validation failure

## 5.5 Sandbox Execution
- [ ] Create isolated execution environment
- [ ] Run strategy with sample data
- [ ] Capture output/errors
- [ ] Display execution results
- [ ] Implement execution timeout
- [ ] Prevent dangerous operations

## 5.6 Strategy Management
- [x] Create strategies collection in Firestore
- [x] Build strategy list page (`/strategies`)
- [x] Create new strategy flow
- [x] Edit existing strategy (UI ready)
- [x] Duplicate strategy (UI ready)
- [x] Delete strategy with confirmation
- [x] Add strategy metadata (name, description, tags)

## 5.7 Pre-built Strategy Parameters
- [x] Create dynamic form generator
- [x] Define parameter schemas for each strategy
- [x] Build parameter input components
  - [x] Number slider
  - [x] Dropdown select
  - [x] Multi-select
  - [x] Boolean toggle
  - [x] Text input
- [x] Validate parameter values
- [x] Show parameter descriptions
