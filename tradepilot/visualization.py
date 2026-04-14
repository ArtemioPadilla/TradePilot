# tradepilot/visualization.py
"""
Plotly-based visualization module for TradePilot.

All functions return plotly Figure objects. Plotly is imported locally
so the rest of the library can be used without it installed.
"""
import numpy as np
import pandas as pd


def _import_plotly():
    """Lazy-import plotly to keep it optional."""
    try:
        import plotly.express as px
        import plotly.graph_objects as go
        return px, go
    except ImportError:
        raise ImportError(
            "plotly is required for visualization. Install it with: pip install plotly"
        )


def plot_portfolio_valuation(valuation, benchmark=None):
    """
    Line chart of portfolio valuation over time with optional S&P500 overlay.

    Parameters:
        valuation (pd.Series): Portfolio valuation series (datetime index).
        benchmark (pd.Series or pd.DataFrame, optional): Benchmark values
            to overlay (e.g. S&P500). If a DataFrame, expects a column named 'S&P 500'.

    Returns:
        plotly.graph_objects.Figure
    """
    px, go = _import_plotly()
    df = pd.DataFrame({"Portfolio": valuation})
    if benchmark is not None:
        if isinstance(benchmark, pd.DataFrame):
            col = benchmark.columns[0]
            df[col] = benchmark[col].reindex(valuation.index, method='ffill')
        else:
            df["Benchmark"] = benchmark.reindex(valuation.index, method='ffill')
    fig = px.line(df, title="Portfolio Valuation")
    fig.update_yaxes(title="Valuation [USD]")
    fig.update_xaxes(title="Date")
    return fig


def plot_efficient_frontier(er, cov, n_points=100, show_msr=False, show_gmv=False,
                            show_ew=False, riskfree_rate=0):
    """
    Plots the multi-asset efficient frontier with optional MSR, GMV, and EW portfolios.

    Parameters:
        er (pd.Series or np.array): Expected returns.
        cov (pd.DataFrame or np.array): Covariance matrix.
        n_points (int): Number of points on the frontier.
        show_msr (bool): Show the Maximum Sharpe Ratio portfolio.
        show_gmv (bool): Show the Global Minimum Variance portfolio.
        show_ew (bool): Show the Equally Weighted portfolio.
        riskfree_rate (float): Risk-free rate for MSR calculation.

    Returns:
        plotly.graph_objects.Figure
    """
    px, go = _import_plotly()
    from .optimization import optimal_weights, msr, gmv
    from .metrics import portfolio_return, portfolio_vol

    weights = optimal_weights(n_points, er, cov)
    rets = [portfolio_return(w, er) for w in weights]
    vols = [portfolio_vol(w, cov) for w in weights]
    ef = pd.DataFrame({"Returns": rets, "Volatility": vols})

    fig = go.Figure(data=px.line(ef, x="Volatility", y="Returns", markers=True))

    if show_msr:
        w_msr = msr(riskfree_rate, er, cov)
        r_msr = [portfolio_return(w_msr, er)]
        vol_msr = [portfolio_vol(w_msr, cov)]
        fig.add_trace(go.Scatter(
            x=vol_msr, y=r_msr,
            marker_color='rgba(255, 0, 0, 1)',
            name="MSR", marker_size=15,
            hovertemplate='<b>Volatility</b>: %{x:.4f}<br><b>Return</b>: %{y:.4f}<br>',
        ))

    if show_ew:
        n = er.shape[0]
        w_ew = np.repeat(1/n, n)
        r_ew = portfolio_return(w_ew, er)
        vol_ew = portfolio_vol(w_ew, cov)
        fig.add_trace(go.Scatter(
            x=[vol_ew], y=[r_ew],
            marker_color='rgba(255, 255, 0, 1)',
            name="EW", marker_size=15,
            hovertemplate='<b>Volatility</b>: %{x:.4f}<br><b>Return</b>: %{y:.4f}<br>',
        ))

    if show_gmv:
        w_gmv = gmv(cov)
        r_gmv = portfolio_return(w_gmv, er)
        vol_gmv = portfolio_vol(w_gmv, cov)
        fig.add_trace(go.Scatter(
            x=[vol_gmv], y=[r_gmv],
            marker_color='rgba(0, 255, 0, 1)',
            name="GMV", marker_size=15,
            hovertemplate='<b>Volatility</b>: %{x:.4f}<br><b>Return</b>: %{y:.4f}<br>',
        ))

    subtitle_parts = []
    if show_msr:
        subtitle_parts.append("MSR")
    if show_gmv:
        subtitle_parts.append("GMV")
    if show_ew:
        subtitle_parts.append("EW")

    title = "Efficient Frontier"
    if subtitle_parts:
        fig.update_layout(
            title=f"{title}<br><sup>{', '.join(subtitle_parts)} plotted</sup>",
            legend_title_text='Portfolio'
        )
    else:
        fig.update_layout(title=title)

    return fig


