# Critical Design Decisions

> These decisions must be finalized before implementation. Each requires your input.

## Architecture & Infrastructure
- [ ] **Island Framework** - React vs Svelte vs Solid for interactive components
- [ ] **State Management** - Nanostores vs Zustand vs custom stores
- [ ] **Hosting Split** - GitHub Pages + Firebase hybrid vs Firebase-only
- [ ] **Domain & SSL** - Custom domain setup and certificate management

## Authentication & Users
- [ ] **Invite Code Format** - UUID vs short alphanumeric vs custom prefix
- [ ] **Invite Expiration** - 24h / 7d / 30d / never
- [ ] **Admin Approval Flow** - Email notification vs dashboard-only vs auto-approve rules
- [ ] **Session Duration** - Expiry time for auth tokens
- [ ] **Password Requirements** - Minimum length, complexity rules

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
- [ ] **Default Theme** - Bloomberg / Modern / Dashboard for new users
- [ ] **Widget Grid System** - Fixed grid vs freeform drag-drop
- [ ] **Mobile Navigation** - Bottom tabs vs hamburger menu vs hybrid
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
- [ ] **Docs Framework** - MkDocs Material vs Docusaurus vs Starlight
- [ ] **API Docs Style** - Sphinx autodoc vs hand-written vs hybrid
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
