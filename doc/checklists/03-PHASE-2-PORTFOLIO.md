# Phase 2: Portfolio Core

## 2.1 Data Models
- [ ] Define TypeScript interfaces for Account
- [ ] Define TypeScript interfaces for Holding
- [ ] Define TypeScript interfaces for Transaction
- [ ] Create Firestore converters for type safety
- [ ] Document data model in code comments

## 2.2 Manual Account Management
- [ ] Build accounts list page (`/accounts`)
- [ ] Create "Add Account" modal/form
  - [ ] Account name input
  - [ ] Account type selector (brokerage/401k/IRA/crypto/other)
  - [ ] Currency selector
  - [ ] Notes field
- [ ] Implement account CRUD operations
- [ ] Build account detail page (`/accounts/[id]`)
- [ ] Add account deletion with confirmation

## 2.3 Manual Position Entry
- [ ] Build "Add Position" form
  - [ ] Symbol search/autocomplete
  - [ ] Quantity input
  - [ ] Cost basis input (total or per-share)
  - [ ] Purchase date picker
- [ ] Implement position CRUD operations
- [ ] Build position edit modal
- [ ] Add position close/sell flow
- [ ] Handle partial position sales

## 2.4 CSV Import
- [ ] Design CSV format specification
- [ ] Build CSV upload component
- [ ] Implement CSV parsing logic
- [ ] Create import preview table
- [ ] Handle validation errors
- [ ] Bulk insert positions
- [ ] Show import success/failure summary

## 2.5 Holdings Table
- [ ] Create `<DataTable>` component
- [ ] Build holdings table with columns:
  - [ ] Symbol
  - [ ] Quantity
  - [ ] Current price
  - [ ] Market value
  - [ ] Cost basis
  - [ ] P&L ($)
  - [ ] P&L (%)
  - [ ] Daily change
  - [ ] Weight (%)
- [ ] Implement column sorting
- [ ] Implement column filtering
- [ ] Add row selection
- [ ] Create bulk actions menu

## 2.6 Portfolio Calculations
- [ ] Calculate total portfolio value
- [ ] Calculate total cost basis
- [ ] Calculate total P&L
- [ ] Calculate position weights
- [ ] Calculate daily change (requires price data)
- [ ] Handle multi-currency aggregation

## 2.7 Net Worth Tracking
- [ ] Create net worth data model
- [ ] Build net worth chart component
- [ ] Implement daily snapshot Cloud Function
- [ ] Display net worth on dashboard
- [ ] Add date range selector
- [ ] Show change over period

## 2.8 Asset Allocation
- [ ] Fetch asset metadata (sector, asset class)
- [ ] Calculate allocation by asset class
- [ ] Calculate allocation by sector
- [ ] Build pie/donut chart component
- [ ] Add allocation breakdown table
- [ ] Support custom groupings

## 2.9 Performance Metrics Display
- [ ] Create `<MetricCard>` component
- [ ] Display total return
- [ ] Display annualized return
- [ ] Display Sharpe ratio (requires RFR)
- [ ] Display max drawdown
- [ ] Display volatility
- [ ] Add tooltips explaining each metric
