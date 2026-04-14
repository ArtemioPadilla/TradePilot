# TradePilot

[![Tests](https://github.com/aspadillar/TradePilot/actions/workflows/test.yml/badge.svg)](https://github.com/aspadillar/TradePilot/actions/workflows/test.yml)
[![Deploy Web](https://github.com/aspadillar/TradePilot/actions/workflows/deploy-web.yml/badge.svg)](https://github.com/aspadillar/TradePilot/actions/workflows/deploy-web.yml)
[![Lighthouse CI](https://github.com/aspadillar/TradePilot/actions/workflows/lighthouse.yml/badge.svg)](https://github.com/aspadillar/TradePilot/actions/workflows/lighthouse.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Integrated Backtesting and Live Trading Framework**

TradePilot is an open-source Python library that integrates both backtesting (simulation) and live trading modules into a unified framework. It allows you to design, test, and deploy portfolio management strategies using real-time data and broker API integrations (such as Alpaca) in a modular, scalable, and robust environment.

---

## Table of Contents

- [TradePilot](#tradepilot)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Features](#features)
  - [Installation](#installation)
    - [Prerequisites](#prerequisites)
    - [Clone the Repository](#clone-the-repository)
    - [Install Dependencies](#install-dependencies)
  - [Usage](#usage)
    - [Backtesting Example](#backtesting-example)
    - [Live Trading Example](#live-trading-example)
  - [Project Structure](#project-structure)
  - [Contributing](#contributing)
  - [Roadmap](#roadmap)
  - [License](#license)
  - [Contact](#contact)

---

## Overview

The TradePilot library is designed to empower algorithmic traders and quantitative researchers by providing:
- A **simulation module** (TPS) for historical backtesting of portfolio strategies.
- A **live trading module** (TPT) to execute real orders via broker APIs.
- A robust **backtest wrapper** that evaluates performance using common metrics (annual return, Sharpe ratio, max drawdown, etc.).
- A modular design that supports multiple **asset ranking** strategies (e.g., momentum, mean reversion) and **portfolio optimization** techniques (Maximum Sharpe Ratio, Global Minimum Variance, Equally Weighted).

By offering a unified environment for both backtesting and live trading, TPT minimizes the gap between simulation and execution, enabling smoother transitions from research to production.

---

## Features

- **Python Backtesting Core** (83/83 tests passing):
  - Simulation engine (TPS) with configurable rebalancing frequencies
  - Performance evaluation: annualized return, Sharpe ratio, max drawdown, volatility
  - Optimization: Maximum Sharpe Ratio, Global Minimum Variance, Equal Weight
  - Ranking strategies: momentum, mean reversion, random
  - Data: Yahoo Finance (yfinance), Treasury risk-free rates

- **Live Trading Module (TPT):**
  - Broker API integration (Alpaca) for order execution
  - Periodic rebalancing with portfolio management

- **Web Application** (Astro + React):
  - Firebase Authentication with invite system and admin approval
  - Portfolio dashboard with account/holdings management
  - Trading interface with order form and history
  - Backtesting UI with strategy selector and results visualization
  - 3 themes (Bloomberg Terminal, Modern Fintech, Dashboard Dark)
  - 9 Firestore services with real implementations
  - FastAPI bridge connecting Python backtesting to web UI

- **Data Integration:**
  - Historical and live data via Yahoo Finance
  - Alpaca market data streaming (WebSocket)

---

## Installation

### Prerequisites

- Python 3.7 or higher
- [pip](https://pip.pypa.io/en/stable/)

### Clone the Repository

```bash
git clone https://github.com/aspadillar/TradePilot.git
cd TradePilot
```
### Install Dependencies

You can install the package in development mode with all dependencies using:

```bash
pip install -e .
```

Alternatively, you can install from the `requirements.txt`:

```bash
pip install -r requirements.txt
```

---

## Usage

### Backtesting Example

Below is a sample script to run a backtest using a momentum strategy:

```python
# examples/example_backtest.py

from tradepilot.backtest import Backtest
from tradepilot.data import MarketData
from strategies.momentum import momentum_strategy

# Retrieve historical data for a given asset (e.g., AAPL)
market_data = MarketData()
# In a real scenario, you might use a DataFrame of multiple assets.
universe = market_data.get_historical_data("AAPL", "2020-01-01", "2024-01-01")

# Set up and run the backtest with the momentum strategy
backtest = Backtest(universe, momentum_strategy, initial_capital=10000, risk_free=0.02)
backtest.run(start="2020-01-01", end="2024-01-01")
results = backtest.evaluate()

print("Backtest Metrics:")
for key, value in results.items():
    print(f"{key}: {value}")
```

### Live Trading Example

Below is an example script for live trading (ensure you have valid broker credentials and a paper trading account):

```python
# examples/example_live_trading.py

from tradepilot.trader import TPT
from tradepilot.broker import BrokerAPI
from tradepilot.data import MarketData
from strategies.momentum import momentum_strategy

# Retrieve recent data for an asset (e.g., AAPL)
market_data = MarketData()
universe = market_data.get_historical_data("AAPL", "2023-01-01", "2024-01-01")

# Set up and run live trading (replace 'alpaca' with your broker identifier)
trader = TPT(broker_api="alpaca", universe=universe, strategy=momentum_strategy,
              capital=10000, risk_free=0.02)
trader.run()
```

---

## Project Structure

```
TradePilot/
├── tradepilot/            # Python backtesting library
│   ├── simulator.py       # TPS — backtesting/simulation engine
│   ├── trader.py          # TPT — live trading module
│   ├── backtest.py        # High-level backtest wrapper
│   ├── broker.py          # Alpaca broker API integration
│   ├── ranking.py         # Asset ranking (momentum, random)
│   ├── optimization.py    # Portfolio optimization (MSR, GMV, EW)
│   ├── metrics.py         # Financial metrics (Sharpe, drawdown, etc.)
│   ├── data.py            # Market data (yfinance, Treasury rates)
│   └── config.py          # API credentials configuration
├── web/                   # Web application (Astro + React)
│   ├── src/
│   │   ├── components/    # React island components
│   │   ├── layouts/       # Astro layouts (Main, Dashboard, Admin)
│   │   ├── pages/         # 27 pages (auth, dashboard, trading, etc.)
│   │   └── lib/           # Services, utilities, Firebase config
│   └── tests/e2e/         # Playwright E2E tests
├── api/                   # FastAPI bridge (Python ↔ Web)
│   └── server.py          # Backtest & strategy API endpoints
├── strategies/            # Trading strategy implementations
├── tests/                 # Python unit tests (83 tests)
├── doc/                   # Project documentation
│   ├── checklists/        # Phase 0-10 development checklists
│   ├── PLATFORM_PLAN.md   # Web platform specification
│   └── DATA_MODELS.md     # Firestore data models
├── docs/                  # Technical guides (Sphinx)
└── functions/             # Firebase Cloud Functions
```

---

## Documentation

Detailed architecture documentation is available:

- **[Backend Architecture](docs/architecture/BACKEND_ARCHITECTURE.md)** - Python library structure and data flows
- **[Integration Guide](docs/architecture/INTEGRATION.md)** - How backend and web app work together
- **[Web Data Architecture](web/docs/architecture/DATA_ARCHITECTURE.md)** - Market data and caching system
- **[Permissions](web/docs/architecture/PERMISSIONS.md)** - Access control and GDPR compliance

---

## Contributing

We welcome contributions from the community! Here's how you can help:

1. **Fork the Repository:**  
   Create your own fork of this repository.

2. **Create a Feature Branch:**  
   Use descriptive branch names (e.g., `improve-error-handling` or `add-new-strategy`).

3. **Write Tests:**  
   Add or update tests for your changes to ensure nothing breaks.

4. **Follow the Code Style:**  
   We follow PEP 8 guidelines. Make sure your code is well-commented and documented.

5. **Submit a Pull Request:**  
   Include a clear description of your changes and link to any related issues.

For detailed guidelines, please see our [CONTRIBUTING.md](CONTRIBUTING.md) file.

---

## Roadmap

Development is tracked in `doc/checklists/` (Phases 0-10).

**Completed (Phases 0-4):**
- Web app foundation, auth, portfolio management, Alpaca integration, backtesting UI
- FastAPI bridge, 9 Firestore services, 83/83 Python tests

**In Progress (Phases 5-10):**
- Strategy builder with Monaco editor (Phase 5)
- Alerts & notifications backend (Phase 6)
- Social features — leaderboard, strategy sharing (Phase 7)
- Reporting — PDF generation, tax reports (Phase 8)
- PWA — offline mode, service worker (Phase 9)
- Documentation — API docs, tutorials (Phase 10)

**Python Library Improvements:** See `doc/roadmap.md`

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contact

For any questions, feedback, or contributions, please reach out:

- **Maintainer:** Your Name ([your.email@example.com](mailto:your.email@example.com))
- **GitHub:** [yourusername](https://github.com/yourusername)

---

We hope you find TradePilot useful and exciting. Contributions, suggestions, and feedback are highly appreciated—let's build a robust, production-ready trading platform together!

Happy Trading! 🚀