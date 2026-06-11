# TradePilot Web Rebuild on Inceptor — Design

**Date:** 2026-06-11
**Status:** Approved (pending spec review)
**Decision:** Rebuild `web/` in place on the Inceptor template, with Supabase replacing Firebase behind an adapter layer, full feature parity in phases, plus a new advanced Backtest Lab.

## Context

- TradePilot's web app (Astro 5 + React 19 + Firebase) is pre-launch with no real users. The backtest UI currently shows mocked results; the TS engine (`web/src/lib/engine/`, ~1,560 lines) is complete but unwired.
- Inceptor (`/Users/artemiopadilla/Documents/repos/GitHub/personal/issue-driven-web-template`) is a production-grade Astro 5 + React 19 template: ~44 owned UI components (Base UI/shadcn-style, Tailwind v4), TanStack Table/Query/Virtual, PWA/offline, Issue-Driven Development (sub-agents `prometeo`/`forja`/`centinela`, GitHub workflows, `FeedbackFAB`), visual/a11y/Lighthouse quality tooling.
- Goal ("leapfrog"): adopt all of it — IDD workflow, UI kit, quality infra — via a clean rebuild.

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Where the rebuild lives | Replace `web/` in the monorepo | Keeps Python engine + web + issues together; old code preserved in git |
| Migration strategy | **Template-first**: copy Inceptor clean, port features into it | Pre-launch + solo user → no value in strangler/parallel approaches; zero hybrid debt |
| Backend | **Adapter layer + Supabase direct** (Postgres + Auth) | User preference; no users/data to migrate so cost is low; adapter keeps backend swappable (CyberEco Tenet #2) |
| Scope | Full parity in phases + new **Backtest Lab** | All four feature areas selected; Lab = multi-strategy compare, sweeps, walk-forward, benchmarks |
| Deferred | Live trading, `broker_connections`, admin panel | Postponed until there are users; encrypted-at-rest design documented |
| Python package | Untouched | `tradepilot/`, `strategies/`, `api/` unaffected |

## 1. Architecture

```
TradePilot (monorepo)
├── tradepilot/          ← Python: untouched
├── strategies/, api/    ← untouched
└── web/                 ← REBUILD: Inceptor base
    ├── .claude/agents/  ← prometeo, forja, centinela (adapted)
    ├── src/
    │   ├── components/
    │   │   ├── ui/          ← Inceptor kit (~44 owned components)
    │   │   ├── islands/     ← TradePilot React islands
    │   │   └── common/      ← shared Astro components (FeedbackFAB)
    │   ├── lib/
    │   │   ├── engine/      ← TS engine, ported + extended
    │   │   ├── data/        ← ADAPTER LAYER (new)
    │   │   │   ├── contracts.ts   ← per-domain repository interfaces
    │   │   │   └── supabase/      ← Supabase implementation
    │   │   └── queryClient, utils
    │   ├── schemas/     ← shared Zod schemas (validation + types)
    │   ├── stores/      ← nanostores ($session, theme, cross-island)
    │   └── pages/       ← Astro routes (zero JS by default)
    └── supabase/        ← SQL migrations + CLI config
```

Principles inherited from Inceptor:

- **Islands architecture**: pages are static Astro; React only for interactive surfaces (Backtest Lab, editor, dashboard).
- **Closed stack**: no dependencies beyond Inceptor's curated stack. TradePilot's only justified additions: `@supabase/supabase-js`, `@monaco-editor/react`.
- **State**: TanStack Query per island (IndexedDB persistence for cached market data) + nanostores for cross-island state.

Data flow:

```
React island → hook (TanStack Query) → domain service → contract (interface) → SupabaseAdapter → Postgres + RLS
                                            ↓
                                  lib/engine (pure, no I/O — prices in, results out)
```

The engine never touches network or database. Market data (Yahoo via CORS proxy) and persistence (Supabase) live in separate layers — engine is 100% testable with fixtures and reusable in web workers.

**Deploy**: GitHub Pages static under `/TradePilot/` base path. Supabase runs fully client-side (publishable key + RLS); auth redirect configured for the base path.

## 2. Data Layer — Supabase

### Schema (Postgres)

Pragmatic hybrid: relational columns for what is queried/filtered; JSONB for configs and results. 10 tables:

| Table | Key fields | Notes |
|---|---|---|
| `profiles` | `id` (FK `auth.users`), `username`, `display_name` | Public read (leaderboard); created by `on_auth_user_created` trigger |
| `accounts` | `user_id`, `name`, `broker`, `currency`, `type` | Investment accounts |
| `holdings` | `account_id` FK, `symbol`, `qty`, `cost_basis` | |
| `transactions` | `account_id` FK, `symbol`, `side`, `qty`, `price`, `executed_at` | |
| `strategies` | `user_id`, `name`, `type`, `params` JSONB, `code`, `is_public` | `code` = AI Builder / Monaco strategies |
| `backtests` | `user_id`, `strategy_id` FK?, `config` JSONB, `metrics` JSONB, `equity_curve` JSONB, `is_public` | History + leaderboard source |
| `watchlists` | `user_id`, `name`, `symbols text[]` | |
| `alerts` | `user_id`, `symbol`, `condition` JSONB, `is_active` | |
| `orders` | `user_id`, `account_id`, symbol/side/qty/status | Future trading |
| `broker_connections` | `user_id`, `broker`, encrypted credentials | **Deferred**; client-side encryption before insert |

**Leaderboard**: a `WITH (security_invoker = true)` view over `backtests` + `profiles` where `is_public = true` — no duplicate table, no RLS bypass.

### RLS (mandatory on every table)

- Base pattern: `SELECT/INSERT/UPDATE/DELETE` policies with `auth.uid() = user_id` (via `account_id` join for `holdings`/`transactions`).
- Selective public read: `strategies` and `backtests` add `SELECT ... USING (is_public = true OR auth.uid() = user_id)`; `profiles` fully public read.
- Every `UPDATE` policy is paired with a `SELECT` policy (without it updates silently no-op).
- Client uses **publishable key only**; `service_role` never ships to the browser.
- No `user_metadata` in authorization decisions; authorization data (if ever needed) goes in `app_metadata`.
- Run Supabase advisors after every migration.

### Auth (static host)

- `supabase-js` v2 client-side, **PKCE** flow: email+password and Google OAuth.
- Allowed redirect: `https://<domain>/TradePilot/auth/callback` — a light Astro page that processes the callback and redirects to the dashboard.
- Session in localStorage → exposed to all islands via `$session` nanostore (replaces per-component `onAuthStateChanged`).
- Guard: no server middleware on static hosting, so protected pages mount an `<AuthGuard>` island (skeleton → content, or redirect to `/auth`).

### Adapter layer

```ts
// lib/data/contracts.ts — one repository per domain
interface StrategyRepo { list(userId): Promise<Strategy[]>; save(s): ...; ... }
interface BacktestRepo { ... }
interface AuthProvider { signIn(...), signOut(), onSession(cb) }
```

- `lib/data/supabase/` implements the contracts. Hooks/islands import contracts + a `provideRepos()` factory only.
- Satisfies CyberEco Tenet #2 (storage agnosticism): a future backend change is a new adapter, not a rewrite.
- Types generated with `supabase gen types`, validated against shared Zod schemas.

## 3. Engine + Backtest Lab

### Engine port and extensions

The current engine ports nearly intact (it is pure TS). Extensions:

1. **Missing metrics** the UI already expects: `winRate`, `profitFactor`, `calmarRatio`, `avgWin`/`avgLoss`, monthly returns, top-5 drawdowns with duration, and benchmark curve (S&P 500 — mirrors Python `eval_portfolio()`).
2. **Curve granularity**: portfolio valued **daily** between rebalances (today: only on rebalance dates → understated drawdowns/vol).
3. **Transaction costs and slippage**, configurable (today: zero).
4. **Deterministic, serializable result** → persisted directly to `backtests.metrics` / `equity_curve` (JSONB).

### Execution: web workers

- Backtests run in a **web worker**: UI sends `{config, priceMap}` → worker runs engine → emits **real** progress (% of dates processed) → returns result. Replaces the current fake `setTimeout` progress and mock results in `BacktestPage.tsx`.
- For the Lab: a worker **pool** (`navigator.hardwareConcurrency - 1`) processes sweep combinations in parallel.

### Market data

Yahoo via CORS proxy as today, plus: persistent cache (TanStack Query + IndexedDB — a 50-run sweep downloads prices once), proxy fallback chain (allorigins → corsproxy.io), rate-limit friendliness.

### Backtest Lab (new flagship feature)

| Mode | What it does |
|---|---|
| **Single run** | Classic backtest, now real: config → worker → full results with benchmark overlay |
| **Compare** | N strategies/configs, same universe and period → side-by-side metrics table + overlaid curves |
| **Sweep** | Parameter grid (e.g. `t ∈ [5..30]`, `topN ∈ [3..10]`) → Sharpe/return heatmap; cell click → full run |
| **Walk-forward** | Rolling train/test windows → out-of-sample metrics per window; overfitting detection |

- UI: TanStack `DataTable` (Inceptor) for results, themed Recharts for curves/heatmaps, Tremor-style KPI cards for metrics.
- Every run saveable to `backtests`, publishable to the leaderboard (`is_public`).
- Sweeps/walk-forward have a run budget (max 200 combinations) with a pre-launch count warning.

### Port validation

Parity test: frozen price fixtures → same backtest run in Python (`tradepilot/`) and TS → metrics must match within relative tolerance `1e-6`. Permanent regression test.

## 4. Phases, IDD Workflow, Quality Gates

### Phases (each = a GitHub epic, ends with a green deploy)

| Phase | Delivers | Content |
|---|---|---|
| **0. Foundation** | Live template at `/TradePilot/` | Inceptor → `web/`, TradePilot branding (tokens, logo, landing), base path, PWA, adapted CI/CD, agents + `FeedbackFAB` pointed at TradePilot issues |
| **1. Data + Auth** | Working login | Supabase project, migrations (schema + RLS), PKCE auth (email + Google), `$session`, `AuthGuard`, complete adapter layer with generated types |
| **2. Trading core** | Real end-to-end backtest | Engine port + new metrics + workers, single run wired (mock dies), strategies CRUD, Monaco editor, AI Strategy Builder |
| **3. Backtest Lab** | Flagship feature | Compare, Sweep with heatmap, Walk-forward, run save/publish |
| **4. Dashboard + markets** | Daily view | Widgets, cached market data, watchlists, alerts, accounts/holdings/transactions |
| **5. Community** | Social layer | Leaderboard (SQL view), public strategy browser, sharing |
| **6. Education + catalog** | Content | Learn, calculators, tools, interactive catalog (reuses engine functions, direct port) |

Dependency logic: no data UI before Phase 1; Lab needs Phase 2's engine; community needs saved backtests. **Explicitly deferred**: live trading, `broker_connections`, admin panel.

### IDD workflow (the process leapfrog)

- Each phase decomposes into GitHub issues with labels (`phase:N`, `type:feature`).
- Per-issue cycle: `prometeo` plans → `forja` implements → `centinela` validates → PR → merge → auto-deploy. Agents adapted with TradePilot context (engine, Supabase, financial domain).
- `FeedbackFAB` on the deployed app files pre-filled issues (stack trace, URL, diagnostics) — Inceptor's full loop.

### Quality gates (per PR, inherited from both repos)

- `npm run check` — typecheck + vitest + build
- **Playwright E2E per feature** (TradePilot CLAUDE.md critical rule), adopting Inceptor's CI config (fixes the Actions timeout that forced disabling E2E)
- Lighthouse with budgets (`lighthouse-budgets.json`): a11y ≥ 85, best practices = 100
- Visual tests + Inceptor's `a11y` / `keyboard-nav` scripts
- Python↔TS engine parity as a permanent test
- Supabase advisors after each migration

## Out of Scope

- Live trading execution (TPT/Alpaca from the web), `broker_connections` implementation, admin panel — design documented, build deferred.
- Data migration — none needed (pre-launch, no real users).
- Python package changes — `tradepilot/` stays standalone.
- CyberEco Hub integration — unchanged plan; the adapter layer keeps it feasible (Tenet #2).
