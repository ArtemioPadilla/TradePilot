"""
TradePilot API Bridge — connects the web app to the Python backtesting engine.

Run: uvicorn api.server:app --reload --port 8000
"""
import sys
import os

# Ensure tradepilot package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np
import yfinance as yf
from scipy.stats import norm
import scipy.stats
from scipy.optimize import minimize

from api.reports import REPORT_GENERATORS

from tradepilot.backtest import Backtest
from tradepilot.data import MarketData
from tradepilot.ranking import momentum_ranking

app = FastAPI(title="TradePilot API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Models ---

class BacktestRequest(BaseModel):
    universe: list[str]
    strategy: str = "momentum"
    start_date: str
    end_date: str
    initial_capital: float = 100000
    risk_free: float = 0.04
    optimization: str = "MSR"
    n_stocks: int = 5


class BacktestResponse(BaseModel):
    annual_return: float | None
    sharpe_ratio: float | None
    max_drawdown: float | None
    portfolio_values: dict[str, float]


class StrategyInfo(BaseModel):
    id: str
    name: str
    description: str
    type: str
    default_config: dict


class AssetInfo(BaseModel):
    symbol: str
    name: str


# --- Strategy helpers ---

def _momentum_strategy(prices: pd.DataFrame) -> list[str]:
    """Select stocks with highest 20-day momentum."""
    if len(prices) < 20:
        return prices.columns.tolist()
    returns_20d = (prices.iloc[-1] / prices.iloc[-20]) - 1
    return returns_20d.nlargest(len(prices.columns)).index.tolist()


def _mean_reversion_strategy(prices: pd.DataFrame) -> list[str]:
    """Select stocks trading below their 20-day moving average."""
    if len(prices) < 20:
        return prices.columns.tolist()
    ma20 = prices.rolling(20).mean().iloc[-1]
    current = prices.iloc[-1]
    below_ma = current[current < ma20]
    if below_ma.empty:
        return prices.columns.tolist()
    return below_ma.index.tolist()


def _equal_weight_strategy(prices: pd.DataFrame) -> list[str]:
    """Return all stocks."""
    return prices.columns.tolist()


STRATEGY_MAP = {
    "momentum": _momentum_strategy,
    "mean_reversion": _mean_reversion_strategy,
    "equal_weight": _equal_weight_strategy,
}


# --- Common assets ---

COMMON_ASSETS = [
    AssetInfo(symbol="AAPL", name="Apple Inc."),
    AssetInfo(symbol="GOOGL", name="Alphabet Inc."),
    AssetInfo(symbol="MSFT", name="Microsoft Corp."),
    AssetInfo(symbol="AMZN", name="Amazon.com Inc."),
    AssetInfo(symbol="META", name="Meta Platforms Inc."),
    AssetInfo(symbol="TSLA", name="Tesla Inc."),
    AssetInfo(symbol="NVDA", name="NVIDIA Corp."),
    AssetInfo(symbol="JPM", name="JPMorgan Chase & Co."),
    AssetInfo(symbol="V", name="Visa Inc."),
    AssetInfo(symbol="JNJ", name="Johnson & Johnson"),
    AssetInfo(symbol="WMT", name="Walmart Inc."),
    AssetInfo(symbol="PG", name="Procter & Gamble Co."),
    AssetInfo(symbol="MA", name="Mastercard Inc."),
    AssetInfo(symbol="UNH", name="UnitedHealth Group Inc."),
    AssetInfo(symbol="HD", name="Home Depot Inc."),
    AssetInfo(symbol="DIS", name="Walt Disney Co."),
    AssetInfo(symbol="BAC", name="Bank of America Corp."),
    AssetInfo(symbol="XOM", name="Exxon Mobil Corp."),
    AssetInfo(symbol="KO", name="Coca-Cola Co."),
    AssetInfo(symbol="PFE", name="Pfizer Inc."),
]

STRATEGIES = [
    StrategyInfo(
        id="momentum",
        name="Momentum",
        description="Select stocks with strongest recent price momentum",
        type="momentum",
        default_config={"n_stocks": 5, "optimization": "MSR"},
    ),
    StrategyInfo(
        id="mean_reversion",
        name="Mean Reversion",
        description="Select oversold stocks trading below moving average",
        type="mean_reversion",
        default_config={"n_stocks": 5, "optimization": "GMV"},
    ),
    StrategyInfo(
        id="equal_weight",
        name="Equal Weight",
        description="Equal allocation across all assets in universe",
        type="equal_weight",
        default_config={"n_stocks": 10, "optimization": "EW"},
    ),
]


# --- Endpoints ---

@app.post("/backtest", response_model=BacktestResponse)
async def run_backtest(req: BacktestRequest):
    """Run a backtest with the given parameters."""
    strategy_fn = STRATEGY_MAP.get(req.strategy)
    if not strategy_fn:
        raise HTTPException(status_code=400, detail=f"Unknown strategy: {req.strategy}")

    try:
        md = MarketData()
        prices = md.get_historical_data(req.universe, req.start_date, req.end_date)

        bt = Backtest(
            universe=prices,
            strategy=strategy_fn,
            initial_capital=req.initial_capital,
            risk_free=req.risk_free,
            opt_tech=req.optimization,
            n_stocks=min(req.n_stocks, len(req.universe)),
        )

        results = bt.run(req.start_date, req.end_date)
        metrics = bt.evaluate()

        # Convert portfolio values to {date_string: value} dict
        portfolio_values = {}
        if results is not None:
            for date, value in results.items():
                date_str = date.strftime("%Y-%m-%d") if hasattr(date, "strftime") else str(date)
                portfolio_values[date_str] = float(value) if np.isfinite(value) else None

        def safe_float(v):
            if v is None:
                return None
            v = float(v)
            return v if np.isfinite(v) else None

        return BacktestResponse(
            annual_return=safe_float(metrics.get("Annual Return")),
            sharpe_ratio=safe_float(metrics.get("Sharpe Ratio")),
            max_drawdown=safe_float(metrics.get("Max Drawdown")),
            portfolio_values=portfolio_values,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/strategies", response_model=list[StrategyInfo])
async def list_strategies():
    """List available backtesting strategies."""
    return STRATEGIES


@app.get("/assets", response_model=list[AssetInfo])
async def search_assets(q: str = ""):
    """Search or list tradeable assets."""
    if not q:
        return COMMON_ASSETS
    q_lower = q.lower()
    return [a for a in COMMON_ASSETS if q_lower in a.symbol.lower() or q_lower in a.name.lower()]


class ReportRequest(BaseModel):
    report_type: str  # portfolio_summary, performance, holdings_detail
    date_range: dict | None = None
    account_ids: list[str] | None = None


@app.post("/api/reports/generate")
async def generate_report(req: ReportRequest):
    """Generate a PDF report and return it as a downloadable file."""
    generator = REPORT_GENERATORS.get(req.report_type)
    if not generator:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown report type: {req.report_type}. "
                   f"Available: {', '.join(REPORT_GENERATORS.keys())}",
        )

    try:
        pdf_bytes = generator(date_range=req.date_range)
        filename = f"tradepilot_{req.report_type}_{pd.Timestamp.now().strftime('%Y%m%d')}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Analytics Dashboard Models ---


class EfficientFrontierRequest(BaseModel):
    symbols: list[str]
    start_date: str
    end_date: str
    risk_free: float = 0.04
    n_points: int = Field(default=50, ge=5, le=500)


class PortfolioPoint(BaseModel):
    volatility: float
    return_: float
    weights: dict[str, float] | None = None


class EfficientFrontierResponse(BaseModel):
    frontier: list[dict[str, float]]
    msr: PortfolioPoint
    gmv: PortfolioPoint
    ew: PortfolioPoint


class RiskMetricsRequest(BaseModel):
    symbols: list[str]
    start_date: str
    end_date: str
    risk_free: float = 0.04


class SymbolRiskMetrics(BaseModel):
    var_historic: float
    var_gaussian: float
    var_cf: float
    cvar: float
    sharpe: float
    sortino: float
    volatility: float
    max_drawdown: float
    skewness: float
    kurtosis: float
    annualized_return: float


class RiskMetricsResponse(BaseModel):
    symbols: dict[str, SymbolRiskMetrics]


class StrategyComparisonItem(BaseModel):
    name: str
    symbols: list[str]
    start_date: str
    end_date: str
    optimization: str = "MSR"
    risk_free: float = 0.04


class StrategyComparisonRequest(BaseModel):
    strategies: list[StrategyComparisonItem]


class StrategyResult(BaseModel):
    name: str
    annualized_return: float
    sharpe: float
    sortino: float
    max_drawdown: float
    var_historic: float
    cvar: float
    alpha: float
    volatility: float


class StrategyComparisonResponse(BaseModel):
    strategies: list[StrategyResult]


class BenchmarkResponse(BaseModel):
    symbol: str
    dates: list[str]
    prices: list[float]


# --- Analytics helper functions ---


def _fetch_prices(symbols: list[str], start_date: str, end_date: str) -> pd.DataFrame:
    """Fetch closing prices for a list of symbols via yfinance."""
    prices = pd.DataFrame()
    for s in symbols:
        try:
            ticker = yf.Ticker(s)
            hist = ticker.history(start=start_date, end=end_date)
            if not hist.empty and "Close" in hist.columns:
                prices[s] = hist["Close"]
        except Exception:
            continue
    if prices.empty:
        raise HTTPException(status_code=400, detail="No price data found for the given symbols/dates")
    prices.index = pd.to_datetime(prices.index)
    if prices.index.tz is not None:
        prices.index = prices.index.tz_localize(None)
    return prices.dropna()


def _annualize_returns(returns: pd.Series | pd.DataFrame, periods_per_year: int = 252):
    """Annualize a returns series."""
    compounded = (1 + returns).prod()
    n_periods = returns.shape[0]
    if n_periods == 0:
        return compounded * 0
    return compounded ** (periods_per_year / n_periods) - 1


def _annualize_vol(returns: pd.Series | pd.DataFrame, periods_per_year: int = 252):
    """Annualize volatility."""
    return returns.std() * np.sqrt(periods_per_year)


def _portfolio_return(weights: np.ndarray, er: np.ndarray | pd.Series) -> float:
    return float(weights.T @ er)


def _portfolio_vol(weights: np.ndarray, cov: np.ndarray | pd.DataFrame) -> float:
    return float((weights.T @ cov @ weights) ** 0.5)


def _msr_weights(risk_free_rate: float, er: pd.Series, cov: pd.DataFrame) -> np.ndarray:
    """Compute Maximum Sharpe Ratio portfolio weights."""
    n = er.shape[0]
    init_guess = np.repeat(1 / n, n)
    bounds = ((0.01, 0.95),) * n
    weights_sum_to_1 = {"type": "eq", "fun": lambda w: np.sum(w) - 1}

    def neg_sharpe(w, rf, er_, cov_):
        r = w.T @ er_
        vol = (w.T @ cov_ @ w) ** 0.5
        return -(r - rf) / vol

    result = minimize(
        neg_sharpe, init_guess, args=(risk_free_rate, er, cov),
        method="SLSQP", options={"disp": False},
        constraints=(weights_sum_to_1,), bounds=bounds,
    )
    w = result.x
    return w / w.sum()


def _gmv_weights(cov: pd.DataFrame) -> np.ndarray:
    """Compute Global Minimum Variance portfolio weights."""
    n = cov.shape[0]
    return _msr_weights(0, pd.Series(np.repeat(1, n)), cov)


def _minimize_vol(target_return: float, er: pd.Series, cov: pd.DataFrame) -> np.ndarray:
    """Find weights that minimize volatility for a target return."""
    n = er.shape[0]
    init_guess = np.repeat(1 / n, n)
    bounds = ((0.0, 1.0),) * n
    constraints = [
        {"type": "eq", "fun": lambda w: np.sum(w) - 1},
        {"type": "eq", "args": (er,), "fun": lambda w, er_: target_return - w.T @ er_},
    ]
    result = minimize(
        _portfolio_vol, init_guess, args=(cov,),
        method="SLSQP", options={"disp": False},
        constraints=constraints, bounds=bounds,
    )
    return result.x


def _var_historic(returns: pd.Series, level: int = 5) -> float:
    """Historic Value at Risk at the given percentile level."""
    return -float(np.percentile(returns, level))


def _var_gaussian(returns: pd.Series, level: int = 5, modified: bool = False) -> float:
    """Parametric Gaussian VaR, optionally with Cornish-Fisher correction."""
    z = norm.ppf(level / 100)
    if modified:
        s = scipy.stats.skew(returns)
        k = scipy.stats.kurtosis(returns) + 3  # excess kurtosis -> raw
        z = (
            z
            + (z ** 2 - 1) * s / 6
            + (z ** 3 - 3 * z) * (k - 3) / 24
            - (2 * z ** 3 - 5 * z) * (s ** 2) / 36
        )
    return -float(returns.mean() + z * returns.std(ddof=0))


def _cvar_historic(returns: pd.Series, level: int = 5) -> float:
    """Conditional VaR (Expected Shortfall) from historic data."""
    var = _var_historic(returns, level)
    return -float(returns[returns <= -var].mean())


def _max_drawdown(returns: pd.Series) -> float:
    """Maximum drawdown from a returns series."""
    cum = (1 + returns).cumprod()
    running_max = cum.cummax()
    drawdowns = (cum - running_max) / running_max
    return float(drawdowns.min())


def _semideviation(returns: pd.Series) -> float:
    """Downside deviation (std of negative returns)."""
    neg = returns[returns < 0]
    if len(neg) == 0:
        return 0.0
    return float(neg.std())


def _safe_float(val) -> float:
    """Convert to float, replacing NaN/Inf with 0."""
    v = float(val)
    return v if np.isfinite(v) else 0.0


# --- Analytics Dashboard Endpoints ---


@app.post("/api/efficient-frontier", response_model=EfficientFrontierResponse)
async def compute_efficient_frontier(req: EfficientFrontierRequest):
    """Compute the efficient frontier curve and special portfolios (MSR, GMV, EW)."""
    try:
        prices = _fetch_prices(req.symbols, req.start_date, req.end_date)
        returns = prices.pct_change().dropna()

        if returns.shape[0] < 2 or returns.shape[1] < 2:
            raise HTTPException(status_code=400, detail="Need at least 2 symbols with sufficient price history")

        er = _annualize_returns(returns)
        cov = returns.cov()
        symbols = returns.columns.tolist()

        # Frontier curve
        target_rs = np.linspace(er.min(), er.max(), req.n_points)
        frontier = []
        for target in target_rs:
            w = _minimize_vol(target, er, cov)
            vol = _portfolio_vol(w, cov) * np.sqrt(252)
            ret = _portfolio_return(w, er)
            frontier.append({"volatility": _safe_float(vol), "return_": _safe_float(ret)})

        # MSR portfolio
        w_msr = _msr_weights(req.risk_free, er, cov)
        msr_point = PortfolioPoint(
            volatility=_safe_float(_portfolio_vol(w_msr, cov) * np.sqrt(252)),
            return_=_safe_float(_portfolio_return(w_msr, er)),
            weights={s: _safe_float(w_msr[i]) for i, s in enumerate(symbols)},
        )

        # GMV portfolio
        w_gmv = _gmv_weights(cov)
        gmv_point = PortfolioPoint(
            volatility=_safe_float(_portfolio_vol(w_gmv, cov) * np.sqrt(252)),
            return_=_safe_float(_portfolio_return(w_gmv, er)),
            weights={s: _safe_float(w_gmv[i]) for i, s in enumerate(symbols)},
        )

        # EW portfolio
        n = len(symbols)
        w_ew = np.repeat(1 / n, n)
        ew_point = PortfolioPoint(
            volatility=_safe_float(_portfolio_vol(w_ew, cov) * np.sqrt(252)),
            return_=_safe_float(_portfolio_return(w_ew, er)),
            weights={s: _safe_float(w_ew[i]) for i, s in enumerate(symbols)},
        )

        return EfficientFrontierResponse(frontier=frontier, msr=msr_point, gmv=gmv_point, ew=ew_point)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/risk-metrics", response_model=RiskMetricsResponse)
async def compute_risk_metrics(req: RiskMetricsRequest):
    """Compute per-symbol risk metrics: VaR, CVaR, Sharpe, Sortino, drawdown, etc."""
    try:
        prices = _fetch_prices(req.symbols, req.start_date, req.end_date)
        returns = prices.pct_change().dropna()

        result: dict[str, SymbolRiskMetrics] = {}

        for symbol in returns.columns:
            r = returns[symbol]
            ann_ret = _safe_float(_annualize_returns(r))
            ann_vol = _safe_float(_annualize_vol(r))
            semi_vol = _safe_float(_semideviation(r) * np.sqrt(252))

            # Risk-adjusted per-period rate
            rf_per_period = (1 + req.risk_free) ** (1 / 252) - 1
            excess = r - rf_per_period
            ann_excess_ret = _safe_float(_annualize_returns(excess))

            sharpe = _safe_float(ann_excess_ret / ann_vol) if ann_vol != 0 else 0.0
            sortino = _safe_float(ann_excess_ret / semi_vol) if semi_vol != 0 else 0.0

            result[symbol] = SymbolRiskMetrics(
                var_historic=_safe_float(_var_historic(r)),
                var_gaussian=_safe_float(_var_gaussian(r, modified=False)),
                var_cf=_safe_float(_var_gaussian(r, modified=True)),
                cvar=_safe_float(_cvar_historic(r)),
                sharpe=sharpe,
                sortino=sortino,
                volatility=ann_vol,
                max_drawdown=_safe_float(_max_drawdown(r)),
                skewness=_safe_float(scipy.stats.skew(r)),
                kurtosis=_safe_float(scipy.stats.kurtosis(r)),
                annualized_return=ann_ret,
            )

        return RiskMetricsResponse(symbols=result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/strategy-comparison", response_model=StrategyComparisonResponse)
async def compare_strategies(req: StrategyComparisonRequest):
    """Run a lightweight backtest for each strategy and return comparison metrics."""
    try:
        results: list[StrategyResult] = []

        for strategy in req.strategies:
            prices = _fetch_prices(strategy.symbols, strategy.start_date, strategy.end_date)
            returns = prices.pct_change().dropna()

            if returns.empty or returns.shape[1] < 1:
                continue

            er = _annualize_returns(returns)
            cov = returns.cov()
            n = returns.shape[1]

            # Determine portfolio weights based on optimization method
            opt = strategy.optimization.upper()
            if opt == "MSR" and n >= 2:
                w = _msr_weights(strategy.risk_free, er, cov)
            elif opt == "GMV" and n >= 2:
                w = _gmv_weights(cov)
            else:  # EW or fallback
                w = np.repeat(1 / n, n)

            # Compute portfolio returns series
            port_returns = returns @ w

            ann_ret = _safe_float(_annualize_returns(port_returns))
            ann_vol = _safe_float(_annualize_vol(port_returns))
            semi_vol = _safe_float(_semideviation(port_returns) * np.sqrt(252))

            rf_per_period = (1 + strategy.risk_free) ** (1 / 252) - 1
            excess = port_returns - rf_per_period
            ann_excess = _safe_float(_annualize_returns(excess))

            sharpe = _safe_float(ann_excess / ann_vol) if ann_vol != 0 else 0.0
            sortino = _safe_float(ann_excess / semi_vol) if semi_vol != 0 else 0.0
            alpha = _safe_float(ann_ret - strategy.risk_free)

            results.append(StrategyResult(
                name=strategy.name,
                annualized_return=ann_ret,
                sharpe=sharpe,
                sortino=sortino,
                max_drawdown=_safe_float(_max_drawdown(port_returns)),
                var_historic=_safe_float(_var_historic(port_returns)),
                cvar=_safe_float(_cvar_historic(port_returns)),
                alpha=alpha,
                volatility=ann_vol,
            ))

        return StrategyComparisonResponse(strategies=results)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/benchmark/{symbol}", response_model=BenchmarkResponse)
async def get_benchmark(
    symbol: str,
    start_date: str = Query(default="2023-01-01"),
    end_date: str = Query(default="2024-01-01"),
):
    """Return price history for a benchmark symbol (e.g. SPY)."""
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(start=start_date, end=end_date)

        if hist.empty or "Close" not in hist.columns:
            raise HTTPException(status_code=404, detail=f"No data found for benchmark symbol {symbol}")

        hist.index = pd.to_datetime(hist.index)
        if hist.index.tz is not None:
            hist.index = hist.index.tz_localize(None)

        dates = [d.strftime("%Y-%m-%d") for d in hist.index]
        prices = [_safe_float(p) for p in hist["Close"].tolist()]

        return BenchmarkResponse(symbol=symbol, dates=dates, prices=prices)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.server:app", host="0.0.0.0", port=8000, reload=True)
