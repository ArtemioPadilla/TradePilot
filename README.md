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

- **Modular Architecture:**  
  - Separate modules for simulation, live trading, data retrieval, optimization, and risk metrics.
  - Easy-to-extend design for adding new strategies, data sources, and broker integrations.

- **Backtesting Module (TPS & Backtest):**  
  - Run simulations on historical data with configurable rebalancing frequencies.
  - Evaluate performance using key metrics such as annualized return, Sharpe ratio, and max drawdown.

- **Live Trading Module (TPT):**  
  - Integrates with broker APIs (e.g., Alpaca) to execute orders in a live environment.
  - Supports periodic rebalancing and can be extended to include advanced order management.

- **Data Integration:**  
  - Retrieve historical and live data using sources like Yahoo Finance (via `yfinance`) and other potential providers.
  
- **Risk Management (Baseline):**  
  - Incorporates basic risk controls with portfolio optimization based on risk-free rate and Sharpe ratio.
  - Easily extendable to include stop-loss, take-profit, and dynamic position sizing.

- **Extensive Documentation and Examples:**  
  - Clear inline comments, detailed docstrings, and example scripts to help you get started quickly.
  - Contribution guidelines to help new contributors join the project.

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
├── tradepilot/
│   ├── __init__.py        # Package initialization
│   ├── simulator.py       # Backtesting/simulation module (TPS)
│   ├── trader.py          # Live trading module (TPT)
│   ├── backtest.py        # Wrapper for backtesting with evaluation
│   ├── broker.py          # Broker API integration
│   ├── ranking.py         # Asset ranking/selection functions
│   ├── optimization.py    # Portfolio optimization functions
│   ├── metrics.py         # Financial metrics calculations
│   ├── data.py            # Data retrieval (historical & live)
│   ├── config.py          # Global configuration (e.g., API keys)
│   └── logging.py         # Logging functions for auditing
├── strategies/
│   ├── momentum.py        # Momentum-based strategy
│   └── mean_reversion.py  # Mean reversion strategy
├── tests/                 # Unit tests
├── examples/              # Example usage scripts
├── setup.py               # Package setup script
├── README.md              # Project documentation (this file)
├── requirements.txt       # Project dependencies
└── .gitignore             # Files to ignore in Git
```

---

## Contributing

We welcome contributions from the community! Here’s how you can help:

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

Here are some of the upcoming improvements and features planned for TradePilot:

- **Enhanced Broker API Integration:**  
  Improved error handling, order management, and support for additional brokers.

- **Advanced Risk Management:**  
  Implementation of stop-loss/take-profit orders, dynamic position sizing, and more comprehensive risk controls.

- **Real-Time Data & Asynchronous Execution:**  
  Integration of low-latency data providers and an asynchronous/event-driven trading engine.

- **Performance Optimization:**  
  Scalability enhancements to handle large universes and high-frequency data.

- **Additional Strategies:**  
  Incorporation of more trading strategies and machine learning-based approaches.

- **Improved Documentation:**  
  More examples, detailed API references, and tutorials to help new contributors.

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