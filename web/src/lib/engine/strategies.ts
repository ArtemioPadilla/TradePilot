/**
 * TradePilot Engine — Trading Strategies
 *
 * Pure TypeScript port of strategies/momentum.py, mean_reversion.py, smart_beta.py.
 */

import { getReturns } from './metrics';

/**
 * Momentum Strategy: select assets with the strongest recent price momentum.
 *
 * Momentum(i) = P(i, latest) - P(i, latest - t)
 * Returns symbols sorted by descending momentum.
 *
 * @param prices Map of symbol -> price array.
 * @param t Lookback period in trading days (default 10).
 */
export function momentumStrategy(prices: Map<string, number[]>, t = 10): string[] {
  const scores: { symbol: string; score: number }[] = [];

  for (const [symbol, p] of prices) {
    if (p.length < t) continue;
    const score = p[p.length - 1] - p[p.length - t];
    scores.push({ symbol, score });
  }

  scores.sort((a, b) => b.score - a.score);
  return scores.map(s => s.symbol);
}

/**
 * Mean Reversion Strategy: select assets trading furthest below their moving average.
 *
 * Deviation(i) = P(i, latest) - SMA(i, t)
 * Returns symbols sorted by ascending deviation (most oversold first).
 *
 * @param prices Map of symbol -> price array.
 * @param t Window size for the moving average (default 20).
 */
export function meanReversionStrategy(prices: Map<string, number[]>, t = 20): string[] {
  const scores: { symbol: string; score: number }[] = [];

  for (const [symbol, p] of prices) {
    if (p.length < t) continue;
    const window = p.slice(-t);
    const sma = window.reduce((a, b) => a + b, 0) / t;
    const deviation = p[p.length - 1] - sma;
    scores.push({ symbol, score: deviation });
  }

  // Ascending — most oversold (most negative deviation) first
  scores.sort((a, b) => a.score - b.score);
  return scores.map(s => s.symbol);
}

/**
 * Smart Beta Strategy: select assets with the best risk-adjusted returns (mean/std).
 *
 * SmartBeta(i) = mean(R_i) / std(R_i)
 * Returns symbols sorted by descending score.
 *
 * @param prices Map of symbol -> price array.
 */
export function smartBetaStrategy(prices: Map<string, number[]>): string[] {
  const scores: { symbol: string; score: number }[] = [];

  for (const [symbol, p] of prices) {
    const returns = getReturns(p);
    if (returns.length === 0) continue;

    const n = returns.length;
    const meanR = returns.reduce((a, b) => a + b, 0) / n;
    const stdR = Math.sqrt(
      returns.reduce((acc, r) => acc + (r - meanR) ** 2, 0) / n,
    );

    scores.push({
      symbol,
      score: stdR === 0 ? 0 : meanR / stdR,
    });
  }

  scores.sort((a, b) => b.score - a.score);
  return scores.map(s => s.symbol);
}
