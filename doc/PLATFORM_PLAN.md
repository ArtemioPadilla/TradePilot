# TradePilot Web Platform - Implementation Plan

## Executive Summary

Transform TradePilot from a Python library into a full-stack wealth management and algorithmic trading platform with real-time capabilities, social features, and comprehensive portfolio tracking.

---

## Technology Stack

### Frontend
| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | **Astro** | Static site generation, islands architecture |
| UI Components | **React/Svelte Islands** | Interactive components within Astro |
| Styling | **Tailwind CSS** | Utility-first, theme customization |
| Charts | **Lightweight Charts** (TradingView) | Financial charts, candlesticks |
| State | **Nanostores** | Lightweight cross-framework state |
| Python | **PyScript** | Client-side Python execution for strategies |

### Backend (Firebase)
| Service | Purpose |
|---------|---------|
| **Firebase Auth** | User authentication, invite system |
| **Cloud Firestore** | User data, positions, trades, preferences |
| **Cloud Functions (Python)** | TradePilot execution, backtesting, Alpaca API |
| **Firebase Storage** | PDF reports, backtest archives, exports |
| **Firebase Hosting** | PWA hosting (alternative to GitHub Pages) |
| **Cloud Messaging** | Push notifications |

### Hosting Strategy
| Asset | Host | Reason |
|-------|------|--------|
| Static assets | GitHub Pages | Free, CI/CD via Actions |
| API/Functions | Firebase | Python Cloud Functions |
| PWA manifest | Firebase Hosting | Service worker, offline |

### Real-time Data
| Source | Purpose |
|--------|---------|
| **Alpaca WebSocket** | Live prices, trade updates |
| **Firestore Realtime** | Portfolio sync across devices |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Astro PWA)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │   Astro     │  │   React     │  │  PyScript   │  │   Service Worker   ││
│  │   Pages     │  │   Islands   │  │  (Strategies)│  │   (Offline/Push)   ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
         ┌──────────────────┐ ┌──────────────┐ ┌────────────────┐
         │  Firebase Auth   │ │  Firestore   │ │ Cloud Functions│
         │  (Invite/Admin)  │ │  (Realtime)  │ │   (Python)     │
         └──────────────────┘ └──────────────┘ └────────────────┘
                                                       │
                              ┌────────────────────────┼────────────────┐
                              ▼                        ▼                ▼
                    ┌──────────────────┐    ┌──────────────┐    ┌─────────────┐
                    │   TradePilot     │    │  Alpaca API  │    │  External   │
                    │   Library        │    │  (Trading)   │    │  Data APIs  │
                    └──────────────────┘    └──────────────┘    └─────────────┘
```

---

## Firebase Data Model

### Firestore Collections

```
users/
  {userId}/
    profile: { email, displayName, createdAt, role, status }
    preferences: { theme, layout, widgets[], notifications }
    alpacaCredentials: { apiKey, apiSecret } (encrypted)

    accounts/
      {accountId}/
        type: "alpaca" | "manual"
        name: string
        holdings/
          {symbol}/
            quantity, avgCost, currentPrice, lastUpdated
        transactions/
          {txId}/
            type, symbol, quantity, price, timestamp, fees

    strategies/
      {strategyId}/
        name, description, code, parameters, isPublic, copiedFrom

    backtests/
      {backtestId}/
        strategyId, parameters, results, createdAt, expiresAt

    watchlists/
      {listId}/
        name, symbols[]

    alerts/
      {alertId}/
        type, symbol, condition, threshold, enabled

invites/
  {inviteCode}/
    createdBy, email, usedAt, expiresAt

admin/
  config/
    registrationOpen: boolean
    allowedDomains: string[]

strategies_public/
  {strategyId}/
    authorId, name, description, performance, copyCount, likes

leaderboards/
  {period}/  # weekly, monthly, allTime
    rankings: [{ userId, displayName, returns, sharpe }]

priceCache/
  {symbol}/
    price, change, volume, timestamp
```

### Data Storage Strategy

| Data Type | Storage | Retention | Reason |
|-----------|---------|-----------|--------|
| User profiles | Firestore | Permanent | Core user data |
| Positions | Firestore | Permanent | Portfolio state |
| Transactions | Firestore | Permanent | Audit trail, tax |
| Price cache | Firestore | 24 hours | Offline PWA, reduce API calls |
| Backtest results | Firestore | 30 days | Cost management |
| Large backtests | Storage | 90 days | JSON archives |
| PDF reports | Storage | User-managed | Download anytime |
| Strategy code | Firestore | Permanent | User-created |

### Security Rules Strategy

```javascript
// Firestore Rules Pseudocode
users/{userId}:
  - Read/Write: only if auth.uid == userId
  - Admin read: if auth.token.admin == true

