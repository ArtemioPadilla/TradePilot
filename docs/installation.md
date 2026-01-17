# Installation

## Requirements

- Python 3.9 or higher
- pip package manager

## Install from Source

```bash
# Clone the repository
git clone https://github.com/aspadillar/TradePilot.git
cd TradePilot

# Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install in development mode
pip install -e .

# Or install dependencies only
pip install -r requirements.txt
```

## Dependencies

TradePilot relies on the following core packages:

| Package | Purpose |
|---------|---------|
| pandas | Data manipulation and analysis |
| numpy | Numerical computations |
| yfinance | Yahoo Finance data retrieval |
| scipy | Optimization algorithms |
| tqdm | Progress bars |

## Verify Installation

```python
import tradepilot
from tradepilot.backtest import Backtest
from tradepilot.data import MarketData

print("TradePilot installed successfully!")
```

## Alpaca API Setup (Optional)

For live trading, you need Alpaca API credentials:

1. Create an account at [Alpaca](https://alpaca.markets/)
2. Generate API keys from your dashboard
3. Set environment variables:

```bash
export ALPACA_API_KEY="your-api-key"
export ALPACA_SECRET_KEY="your-secret-key"
export ALPACA_BASE_URL="https://paper-api.alpaca.markets"  # For paper trading
```

## Web Platform Setup

For the web dashboard:

```bash
cd web
npm install
npm run dev
```

Visit `http://localhost:4321` to access the platform.
