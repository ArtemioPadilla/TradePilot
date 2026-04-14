# tradepilot/metrics.py
import numpy as np
import pandas as pd
import scipy.stats
from scipy.stats import norm


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


def annualize_vol(returns, periods_in_year: int = 252):
    """
    Annualizes volatility (standard deviation of returns).

    Parameters:
        returns (pd.Series or pd.DataFrame): Return data.
        periods_in_year (int): Number of periods per year.

    Returns:
        float or pd.Series: Annualized volatility.
    """
    volatility = returns.std()
    return volatility * np.sqrt(periods_in_year)


def semideviation(returns):
    """
    Computes the semideviation (downside deviation) of returns.

    Parameters:
        returns (pd.Series or pd.DataFrame): Return data.

    Returns:
        float or pd.Series: Semideviation.
    """
    negative_returns = returns[returns < 0]
    return negative_returns.std()


def annualize_semideviation(returns, periods_in_year: int = 252):
    """
    Annualizes the semideviation.

    Parameters:
        returns (pd.Series or pd.DataFrame): Return data.
        periods_in_year (int): Number of periods per year.

    Returns:
        float or pd.Series: Annualized semideviation.
    """
    volatility = semideviation(returns)
    return volatility * np.sqrt(periods_in_year)


def skewness(r):
    """
    Computes the skewness of the supplied Series or DataFrame.
    Alternative to scipy.stats.skew().

    Parameters:
        r (pd.Series or pd.DataFrame): Return data.

    Returns:
        float or pd.Series: Skewness value(s).
    """
    demeaned_r = r - r.mean()
    sigma_r = r.std()
    exp = (demeaned_r**3).mean()
    return exp / sigma_r**3


def kurtosis(r):
    """
    Computes the kurtosis of the supplied Series or DataFrame.
    Alternative to scipy.stats.kurtosis(). Returns raw kurtosis (not excess).

    Parameters:
        r (pd.Series or pd.DataFrame): Return data.

    Returns:
        float or pd.Series: Kurtosis value(s).
    """
    demeaned_r = r - r.mean()
    sigma_r = r.std()
    exp = (demeaned_r**4).mean()
    return exp / sigma_r**4


def var_historic(r, t=0, level=5):
    """
    Returns the historic Value at Risk at a specified level.
    Returns the number such that ``level`` percent of the returns
    fall below that number, and (100-level) percent are above.

    Parameters:
        r (pd.Series or pd.DataFrame): Return data.
        t (int): Number of periods in the past to consider (0 = all).
        level (int): Percentile level (default 5).

    Returns:
        float or pd.Series: Historic VaR (positive number).
    """
    if isinstance(r, pd.DataFrame):
        return r.aggregate(var_historic, t=t, level=level)
    elif isinstance(r, pd.Series):
        data = r.iloc[-t:] if t > 0 else r
        return -np.percentile(data, level)
    else:
        raise TypeError("Expected r to be a Series or DataFrame")


def var_historic_from_prices(p, t=0, level=5):
    """
    Returns the historic Value at Risk from prices at a specified level.
    Converts prices to returns first, then computes VaR.

    Parameters:
        p (pd.Series or pd.DataFrame): Price data.
        t (int): Number of periods in the past to consider (0 = all).
        level (int): Percentile level (default 5).

    Returns:
        float or pd.Series: Historic VaR from prices.
    """
    if isinstance(p, pd.DataFrame):
        r = get_returns(p)
        return r.aggregate(var_historic, t=t, level=level)
    elif isinstance(p, pd.Series):
        r = get_returns(p)
        data = r.iloc[-t:] if t > 0 else r
        return -np.percentile(data, level)
    else:
        raise TypeError("Expected p to be a Series or DataFrame")