invites/{code}:
  - Create: only admins
  - Read: anyone (to validate)
  - Update: once (mark as used)

strategies_public/{id}:
  - Read: authenticated users
  - Write: only author or admin

leaderboards/{period}:
  - Read: authenticated users
  - Write: only Cloud Functions (service account)
```

---

## Authentication & Authorization

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     INVITE-ONLY PHASE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Admin creates invite ──► Invite code generated                 │
│                                  │                              │
│                                  ▼                              │
│  User receives invite ──► Clicks link ──► Registration page     │
│                                                │                │
│                                                ▼                │
│                          Email + Password ──► Firebase Auth     │
│                                                │                │
│                                                ▼                │
│                          User doc created (status: pending)     │
│                                                │                │
│                                                ▼                │
│                          Admin approves ──► status: active      │
│                                                │                │
│                                                ▼                │
│                                         Full access granted     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     OPEN REGISTRATION PHASE (Future)            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User signs up ──► Email verification ──► status: pending       │
│                                                │                │
│                                                ▼                │
│                          Admin approves OR auto-approve rules   │
│                                                │                │
│                                                ▼                │
│                                         Full access granted     │
└─────────────────────────────────────────────────────────────────┘
```

### User Roles

| Role | Permissions |
|------|-------------|
| `pending` | View-only dashboard, no trading |
| `user` | Full platform access, trading, strategies |
| `premium` | (Future) Advanced features, priority support |
| `admin` | User management, invite creation, config |

---

## Feature Specifications

### 1. Portfolio Dashboard

**Widgets (Customizable Layout)**

| Widget | Description |
|--------|-------------|
| Net Worth | Total value across all accounts, chart over time |
| Asset Allocation | Pie/donut chart by asset class, sector, geography |
| Holdings Table | Sortable list with P&L, weight, daily change |
| Performance Chart | Line chart vs benchmarks (S&P 500, custom) |
| Watchlist | Quick view of tracked symbols with alerts |
| Recent Activity | Latest trades, dividends, alerts triggered |
| Risk Metrics | Sharpe, Sortino, Beta, Max Drawdown |
| News Feed | Relevant news for held positions |

**Layout System**
- Grid-based drag-and-drop (like Grafana)
- Save multiple layouts per user
- Responsive breakpoints: desktop (3-4 cols), tablet (2 cols), mobile (1 col)

### 2. Account Management

**Alpaca Integration**
```
┌─────────────────────────────────────────────────────┐
│  Connect Alpaca Account                             │
├─────────────────────────────────────────────────────┤
│  API Key:      [________________________]           │
│  API Secret:   [________________________]           │
│  Environment:  ○ Paper Trading  ○ Live              │
│                                                     │
│  [Test Connection]  [Save & Connect]                │
└─────────────────────────────────────────────────────┘
```

- Credentials encrypted at rest (Firebase Security)
- Automatic sync of positions every 5 minutes
- Real-time updates via WebSocket when app is open

**Manual Accounts**
- Add custom accounts (401k, real estate, crypto, etc.)
- Manual position entry with cost basis
- CSV import for bulk positions
- Support for multiple currencies

### 3. Trading Interface

**Order Panel**
```
┌─────────────────────────────────────────────────────┐
│  AAPL - Apple Inc.                    $185.42 ▲2.1% │
├─────────────────────────────────────────────────────┤
│  Order Type:  [Market ▼]                            │
│  Side:        ○ Buy   ○ Sell                        │
│  Quantity:    [____] shares  |  $[______] value    │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Estimated Cost:         $1,854.20           │   │
│  │ Available Buying Power: $10,432.00          │   │
│  │ Commission:             $0.00               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [Review Order]                                     │
└─────────────────────────────────────────────────────┘
```

**Order Types Supported**
- Market
- Limit
- Stop
- Stop-Limit
- Trailing Stop (percentage or dollar)

**Order Confirmation**
- Summary modal before submission
- Estimated impact on portfolio
- Risk warnings for large positions

### 4. Strategy Builder

**Pre-built Strategies (Beginner Mode)**

| Strategy | Parameters |
|----------|------------|
| Momentum | Lookback period, Top N assets, Rebalance frequency |
| Mean Reversion | Moving average period, Deviation threshold |
| Equal Weight | Asset list, Rebalance frequency |
| Risk Parity | Target volatility, Lookback period |
| Smart Beta | Factor weights (value, momentum, quality) |

