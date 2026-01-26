"""
TradePilot Test Configuration

Provides pytest fixtures for testing with mocked data sources.
"""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add parent directory to path for imports
test_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(test_dir)
sys.path.insert(0, parent_dir)


# ============================================================
# Sample Data Fixtures
# ============================================================

@pytest.fixture
def sample_dates():
    """Generate sample date range for testing."""
    return pd.date_range(start='2023-01-01', end='2023-12-31', freq='B')


@pytest.fixture
def sample_prices(sample_dates):
    """
    Generate sample price data for multiple stocks.
    Returns a DataFrame with realistic price movements.
    """
    np.random.seed(42)  # For reproducibility

    stocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META']
    base_prices = [150, 100, 300, 120, 250]

    data = {}
    for stock, base_price in zip(stocks, base_prices):
        # Random walk with drift
        returns = np.random.normal(0.0005, 0.02, len(sample_dates))
        prices = base_price * np.cumprod(1 + returns)
        data[stock] = prices

    return pd.DataFrame(data, index=sample_dates)


@pytest.fixture
def sample_returns(sample_prices):
    """Calculate returns from sample prices."""
    return sample_prices.pct_change().dropna()


@pytest.fixture
def sample_covariance(sample_returns):
    """Calculate covariance matrix from sample returns."""
    return sample_returns.cov()


@pytest.fixture
def sample_expected_returns(sample_returns):
    """Calculate expected returns (annualized mean)."""
    return sample_returns.mean() * 252


@pytest.fixture
def sample_risk_free_rate():
    """Sample risk-free rate (annual)."""
    return 0.04  # 4%


@pytest.fixture
def sample_risk_free_series(sample_dates):
    """Sample risk-free rate time series."""
    # Slight variation around 4%
    rates = np.random.normal(4.0, 0.1, len(sample_dates))
    return pd.Series(rates, index=sample_dates)


# ============================================================
# Mock Fixtures
# ============================================================

@pytest.fixture
def mock_yfinance(sample_prices):
    """Mock yfinance Ticker class."""
    with patch('yfinance.Ticker') as mock_ticker:
        ticker_instance = Mock()

        def get_history(start=None, end=None, timeout=None):
            df = sample_prices.copy()
            if start:
                df = df[df.index >= pd.to_datetime(start)]
            if end:
                df = df[df.index <= pd.to_datetime(end)]
            # Return DataFrame with Close column
            return pd.DataFrame({'Close': df.iloc[:, 0]})

        ticker_instance.history = Mock(side_effect=get_history)
        ticker_instance.info = {'currentPrice': 150.0, 'regularMarketPrice': 150.0}

        mock_ticker.return_value = ticker_instance
        yield mock_ticker


@pytest.fixture
def mock_requests():
    """Mock requests library for API calls."""
    with patch('requests.post') as mock_post, patch('requests.get') as mock_get:
        # Mock successful order response
        order_response = Mock()
        order_response.status_code = 200
        order_response.ok = True
        order_response.json.return_value = {
            'id': 'test-order-123',
            'symbol': 'AAPL',
            'qty': '10',
            'side': 'buy',
            'type': 'market',
            'status': 'accepted',
            'created_at': '2023-01-01T10:00:00Z',
            'submitted_at': '2023-01-01T10:00:00Z',
            'updated_at': '2023-01-01T10:00:00Z',
            'filled_qty': '0',
        }
        mock_post.return_value = order_response

        # Mock account response
        account_response = Mock()
        account_response.status_code = 200
        account_response.ok = True
        account_response.json.return_value = {
            'id': 'test-account-123',
            'account_number': '123456789',
            'status': 'ACTIVE',
            'currency': 'USD',
            'cash': '100000.00',
            'portfolio_value': '150000.00',
            'buying_power': '200000.00',
        }
        mock_get.return_value = account_response

        yield {'post': mock_post, 'get': mock_get}


@pytest.fixture
def mock_env_credentials():
    """Mock environment variables for API credentials."""
    with patch.dict(os.environ, {
        'ALPACA_KEY_ID': 'test-key-id',
        'ALPACA_SECRET_KEY': 'test-secret-key',
    }):
        yield


# ============================================================
# Helper Functions
# ============================================================

def create_price_dataframe(
    symbols: list,
    start_date: str = '2023-01-01',
    end_date: str = '2023-12-31',
    seed: int = 42
) -> pd.DataFrame:
    """
    Create a price DataFrame for testing.

    Parameters:
        symbols: List of stock symbols
        start_date: Start date string
        end_date: End date string
        seed: Random seed for reproducibility

    Returns:
        DataFrame with price data
    """
    np.random.seed(seed)
    dates = pd.date_range(start=start_date, end=end_date, freq='B')

    data = {}
    for i, symbol in enumerate(symbols):
        base_price = 100 + i * 50
        returns = np.random.normal(0.0005, 0.02, len(dates))
        prices = base_price * np.cumprod(1 + returns)
        data[symbol] = prices

    return pd.DataFrame(data, index=dates)


def assert_weights_valid(weights: np.ndarray, min_w: float = 0.0, max_w: float = 1.0):
    """
    Assert that portfolio weights are valid.

    Parameters:
        weights: Array of portfolio weights
        min_w: Minimum allowed weight
        max_w: Maximum allowed weight
    """
    assert np.isclose(np.sum(weights), 1.0, atol=1e-6), "Weights must sum to 1"
    assert np.all(weights >= min_w - 1e-6), f"All weights must be >= {min_w}"
    assert np.all(weights <= max_w + 1e-6), f"All weights must be <= {max_w}"


# ============================================================
# Pytest Configuration
# ============================================================

def pytest_configure(config):
    """Pytest configuration hook."""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "api: marks tests that hit real APIs"
    )
