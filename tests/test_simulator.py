"""
Tests for TradePilot Simulator (TPS)

Tests the core backtesting simulation engine.
"""

import pytest
import pandas as pd
import numpy as np
from unittest.mock import Mock, patch
import sys
import os

# Add parent directory to path
test_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(test_dir)
sys.path.insert(0, parent_dir)

from tradepilot.simulator import TPS
from tradepilot.ranking import momentum_ranking
from conftest import create_price_dataframe, assert_weights_valid


class TestTPSInitialization:
    """Test TPS initialization."""

    def test_initialization_basic(self, sample_prices, sample_risk_free_series):
        """Test basic TPS initialization."""
        tps = TPS(
            universe=sample_prices,
            initial_capital=100000,
            risk_free=sample_risk_free_series,
            criteria=momentum_ranking,
            start='2023-03-01',
            end='2023-06-30',
            t=20,
            window=60,
            N=3
        )

        assert tps.N == 3
        assert tps.t == 20
        assert tps.window == 60
        assert tps.opt_tech == "MSR"

    def test_initialization_with_gmv(self, sample_prices, sample_risk_free_series):
        """Test TPS initialization with GMV optimization."""
        tps = TPS(
            universe=sample_prices,
            initial_capital=100000,
            risk_free=sample_risk_free_series,
            criteria=momentum_ranking,
            start='2023-03-01',
            end='2023-06-30',
            t=20,
            window=60,
            N=3,
            opt_tech="GMV"
        )

        assert tps.opt_tech == "GMV"

    def test_initialization_with_equal_weight(self, sample_prices, sample_risk_free_series):
        """Test TPS initialization with equal weight optimization."""
        tps = TPS(
            universe=sample_prices,
            initial_capital=100000,
            risk_free=sample_risk_free_series,
            criteria=momentum_ranking,
            start='2023-03-01',
            end='2023-06-30',
            t=20,
            window=60,
            N=3,
            opt_tech="EW"
        )

        assert tps.opt_tech == "EW"

    def test_initialization_weight_constraints(self, sample_prices, sample_risk_free_series):
        """Test TPS initialization with custom weight constraints."""
        tps = TPS(
            universe=sample_prices,
            initial_capital=100000,
            risk_free=sample_risk_free_series,
            criteria=momentum_ranking,
            start='2023-03-01',
            end='2023-06-30',
            t=20,
            window=60,
            N=5,
            min_weight=0.05,
            max_weight=0.40
        )

        assert tps.min_weight == 0.05
        assert tps.max_weight == 0.40

    def test_initialization_invalid_weights(self, sample_prices, sample_risk_free_series):
        """Test TPS initialization with invalid weight constraints."""
        with pytest.raises(AssertionError):
            TPS(
                universe=sample_prices,
                initial_capital=100000,
                risk_free=sample_risk_free_series,
                criteria=momentum_ranking,
                start='2023-03-01',
                end='2023-06-30',
                t=20,
                window=60,
                N=3,
                min_weight=0.5,  # Too high for N=3
                max_weight=0.95
            )


class TestTPSMethods:
    """Test TPS methods."""

    @pytest.fixture
    def tps_instance(self, sample_prices, sample_risk_free_series):
        """Create a TPS instance for testing."""
        return TPS(
            universe=sample_prices,
            initial_capital=100000,
            risk_free=sample_risk_free_series,
            criteria=momentum_ranking,
            start='2023-04-01',
            end='2023-06-30',
            t=20,
            window=60,
            N=3,
            track_allocations=True
        )

    def test_is_trading_day_true(self, tps_instance, sample_prices):
        """Test is_trading_day returns True for valid trading day."""
        trading_day = sample_prices.index[100]  # A day in the middle
        result = tps_instance.is_trading_day(trading_day)
        assert result is True

    def test_is_trading_day_false(self, tps_instance, sample_prices):
        """Test is_trading_day returns False for non-trading day."""
        # Weekend date (not in the business day index)
        non_trading_day = pd.Timestamp('2023-01-07')  # Saturday
        result = tps_instance.is_trading_day(non_trading_day)
        assert result is False

    def test_optimize_msr(self, tps_instance, sample_prices):
        """Test optimization with MSR."""
        # Set up the day for the tps instance
        tps_instance.day = sample_prices.index[100]
        tps_instance.start_study_day = sample_prices.index[40]

        prices = sample_prices.iloc[40:101]
        weights = tps_instance.optimize(prices)

        assert len(weights) == len(prices.columns)
        assert_weights_valid(weights, tps_instance.min_weight, tps_instance.max_weight)

    def test_get_period_risk_free_rate(self, tps_instance, sample_prices):
        """Test risk-free rate calculation for period."""
        tps_instance.day = sample_prices.index[100]
        tps_instance.start_study_day = sample_prices.index[40]

        rfr = tps_instance.get_period_risk_free_rate()

        # Should be close to 4% (our sample risk-free rate)
        assert 3.5 < rfr < 4.5


