"""
TradePilot API Bridge — connects the web app to the Python backtesting engine.

Run: uvicorn api.server:app --reload --port 8000
"""
import sys
import os

# Ensure tradepilot package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import pandas as pd
import numpy as np

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.server:app", host="0.0.0.0", port=8000, reload=True)
