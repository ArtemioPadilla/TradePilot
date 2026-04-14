# tradepilot/ranking.py
import numpy as np
import pandas as pd
from tradepilot.metrics import momentum

def momentum_ranking(prices, t=10):
    """
    Calculates the momentum of each asset as the difference between
    the latest price and the price t periods ago.

    Parameters:
        prices (pd.DataFrame): Historical price data (datetime index, asset symbols as columns).
        t (int): Number of periods to calculate momentum.

    Returns:
        pd.Index: Asset symbols ordered from highest to lowest momentum.
    """
    if len(prices) < t:
        raise ValueError("Not enough data to calculate momentum.")
    m = momentum(prices, t)
    # Return momentum values as a Series (simulator handles sorting)
    return m

def random_ranking(prices, seed = None):
    """
    Random ranking function for testing purposes.

    Parameters:
        prices (pd.DataFrame): Historical price data.

    Returns:
        pd.Index: Randomly ordered asset symbols.
    """
    
    if seed is not None:
        np.random.seed(seed)
    return prices.apply(lambda _: np.random.random())
