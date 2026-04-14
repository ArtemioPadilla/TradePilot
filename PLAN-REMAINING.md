# TradePilot — Remaining Work Plan (Post Phase 1-4)

## Current State (April 14, 2026)
- ✅ Web app compiles and runs (27 pages, 8.3s build)
- ✅ Python: 83/83 tests passing
- ✅ FastAPI bridge: api/server.py
- ✅ 9 core services with real Firestore (accounts, holdings, portfolio, networth, alpaca, profile, security, order-execution, offline-sync)
- ⚠️ 14 services still stubs
- ❌ Firebase Auth not configured (placeholder API key)
- ❌ No deploy (local tunnel only)

## Service Status

| Service | Lines | Status | Priority |
|---|---|---|---|
| accounts.ts | 110 | ✅ Real Firestore | — |
| holdings.ts | 160 | ✅ Real Firestore | — |
| portfolio.ts | 125 | ✅ Real Firestore | — |
| networth.ts | 109 | ✅ Real Firestore | — |
| alpaca.ts | 218 | ✅ Real Firestore | — |
| profile.ts | 163 | ✅ Real Firestore | — |
| security.ts | 83 | ✅ Real Firestore | — |
| order-execution.ts | 548 | ✅ Real Firestore | — |
| offline-sync.ts | 507 | ✅ Real Firestore | — |
| market-data/ | 2 files | ✅ Yahoo Finance API | — |
| **tax-calculations.ts** | 61 | ⚠️ Logic but no Firestore | P2 |
| **risk-analytics.ts** | 45 | ❌ Stub | P2 |
| **alerts.ts** | 19 | ❌ Stub | P2 |
| **notifications.ts** | 31 | ❌ Stub | P3 |
| **push-notifications.ts** | 19 | ❌ Stub | P3 |
| **watchlists.ts** | 34 | ❌ Stub | P2 |
| **goals.ts** | 27 | ❌ Stub | P3 |
| **leaderboard.ts** | 45 | ❌ Stub | P3 |
| **strategy-presets.ts** | 39 | ❌ Stub (calls API) | P1 |
| **backtest-execution.ts** | 29 | ❌ Stub (calls API) | P1 |
| **backtest-history.ts** | 25 | ❌ Stub | P1 |
| **account-sync.ts** | 9 | ❌ Stub | P2 |
| **position-sync.ts** | 15 | ❌ Stub | P2 |
| **integrations.ts** | 15 | ❌ Stub | P3 |
| **alpaca-websocket.ts** | 23 | ❌ Stub | P2 |
| **cloud-functions.ts** | 11 | ❌ Stub | P3 |

## Phase 5: Configuration & Auth (requires Artemio)

| Task | Description | Who | Time |
|---|---|---|---|
| 5A | Get Firebase API key from console.firebase.google.com/project/tradepilot-827d1 | Artemio | 5 min |
| 5B | Create .env file with real Firebase config | ArtemIO | 2 min |
| 5C | Test login/register flow | Both | 10 min |
| 5D | Create Alpaca paper trading account at app.alpaca.markets | Artemio | 5 min |

## Phase 6: Backtesting Integration (subagent work)

| Task | Description | Est. |
|---|---|---|
| 6A | Implement strategy-presets.ts — call FastAPI /strategies endpoint | 30 min |
| 6B | Implement backtest-execution.ts — call FastAPI /backtest, store results in Firestore | 1 hr |
| 6C | Implement backtest-history.ts — read past backtests from Firestore | 30 min |
| 6D | Start FastAPI server alongside web (or as Cloud Function) | 30 min |
| 6E | Create backtest results visualization component | 2 hrs |

## Phase 7: Real-time Trading Features (subagent work)

| Task | Description | Est. |
|---|---|---|
| 7A | Implement alpaca-websocket.ts — real-time price streaming via Alpaca WebSocket | 2 hrs |
| 7B | Implement position-sync.ts — sync Alpaca positions to Firestore periodically | 1 hr |
| 7C | Implement account-sync.ts — sync account balances from Alpaca | 1 hr |
| 7D | Implement alerts.ts — price/portfolio alerts with Firestore persistence | 1 hr |
| 7E | Implement watchlists.ts — CRUD watchlists in Firestore | 30 min |

## Phase 8: Analytics & Reports (subagent work)

| Task | Description | Est. |
|---|---|---|
| 8A | Implement risk-analytics.ts — VaR, Sharpe, drawdown from holdings data | 2 hrs |
| 8B | Implement tax-calculations.ts — connect to Firestore, calculate gains/losses | 1 hr |
| 8C | Implement goals.ts — financial goals tracking with progress | 1 hr |
| 8D | Implement leaderboard.ts — community rankings from Firestore | 1 hr |

## Phase 9: Social & Notifications (subagent work)

| Task | Description | Est. |
|---|---|---|
| 9A | Implement notifications.ts — in-app notification center | 1 hr |
| 9B | Implement push-notifications.ts — Firebase Cloud Messaging | 1 hr |
| 9C | Implement integrations.ts — multi-broker adapter (Alpaca, Interactive Brokers stub) | 2 hrs |
| 9D | Implement cloud-functions.ts — call Firebase Functions from web | 30 min |

## Phase 10: Deploy & Production (final)

| Task | Description | Est. |
|---|---|---|
| 10A | Firebase Hosting deploy (or GitHub Pages) | 30 min |
| 10B | Cloud Functions deploy | 15 min |
| 10C | FastAPI deploy (Cloud Run or Railway) | 1 hr |
| 10D | Custom domain setup | 30 min |
| 10E | Production security audit | 2 hrs |
| 10F | Performance optimization (Lighthouse > 90) | 2 hrs |

## Dependency Graph

```
Phase 5 (config — Artemio manual):
  5A → 5B → 5C → 5D

Phase 6 (backtesting — parallel):
  6A ─┐
  6B ─┤── All parallel after Phase 5
  6C ─┤
  6D ─┘
  6E (depends on 6B)

Phase 7 (trading — parallel):
  7A ─┐
  7B ─┤── All parallel after Phase 5
  7C ─┤
  7D ─┤
  7E ─┘

Phase 8 (analytics — parallel after Phase 7):
  8A ─┐
  8B ─┤── All parallel
  8C ─┤
  8D ─┘

Phase 9 (social — parallel):
  9A ─┐
  9B ─┤── All parallel
  9C ─┤
  9D ─┘

Phase 10 (deploy — sequential):
  10A → 10B → 10C → 10D → 10E → 10F
```

## Estimated Total Remaining

| Phase | Parallel Time | Sequential Time |
|---|---|---|
| Phase 5 (config) | 20 min (manual) | 20 min |
| Phase 6 (backtesting) | 2 hrs | 5 hrs |
| Phase 7 (trading) | 2 hrs | 5.5 hrs |
| Phase 8 (analytics) | 2 hrs | 5 hrs |
| Phase 9 (social) | 1.5 hrs | 4.5 hrs |
| Phase 10 (deploy) | — | 6 hrs |
| **Total** | **~8 hrs (parallel)** | **~26 hrs** |

With 4-6 subagents: Phases 6-9 can run in parallel (~4 hrs total).
Phase 5 needs Artemio (20 min). Phase 10 is sequential (6 hrs).

**Realistic timeline: 2-3 dedicated sessions to fully complete.**
