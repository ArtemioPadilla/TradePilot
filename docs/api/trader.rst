Trader Module
=============

.. automodule:: tradepilot.trader
   :members:
   :undoc-members:
   :show-inheritance:

Classes
-------

TPT (TradePilot Trader)
^^^^^^^^^^^^^^^^^^^^^^^

The live trading module for executing strategies with real brokers.

.. code-block:: python

   from tradepilot.trader import TPT

   trader = TPT(
       broker_api="alpaca",
       universe=universe,
       strategy=momentum_strategy,
       capital=10000
   )

   # Get account info
   account = trader.get_account_info()

   # Execute rebalance
   trader.rebalance()

   # Run continuously
   trader.run(schedule="daily")

Methods
-------

get_account_info
^^^^^^^^^^^^^^^^

Returns current account status and balances.

get_positions
^^^^^^^^^^^^^

Returns list of current positions with P&L.

place_order
^^^^^^^^^^^

Place a new order (market, limit, stop, etc.).

cancel_order
^^^^^^^^^^^^

Cancel an open order by ID.

close_position
^^^^^^^^^^^^^^

Close a specific position.

close_all_positions
^^^^^^^^^^^^^^^^^^^

Liquidate entire portfolio.

rebalance
^^^^^^^^^

Execute one rebalancing cycle based on strategy signals.

run
^^^

Start continuous trading with scheduled rebalancing.

See :doc:`../guides/live-trading` for detailed usage guide.
