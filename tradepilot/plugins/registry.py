"""Plugin registry with auto-discovery for TradePilot extensions.

The registry provides a central place to register and retrieve plugin
implementations for brokers, data providers, strategies, and risk models.

A module-level singleton ``_registry`` is used internally. Public functions
(``register_broker``, ``get_broker``, ``list_brokers``, etc.) delegate to
this singleton so callers never need to manage the instance directly.

Auto-discovery scans the ``tradepilot/plugins/{brokers,providers,strategies,
risk_models}/`` subdirectories on first access, importing any Python modules
found there so they can self-register.
"""

import importlib
import logging
import pkgutil
from pathlib import Path

from .base_broker import BrokerAdapter
from .base_provider import DataProvider
from .base_risk import RiskModel
from .base_strategy import StrategyBase

logger = logging.getLogger(__name__)


class PluginRegistry:
    """Central registry that maps plugin names to their implementation classes.

    Plugins are organized into four categories:

    * **brokers** -- ``BrokerAdapter`` subclasses
    * **providers** -- ``DataProvider`` subclasses
    * **strategies** -- ``StrategyBase`` subclasses (or any callable with a ``rank`` method)
    * **risk_models** -- ``RiskModel`` subclasses

    Discovery is lazy: the first call to any ``get_*`` or ``list_*`` method
    triggers :meth:`discover_plugins` if it has not already run.
    """

    def __init__(self) -> None:
        self._brokers: dict[str, type] = {}
        self._providers: dict[str, type] = {}
        self._strategies: dict[str, type] = {}
        self._risk_models: dict[str, type] = {}
        self._discovered = False

    # ------------------------------------------------------------------
    # Registration
    # ------------------------------------------------------------------

    def register_broker(self, name: str, adapter_class: type) -> None:
        """Register a broker adapter class under the given name.

        Args:
            name: Unique identifier for this broker (e.g. ``"alpaca"``).
            adapter_class: A class that extends :class:`BrokerAdapter`.

        Raises:
            TypeError: If *adapter_class* is not a subclass of ``BrokerAdapter``.
        """
        if not (isinstance(adapter_class, type) and issubclass(adapter_class, BrokerAdapter)):
            raise TypeError(
                f"Broker adapter must be a subclass of BrokerAdapter, "
                f"got {adapter_class!r}"
            )
        self._brokers[name] = adapter_class
        logger.info("Registered broker plugin: %s", name)

    def register_provider(self, name: str, provider_class: type) -> None:
        """Register a data provider class under the given name.

        Args:
            name: Unique identifier for this provider (e.g. ``"yfinance"``).
            provider_class: A class that extends :class:`DataProvider`.

        Raises:
            TypeError: If *provider_class* is not a subclass of ``DataProvider``.
        """
        if not (isinstance(provider_class, type) and issubclass(provider_class, DataProvider)):
            raise TypeError(
                f"Data provider must be a subclass of DataProvider, "
                f"got {provider_class!r}"
            )
        self._providers[name] = provider_class
        logger.info("Registered provider plugin: %s", name)

    def register_strategy(self, name: str, strategy_class: type) -> None:
        """Register a strategy class under the given name.

        The class must either be a subclass of :class:`StrategyBase` or be
        a callable type that has a ``rank`` method.

        Args:
            name: Unique identifier for this strategy (e.g. ``"momentum"``).
            strategy_class: A class that extends ``StrategyBase`` or has a
                ``rank`` method.

        Raises:
            TypeError: If *strategy_class* does not satisfy the requirements.
        """
        is_strategy_subclass = isinstance(strategy_class, type) and issubclass(
            strategy_class, StrategyBase
        )
        has_rank_method = callable(strategy_class) and hasattr(strategy_class, "rank")

        if not (is_strategy_subclass or has_rank_method):
            raise TypeError(
                f"Strategy must be a subclass of StrategyBase or a callable "
                f"with a 'rank' method, got {strategy_class!r}"
            )
        self._strategies[name] = strategy_class
        logger.info("Registered strategy plugin: %s", name)

    def register_risk_model(self, name: str, model_class: type) -> None:
        """Register a risk model class under the given name.

        Args:
            name: Unique identifier for this risk model (e.g. ``"historical"``).
            model_class: A class that extends :class:`RiskModel`.

        Raises:
            TypeError: If *model_class* is not a subclass of ``RiskModel``.
        """
        if not (isinstance(model_class, type) and issubclass(model_class, RiskModel)):
            raise TypeError(
                f"Risk model must be a subclass of RiskModel, "
                f"got {model_class!r}"
            )
        self._risk_models[name] = model_class
        logger.info("Registered risk model plugin: %s", name)

    # ------------------------------------------------------------------
    # Retrieval (lazy discovery on first access)
    # ------------------------------------------------------------------

    def _ensure_discovered(self) -> None:
        if not self._discovered:
            self.discover_plugins()

    def get_broker(self, name: str) -> type:
        """Return the broker adapter class registered under *name*.

        Raises:
            KeyError: If no broker is registered with that name.
        """
        self._ensure_discovered()
        try:
            return self._brokers[name]
        except KeyError:
            raise KeyError(
                f"No broker registered with name '{name}'. "
                f"Available: {list(self._brokers)}"
            ) from None

    def get_provider(self, name: str) -> type:
        """Return the data provider class registered under *name*.

        Raises:
            KeyError: If no provider is registered with that name.
        """
        self._ensure_discovered()
        try:
            return self._providers[name]
        except KeyError:
            raise KeyError(
                f"No provider registered with name '{name}'. "
                f"Available: {list(self._providers)}"
            ) from None

    def get_strategy(self, name: str) -> type:
        """Return the strategy class registered under *name*.

        Raises:
            KeyError: If no strategy is registered with that name.
        """
        self._ensure_discovered()
        try:
            return self._strategies[name]
        except KeyError:
            raise KeyError(
                f"No strategy registered with name '{name}'. "
                f"Available: {list(self._strategies)}"
            ) from None

    def get_risk_model(self, name: str) -> type:
        """Return the risk model class registered under *name*.

        Raises:
            KeyError: If no risk model is registered with that name.
        """
        self._ensure_discovered()
        try:
            return self._risk_models[name]
        except KeyError:
            raise KeyError(
                f"No risk model registered with name '{name}'. "
                f"Available: {list(self._risk_models)}"
            ) from None

    # ------------------------------------------------------------------
    # Listing
    # ------------------------------------------------------------------

    def list_brokers(self) -> list[str]:
        """Return a sorted list of all registered broker names."""
        self._ensure_discovered()
        return sorted(self._brokers)

    def list_providers(self) -> list[str]:
        """Return a sorted list of all registered provider names."""
        self._ensure_discovered()
        return sorted(self._providers)

    def list_strategies(self) -> list[str]:
        """Return a sorted list of all registered strategy names."""
        self._ensure_discovered()
        return sorted(self._strategies)

    def list_risk_models(self) -> list[str]:
        """Return a sorted list of all registered risk model names."""
        self._ensure_discovered()
        return sorted(self._risk_models)

    # ------------------------------------------------------------------
    # Auto-discovery
    # ------------------------------------------------------------------

    def discover_plugins(self) -> None:
        """Import all modules in the plugin subdirectories.

        Scans ``tradepilot/plugins/{brokers,providers,strategies,risk_models}/``
        and imports each Python module found. Modules are expected to
        self-register by calling the appropriate ``register_*`` function
        at import time.

        This method is idempotent: subsequent calls after the first are
        no-ops.
        """
        if self._discovered:
            return

        plugin_base = Path(__file__).parent
        subdirs = ["brokers", "providers", "strategies", "risk_models"]

        for subdir in subdirs:
            package_path = plugin_base / subdir
            package_name = f"tradepilot.plugins.{subdir}"

            if not package_path.is_dir():
                logger.debug("Plugin directory does not exist: %s", package_path)
                continue

            for importer, module_name, is_pkg in pkgutil.iter_modules([str(package_path)]):
                full_module_name = f"{package_name}.{module_name}"
                try:
                    importlib.import_module(full_module_name)
                    logger.debug("Discovered plugin module: %s", full_module_name)
                except Exception:
                    logger.exception(
                        "Failed to import plugin module: %s", full_module_name
                    )

        self._discovered = True
        logger.info(
            "Plugin discovery complete: %d brokers, %d providers, "
            "%d strategies, %d risk models",
            len(self._brokers),
            len(self._providers),
            len(self._strategies),
            len(self._risk_models),
        )


