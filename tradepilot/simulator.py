# tradepilot/simulator.py
import pandas as pd
from .optimization import msr
from .metrics import get_returns

class TPS:
    """
    Trade Pilot Simulator for backtesting.

    Parameters:
        universe (pd.DataFrame): Historical price data with a datetime index.
        strategy (function): A strategy function that receives a DataFrame of prices
                             and returns an ordered list/index of asset symbols.
        initial_capital (float): Starting capital for the simulation.
        risk_free (float): Risk-free rate (e.g., 0.02 for 2% annual).
        rebalance_freq (str): Rebalancing frequency (default is weekly, e.g. "W-MON").
    """
    def __init__(self, universe, strategy, initial_capital, risk_free, rebalance_freq="W-MON"):
        self.universe = universe
        self.strategy = strategy
        self.capital = initial_capital
        self.risk_free = risk_free
        self.rebalance_freq = rebalance_freq
        # This series will store portfolio values on each rebalancing date
        self.portfolio = pd.Series(dtype="float64")

    def run(self, start, end):
        """
        Executes the simulation between the start and end dates.
        
        Parameters:
            start (str): Start date in YYYY-MM-DD format.
            end (str): End date in YYYY-MM-DD format.
        
        Returns:
            pd.Series: Portfolio values at each rebalancing date.
        """
        dates = pd.date_range(start, end, freq=self.rebalance_freq)
        for date in dates:
            # Check if data exists for the current date
            if date in self.universe.index:
                # The strategy function receives data up to the current date and returns
                # an ordered list of symbols (e.g., sorted by momentum)
                top_stocks = self.strategy(self.universe.loc[:date])
                # Get price data for the selected assets
                prices = self.universe[top_stocks]
                # Calculate returns and covariance from available historical data
                returns = get_returns(prices)
                print(f"Returns for {date}:\n{returns}")
                cov = returns.cov()
                # Calculate optimal weights using the MSR (Maximum Sharpe Ratio) method
                weights = msr(self.risk_free, returns.apply(lambda r: r.mean()), cov)
                # For simulation purposes, we assume the portfolio is revalued by
                # multiplying the capital by the sum of the weights (a simplification)
                portfolio_value = self.capital * sum(weights)
                self.portfolio[date] = portfolio_value
        return self.portfolio
