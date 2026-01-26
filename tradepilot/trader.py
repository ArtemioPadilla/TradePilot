# tradepilot/trader.py
import time
import signal
import logging
from .broker import BrokerAPI, BrokerError
from .optimization import msr
from .metrics import get_returns

# Configure logging
logger = logging.getLogger(__name__)


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
        rebalance_interval (int): Interval in seconds between rebalancing (default 1 week).
    """
    def __init__(self, broker_api, universe, strategy, capital, risk_free,
                 rebalance_freq="W-MON", rebalance_interval=60 * 60 * 24 * 7):
        self.broker = BrokerAPI(broker_api)
        self.universe = universe
        self.strategy = strategy
        self.capital = capital
        self.risk_free = risk_free
        self.rebalance_freq = rebalance_freq
        self.rebalance_interval = rebalance_interval
        self._running = False

        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._handle_shutdown)
        signal.signal(signal.SIGTERM, self._handle_shutdown)

    def _handle_shutdown(self, signum, frame):
        """Handle shutdown signals gracefully."""
        logger.info(f"Received signal {signum}, initiating graceful shutdown...")
        self._running = False

    def stop(self):
        """Stop the trading loop."""
        logger.info("Stopping trading loop...")
        self._running = False

    def run(self):
        """
        Executes live trading with periodic rebalancing.
        Supports graceful shutdown via SIGINT/SIGTERM or stop() method.
        """
        self._running = True
        logger.info("Starting live trading...")

        while self._running:
            try:
                logger.info("Executing rebalancing cycle...")

                # Apply the strategy to the available data
                top_stocks = self.strategy(self.universe)
                if not top_stocks:
                    logger.warning("Strategy returned no stocks to trade")
                    self._sleep_interruptible(self.rebalance_interval)
                    continue

                prices = self.universe[top_stocks]
                returns = get_returns(prices)
                cov = returns.cov()

                # Get optimal weights using the MSR method
                weights = msr(self.risk_free, returns.apply(lambda r: r.mean()), cov)

                # Execute trades for each stock
                for stock, weight in zip(top_stocks, weights):
                    if not self._running:
                        logger.info("Shutdown requested, stopping trade execution")
                        break

                    allocation = self.capital * weight
                    try:
                        response = self.broker.execute_trade(stock, allocation)
                        logger.info(f"Trade executed for {stock}: {response}")
                    except BrokerError as e:
                        logger.error(f"Failed to execute trade for {stock}: {e}")
                    except Exception as e:
                        logger.error(f"Unexpected error executing trade for {stock}: {e}")

                # Wait for next rebalancing period (interruptible sleep)
                if self._running:
                    logger.info(f"Waiting {self.rebalance_interval} seconds until next rebalance...")
                    self._sleep_interruptible(self.rebalance_interval)

            except Exception as e:
                logger.error(f"Error in trading loop: {e}")
                if self._running:
                    # Wait a bit before retrying
                    self._sleep_interruptible(60)

        logger.info("Trading loop stopped")

    def _sleep_interruptible(self, seconds):
        """Sleep that can be interrupted by stop() or shutdown signal."""
        interval = 1  # Check every second
        elapsed = 0
        while self._running and elapsed < seconds:
            time.sleep(interval)
            elapsed += interval
