Portfolios Module
=================

.. automodule:: tradepilot.portfolios
   :members:
   :undoc-members:
   :show-inheritance:

Classes
-------

Portfolio
^^^^^^^^^

Class for evaluating portfolio performance and characteristics.

.. code-block:: python

   from tradepilot.portfolios import Portfolio

   portfolio = Portfolio(
       holdings=holdings_df,
       prices=prices_df
   )

   # Get portfolio metrics
   metrics = portfolio.evaluate()

   # Get allocation breakdown
   allocation = portfolio.get_allocation()

PortfolioTracker
^^^^^^^^^^^^^^^^

Class for tracking portfolio changes over time.

.. code-block:: python

   from tradepilot.portfolios import PortfolioTracker

   tracker = PortfolioTracker()

   # Record snapshots
   tracker.record_snapshot(date, holdings, prices)

   # Get history
   history = tracker.get_history()
