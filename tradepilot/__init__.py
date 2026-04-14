# tradepilot/__init__.py
from .simulator import TPS
from .trader import TPT
from .backtest import Backtest
from .broker import (
    BrokerAPI,
    BrokerError,
    BrokerAuthenticationError,
    BrokerRateLimitError,
    BrokerServerError,
    BrokerValidationError,
)
from .ranking import momentum_ranking, random_ranking, var_ranking
from .optimization import msr, gmv, eq_weighted, minimize_vol, optimal_weights
from .metrics import (
    get_returns, annualize_returns, annualize_vol, annualize_semideviation,
    sharpe_ratio, max_drawdown, momentum,
    skewness, kurtosis,
    var_historic, var_historic_from_prices, var_gaussian, cvar_historic,
    sortino_ratio, get_compounded_return, get_drawdown, get_volatility,
    portfolio_return, portfolio_vol, get_alpha, semideviation,
)
from .portfolios import eval_portfolio, get_strategies_comparisons
from .data import MarketData, OpenData, DataError, DataNotFoundError, DataValidationError
from .config import API_KEYS, validate_config, is_configured
from .logging import log_trade

__all__ = [
    # Core classes
    "TPS",
    "TPT",
    "Backtest",
    "BrokerAPI",
    "MarketData",
    "OpenData",
    # Ranking strategies
    "momentum_ranking",
    "random_ranking",
    "var_ranking",
    # Optimization functions
    "msr",
    "gmv",
    "eq_weighted",
    "minimize_vol",
    "optimal_weights",
    # Metrics
    "get_returns",
    "annualize_returns",
    "annualize_vol",
    "annualize_semideviation",
    "sharpe_ratio",
    "sortino_ratio",
    "max_drawdown",
    "momentum",
    "skewness",
    "kurtosis",
    "var_historic",
    "var_historic_from_prices",
    "var_gaussian",
    "cvar_historic",
    "get_compounded_return",
    "get_drawdown",
    "get_volatility",
    "portfolio_return",
    "portfolio_vol",
    "get_alpha",
    "semideviation",
    # Portfolio evaluation
    "eval_portfolio",
    "get_strategies_comparisons",
    # Configuration
    "API_KEYS",
    "validate_config",
    "is_configured",
    # Error classes
    "BrokerError",
    "BrokerAuthenticationError",
    "BrokerRateLimitError",
    "BrokerServerError",
    "BrokerValidationError",
    "DataError",
    "DataNotFoundError",
    "DataValidationError",
    # Logging
    "log_trade",
]
