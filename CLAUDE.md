# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TradePilot is a Python library for algorithmic trading that unifies backtesting and live trading. It provides:
- **TPS (Trade Pilot Simulator)**: Historical backtesting engine
- **TPT (Trade Pilot Trader)**: Live trading execution via broker APIs (Alpaca)
- **Backtest**: High-level wrapper for running backtests and evaluating performance

## Commands

```bash
# Install in development mode
pip install -e .

# Install dependencies only
pip install -r requirements.txt

# Run all tests
pytest tests/

# Run a single test file
pytest tests/test_data.py
pytest tests/test_metrics.py
pytest tests/test_ranking.py
```

No linting or build commands are currently configured.

## Architecture

```
User Code
    ↓
┌─────────────────────────────────────────────┐
│  Backtest (backtest.py)  │  TPT (trader.py) │  ← High-level interfaces
└─────────────────────────────────────────────┘
    ↓                              ↓
┌───────────────────────────────────────────────┐
│         TPS - simulator.py                    │  ← Core simulation engine
│  (portfolio management, rebalancing logic)    │
└───────────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────────┐
│  ranking.py      │  optimization.py           │  ← Strategy layer
│  (asset select)  │  (weight calculation)      │
└───────────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────────┐
│  data.py   │  metrics.py  │  broker.py        │  ← Infrastructure
│  (market   │  (financial  │  (Alpaca API)     │
│   data)    │   calcs)     │                   │
└───────────────────────────────────────────────┘
```

### Key Module Responsibilities

| Module | Purpose |
|--------|---------|
| `simulator.py` | TPS class - runs backtests with rebalancing, tracks portfolio valuations |
| `backtest.py` | Backtest class - wraps TPS, provides evaluate() for metrics |
| `trader.py` | TPT class - live trading loop with periodic rebalancing |
| `data.py` | MarketData (yfinance), OpenData (risk-free rates from Treasury) |
| `metrics.py` | Returns, volatility, Sharpe ratio, max drawdown, momentum |
| `optimization.py` | msr() (Max Sharpe), gmv() (Min Variance), eq_weighted() |
| `ranking.py` | momentum_ranking(), random_ranking() for asset selection |
| `portfolios.py` | eval_portfolio() - benchmarks against S&P 500 |
| `broker.py` | BrokerAPI class - Alpaca integration |
| `config.py` | API credentials (API_KEYS dict) |

### Data Flow (Backtesting)

1. Backtest initializes TPS with universe of assets
2. TPS.run() iterates through rebalancing dates
3. For each date: ranking strategy → optimization → simulate holdings
4. Backtest.evaluate() calculates annualized returns, Sharpe, max drawdown

### Strategies Directory

Located in `/strategies/` (separate from main package):
- `momentum.py` - Price momentum based selection
- `mean_reversion.py` - Oversold asset selection (below moving average)
- `smart_beta.py` - Sharpe ratio based ranking

## Important Notes

- Python 3.7+ required
- Tests hit real Yahoo Finance API (no mocking)
- API credentials in `config.py` must be configured for live trading
- Log output goes to `pmt.log`
- Package exports all public APIs via `__init__.py`

## Web Application

TradePilot also includes a web application built with Astro + React for portfolio management.

### Web Commands

```bash
cd web

# Install dependencies
npm install

# Start development server
npm run dev

# Run E2E tests (Playwright)
npx playwright test --project=chromium

# Run unit tests (Vitest)
npm run test

# Build for production
npm run build
```

### Web Architecture

- **Framework**: Astro with React islands
- **Auth**: Firebase Authentication
- **Database**: Firestore
- **Styling**: CSS with theme variables
- **Testing**: Playwright (E2E), Vitest (unit)

## Testing Requirements (CRITICAL)

**E2E tests are mandatory for every feature and phase.** Follow these guidelines:

### When to Write E2E Tests

1. **Every new page** - Test that it loads and displays correctly
2. **Every form** - Test validation, submission, error states
3. **Every user flow** - Test complete journeys (login → action → result)
4. **Every navigation** - Test links work and redirect appropriately
5. **Every protected route** - Test auth guards work correctly

### E2E Test Structure

```
web/tests/e2e/
├── auth.spec.ts       # Authentication flows
├── dashboard.spec.ts  # Dashboard and widgets
├── landing.spec.ts    # Public pages
├── accounts.spec.ts   # Account management (Phase 2)
├── holdings.spec.ts   # Holdings/positions (Phase 2)
├── trading.spec.ts    # Trading features (Phase 3)
└── ...
```

### Test Writing Guidelines

1. **Use accessible selectors** - Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
2. **Handle auth states** - Tests should work whether user is authenticated or not
3. **Be resilient** - Use `.catch(() => false)` for optional elements
4. **Test real behavior** - Don't just check elements exist, test interactions
5. **Run after every feature** - Never commit without running `npx playwright test`

### Running Tests

```bash
# Run all E2E tests (Chromium only for speed)
npx playwright test --project=chromium

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run with UI mode for debugging
npx playwright test --ui

# Run Lighthouse audit
npx lighthouse http://localhost:4321 --only-categories=performance,accessibility,best-practices,seo
```

### Quality Gates

Before completing any phase:
- [ ] All E2E tests pass
- [ ] Lighthouse accessibility score ≥ 85%
- [ ] Lighthouse best practices score = 100%
- [ ] No console errors in browser

## Security

Run Snyk security scans for new code. Fix any issues found before completing changes.
