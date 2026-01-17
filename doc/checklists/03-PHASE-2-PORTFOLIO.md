# Phase 2: Portfolio Core

## 2.0 E2E Tests (Required)
- [x] Write E2E tests for accounts page
- [ ] Write E2E tests for holdings/positions
- [ ] Write E2E tests for CSV import flow
- [ ] Write E2E tests for portfolio calculations display
- [ ] Ensure all tests pass before completing phase

## 2.1 Data Models
- [x] Define TypeScript interfaces for Account
- [x] Define TypeScript interfaces for Holding
- [x] Define TypeScript interfaces for Transaction
- [x] Create Firestore converters for type safety
- [x] Document data model in code comments
- [x] Create accounts service (CRUD operations)
- [x] Create holdings service (CRUD operations)

## 2.2 Manual Account Management
- [x] Build accounts list page (`/dashboard/accounts`)
- [x] Create "Add Account" modal/form
  - [x] Account name input
  - [x] Account type selector (brokerage/401k/IRA/crypto/other)
  - [x] Currency selector
  - [x] Notes field
  - [x] Institution field
  - [x] Starting cash balance
  - [x] Set as default option
- [x] Implement account CRUD operations
- [ ] Build account detail page (`/dashboard/accounts/[id]`)
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
