"""Polygon.io data provider stub.

This example shows how to implement a DataProvider plugin for
Polygon.io's market data API. Replace the TODO placeholders with
actual HTTP calls to the Polygon REST API.

To activate, copy this file to tradepilot/plugins/providers/polygon.py
and it will be auto-discovered on next registry access.
"""

import pandas as pd

from tradepilot.plugins import DataProvider, register_provider


class PolygonProvider(DataProvider):
    """Data provider backed by the Polygon.io REST API."""

    # Mapping from TradePilot interval names to Polygon multiplier/timespan
    _INTERVAL_MAP = {
        "1m": (1, "minute"),
        "5m": (5, "minute"),
        "15m": (15, "minute"),
        "1h": (1, "hour"),
        "1d": (1, "day"),
        "1wk": (1, "week"),
    }

    def __init__(self, api_key: str, base_url: str = "https://api.polygon.io"):
        self._api_key = api_key
        self._base_url = base_url

    def get_historical(
        self, symbol: str, start: str, end: str, interval: str = "1d"
    ) -> pd.DataFrame:
        """Fetch historical OHLCV data from Polygon.

        Uses GET /v2/aggs/ticker/{symbol}/range/{multiplier}/{timespan}/{start}/{end}

        Returns DataFrame with columns: Open, High, Low, Close, Volume.
        """
        # TODO: Implement actual API call
        # multiplier, timespan = self._INTERVAL_MAP[interval]
        # url = (
        #     f"{self._base_url}/v2/aggs/ticker/{symbol}"
        #     f"/range/{multiplier}/{timespan}/{start}/{end}"
        #     f"?apiKey={self._api_key}&limit=50000"
        # )
        # response = requests.get(url)
        # response.raise_for_status()
        # results = response.json()["results"]
        # df = pd.DataFrame(results)
        # df["Date"] = pd.to_datetime(df["t"], unit="ms")
        # df = df.set_index("Date")
        # df = df.rename(columns={"o": "Open", "h": "High", "l": "Low", "c": "Close", "v": "Volume"})
        # return df[["Open", "High", "Low", "Close", "Volume"]]
        raise NotImplementedError("Polygon get_historical not yet implemented")

    def get_current_price(self, symbol: str) -> float:
        """Get the latest trade price for a symbol.

        Uses GET /v2/last/trade/{symbol}
        """
        # TODO: Implement actual API call
        # url = f"{self._base_url}/v2/last/trade/{symbol}?apiKey={self._api_key}"
        # response = requests.get(url)
        # response.raise_for_status()
        # return float(response.json()["results"]["p"])
        raise NotImplementedError("Polygon get_current_price not yet implemented")

    def get_multiple_prices(self, symbols: list) -> dict:
        """Get latest prices for multiple symbols.

        Uses GET /v2/snapshot/locale/us/markets/stocks/tickers
        """
        # TODO: Implement actual API call
        # url = (
        #     f"{self._base_url}/v2/snapshot/locale/us/markets/stocks/tickers"
        #     f"?tickers={','.join(symbols)}&apiKey={self._api_key}"
        # )
        # response = requests.get(url)
        # response.raise_for_status()
        # return {
        #     t["ticker"]: t["lastTrade"]["p"]
        #     for t in response.json()["tickers"]
        # }
        raise NotImplementedError("Polygon get_multiple_prices not yet implemented")

    def search_symbols(self, query: str) -> list:
        """Search for symbols matching a query.

        Uses GET /v3/reference/tickers
        """
        # TODO: Implement actual API call
        # url = (
        #     f"{self._base_url}/v3/reference/tickers"
        #     f"?search={query}&active=true&apiKey={self._api_key}&limit=20"
        # )
        # response = requests.get(url)
        # response.raise_for_status()
        # return [
        #     {"symbol": r["ticker"], "name": r["name"], "exchange": r.get("primary_exchange", "")}
        #     for r in response.json()["results"]
        # ]
        raise NotImplementedError("Polygon search_symbols not yet implemented")

    def supported_intervals(self) -> list:
        """Return intervals supported by Polygon.io."""
        return list(self._INTERVAL_MAP.keys())


# Self-register when this module is imported
register_provider("polygon", PolygonProvider)
