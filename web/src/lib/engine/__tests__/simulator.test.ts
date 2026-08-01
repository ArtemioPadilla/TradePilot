/**
 * TradePilot Engine — Simulator Tests (Phase 2)
 *
 * Uses a tiny synthetic price map (3 symbols + SPY, 30 dates,
 * deterministic linear prices) so behavior is fully predictable:
 *   AAA: 100 + 1.0*i  (strongest momentum -> always selected)
 *   BBB: 100 + 0.5*i  (second strongest  -> always selected)
 *   CCC: 100 - 0.2*i  (falling           -> never in top 2)
 *   SPY: 100 + 0.3*i  (benchmark only, not in the universe)
 */

import { describe, it, expect } from 'vitest';
import { BacktestEngine } from '../simulator';
import { runBacktest } from '../runBacktest';
import type { BacktestConfig, PriceData } from '../types';

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const N_DAYS = 30;

/** 2024-01-01 .. 2024-01-30 — 30 consecutive dates, all in one month. */
function makeDates(n: number): string[] {
  const out: string[] = [];
  for (let i = 1; i <= n; i++) {
    out.push(`2024-01-${String(i).padStart(2, '0')}`);
  }
  return out;
}

function linearPrices(start: number, slope: number, n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(start + slope * i);
  return out;
}

function makePriceMap(includeSpy: boolean): Map<string, PriceData> {
  const dates = makeDates(N_DAYS);
  const map = new Map<string, PriceData>([
    ['AAA', { dates, prices: linearPrices(100, 1.0, N_DAYS) }],
    ['BBB', { dates, prices: linearPrices(100, 0.5, N_DAYS) }],
    ['CCC', { dates, prices: linearPrices(100, -0.2, N_DAYS) }],
  ]);
  if (includeSpy) {
    map.set('SPY', { dates, prices: linearPrices(100, 0.3, N_DAYS) });
  }
  return map;
}

const baseConfig: BacktestConfig = {
  symbols: ['AAA', 'BBB', 'CCC'],
  strategy: 'momentum',
  optimizer: 'EW',
  startDate: '2024-01-01',
  endDate: '2024-01-30',
  initialCapital: 10000,
  rebalanceFreq: 5,
  topN: 2,
  riskFreeRate: 0.02,
  window: 10,
  t: 3,
};

// ---------------------------------------------------------------------------
// Daily valuation
// ---------------------------------------------------------------------------

describe('BacktestEngine.run (daily valuation)', () => {
  it('produces one value per trading date in [startDate, endDate]', () => {
    const engine = new BacktestEngine(baseConfig, makePriceMap(true));
    const result = engine.run();

    // All 30 fixture dates fall inside the window.
    expect(result.dates).toHaveLength(N_DAYS);
    expect(result.portfolioValues).toHaveLength(N_DAYS);
    expect(result.dates[0]).toBe('2024-01-01');
    expect(result.dates[N_DAYS - 1]).toBe('2024-01-30');

    // Day 0 has no positions yet (momentum needs t=3 points) -> initial capital.
    expect(result.portfolioValues[0]).toBe(10000);

    // Rising universe + long-only portfolio -> final value above initial.
    expect(result.portfolioValues[N_DAYS - 1]).toBeGreaterThan(10000);
  });

  it('respects a narrower date window', () => {
    const config = { ...baseConfig, startDate: '2024-01-10', endDate: '2024-01-20' };
    const result = new BacktestEngine(config, makePriceMap(true)).run();
    // 2024-01-10 .. 2024-01-20 inclusive = 11 trading dates.
    expect(result.dates).toHaveLength(11);
  });
});

// ---------------------------------------------------------------------------
// Transaction costs
// ---------------------------------------------------------------------------

