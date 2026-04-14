"""TradePilot plugin system.

Provides abstract base classes for extensibility and a registry for
discovering and retrieving plugin implementations at runtime.

Base classes:
    - :class:`BrokerAdapter` -- broker integration
    - :class:`DataProvider` -- market data sources
    - :class:`StrategyBase` -- asset ranking strategies
    - :class:`RiskModel` -- risk assessment models

Registry functions:
    - ``register_broker``, ``get_broker``, ``list_brokers``
    - ``register_provider``, ``get_provider``, ``list_providers``
    - ``register_strategy``, ``get_strategy``, ``list_strategies``
    - ``register_risk_model``, ``get_risk_model``, ``list_risk_models``
    - ``discover_plugins`` -- auto-import from plugin subdirectories
"""

from .base_broker import BrokerAdapter
from .base_provider import DataProvider
from .base_risk import RiskModel
from .base_strategy import StrategyBase
from .registry import (
    discover_plugins,
    get_broker,
    get_provider,
    get_risk_model,
    get_strategy,
    list_brokers,
    list_providers,
    list_risk_models,
    list_strategies,
    register_broker,
    register_provider,
    register_risk_model,
    register_strategy,
)

__all__ = [
    # Base classes
    "BrokerAdapter",
    "DataProvider",
    "StrategyBase",
    "RiskModel",
    # Registration
    "register_broker",
    "register_provider",
    "register_strategy",
    "register_risk_model",
    # Retrieval
    "get_broker",
    "get_provider",
    "get_strategy",
    "get_risk_model",
    # Listing
    "list_brokers",
    "list_providers",
    "list_strategies",
    "list_risk_models",
    # Discovery
    "discover_plugins",
]
