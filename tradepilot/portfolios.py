from tradepilot.metrics import (
    get_returns, annualize_returns, annualize_vol, annualize_semideviation,
    sharpe_ratio, sortino_ratio, get_alpha, cvar_historic, skewness, kurtosis
)
import numpy as np
import pandas as pd


def eval_portfolio(p_returns, p_periods_per_year=52, risk_free=None, SP500_index=None):
    """
    Evaluates a portfolio's performance against benchmarks.

    Computes annualized returns, volatility, semideviation, Sharpe ratio,
    Sortino ratio, alpha, CVaR, skewness, and kurtosis for the portfolio
    and compares to S&P500 and risk-free rate benchmarks.

    Parameters:
        p_returns (pd.Series or pd.DataFrame): Portfolio return series.
        p_periods_per_year (int): Periods per year for annualization.
        risk_free (pd.DataFrame, pd.Series, float, or None): Risk-free rate data.
        SP500_index (pd.DataFrame or None): S&P500 index data.

    Returns:
        pd.DataFrame: Comparison table (metrics as rows, portfolio/benchmarks as columns).
    """
    start, end = p_returns.index[0], p_returns.index[-1]

    # Portfolio metrics
    p_r = annualize_returns(p_returns, p_periods_per_year)
    p_vol = annualize_vol(p_returns, p_periods_per_year)
    p_sdev = annualize_semideviation(p_returns, p_periods_per_year)

    # Risk-free benchmark
    if risk_free is not None:
        if isinstance(risk_free, pd.DataFrame) and "Risk Free Rate" in risk_free.columns:
            bm_rfr_r = np.mean(risk_free["Risk Free Rate"][start:end])
        elif isinstance(risk_free, pd.Series):
            bm_rfr_r = np.mean(risk_free[start:end])
        elif isinstance(risk_free, (int, float)):
            bm_rfr_r = risk_free
        else:
            bm_rfr_r = 0.0
    else:
        bm_rfr_r = 0.0
    bm_rfr_sdev = bm_rfr_vol = 0
    bm_rfr = "RFR Benchmark"

    # S&P500 benchmark
    if SP500_index is not None:
        b_returns = get_returns(SP500_index)["S&P 500"][start:end]
        b_r = annualize_returns(b_returns, 252)
        b_vol = annualize_vol(b_returns, 252)
        b_sdev = annualize_semideviation(b_returns, 252)
    else:
        b_r = 0.0
        b_vol = 0.0
        b_sdev = 0.0
    bmark = "S&P500 Benchmark"

    # Extended metrics for the portfolio
    p_alpha = float(get_alpha(p_r, bm_rfr_r))
    p_cvar = float(cvar_historic(p_returns))
    p_skew = float(skewness(p_returns)) if isinstance(p_returns, pd.Series) else 0.0
    p_kurt = float(kurtosis(p_returns)) if isinstance(p_returns, pd.Series) else 0.0

    # Sharpe and Sortino for portfolio
    try:
        p_sharpe = float(sharpe_ratio(p_returns, bm_rfr_r, p_periods_per_year))
    except (ZeroDivisionError, ValueError):
        p_sharpe = np.nan
    try:
        p_sortino = float(sortino_ratio(p_returns, bm_rfr_r, p_periods_per_year))
    except (ZeroDivisionError, ValueError):
        p_sortino = np.nan

    comparation = pd.DataFrame(
        {"Return": [p_r, b_r, bm_rfr_r,
                    p_r - b_r, p_r - bm_rfr_r],
         "Volatility": [p_vol, b_vol, bm_rfr_vol,
                        p_vol - b_vol, p_vol - bm_rfr_vol],
         "Semideviation": [p_sdev, b_sdev, bm_rfr_sdev,
                           p_sdev - b_sdev, p_sdev - bm_rfr_sdev],
         "Sharpe Ratio": [p_sharpe, np.nan, np.nan, np.nan, np.nan],
         "Sortino Ratio": [p_sortino, np.nan, np.nan, np.nan, np.nan],
         "Alpha": [p_alpha, np.nan, np.nan, np.nan, np.nan],
         "CVaR": [p_cvar, np.nan, np.nan, np.nan, np.nan],
         "Skewness": [p_skew, np.nan, np.nan, np.nan, np.nan],
         "Kurtosis": [p_kurt, np.nan, np.nan, np.nan, np.nan]},
        index=["Portfolio", bmark, bm_rfr, "Portfolio - S&P500", "Portfolio - RFR"])
    comparation.index.name = "Annual Avg"
    comparation.columns.name = f"Start date: {start.date()}.  End date: {end.date()}"
    return comparation.T


def get_strategies_comparisons(strategies_evaluations, rank_funcs, optimizations):
    """
    Compares multiple strategy evaluations side-by-side.

    Parameters:
        strategies_evaluations (list[pd.DataFrame]): List of eval_portfolio() results.
        rank_funcs (list[str]): Ranking function names for each strategy + benchmarks.
        optimizations (list[str]): Optimization technique names for each strategy + benchmarks.

    Returns:
        pd.DataFrame: Comparison table sorted by Sortino Ratio (descending).
    """
    df = pd.DataFrame()
    for idx, s in enumerate(strategies_evaluations):
        to_append = s["Portfolio"]
        to_append.name = "Portfolio " + str(idx + 1)
        df = pd.concat([df, to_append], axis=1)
    # Add benchmarks from the last strategy evaluation
    s = strategies_evaluations[-1]
    df = pd.concat([df, s["S&P500 Benchmark"], s["RFR Benchmark"]], axis=1)

    df.loc["Sharpe Ratio"] = df.loc["Return"] / df.loc["Volatility"]
    df.loc["Sortino Ratio"] = df.loc["Return"] / df.loc["Semideviation"]
    df.loc["Alpha"] = df.loc["Return"] - df.loc["Return", "RFR Benchmark"]
    df.columns.name = "Annualized Average"
    df.index.name = strategies_evaluations[0].index.name
    df = df.T

    df.loc[:, "Ranking Function"] = rank_funcs
    df.loc[:, "Optimization"] = optimizations
    df = df.loc[:, ["Ranking Function", "Optimization", "Return", "Alpha", "Volatility",
                     "Semideviation", "Sharpe Ratio", "Sortino Ratio"]]
    df.loc["RFR Benchmark", "Sortino Ratio"] = None
    df.loc["RFR Benchmark", "Sharpe Ratio"] = None
    df.loc[:, "Return Diff. with S&P500"] = df.loc[:, "Return"] - df.loc["S&P500 Benchmark", "Return"]
    df.loc[:, "Volatility Diff. with S&P500"] = df.loc[:, "Volatility"] - df.loc["S&P500 Benchmark", "Volatility"]
    df.loc[:, "Semideviation Diff. with S&P500"] = df.loc[:, "Semideviation"] - df.loc["S&P500 Benchmark", "Semideviation"]
    return df.sort_values("Sortino Ratio", ascending=False)