**Code Editor (Advanced Mode)**
```python
# User writes strategy in browser (PyScript)
from tradepilot import Strategy, Signal

class MyStrategy(Strategy):
    def __init__(self, lookback=20):
        self.lookback = lookback

    def generate_signals(self, data):
        momentum = data.pct_change(self.lookback)
        signals = {}
        for symbol in data.columns:
            if momentum[symbol].iloc[-1] > 0.1:
                signals[symbol] = Signal.BUY
        return signals
```

- Syntax highlighting (Monaco Editor)
- Autocomplete for TradePilot API
- Sandbox execution (PyScript)
- Strategy validation before save

### 5. Backtesting Engine

**Configuration Panel**
```
┌─────────────────────────────────────────────────────┐
│  Backtest Configuration                             │
├─────────────────────────────────────────────────────┤
│  Strategy:    [Momentum Strategy ▼]                 │
│  Universe:    [S&P 500 ▼] or [Custom: AAPL,MSFT...]│
│                                                     │
│  Date Range:  [2020-01-01] to [2024-01-01]         │
│  Initial Capital: $[10,000]                         │
│  Rebalance:   [Monthly ▼]                           │
│                                                     │
│  Optimization:  [Max Sharpe ▼]                      │
│  Benchmark:     [SPY ▼]                             │
│                                                     │
│  [Run Backtest]                                     │
└─────────────────────────────────────────────────────┘
```

**Results Display**
- Equity curve chart (strategy vs benchmark)
- Drawdown chart
- Monthly returns heatmap
- Key metrics table (CAGR, Sharpe, Sortino, Max DD, Win Rate)
- Trade log with entry/exit points
- Position history over time

**Execution**
- Small backtests: PyScript (client-side)
- Large backtests: Cloud Functions (server-side)
- Progress indicator for long-running tests
- Results cached in Firestore (30-day retention)

### 6. Alerts & Notifications

**Alert Types**

| Type | Trigger |
|------|---------|
| Price Alert | Symbol crosses above/below threshold |
| Percent Change | Symbol moves X% in a day |
| Rebalance Due | Portfolio drift exceeds threshold |
| Trade Executed | Order filled confirmation |
| Strategy Signal | Strategy generates buy/sell signal |
| Drawdown Alert | Portfolio drops X% from peak |

**Notification Channels**
- In-app (notification center)
- Push notifications (PWA)
- Email digest (daily/weekly summary)

**Implementation**
- Cloud Functions monitor conditions
- Firebase Cloud Messaging for push
- SendGrid/Firebase Extensions for email

### 7. Social Features

**Strategy Sharing**
```
┌─────────────────────────────────────────────────────┐
│  Share Strategy                                     │
├─────────────────────────────────────────────────────┤
│  ☑ Make strategy public                             │
│  ☑ Show my username as author                       │
│  ☐ Allow others to copy and modify                  │
│                                                     │
│  Description:                                       │
│  [This momentum strategy targets tech stocks...]    │
│                                                     │
│  [Publish Strategy]                                 │
└─────────────────────────────────────────────────────┘
```

**Leaderboards**
- Weekly, Monthly, All-Time rankings
- Metrics: Total Return, Sharpe Ratio, Risk-Adjusted Return
- Opt-in only (privacy setting)
- Anonymized option (show rank without username)

**Copy Trading**
- Browse public strategies
- One-click copy to personal strategies
- Fork and modify
- Track original author's updates

### 8. Reporting & Export

**PDF Reports**
- Portfolio summary (monthly/quarterly)
- Performance attribution
- Tax lot report
- Custom date range

**Exports**
- CSV: Transactions, Holdings, Performance
- JSON: Full portfolio snapshot
- Tax documents: 1099-compatible format

**Implementation**
- PDF generation via Cloud Functions (puppeteer or reportlab)
- Stored in Firebase Storage
- Download links expire after 7 days

### 9. Wealth Management Utilities

**Net Worth Tracker**
- Aggregate all accounts (trading + manual)
- Historical net worth chart
- Goal setting and progress

**Financial Calculators**
- Compound growth calculator
- Retirement projector
- Risk tolerance questionnaire
- Asset allocation recommender

**Educational Content**
- Glossary of financial terms
- Strategy explanations
- Risk management guides
- Integrated tooltips throughout UI

---

## UI/UX Design System