describe('BacktestEngine.run (transaction costs)', () => {
  it('reduces final value versus a zero-cost run', () => {
    const free = new BacktestEngine(baseConfig, makePriceMap(true)).run();
    const costly = new BacktestEngine(
      { ...baseConfig, costs: { costBps: 50, slippageBps: 50 } },
      makePriceMap(true),
    ).run();

    const freeFinal = free.portfolioValues[free.portfolioValues.length - 1];
    const costlyFinal = costly.portfolioValues[costly.portfolioValues.length - 1];

    expect(costlyFinal).toBeLessThan(freeFinal!);
    // The initial buy alone turns over ~100% of capital at 100bps total,
    // so the drag must be at least roughly 1% of initial capital.
    expect(freeFinal! - costlyFinal!).toBeGreaterThan(50);
  });

  it('explicit zero-cost config matches the no-cost default', () => {
    const a = new BacktestEngine(baseConfig, makePriceMap(true)).run();
    const b = new BacktestEngine(
      { ...baseConfig, costs: { costBps: 0, slippageBps: 0 } },
      makePriceMap(true),
    ).run();
    expect(b.portfolioValues).toEqual(a.portfolioValues);
  });
});

// ---------------------------------------------------------------------------
// Benchmark
// ---------------------------------------------------------------------------

describe('BacktestEngine.run (benchmark)', () => {
  it('produces a buy-and-hold SPY series when SPY data is present', () => {
    const result = new BacktestEngine(baseConfig, makePriceMap(true)).run();

    expect(result.benchmarkValues).not.toBeNull();
    expect(result.benchmarkDates).not.toBeNull();
    expect(result.benchmarkValues).toHaveLength(N_DAYS);
    expect(result.benchmarkDates).toEqual(result.dates);

    // Buy-and-hold: qty = 10000 / 100 = 100 shares at day 0.
    // Day 0 value  = 100 * 100          = 10000
    // Last value   = 100 * (100 + 0.3*29) = 100 * 108.7 = 10870
    expect(result.benchmarkValues![0]).toBeCloseTo(10000, 8);
    expect(result.benchmarkValues![N_DAYS - 1]).toBeCloseTo(10870, 8);
  });

  it('is null when the benchmark symbol is absent from the price map', () => {
    const result = new BacktestEngine(baseConfig, makePriceMap(false)).run();
    expect(result.benchmarkValues).toBeNull();
    expect(result.benchmarkDates).toBeNull();
  });

  it('honors a custom benchmarkSymbol', () => {
    // Use CCC (present in the map) as the benchmark: falling series.
    const result = new BacktestEngine(
      { ...baseConfig, benchmarkSymbol: 'CCC' },
      makePriceMap(false),
    ).run();
    expect(result.benchmarkValues).not.toBeNull();
    // qty = 10000/100 = 100; last = 100 * (100 - 0.2*29) = 9420
    expect(result.benchmarkValues![N_DAYS - 1]).toBeCloseTo(9420, 8);
  });
});

// ---------------------------------------------------------------------------
// Extended metrics & analytics
// ---------------------------------------------------------------------------

