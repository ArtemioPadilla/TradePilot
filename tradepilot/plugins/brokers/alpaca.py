"""Alpaca broker plugin adapter.

Wraps the existing :class:`~tradepilot.broker.BrokerAPI` implementation
behind the :class:`~tradepilot.plugins.base_broker.BrokerAdapter` interface
so it can be used through the plugin registry.
"""

import logging
import uuid

from tradepilot.broker import BrokerAPI
from tradepilot.plugins.base_broker import BrokerAdapter
from tradepilot.plugins.registry import register_broker

logger = logging.getLogger(__name__)


class AlpacaAdapter(BrokerAdapter):
    """Plugin adapter that delegates to the existing BrokerAPI for Alpaca.

    All abstract methods are implemented by forwarding calls to a
    :class:`~tradepilot.broker.BrokerAPI` instance configured for Alpaca.
    """

    def __init__(self):
        self._broker: BrokerAPI | None = None
        self._connected = False

    def connect(self, credentials: dict) -> bool:
        """Connect to Alpaca using the existing BrokerAPI.

        ``credentials`` is accepted for interface compliance but the
        underlying BrokerAPI reads keys from ``tradepilot.config``.
        Optional keys:

        * ``timeout`` (int) -- request timeout in seconds.
        * ``use_paper`` (bool) -- whether to use the paper trading endpoint.
        """
        timeout = credentials.get("timeout", 30)
        use_paper = credentials.get("use_paper", True)

        self._broker = BrokerAPI("alpaca", timeout=timeout, use_paper=use_paper)
        self._connected = True
        logger.info("AlpacaAdapter connected (paper=%s)", use_paper)
        return True

    def disconnect(self) -> None:
        """Disconnect from Alpaca.

        The underlying BrokerAPI uses plain HTTP requests so there is no
        persistent connection to tear down.
        """
        self._broker = None
        self._connected = False
        logger.info("AlpacaAdapter disconnected")

    def _ensure_connected(self) -> None:
        if not self._connected or self._broker is None:
            raise RuntimeError("AlpacaAdapter is not connected. Call connect() first.")

    def get_account(self) -> dict:
        self._ensure_connected()
        raw = self._broker.get_account()
        return {
            "buying_power": float(raw.get("buying_power", 0)),
            "portfolio_value": float(raw.get("portfolio_value", 0)),
            "currency": raw.get("currency", "USD"),
        }

    def get_positions(self) -> list:
        self._ensure_connected()
        raw_positions = self._broker.get_positions()
        positions = []
        for pos in raw_positions:
            positions.append({
                "symbol": pos.get("symbol", ""),
                "quantity": float(pos.get("qty", 0)),
                "market_value": float(pos.get("market_value", 0)),
                "avg_entry_price": float(pos.get("avg_entry_price", 0)),
            })
        return positions

    def submit_order(
        self,
        symbol: str,
        quantity: float,
        side: str,
        order_type: str = "market",
        time_in_force: str = "gtc",
    ) -> dict:
        self._ensure_connected()
        raw = self._broker.execute_trade(
            symbol=symbol,
            amount=quantity,
            side=side,
            order_type=order_type,
            time_in_force=time_in_force,
        )
        return {
            "order_id": raw.get("id", ""),
            "status": raw.get("status", ""),
            "symbol": raw.get("symbol", symbol),
            "quantity": float(raw.get("qty", quantity)),
            "side": raw.get("side", side),
        }

    def cancel_order(self, order_id: str) -> bool:
        self._ensure_connected()
        import requests
        from tradepilot.broker import BrokerError

        url = f"{self._broker._get_base_url()}/v2/orders/{order_id}"
        headers = {
            "APCA-API-KEY-ID": self._broker.api_key["key_id"],
            "APCA-API-SECRET-KEY": self._broker.api_key["secret"],
        }
        try:
            response = requests.delete(url, headers=headers, timeout=self._broker.timeout)
            if response.status_code in (200, 204):
                return True
            self._broker._handle_response(response)
            return False
        except requests.exceptions.RequestException as exc:
            raise BrokerError(f"Failed to cancel order {order_id}: {exc}")

    def get_order_status(self, order_id: str) -> dict:
        self._ensure_connected()
        import requests
        from tradepilot.broker import BrokerError

        url = f"{self._broker._get_base_url()}/v2/orders/{order_id}"
        headers = {
            "APCA-API-KEY-ID": self._broker.api_key["key_id"],
            "APCA-API-SECRET-KEY": self._broker.api_key["secret"],
        }
        try:
            response = requests.get(url, headers=headers, timeout=self._broker.timeout)
            raw = self._broker._handle_response(response)
            return {
                "order_id": raw.get("id", order_id),
                "status": raw.get("status", ""),
                "filled_quantity": float(raw.get("filled_qty", 0)),
            }
        except requests.exceptions.RequestException as exc:
            raise BrokerError(f"Failed to get order status for {order_id}: {exc}")

    def stream_prices(self, symbols: list, callback: callable) -> dict:
        """Alpaca price streaming is not supported via the REST-based BrokerAPI.

        Returns a stub stream handle. A full implementation would use
        Alpaca's WebSocket data streaming API.
        """
        stream_id = str(uuid.uuid4())
        logger.warning(
            "AlpacaAdapter.stream_prices is a stub — real-time streaming "
            "requires Alpaca's WebSocket API."
        )
        return {
            "stream_id": stream_id,
            "symbols": list(symbols),
        }


# Auto-register when this module is imported
register_broker("alpaca", AlpacaAdapter)
