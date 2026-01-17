Backtest Module
===============

.. automodule:: tradepilot.backtest
   :members:
   :undoc-members:
   :show-inheritance:
   :special-members: __init__

Classes
-------

Backtest
^^^^^^^^

The main backtesting class for running historical simulations.

.. code-block:: python

   from tradepilot.backtest import Backtest

   backtest = Backtest(
       universe=data,
       strategy=my_strategy,
       initial_capital=100000,
       risk_free=0.02
   )
   backtest.run(start="2020-01-01", end="2024-01-01")
   results = backtest.evaluate()

See :doc:`../guides/backtesting` for detailed usage guide.