class TestTPSRun:
    """Test TPS run functionality."""

    def test_run_returns_valuations(self, sample_prices, sample_risk_free_series):
        """Test that run() returns valuations."""
        tps = TPS(
            universe=sample_prices,
            initial_capital=100000,
            risk_free=sample_risk_free_series,
            criteria=momentum_ranking,
            start='2023-04-01',
            end='2023-06-30',
            t=20,
            window=60,
            N=3
        )

        valuations, p_eval, allocations = tps.run()

        assert isinstance(valuations, pd.Series)
        assert len(valuations) > 0
        # Initial capital should be first value
        assert valuations.iloc[0] == 100000

    def test_run_with_track_allocations(self, sample_prices, sample_risk_free_series):
        """Test that run() tracks allocations when enabled."""
        tps = TPS(
            universe=sample_prices,
            initial_capital=100000,
            risk_free=sample_risk_free_series,
            criteria=momentum_ranking,
            start='2023-04-01',
            end='2023-06-30',
            t=20,
            window=60,
            N=3,
            track_allocations=True
        )

        valuations, p_eval, allocations = tps.run()

        assert allocations is not None
        assert isinstance(allocations, pd.DataFrame)

    def test_run_without_track_allocations(self, sample_prices, sample_risk_free_series):
        """Test that run() returns None allocations when disabled."""
        tps = TPS(
            universe=sample_prices,
            initial_capital=100000,
            risk_free=sample_risk_free_series,
            criteria=momentum_ranking,
            start='2023-04-01',
            end='2023-06-30',
            t=20,
            window=60,
            N=3,
            track_allocations=False
        )

        valuations, p_eval, allocations = tps.run()

        assert allocations is None


class TestTPSEdgeCases:
    """Test TPS edge cases."""

    def test_single_stock_universe(self, sample_risk_free_series):
        """Test TPS with single stock universe."""
        single_stock = create_price_dataframe(['AAPL'])

        tps = TPS(
            universe=single_stock,
            initial_capital=100000,
            risk_free=sample_risk_free_series,
            criteria=momentum_ranking,
            start='2023-04-01',
            end='2023-06-30',
            t=20,
            window=60,
            N=1
        )

        valuations, p_eval, allocations = tps.run()
        assert len(valuations) > 0

    def test_short_time_period(self, sample_prices, sample_risk_free_series):
        """Test TPS with very short time period."""
        tps = TPS(
            universe=sample_prices,
            initial_capital=100000,
            risk_free=sample_risk_free_series,
            criteria=momentum_ranking,
            start='2023-06-01',
            end='2023-06-15',
            t=5,
            window=20,
            N=3
        )

        valuations, p_eval, allocations = tps.run()
        # Should still run, may have limited data
        assert len(valuations) >= 1


class TestTPSPandasCompatibility:
    """Test that TPS works with pandas 2.0+ (pd.concat instead of append)."""

    def test_valuations_concat(self, sample_prices, sample_risk_free_series):
        """Test that valuations are properly concatenated (not appended)."""
        tps = TPS(
            universe=sample_prices,
            initial_capital=100000,
            risk_free=sample_risk_free_series,
            criteria=momentum_ranking,
            start='2023-04-01',
            end='2023-06-30',
            t=20,
            window=60,
            N=3
        )

        valuations, _, _ = tps.run()

        # Verify valuations is a proper Series
        assert isinstance(valuations, pd.Series)
        # Verify no deprecated warnings would occur (implicitly tested by running)
        assert valuations.index.is_monotonic_increasing or len(valuations) <= 1

    def test_stocks_symbols_list_conversion(self, sample_prices, sample_risk_free_series):
        """Test that stock symbols are stored as lists (not dict_keys)."""
        tps = TPS(
            universe=sample_prices,
            initial_capital=100000,
            risk_free=sample_risk_free_series,
            criteria=momentum_ranking,
            start='2023-04-01',
            end='2023-06-30',
            t=20,
            window=60,
            N=3,
            track_allocations=True
        )

        tps.run()

        # Verify stocks_symbols entries are lists
        for symbols in tps.stocks_symbols:
            assert isinstance(symbols, list), f"Expected list, got {type(symbols)}"
