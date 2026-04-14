"""Abstract base class for broker adapters.

Broker adapters provide a uniform interface for connecting to different
brokerage APIs. Each adapter wraps a specific broker's SDK or REST API
and exposes the standard operations needed by TradePilot's trading engine.

The interface mirrors the existing BrokerAPI class patterns (execute_trade,
get_account, get_positions) while adding lifecycle management (connect/disconnect)
and streaming capabilities.
"""

from abc import ABC, abstractmethod


class BrokerAdapter(ABC):
    """Abstract base class that all broker plugins must implement.

    A BrokerAdapter encapsulates the connection lifecycle and trading
    operations for a single brokerage. Implementations handle authentication,
    order management, position tracking, and optional real-time price streaming.

    Example usage::

        class AlpacaAdapter(BrokerAdapter):
            def connect(self, credentials):
                self._client = alpaca.REST(credentials["key"], credentials["secret"])
                return True
            ...

        registry.register_broker("alpaca", AlpacaAdapter)
    """

    @abstractmethod
    def connect(self, credentials: dict) -> bool:
        """Authenticate and establish a connection with the broker.

        Args:
            credentials: Broker-specific authentication details. Typical keys
                include ``api_key``, ``api_secret``, and ``base_url``.

        Returns:
            True if the connection was established successfully.

        Raises:
            BrokerAuthenticationError: If the credentials are invalid or
                the broker rejects the authentication attempt.
        """

    @abstractmethod
    def disconnect(self) -> None:
        """Close the connection and release any held resources.

        Implementations should ensure that open websocket connections,
        streaming threads, and other background resources are cleanly
        shut down.
        """

    @abstractmethod
    def get_account(self) -> dict:
        """Retrieve current account information.

        Returns:
            A dictionary containing at minimum:
                - ``buying_power`` (float): Available capital for trading.
                - ``portfolio_value`` (float): Total portfolio value.
                - ``currency`` (str): Account currency code.
        """

    @abstractmethod
    def get_positions(self) -> list:
        """Retrieve all currently held positions.

        Returns:
            A list of dicts, each containing at minimum:
                - ``symbol`` (str): Ticker symbol.
                - ``quantity`` (float): Number of shares/units held.
                - ``market_value`` (float): Current market value.
                - ``avg_entry_price`` (float): Average cost basis per share.
        """

    @abstractmethod
    def submit_order(
        self,
        symbol: str,
        quantity: float,
        side: str,
        order_type: str = "market",
        time_in_force: str = "gtc",
    ) -> dict:
        """Submit a new order to the broker.

        Args:
            symbol: Ticker symbol to trade.
            quantity: Number of shares/units. Must be positive.
            side: Order direction, either ``"buy"`` or ``"sell"``.
            order_type: Order type such as ``"market"`` or ``"limit"``.
            time_in_force: Time-in-force policy, e.g. ``"gtc"`` (good-til-cancelled)
                or ``"day"``.

        Returns:
            A dictionary containing at minimum:
                - ``order_id`` (str): Unique identifier assigned by the broker.
                - ``status`` (str): Initial order status.
                - ``symbol`` (str): The traded symbol.
                - ``quantity`` (float): Ordered quantity.
                - ``side`` (str): Order direction.
        """

    @abstractmethod
    def cancel_order(self, order_id: str) -> bool:
        """Cancel a previously submitted order.

        Args:
            order_id: The broker-assigned order identifier.

        Returns:
            True if the cancellation request was accepted.

        Raises:
            BrokerError: If the order cannot be cancelled (e.g. already filled).
        """

    @abstractmethod
    def get_order_status(self, order_id: str) -> dict:
        """Retrieve the current status of an order.

        Args:
            order_id: The broker-assigned order identifier.

        Returns:
            A dictionary containing at minimum:
                - ``order_id`` (str): The order identifier.
                - ``status`` (str): Current status (e.g. ``"filled"``,
                  ``"pending"``, ``"cancelled"``).
                - ``filled_quantity`` (float): How many shares have been filled.
        """

    @abstractmethod
    def stream_prices(self, symbols: list, callback: callable) -> dict:
        """Start streaming real-time price updates for the given symbols.

        The ``callback`` is invoked with each price update and receives a dict
        containing ``symbol``, ``price``, and ``timestamp`` keys.

        Args:
            symbols: List of ticker symbols to stream.
            callback: A callable that accepts a single dict argument for
                each price update.

        Returns:
            A dictionary describing the stream handle, containing at minimum:
                - ``stream_id`` (str): Identifier for stopping the stream.
                - ``symbols`` (list): The symbols being streamed.
        """
