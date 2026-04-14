# Phase 8: Reporting & Wealth

> **Status:** 40% complete. Export utils + calculators UI done. PDF, tax, backend missing.
> **Services:** risk-analytics.ts (stub→real), tax-calculations.ts (logic but no Firestore), goals.ts (stub→real)

## 8.1 PDF Report Generation
- [ ] Set up reportlab (Python) for PDF generation via FastAPI
- [ ] Create report templates (portfolio summary, performance, holdings, transactions)
- [ ] Generate PDF endpoint in api/server.py
- [ ] Store in Firebase Storage, return download URL

```
subagent: S8.1-pdf-reports
  input: api/server.py, tradepilot/metrics/
  output: api/reports.py, api/templates/report_portfolio.py
  acceptance: curl POST /api/report/portfolio returns valid PDF
  est: 60min
  deps: none
```

## 8.2 Report UI Backend Wiring
- [x] Reports page exists with placeholders
- [ ] Wire date range picker to backend
- [ ] Wire account filter to backend
- [ ] Show generation progress
- [ ] Display download link + past reports list

```
subagent: S8.2-report-ui-wiring
  input: web/src/pages/dashboard/reports.astro, web/src/components/reports/
  output: web/src/lib/services/reports.ts (API calls), updated report components
  acceptance: npm run build passes, report request → download link
  est: 30min
  deps: S8.1
```

## 8.3 CSV/JSON Export ✅ MOSTLY DONE
- [x] Export utilities, holdings/transactions/portfolio/performance CSV
- [ ] Handle large exports (streaming) — deferred to post-launch

## 8.4 Tax Report
- [ ] Calculate realized gains/losses from transaction history
- [ ] Group by short-term/long-term (>1 year holding)
- [ ] Generate tax lot report
- [ ] Export in common format (CSV compatible with turbotax)
- [ ] Add tax year filter

```
subagent: S8.4-tax-reports
  input: web/src/lib/services/tax-calculations.ts, web/src/types/reports.ts
  output: tax-calculations.ts (real Firestore impl), api/tax.py
  acceptance: python -m pytest passes, tax report generates for test data
  est: 60min
  deps: none
```

## 8.5 Financial Calculators — Remaining
- [x] Compound growth calculator done
- [ ] Retirement projector
- [ ] Risk tolerance questionnaire
- [ ] Asset allocation recommender

```
subagent: S8.5-calculators
  input: web/src/pages/tools.astro, web/src/components/tools/
  output: RetirementProjector.tsx, RiskQuestionnaire.tsx, AllocationRecommender.tsx
  acceptance: npm run build passes, all 4 calculators render
  est: 45min
  deps: none
```

## 8.6 Goals Backend
- [x] Goals data model + service + UI done
- [ ] Send milestone notifications when goal % reached

```
subagent: S8.6-goals-notifications
  input: web/src/lib/services/goals.ts, functions/src/
  output: functions/src/goals/checkMilestones.ts
  acceptance: firebase emulators pass, notification sent at 50%/75%/100%
  est: 20min
  deps: S6.4
```

## 8.7 Educational Content
- [ ] Glossary of trading terms
- [ ] Strategy explanations (what each one does, when to use)
- [ ] Risk management guides
- [ ] Integrate tooltips throughout app

```
subagent: S8.7-educational-content
  input: tradepilot/ranking/, tradepilot/optimization/, docs/guides/
  output: web/src/content/glossary.json, web/src/content/guides/, web/src/components/education/
  acceptance: npm run build passes, /learn page renders with content
  est: 45min
  deps: none
```
