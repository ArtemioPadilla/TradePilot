# tradepilot/broker.py
import requests
from .config import API_KEYS

class BrokerAPI:
    """
    Broker API class for executing live trades.

    Parameters:
        broker (str): Broker identifier (e.g., "alpaca").
    """
    def __init__(self, broker):
        self.broker = broker
        self.api_key = API_KEYS.get(broker)
        if self.api_key is None:
            raise ValueError(f"No configuration found for broker '{broker}'")

    def execute_trade(self, symbol, amount):
        """
        Executes a market order to buy a given asset.

        Parameters:
            symbol (str): The asset symbol (e.g., "AAPL").
            amount (float): The allocation amount (can be in USD or number of shares).

        Returns:
            dict: Response from the broker API.
        """
        if self.broker == "alpaca":
            url = "https://paper-api.alpaca.markets/v2/orders"
            headers = {
                "APCA-API-KEY-ID": self.api_key["key_id"],
                "APCA-API-SECRET-KEY": self.api_key["secret"]
            }
            order = {
                "symbol": symbol,
                "qty": amount,  # Adjust unit as needed (shares vs. dollars)
                "side": "buy",
                "type": "market",
                "time_in_force": "gtc"
            }
            response = requests.post(url, headers=headers, json=order)
            return response.json()
        else:
            raise NotImplementedError("Broker not supported.")
