# tradepilot/metrics.py
import numpy as np
import pandas as pd

def get_returns(prices):
    """
    Calculates percentage returns from a price series or DataFrame.

    Parameters:
        prices (pd.Series or pd.DataFrame): Price data.

    Returns:
        pd.Series or pd.DataFrame: Returns computed from price changes.
    """
    return prices.pct_change().dropna()

def annualize_returns(returns, periods_per_year=252):
    """
    Annualizes compound returns.

    Parameters:
        returns (pd.Series or pd.DataFrame): Return data.
        periods_per_year (int): Number of periods per year.

    Returns:
        float or pd.Series: Annualized return.
    """
    compounded_growth = (1 + returns).prod()
    n_periods = len(returns)
    return compounded_growth**(periods_per_year/n_periods) - 1

def sharpe_ratio(returns, risk_free_rate, periods_per_year=252):
    """
    Calculates the annualized Sharpe ratio.

    Parameters:
        returns (pd.Series or pd.DataFrame): Return data.
        risk_free_rate (float): Annual risk-free rate.
        periods_per_year (int): Number of periods per year.

    Returns:
        float or pd.Series: Sharpe ratio.
    """
    rf_per_period = (1 + risk_free_rate)**(1/periods_per_year) - 1
    excess_returns = returns - rf_per_period
    ann_return = annualize_returns(excess_returns, periods_per_year)
    ann_vol = returns.std() * np.sqrt(periods_per_year)
    return ann_return / ann_vol

def max_drawdown(prices):
    """
    Calculates the maximum drawdown from a series of portfolio values.

    Parameters:
        prices (pd.Series): Portfolio values over time.

    Returns:
        float: Maximum drawdown.
    """
    cumulative_max = prices.cummax()
    drawdown = (prices - cumulative_max) / cumulative_max
    return drawdown.min()

def momentum(prices, t=10):
    """
    Calculates the momentum of each asset as the difference between
    the latest price and the price t periods ago.

    Parameters:
        prices (pd.DataFrame): Historical price data (datetime index, asset symbols as columns).
        t (int): Number of periods to calculate momentum.

    Returns:
        pd.DataFrame: Momentum values for each asset.
    """
    if len(prices) < t:
        raise ValueError("Not enough data to calculate momentum.")
    momentum = prices.iloc[-1] - prices.iloc[-t]
    return momentum