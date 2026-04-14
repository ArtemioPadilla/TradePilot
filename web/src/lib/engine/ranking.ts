/**
 * TradePilot Engine — Ranking Functions
 *
 * Pure TypeScript port of tradepilot/ranking.py.
 * Ranks assets for portfolio selection.
 */

import { momentum, varHistoric, getReturns } from './metrics';

/**
 * Momentum ranking: sort symbols by price momentum (highest first).
 *
 * Score(i) = P(i, latest) - P(i, latest - t)
 *
 * @param prices Map of symbol -> price array.
 * @param t      Lookback period in trading days (default 10).
 * @returns Symbols sorted by descending momentum.
 */
export function momentumRanking(prices: Map<string, number[]>, t = 10): string[] {
  const scores: { symbol: string; score: number }[] = [];
  for (const [symbol, p] of prices) {
    if (p.length < t) continue;
    scores.push({ symbol, score: momentum(p, t) });
  }
  scores.sort((a, b) => b.score - a.score);
  return scores.map(s => s.symbol);
}

/**
 * Random ranking: assign random scores to each symbol.
 * Uses a seeded PRNG for reproducibility.
 *
 * @param symbols List of symbols.
 * @param seed    Optional seed for reproducibility.
 * @returns Symbols in random order.
 */
export function randomRanking(symbols: string[], seed?: number): string[] {
  let s = seed ?? Date.now();
  function rng(): number {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  }
  const scored = symbols.map(sym => ({ symbol: sym, score: rng() }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.symbol);
}

/**
 * VaR ranking: sort symbols by historic VaR (lowest risk first).
 *
 * Lower VaR = less risky = ranked first.
 *
 * @param prices Map of symbol -> price array.
 * @param t      Number of past periods for VaR (0 = all).
 * @param level  Percentile level (default 5).
 * @returns Symbols sorted by ascending VaR (safest first).
 */
export function varRanking(prices: Map<string, number[]>, t = 100, level = 5): string[] {
  const scores: { symbol: string; score: number }[] = [];
  for (const [symbol, p] of prices) {
    const returns = getReturns(p);
    if (returns.length === 0) continue;
    scores.push({ symbol, score: varHistoric(returns, t, level) });
  }
  // ascending — lowest VaR (least risky) first
  scores.sort((a, b) => a.score - b.score);
  return scores.map(s => s.symbol);
}
