# TradePilot — Implementation Plan

## Current State

### ✅ What Works
- Python backtesting core: optimization (MSR, GMV, equal-weight), ranking (momentum, random), data fetching (yfinance)
- 34/83 Python tests pass
- Web UI components exist (Astro + React + Tailwind)
- Firebase project configured (tradepilot-827d1)
- Firestore rules + indexes defined
- Cloud Functions (11 functions, 2 minor TS errors)

### ❌ What's Broken
- Web app won't compile: 62 missing modules, 116+ broken imports
- `web/src/lib/firebase.ts` doesn't exist — 17+ files depend on it
- `web/src/lib/utils/` doesn't exist — 13+ files depend on it
- 24+ service modules missing (entire data layer)
- Python: 49 test failures (param naming, config, data format)
- Firebase Functions: 2 TS errors, not wired in firebase.json

## PMSS.py → TradePilot Feature Map

| PMSS.py Feature (original) | TradePilot Module | Status |
|---|---|---|
| Asset universe & data download | `tradepilot/data.py` (MarketData) | ✅ Works |
| Risk-free rate (Treasury CSV) | `tradepilot/data.py` (OpenData) | ⚠️ CSV format changed |
| Momentum ranking | `tradepilot/ranking.py` | ✅ Works |
| Random ranking | `tradepilot/ranking.py` | ✅ Works |
| Max Sharpe Ratio optimization | `tradepilot/optimization.py` | ✅ Works |
| Global Min Variance optimization | `tradepilot/optimization.py` | ✅ Works |
| Equal-weight portfolio | `tradepilot/optimization.py` | ✅ Works |
| Backtesting simulation loop | `tradepilot/simulator.py` (TPS) | ⚠️ 6 tests fail (Treasury) |
| Performance metrics (Sharpe, DD) | `tradepilot/metrics.py` | ⚠️ Float precision |
| Portfolio evaluation vs S&P 500 | `tradepilot/portfolios.py` | ✅ Works |
| Plotly visualizations | `_old/PMSS.py` only | ❌ Not ported to web |
| Live trading | `tradepilot/broker.py` (Alpaca) | ⚠️ Config broken |
| Web dashboard | `web/` | ❌ Won't compile |
| User auth | `web/` (Firebase Auth) | ❌ firebase.ts missing |
| Portfolio persistence | `web/` (Firestore) | ❌ Services missing |

## Missing Files Inventory

### Phase 1: Foundation (Independent — can run in parallel)

| Task | File(s) to Create | Imports From | Est. Lines |
|---|---|---|---|
| 1A | `web/src/lib/firebase.ts` | firebase/app, firebase/auth, firebase/firestore | ~80 |
| 1B | `web/src/lib/types.ts` | None | ~200 |
| 1C | `web/src/lib/utils/index.ts` + `calculators.ts` + `export.ts` + `csv-parser.ts` | types.ts | ~300 |
| 1D | `web/src/lib/admin.ts` + `invites.ts` | firebase.ts | ~60 |
| 1E | Fix Python tests: rename params in `test_backtest.py`, fix `config.py` env vars | None | ~20 changes |
| 1F | Fix Functions TS errors + add to firebase.json | None | ~5 changes |

### Phase 2: Core Services (Depends on Phase 1)

| Task | File(s) to Create | Description | Est. Lines |
|---|---|---|---|
| 2A | `services/accounts.ts` + `holdings.ts` | CRUD for accounts + positions | ~400 |
| 2B | `services/portfolio.ts` + `networth.ts` | Portfolio aggregation, net worth tracking | ~300 |
| 2C | `services/market-data/service.ts` + `market-data/index.ts` | Real-time + historical price data | ~250 |
| 2D | `services/alpaca.ts` + `data-providers/alpaca.ts` | Alpaca API integration for web | ~350 |
| 2E | `services/integrations.ts` + `adapters/types.ts` + `adapters/index.ts` | Multi-broker adapter pattern | ~200 |
| 2F | `services/profile.ts` + `security.ts` | User profile + security settings | ~150 |

### Phase 3: Feature Services (Depends on Phase 2)

| Task | File(s) to Create | Description | Est. Lines |
|---|---|---|---|
| 3A | `services/risk-analytics.ts` | VaR, drawdown, correlation | ~200 |
| 3B | `services/tax-calculations.ts` | Capital gains, wash sales | ~200 |
| 3C | `services/alerts.ts` + `notifications.ts` | Price alerts, portfolio alerts | ~250 |
| 3D | `services/leaderboard.ts` | Community rankings | ~150 |
| 3E | `services/watchlists.ts` | Watchlist CRUD | ~100 |
| 3F | `services/strategies/` (presets, backtest-execution, backtest-history) | Strategy management | ~400 |
| 3G | `services/goals.ts` | Financial goals tracking | ~150 |

