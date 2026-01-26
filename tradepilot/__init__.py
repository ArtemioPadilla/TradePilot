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
from .ranking import momentum_ranking, random_ranking
from .optimization import msr, gmv, eq_weighted
from .metrics import get_returns, annualize_returns, sharpe_ratio, max_drawdown, momentum
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
    # Optimization functions
    "msr",
    "gmv",
    "eq_weighted",
    # Metrics
    "get_returns",
    "annualize_returns",
    "sharpe_ratio",
    "max_drawdown",
    "momentum",
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
