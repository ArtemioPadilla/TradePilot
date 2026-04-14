# TradePilot Development Checklists

Focused checklists for each development phase.

## Files

| File | Description |
|------|-------------|
| [00-DECISIONS.md](00-DECISIONS.md) | Critical design decisions requiring user input |
| [01-PHASE-0-SETUP.md](01-PHASE-0-SETUP.md) | Pre-development environment setup |
| [02-PHASE-1-FOUNDATION.md](02-PHASE-1-FOUNDATION.md) | Astro, Firebase, Auth, Admin console |
| [03-PHASE-2-PORTFOLIO.md](03-PHASE-2-PORTFOLIO.md) | Manual accounts, holdings, net worth |
| [04-PHASE-3-ALPACA.md](04-PHASE-3-ALPACA.md) | Broker integration, trading interface |
| [05-PHASE-4-BACKTESTING.md](05-PHASE-4-BACKTESTING.md) | Strategy UI, PyScript, results |
| [06-PHASE-5-STRATEGIES.md](06-PHASE-5-STRATEGIES.md) | Monaco editor, strategy builder |
| [07-PHASE-6-ALERTS.md](07-PHASE-6-ALERTS.md) | Alerts, push, email notifications |
| [08-PHASE-7-SOCIAL.md](08-PHASE-7-SOCIAL.md) | Sharing, leaderboards, copy trading |
| [09-PHASE-8-REPORTING.md](09-PHASE-8-REPORTING.md) | Reports, exports, calculators |
| [10-PHASE-9-PWA.md](10-PHASE-9-PWA.md) | Offline, performance, accessibility |
| [11-PHASE-10-DOCS.md](11-PHASE-10-DOCS.md) | API docs, guides, tutorials |
| [12-POST-LAUNCH.md](12-POST-LAUNCH.md) | Monitoring, security, maintenance |

## Status (April 14, 2026)

- **Phases 0-4**: Complete (web app compiles, 83/83 Python tests, 9 Firestore services, FastAPI bridge)
- **Phases 5-10**: In progress (14 service stubs remaining, see individual checklists for notes)
- **Service status summary**: See notes at top of each Phase 5-10 checklist

## Workflow

1. Start with **00-DECISIONS.md** - resolve critical decisions before implementation
2. Complete phases in order (dependencies exist between phases)
3. Check off items as completed
4. Reference **PLATFORM_PLAN.md** for detailed specifications
