# strategies/momentum.py
def momentum_strategy(prices, t=10):
    """
    Momentum strategy: calculates the difference between the current price
    and the price t periods ago, and returns asset symbols ordered by highest momentum.

    Parameters:
        prices (pd.DataFrame): Historical price data.
        t (int): Number of periods to use for momentum calculation.

    Returns:
        pd.Index: Asset symbols ordered from highest to lowest momentum.
    """
    if len(prices) < t:
        raise ValueError("Not enough data to calculate momentum.")
    momentum = prices.iloc[-1] - prices.iloc[-t]
    return momentum.sort_values(ascending=False).index
