# tradepilot/backtest.py
import pandas as pd
from .metrics import get_returns, annualize_returns, sharpe_ratio
from .simulator import TPS
from .ranking import momentum_ranking


class Backtest:
    """
    Backtest class to run simulations and evaluate strategy performance.

    Provides a simplified interface over TPS. The strategy function receives
    a DataFrame of prices and returns an ordered list of asset symbols.

    Parameters:
        universe (pd.DataFrame): Historical price data.
        strategy (function): Strategy function for ranking assets.
        initial_capital (float): Initial capital for backtesting.
        risk_free (float or pd.Series): Risk-free rate (annual) or series.
        rebalance_freq (str): Rebalancing frequency (default "W-MON").
        t (int): Timeframe for ranking (default 20 trading days).
        window (int): Lookback window for analysis (default 52 weeks).
        n_stocks (int): Number of top stocks to select (default 5).
        opt_tech (str): Optimization technique ("MSR", "GMV", "EW"). Default "MSR".
    """
    def __init__(self, universe, strategy, initial_capital, risk_free,
                 rebalance_freq="W-MON", t=20, window=52, n_stocks=5,
                 opt_tech="MSR"):
        self.universe = universe
        self.strategy = strategy
        self.initial_capital = initial_capital
        self.risk_free = risk_free
        self.rebalance_freq = rebalance_freq
        self.t = t
        self.window = window
        self.n_stocks = n_stocks
        self.opt_tech = opt_tech
        self.results = None
        self.simulator = None

    def _make_risk_free_series(self, start, end):
        """Convert a scalar risk-free rate to a Series over the universe index."""
        if isinstance(self.risk_free, pd.Series):
            return self.risk_free
        # Build a constant series matching the universe date index
        idx = self.universe.loc[start:end].index
        return pd.Series(self.risk_free * 100, index=idx)

    def _wrap_strategy(self):
        """Wrap the user strategy into the criteria signature TPS expects.

        TPS calls ``criteria(prices_df, t)`` and expects a Series of scores.
        The user's strategy returns a list of symbols. We convert by assigning
        descending scores so the first symbol has the highest score.
        """
        user_strategy = self.strategy

        def criteria(prices, t):
            selected = user_strategy(prices)
            # Return a Series with descending scores
            scores = pd.Series(
                range(len(selected), 0, -1),
                index=selected,
                dtype=float,
            )
            # Include unselected stocks with score 0
            for col in prices.columns:
                if col not in scores.index:
                    scores[col] = 0.0
            return scores

        return criteria

    def run(self, start, end):
        """
        Runs the backtest over the given date range.

        Parameters:
            start (str): Start date in YYYY-MM-DD.
            end (str): End date in YYYY-MM-DD.

        Returns:
            pd.Series: Portfolio values from the simulation.
        """
        rf_series = self._make_risk_free_series(start, end)
        criteria = self._wrap_strategy()

        n_stocks = min(self.n_stocks, len(self.universe.columns))

        self.simulator = TPS(
            universe=self.universe,
            initial_capital=self.initial_capital,
            risk_free=rf_series,
            criteria=criteria,
            start=start,
            end=end,
            t=self.t,
            window=self.window,
            opt_tech=self.opt_tech,
            freq=self.rebalance_freq,
            N=n_stocks,
        )
        valuations, p_eval, allocations = self.simulator.run()
        self.results = valuations
        self._eval = p_eval
        self._allocations = allocations
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
        rf = self.risk_free if isinstance(self.risk_free, (int, float)) else 0.04
        metrics = {
            "Annual Return": annualize_returns(returns),
            "Sharpe Ratio": sharpe_ratio(returns, rf),
            "Max Drawdown": self.results.min()
        }
        return metrics
