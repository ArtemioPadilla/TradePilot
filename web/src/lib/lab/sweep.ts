/**
 * TradePilot Lab — Parameter Sweep (Phase 3)
 *
 * Builds the config grid for the Lab's Sweep mode: 1 or 2 numeric axes
 * over a base BacktestConfig, capped by a hard run budget (spec §3:
 * "max 200 combinations with a pre-launch count warning").
 *
 * Pure functions, no external dependencies. Sweep execution is the
 * pool's job (see ./pool); this module only produces configs, labels,
 * and per-cell summaries for the heatmap.
 */

import type { BacktestConfig, BacktestResultV2 } from '@/lib/engine/types';
import { finiteOrZero } from './finite';

// ---------------------------------------------------------------------------
// Axes & grid
// ---------------------------------------------------------------------------

/** Numeric BacktestConfig parameters that can be swept. */
export type SweepParam = 't' | 'topN' | 'rebalanceFreq' | 'window';

/** One sweep dimension: a parameter and the explicit values to try. */
export interface SweepAxis {
  param: SweepParam;
  values: number[];
}

/** Hard cap on total sweep combinations (spec §3). */
export const SWEEP_BUDGET = 200;

/** Hard cap on values produced by a single parsed range spec. */
export const MAX_RANGE_VALUES = 100;

/** Grid produced by {@link buildSweepGrid}. */
export interface SweepGrid {
  /** One config per grid cell, row-major (first axis outermost). */
  configs: BacktestConfig[];
  /**
   * labels[i] holds the per-axis value strings for configs[i], aligned
   * with the `axes` argument order (length 1 or 2).
   */
  labels: string[][];
}

/**
 * Total number of grid cells for the given axes.
 * Returns 0 when no axes are provided (nothing to sweep).
 */
export function countCombinations(axes: SweepAxis[]): number {
  if (axes.length === 0) return 0;
  return axes.reduce((acc, axis) => acc * axis.values.length, 1);
}

/**
 * Cartesian product of 1 or 2 sweep axes over a base config.
 *
 * Each output config is a shallow copy of `base` with the axis parameters
 * overridden; `base` is never mutated. Ordering is row-major: the first
 * axis varies slowest, the second fastest — matching a heatmap laid out
 * as rows = axis 0, columns = axis 1.
 *
 * @throws Error when axes.length is not 1 or 2, an axis has no values,
 *   both axes target the same parameter, or the grid exceeds
 *   {@link SWEEP_BUDGET}.
 */
export function buildSweepGrid(base: BacktestConfig, axes: SweepAxis[]): SweepGrid {
  if (axes.length < 1 || axes.length > 2) {
    throw new Error(`Sweep requires 1 or 2 axes, got ${axes.length}`);
  }
  for (const axis of axes) {
    if (axis.values.length === 0) {
      throw new Error(`Sweep axis "${axis.param}" has no values`);
    }
  }
  const first = axes[0]!;
  const second = axes.length === 2 ? axes[1]! : null;
  if (second && second.param === first.param) {
    throw new Error(`Sweep axes must target different parameters (both are "${first.param}")`);
  }
  const total = countCombinations(axes);
  if (total > SWEEP_BUDGET) {
    throw new Error(`Sweep of ${total} combinations exceeds the budget of ${SWEEP_BUDGET}`);
  }

  const configs: BacktestConfig[] = [];
  const labels: string[][] = [];
  for (const v0 of first.values) {
    if (second) {
      for (const v1 of second.values) {
        const config: BacktestConfig = { ...base };
        config[first.param] = v0;
        config[second.param] = v1;
        configs.push(config);
        labels.push([String(v0), String(v1)]);
      }
    } else {
      const config: BacktestConfig = { ...base };
      config[first.param] = v0;
      configs.push(config);
      labels.push([String(v0)]);
    }
  }
  return { configs, labels };
}

// ---------------------------------------------------------------------------
// Range spec parsing
// ---------------------------------------------------------------------------

const RANGE_RE = /^(-?\d+(?:\.\d+)?)\.\.(-?\d+(?:\.\d+)?)(?::(-?\d+(?:\.\d+)?))?$/;

/** Round away float-step accumulation noise (e.g. 0.30000000000000004). */
function snap(n: number): number {
  return Math.round(n * 1e9) / 1e9;
}

/**
 * Parse a sweep-axis value spec into a sorted, deduplicated number list.
 *
 * Supported forms:
 * - `"5..30"`    — inclusive range, step 1
 * - `"5..30:5"`  — inclusive range with explicit step
 * - `"3,5,8"`    — explicit comma-separated list (a single number is a
 *                  one-element list)
 *
 * @throws Error on an empty spec, non-numeric tokens, end < start,
 *   non-positive step, or more than {@link MAX_RANGE_VALUES} values.
 */
export function parseRange(spec: string): number[] {
  const trimmed = spec.trim();
  if (trimmed === '') {
    throw new Error('Empty range spec');
  }

  let values: number[];
  const match = RANGE_RE.exec(trimmed);
  if (match) {
    const start = Number(match[1]);
    const end = Number(match[2]);
    const step = match[3] !== undefined ? Number(match[3]) : 1;
    if (step <= 0) {
      throw new Error(`Range step must be positive in "${trimmed}"`);
    }
    if (end < start) {
      throw new Error(`Range end must be >= start in "${trimmed}"`);
    }
    // 1e-9 tolerance keeps float steps like 0.1 from dropping the endpoint.
    const count = Math.floor((end - start) / step + 1e-9) + 1;
    if (count > MAX_RANGE_VALUES) {
      throw new Error(`Range "${trimmed}" produces ${count} values (max ${MAX_RANGE_VALUES})`);
    }
    values = Array.from({ length: count }, (_, i) => snap(start + i * step));
  } else {
    values = trimmed.split(',').map(part => {
      const token = part.trim();
      const n = Number(token);
      if (token === '' || !Number.isFinite(n)) {
        throw new Error(`Invalid number "${token}" in range spec "${trimmed}"`);
      }
      return n;
    });
  }

  const unique = [...new Set(values)].sort((a, b) => a - b);
  if (unique.length > MAX_RANGE_VALUES) {
    throw new Error(`Range spec "${trimmed}" produces ${unique.length} values (max ${MAX_RANGE_VALUES})`);
  }
  return unique;
}

// ---------------------------------------------------------------------------
// Heatmap cell summary
// ---------------------------------------------------------------------------

/** The three metrics a sweep heatmap cell can color by. */
export interface SweepCellSummary {
  sharpe: number;
  annualizedReturn: number;
  maxDrawdown: number;
}

/**
 * Extract the heatmap metrics from a completed run.
 * Non-finite values (NaN, ±Infinity) are coerced to 0 so cells always
 * render and JSON-serialize.
 */
export function sweepCellSummary(result: BacktestResultV2): SweepCellSummary {
  return {
    sharpe: finiteOrZero(result.metrics.sharpeRatio),
    annualizedReturn: finiteOrZero(result.metrics.annualizedReturn),
    maxDrawdown: finiteOrZero(result.metrics.maxDrawdown),
  };
}
