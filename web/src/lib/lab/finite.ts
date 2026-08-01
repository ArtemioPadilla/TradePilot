/**
 * TradePilot Lab — Numeric Coercion Helper (Phase 3)
 *
 * Lab surfaces (heatmaps, compare tables, walk-forward summaries) must be
 * JSON-serializable and chart-safe. Engine metrics can legitimately be
 * non-finite (e.g. profitFactor = +Infinity when there are no losing
 * periods), so every value that leaves the Lab goes through this coercion.
 */

/** Return `n` if it is a finite number, otherwise 0. */
export function finiteOrZero(n: number): number {
  return Number.isFinite(n) ? n : 0;
}