# ------------------------------------------------------------------
# Module-level singleton and convenience functions
# ------------------------------------------------------------------

_registry = PluginRegistry()


def register_broker(name: str, adapter_class: type) -> None:
    """Register a broker adapter class. See :meth:`PluginRegistry.register_broker`."""
    _registry.register_broker(name, adapter_class)


def register_provider(name: str, provider_class: type) -> None:
    """Register a data provider class. See :meth:`PluginRegistry.register_provider`."""
    _registry.register_provider(name, provider_class)


def register_strategy(name: str, strategy_class: type) -> None:
    """Register a strategy class. See :meth:`PluginRegistry.register_strategy`."""
    _registry.register_strategy(name, strategy_class)


def register_risk_model(name: str, model_class: type) -> None:
    """Register a risk model class. See :meth:`PluginRegistry.register_risk_model`."""
    _registry.register_risk_model(name, model_class)


def get_broker(name: str) -> type:
    """Retrieve a registered broker adapter class by name."""
    return _registry.get_broker(name)


def get_provider(name: str) -> type:
    """Retrieve a registered data provider class by name."""
    return _registry.get_provider(name)


def get_strategy(name: str) -> type:
    """Retrieve a registered strategy class by name."""
    return _registry.get_strategy(name)


def get_risk_model(name: str) -> type:
    """Retrieve a registered risk model class by name."""
    return _registry.get_risk_model(name)


def list_brokers() -> list[str]:
    """List all registered broker names."""
    return _registry.list_brokers()


def list_providers() -> list[str]:
    """List all registered provider names."""
    return _registry.list_providers()


def list_strategies() -> list[str]:
    """List all registered strategy names."""
    return _registry.list_strategies()


def list_risk_models() -> list[str]:
    """List all registered risk model names."""
    return _registry.list_risk_models()


def discover_plugins() -> None:
    """Trigger plugin discovery manually. See :meth:`PluginRegistry.discover_plugins`."""
    _registry.discover_plugins()
