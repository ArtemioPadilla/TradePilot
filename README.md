<p align="center">
  <img src="web/public/favicon.svg" width="80" height="80" alt="TradePilot logo">
</p>

<h1 align="center">TradePilot</h1>

<p align="center">
  <strong>Open-source backtesting & live trading platform that runs in your browser</strong>
</p>

<p align="center">
  <a href="https://github.com/ArtemioPadilla/TradePilot/actions/workflows/test.yml"><img src="https://github.com/ArtemioPadilla/TradePilot/actions/workflows/test.yml/badge.svg" alt="Tests"></a>
  <a href="https://github.com/ArtemioPadilla/TradePilot/actions/workflows/deploy-web.yml"><img src="https://github.com/ArtemioPadilla/TradePilot/actions/workflows/deploy-web.yml/badge.svg" alt="Deploy"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Lighthouse-100%2F100%2F100-brightgreen" alt="Lighthouse 100/100/100">
  <img src="https://img.shields.io/badge/Python_Tests-142_passing-blue" alt="142 Python tests">
</p>

<p align="center">
  <a href="https://artemiop.com/TradePilot/">🌐 Live Demo</a> •
  <a href="#-quick-start">⚡ Quick Start</a> •
  <a href="#-features">✨ Features</a> •
  <a href="#-ai-strategy-builder">🤖 AI Builder</a> •
  <a href="#-contributing">🤝 Contributing</a>
</p>

---

## What is TradePilot?

TradePilot lets you **design, backtest, and deploy trading strategies** — all from your browser. No server setup, no Python install, no API keys needed to get started.

The entire backtesting engine (1,560 lines of TypeScript) runs **client-side**. Describe a strategy in plain English, get executable code, and backtest it instantly.

```
┌──────────────────────────────────────────────────────────────┐
│                    TradePilot Architecture                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   📝 "Buy stocks with highest momentum, rebalance monthly"  │
│                         │                                    │
│                    AI Strategy Builder                        │
│                         │                                    │
│                    ┌────▼─────┐                              │
│                    │ Generated │                              │
│                    │ TS Code   │                              │
│                    └────┬─────┘                              │
│                         │                                    │
│   ┌─────────────────────▼──────────────────────┐             │
│   │         TypeScript Engine (Browser)          │             │
│   │  ┌──────────┐ ┌───────────┐ ┌───────────┐  │             │
│   │  │ Strategies│ │ Optimizer │ │  Metrics   │  │             │
│   │  │ momentum  │ │ MSR / GMV │ │ Sharpe,VaR│  │             │
│   │  │ meanRev   │ │ EW        │ │ drawdown  │  │             │
│   │  │ smartBeta │ │           │ │ Sortino   │  │             │
│   │  └──────────┘ └───────────┘ └───────────┘  │             │
│   │                     │                        │             │
│   │              BacktestEngine                  │             │
│   │          (simulator + allocator)             │             │
│   └─────────────────────┬──────────────────────┘             │
│                         │                                    │
│                    ┌────▼─────┐                              │
│                    │ Results:  │                              │
│                    │ charts,   │                              │
│                    │ metrics,  │                              │
│                    │ trades    │                              │
│                    └──────────┘                              │
│                                                              │
│   Optional: Alpaca API ──► Live/Paper Trading                │
│   Optional: Firebase  ──► Auth, Portfolio Sync               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Start

### Try it now (no install)

👉 **[Open the live demo](https://artemiop.com/TradePilot/)** → Dashboard → AI Builder → Click "Try Demo"

### Run locally

```bash
# Clone and start the web app
git clone https://github.com/ArtemioPadilla/TradePilot.git
cd TradePilot/web
npm install
npm run dev
# Open http://localhost:4321/TradePilot/
```

### Use the Python library

```bash
pip install -e .
```

```python
from tradepilot.backtest import Backtest
from tradepilot.data import MarketData

data = MarketData()
universe = data.get_historical_data("AAPL", "2022-01-01", "2024-01-01")

