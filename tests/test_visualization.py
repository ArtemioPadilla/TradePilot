"""
Tests for visualization module.
Verifies that all visualization functions return Plotly Figure objects.
"""

import pytest
import numpy as np
import pandas as pd
import sys
import os

test_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(test_dir)
sys.path.insert(0, parent_dir)

plotly = pytest.importorskip("plotly")
from plotly.graph_objects import Figure

from tradepilot.visualization import (
    plot_portfolio_valuation,
    plot_efficient_frontier,
    plot_allocation_over_time,
    plot_drawdown,
    plot_returns_distribution,
    plot_strategy_comparison,
    plot_momentum,
    plot_risk_metrics,
)


@pytest.fixture
def sample_valuation():
    dates = pd.date_range("2023-01-01", periods=100, freq="B")
    return pd.Series(10000 * np.cumprod(1 + np.random.normal(0.001, 0.01, 100)), index=dates, name="Portfolio")


@pytest.fixture
def sample_returns():
    np.random.seed(42)
    dates = pd.date_range("2023-01-01", periods=252, freq="B")
    return pd.Series(np.random.normal(0.0005, 0.02, 252), index=dates, name="Returns")


@pytest.fixture
def sample_returns_df():
    np.random.seed(42)
    dates = pd.date_range("2023-01-01", periods=252, freq="B")
    return pd.DataFrame({
        "AAPL": np.random.normal(0.001, 0.02, 252),
        "MSFT": np.random.normal(0.0008, 0.018, 252),
        "GOOGL": np.random.normal(0.0005, 0.022, 252),
    }, index=dates)


@pytest.fixture
def sample_prices():
    np.random.seed(42)
    dates = pd.date_range("2023-01-01", periods=252, freq="B")
    return pd.DataFrame({
        "AAPL": 150 * np.cumprod(1 + np.random.normal(0.0005, 0.02, 252)),
        "MSFT": 300 * np.cumprod(1 + np.random.normal(0.0005, 0.02, 252)),
    }, index=dates)


@pytest.fixture
def sample_er_cov(sample_returns_df):
    er = sample_returns_df.mean() * 252
    cov = sample_returns_df.cov()
    return er, cov


@pytest.fixture
def sample_allocations():
    return pd.DataFrame({
        "stock": ["AAPL", "MSFT", "AAPL", "MSFT"],
        "value": [5000, 5000, 6000, 4000],
        "date": ["2023/01/01", "2023/01/01", "2023/01/08", "2023/01/08"],
    })


class TestPlotPortfolioValuation:
    def test_returns_figure(self, sample_valuation):
        fig = plot_portfolio_valuation(sample_valuation)
        assert isinstance(fig, Figure)

    def test_with_benchmark(self, sample_valuation):
        benchmark = sample_valuation * 1.05
        benchmark.name = "Benchmark"
        fig = plot_portfolio_valuation(sample_valuation, benchmark=benchmark)
        assert isinstance(fig, Figure)


class TestPlotEfficientFrontier:
    def test_returns_figure(self, sample_er_cov):
        er, cov = sample_er_cov
        fig = plot_efficient_frontier(er, cov, n_points=10)
        assert isinstance(fig, Figure)

    def test_with_msr(self, sample_er_cov):
        er, cov = sample_er_cov
        fig = plot_efficient_frontier(er, cov, n_points=10, show_msr=True, riskfree_rate=0.04)
        assert isinstance(fig, Figure)

    def test_with_all_options(self, sample_er_cov):
        er, cov = sample_er_cov
        fig = plot_efficient_frontier(er, cov, n_points=10,
                                      show_msr=True, show_gmv=True, show_ew=True,
                                      riskfree_rate=0.04)
        assert isinstance(fig, Figure)


class TestPlotAllocationOverTime:
    def test_returns_figure(self, sample_allocations):
        fig = plot_allocation_over_time(sample_allocations)
        assert isinstance(fig, Figure)

    def test_normalized(self, sample_allocations):
        fig = plot_allocation_over_time(sample_allocations, normalized=True)
        assert isinstance(fig, Figure)


class TestPlotDrawdown:
    def test_returns_figure(self, sample_prices):
        fig = plot_drawdown(sample_prices)
        assert isinstance(fig, Figure)

    def test_with_series(self, sample_prices):
        fig = plot_drawdown(sample_prices["AAPL"])
        assert isinstance(fig, Figure)


class TestPlotReturnsDistribution:
    def test_returns_figure(self, sample_returns):
        fig = plot_returns_distribution(sample_returns)
        assert isinstance(fig, Figure)


class TestPlotStrategyComparison:
    def test_returns_figure(self, sample_valuation):
        results = {
            "Strategy A": sample_valuation,
            "Strategy B": sample_valuation * 1.1,
        }
        fig = plot_strategy_comparison(results)
        assert isinstance(fig, Figure)


class TestPlotMomentum:
    def test_returns_figure(self, sample_prices):
        fig = plot_momentum(sample_prices, t=10)
        assert isinstance(fig, Figure)


class TestPlotRiskMetrics:
    def test_returns_figure(self, sample_returns_df):
        fig = plot_risk_metrics(sample_returns_df)
        assert isinstance(fig, Figure)

    def test_with_series(self, sample_returns):
        fig = plot_risk_metrics(sample_returns)
        assert isinstance(fig, Figure)
