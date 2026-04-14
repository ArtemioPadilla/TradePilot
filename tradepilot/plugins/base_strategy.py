"""Abstract base class for ranking strategies.

Strategies rank assets in a universe to determine which ones should be
selected for portfolio construction. The interface mirrors the existing
function-based pattern in tradepilot/ranking.py (momentum_ranking,
random_ranking) where functions accept a prices DataFrame and return
a Series or Index of ranked symbols.
"""

from abc import ABC, abstractmethod

import pandas as pd


class StrategyBase(ABC):
    """Abstract base class that all strategy plugins must implement.

    A strategy takes a DataFrame of historical prices and produces a
    ranked Series of asset scores. Higher scores indicate stronger
    candidates for inclusion in the portfolio.

    Example usage::

        class MeanReversionStrategy(StrategyBase):
            @property
            def name(self):
                return "mean-reversion"

            def rank(self, prices, **kwargs):
                moving_avg = prices.mean()
                current = prices.iloc[-1]
                return moving_avg - current  # higher = more oversold

        registry.register_strategy("mean-reversion", MeanReversionStrategy)
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable display name for this strategy.

        Returns:
            A short descriptive name string, e.g. ``"momentum"`` or
            ``"mean-reversion"``.
        """

    @abstractmethod
    def rank(self, prices: pd.DataFrame, **kwargs) -> pd.Series:
        """Rank assets based on the strategy's criteria.

        Args:
            prices: A DataFrame where each column is a ticker symbol and
                each row is a date, containing historical closing prices.
            **kwargs: Strategy-specific parameters (e.g. lookback period,
                momentum window).

        Returns:
            A pandas Series indexed by symbol with numeric scores.
            Higher values indicate stronger candidates for portfolio
            inclusion.
        """
