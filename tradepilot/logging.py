# tradepilot/logging.py
import logging

logging.basicConfig(filename="pmt.log",
                    level=logging.INFO,
                    format="%(asctime)s - %(levelname)s - %(message)s")

def log_trade(message):
    """
    Logs a trade message.

    Parameters:
        message (str): Message to log.
    """
    logging.info(message)
