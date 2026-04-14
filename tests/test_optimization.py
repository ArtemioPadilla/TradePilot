"""
Tests for TradePilot Optimization Functions

Tests portfolio optimization functions (MSR, GMV, Equal Weight).
"""

import pytest
import numpy as np
import pandas as pd
import sys
import os

# Add parent directory to path
test_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(test_dir)
sys.path.insert(0, parent_dir)

from tradepilot.optimization import msr, gmv, eq_weighted
from conftest import assert_weights_valid


class TestMSR:
    """Test Maximum Sharpe Ratio optimization."""

    def test_msr_basic(self, sample_expected_returns, sample_covariance, sample_risk_free_rate):
        """Test basic MSR optimization."""
        weights = msr(
            sample_risk_free_rate,
            sample_expected_returns,
            sample_covariance
        )

        assert len(weights) == len(sample_expected_returns)
        assert_weights_valid(weights)

    def test_msr_with_bounds(self, sample_expected_returns, sample_covariance, sample_risk_free_rate):
        """Test MSR optimization with custom bounds."""
        min_w = 0.05
        max_w = 0.50

        weights = msr(
            sample_risk_free_rate,
            sample_expected_returns,
            sample_covariance,
            min_w=min_w,
            max_w=max_w
        )

        assert len(weights) == len(sample_expected_returns)
        assert_weights_valid(weights, min_w, max_w)

    def test_msr_returns_numpy_array(self, sample_expected_returns, sample_covariance, sample_risk_free_rate):
        """Test that MSR returns numpy array."""
        weights = msr(
            sample_risk_free_rate,
            sample_expected_returns,
            sample_covariance
        )

        assert isinstance(weights, np.ndarray)

    def test_msr_with_zero_risk_free(self, sample_expected_returns, sample_covariance):
        """Test MSR with zero risk-free rate."""
        weights = msr(0, sample_expected_returns, sample_covariance)

        assert len(weights) == len(sample_expected_returns)
        assert_weights_valid(weights)

    def test_msr_with_high_risk_free(self, sample_expected_returns, sample_covariance):
        """Test MSR with high risk-free rate (higher than expected returns)."""
        # When risk-free rate is very high, optimization should still converge
        weights = msr(0.5, sample_expected_returns, sample_covariance)

        assert len(weights) == len(sample_expected_returns)
        assert_weights_valid(weights)

    def test_msr_with_pandas_inputs(self, sample_returns):
        """Test MSR accepts pandas Series/DataFrame inputs."""
        er = sample_returns.mean() * 252
        cov = sample_returns.cov()

        weights = msr(0.04, er, cov)

        assert len(weights) == len(er)
        assert_weights_valid(weights)

    def test_msr_two_assets(self):
        """Test MSR with two assets."""
        er = np.array([0.10, 0.15])
        cov = np.array([[0.04, 0.01], [0.01, 0.09]])

        weights = msr(0.02, er, cov)

        assert len(weights) == 2
        assert_weights_valid(weights)

    def test_msr_identical_assets(self):
        """Test MSR with identical expected returns."""
        er = np.array([0.10, 0.10, 0.10])
        cov = np.array([
            [0.04, 0.01, 0.01],
            [0.01, 0.04, 0.01],
            [0.01, 0.01, 0.04]
        ])

        weights = msr(0.02, er, cov)

        assert len(weights) == 3
        assert_weights_valid(weights)


