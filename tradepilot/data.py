# tradepilot/data.py
import logging
import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)

# Default timeout for API requests (in seconds)
DEFAULT_TIMEOUT = 30


class DataError(Exception):
    """Base exception for data retrieval errors."""
    pass


class DataNotFoundError(DataError):
    """Raised when requested data is not found."""
    pass


class DataValidationError(DataError):
    """Raised when data validation fails."""
    pass


class MarketData:
    """
    Class for retrieving market data.

    Attributes:
        source (str): Data source (default is "yahoo").
        timeout (int): Request timeout in seconds.
    """
    def __init__(self, source="yahoo", timeout=DEFAULT_TIMEOUT):
        self.source = source
        self.timeout = timeout

    def get_historical_data(self, symbol, start, end):
        """
        Retrieves historical closing price data using yfinance.

        Parameters:
            symbol (str or list): Asset symbol (e.g., "AAPL") or list of symbols.
            start (str): Start date (YYYY-MM-DD).
            end (str): End date (YYYY-MM-DD).

        Returns:
            pd.DataFrame: Historical closing prices.

        Raises:
            DataError: On API errors.
            DataNotFoundError: When no data is found.
            DataValidationError: When data validation fails.
        """
        if not symbol:
            raise ValueError("Symbol must be provided")

        try:
            if isinstance(symbol, list):
                data = pd.DataFrame()
                failed_symbols = []

                for s in symbol:
                    try:
                        ticker = yf.Ticker(s)
                        hist = ticker.history(start=start, end=end, timeout=self.timeout)

                        if hist.empty or "Close" not in hist.columns:
                            logger.warning(f"No data found for symbol {s}")
                            failed_symbols.append(s)
                            continue

                        data[s] = hist["Close"]

                    except Exception as e:
                        logger.warning(f"Failed to fetch data for {s}: {e}")
                        failed_symbols.append(s)

                if failed_symbols:
                    logger.warning(f"Failed to fetch data for symbols: {failed_symbols}")

                if data.empty:
                    raise DataNotFoundError(f"No data found for any of the requested symbols")

            else:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(start=start, end=end, timeout=self.timeout)

                if hist.empty:
                    raise DataNotFoundError(f"No data found for symbol {symbol}")

                if "Close" not in hist.columns:
                    raise DataValidationError(f"Close price not found in data for {symbol}")

                data = pd.DataFrame(hist["Close"])
                data.columns = [symbol]

            # Validate data has content
            if data.empty:
                raise DataNotFoundError("Retrieved data is empty")

            # Convert to pandas datetime
            data.index = pd.to_datetime(data.index)

            # Remove timezone if present
            if data.index.tz is not None:
                data.index = data.index.tz_localize(None)

            return data

        except DataError:
            raise
        except Exception as e:
            logger.error(f"Error fetching historical data: {e}")
            raise DataError(f"Failed to fetch historical data: {e}")

    def get_live_price(self, symbol):
        """
        Retrieves the live price of an asset using Yahoo Finance.

        Parameters:
            symbol (str or list(str)): Asset symbol (e.g., "AAPL") or list of symbols.

        Returns:
            pd.DataFrame: Current market prices.

        Raises:
            DataError: On API errors.
            DataNotFoundError: When price is not available.
        """
        if not symbol:
            raise ValueError("Symbol must be provided")

        try:
            if isinstance(symbol, list):
                data = pd.DataFrame()
                failed_symbols = []

                for s in symbol:
                    try:
                        ticker = yf.Ticker(s)
                        info = ticker.info

                        # Try multiple price fields
                        price = info.get("currentPrice") or info.get("regularMarketPrice")

                        if price is None:
                            logger.warning(f"No live price found for {s}")
                            failed_symbols.append(s)
                            continue

                        data[s] = [price]

                    except Exception as e:
                        logger.warning(f"Failed to fetch live price for {s}: {e}")
                        failed_symbols.append(s)

                if failed_symbols:
                    logger.warning(f"Failed to fetch live price for symbols: {failed_symbols}")

                if data.empty:
                    raise DataNotFoundError("No live prices found for any of the requested symbols")

                data.index.name = "price"

            elif isinstance(symbol, str):
                ticker = yf.Ticker(symbol)
                info = ticker.info

                # Try multiple price fields
                price = info.get("currentPrice") or info.get("regularMarketPrice")

                if price is None:
                    raise DataNotFoundError(f"No live price found for {symbol}")

                data = pd.DataFrame([price], index=["price"])
                data.columns = [symbol]

            else:
                raise ValueError("Symbol must be a string or list of strings")

            return data

        except DataError:
            raise
        except Exception as e:
            logger.error(f"Error fetching live price: {e}")
            raise DataError(f"Failed to fetch live price: {e}")


class OpenData:
    """
    Class for retrieving open data.

    Attributes:
        source (str): Data source (default is "yahoo").
        timeout (int): Request timeout in seconds.
    """
    def __init__(self, source="yahoo", timeout=DEFAULT_TIMEOUT):
        self.source = source
        self.timeout = timeout

    def get_risk_free_rate(self, start, end, source=None, country="US"):
        """
        Retrieves historical risk-free rate data using yfinance.

        Parameters:
            start (str): Start date (YYYY-MM-DD).
            end (str): End date (YYYY-MM-DD).
            source (str): Data source override (optional).
            country (str): Country code (currently only "US" supported).

        Returns:
            pd.Series: Historical risk-free rates.

        Raises:
            ValueError: For unsupported countries.
            DataError: On API errors.
            DataNotFoundError: When no data is found.
        """
        if source is None:
            if self.source is None:
                default_source = "yahoo"
            else:
                default_source = self.source
        else:
            default_source = source

        if country != "US":
            raise ValueError("Only US risk-free rate data is available.")

        try:
            # ^IRX is the Yahoo Finance ticker symbol for the 13-week U.S. Treasury Bill (risk-free rate).
            ticker = yf.Ticker("^IRX")
            hist = ticker.history(start=start, end=end, timeout=self.timeout)

            if hist.empty:
                raise DataNotFoundError("No risk-free rate data found for the specified period")

            if "Close" not in hist.columns:
                raise DataValidationError("Close price not found in risk-free rate data")

            data = hist["Close"]
            data.index = pd.to_datetime(data.index)

            # Remove timezone if present
            if data.index.tz is not None:
                data.index = data.index.tz_localize(None)

            return data

        except DataError:
            raise
        except Exception as e:
            logger.error(f"Error fetching risk-free rate: {e}")
            raise DataError(f"Failed to fetch risk-free rate: {e}")