### Theme Presets

**Bloomberg Terminal**
```css
--bg-primary: #0a0a0a;
--bg-secondary: #1a1a1a;
--text-primary: #ff8c00;
--text-secondary: #ffffff;
--accent: #ff6600;
--positive: #00ff00;
--negative: #ff0000;
--font: 'IBM Plex Mono', monospace;
--density: compact;
```

**Modern Fintech**
```css
--bg-primary: #ffffff;
--bg-secondary: #f8f9fa;
--text-primary: #1a1a2e;
--text-secondary: #6c757d;
--accent: #6366f1;
--positive: #10b981;
--negative: #ef4444;
--font: 'Inter', sans-serif;
--density: comfortable;
```

**Dashboard (Dark)**
```css
--bg-primary: #0f172a;
--bg-secondary: #1e293b;
--text-primary: #f1f5f9;
--text-secondary: #94a3b8;
--accent: #3b82f6;
--positive: #22c55e;
--negative: #ef4444;
--font: 'DM Sans', sans-serif;
--density: normal;
```

### Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, bottom nav |
| Tablet | 640-1024px | 2-column grid, side nav collapsed |
| Desktop | 1024-1440px | 3-column grid, side nav expanded |
| Wide | > 1440px | 4-column grid, all panels visible |

### Component Library

Build reusable components:
- `<PriceDisplay>` - Price with change indicator
- `<SparklineChart>` - Mini inline chart
- `<DataTable>` - Sortable, filterable tables
- `<OrderForm>` - Trade entry form
- `<WidgetContainer>` - Draggable dashboard widget
- `<MetricCard>` - Key metric display
- `<AlertBadge>` - Notification indicator

---

## TradePilot Library Documentation

### Documentation Generation

**Tools**
- **Sphinx** with autodoc for API reference
- **MkDocs Material** for tutorials and guides
- **Storybook** for UI component docs

**Structure**
```
docs/
├── api/                    # Auto-generated from docstrings
│   ├── backtest.md
│   ├── simulator.md
│   ├── trader.md
│   ├── data.md
│   ├── metrics.md
│   ├── optimization.md
│   └── ranking.md
├── guides/
│   ├── getting-started.md
│   ├── first-backtest.md
│   ├── custom-strategies.md
│   ├── live-trading.md
│   └── optimization.md
├── tutorials/
│   ├── momentum-strategy.md
│   ├── mean-reversion.md
│   └── portfolio-optimization.md
├── reference/
│   ├── glossary.md
│   └── faq.md
└── contributing.md
```

**Auto-generation Pipeline**
```bash
# Generate API docs from source
sphinx-apidoc -o docs/api tradepilot/

# Build documentation site
mkdocs build

# Deploy to GitHub Pages
mkdocs gh-deploy
```

**In-App Documentation**
- Contextual tooltips on hover
- "?" icons linking to relevant docs
- Embedded code examples in strategy builder
- Interactive API explorer

### Docstring Standards

```python
def sharpe_ratio(returns: pd.Series, risk_free_rate: float = 0.02) -> float:
    """
    Calculate the annualized Sharpe ratio.

    The Sharpe ratio measures risk-adjusted return by comparing
    excess returns to volatility.

    Args:
        returns: Daily returns series (not percentage, use decimals)
        risk_free_rate: Annual risk-free rate (default: 2%)

    Returns:
        Annualized Sharpe ratio

    Example:
        >>> import pandas as pd
        >>> returns = pd.Series([0.01, -0.02, 0.015, 0.005])
        >>> sharpe_ratio(returns, risk_free_rate=0.02)
        1.234

    See Also:
        sortino_ratio: Uses downside deviation instead of total volatility
        max_drawdown: Measures peak-to-trough decline
    """
```

---

## PWA Implementation

### Service Worker Strategy

```javascript
// Caching strategy
const CACHE_STRATEGIES = {
  // Static assets: Cache first
  '/assets/*': 'CacheFirst',

  // API data: Network first, fallback to cache
  '/api/*': 'NetworkFirst',

  // Price data: Stale while revalidate
  '/prices/*': 'StaleWhileRevalidate',

  // User data: Network only (always fresh)
  '/user/*': 'NetworkOnly'
};
```

### Offline Capabilities

| Feature | Offline Behavior |
|---------|------------------|
| Dashboard | Show cached data with "last updated" timestamp |
| Charts | Display cached historical data |
| Trading | Queue orders, execute when online |
| Backtesting | Run with cached price data (PyScript) |
| Alerts | Sync when reconnected |

