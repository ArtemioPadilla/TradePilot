# tradepilot/trader.py
import time
from .broker import BrokerAPI
from .optimization import msr
from .metrics import get_returns

class TPT:
    """
    TradePilot Trader for live trading.

    Parameters:
        broker_api (str): Broker identifier (e.g., "alpaca").
        universe (pd.DataFrame): Price data (should be updated in real-time).
        strategy (function): Strategy function to rank/select assets.
        capital (float): Capital available for trading.
        risk_free (float): Risk-free rate.
        rebalance_freq (str): Rebalancing frequency (default "W-MON").
    """
    def __init__(self, broker_api, universe, strategy, capital, risk_free, rebalance_freq="W-MON"):
        self.broker = BrokerAPI(broker_api)
        self.universe = universe
        self.strategy = strategy
        self.capital = capital
        self.risk_free = risk_free
        self.rebalance_freq = rebalance_freq

    def run(self):
        """
        Executes live trading with periodic rebalancing.
        """
        while True:
            print("Executing live trading...")
            # Apply the strategy to the available data
            top_stocks = self.strategy(self.universe)
            prices = self.universe[top_stocks]
            returns = get_returns(prices)
            cov = returns.cov()
            # Get optimal weights using the MSR method
            weights = msr(self.risk_free, returns.apply(lambda r: r.mean()), cov)
            for stock, weight in zip(top_stocks, weights):
                allocation = self.capital * weight
                response = self.broker.execute_trade(stock, allocation)
                print(f"Trade executed for {stock}: {response}")
            # Wait for one week (or desired interval) before rebalancing again
            time.sleep(60 * 60 * 24 * 7)