describe('BacktestEngine.run (extended metrics)', () => {
  it('returns the full ExtendedMetrics set plus analytics arrays', () => {
    const result = new BacktestEngine(baseConfig, makePriceMap(true)).run();
    const m = result.metrics;

    // Original metric set still present.
    for (const key of [
      'annualizedReturn', 'annualizedVol', 'sharpeRatio', 'sortinoRatio',
      'maxDrawdown', 'alpha', 'cvar', 'skewness', 'kurtosis',
    ] as const) {
      expect(typeof m[key]).toBe('number');
    }

    // Phase 2 extensions.
    expect(m.winRate).toBeGreaterThanOrEqual(0);
    expect(m.winRate).toBeLessThanOrEqual(1);
    expect(typeof m.profitFactor).toBe('number');
    expect(typeof m.calmarRatio).toBe('number');
    expect(typeof m.avgWin).toBe('number');
    expect(typeof m.avgLoss).toBe('number');

    // Fixture is all one calendar month.
    expect(result.monthlyReturns).toHaveLength(1);
    expect(result.monthlyReturns[0]!.month).toBe('2024-01');
    expect(Array.isArray(result.topDrawdowns)).toBe(true);

    // Result must be JSON-serializable (plain arrays / records).
    expect(() => JSON.stringify(result)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Progress callback
// ---------------------------------------------------------------------------

describe('BacktestEngine.run (progress)', () => {
  it('reports monotonically increasing fractions ending at 1', () => {
    const fractions: number[] = [];
    new BacktestEngine(baseConfig, makePriceMap(true)).run(f => fractions.push(f));

    expect(fractions.length).toBeGreaterThan(0);
    expect(fractions.length).toBeLessThanOrEqual(101); // throttled to ~100 calls
    expect(fractions[fractions.length - 1]).toBe(1);
    for (let i = 1; i < fractions.length; i++) {
      expect(fractions[i]).toBeGreaterThanOrEqual(fractions[i - 1]!);
    }
  });
});

// ---------------------------------------------------------------------------
// Legacy parity
// ---------------------------------------------------------------------------

describe('BacktestEngine.runLegacy', () => {
  it('reproduces the old rebalance-date-only shape', () => {
    const legacy = new BacktestEngine(baseConfig, makePriceMap(false)).runLegacy();

    // 30 trading dates / freq 5 -> indices 0,5,10,15,20,25 = 6 dates.
    expect(legacy.dates).toHaveLength(6);
    expect(legacy.dates).toEqual([
      '2024-01-01', '2024-01-06', '2024-01-11',
      '2024-01-16', '2024-01-21', '2024-01-26',
    ]);
    expect(legacy.portfolioValues).toHaveLength(6);
    expect(legacy.portfolioValues[0]).toBe(10000);

    // Legacy metric set only — no Phase 2 fields.
    expect(Object.keys(legacy.metrics).sort()).toEqual([
      'alpha', 'annualizedReturn', 'annualizedVol', 'cvar', 'kurtosis',
      'maxDrawdown', 'sharpeRatio', 'skewness', 'sortinoRatio',
    ]);
    expect('winRate' in legacy.metrics).toBe(false);
    expect('monthlyReturns' in legacy).toBe(false);
  });

  it('matches the zero-cost daily run at rebalance dates', () => {
    // With no costs and complete price data, trades execute at the same
    // date's prices, so the daily series sampled at rebalance dates must
    // equal the legacy rebalance-date series.
    const priceMap = makePriceMap(false);
    const legacy = new BacktestEngine(baseConfig, priceMap).runLegacy();
    const daily = new BacktestEngine(baseConfig, priceMap).run();

    const rebalIndices = [0, 5, 10, 15, 20, 25];
    rebalIndices.forEach((dayIdx, k) => {
      expect(daily.dates[dayIdx]).toBe(legacy.dates[k]);
      expect(daily.portfolioValues[dayIdx]).toBeCloseTo(legacy.portfolioValues[k]!, 8);
    });
  });

  it('selects the momentum leaders with equal weights', () => {
    const legacy = new BacktestEngine(baseConfig, makePriceMap(false)).runLegacy();
    // First rebalance with enough history allocates 50/50 to AAA & BBB
    // (top-2 momentum; CCC is falling).
    const firstWeights = legacy.weights[0]!;
    expect(Object.keys(firstWeights).sort()).toEqual(['AAA', 'BBB']);
    expect(firstWeights['AAA']).toBeCloseTo(0.5, 12);
    expect(firstWeights['BBB']).toBeCloseTo(0.5, 12);
  });
});

// ---------------------------------------------------------------------------
// runBacktest (synchronous helper)
// ---------------------------------------------------------------------------

describe('runBacktest (sync fallback)', () => {
  it('accepts a plain record price map and matches the engine result', () => {
    const map = makePriceMap(true);
    const record = Object.fromEntries(map);

    const viaHelper = runBacktest(baseConfig, record);
    const viaEngine = new BacktestEngine(baseConfig, map).run();

    expect(viaHelper.dates).toEqual(viaEngine.dates);
    expect(viaHelper.portfolioValues).toEqual(viaEngine.portfolioValues);
    expect(viaHelper.metrics).toEqual(viaEngine.metrics);
  });

  it('also accepts a Map and forwards progress', () => {
    const fractions: number[] = [];
    const result = runBacktest(baseConfig, makePriceMap(true), f => fractions.push(f));
    expect(result.dates).toHaveLength(N_DAYS);
    expect(fractions[fractions.length - 1]).toBe(1);
  });
});
