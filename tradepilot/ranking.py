# tradepilot/ranking.py
import numpy as np
import pandas as pd
from tradepilot.metrics import momentum, var_historic_from_prices


def momentum_ranking(prices, t=10):
    """
    Calculates the momentum of each asset as the difference between
    the latest price and the price t periods ago.

    Parameters:
        prices (pd.DataFrame): Historical price data (datetime index, asset symbols as columns).
        t (int): Number of periods to calculate momentum.

    Returns:
        pd.Series: Momentum values for each asset (simulator handles sorting).
    """
    if len(prices) < t:
        raise ValueError("Not enough data to calculate momentum.")
    m = momentum(prices, t)
    return m


def random_ranking(prices, seed=None):
    """
    Random ranking function for testing purposes.

    Parameters:
        prices (pd.DataFrame): Historical price data.
        seed (int, optional): Random seed for reproducibility.

    Returns:
        pd.Series: Random score for each asset.
    """
    if seed is not None:
        np.random.seed(seed)
    return prices.apply(lambda _: np.random.random())


def var_ranking(prices, t=100, level=5):
    """
    Ranks assets by historic VaR (lowest risk first).
    Uses var_historic_from_prices to compute VaR for each asset,
    then returns VaR values as a Series. Lower VaR = lower risk.

    Parameters:
        prices (pd.DataFrame): Historical price data (datetime index, asset symbols as columns).
        t (int): Number of periods in the past to consider for VaR calculation.
        level (int): Percentile level for VaR (default 5).

    Returns:
        pd.Series: VaR values for each asset (lower = less risky).
    """
    return var_historic_from_prices(prices, t=t, level=level)