### Push Notifications

```javascript
// Notification payload structure
{
  "notification": {
    "title": "Price Alert: AAPL",
    "body": "AAPL crossed above $190.00",
    "icon": "/icons/alert.png",
    "click_action": "/dashboard?symbol=AAPL"
  },
  "data": {
    "type": "price_alert",
    "symbol": "AAPL",
    "price": 190.50,
    "threshold": 190.00
  }
}
```

---

## Cloud Functions (Python)

### Function Structure

```
functions/
├── main.py                 # Entry point
├── requirements.txt        # Dependencies (tradepilot, alpaca-py, etc.)
├── handlers/
│   ├── backtest.py        # Run backtests
│   ├── trading.py         # Execute trades via Alpaca
│   ├── sync.py            # Sync positions from broker
│   ├── alerts.py          # Check and trigger alerts
│   ├── reports.py         # Generate PDF reports
│   └── leaderboard.py     # Calculate rankings
└── utils/
    ├── alpaca_client.py   # Alpaca API wrapper
    ├── encryption.py      # Credential encryption
    └── notifications.py   # Send push/email
```

### Key Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `runBacktest` | HTTP | Execute TradePilot backtest |
| `executeTrade` | HTTP | Submit order to Alpaca |
| `syncPositions` | Scheduled (5min) | Fetch latest positions |
| `checkAlerts` | Scheduled (1min) | Evaluate alert conditions |
| `generateReport` | HTTP | Create PDF report |
| `updateLeaderboard` | Scheduled (daily) | Recalculate rankings |
| `onUserCreate` | Auth trigger | Initialize user document |
| `cleanupBacktests` | Scheduled (daily) | Delete expired backtests |

---

## Project Structure

```
TradePilot/
├── tradepilot/                 # Python library (existing)
│   ├── __init__.py
│   ├── backtest.py
│   ├── simulator.py
│   ├── trader.py
│   ├── data.py
│   ├── metrics.py
│   ├── optimization.py
│   ├── ranking.py
│   └── ...
│
├── web/                        # Astro frontend (new)
│   ├── astro.config.mjs
│   ├── package.json
│   ├── src/
│   │   ├── layouts/
│   │   │   ├── MainLayout.astro
│   │   │   └── DashboardLayout.astro
│   │   ├── pages/
│   │   │   ├── index.astro
│   │   │   ├── dashboard.astro
│   │   │   ├── trading.astro
│   │   │   ├── strategies.astro
│   │   │   ├── backtest.astro
│   │   │   ├── accounts.astro
│   │   │   ├── reports.astro
│   │   │   ├── settings.astro
│   │   │   ├── admin/
│   │   │   │   ├── users.astro
│   │   │   │   └── invites.astro
│   │   │   └── auth/
│   │   │       ├── login.astro
│   │   │       ├── register.astro
│   │   │       └── invite/[code].astro
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   ├── trading/
│   │   │   ├── charts/
│   │   │   ├── strategies/
│   │   │   └── common/
│   │   ├── stores/
│   │   │   ├── auth.ts
│   │   │   ├── portfolio.ts
│   │   │   └── prices.ts
│   │   ├── lib/
│   │   │   ├── firebase.ts
│   │   │   ├── alpaca.ts
│   │   │   └── utils.ts
│   │   └── styles/
│   │       ├── themes/
│   │       └── global.css
│   ├── public/
│   │   ├── manifest.json
│   │   ├── sw.js
│   │   └── icons/
│   └── tests/
│
├── functions/                  # Firebase Cloud Functions (new)
│   ├── main.py
│   ├── requirements.txt
│   └── handlers/
│
├── docs/                       # Documentation (new)
│   ├── mkdocs.yml
│   ├── api/
│   ├── guides/
│   └── tutorials/
│
├── firebase.json               # Firebase config
├── firestore.rules            # Security rules
├── firestore.indexes.json     # Firestore indexes
└── .github/
    └── workflows/
        ├── deploy-web.yml     # Deploy Astro to GitHub Pages
        ├── deploy-functions.yml
        └── docs.yml           # Build and deploy docs
```

---

## Development Phases

### Phase 1: Foundation
- [ ] Set up Astro project with Tailwind
- [ ] Configure Firebase project (Auth, Firestore, Functions)
- [ ] Implement authentication flow (invite-only)
- [ ] Create admin console for user management
- [ ] Build basic dashboard layout with theme switching
- [ ] Set up CI/CD pipelines

