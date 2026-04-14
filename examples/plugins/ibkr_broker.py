"""Interactive Brokers adapter stub.

This example shows how to implement a BrokerAdapter plugin for
Interactive Brokers (IBKR). Replace the TODO placeholders with
actual IBKR API calls (e.g. via ib_insync or the native TWS API).

To activate, copy this file to tradepilot/plugins/brokers/ibkr.py
and it will be auto-discovered on next registry access.
"""

from tradepilot.plugins import BrokerAdapter, register_broker


class InteractiveBrokersAdapter(BrokerAdapter):
    """Broker adapter for Interactive Brokers TWS / Client Portal API."""

    def __init__(self):
        self._client = None
        self._connected = False

    def connect(self, credentials: dict) -> bool:
        """Connect to IBKR TWS or Gateway.

        Expected credentials keys:
            - host (str): TWS/Gateway hostname, default "127.0.0.1"
            - port (int): TWS=7497, Gateway=4001
            - client_id (int): Unique client identifier
        """
        # TODO: Initialize IB connection
        # from ib_insync import IB
        # self._client = IB()
        # self._client.connect(
        #     credentials.get("host", "127.0.0.1"),
        #     credentials.get("port", 7497),
        #     clientId=credentials.get("client_id", 1),
        # )
        # self._connected = True
        # return True
        raise NotImplementedError("IBKR connect not yet implemented")

    def disconnect(self) -> None:
        """Disconnect from IBKR."""
        # TODO: self._client.disconnect()
        self._connected = False

    def get_account(self) -> dict:
        """Retrieve IBKR account summary.

        Returns dict with buying_power, portfolio_value, currency.
        """
        # TODO: Use self._client.accountSummary() or accountValues()
        # summary = self._client.accountSummary()
        # return {
        #     "buying_power": float(find_tag(summary, "BuyingPower")),
        #     "portfolio_value": float(find_tag(summary, "NetLiquidation")),
        #     "currency": "USD",
        # }
        raise NotImplementedError("IBKR get_account not yet implemented")

    def get_positions(self) -> list:
        """Retrieve all open positions from IBKR.

        Returns list of dicts with symbol, quantity, market_value, avg_entry_price.
        """
        # TODO: Use self._client.positions()
        # positions = self._client.positions()
        # return [
        #     {
        #         "symbol": pos.contract.symbol,
        #         "quantity": float(pos.position),
        #         "market_value": float(pos.marketValue),
        #         "avg_entry_price": float(pos.avgCost),
        #     }
        #     for pos in positions
        # ]
        raise NotImplementedError("IBKR get_positions not yet implemented")

    def submit_order(
        self,
        symbol: str,
        quantity: float,
        side: str,
        order_type: str = "market",
        time_in_force: str = "gtc",
    ) -> dict:
        """Submit an order to IBKR.

        Args:
            symbol: Ticker symbol (e.g. "AAPL").
            quantity: Number of shares. Must be positive.
            side: "buy" or "sell".
            order_type: "market" or "limit".
            time_in_force: "gtc" or "day".

        Returns dict with order_id, status, symbol, quantity, side.
        """
        # TODO: Build contract and order objects, then place
        # from ib_insync import Stock, MarketOrder, LimitOrder
        # contract = Stock(symbol, "SMART", "USD")
        # action = "BUY" if side == "buy" else "SELL"
        # if order_type == "market":
        #     order = MarketOrder(action, quantity)
        # else:
        #     order = LimitOrder(action, quantity, limit_price)
        # trade = self._client.placeOrder(contract, order)
        # return {
        #     "order_id": str(trade.order.orderId),
        #     "status": trade.orderStatus.status.lower(),
        #     "symbol": symbol,
        #     "quantity": quantity,
        #     "side": side,
        # }
        raise NotImplementedError("IBKR submit_order not yet implemented")

    def cancel_order(self, order_id: str) -> bool:
        """Cancel an open IBKR order.

        Args:
            order_id: The IBKR order ID.

        Returns True if cancellation was accepted.
        """
        # TODO: self._client.cancelOrder(order)
        raise NotImplementedError("IBKR cancel_order not yet implemented")

    def get_order_status(self, order_id: str) -> dict:
        """Check status of an IBKR order.

        Returns dict with order_id, status, filled_quantity.
        """
        # TODO: Look up order from self._client.openTrades() or reqCompletedOrders
        # return {
        #     "order_id": order_id,
        #     "status": "filled",
        #     "filled_quantity": 10.0,
        # }
        raise NotImplementedError("IBKR get_order_status not yet implemented")

    def stream_prices(self, symbols: list, callback: callable) -> dict:
        """Stream real-time prices from IBKR.

        Args:
            symbols: List of ticker symbols.
            callback: Called with {symbol, price, timestamp} on each tick.

        Returns dict with stream_id, symbols.
        """
        # TODO: Use self._client.reqMktData() for each symbol
        # for symbol in symbols:
        #     contract = Stock(symbol, "SMART", "USD")
        #     self._client.reqMktData(contract)
        # return {"stream_id": "ibkr-stream-1", "symbols": symbols}
        raise NotImplementedError("IBKR stream_prices not yet implemented")


# Self-register when this module is imported
register_broker("ibkr", InteractiveBrokersAdapter)
