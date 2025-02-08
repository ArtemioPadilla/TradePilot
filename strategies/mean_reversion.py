# strategies/mean_reversion.py
def mean_reversion_strategy(prices, t=20):
    """
    Mean Reversion strategy: calculates the difference between the current price
    and the t-period moving average, returning asset symbols ordered to identify potential oversold assets.

    Parameters:
        prices (pd.DataFrame): Historical price data.
        t (int): Window size for the moving average.

    Returns:
        pd.Index: Asset symbols ordered by the deviation (lowest first).
    """
    if len(prices) < t:
        raise ValueError("Not enough data to calculate mean reversion.")
    rolling_mean = prices.rolling(t).mean()
    deviation = prices.iloc[-1] - rolling_mean.iloc[-1]
    # Order ascending to identify assets below their moving average (potential oversold)
    return deviation.sort_values(ascending=True).index
