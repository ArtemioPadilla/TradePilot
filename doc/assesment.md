# TradePilot — Project Assessment

> Last updated: April 14, 2026

## Current State

### What Works
- **Python backtesting core**: 83/83 tests passing
  - Optimization: MSR, GMV, equal-weight
  - Ranking: momentum, random
  - Data fetching: yfinance, Treasury risk-free rates
  - Simulation, backtest evaluation, portfolio metrics
- **Web application**: compiles and runs (Astro + React, 27 pages, ~8s build)
  - Firebase Authentication (login, register, invite system, admin approval)
  - 3 themes (Bloomberg Terminal, Modern Fintech, Dashboard Dark)
  - Dashboard with portfolio widgets
  - Account and holdings management UI
  - Trading interface (order form, order history)
  - Backtesting UI (strategy selector, config wizard, results visualization)
  - Alerts, notifications, leaderboard, strategy sharing pages
- **FastAPI bridge** (`api/server.py`): connects Python backtesting to web app
- **9 Firestore services** with real implementations:
  - accounts, holdings, portfolio, networth, alpaca, profile, security, order-execution, offline-sync
  - Market data service (Yahoo Finance API)
- **CI/CD**: GitHub Actions for tests, deployment, Lighthouse audits

### What Needs Work
- **14 service stubs** remaining (see `doc/checklists/` Phase 5-10 items)
- **Firebase Auth** not configured with real API key (placeholder)
- **No production deploy** yet (local development only)
- **PyScript integration** not implemented (backtest execution uses mock/FastAPI)

## April 12-14, 2026 Sprint Summary

### Phase 1 — Foundation
- Created `web/src/lib/firebase.ts` (client configuration)
- Created `web/src/lib/types.ts` (shared TypeScript interfaces)
- Created `web/src/lib/utils/` (calculators, export, CSV parser)
- Fixed all 83 Python tests (param naming, config, data format issues)

### Phase 2 — Portfolio Core
- Implemented Firestore services: accounts, holdings, portfolio, networth
- All CRUD operations with real Firestore integration

### Phase 3 — Alpaca Integration
- Implemented Firestore services: alpaca, order-execution, market-data
- WebSocket manager, position sync, credential management

### Phase 4 — Backtesting
- Created FastAPI bridge (`api/server.py`) with endpoints for strategies, backtests
- Implemented backtest execution and history services
- Updated E2E tests (666 tests defined)

## Strengths
- Modular architecture with clear separation of concerns
- Unified backtesting + live trading in Python core
- Comprehensive UI with 27 pages covering full trading workflow
- Well-documented with checklists tracking every feature

## Areas for Improvement
- Error handling in broker API integration needs hardening
- Risk management features are basic (no stop-loss/take-profit)
- Real-time data relies on Yahoo Finance (adequate for dev, not production)
- Live trading module uses simple polling loop (should be event-driven)
- Need production deployment pipeline

## Remaining Work
See `doc/checklists/` for detailed phase-by-phase tracking:
- Phase 5: Strategy Builder (Monaco editor, sandbox execution)
- Phase 6: Alerts & Notifications (backend integration)
- Phase 7: Social Features (leaderboard Cloud Functions)
- Phase 8: Reporting & Wealth (PDF generation, tax reports)
- Phase 9: PWA & Polish (service worker, offline, performance)
- Phase 10: Documentation (API docs, tutorials)
- Post-Launch: Monitoring, security audit, maintenance
