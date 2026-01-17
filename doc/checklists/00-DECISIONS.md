# Critical Design Decisions

> These decisions must be finalized before implementation. Each requires your input.

## Architecture & Infrastructure
- [x] **Island Framework** - ~~React vs Svelte vs Solid~~ → **React** (Astro + React islands)
- [x] **State Management** - ~~Nanostores vs Zustand~~ → **Nanostores** (lightweight, framework-agnostic)
- [x] **Hosting Split** - ~~hybrid vs Firebase-only~~ → **GitHub Pages + Firebase hybrid** (static on GH Pages, Firebase for auth/data)
- [ ] **Domain & SSL** - Custom domain setup and certificate management

## Authentication & Users
- [x] **Invite Code Format** - ~~UUID vs short alphanumeric~~ → **8-char alphanumeric** (A-Z, 2-9, no ambiguous chars)
- [x] **Invite Expiration** - ~~24h / 7d / 30d~~ → **7 days default** (configurable per invite)
- [x] **Admin Approval Flow** - ~~Email vs dashboard~~ → **Dashboard-only** (admin console at /admin)
- [ ] **Session Duration** - Expiry time for auth tokens (using Firebase defaults)
- [ ] **Password Requirements** - Minimum length, complexity rules (using Firebase defaults)

## Data & Storage
- [ ] **Credential Encryption** - Firebase KMS vs custom encryption layer
- [ ] **Backtest Retention** - 30 days vs 90 days vs user-configurable
- [ ] **Price Cache Duration** - 15min / 1h / 24h for offline PWA
- [ ] **Transaction History Limit** - Unlimited vs last N years

## Trading & Risk
- [ ] **Default Position Limits** - Max % of portfolio per position
- [ ] **Order Confirmation Flow** - Single confirm vs 2-step for large orders
- [ ] **Paper Trading Default** - Require paper trading before live access?
- [ ] **Supported Order Types** - All vs subset for MVP

## UI/UX
- [x] **Default Theme** - ~~Bloomberg / Modern / Dashboard~~ → **System preference** (light→Modern, dark→Dashboard)
- [ ] **Widget Grid System** - Fixed grid vs freeform drag-drop
- [x] **Mobile Navigation** - ~~Bottom tabs vs hamburger~~ → **Bottom tabs** (5 items: Home, Accounts, Trade, Strategies, Settings)
- [ ] **Chart Library** - Lightweight Charts vs Chart.js vs Recharts

## Social & Sharing
- [ ] **Strategy Visibility Default** - Private by default vs prompt on save
- [ ] **Leaderboard Opt-in** - Explicit opt-in vs opt-out
- [ ] **Copy Trading Limits** - Max strategies copied / following
- [ ] **Anonymity Options** - Full anonymous vs pseudonym required

## Notifications
- [ ] **Email Provider** - SendGrid vs Firebase Extensions vs Resend
- [ ] **Notification Frequency Limits** - Max alerts per hour/day
- [ ] **Default Notification Preferences** - What's on/off by default

## Documentation
- [x] **Docs Framework** - ~~MkDocs vs Docusaurus vs Starlight~~ → **Sphinx** (Python-native, autodoc support)
- [x] **API Docs Style** - ~~autodoc vs hand-written~~ → **Sphinx autodoc** (auto-generated from docstrings)
- [ ] **Versioning** - Version docs with releases or single latest

---

## Open Questions Log

| # | Question | Status | Decision |
|---|----------|--------|----------|
| 1 | Multi-currency support scope? | Open | |
| 2 | Which tax jurisdiction first? | Open | |
| 3 | Strategy marketplace revenue model? | Open | |
| 4 | Mobile native app timeline? | Open | |
| 5 | Additional broker priority? | Open | |
| 6 | Crypto wallet/exchange scope? | Open | |
