# Phase 8: Reporting & Wealth

> **Remaining services:** risk-analytics.ts (stub, P2), tax-calculations.ts (has logic but no Firestore, P2), goals.ts (stub, P3).
> Export utilities and calculator UI are in place. PDF generation and tax reports need backend work.

## 8.1 PDF Report Generation
- [ ] Choose PDF library (puppeteer/reportlab)
- [ ] Create `generateReport` Cloud Function
- [ ] Design report templates
  - [ ] Portfolio summary
  - [ ] Performance report
  - [ ] Holdings detail
  - [ ] Transaction history
- [ ] Generate PDF from template
- [ ] Store in Firebase Storage
- [ ] Return download URL

## 8.2 Report UI
- [x] Build reports page (`/dashboard/reports`)
- [x] Create report request form (UI placeholders)
  - [x] Report type selector
  - [ ] Date range picker (pending backend)
  - [ ] Account filter (pending backend)
- [ ] Show generation progress
- [ ] Display download link
- [ ] List past reports

## 8.3 CSV/JSON Export
- [x] Build export utilities (`lib/utils/export.ts`)
- [x] Build export options menu component
- [x] Export holdings to CSV
- [x] Export transactions to CSV
- [x] Export portfolio snapshot to JSON
- [x] Export performance data to CSV
- [ ] Handle large exports (streaming) - pending backend

## 8.4 Tax Report
- [ ] Calculate realized gains/losses
- [ ] Group by short-term/long-term
- [ ] Generate tax lot report
- [ ] Export in 1099-compatible format
- [ ] Add tax year filter

## 8.5 Financial Calculators
- [x] Build calculators page (`/tools`)
- [x] Compound growth calculator
  - [x] Initial investment input
  - [x] Monthly contribution
  - [x] Annual return rate
  - [x] Time period
  - [x] Result display with chart
- [ ] Retirement projector (UI placeholder)
- [ ] Risk tolerance questionnaire (UI placeholder)
- [ ] Asset allocation recommender

## 8.6 Goal Setting
- [x] Create goals data model (`types/reports.ts`)
- [x] Create goals service (`lib/services/goals.ts`)
- [x] Build goal creation form
  - [x] Goal name
  - [x] Target amount
  - [x] Target date
  - [x] Category selection
  - [x] Monthly contribution (optional)
- [x] Track progress toward goals
- [x] Display goal progress widget
- [ ] Send milestone notifications (pending backend)

## 8.7 Educational Content
- [ ] Create content management structure
- [ ] Write glossary of terms
- [ ] Write strategy explanations
- [ ] Write risk management guides
- [ ] Build content display pages
- [ ] Integrate tooltips throughout app
- [ ] Link terms to glossary
