"""
Tests for TradePilot Backtest Module

Tests the high-level backtesting interface.

Note: The Backtest class provides a simpler interface than TPS.
For advanced backtesting, use TPS directly.
"""

import pytest
import pandas as pd
import numpy as np
import sys
import os

# Add parent directory to path
test_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(test_dir)
sys.path.insert(0, parent_dir)

from tradepilot.backtest import Backtest
from tradepilot.ranking import momentum_ranking
from conftest import create_price_dataframe


def simple_strategy(prices):
    """Simple strategy that returns top 3 stocks by recent return."""
    if len(prices) < 2:
        return prices.columns[:3].tolist()
    returns = prices.pct_change().iloc[-1]
    return returns.nlargest(3).index.tolist()


class TestBacktestInitialization:
    """Test Backtest initialization."""

    def test_initialization_basic(self, sample_prices):
        """Test basic Backtest initialization."""
        bt = Backtest(
            universe=sample_prices,
            strategy=simple_strategy,
            initial_capital=100000,
            risk_free=0.04,
            rebalance_freq='W-MON'
        )

        assert bt is not None
        assert bt.results is None

    def test_initialization_default_rebalance(self, sample_prices):
        """Test Backtest initialization with default rebalance frequency."""
        bt = Backtest(
            universe=sample_prices,
            strategy=simple_strategy,
            initial_capital=100000,
            risk_free=0.04
        )

        assert bt is not None


class TestBacktestRun:
    """Test Backtest run functionality."""

    @pytest.fixture
    def backtest(self, sample_prices):
        """Create a Backtest instance for testing."""
        return Backtest(
            universe=sample_prices,
            strategy=simple_strategy,
            initial_capital=100000,
            risk_free=0.04,
            rebalance_freq='W-MON'
        )

    def test_run_returns_series(self, backtest):
        """Test that run returns portfolio valuations series."""
        results = backtest.run('2023-04-01', '2023-06-30')

        assert isinstance(results, pd.Series)

    def test_run_stores_results(self, backtest):
        """Test that run stores results in instance."""
        backtest.run('2023-04-01', '2023-06-30')

        assert backtest.results is not None


class TestBacktestEvaluate:
    """Test Backtest evaluate functionality."""

    @pytest.fixture
    def backtest(self, sample_prices):
        """Create a Backtest instance for testing."""
        return Backtest(
            universe=sample_prices,
            strategy=simple_strategy,
            initial_capital=100000,
            risk_free=0.04,
            rebalance_freq='W-MON'
        )

    def test_evaluate_before_run_raises(self, backtest):
        """Test that evaluate raises error before run."""
        with pytest.raises(ValueError, match="No results generated"):
            backtest.evaluate()

    def test_evaluate_returns_metrics(self, backtest):
        """Test that evaluate returns performance metrics."""
        backtest.run('2023-04-01', '2023-06-30')
        metrics = backtest.evaluate()

        assert isinstance(metrics, dict)
        assert 'Annual Return' in metrics
        assert 'Sharpe Ratio' in metrics
        assert 'Max Drawdown' in metrics


class TestBacktestMetrics:
    """Test Backtest metrics calculation."""

    @pytest.fixture
    def completed_backtest(self, sample_prices):
        """Create and run a Backtest instance."""
        bt = Backtest(
            universe=sample_prices,
            strategy=simple_strategy,
            initial_capital=100000,
            risk_free=0.04,
            rebalance_freq='W-MON'
        )
        bt.run('2023-04-01', '2023-06-30')
        return bt

    def test_annual_return_is_number(self, completed_backtest):
        """Test that annual return is a valid number."""
        metrics = completed_backtest.evaluate()
        annual_return = metrics['Annual Return']

        # Should be a number (float or int), can be numpy type
        assert np.isfinite(annual_return) or annual_return is None

    def test_sharpe_ratio_is_number(self, completed_backtest):
        """Test that Sharpe ratio is a valid number."""
        metrics = completed_backtest.evaluate()
        sharpe = metrics['Sharpe Ratio']

        # Should be a number (can be NaN for edge cases)
        assert isinstance(sharpe, (int, float, np.number)) or sharpe is None


class TestBacktestEdgeCases:
    """Test Backtest edge cases."""

    def test_small_universe(self):
        """Test Backtest with small universe."""
        small_universe = create_price_dataframe(['AAPL', 'GOOGL'])

        def two_stock_strategy(prices):
            return prices.columns.tolist()

        bt = Backtest(
            universe=small_universe,
            strategy=two_stock_strategy,
            initial_capital=100000,
            risk_free=0.04
        )

        results = bt.run('2023-04-01', '2023-06-30')
        assert results is not None

    def test_different_initial_capitals(self, sample_prices):
        """Test Backtest with different initial capital amounts."""
        for capital in [10000, 100000, 1000000]:
            bt = Backtest(
                universe=sample_prices,
                strategy=simple_strategy,
                initial_capital=capital,
                risk_free=0.04
            )

            results = bt.run('2023-04-01', '2023-06-30')
            assert results is not None

    def test_different_risk_free_rates(self, sample_prices):
        """Test Backtest with different risk-free rates."""
        for rfr in [0.0, 0.02, 0.05, 0.10]:
            bt = Backtest(
                universe=sample_prices,
                strategy=simple_strategy,
                initial_capital=100000,
                risk_free=rfr
            )

            results = bt.run('2023-04-01', '2023-06-30')
            assert results is not None


class TestBacktestStrategy:
    """Test Backtest with different strategies."""

    def test_momentum_strategy(self, sample_prices):
        """Test Backtest with momentum-based strategy."""
        def momentum_strategy(prices):
            if len(prices) < 20:
                return prices.columns[:3].tolist()
            # 20-day momentum
            returns_20d = (prices.iloc[-1] / prices.iloc[-20]) - 1
            return returns_20d.nlargest(3).index.tolist()

        bt = Backtest(
            universe=sample_prices,
            strategy=momentum_strategy,
            initial_capital=100000,
            risk_free=0.04
        )

        results = bt.run('2023-04-01', '2023-06-30')
        assert results is not None

    def test_equal_weight_strategy(self, sample_prices):
        """Test Backtest with equal weight strategy."""
        def equal_weight_strategy(prices):
            return prices.columns.tolist()

        bt = Backtest(
            universe=sample_prices,
            strategy=equal_weight_strategy,
            initial_capital=100000,
            risk_free=0.04
        )

        results = bt.run('2023-04-01', '2023-06-30')
        assert results is not None

    def test_single_stock_strategy(self, sample_prices):
        """Test Backtest with single stock strategy."""
        def single_stock_strategy(prices):
            return [prices.columns[0]]

        bt = Backtest(
            universe=sample_prices,
            strategy=single_stock_strategy,
            initial_capital=100000,
            risk_free=0.04
        )

        results = bt.run('2023-04-01', '2023-06-30')
        assert results is not None