class TestGMV:
    """Test Global Minimum Variance optimization."""

    def test_gmv_basic(self, sample_covariance):
        """Test basic GMV optimization."""
        weights = gmv(sample_covariance)

        assert len(weights) == sample_covariance.shape[0]
        assert_weights_valid(weights)

    def test_gmv_with_bounds(self, sample_covariance):
        """Test GMV with custom bounds."""
        min_w = 0.05
        max_w = 0.50

        weights = gmv(sample_covariance, min_w=min_w, max_w=max_w)

        assert len(weights) == sample_covariance.shape[0]
        assert_weights_valid(weights, min_w, max_w)

    def test_gmv_returns_numpy_array(self, sample_covariance):
        """Test that GMV returns numpy array."""
        weights = gmv(sample_covariance)

        assert isinstance(weights, np.ndarray)

    def test_gmv_minimizes_variance(self, sample_covariance):
        """Test that GMV weights minimize portfolio variance."""
        gmv_weights = gmv(sample_covariance)

        # Calculate portfolio variance
        gmv_variance = np.dot(gmv_weights.T, np.dot(sample_covariance, gmv_weights))

        # Equal weight variance for comparison
        n = sample_covariance.shape[0]
        eq_weights = np.repeat(1/n, n)
        eq_variance = np.dot(eq_weights.T, np.dot(sample_covariance, eq_weights))

        # GMV variance should be less than or equal to equal weight variance
        assert gmv_variance <= eq_variance + 1e-6

    def test_gmv_two_assets(self):
        """Test GMV with two assets."""
        cov = np.array([[0.04, 0.01], [0.01, 0.09]])

        weights = gmv(cov)

        assert len(weights) == 2
        assert_weights_valid(weights)

    def test_gmv_pandas_input(self, sample_covariance):
        """Test GMV accepts pandas DataFrame input."""
        # sample_covariance is already a DataFrame
        weights = gmv(sample_covariance)

        assert len(weights) == sample_covariance.shape[0]
        assert_weights_valid(weights)


class TestEqualWeighted:
    """Test Equal Weighted portfolio."""

    def test_eq_weighted_basic(self, sample_expected_returns):
        """Test basic equal weighting."""
        weights = eq_weighted(sample_expected_returns)

        n = len(sample_expected_returns)
        expected_weight = 1 / n

        assert len(weights) == n
        assert np.allclose(weights, expected_weight)
        assert_weights_valid(weights)

    def test_eq_weighted_returns_numpy_array(self, sample_expected_returns):
        """Test that eq_weighted returns numpy array."""
        weights = eq_weighted(sample_expected_returns)

        assert isinstance(weights, np.ndarray)

    def test_eq_weighted_different_sizes(self):
        """Test equal weighting with different portfolio sizes."""
        for n in [2, 3, 5, 10, 20]:
            er = np.ones(n)
            weights = eq_weighted(er)

            assert len(weights) == n
            assert np.allclose(weights, 1/n)
            assert_weights_valid(weights)

    def test_eq_weighted_pandas_series(self, sample_expected_returns):
        """Test eq_weighted accepts pandas Series."""
        weights = eq_weighted(sample_expected_returns)

        assert len(weights) == len(sample_expected_returns)
        assert_weights_valid(weights)


class TestOptimizationEdgeCases:
    """Test edge cases for optimization functions."""

    def test_single_asset_msr(self):
        """Test MSR with single asset."""
        er = np.array([0.10])
        cov = np.array([[0.04]])

        weights = msr(0.02, er, cov)

        assert len(weights) == 1
        assert np.isclose(weights[0], 1.0, atol=0.06)

    def test_single_asset_gmv(self):
        """Test GMV with single asset."""
        cov = np.array([[0.04]])

        weights = gmv(cov)

        assert len(weights) == 1
        assert np.isclose(weights[0], 1.0, atol=0.06)

    def test_single_asset_eq_weighted(self):
        """Test eq_weighted with single asset."""
        er = np.array([0.10])

        weights = eq_weighted(er)

        assert len(weights) == 1
        assert weights[0] == 1.0

    def test_high_correlation_assets(self):
        """Test optimization with highly correlated assets."""
        # Almost perfectly correlated
        cov = np.array([
            [0.04, 0.039, 0.038],
            [0.039, 0.04, 0.039],
            [0.038, 0.039, 0.04]
        ])
        er = np.array([0.10, 0.11, 0.12])

        weights = msr(0.02, er, cov)

        assert len(weights) == 3
        assert_weights_valid(weights)

    def test_negative_correlation_assets(self):
        """Test optimization with negatively correlated assets."""
        cov = np.array([
            [0.04, -0.02],
            [-0.02, 0.04]
        ])
        er = np.array([0.10, 0.10])

        weights = msr(0.02, er, cov)

        assert len(weights) == 2
        assert_weights_valid(weights)
