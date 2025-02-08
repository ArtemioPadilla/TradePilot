# tradepilot/data.py
import pandas as pd
import yfinance as yf

class MarketData:
    """
    Class for retrieving market data.
    
    Attributes:
        source (str): Data source (default is "yahoo").
    """
    def __init__(self, source="yahoo"):
        self.source = source



    def get_historical_data(self, symbol, start, end):
        """
        Retrieves historical closing price data using yfinance.
        
        Parameters:
            symbol (str or list): Asset symbol (e.g., "AAPL") or list of symbols.
            start (str): Start date (YYYY-MM-DD).
            end (str): End date (YYYY-MM-DD).
            
        Returns:
            pd.Series: Historical closing prices.
        """
        if isinstance(symbol, list):
            data = pd.DataFrame()
            for s in symbol:
                ticker = yf.Ticker(s)
                data[s] = ticker.history(start=start, end=end)["Close"]
        else:
            ticker = yf.Ticker(symbol)
            data = ticker.history(start=start, end=end)["Close"]
            # convert to dataframe
            data = pd.DataFrame(data)
            data.columns = [symbol]
        return data
    
    def get_live_price(self, symbol):
        """
        Retrieves the live price of an asset using Yahoo Finance.
        
        Parameters:
            symbol (str or list(str)): Asset symbol (e.g., "AAPL") or list of symbols.
            
        Returns:
            float: Current market price.
        """
        if isinstance(symbol, list):
            data = pd.DataFrame()
            for s in symbol:
                ticker = yf.Ticker(s)
                data[s] = [ticker.info["currentPrice"]]
            data.index.name = "price"
        elif isinstance(symbol, str):
            ticker = yf.Ticker(symbol)
            prices = ticker.info["currentPrice"]
            data = pd.DataFrame([prices], index=["price"])
            data.columns = [symbol]
        else:
            raise ValueError("Invalid input for symbol.")
        return data
    