def var_gaussian(r, level=5, modified=False):
    """
    Returns the Parametric Gaussian VaR of a Series or DataFrame.
    If ``modified`` is True, returns the Cornish-Fisher modified VaR
    using observed skewness and kurtosis.

    Parameters:
        r (pd.Series or pd.DataFrame): Return data.
        level (int): Percentile level (default 5).
        modified (bool): If True, apply Cornish-Fisher modification.

    Returns:
        float or pd.Series: Parametric Gaussian VaR.
    """
    z = norm.ppf(level / 100)
    if modified:
        s = scipy.stats.skew(r)
        k = scipy.stats.kurtosis(r) + 3
        z = (z +
             (z**2 - 1) * s / 6 +
             (z**3 - 3 * z) * (k - 3) / 24 -
             (2 * z**3 - 5 * z) * (s**2) / 36)
    return -(r.mean() + z * r.std(ddof=0))


def cvar_historic(r, t=0, level=5):
    """
    Computes the Conditional VaR (Expected Shortfall) of a Series or DataFrame.

    Parameters:
        r (pd.Series or pd.DataFrame): Return data.
        t (int): Number of periods in the past to consider (0 = all).
        level (int): Percentile level (default 5).

    Returns:
        float or pd.Series: Conditional VaR (positive number).
    """
    if isinstance(r, pd.Series):
        is_beyond = r <= -var_historic(r, t=t, level=level)
        return -r[is_beyond].mean()
    elif isinstance(r, pd.DataFrame):
        return r.aggregate(cvar_historic, t=t, level=level)
    else:
        raise TypeError("Expected r to be a Series or DataFrame")


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
    ann_vol = annualize_vol(returns, periods_per_year)
    return ann_return / ann_vol


def sortino_ratio(r, riskfree_rate, periods_per_year=252):
    """
    Computes the annualized Sortino ratio of a set of returns.

    Parameters:
        r (pd.Series or pd.DataFrame): Return data.
        riskfree_rate (float): Annual risk-free rate.
        periods_per_year (int): Number of periods per year.

    Returns:
        float or pd.Series: Sortino ratio.
    """
    rf_per_period = (1 + riskfree_rate)**(1/periods_per_year) - 1
    excess_ret = r - rf_per_period
    ann_ex_ret = annualize_returns(excess_ret, periods_per_year)
    ann_vol = annualize_semideviation(r, periods_per_year)
    return ann_ex_ret / ann_vol


def get_compounded_return(returns):
    """
    Computes the compounded return over a series of returns.

    Parameters:
        returns (pd.Series or pd.DataFrame): Return data.

    Returns:
        float or pd.Series: Compounded return centered around 0.
    """
    return (returns + 1).prod() - 1


def get_drawdown(prices):
    """
    Computes the drawdown series from prices.

    Parameters:
        prices (pd.Series or pd.DataFrame): Price data.

    Returns:
        pd.Series or pd.DataFrame: Drawdown series (negative values).
    """
    return (prices - prices.cummax()) / prices.cummax()


def max_drawdown(prices):
    """
    Calculates the maximum drawdown from a series of portfolio values.

    Parameters:
        prices (pd.Series): Portfolio values over time.

    Returns:
        float: Maximum drawdown.
    """
    return get_drawdown(prices).min()


def get_volatility(returns):
    """
    Computes the volatility (standard deviation) of returns.

    Parameters:
        returns (pd.Series or pd.DataFrame): Return data.

    Returns:
        float or pd.Series: Volatility.
    """
    return returns.std()


def portfolio_return(weights, returns):
    """
    Computes the return on a portfolio from constituent returns and weights.

    Parameters:
        weights (np.array): Portfolio weights.
        returns (np.array or pd.Series): Constituent returns.

    Returns:
        float: Portfolio return.
    """
    return weights.T @ returns


def portfolio_vol(weights, covmat):
    """
    Computes the volatility of a portfolio from a covariance matrix
    and constituent weights.

    Parameters:
        weights (np.array): Portfolio weights (N x 1).
        covmat (np.array or pd.DataFrame): Covariance matrix (N x N).

    Returns:
        float: Portfolio volatility.
    """
    return (weights.T @ covmat @ weights)**0.5


def get_alpha(rp, rf):
    """
    Computes alpha as the excess return over the risk-free rate.

    Parameters:
        rp (float or pd.Series): Portfolio return(s).
        rf (float): Risk-free rate.

    Returns:
        float or pd.Series: Alpha (excess return).
    """
    return rp - rf


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