"""
Tests for extended metrics functions added from PMSS.py.
"""

import pytest
import numpy as np
import pandas as pd
import sys
import os

test_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(test_dir)
sys.path.insert(0, parent_dir)

from tradepilot.metrics import (
    skewness, kurtosis,
    var_historic, var_historic_from_prices, var_gaussian, cvar_historic,
    sortino_ratio, get_compounded_return, get_drawdown, get_volatility,
    portfolio_return, portfolio_vol, get_alpha,
    get_returns, annualize_returns,
)


@pytest.fixture
def sample_returns_series():
    """Simple return series for testing."""
    np.random.seed(42)
    dates = pd.date_range("2023-01-01", periods=252, freq="B")
    returns = pd.Series(np.random.normal(0.0005, 0.02, 252), index=dates)
    return returns


@pytest.fixture
def sample_returns_df():
    """Return DataFrame for multiple assets."""
    np.random.seed(42)
    dates = pd.date_range("2023-01-01", periods=252, freq="B")
    data = {
        "AAPL": np.random.normal(0.001, 0.02, 252),
        "MSFT": np.random.normal(0.0008, 0.018, 252),
        "GOOGL": np.random.normal(0.0005, 0.022, 252),
    }
    return pd.DataFrame(data, index=dates)


@pytest.fixture
def sample_prices():
    """Sample price data."""
    np.random.seed(42)
    dates = pd.date_range("2023-01-01", periods=252, freq="B")
    prices = 100 * np.cumprod(1 + np.random.normal(0.0005, 0.02, 252))
    return pd.Series(prices, index=dates, name="AAPL")


@pytest.fixture
def sample_prices_df():
    """Sample price DataFrame."""
    np.random.seed(42)
    dates = pd.date_range("2023-01-01", periods=252, freq="B")
    data = {}
    for sym, base in [("AAPL", 150), ("MSFT", 300)]:
        data[sym] = base * np.cumprod(1 + np.random.normal(0.0005, 0.02, 252))
    return pd.DataFrame(data, index=dates)


class TestSkewness:
    def test_returns_float_for_series(self, sample_returns_series):
        result = skewness(sample_returns_series)
        assert isinstance(result, (float, np.floating))

    def test_returns_series_for_dataframe(self, sample_returns_df):
        result = skewness(sample_returns_df)
        assert isinstance(result, pd.Series)
        assert len(result) == 3

    def test_symmetric_distribution_near_zero(self):
        np.random.seed(0)
        symmetric = pd.Series(np.random.normal(0, 1, 10000))
        assert abs(skewness(symmetric)) < 0.1


class TestKurtosis:
    def test_returns_float_for_series(self, sample_returns_series):
        result = kurtosis(sample_returns_series)
        assert isinstance(result, (float, np.floating))

    def test_returns_series_for_dataframe(self, sample_returns_df):
        result = kurtosis(sample_returns_df)
        assert isinstance(result, pd.Series)
        assert len(result) == 3

    def test_normal_distribution_near_three(self):
        np.random.seed(0)
        normal = pd.Series(np.random.normal(0, 1, 50000))
        assert abs(kurtosis(normal) - 3.0) < 0.15


class TestVarHistoric:
    def test_returns_positive_value(self, sample_returns_series):
        result = var_historic(sample_returns_series)
        assert result > 0

    def test_with_time_window(self, sample_returns_series):
        result = var_historic(sample_returns_series, t=100)
        assert result > 0

    def test_with_dataframe(self, sample_returns_df):
        result = var_historic(sample_returns_df)
        assert isinstance(result, pd.Series)
        assert all(result > 0)

    def test_higher_level_gives_higher_var(self, sample_returns_series):
        var_5 = var_historic(sample_returns_series, level=5)
        var_1 = var_historic(sample_returns_series, level=1)
        assert var_1 >= var_5

    def test_invalid_type_raises(self):
        with pytest.raises(TypeError):
            var_historic([1, 2, 3])


class TestVarHistoricFromPrices:
    def test_returns_positive(self, sample_prices):
        result = var_historic_from_prices(sample_prices, t=100)
        assert result > 0

    def test_with_dataframe(self, sample_prices_df):
        result = var_historic_from_prices(sample_prices_df, t=100)
        assert isinstance(result, pd.Series)
        assert all(result > 0)

    def test_invalid_type_raises(self):
        with pytest.raises(TypeError):
            var_historic_from_prices([1, 2, 3])


