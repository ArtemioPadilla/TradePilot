# TradePilot Development Checklists

## Status Dashboard (April 14, 2026)

| Phase | Status | Progress | Subagent-Ready |
|-------|--------|----------|----------------|
| Phase 0: Setup | ✅ DONE | 100% | — |
| Phase 1: Foundation | ✅ DONE | 100% | — |
| Phase 2: Portfolio | ✅ DONE | 100% | — |
| Phase 3: Alpaca | ✅ DONE | 100% | — |
| Phase 4: Backtesting | ✅ DONE | 100% | — |
| **Phase 5: Strategy Builder** | 🔵 NEXT | 60% | ✅ 5 tasks |
| Phase 5.5: Plugin Architecture | 🆕 NEW | 0% | ✅ 4 tasks |
| Phase 6: Alerts | 🟡 Partial | 80% | ✅ 3 tasks |
| Phase 7: Social | 🟡 Partial | 85% | ✅ 2 tasks |
| Phase 8: Reporting | 🟡 Partial | 40% | ✅ 6 tasks |
| Phase 9: PWA & Polish | 🟡 Partial | 50% | ✅ 8 tasks |
| Phase 10: Docs | 🔴 Minimal | 20% | ✅ 5 tasks |
| Phase 11: AI Features | 🆕 NEW | 0% | ✅ 4 tasks |
| Post-Launch | 🔴 Not started | 0% | ✅ 4 tasks |

**Total remaining subagent tasks: ~41**
**Estimated total effort: ~60 hours of subagent time**

## Execution Model

Each unchecked task includes a **subagent spec** with:
- **Input:** files the subagent needs to read
- **Output:** files to create/modify
- **Acceptance:** how to verify it works
- **Est:** estimated subagent time
- **Deps:** dependencies on other tasks

Tasks with no dependencies can run **in parallel**.

## Priority Order

1. **Phase 5** — Strategy Builder (connects Python ↔ Web, enables backtesting from UI)
2. **Phase 5.5** — Plugin Architecture (enables community contributions)
3. **Phase 11** — AI Features (killer differentiator, no competitor has this)
4. **Phase 6** — Alerts (small remaining work, high user value)
5. **Phase 7** — Social (small remaining work)
6. **Phase 8** — Reporting (PDF, tax, big but optional for MVP)
7. **Phase 9** — PWA (polish, offline)
8. **Phase 10** — Docs (can always be done later)

## Blocker

⚠️ **Firebase API key** — Artemio needs to add real API key to `.env`. Without it, auth doesn't work and nothing past Phase 4 is testable end-to-end.

## Files

| File | Description |
|------|-------------|
| [00-DECISIONS.md](00-DECISIONS.md) | Critical design decisions (19 open) |
| [01-PHASE-0-SETUP.md](01-PHASE-0-SETUP.md) | ✅ Environment setup |
| [02-PHASE-1-FOUNDATION.md](02-PHASE-1-FOUNDATION.md) | ✅ Astro, Firebase, Auth |
| [03-PHASE-2-PORTFOLIO.md](03-PHASE-2-PORTFOLIO.md) | ✅ Accounts, holdings, net worth |
| [04-PHASE-3-ALPACA.md](04-PHASE-3-ALPACA.md) | ✅ Broker integration, trading |
| [05-PHASE-4-BACKTESTING.md](05-PHASE-4-BACKTESTING.md) | ✅ Strategy UI, results display |
| [06-PHASE-5-STRATEGIES.md](06-PHASE-5-STRATEGIES.md) | 🔵 Monaco editor, validation, sandbox |
| [06b-PHASE-5.5-PLUGINS.md](06b-PHASE-5.5-PLUGINS.md) | 🆕 Plugin architecture for extensibility |
| [07-PHASE-6-ALERTS.md](07-PHASE-6-ALERTS.md) | 🟡 Push/email notification backends |
| [08-PHASE-7-SOCIAL.md](08-PHASE-7-SOCIAL.md) | 🟡 Leaderboard Cloud Function |
| [09-PHASE-8-REPORTING.md](09-PHASE-8-REPORTING.md) | 🟡 PDF, tax, calculators |
| [10-PHASE-9-PWA.md](10-PHASE-9-PWA.md) | 🟡 Service worker, offline, perf |
| [11-PHASE-10-DOCS.md](11-PHASE-10-DOCS.md) | 🔴 API docs, guides, tutorials |
| [11b-PHASE-11-AI.md](11b-PHASE-11-AI.md) | 🆕 AI Strategy Builder (killer feature) |
| [12-POST-LAUNCH.md](12-POST-LAUNCH.md) | Deploy, monitoring, security |
