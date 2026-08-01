/**
 * Persisting engine runs to the `backtests` table — shared by the single-run
 * page and the Lab (JSONB-safe serialization in one place).
 */
import { provideRepos } from '@/lib/data/supabase';
import type { BacktestConfig, BacktestResultV2 } from '@/lib/engine/types';

/** JSONB-safe: Infinity/NaN → null (Postgres jsonb rejects them as numbers). */
export function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_k, v) => (typeof v === 'number' && !Number.isFinite(v) ? null : v)),
  ) as T;
}

export interface CurvePoint {
  date: string;
  portfolio: number;
  benchmark?: number;
}

/** Downsample long daily series so charts and JSONB rows stay lean. */
export function sampleCurve(
  dates: string[],
  values: number[],
  benchmark: number[] | null,
  max = 400,
): CurvePoint[] {
  const step = Math.max(1, Math.ceil(dates.length / max));
  const rows: CurvePoint[] = [];
  for (let i = 0; i < dates.length; i += step) {
    const row: CurvePoint = {
      date: dates[i]!,
      portfolio: Math.round(values[i]! * 100) / 100,
    };
    if (benchmark && benchmark[i] != null) row.benchmark = Math.round(benchmark[i]! * 100) / 100;
    rows.push(row);
  }
  return rows;
}

/** Insert one run. Extra metrics context (monthly, drawdowns) rides along. */
export async function saveBacktestRun(
  config: BacktestConfig,
  result: BacktestResultV2,
  opts: { isPublic?: boolean; strategyId?: string | null } = {},
): Promise<void> {
  await provideRepos().backtests.create({
    config: jsonSafe(config) as never,
    metrics: jsonSafe({
      ...result.metrics,
      monthlyReturns: result.monthlyReturns,
      topDrawdowns: result.topDrawdowns,
    }) as never,
    equity_curve: jsonSafe(
      sampleCurve(result.dates, result.portfolioValues, result.benchmarkValues, 1000),
    ) as never,
    is_public: opts.isPublic ?? false,
    strategy_id: opts.strategyId ?? null,
  });
}

/** Restrict a priceMap to [start, end] — lets sweeps/walk-forward reuse one download. */
export function slicePriceMap(
  priceMap: Map<string, { dates: string[]; prices: number[] }>,
  start: string,
  end: string,
): Map<string, { dates: string[]; prices: number[] }> {
  const out = new Map<string, { dates: string[]; prices: number[] }>();
  for (const [sym, pd] of priceMap) {
    const dates: string[] = [];
    const prices: number[] = [];
    for (let i = 0; i < pd.dates.length; i++) {
      const d = pd.dates[i]!;
      if (d >= start && d <= end) {
        dates.push(d);
        prices.push(pd.prices[i]!);
      }
    }
    if (dates.length > 0) out.set(sym, { dates, prices });
  }
  return out;
}
