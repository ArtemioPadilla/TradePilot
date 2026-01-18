# Phase 2: Portfolio Core

## 2.0 E2E Tests (Required)
- [x] Write E2E tests for accounts page
- [x] Write E2E tests for holdings/positions (42 tests)
- [x] Write E2E tests for CSV import flow (22 tests)
- [x] Write E2E tests for DataTable features (42 tests)
- [x] Write E2E tests for portfolio calculations display (60 tests)
- [x] Write E2E tests for dashboard components (64 tests)
- [x] Ensure all tests pass (350 tests passing)

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
- [x] Build account detail page (`/dashboard/account?id=`)
- [x] Add account deletion with confirmation

## 2.3 Manual Position Entry
- [x] Build "Add Position" form
  - [x] Symbol input
  - [x] Quantity input
  - [x] Cost basis input (per-share)
  - [x] Purchase date picker
  - [x] Asset type selector
  - [x] Handle adding to existing position
- [x] Implement position CRUD operations (via holdings service)
- [x] Build position edit modal
- [x] Add position close/sell flow
- [x] Handle partial position sales

## 2.4 CSV Import
- [x] Design CSV format specification
- [x] Build CSV upload component
- [x] Implement CSV parsing logic
- [x] Create import preview table
- [x] Handle validation errors
- [x] Bulk insert positions
- [x] Show import success/failure summary

## 2.5 Holdings Table
- [x] Create `<DataTable>` component
- [x] Build holdings table with columns:
  - [x] Symbol
  - [x] Quantity
  - [x] Current price
  - [x] Market value
  - [x] Cost basis
  - [x] P&L ($)
  - [x] P&L (%)
  - [x] Daily change
  - [x] Weight (%)
- [x] Implement column sorting
- [x] Implement column filtering
- [x] Add row selection
- [x] Create bulk actions menu

## 2.6 Portfolio Calculations
- [x] Calculate total portfolio value
- [x] Calculate total cost basis
- [x] Calculate total P&L
- [x] Calculate position weights
- [x] Calculate daily change (requires price data)
- [x] Handle multi-currency aggregation
- [x] Calculate portfolio diversity score
- [x] Calculate allocation by asset type
- [x] Calculate allocation by account

## 2.7 Net Worth Tracking
- [x] Create net worth data model
- [x] Build net worth chart component
- [x] Implement snapshot service (Cloud Function can be added later)
- [x] Display net worth on dashboard
- [x] Add date range selector
- [x] Show change over period
- [x] Show period stats (high, low, average)

## 2.8 Asset Allocation
- [x] Fetch asset metadata (sector, asset class)
- [x] Calculate allocation by asset class
- [x] Calculate allocation by sector
- [x] Build pie/donut chart component
- [x] Add allocation breakdown table (legend)
- [x] Support custom groupings (via grouping selector)

## 2.9 Performance Metrics Display
- [x] Create `<MetricCard>` component
- [x] Display total return
- [x] Display annualized return
- [x] Display Sharpe ratio (with RFR)
- [x] Display max drawdown
- [x] Display volatility
- [x] Display Sortino ratio
- [x] Add tooltips explaining each metric