### Phase 2: Portfolio Core
- [ ] Manual account and position entry
- [ ] Holdings table with P&L calculations
- [ ] Net worth tracking and chart
- [ ] Asset allocation visualization
- [ ] Basic performance metrics display
- [ ] CSV import for positions

### Phase 3: Alpaca Integration
- [ ] Alpaca credential storage (encrypted)
- [ ] Position sync via Cloud Functions
- [ ] Real-time price WebSocket
- [ ] Trading interface (order form)
- [ ] Order execution and confirmation
- [ ] Trade history display

### Phase 4: Backtesting
- [ ] Strategy selection UI (pre-built)
- [ ] Backtest configuration form
- [ ] PyScript integration for client-side execution
- [ ] Cloud Functions for large backtests
- [ ] Results visualization (charts, metrics)
- [ ] Backtest history and caching

### Phase 5: Strategy Builder
- [ ] Monaco code editor integration
- [ ] TradePilot API autocomplete
- [ ] Strategy validation and sandbox
- [ ] Save and manage custom strategies
- [ ] Strategy parameter UI for pre-built

### Phase 6: Alerts & Notifications
- [ ] Alert creation UI
- [ ] Cloud Functions for condition monitoring
- [ ] Push notification setup (FCM)
- [ ] Email notification integration
- [ ] Notification center in app

### Phase 7: Social Features
- [ ] Strategy sharing and publishing
- [ ] Public strategy browser
- [ ] Copy/fork strategies
- [ ] Leaderboard calculation
- [ ] Leaderboard display

### Phase 8: Reporting & Wealth
- [ ] PDF report generation
- [ ] Export functionality (CSV, JSON)
- [ ] Financial calculators
- [ ] Educational content integration

### Phase 9: PWA & Polish
- [ ] Service worker implementation
- [ ] Offline mode
- [ ] Responsive design refinement
- [ ] Performance optimization
- [ ] Accessibility audit

### Phase 10: Documentation
- [ ] Sphinx autodoc setup
- [ ] MkDocs site configuration
- [ ] API reference generation
- [ ] Tutorial writing
- [ ] In-app help integration

---

## Security Considerations

### Data Protection
- Alpaca API credentials encrypted with Firebase KMS
- All API calls over HTTPS
- Firestore security rules enforce user isolation
- No sensitive data in client-side logs

### Authentication
- Firebase Auth with email verification
- Session tokens with appropriate expiry
- Rate limiting on auth endpoints
- Admin actions require re-authentication

### Trading Safety
- Order confirmation required
- Position size limits (configurable)
- Paper trading mode for testing
- Audit log of all trades

### Code Execution
- PyScript sandboxed in browser
- Cloud Functions have limited permissions
- User strategies validated before execution
- No arbitrary code execution on server

---

## Cost Estimation (Firebase)

### Free Tier Limits
| Service | Free Limit | Expected Usage |
|---------|------------|----------------|
| Auth | 10K/month | Sufficient for MVP |
| Firestore Reads | 50K/day | May exceed with real-time |
| Firestore Writes | 20K/day | Likely sufficient |
| Cloud Functions | 2M invocations/month | May exceed with alerts |
| Storage | 5GB | Sufficient |

### Scaling Costs (Blaze Plan)
- Firestore: ~$0.06/100K reads, $0.18/100K writes
- Functions: $0.40/million invocations
- Storage: $0.026/GB/month

### Optimization Strategies
- Batch reads where possible
- Use Firestore listeners instead of polling
- Cache prices in-memory (reduce reads)
- Limit backtest retention (reduce storage)
- Use client-side computation when feasible

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Dashboard load time | < 2 seconds |
| Trade execution latency | < 500ms |
| Backtest (1 year, 50 assets) | < 30 seconds |
| PWA Lighthouse score | > 90 |
| Uptime | 99.5% |
| User onboarding completion | > 80% |

---

## Open Questions

1. **Multi-currency support**: How to handle international assets and currency conversion?
2. **Tax jurisdiction**: Which tax rules to implement first (US 1099, etc.)?
3. **Strategy marketplace**: Should strategy authors earn revenue from copies?
4. **Mobile native apps**: Timeline for React Native/Flutter apps?
5. **Additional brokers**: Priority order for IBKR, TDA, others?
6. **Crypto integration**: Scope of crypto wallet/exchange support?

---

## Next Steps

1. Review and approve this plan
2. Set up development environment
3. Create Firebase project and configure services
4. Initialize Astro project with base configuration
5. Begin Phase 1 implementation
