/**
 * TradePilot Lab — Test Fixtures (Phase 3)
 *
 * Hand-built BacktestConfig / BacktestResultV2 factories. No network,
 * no engine execution — metric values are set explicitly per test.
 */

import type { BacktestConfig, BacktestResultV2, ExtendedMetrics } from '@/lib/engine/types';

export const BASE_CONFIG: BacktestConfig = {
  symbols: ['AAA', 'BBB', 'CCC', 'DDD'],
  strategy: 'momentum',
  optimizer: 'EW',
  startDate: '2022-01-01',
  endDate: '2024-01-01',
  initialCapital: 10_000,
  rebalanceFreq: 21,
  topN: 2,
  riskFreeRate: 0.04,
  window: 60,
  t: 10,
};

const BASE_METRICS: ExtendedMetrics = {
  annualizedReturn: 0.1,
  annualizedVol: 0.15,
  sharpeRatio: 0.8,
  sortinoRatio: 1.1,
  maxDrawdown: -0.2,
  alpha: 0.01,
  cvar: -0.03,
  skewness: 0.1,
  kurtosis: 3,
  winRate: 0.55,
  profitFactor: 1.4,
  calmarRatio: 0.5,
  avgWin: 0.01,
  avgLoss: -0.008,
};

export interface CurveFixture {
  dates: string[];
  values: number[];
}

/** Build a BacktestResultV2 with metric overrides and an optional curve. */
export function makeResult(
  metricOverrides: Partial<ExtendedMetrics> = {},
  curve: CurveFixture = { dates: ['2024-01-01'], values: [10_000] },
): BacktestResultV2 {
  return {
    dates: [...curve.dates],
    portfolioValues: [...curve.values],
    weights: [],
    trades: [],
    metrics: { ...BASE_METRICS, ...metricOverrides },
    monthlyReturns: [],
    topDrawdowns: [],
    benchmarkValues: null,
    benchmarkDates: null,
  };
}