bt = Backtest(universe, strategy="momentum", initial_capital=10000)
bt.run(start="2022-01-01", end="2024-01-01")
results = bt.evaluate()
print(f"Sharpe: {results['sharpe_ratio']:.2f}")
print(f"Max Drawdown: {results['max_drawdown']:.1%}")
```

---

## ✨ Features

### 🤖 AI Strategy Builder
Describe trading strategies in plain English → get executable TypeScript code → auto-backtest. Works in **demo mode without any API key** (5 pre-built templates). Optionally connects to Claude via AWS Bedrock.

### 📊 Browser-Native Backtesting
1,560-line TypeScript engine running entirely client-side:
- **Strategies:** Momentum, Mean Reversion, Smart Beta
- **Optimizers:** Maximum Sharpe Ratio, Global Minimum Variance, Equal Weight
- **Metrics:** Sharpe, Sortino, Max Drawdown, VaR, CVaR, Alpha, Skewness, Kurtosis
- **Zero backend** — all computation in your browser tab

### 📈 Live Trading
- Alpaca API integration for paper and live trading
- Periodic rebalancing with configurable frequency
- Position monitoring and order history

### 🎨 Web Application
- **37 pages** — auth, dashboard, backtesting, trading, analytics, alerts, strategies
- **3 themes** — Bloomberg Terminal, Modern Fintech, Dashboard Dark
- **Firebase Auth** with invite system and admin approval
- **9 real Firestore services** — accounts, holdings, portfolio, networth, orders, and more
- **Monaco editor** for strategy code editing
- **Lighthouse: 100 / 100 / 100** (Performance, Accessibility, SEO)

### 🐍 Python Core
- 142 tests passing
- Simulation engine (TPS) + live trader (TPT)
- Portfolio optimization with NumPy/SciPy
- Yahoo Finance + Treasury risk-free rate data

---

## 🏗️ Architecture

```
TradePilot/
├── tradepilot/              # Python backtesting library
│   ├── simulator.py         # TPS — simulation engine
│   ├── trader.py            # TPT — live trading
│   ├── backtest.py          # High-level backtest wrapper
│   ├── optimization.py      # MSR, GMV, Equal Weight
│   ├── metrics.py           # Financial calculations
│   ├── ranking.py           # Asset selection strategies
│   ├── data.py              # Yahoo Finance + Treasury data
│   └── broker.py            # Alpaca integration
│
├── web/                     # Web application (Astro + React)
│   └── src/
│       ├── lib/engine/      # TypeScript backtesting engine (1,560 lines)
│       ├── components/      # React islands (AI builder, charts, trading)
│       ├── pages/           # 37 Astro pages
│       └── lib/services/    # Firestore services + AI strategy service
│
├── strategies/              # Python strategy implementations
├── tests/                   # 142 Python tests
├── api/                     # FastAPI bridge (Python ↔ Web)
├── functions/               # Firebase Cloud Functions
└── docs/                    # Sphinx documentation
```

| Layer | Tech | Purpose |
|-------|------|---------|
| Frontend | Astro 5 + React 19 | Islands architecture, SSG |
| Styling | Tailwind CSS | 3 switchable themes |
| Engine | TypeScript | Client-side backtesting |
| Auth | Firebase Auth | Invite system, admin approval |
| Database | Firestore | Portfolio, trades, strategies |
| Backend | Python + FastAPI | Strategy execution, data |
| Broker | Alpaca API | Paper + live trading |
| AI | Claude (Bedrock) | Natural language → strategy code |
| CI/CD | GitHub Actions | Tests, deploy, Lighthouse |

---

## 🤖 AI Strategy Builder

The killer feature. Describe what you want in English:

> "Buy the top 5 stocks by 20-day momentum, rebalance every 2 weeks, use maximum Sharpe ratio optimization"

TradePilot generates TypeScript code, explains the strategy, and runs a backtest — all in your browser.

**Pre-built templates (no API key needed):**
- 📈 Momentum Crossover — fast MA crosses slow MA
- 📉 RSI Mean Reversion — buy oversold, sell overbought
- 💥 Volatility Breakout — buy on vol expansion
- ⚖️ Relative Value — long cheap / short expensive
- 🔄 Dual Momentum — absolute + relative momentum filter

**How it works:**
1. User types strategy description
2. AI generates a `StrategyFunction` matching the engine's interface
3. Code runs in a sandboxed executor (restricted scope, no eval)
4. Results display with full backtest metrics

---

## 🤝 Contributing

We'd love your help! Check out our [Good First Issues](https://github.com/ArtemioPadilla/TradePilot/labels/good%20first%20issue) or dive into something bigger.

### Quick contribution guide

```bash
# Fork, clone, branch
git clone https://github.com/YOUR_USERNAME/TradePilot.git
cd TradePilot
git checkout -b feat/my-feature

# Python tests
pip install -e .
pytest tests/

# Web development
cd web && npm install && npm run dev

# Playwright E2E tests
cd web && npx playwright test --project=chromium

# Submit PR
git push origin feat/my-feature
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📈 Roadmap

**✅ Shipped:**
- Python backtesting core (142 tests)
- TypeScript engine (browser-native)
- AI Strategy Builder with demo mode
- Web app with auth, dashboard, 3 themes
- Alpaca integration

**🚧 In Progress:**
- Real market data in UI (Yahoo Finance proxy)
- Strategy marketplace (share + fork)
- Crypto support (Binance data)

**📋 Planned:**
- Options pricing (Black-Scholes in TS)
- Interactive Brokers adapter
- Mobile app (PWA)
- Tax reporting
- Multi-language support

Full roadmap: [`doc/checklists/`](doc/checklists/)

---

## 📊 Performance

| Metric | Score |
|--------|-------|
| Lighthouse Performance | 100 |
| Lighthouse Accessibility | 100 |
| Lighthouse SEO | 100 |
| Python Tests | 142 passing |
| TypeScript Engine | 1,560 lines |
| Web Pages | 37 |
| Build Time | ~12 seconds |

---

## 📖 Documentation

- [Quick Start Guide](docs/getting-started.md)
- [Backtesting Guide](docs/guides/backtesting.md)
- [Strategy Development](docs/guides/strategies.md)
- [Optimization Guide](docs/guides/optimization.md)
- [Paper Trading Tutorial](docs/tutorials/paper-trading.md)
- [Backend Architecture](docs/architecture/BACKEND_ARCHITECTURE.md)
- [Competitive Analysis](doc/COMPETITIVE_ANALYSIS.md)

---

## 📄 License

MIT — use it however you want. See [LICENSE](LICENSE).

---

## 🙏 Acknowledgments

Built with [Astro](https://astro.build), [React](https://react.dev), [Firebase](https://firebase.google.com), [Alpaca](https://alpaca.markets), and [Claude](https://anthropic.com).

---

<p align="center">
  <sub>Built by <a href="https://github.com/ArtemioPadilla">@ArtemioPadilla</a> · Star ⭐ if you find it useful</sub>
</p>
