Data Module
===========

.. automodule:: tradepilot.data
   :members:
   :undoc-members:
   :show-inheritance:
   :special-members: __init__

Classes
-------

MarketData
^^^^^^^^^^

Class for retrieving market data from various sources.

.. code-block:: python

   from tradepilot.data import MarketData

   market_data = MarketData()

   # Get data for a single ticker
   data = market_data.get_historical_data("AAPL", "2020-01-01", "2024-01-01")

   # Get data for multiple tickers
   data = market_data.get_historical_data(
       ["AAPL", "MSFT", "GOOGL"],
       "2020-01-01",
       "2024-01-01"
   )

OpenData
^^^^^^^^

Class for accessing open data sources and alternative data.

.. code-block:: python

   from tradepilot.data import OpenData

   open_data = OpenData()

   # Get economic indicators
   gdp = open_data.get_economic_data("GDP")
