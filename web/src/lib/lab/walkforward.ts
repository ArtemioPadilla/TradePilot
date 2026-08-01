/**
 * TradePilot Lab — Walk-Forward Analysis (Phase 3)
 *
 * Rolling train/test window construction and out-of-sample summary for
 * the Lab's Walk-forward mode (spec §3: "Rolling train/test windows →
 * out-of-sample metrics per window; overfitting detection").
 *
 * Date arithmetic is pure TypeScript over UTC calendar math — no Date.now(),
 * no timezone sensitivity, no libraries. Month addition clamps day-of-month
 * overflow (Jan 31 + 1 month = Feb 28/29, never Mar 2/3), and each window's
 * trainStart is derived from the ORIGINAL startDate (not the previous
 * window) so clamping never compounds into drift.
 */

import type { BacktestResultV2 } from '@/lib/engine/types';
import { finiteOrZero } from './finite';

// ---------------------------------------------------------------------------
// ISO date helpers (UTC, pure)
// ---------------------------------------------------------------------------

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

interface CalendarDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

function parseISO(date: string): CalendarDate {
  const match = ISO_DATE_RE.exec(date);
  if (!match) {
    throw new Error(`Invalid ISO date "${date}" (expected YYYY-MM-DD)`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // Round-trip through UTC to reject impossible dates like 2021-02-30.
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    throw new Error(`Invalid calendar date "${date}"`);
  }
  return { year, month, day };
}

function toISO(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${String(year).padStart(4, '0')}-${mm}-${dd}`;
}

/** Number of days in the given month (month is 1-12). */
function daysInMonth(year: number, month: number): number {
  // Day 0 of the NEXT month is the last day of this month.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Add calendar months to an ISO date, clamping day-of-month overflow:
 * addMonthsISO('2020-01-31', 1) === '2020-02-29' (leap year),
 * addMonthsISO('2019-01-31', 1) === '2019-02-28'.
 */
export function addMonthsISO(date: string, months: number): string {
  const { year, month, day } = parseISO(date);
  const monthIndex = year * 12 + (month - 1) + months;
  const y = Math.floor(monthIndex / 12);
  const m = ((monthIndex % 12) + 12) % 12 + 1;
  return toISO(y, m, Math.min(day, daysInMonth(y, m)));
}

/** Add days (may be negative) to an ISO date via UTC arithmetic. */
export function addDaysISO(date: string, days: number): string {
  const { year, month, day } = parseISO(date);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return toISO(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** Whole days from `from` to `to` (positive when `to` is later). */
function diffDays(from: string, to: string): number {
  const a = parseISO(from);
  const b = parseISO(to);
  const utcA = Date.UTC(a.year, a.month - 1, a.day);
  const utcB = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((utcB - utcA) / MS_PER_DAY);
}

// ---------------------------------------------------------------------------
// Window construction
// ---------------------------------------------------------------------------

/** One rolling train/test split; all bounds are inclusive ISO dates. */
export interface WalkForwardWindow {
  trainStart: string;
  trainEnd: string;
  testStart: string;
  testEnd: string;
}

/**
 * Build rolling walk-forward windows over [startDate, endDate].
 *
 * Window i:
 * - trainStart = startDate + i * testMonths (always anchored to the
 *   original start, so month-end clamping never accumulates)
 * - testStart  = trainStart + trainMonths
 * - trainEnd   = testStart - 1 day (train and test are adjacent, disjoint)
 * - testEnd    = testStart + testMonths - 1 day, capped at endDate
 *
 * The step between windows is testMonths, so consecutive test windows
 * tile the out-of-sample period without overlap. A final partial test
 * window is kept only when it covers at least half of the nominal test
 * span (measured in days: actualDays * 2 >= nominalDays).
 *
 * @throws Error on invalid dates, non-positive-integer month counts,
 *   startDate >= endDate, or when fewer than 2 windows fit.
 */
export function buildWalkForwardWindows(
  startDate: string,
  endDate: string,
  trainMonths: number,
  testMonths: number,
): WalkForwardWindow[] {
  parseISO(startDate);
  parseISO(endDate);
  if (!Number.isInteger(trainMonths) || trainMonths < 1) {
    throw new Error(`trainMonths must be a positive integer, got ${trainMonths}`);
  }
  if (!Number.isInteger(testMonths) || testMonths < 1) {
    throw new Error(`testMonths must be a positive integer, got ${testMonths}`);
  }
  if (startDate >= endDate) {
    throw new Error(`startDate "${startDate}" must be before endDate "${endDate}"`);
  }

  const windows: WalkForwardWindow[] = [];
  for (let i = 0; ; i++) {
    const trainStart = addMonthsISO(startDate, i * testMonths);
    const testStart = addMonthsISO(trainStart, trainMonths);
    if (testStart > endDate) break; // ISO strings compare chronologically
    const trainEnd = addDaysISO(testStart, -1);
    const nominalEndExclusive = addMonthsISO(testStart, testMonths);
    const nominalTestEnd = addDaysISO(nominalEndExclusive, -1);

    if (nominalTestEnd <= endDate) {
      windows.push({ trainStart, trainEnd, testStart, testEnd: nominalTestEnd });
    } else {
      const nominalDays = diffDays(testStart, nominalEndExclusive);
      const actualDays = diffDays(testStart, endDate) + 1;
      if (actualDays * 2 >= nominalDays) {
        windows.push({ trainStart, trainEnd, testStart, testEnd: endDate });
      }
      break;
    }
  }

  if (windows.length < 2) {
    throw new Error(
      `Walk-forward needs at least 2 windows; ${windows.length} fit in ` +
        `[${startDate}, ${endDate}] with train=${trainMonths}m / test=${testMonths}m`,
    );
  }
  return windows;
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

/** Per-window out-of-sample metrics (finite-coerced). */
export interface WalkForwardWindowMetrics {
  sharpe: number;
  annualizedReturn: number;
  maxDrawdown: number;
}

export interface WalkForwardSummary {
  windows: { window: WalkForwardWindow; metrics: WalkForwardWindowMetrics }[];
  /** Mean out-of-sample sharpe / annualized return across windows. */
  oosMean: { sharpe: number; annualizedReturn: number };
  /**
   * Overfitting indicator: 1 - (mean OOS sharpe / mean IS sharpe).
   * 0 = OOS as good as IS; 1 = OOS sharpe collapsed to zero; negative =
   * OOS beat IS. When the mean in-sample sharpe is zero or negative the
   * ratio is meaningless (sign flips / division by zero), so the value
   * falls back to 0 — callers should then judge from oosMean directly.
   */
  degradation: number;
}

/**
 * Summarize walk-forward runs. `inSample[i]` / `outSample[i]` must be the
 * results for `windows[i]`'s train / test period respectively.
 *
 * All metrics are finite-coerced (non-finite → 0) before averaging.
 *
 * @throws Error when array lengths disagree or windows is empty.
 */
export function summarizeWalkForward(
  inSample: BacktestResultV2[],
  outSample: BacktestResultV2[],
  windows: WalkForwardWindow[],
): WalkForwardSummary {
  if (windows.length === 0) {
    throw new Error('summarizeWalkForward requires at least one window');
  }
  if (inSample.length !== windows.length || outSample.length !== windows.length) {
    throw new Error(
      `Result/window count mismatch: ${inSample.length} in-sample, ` +
        `${outSample.length} out-of-sample, ${windows.length} windows`,
    );
  }

  const perWindow = windows.map((window, i) => {
    const metrics = outSample[i]!.metrics;
    return {
      window,
      metrics: {
        sharpe: finiteOrZero(metrics.sharpeRatio),
        annualizedReturn: finiteOrZero(metrics.annualizedReturn),
        maxDrawdown: finiteOrZero(metrics.maxDrawdown),
      },
    };
  });

  const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
  const oosSharpe = mean(perWindow.map(w => w.metrics.sharpe));
  const oosReturn = mean(perWindow.map(w => w.metrics.annualizedReturn));
  const isSharpe = mean(inSample.map(r => finiteOrZero(r.metrics.sharpeRatio)));

  return {
    windows: perWindow,
    oosMean: { sharpe: oosSharpe, annualizedReturn: oosReturn },
    degradation: isSharpe > 0 ? 1 - oosSharpe / isSharpe : 0,
  };
}
