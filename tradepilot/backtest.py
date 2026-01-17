# tradepilot/backtest.py
import pandas as pd
from .metrics import get_returns, annualize_returns, sharpe_ratio
from .simulator import TPS
class Backtest:
    """
    Backtest class to run simulations and evaluate strategy performance.

    Parameters:
        universe (pd.DataFrame): Historical price data.
        strategy (function): Strategy function for ranking assets.
        initial_capital (float): Initial capital for backtesting.
        risk_free (float): Risk-free rate.
        rebalance_freq (str): Rebalancing frequency (default "W-MON").
    """
    def __init__(self, universe, strategy, initial_capital, risk_free, rebalance_freq="W-MON"):
        self.simulator = TPS(universe, strategy, initial_capital, risk_free, rebalance_freq)
        self.results = None

    def run(self, start, end):
        """
        Runs the backtest over the given date range.

        Parameters:
            start (str): Start date in YYYY-MM-DD.
            end (str): End date in YYYY-MM-DD.

        Returns:
            pd.Series: Portfolio values from the simulation.
        """
        self.results = self.simulator.run(start, end)
        return self.results

    def evaluate(self):
        """
        Evaluates the backtest results by calculating performance metrics.

        Returns:
            dict: Dictionary with annualized return, Sharpe ratio, and max drawdown.
        """
        if self.results is None:
            raise ValueError("No results generated. Run 'run()' first.")
        returns = get_returns(self.results)
        print(f"Returns:\n{returns}")
        metrics = {
            "Annual Return": annualize_returns(returns),
            "Sharpe Ratio": sharpe_ratio(returns, self.simulator.risk_free),
            "Max Drawdown": self.results.min()
        }
        return metrics
