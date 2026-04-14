"""Abstract base class for risk models.

Risk models provide quantitative risk assessment for individual assets
and portfolios. The interface mirrors the existing metrics module
(sharpe_ratio, max_drawdown) while adding Value at Risk and comprehensive
portfolio risk assessment.
"""

from abc import ABC, abstractmethod

import pandas as pd


class RiskModel(ABC):
    """Abstract base class that all risk model plugins must implement.

    A RiskModel encapsulates a coherent set of risk calculations. Different
    implementations may use parametric, historical, or Monte Carlo approaches.

    Example usage::

        class HistoricalRiskModel(RiskModel):
            def calculate_var(self, returns, confidence=0.95, horizon=1):
                import numpy as np
                return np.percentile(returns, (1 - confidence) * 100) * np.sqrt(horizon)
            ...

        registry.register_risk_model("historical", HistoricalRiskModel)
    """

    @abstractmethod
    def calculate_var(
        self, returns: pd.Series, confidence: float = 0.95, horizon: int = 1
    ) -> float:
        """Calculate Value at Risk for a return series.

        VaR estimates the maximum expected loss over a given time horizon
        at a specified confidence level.

        Args:
            returns: A Series of periodic returns (e.g. daily log returns).
            confidence: Confidence level, between 0 and 1. Defaults to 0.95
                (95th percentile).
            horizon: Number of periods to project forward. Defaults to 1.

        Returns:
            The VaR estimate as a positive float representing the potential
            loss amount.
        """

    @abstractmethod
    def calculate_max_drawdown(self, prices: pd.Series) -> float:
        """Calculate the maximum peak-to-trough drawdown.

        Args:
            prices: A Series of asset prices ordered chronologically.

        Returns:
            The maximum drawdown as a negative float (e.g. -0.25 for
            a 25% drawdown from peak).
        """

    @abstractmethod
    def calculate_sharpe(
        self,
        returns: pd.Series,
        risk_free_rate: float = 0.0,
        periods_per_year: int = 252,
    ) -> float:
        """Calculate the annualized Sharpe ratio.

        Args:
            returns: A Series of periodic returns.
            risk_free_rate: The annualized risk-free rate. Defaults to 0.0.
            periods_per_year: Number of return periods in a year. Defaults
                to 252 (trading days).

        Returns:
            The annualized Sharpe ratio as a float.
        """

    @abstractmethod
    def assess_portfolio_risk(self, returns: pd.DataFrame) -> dict:
        """Produce a comprehensive risk report for a portfolio.

        Args:
            returns: A DataFrame where each column represents an asset's
                return series and rows are time periods.

        Returns:
            A dictionary containing at minimum:
                - ``var_95`` (float): 95% VaR for the portfolio.
                - ``max_drawdown`` (float): Maximum portfolio drawdown.
                - ``sharpe_ratio`` (float): Portfolio Sharpe ratio.
                - ``volatility`` (float): Annualized portfolio volatility.
                - ``correlation_matrix`` (dict or DataFrame): Pairwise
                  asset correlations.
        """
