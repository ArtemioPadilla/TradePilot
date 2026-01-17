# Phase 3: Alpaca Integration

## 3.1 Credential Management
- [ ] Build Alpaca connection form
  - [ ] API Key input
  - [ ] API Secret input (masked)
  - [ ] Environment toggle (paper/live)
  - [ ] Test connection button
- [ ] Encrypt credentials before storage
- [ ] Store in user's Firestore document
- [ ] Create credential update flow
- [ ] Add credential deletion

## 3.2 Cloud Function: Position Sync
- [ ] Create `syncPositions` Cloud Function
- [ ] Initialize Alpaca client with user credentials
- [ ] Fetch positions from Alpaca API
- [ ] Map Alpaca positions to app data model
- [ ] Update Firestore holdings
- [ ] Handle sync errors gracefully
- [ ] Set up scheduled trigger (every 5 min)
- [ ] Add manual sync button in UI

## 3.3 Real-time Price WebSocket
- [ ] Create WebSocket connection manager
- [ ] Connect to Alpaca market data stream
- [ ] Subscribe to symbols in portfolio
- [ ] Update prices in Firestore cache
- [ ] Broadcast updates to connected clients
- [ ] Handle WebSocket reconnection
- [ ] Implement heartbeat/keep-alive
- [ ] Clean up on disconnect

## 3.4 Price Display Components
- [ ] Create `<PriceDisplay>` component
- [ ] Show current price
- [ ] Show change amount
- [ ] Show change percentage
- [ ] Color code positive/negative
- [ ] Add loading state
- [ ] Add stale data indicator

## 3.5 Trading Interface - Order Form
- [ ] Create order form component
  - [ ] Symbol display/search
  - [ ] Side selector (buy/sell)
  - [ ] Order type dropdown
  - [ ] Quantity input
  - [ ] Limit price input (conditional)
  - [ ] Stop price input (conditional)
  - [ ] Dollar amount toggle
- [ ] Calculate estimated cost/proceeds
- [ ] Show buying power
- [ ] Validate order parameters
- [ ] Display commission (if any)

## 3.6 Trading Interface - Order Confirmation
- [ ] Build confirmation modal
- [ ] Show order summary
- [ ] Display portfolio impact
- [ ] Add risk warnings for:
  - [ ] Large position size
  - [ ] High volatility assets
  - [ ] Market orders after hours
- [ ] Require explicit confirmation

## 3.7 Cloud Function: Execute Trade
- [ ] Create `executeTrade` Cloud Function
- [ ] Validate order parameters
- [ ] Check user permissions
- [ ] Submit order to Alpaca
- [ ] Handle order response
- [ ] Update Firestore with order status
- [ ] Send confirmation notification
- [ ] Log trade for audit

## 3.8 Order Status & History
- [ ] Create orders collection in Firestore
- [ ] Build order status component
- [ ] Show pending orders
- [ ] Display order fill details
- [ ] Build trade history table
- [ ] Add filters (date, symbol, side)
- [ ] Implement pagination

## 3.9 Account Info Display
- [ ] Fetch Alpaca account info
- [ ] Display buying power
- [ ] Display cash balance
- [ ] Display portfolio value
- [ ] Show account status
- [ ] Display PDT status (if applicable)
