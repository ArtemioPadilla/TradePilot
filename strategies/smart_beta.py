def smart_beta_strategy(prices):
    return prices.pct_change().mean() / prices.std()
