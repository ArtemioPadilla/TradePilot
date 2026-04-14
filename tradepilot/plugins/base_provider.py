"""Abstract base class for market data providers.

Data providers supply historical and real-time market data to TradePilot's
backtesting and trading engines. Each provider wraps a specific data source
(e.g. Yahoo Finance, Alpha Vantage, Polygon) behind a uniform interface.

The interface mirrors the existing MarketData class patterns
(get_historical_data, get_live_price) while adding multi-symbol lookups
and symbol search capabilities.
"""

from abc import ABC, abstractmethod

import pandas as pd


class DataProvider(ABC):
    """Abstract base class that all data provider plugins must implement.

    A DataProvider encapsulates access to a single market data source,
    providing historical OHLCV data, current prices, and symbol search.

    Example usage::

        class YFinanceProvider(DataProvider):
            def get_historical(self, symbol, start, end, interval="1d"):
                return yf.download(symbol, start=start, end=end, interval=interval)
            ...

        registry.register_provider("yfinance", YFinanceProvider)
    """

    @abstractmethod
    def get_historical(
        self, symbol: str, start: str, end: str, interval: str = "1d"
    ) -> pd.DataFrame:
        """Retrieve historical OHLCV data for a symbol.

        Args:
            symbol: Ticker symbol (e.g. ``"AAPL"``).
            start: Start date as an ISO-format string (``"YYYY-MM-DD"``).
            end: End date as an ISO-format string (``"YYYY-MM-DD"``).
            interval: Data interval. Must be one of the values returned
                by :meth:`supported_intervals`. Defaults to ``"1d"``.

        Returns:
            A pandas DataFrame with a DatetimeIndex and columns including
            at minimum ``Open``, ``High``, ``Low``, ``Close``, and ``Volume``.

        Raises:
            DataNotFoundError: If the symbol does not exist or no data is
                available for the requested date range.
        """

    @abstractmethod
    def get_current_price(self, symbol: str) -> float:
        """Retrieve the most recent price for a single symbol.

        Args:
            symbol: Ticker symbol (e.g. ``"AAPL"``).

        Returns:
            The latest available price as a float.

        Raises:
            DataNotFoundError: If the symbol does not exist.
        """

    @abstractmethod
    def get_multiple_prices(self, symbols: list) -> dict:
        """Retrieve the most recent prices for multiple symbols at once.

        Args:
            symbols: List of ticker symbols.

        Returns:
            A dictionary mapping each symbol string to its latest price
            as a float. Symbols that cannot be resolved are omitted.
        """

    @abstractmethod
    def search_symbols(self, query: str) -> list:
        """Search for symbols matching a text query.

        Args:
            query: Free-text search string (e.g. ``"Apple"`` or ``"AAPL"``).

        Returns:
            A list of dicts, each containing at minimum:
                - ``symbol`` (str): Ticker symbol.
                - ``name`` (str): Company or instrument name.
                - ``exchange`` (str): Exchange where the instrument is listed.
        """

    @abstractmethod
    def supported_intervals(self) -> list:
        """Return the list of data intervals supported by this provider.

        Returns:
            A list of interval strings, e.g. ``["1m", "5m", "1h", "1d", "1wk"]``.
        """
