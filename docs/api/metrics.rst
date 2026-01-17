Metrics Module
==============

.. automodule:: tradepilot.metrics
   :members:
   :undoc-members:
   :show-inheritance:

Functions
---------

calculate_metrics
^^^^^^^^^^^^^^^^^

Calculate comprehensive performance metrics for a return series.

.. code-block:: python

   from tradepilot.metrics import calculate_metrics

   metrics = calculate_metrics(
       returns=portfolio_returns,
       risk_free_rate=0.02
   )

   print(f"Sharpe Ratio: {metrics['sharpe_ratio']:.2f}")
   print(f"Max Drawdown: {metrics['max_drawdown']:.2%}")

Available Metrics
-----------------

Return Metrics
^^^^^^^^^^^^^^

- **total_return**: Cumulative return over the period
- **annualized_return**: Return annualized to yearly basis
- **monthly_returns**: Returns grouped by month

Risk Metrics
^^^^^^^^^^^^

- **volatility**: Annualized standard deviation
- **max_drawdown**: Maximum peak-to-trough decline
- **max_drawdown_duration**: Longest drawdown period
- **var_95**: Value at Risk at 95% confidence

Risk-Adjusted Metrics
^^^^^^^^^^^^^^^^^^^^^

- **sharpe_ratio**: Return per unit of risk
- **sortino_ratio**: Return per unit of downside risk
- **calmar_ratio**: Annualized return / max drawdown
- **information_ratio**: Active return / tracking error

Trade Metrics
^^^^^^^^^^^^^

- **win_rate**: Percentage of profitable trades
- **profit_factor**: Gross profit / gross loss
- **average_trade**: Average P&L per trade