class TestVarGaussian:
    def test_returns_positive(self, sample_returns_series):
        result = var_gaussian(sample_returns_series)
        assert result > 0

    def test_modified_cornish_fisher(self, sample_returns_series):
        normal = var_gaussian(sample_returns_series, modified=False)
        modified = var_gaussian(sample_returns_series, modified=True)
        # Just check both return valid numbers
        assert np.isfinite(normal)
        assert np.isfinite(modified)

    def test_with_dataframe(self, sample_returns_df):
        result = var_gaussian(sample_returns_df)
        assert isinstance(result, pd.Series)


class TestCvarHistoric:
    def test_returns_positive(self, sample_returns_series):
        result = cvar_historic(sample_returns_series)
        assert result > 0

    def test_cvar_gte_var(self, sample_returns_series):
        var = var_historic(sample_returns_series)
        cvar = cvar_historic(sample_returns_series)
        assert cvar >= var

    def test_with_dataframe(self, sample_returns_df):
        result = cvar_historic(sample_returns_df)
        assert isinstance(result, pd.Series)
        assert all(result > 0)

    def test_invalid_type_raises(self):
        with pytest.raises(TypeError):
            cvar_historic([1, 2, 3])


class TestSortinoRatio:
    def test_returns_float(self, sample_returns_series):
        result = sortino_ratio(sample_returns_series, riskfree_rate=0.04)
        assert isinstance(result, (float, np.floating))
        assert np.isfinite(result)

    def test_with_dataframe(self, sample_returns_df):
        result = sortino_ratio(sample_returns_df, riskfree_rate=0.04)
        assert isinstance(result, pd.Series)


class TestGetCompoundedReturn:
    def test_zero_returns(self):
        r = pd.Series([0.0, 0.0, 0.0])
        assert get_compounded_return(r) == pytest.approx(0.0)

    def test_positive_returns(self):
        r = pd.Series([0.10, 0.10])
        # (1.1 * 1.1) - 1 = 0.21
        assert get_compounded_return(r) == pytest.approx(0.21)

    def test_with_dataframe(self, sample_returns_df):
        result = get_compounded_return(sample_returns_df)
        assert isinstance(result, pd.Series)
        assert len(result) == 3


class TestGetDrawdown:
    def test_all_increasing_prices_zero_drawdown(self):
        prices = pd.Series([100, 110, 120, 130])
        dd = get_drawdown(prices)
        assert all(dd == 0)

    def test_drawdown_negative(self, sample_prices):
        dd = get_drawdown(sample_prices)
        assert dd.min() <= 0

    def test_with_dataframe(self, sample_prices_df):
        dd = get_drawdown(sample_prices_df)
        assert isinstance(dd, pd.DataFrame)
        assert dd.min().min() <= 0


class TestGetVolatility:
    def test_returns_positive(self, sample_returns_series):
        assert get_volatility(sample_returns_series) > 0

    def test_with_dataframe(self, sample_returns_df):
        result = get_volatility(sample_returns_df)
        assert isinstance(result, pd.Series)
        assert all(result > 0)


class TestPortfolioReturn:
    def test_equal_weights(self):
        weights = np.array([0.5, 0.5])
        returns = np.array([0.10, 0.20])
        assert portfolio_return(weights, returns) == pytest.approx(0.15)

    def test_single_asset(self):
        weights = np.array([1.0])
        returns = np.array([0.05])
        assert portfolio_return(weights, returns) == pytest.approx(0.05)


class TestPortfolioVol:
    def test_single_asset(self):
        weights = np.array([1.0])
        covmat = np.array([[0.04]])
        assert portfolio_vol(weights, covmat) == pytest.approx(0.2)

    def test_two_uncorrelated_assets(self):
        weights = np.array([0.5, 0.5])
        covmat = np.array([[0.04, 0.0], [0.0, 0.04]])
        expected = np.sqrt(0.5**2 * 0.04 + 0.5**2 * 0.04)
        assert portfolio_vol(weights, covmat) == pytest.approx(expected)


class TestGetAlpha:
    def test_positive_alpha(self):
        assert get_alpha(0.10, 0.04) == pytest.approx(0.06)

    def test_negative_alpha(self):
        assert get_alpha(0.02, 0.04) == pytest.approx(-0.02)

    def test_with_series(self):
        rp = pd.Series([0.10, 0.15, 0.05])
        result = get_alpha(rp, 0.04)
        assert isinstance(result, pd.Series)
        assert result.iloc[0] == pytest.approx(0.06)
