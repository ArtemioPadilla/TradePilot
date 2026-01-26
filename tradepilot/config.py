# tradepilot/config.py
"""
Configuration module for TradePilot.

API credentials should be set via environment variables:
- ALPACA_KEY_ID: Alpaca API key ID
- ALPACA_SECRET_KEY: Alpaca API secret key

Never commit actual credentials to version control.
"""
import os
import logging

logger = logging.getLogger(__name__)


def _get_env_var(name, default=None, required=False):
    """
    Get environment variable with optional validation.

    Parameters:
        name (str): Environment variable name.
        default: Default value if not set.
        required (bool): If True, log warning when not set.

    Returns:
        str: Environment variable value or default.
    """
    value = os.environ.get(name, default)
    if required and (value is None or value == default):
        logger.warning(f"Environment variable {name} is not set")
    return value


# API credentials loaded from environment variables
API_KEYS = {
    "alpaca": {
        "key_id": _get_env_var("ALPACA_KEY_ID"),
        "secret": _get_env_var("ALPACA_SECRET_KEY"),
    }
}


def validate_config(broker="alpaca"):
    """
    Validate that required configuration is present.

    Parameters:
        broker (str): Broker name to validate.

    Returns:
        bool: True if configuration is valid.

    Raises:
        ValueError: If required configuration is missing.
    """
    if broker not in API_KEYS:
        raise ValueError(f"Unknown broker: {broker}")

    config = API_KEYS[broker]

    if not config.get("key_id"):
        raise ValueError(f"Missing API key ID for {broker}. Set {broker.upper()}_KEY_ID environment variable.")

    if not config.get("secret"):
        raise ValueError(f"Missing API secret for {broker}. Set {broker.upper()}_SECRET_KEY environment variable.")

    return True


def is_configured(broker="alpaca"):
    """
    Check if a broker is properly configured.

    Parameters:
        broker (str): Broker name to check.

    Returns:
        bool: True if broker is configured.
    """
    try:
        return validate_config(broker)
    except ValueError:
        return False
