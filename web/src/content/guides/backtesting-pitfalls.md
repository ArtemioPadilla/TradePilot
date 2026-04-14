# Backtesting Pitfalls

Backtesting is an essential tool for evaluating trading strategies, but flawed backtests produce misleading results. A strategy that looks spectacular on historical data can fail completely in live markets. Understanding common pitfalls helps you build backtests that give honest, actionable results.

## Survivorship Bias

Survivorship bias occurs when a backtest only uses data from assets that still exist today, excluding those that were delisted, went bankrupt, or were acquired. This systematically inflates backtest performance because the failures are invisible.

**Example**: Testing a stock-picking strategy on today's S&P 500 constituents ignores the companies that were removed from the index over your test period. Many of those companies were removed precisely because they performed poorly, and excluding them makes your strategy appear more successful than it actually was.

**How to avoid it**: Use point-in-time datasets that include delisted securities. When testing on an index, use the historical constituent list as of each rebalancing date rather than the current list. If point-in-time data is unavailable, acknowledge the bias and discount your results accordingly.

## Overfitting

Overfitting happens when a strategy is tuned so precisely to historical data that it captures noise rather than genuine market patterns. An overfitted strategy has too many parameters, each calibrated to past quirks that are unlikely to repeat.

**Warning signs**: A strategy with five or more tuned parameters, results that degrade sharply when parameters change by small amounts, or a backtest that performs dramatically better than any reasonable economic explanation would justify.

**How to avoid it**: Keep strategies simple with as few parameters as possible. Use out-of-sample testing by splitting your data into a training period and a separate validation period that the strategy has never seen. Walk-forward analysis extends this by repeatedly re-optimizing on a rolling window and testing on the next unseen period. Apply a healthy skepticism to strategies with Sharpe ratios above 2.0 in backtests, as very few strategies sustain such performance in live trading.

## Lookahead Bias

Lookahead bias occurs when a backtest accidentally uses information that would not have been available at the time a trade was made. This is one of the most insidious errors because the code may look correct on the surface.

**Common causes**: Using a closing price to make a decision that had to be made before the close. Incorporating earnings data on the announcement date when the data was only available the following day. Calculating a signal using the full dataset rather than only the data available up to each point in time.

**How to avoid it**: Ensure every signal, indicator, and data point used at time T is computed exclusively from data available at or before time T. Lag your data inputs by at least one period when in doubt. Review your data pipeline carefully for any implicit use of future information, particularly in feature engineering for machine learning models.

## Additional Pitfalls

**Transaction costs and slippage**: A strategy that trades frequently can see its edge entirely consumed by commissions, bid-ask spreads, and market impact. Always model realistic transaction costs in your backtest.

**Selection bias**: Running hundreds of strategy variations and only reporting the best result is a form of data mining. The more strategies you test, the more likely one is to look good by chance. Adjust your confidence thresholds for the number of tests conducted.

**Regime changes**: Markets evolve. Regulatory changes, new market participants, and shifts in monetary policy can alter the dynamics that a historical backtest relied upon. No amount of historical testing guarantees future performance.

## Building Trustworthy Backtests

The antidote to these pitfalls is intellectual honesty. Use point-in-time data, test out of sample, model realistic costs, keep strategies simple, and always ask whether the results can be explained by a plausible economic mechanism rather than statistical coincidence.
