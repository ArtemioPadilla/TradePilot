/**
 * TradePilot Engine — Extended Analytics (Phase 2)
 *
 * Pure functions over return / value series: trade-quality ratios,
 * calendar-month returns, and drawdown episode extraction.
 * No external dependencies — plain arrays in, plain objects out.
 */

import type { DrawdownPeriod, MonthlyReturn } from './types';

// ---------------------------------------------------------------------------
// Trade-quality ratios
// ---------------------------------------------------------------------------

/**
 * Win rate: fraction of periods with a strictly positive return.
 * Returns 0 for an empty series.
 */
export function winRate(returns: number[]): number {
  if (returns.length === 0) return 0;
  const wins = returns.filter(r => r > 0).length;
  return wins / returns.length;
}

/**
 * Profit factor: sum of gains / |sum of losses|.
 *
 * - No losses and no gains (or empty series) → 0.
 * - Gains > 0 with no losses → Number.POSITIVE_INFINITY. Callers that
 *   persist to JSON must coerce (JSON.stringify renders Infinity as null).
 */
export function profitFactor(returns: number[]): number {
  let gains = 0;
  let losses = 0;
  for (const r of returns) {
    if (r > 0) gains += r;
    else if (r < 0) losses += -r;
  }
  if (losses === 0) {
    return gains > 0 ? Number.POSITIVE_INFINITY : 0;
  }
  return gains / losses;
}

/**
 * Calmar ratio: annualized return / |max drawdown|.
 * Returns 0 when max drawdown is 0 (no drawdown observed).
 *
 * @param annualizedReturn Annualized compound return (decimal).
 * @param maxDrawdown Max drawdown as a fraction, <= 0 (e.g. -0.2).
 */
export function calmarRatio(annualizedReturn: number, maxDrawdown: number): number {
  if (maxDrawdown === 0) return 0;
  return annualizedReturn / Math.abs(maxDrawdown);
}

/**
 * Average winning and losing period returns.
 *
 * - avgWin: mean of strictly positive returns (0 when none).
 * - avgLoss: mean of strictly negative returns — itself negative (0 when none).
 */
export function avgWinLoss(returns: number[]): { avgWin: number; avgLoss: number } {
  const wins = returns.filter(r => r > 0);
  const losses = returns.filter(r => r < 0);
  const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
  return { avgWin, avgLoss };
}

// ---------------------------------------------------------------------------
// Calendar-month returns
// ---------------------------------------------------------------------------

/**
 * Compound the value series into calendar-month returns.
 *
 * Each period return values[i]/values[i-1] - 1 is attributed to the month
 * of dates[i] (so a month-boundary return belongs to the later month), and
 * returns within a month are compounded. The first month therefore covers
 * only the span from the first data point onward.
 *
 * @param dates ISO date strings (YYYY-MM-DD), ascending, aligned to values.
 * @param values Portfolio value series.
 * @returns One entry per calendar month present, in chronological order.
 */
export function monthlyReturns(dates: string[], values: number[]): MonthlyReturn[] {
  const out: MonthlyReturn[] = [];
  if (dates.length < 2 || dates.length !== values.length) return out;

  let currentMonth = dates[1]!.slice(0, 7);
  let compound = 1;

  for (let i = 1; i < values.length; i++) {
    const month = dates[i]!.slice(0, 7);
    if (month !== currentMonth) {
      out.push({ month: currentMonth, return: compound - 1 });
      currentMonth = month;
      compound = 1;
    }
    if (values[i - 1] !== 0) {
      compound *= values[i]! / values[i - 1]!;
    }
  }
  out.push({ month: currentMonth, return: compound - 1 });

  return out;
}

// ---------------------------------------------------------------------------
// Drawdown episodes
// ---------------------------------------------------------------------------

/** Calendar days between two ISO dates (b - a). */
function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

function makeEpisode(
  peakDate: string,
  peakValue: number,
  troughDate: string,
  troughValue: number,
  endDate: string | null,
  lastDate: string,
): DrawdownPeriod {
  return {
    start: peakDate,
    trough: troughDate,
    end: endDate,
    depth: peakValue !== 0 ? (troughValue - peakValue) / peakValue : 0,
    lengthDays: daysBetween(peakDate, endDate ?? lastDate),
  };
}

/**
 * Extract the deepest drawdown episodes from a value series.
 *
 * An episode starts at a running peak, deepens to its trough, and ends on
 * the first date the value recovers to (>=) the prior peak. If the series
 * ends before recovery, the final episode has `end: null` and its
 * lengthDays is measured to the last date in the series.
 *
 * @param dates ISO date strings, ascending, aligned to values.
 * @param values Portfolio value series.
 * @param n Number of episodes to return (default 5).
 * @returns Episodes sorted by depth (most negative first), at most n.
 */
export function topDrawdowns(dates: string[], values: number[], n = 5): DrawdownPeriod[] {
  const episodes: DrawdownPeriod[] = [];
  if (dates.length === 0 || dates.length !== values.length) return episodes;

  const lastDate = dates[dates.length - 1]!;
  let peakValue = values[0]!;
  let peakDate = dates[0]!;
  let inDrawdown = false;
  let troughValue = 0;
  let troughDate = '';

  for (let i = 1; i < values.length; i++) {
    const v = values[i]!;
    if (!inDrawdown) {
      if (v >= peakValue) {
        peakValue = v;
        peakDate = dates[i]!;
      } else {
        inDrawdown = true;
        troughValue = v;
        troughDate = dates[i]!;
      }
    } else {
      if (v < troughValue) {
        troughValue = v;
        troughDate = dates[i]!;
      }
      if (v >= peakValue) {
        // Recovered to the prior peak — close the episode.
        episodes.push(makeEpisode(peakDate, peakValue, troughDate, troughValue, dates[i]!, lastDate));
        inDrawdown = false;
        peakValue = v;
        peakDate = dates[i]!;
      }
    }
  }

  if (inDrawdown) {
    episodes.push(makeEpisode(peakDate, peakValue, troughDate, troughValue, null, lastDate));
  }

  // Deepest (most negative depth) first.
  episodes.sort((a, b) => a.depth - b.depth);
  return episodes.slice(0, n);
}
