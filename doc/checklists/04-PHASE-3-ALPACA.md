# Phase 3: Alpaca Integration

## 3.0 E2E Tests (Required)
- [x] Write E2E tests for Alpaca connection form (8 tests)
- [x] Write E2E tests for Price Display component (6 tests)
- [x] Write E2E tests for Order Form component (13 tests)
- [x] Write E2E tests for Order Confirmation modal (4 tests)
- [x] Write E2E tests for Order History table (10 tests)
- [x] Write E2E tests for trading integration and accessibility (8 tests)
- [x] Ensure all tests pass (442 tests passing)

## 3.1 Credential Management
- [x] Build Alpaca connection form
  - [x] API Key input
  - [x] API Secret input (masked)
  - [x] Environment toggle (paper/live)
  - [x] Test connection button
- [x] Encrypt credentials before storage
- [x] Store in user's Firestore document
- [x] Create credential update flow
- [x] Add credential deletion

## 3.2 Cloud Function: Position Sync
- [x] Create `syncPositions` Cloud Function
- [x] Initialize Alpaca client with user credentials
- [x] Fetch positions from Alpaca API
- [x] Map Alpaca positions to app data model
- [x] Update Firestore holdings
- [x] Handle sync errors gracefully
- [x] Set up scheduled trigger (every 5 min)
- [x] Add manual sync button in UI (via client service)

## 3.3 Real-time Price WebSocket
- [x] Create WebSocket connection manager
- [x] Connect to Alpaca market data stream
- [x] Subscribe to symbols in portfolio
- [ ] Update prices in Firestore cache
- [ ] Broadcast updates to connected clients
- [x] Handle WebSocket reconnection
- [x] Implement heartbeat/keep-alive
- [x] Clean up on disconnect

## 3.4 Price Display Components
- [x] Create `<PriceDisplay>` component
- [x] Show current price
- [x] Show change amount
- [x] Show change percentage
- [x] Color code positive/negative
- [x] Add loading state
- [x] Add stale data indicator (via isStale() in WebSocket manager)

## 3.5 Trading Interface - Order Form
- [x] Create order form component
  - [x] Symbol display/search
  - [x] Side selector (buy/sell)
  - [x] Order type dropdown
  - [x] Quantity input
  - [x] Limit price input (conditional)
  - [x] Stop price input (conditional)
  - [x] Dollar amount toggle
- [x] Calculate estimated cost/proceeds
- [x] Show buying power
- [x] Validate order parameters
- [ ] Display commission (if any)

## 3.6 Trading Interface - Order Confirmation
- [x] Build confirmation modal
- [x] Show order summary
- [ ] Display portfolio impact
- [x] Add risk warnings for:
  - [ ] Large position size
  - [ ] High volatility assets
  - [x] Market orders after hours
- [x] Require explicit confirmation

## 3.7 Cloud Function: Execute Trade
- [x] Create `executeTrade` Cloud Function
- [x] Validate order parameters
- [x] Check user permissions (authentication)
- [x] Submit order to Alpaca
- [x] Handle order response
- [x] Update Firestore with order status
- [ ] Send confirmation notification
- [x] Log trade for audit

## 3.8 Order Status & History
- [x] Create orders collection in Firestore
- [x] Build order status component
- [x] Show pending orders
- [x] Display order fill details
- [x] Build trade history table
- [x] Add filters (status filter)
- [x] Add filters (date, symbol, side)
- [x] Implement pagination

## 3.9 Account Info Display
- [x] Fetch Alpaca account info (via testAlpacaConnection)
- [x] Display buying power
- [x] Display cash balance
- [x] Display portfolio value
- [x] Show account status
- [x] Display PDT status (if applicable)
- [x] Create Cloud Function for account info
