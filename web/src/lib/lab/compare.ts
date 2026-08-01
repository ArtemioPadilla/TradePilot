/**
 * TradePilot Lab — Compare Mode (Phase 3)
 *
 * Shapes N backtest results into the Compare view's two surfaces
 * (spec §3: "side-by-side metrics table + overlaid curves"):
 * - buildCompareRows(): one DataTable row per successful run with the
 *   8 headline metrics, finite-coerced.
 * - alignCurves(): merges daily equity curves onto a union date axis
 *   (Recharts-friendly rows), forward-filling gaps and downsampling.
 *
 * Failed runs (null results) are skipped in both, but `color` / label
 * indices stay tied to the ORIGINAL input index so series colors remain
 * stable whether or not earlier runs failed.
 */

import type { BacktestResultV2 } from '@/lib/engine/types';
import { finiteOrZero } from './finite';

// ---------------------------------------------------------------------------
// Metrics table
// ---------------------------------------------------------------------------

/** The 8 headline metrics shown in the Compare table, in display order. */
export const COMPARE_METRICS = [
  'annualizedReturn',
  'annualizedVol',
  'sharpeRatio',
  'sortinoRatio',
  'maxDrawdown',
  'calmarRatio',
  'winRate',
  'profitFactor',
] as const;

export type CompareMetric = (typeof COMPARE_METRICS)[number];

export interface CompareRow {
  label: string;
  /** Keyed by {@link COMPARE_METRICS}; every value is finite. */
  metrics: Record<string, number>;
  /** Original input index — stable color assignment across failures. */
  color: number;
}

/**
 * Resolve display labels for the non-null result slots, keeping labels
 * unique (a duplicate gets its 1-based run number appended) and falling
 * back to "Run N" when the labels array is short or has empty entries.
 */
function resolveLabels(labels: string[], results: (BacktestResultV2 | null)[]): Map<number, string> {
  const resolved = new Map<number, string>();
  const used = new Set<string>();
  results.forEach((result, i) => {
    if (!result) return;
    const raw = labels[i]?.trim();
    const base = raw !== undefined && raw !== '' ? raw : `Run ${i + 1}`;
    const label = used.has(base) ? `${base} (${i + 1})` : base;
    used.add(label);
    resolved.set(i, label);
  });
  return resolved;
}

/**
 * Build one table row per successful result. Non-finite metric values
 * (e.g. profitFactor = Infinity when a run has no losing periods) are
 * coerced to 0 so rows sort, render, and JSON-serialize predictably.
 */
export function buildCompareRows(
  labels: string[],
  results: (BacktestResultV2 | null)[],
): CompareRow[] {
  const resolved = resolveLabels(labels, results);
  const rows: CompareRow[] = [];
  results.forEach((result, i) => {
    if (!result) return;
    const metrics: Record<string, number> = {};
    for (const key of COMPARE_METRICS) {
      metrics[key] = finiteOrZero(result.metrics[key]);
    }
    rows.push({ label: resolved.get(i)!, metrics, color: i });
  });
  return rows;
}

// ---------------------------------------------------------------------------
// Overlaid curves
// ---------------------------------------------------------------------------

/** Default maximum chart points after downsampling. */
export const DEFAULT_MAX_POINTS = 400;

/**
 * Merge equity curves onto the union of all trading dates, one row per
 * date: `{ date, [label]: portfolioValue, ... }` — the shape Recharts
 * expects for a multi-series line chart.
 *
 * - Missing dates within a series are carried forward (last value).
 * - Dates before a series' first observation omit that series' key.
 * - Rows are downsampled to at most `maxPoints` (default 400), always
 *   keeping the first and last date.
 * - Null results are skipped; labels resolve exactly as in
 *   {@link buildCompareRows} so table rows and chart series match.
 */
export function alignCurves(
  results: (BacktestResultV2 | null)[],
  labels: string[],
  maxPoints: number = DEFAULT_MAX_POINTS,
): Record<string, unknown>[] {
  const resolved = resolveLabels(labels, results);
  const series: { label: string; byDate: Map<string, number> }[] = [];
  const dateSet = new Set<string>();

  results.forEach((result, i) => {
    if (!result) return;
    const byDate = new Map<string, number>();
    for (let j = 0; j < result.dates.length; j++) {
      const date = result.dates[j];
      const value = result.portfolioValues[j];
      if (date !== undefined && value !== undefined && Number.isFinite(value)) {
        byDate.set(date, value);
        dateSet.add(date);
      }
    }
    series.push({ label: resolved.get(i)!, byDate });
  });

  const dates = [...dateSet].sort();
  const lastSeen = new Map<string, number>();
  const rows: Record<string, unknown>[] = [];
  for (const date of dates) {
    const row: Record<string, unknown> = { date };
    for (const s of series) {
      const value = s.byDate.get(date);
      if (value !== undefined) lastSeen.set(s.label, value);
      const carried = lastSeen.get(s.label);
      if (carried !== undefined) row[s.label] = carried;
    }
    rows.push(row);
  }

  return downsample(rows, maxPoints);
}

/**
 * Evenly downsample to at most `maxPoints` rows, always keeping the
 * first and last. `maxPoints` is clamped to a minimum of 2.
 */
function downsample<T>(rows: T[], maxPoints: number): T[] {
  const cap = Math.max(2, Math.floor(maxPoints));
  if (rows.length <= cap) return rows;
  const step = (rows.length - 1) / (cap - 1);
  const out: T[] = [];
  for (let k = 0; k < cap; k++) {
    // step > 1 here, so consecutive rounded indices are always distinct.
    out.push(rows[Math.round(k * step)]!);
  }
  return out;
}
