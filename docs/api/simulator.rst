Simulator Module
================

.. automodule:: tradepilot.simulator
   :members:
   :undoc-members:
   :show-inheritance:
   :special-members: __init__

Classes
-------

TPS (TradePilot Simulator)
^^^^^^^^^^^^^^^^^^^^^^^^^^

The core simulation engine for backtesting strategies.

.. code-block:: python

   from tradepilot.simulator import TPS

   simulator = TPS(
       universe=data,
       strategy=my_strategy,
       initial_capital=100000
   )

   # Run simulation
   simulator.run()

   # Get results
   equity_curve = simulator.get_equity_curve()
   trades = simulator.get_trades()

Features
--------

- Portfolio management
- Rebalancing logic
- Performance tracking
- Transaction cost modeling
- Slippage simulation
