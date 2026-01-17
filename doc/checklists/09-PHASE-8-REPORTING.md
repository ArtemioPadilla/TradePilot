# Phase 8: Reporting & Wealth

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
- [ ] Build reports page (`/reports`)
- [ ] Create report request form
  - [ ] Report type selector
  - [ ] Date range picker
  - [ ] Account filter
- [ ] Show generation progress
- [ ] Display download link
- [ ] List past reports

## 8.3 CSV/JSON Export
- [ ] Build export options menu
- [ ] Export holdings to CSV
- [ ] Export transactions to CSV
- [ ] Export portfolio snapshot to JSON
- [ ] Export performance data to CSV
- [ ] Handle large exports (streaming)

## 8.4 Tax Report
- [ ] Calculate realized gains/losses
- [ ] Group by short-term/long-term
- [ ] Generate tax lot report
- [ ] Export in 1099-compatible format
- [ ] Add tax year filter

## 8.5 Financial Calculators
- [ ] Build calculators page (`/tools`)
- [ ] Compound growth calculator
  - [ ] Initial investment input
  - [ ] Monthly contribution
  - [ ] Annual return rate
  - [ ] Time period
  - [ ] Result chart
- [ ] Retirement projector
  - [ ] Current age/retirement age
  - [ ] Current savings
  - [ ] Monthly savings
  - [ ] Expected return
  - [ ] Inflation adjustment
- [ ] Risk tolerance questionnaire
- [ ] Asset allocation recommender

## 8.6 Goal Setting
- [ ] Create goals data model
- [ ] Build goal creation form
  - [ ] Goal name
  - [ ] Target amount
  - [ ] Target date
  - [ ] Linked accounts
- [ ] Track progress toward goals
- [ ] Display goal progress widget
- [ ] Send milestone notifications

## 8.7 Educational Content
- [ ] Create content management structure
- [ ] Write glossary of terms
- [ ] Write strategy explanations
- [ ] Write risk management guides
- [ ] Build content display pages
- [ ] Integrate tooltips throughout app
- [ ] Link terms to glossary
