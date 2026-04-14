# tradepilot/broker.py
import logging
import requests
from requests.exceptions import RequestException, Timeout, ConnectionError
from . import config

logger = logging.getLogger(__name__)

# Default timeout for API requests (in seconds)
DEFAULT_TIMEOUT = 30


class BrokerError(Exception):
    """Base exception for broker-related errors."""
    pass


class BrokerAuthenticationError(BrokerError):
    """Raised when authentication fails (401)."""
    pass


class BrokerRateLimitError(BrokerError):
    """Raised when rate limit is exceeded (429)."""
    pass


class BrokerServerError(BrokerError):
    """Raised when the broker server has an error (5xx)."""
    pass


class BrokerValidationError(BrokerError):
    """Raised when the request is invalid (400, 422)."""
    pass


class BrokerAPI:
    """
    Broker API class for executing live trades.

    Parameters:
        broker (str): Broker identifier (e.g., "alpaca").
        timeout (int): Request timeout in seconds (default 30).
        use_paper (bool): Use paper trading API (default True for safety).
    """
    def __init__(self, broker, timeout=DEFAULT_TIMEOUT, use_paper=True):
        self.broker = broker
        self.timeout = timeout
        self.use_paper = use_paper
        self.api_key = config.API_KEYS.get(broker)

        if self.api_key is None:
            raise ValueError(f"No configuration found for broker '{broker}'")

        # Validate API keys are configured
        if not self.api_key.get("key_id") or not self.api_key.get("secret"):
            raise ValueError(f"API credentials for '{broker}' are not properly configured")

    def _get_base_url(self):
        """Get the appropriate API base URL."""
        if self.broker == "alpaca":
            if self.use_paper:
                return "https://paper-api.alpaca.markets"
            return "https://api.alpaca.markets"
        raise NotImplementedError(f"Broker '{self.broker}' not supported")

    def _handle_response(self, response):
        """
        Handle API response and raise appropriate exceptions.

        Parameters:
            response: requests.Response object

        Returns:
            dict: Parsed JSON response

        Raises:
            BrokerAuthenticationError: On 401 status
            BrokerRateLimitError: On 429 status
            BrokerServerError: On 5xx status
            BrokerValidationError: On 400/422 status
            BrokerError: On other errors
        """
        status_code = response.status_code

        try:
            data = response.json()
        except ValueError:
            data = {"raw_response": response.text}

        if status_code == 200 or status_code == 201:
            return data

        error_message = data.get("message", str(data))

        if status_code == 401:
            logger.error(f"Authentication failed: {error_message}")
            raise BrokerAuthenticationError(f"Authentication failed: {error_message}")

        if status_code == 403:
            logger.error(f"Access forbidden: {error_message}")
            raise BrokerAuthenticationError(f"Access forbidden: {error_message}")

        if status_code == 429:
            logger.warning(f"Rate limit exceeded: {error_message}")
            raise BrokerRateLimitError(f"Rate limit exceeded: {error_message}")

        if status_code in (400, 422):
            logger.error(f"Validation error: {error_message}")
            raise BrokerValidationError(f"Invalid request: {error_message}")

        if 500 <= status_code < 600:
            logger.error(f"Server error ({status_code}): {error_message}")
            raise BrokerServerError(f"Broker server error ({status_code}): {error_message}")

        logger.error(f"Unexpected status code {status_code}: {error_message}")
        raise BrokerError(f"Unexpected error ({status_code}): {error_message}")

    def execute_trade(self, symbol, amount, side="buy", order_type="market", time_in_force="gtc"):
        """
        Executes a market order to buy or sell a given asset.

        Parameters:
            symbol (str): The asset symbol (e.g., "AAPL").
            amount (float): The quantity (number of shares).
            side (str): Order side - "buy" or "sell" (default "buy").
            order_type (str): Order type - "market", "limit", etc. (default "market").
            time_in_force (str): Time in force - "gtc", "day", "ioc" (default "gtc").

        Returns:
            dict: Response from the broker API.

        Raises:
            BrokerError: On API errors.
            ValueError: On invalid parameters.
        """
        if not symbol or not isinstance(symbol, str):
            raise ValueError("Symbol must be a non-empty string")

        if amount <= 0:
            raise ValueError("Amount must be positive")

        if side not in ("buy", "sell"):
            raise ValueError("Side must be 'buy' or 'sell'")

        if self.broker == "alpaca":
            url = f"{self._get_base_url()}/v2/orders"
            headers = {
                "APCA-API-KEY-ID": self.api_key["key_id"],
                "APCA-API-SECRET-KEY": self.api_key["secret"],
                "Content-Type": "application/json"
            }
            order = {
                "symbol": symbol.upper(),
                "qty": str(amount),
                "side": side,
                "type": order_type,
                "time_in_force": time_in_force
            }

            logger.info(f"Submitting {side} order for {amount} shares of {symbol}")

            try:
                response = requests.post(
                    url,
                    headers=headers,
                    json=order,
                    timeout=self.timeout
                )
                return self._handle_response(response)

            except Timeout:
                logger.error(f"Request timed out after {self.timeout} seconds")
                raise BrokerError(f"Request timed out after {self.timeout} seconds")

            except ConnectionError as e:
                logger.error(f"Connection error: {e}")
                raise BrokerError(f"Connection error: {e}")

            except RequestException as e:
                logger.error(f"Request error: {e}")
                raise BrokerError(f"Request error: {e}")
        else:
            raise NotImplementedError(f"Broker '{self.broker}' not supported")

    def get_account(self):
        """
        Get account information.

        Returns:
            dict: Account information from the broker.
        """
        if self.broker == "alpaca":
            url = f"{self._get_base_url()}/v2/account"
            headers = {
                "APCA-API-KEY-ID": self.api_key["key_id"],
                "APCA-API-SECRET-KEY": self.api_key["secret"]
            }

            try:
                response = requests.get(url, headers=headers, timeout=self.timeout)
                return self._handle_response(response)

            except Timeout:
                raise BrokerError(f"Request timed out after {self.timeout} seconds")
            except ConnectionError as e:
                raise BrokerError(f"Connection error: {e}")
            except RequestException as e:
                raise BrokerError(f"Request error: {e}")
        else:
            raise NotImplementedError(f"Broker '{self.broker}' not supported")

    def get_positions(self):
        """
        Get current positions.

        Returns:
            list: List of current positions.
        """
        if self.broker == "alpaca":
            url = f"{self._get_base_url()}/v2/positions"
            headers = {
                "APCA-API-KEY-ID": self.api_key["key_id"],
                "APCA-API-SECRET-KEY": self.api_key["secret"]
            }

            try:
                response = requests.get(url, headers=headers, timeout=self.timeout)
                return self._handle_response(response)

            except Timeout:
                raise BrokerError(f"Request timed out after {self.timeout} seconds")
            except ConnectionError as e:
                raise BrokerError(f"Connection error: {e}")
            except RequestException as e:
                raise BrokerError(f"Request error: {e}")
        else:
            raise NotImplementedError(f"Broker '{self.broker}' not supported")