### Phase 4: Integration (Depends on Phase 3)

| Task | Description | Est. |
|---|---|---|
| 4A | E2E test updates for all new services | ~500 lines |
| 4B | Firebase deploy (functions + hosting) | Config only |
| 4C | Cloudflare tunnel for local testing | Config only |
| 4D | Connect Python backtesting to web (API bridge) | ~300 lines |

## Dependency Graph

```
Phase 1 (all parallel):
  1A: firebase.ts ──┐
  1B: types.ts ─────┤
  1C: utils/ ───────┤
  1D: admin.ts ─────┤── All independent
  1E: Python fixes ─┤
  1F: Functions fix ─┘

Phase 2 (depends on 1A, 1B, 1C):
  2A: accounts ──────┐
  2B: portfolio ─────┤── Parallel after Phase 1
  2C: market-data ───┤
  2D: alpaca ────────┤
  2E: integrations ──┤
  2F: profile ───────┘

Phase 3 (depends on 2A-2F):
  3A: risk ──────────┐
  3B: tax ───────────┤
  3C: alerts ────────┤── Parallel after Phase 2
  3D: leaderboard ───┤
  3E: watchlists ────┤
  3F: strategies ────┤
  3G: goals ─────────┘

Phase 4 (depends on all):
  4A: E2E tests
  4B: Firebase deploy
  4C: Tunnel
  4D: Python bridge
```

## Subagent Specifications

### Task 1A: Create firebase.ts
**Input:** Read `web/src/components/auth/AuthProvider.tsx`, `LoginForm.tsx`, `RegisterForm.tsx` to see what's imported
**Output:** `web/src/lib/firebase.ts` exporting: `initializeApp`, `getFirebaseAuth`, `getFirebaseDb`, `signInWithEmail`, `signInWithGoogle`, `signUpWithEmail`, `signOut`, `sendPasswordReset`, `onAuthStateChanged`
**Firebase config:** Use project `tradepilot-827d1` — get config from Firebase console or use placeholder with env vars
**Acceptance:** `cd web && npx tsc --noEmit src/lib/firebase.ts` passes
**Time:** 30 min

### Task 1B: Create types.ts
**Input:** Read all .tsx files for type imports, read `web/src/components/` for interfaces used
**Output:** `web/src/lib/types.ts` with all shared interfaces (User, Account, Holding, Portfolio, Trade, etc.)
**Acceptance:** No type errors referencing types.ts
**Time:** 45 min

### Task 1C: Create utils/
**Input:** Read files importing from `../../lib/utils`
**Output:** `web/src/lib/utils/index.ts`, `calculators.ts`, `export.ts`, `csv-parser.ts`
**Acceptance:** All util imports resolve
**Time:** 30 min

### Task 1E: Fix Python tests
**Input:** Read `tests/test_backtest.py`, `tradepilot/config.py`
**Output:** Fix param names (capital→initial_capital, rf→risk_free), fix config.py to read env vars
**Acceptance:** `pytest tests/test_backtest.py` passes, `pytest tests/test_broker.py` passes
**Time:** 15 min

### Task 2A: Create account services
**Input:** Read `AccountsList.tsx`, `AccountDetail.tsx`, `AuthProvider.tsx` for what data they expect
**Output:** `web/src/lib/services/accounts.ts`, `holdings.ts` — Firestore CRUD with real-time listeners
**Acceptance:** Account list page loads without errors
**Time:** 2 hours

(Remaining tasks follow same pattern — read consumers, create providers, verify no errors)

## Estimated Total Effort

| Phase | Tasks | Parallel Time | Sequential Time |
|---|---|---|---|
| Phase 1 | 6 tasks | 45 min (parallel) | 3 hours |
| Phase 2 | 6 tasks | 2 hours (parallel) | 8 hours |
| Phase 3 | 7 tasks | 2 hours (parallel) | 10 hours |
| Phase 4 | 4 tasks | 1 hour (parallel) | 4 hours |
| **Total** | **23 tasks** | **~6 hours (parallel)** | **~25 hours** |

With 4-6 subagents running in parallel, Phase 1+2 can be done in a single session (~3 hours).