def plot_allocation_over_time(allocations, normalized=False):
    """
    Animated/stacked bar chart of portfolio composition over time.

    Parameters:
        allocations (pd.DataFrame): DataFrame with columns 'stock', 'value', 'date'.
        normalized (bool): If True, show percentages instead of absolute values.

    Returns:
        plotly.graph_objects.Figure
    """
    px, go = _import_plotly()
    df = allocations.copy()
    if normalized:
        for d in df["date"].unique():
            day_mask = df["date"] == d
            net_capital = df.loc[day_mask.values, "value"].sum()
            normalized_ws = (df.loc[day_mask.values, "value"] / net_capital).values
            df.loc[day_mask.values, "value"] = normalized_ws * 100

    fig = px.bar(df, x="stock", y="value", color="stock",
                 animation_frame="date", title="Portfolio Allocation Over Time")

    fig.update_xaxes(categoryorder='total descending')
    fig.update_traces(hovertemplate=None)
    max_val = 100 if normalized else df["value"].max() * 1.1
    fig.update_layout(
        yaxis={'showline': True, 'visible': True, 'range': (0, max_val)},
        xaxis_title='Stocks in portfolio'
    )
    if normalized:
        fig.update_layout(yaxis_title="Capital Allocated [%]")
    if fig.layout.updatemenus:
        fig.layout.updatemenus[0].buttons[0].args[1]["transition"]["duration"] = 0

    return fig


def plot_drawdown(prices):
    """
    Plots the drawdown chart from a price series.

    Parameters:
        prices (pd.Series or pd.DataFrame): Price data.

    Returns:
        plotly.graph_objects.Figure
    """
    px, go = _import_plotly()
    from .metrics import get_drawdown

    dd = get_drawdown(prices)
    if isinstance(dd, pd.Series):
        dd = dd.to_frame("Drawdown")
    fig = px.line(dd, title="Drawdown")
    fig.update_yaxes(title="Drawdown")
    fig.update_xaxes(title="Date")
    return fig


def plot_returns_distribution(returns, bins=50):
    """
    Histogram of returns with a normal distribution overlay.

    Parameters:
        returns (pd.Series): Return data.
        bins (int): Number of histogram bins.

    Returns:
        plotly.graph_objects.Figure
    """
    px, go = _import_plotly()
    from scipy.stats import norm

    fig = go.Figure()
    fig.add_trace(go.Histogram(
        x=returns, nbinsx=bins, name="Returns",
        histnorm='probability density', opacity=0.7
    ))

    # Normal overlay
    x_range = np.linspace(returns.min(), returns.max(), 200)
    mu, sigma = returns.mean(), returns.std()
    fig.add_trace(go.Scatter(
        x=x_range, y=norm.pdf(x_range, mu, sigma),
        mode='lines', name='Normal Distribution',
        line=dict(color='red', width=2)
    ))

    fig.update_layout(title="Returns Distribution", xaxis_title="Return", yaxis_title="Density")
    return fig


def plot_strategy_comparison(results_dict):
    """
    Compare multiple strategies side-by-side using their valuation series.

    Parameters:
        results_dict (dict): Dict mapping strategy names to valuation pd.Series.

    Returns:
        plotly.graph_objects.Figure
    """
    px, go = _import_plotly()
    df = pd.DataFrame(results_dict)
    fig = px.line(df, title="Strategy Comparison")
    fig.update_yaxes(title="Valuation [USD]")
    fig.update_xaxes(title="Date")
    return fig


def plot_momentum(prices, t=10):
    """
    Plots the momentum chart for assets.

    Parameters:
        prices (pd.DataFrame): Historical price data.
        t (int): Number of periods for momentum calculation.

    Returns:
        plotly.graph_objects.Figure
    """
    px, go = _import_plotly()
    momentum = prices - prices.shift(t)
    fig = px.line(momentum, title=f"Momentum (t={t})")
    fig.update_yaxes(title="Momentum")
    fig.update_xaxes(title="Date")
    return fig


def plot_risk_metrics(returns):
    """
    Bar chart visualizing VaR and CVaR for each asset.

    Parameters:
        returns (pd.Series or pd.DataFrame): Return data.

    Returns:
        plotly.graph_objects.Figure
    """
    px, go = _import_plotly()
    from .metrics import var_historic, cvar_historic, var_gaussian

    if isinstance(returns, pd.Series):
        returns = returns.to_frame(returns.name or "Asset")

    var_h = var_historic(returns)
    cvar_h = cvar_historic(returns)
    var_g = var_gaussian(returns)

    df = pd.DataFrame({
        "Historic VaR": var_h,
        "Conditional VaR": cvar_h,
        "Gaussian VaR": var_g,
    })

    fig = go.Figure()
    for col in df.columns:
        fig.add_trace(go.Bar(name=col, x=df.index.tolist(), y=df[col].values))
    fig.update_layout(
        barmode='group',
        title="Risk Metrics: VaR & CVaR",
        xaxis_title="Asset",
        yaxis_title="Value at Risk"
    )
    return fig
