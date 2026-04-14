"""
Tests for VaR ranking function.
"""

import pytest
import numpy as np
import pandas as pd
import sys
import os

test_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(test_dir)
sys.path.insert(0, parent_dir)

from tradepilot.ranking import var_ranking


@pytest.fixture
def sample_prices():
    """Generate sample price data for multiple assets."""
    np.random.seed(42)
    dates = pd.date_range("2023-01-01", periods=252, freq="B")
    data = {
        "AAPL": 150 * np.cumprod(1 + np.random.normal(0.0005, 0.015, 252)),
        "MSFT": 300 * np.cumprod(1 + np.random.normal(0.0005, 0.020, 252)),
        "TSLA": 200 * np.cumprod(1 + np.random.normal(0.001, 0.035, 252)),
    }
    return pd.DataFrame(data, index=dates)


class TestVarRanking:
    def test_returns_series(self, sample_prices):
        result = var_ranking(sample_prices, t=100)
        assert isinstance(result, pd.Series)

    def test_correct_number_of_assets(self, sample_prices):
        result = var_ranking(sample_prices, t=100)
        assert len(result) == 3

    def test_values_positive(self, sample_prices):
        result = var_ranking(sample_prices, t=100)
        assert all(result > 0), "VaR values should be positive"

    def test_lower_vol_asset_has_lower_var(self, sample_prices):
        """AAPL has lower vol than TSLA, so should generally have lower VaR."""
        result = var_ranking(sample_prices, t=100)
        # AAPL (vol=0.015) should usually have lower VaR than TSLA (vol=0.035)
        assert result["AAPL"] < result["TSLA"]

    def test_different_time_windows(self, sample_prices):
        result_50 = var_ranking(sample_prices, t=50)
        result_200 = var_ranking(sample_prices, t=200)
        # Both should return valid results
        assert len(result_50) == 3
        assert len(result_200) == 3

    def test_all_data(self, sample_prices):
        """t=0 should use all available data."""
        result = var_ranking(sample_prices, t=0)
        assert len(result) == 3
        assert all(result > 0)

    def test_custom_level(self, sample_prices):
        result_5 = var_ranking(sample_prices, t=100, level=5)
        result_1 = var_ranking(sample_prices, t=100, level=1)
        # Lower level (more extreme tail) should give higher VaR
        assert all(result_1 >= result_5)
