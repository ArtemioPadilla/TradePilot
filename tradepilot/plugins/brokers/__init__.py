"""Broker plugin adapters.

Importing this package auto-registers all bundled broker adapters.
"""

from .alpaca import AlpacaAdapter  # noqa: F401

__all__ = ["AlpacaAdapter"]
