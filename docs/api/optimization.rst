Optimization Module
===================

.. automodule:: tradepilot.optimization
   :members:
   :undoc-members:
   :show-inheritance:

Functions
---------

optimize_portfolio
^^^^^^^^^^^^^^^^^^

Main optimization function supporting multiple methods.

.. code-block:: python

   from tradepilot.optimization import optimize_portfolio

   # Maximum Sharpe Ratio
   weights = optimize_portfolio(
       returns=returns,
       method="msr",
       risk_free_rate=0.02
   )

   # Global Minimum Variance
   weights = optimize_portfolio(
       returns=returns,
       method="gmv"
   )

   # With constraints
   weights = optimize_portfolio(
       returns=returns,
       method="msr",
       min_weight=0.05,
       max_weight=0.40
   )

Optimization Methods
--------------------

MSR (Maximum Sharpe Ratio)
^^^^^^^^^^^^^^^^^^^^^^^^^^

Optimizes portfolio weights to maximize the Sharpe ratio.

GMV (Global Minimum Variance)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Optimizes portfolio weights to minimize volatility.

Risk Parity
^^^^^^^^^^^

Allocates weights so each asset contributes equally to portfolio risk.

See :doc:`../guides/optimization` for detailed usage guide.
