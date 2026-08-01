/**
 * TradePilot Engine — Backtest Simulator (Phase 2)
 *
 * Pure TypeScript port of tradepilot/simulator.py + backtest.py.
 * Runs entirely in the browser — no server needed.
 *
 * Phase 2 evolution:
 * - run() values the portfolio on EVERY trading date (daily equity curve),
 *   applies optional transaction costs, reports progress, tracks a
 *   buy-and-hold benchmark, and returns BacktestResultV2 with extended
 *   analytics (daily series → periodsPerYear = 252).
 * - runLegacy() reproduces the original Phase 1 behavior exactly
 *   (rebalance-date-only valuation, periodsPerYear = 52) and is what the
 *   Python parity test pins.
 * Rebalance/selection/optimization logic is unchanged from Phase 1.
 */

import {
  getReturns,
  annualizeReturns,
  annualizeVol,
  sharpeRatio,
  sortinoRatio,
  maxDrawdown,
  alpha as calcAlpha,
  cvarHistoric,
  skewness,
  kurtosis,
  covarianceMatrix,
  getReturnsMatrix,
} from './metrics';
import { msr, gmv, equalWeight } from './optimization';
import { momentumStrategy, meanReversionStrategy, smartBetaStrategy } from './strategies';
import {
  winRate,
  profitFactor,
  calmarRatio,
  avgWinLoss,
  monthlyReturns,
  topDrawdowns,
} from './analytics';
import type {
  BacktestConfig,
  BacktestResult,
  BacktestResultV2,
  BacktestMetrics,
  ExtendedMetrics,
  Trade,
  PriceData,
} from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get trading days that fall within the price data. */
function getRebalanceDates(
  allDates: string[],
  startDate: string,
  endDate: string,
  freq: number,
): string[] {
  const filtered = allDates.filter(d => d >= startDate && d <= endDate);
  const dates: string[] = [];
  for (let i = 0; i < filtered.length; i += freq) {
    dates.push(filtered[i]!);
  }
  return dates;
}

/** Build symbol -> (date -> price) lookups for fast access. */
function buildPriceLookup(
  priceMap: Map<string, PriceData>,
  symbols: string[],
): Map<string, Map<string, number>> {
  const priceLookup = new Map<string, Map<string, number>>();
  for (const sym of symbols) {
    const pd = priceMap.get(sym);
    if (!pd) continue;
    const m = new Map<string, number>();
    for (let i = 0; i < pd.dates.length; i++) {
      m.set(pd.dates[i]!, pd.prices[i]!);
    }
    priceLookup.set(sym, m);
  }
  return priceLookup;
}

// ---------------------------------------------------------------------------
// Strategy dispatch
// ---------------------------------------------------------------------------

function runStrategy(
  strategyType: string,
  pricesMap: Map<string, number[]>,
  t: number,
): string[] {
  switch (strategyType) {
    case 'momentum':
      return momentumStrategy(pricesMap, t);
    case 'meanReversion':
      return meanReversionStrategy(pricesMap, t);
    case 'smartBeta':
      return smartBetaStrategy(pricesMap);
    default:
      return momentumStrategy(pricesMap, t);
  }
}

// ---------------------------------------------------------------------------
// BacktestEngine
// ---------------------------------------------------------------------------

export class BacktestEngine {
  private config: BacktestConfig;
  private priceMap: Map<string, PriceData>;

  /**
   * Create a new BacktestEngine.
   *
   * @param config Backtest configuration.
   * @param priceMap Map of symbol -> PriceData (pre-fetched).
   */
  constructor(config: BacktestConfig, priceMap: Map<string, PriceData>) {
    this.config = config;
    this.priceMap = priceMap;
  }

  /**
   * Run the Phase 2 backtest: daily valuation, transaction costs,
   * benchmark tracking, and extended analytics.
   *
   * @param onProgress Optional callback receiving completion fraction in
   *   (0, 1]; throttled to at most ~100 invocations.
   */
  run(onProgress?: (fraction: number) => void): BacktestResultV2 {
    const {
      symbols,
      startDate,
      endDate,
      initialCapital,
      rebalanceFreq,
      riskFreeRate,
      costs,
      benchmarkSymbol,
    } = this.config;

    // Union date index across all symbols in the price map.
    const allDatesSet = new Set<string>();
    for (const [, pd] of this.priceMap) {
      for (const d of pd.dates) allDatesSet.add(d);
    }
    const allDates = [...allDatesSet].sort();

    // Every trading date within the window — the daily valuation index.
    const tradingDates = allDates.filter(d => d >= startDate && d <= endDate);
    if (tradingDates.length === 0) {
      return this.emptyResultV2();
    }

    // Rebalance dates: every rebalanceFreq-th trading date (same rule as legacy).
    const rebalSet = new Set<string>();
    for (let i = 0; i < tradingDates.length; i += rebalanceFreq) {
      rebalSet.add(tradingDates[i]!);
    }

    const priceLookup = buildPriceLookup(this.priceMap, symbols);
    const costRate = costs ? (costs.costBps + costs.slippageBps) / 10000 : 0;

    // Simulation state
    let capital = initialCapital;
    const holdings: Record<string, number> = {}; // symbol -> qty
    const lastKnownPrice: Record<string, number> = {}; // carry-forward valuation
    const resultDates: string[] = [];
    const portfolioValues: number[] = [];
    const weightHistory: Record<string, number>[] = [];
    const trades: Trade[] = [];

    const total = tradingDates.length;
    const progressStep = Math.max(1, Math.ceil(total / 100));

    for (let i = 0; i < total; i++) {
      const date = tradingDates[i]!;

      // Carry last-known prices forward across per-symbol data gaps.
      for (const sym of symbols) {
        const p = priceLookup.get(sym)?.get(date);
        if (p != null) lastKnownPrice[sym] = p;
      }

      // Mark-to-market current holdings.
      if (Object.keys(holdings).length > 0) {
        let value = 0;
        for (const [sym, qty] of Object.entries(holdings)) {
          const price = lastKnownPrice[sym];
          if (price != null) {
            value += qty * price;
          }
        }
        capital = value;
      }

      // Rebalance (selection + optimization + allocation) on schedule.
      if (rebalSet.has(date)) {
        const tradesBefore = trades.length;
        this.rebalanceOn(date, allDates, capital, priceLookup, holdings, trades, weightHistory);

        // Transaction costs: (costBps + slippageBps)/10000 per unit of
        // traded notional, deducted from the portfolio at this rebalance.
        if (costRate > 0 && trades.length > tradesBefore && capital > 0) {
          let notional = 0;
          for (let k = tradesBefore; k < trades.length; k++) {
            notional += trades[k]!.qty * trades[k]!.price;
          }
          const cost = costRate * notional;
          if (cost > 0) {
            const factor = Math.max(0, (capital - cost) / capital);
            for (const sym of Object.keys(holdings)) {
              holdings[sym]! *= factor;
            }
            capital *= factor;
          }
        }
      }

      // Record the post-rebalance value (equals pre-rebalance value when
      // costs are zero, since trades execute at the same date's prices).
      resultDates.push(date);
      portfolioValues.push(capital);

      if (onProgress && (i % progressStep === 0 || i === total - 1)) {
        onProgress((i + 1) / total);
      }
    }

    // Benchmark: buy-and-hold of initialCapital over the same daily index.
    const benchSym = benchmarkSymbol ?? 'SPY';
    const { benchmarkValues, benchmarkDates } = this.buildBenchmark(
      benchSym,
      tradingDates,
      initialCapital,
    );

    // Metrics on the daily series → 252 periods per year.
    const metrics = this.computeMetricsV2(portfolioValues, riskFreeRate, 252);

    return {
      dates: resultDates,
      portfolioValues,
      weights: weightHistory,
      trades,
      metrics,
      monthlyReturns: monthlyReturns(resultDates, portfolioValues),
      topDrawdowns: topDrawdowns(resultDates, portfolioValues),
      benchmarkValues,
      benchmarkDates,
    };
  }

  /**
   * Run the backtest with the ORIGINAL Phase 1 behavior: the portfolio is
   * valued only on rebalance dates and metrics use periodsPerYear = 52.
   * This is the code path pinned by the Python parity tests — do not change.
   */
  runLegacy(): BacktestResult {
    const {
      symbols,
      strategy,
      optimizer,
      startDate,
      endDate,
      initialCapital,
      rebalanceFreq,
      topN,
      riskFreeRate,
      window: windowSize,
      t,
      minWeight = 0.01,
      maxWeight = 0.95,
    } = this.config;

    // Build a common date index from the first symbol's dates
    const allDatesSet = new Set<string>();
    for (const [, pd] of this.priceMap) {
      for (const d of pd.dates) allDatesSet.add(d);
    }
    const allDates = [...allDatesSet].sort();

    // Get rebalance dates
    const rebalDates = getRebalanceDates(allDates, startDate, endDate, rebalanceFreq);
    if (rebalDates.length === 0) {
      return this.emptyResult();
    }

    // Build price lookups
    const priceLookup = buildPriceLookup(this.priceMap, symbols);

    // Simulation state
    let capital = initialCapital;
    const holdings: Record<string, number> = {}; // symbol -> qty
    const resultDates: string[] = [];
    const portfolioValues: number[] = [];
    const weightHistory: Record<string, number>[] = [];
    const trades: Trade[] = [];

    for (const date of rebalDates) {
      // Track portfolio value
      if (Object.keys(holdings).length > 0) {
        let value = 0;
        for (const [sym, qty] of Object.entries(holdings)) {
          const price = priceLookup.get(sym)?.get(date);
          if (price != null) {
            value += qty * price;
          }
        }
        capital = value;
      }

      resultDates.push(date);
      portfolioValues.push(capital);

      // Build price windows for strategy
      const dateIdx = allDates.indexOf(date);
      if (dateIdx < 0) continue;

      const windowStart = Math.max(0, dateIdx - windowSize);
      const windowDates = allDates.slice(windowStart, dateIdx + 1);

      // Build prices map for strategy
      const strategyPrices = new Map<string, number[]>();
      for (const sym of symbols) {
        const lookup = priceLookup.get(sym);
        if (!lookup) continue;
        const prices: number[] = [];
        for (const d of windowDates) {
          const p = lookup.get(d);
          if (p != null) prices.push(p);
        }
        if (prices.length > 0) {
          strategyPrices.set(sym, prices);
        }
      }

      // Rank and select top N
      const ranked = runStrategy(strategy, strategyPrices, t);
      const topSymbols = ranked.slice(0, Math.min(topN, ranked.length));
      if (topSymbols.length === 0) continue;

      // Get returns for optimization
      const topPriceArrays: number[][] = [];
      for (const sym of topSymbols) {
        const p = strategyPrices.get(sym);
        if (p && p.length > 1) topPriceArrays.push(p);
      }

      if (topPriceArrays.length < 2) {
        // Fallback: equal weight with available symbols
        const eqW = equalWeight(topSymbols.length);
        this.allocate(topSymbols, eqW, capital, date, priceLookup, holdings, trades);
        weightHistory.push(
          Object.fromEntries(topSymbols.map((s, i) => [s, eqW[i]!])),
        );
        continue;
      }

      // Build aligned matrix (all top symbols must have same # of data points)
      const minLen = Math.min(...topPriceArrays.map(p => p.length));
      const aligned = topPriceArrays.map(p => p.slice(p.length - minLen));

      // Transpose to rows=time, cols=assets
      const matrix: number[][] = [];
      for (let row = 0; row < minLen; row++) {
        matrix.push(aligned.map(p => p[row]!));
      }

      const returnsMatrix = getReturnsMatrix(matrix);
      if (returnsMatrix.length < 2) {
        const eqW = equalWeight(topSymbols.length);
        this.allocate(topSymbols, eqW, capital, date, priceLookup, holdings, trades);
        weightHistory.push(
          Object.fromEntries(topSymbols.map((s, i) => [s, eqW[i]!])),
        );
        continue;
      }

      const cov = covarianceMatrix(returnsMatrix);
      const nAssets = topPriceArrays.length;

      // Expected returns: annualized mean per asset
      const expReturns: number[] = [];
      for (let j = 0; j < nAssets; j++) {
        const assetReturns = returnsMatrix.map(row => row[j]!);
        expReturns.push(annualizeReturns(assetReturns));
      }

      // Optimize
      let weights: number[];
      switch (optimizer) {
        case 'MSR':
          weights = msr(riskFreeRate, expReturns, cov, minWeight, maxWeight);
          break;
        case 'GMV':
          weights = gmv(cov, minWeight, maxWeight);
          break;
        case 'EW':
        default:
          weights = equalWeight(nAssets);
          break;
      }

      // Allocate
      const actualSymbols = topSymbols.slice(0, nAssets);
      this.allocate(actualSymbols, weights, capital, date, priceLookup, holdings, trades);
      weightHistory.push(
        Object.fromEntries(actualSymbols.map((s, i) => [s, weights[i]!])),
      );
    }

    // Compute metrics from portfolio values (weekly cadence, as in Phase 1)
    const metrics = this.computeMetrics(portfolioValues, riskFreeRate, 52);

    return {
      dates: resultDates,
      portfolioValues,
      weights: weightHistory,
      trades,
      metrics,
    };
  }

  // -------------------------------------------------------------------------
  // Rebalance core (Phase 1 logic, extracted so run() can call it per date)
  // -------------------------------------------------------------------------

  /**
   * Perform one rebalance at `date`: rank the universe over the lookback
   * window, select the top N, optimize weights, and reallocate holdings.
   * Identical selection/optimization logic to Phase 1's inline loop body.
   */
  private rebalanceOn(
    date: string,
    allDates: string[],
    capital: number,
    priceLookup: Map<string, Map<string, number>>,
    holdings: Record<string, number>,
    trades: Trade[],
    weightHistory: Record<string, number>[],
  ): void {
    const {
      symbols,
      strategy,
      optimizer,
      topN,
      riskFreeRate,
      window: windowSize,
      t,
      minWeight = 0.01,
      maxWeight = 0.95,
    } = this.config;

    // Build price windows for strategy
    const dateIdx = allDates.indexOf(date);
    if (dateIdx < 0) return;

    const windowStart = Math.max(0, dateIdx - windowSize);
    const windowDates = allDates.slice(windowStart, dateIdx + 1);

    // Build prices map for strategy
    const strategyPrices = new Map<string, number[]>();
    for (const sym of symbols) {
      const lookup = priceLookup.get(sym);
      if (!lookup) continue;
      const prices: number[] = [];
      for (const d of windowDates) {
        const p = lookup.get(d);
        if (p != null) prices.push(p);
      }
      if (prices.length > 0) {
        strategyPrices.set(sym, prices);
      }
    }

    // Rank and select top N
    const ranked = runStrategy(strategy, strategyPrices, t);
    const topSymbols = ranked.slice(0, Math.min(topN, ranked.length));
    if (topSymbols.length === 0) return;

    // Get returns for optimization
    const topPriceArrays: number[][] = [];
    for (const sym of topSymbols) {
      const p = strategyPrices.get(sym);
      if (p && p.length > 1) topPriceArrays.push(p);
    }

    if (topPriceArrays.length < 2) {
      // Fallback: equal weight with available symbols
      const eqW = equalWeight(topSymbols.length);
      this.allocate(topSymbols, eqW, capital, date, priceLookup, holdings, trades);
      weightHistory.push(
        Object.fromEntries(topSymbols.map((s, i) => [s, eqW[i]!])),
      );
      return;
    }

    // Build aligned matrix (all top symbols must have same # of data points)
    const minLen = Math.min(...topPriceArrays.map(p => p.length));
    const aligned = topPriceArrays.map(p => p.slice(p.length - minLen));

    // Transpose to rows=time, cols=assets
    const matrix: number[][] = [];
    for (let row = 0; row < minLen; row++) {
      matrix.push(aligned.map(p => p[row]!));
    }

    const returnsMatrix = getReturnsMatrix(matrix);
    if (returnsMatrix.length < 2) {
      const eqW = equalWeight(topSymbols.length);
      this.allocate(topSymbols, eqW, capital, date, priceLookup, holdings, trades);
      weightHistory.push(
        Object.fromEntries(topSymbols.map((s, i) => [s, eqW[i]!])),
      );
      return;
    }

    const cov = covarianceMatrix(returnsMatrix);
    const nAssets = topPriceArrays.length;

    // Expected returns: annualized mean per asset
    const expReturns: number[] = [];
    for (let j = 0; j < nAssets; j++) {
      const assetReturns = returnsMatrix.map(row => row[j]!);
      expReturns.push(annualizeReturns(assetReturns));
    }

    // Optimize
    let weights: number[];
    switch (optimizer) {
      case 'MSR':
        weights = msr(riskFreeRate, expReturns, cov, minWeight, maxWeight);
        break;
      case 'GMV':
        weights = gmv(cov, minWeight, maxWeight);
        break;
      case 'EW':
      default:
        weights = equalWeight(nAssets);
        break;
    }

    // Allocate
    const actualSymbols = topSymbols.slice(0, nAssets);
    this.allocate(actualSymbols, weights, capital, date, priceLookup, holdings, trades);
    weightHistory.push(
      Object.fromEntries(actualSymbols.map((s, i) => [s, weights[i]!])),
    );
  }

  private allocate(
    symbols: string[],
    weights: number[],
    capital: number,
    date: string,
    priceLookup: Map<string, Map<string, number>>,
    holdings: Record<string, number>,
    trades: Trade[],
  ): void {
    // Clear old holdings
    for (const sym of Object.keys(holdings)) {
      if (!symbols.includes(sym) && holdings[sym]! > 0) {
        const price = priceLookup.get(sym)?.get(date);
        if (price) {
          trades.push({ date, symbol: sym, side: 'sell', qty: holdings[sym]!, price });
        }
        delete holdings[sym];
      }
    }

    // Buy new positions
    for (let i = 0; i < symbols.length; i++) {
      const sym = symbols[i]!;
      const price = priceLookup.get(sym)?.get(date);
      if (!price) continue;
      const allocatedCapital = capital * weights[i]!;
      const qty = allocatedCapital / price;
      const oldQty = holdings[sym] ?? 0;
      holdings[sym] = qty;

      if (qty > oldQty) {
        trades.push({ date, symbol: sym, side: 'buy', qty: qty - oldQty, price });
      } else if (qty < oldQty) {
        trades.push({ date, symbol: sym, side: 'sell', qty: oldQty - qty, price });
      }
    }
  }

  // -------------------------------------------------------------------------
  // Benchmark
  // -------------------------------------------------------------------------

  /**
   * Buy-and-hold benchmark: invest initialCapital at the first date the
   * benchmark has a price, then mark to market (carrying prices forward)
   * over the same daily date index. Returns nulls if the symbol is absent
   * from the price map.
   */
  private buildBenchmark(
    benchSymbol: string,
    tradingDates: string[],
    initialCapital: number,
  ): { benchmarkValues: number[] | null; benchmarkDates: string[] | null } {
    const pd = this.priceMap.get(benchSymbol);
    if (!pd) {
      return { benchmarkValues: null, benchmarkDates: null };
    }

    const lookup = new Map<string, number>();
    for (let i = 0; i < pd.dates.length; i++) {
      lookup.set(pd.dates[i]!, pd.prices[i]!);
    }

    let qty: number | null = null;
    let lastPrice: number | null = null;
    const values: number[] = [];

    for (const d of tradingDates) {
      const p = lookup.get(d);
      if (p != null) lastPrice = p;
      if (qty == null && lastPrice != null && lastPrice > 0) {
        qty = initialCapital / lastPrice;
      }
      values.push(qty != null && lastPrice != null ? qty * lastPrice : initialCapital);
    }

    return { benchmarkValues: values, benchmarkDates: [...tradingDates] };
  }

  // -------------------------------------------------------------------------
  // Metrics
  // -------------------------------------------------------------------------

  /**
   * Original metric set, parameterized by valuation cadence:
   * 52 for the legacy rebalance-date series, 252 for the daily series.
   */
  private computeMetrics(
    portfolioValues: number[],
    riskFreeRate: number,
    periodsPerYear: number,
  ): BacktestMetrics {
    if (portfolioValues.length < 2) {
      return this.emptyMetrics();
    }

    const returns = getReturns(portfolioValues);

    const annRet = annualizeReturns(returns, periodsPerYear);
    const annVol = annualizeVol(returns, periodsPerYear);
    const sr = sharpeRatio(returns, riskFreeRate, periodsPerYear);
    const sortino = sortinoRatio(returns, riskFreeRate, periodsPerYear);
    const mdd = maxDrawdown(portfolioValues);
    const a = calcAlpha(annRet, riskFreeRate);
    const cv = returns.length > 0 ? cvarHistoric(returns) : 0;
    const sk = returns.length > 0 ? skewness(returns) : 0;
    const ku = returns.length > 0 ? kurtosis(returns) : 0;

    return {
      annualizedReturn: annRet,
      annualizedVol: annVol,
      sharpeRatio: sr,
      sortinoRatio: sortino,
      maxDrawdown: mdd,
      alpha: a,
      cvar: cv,
      skewness: sk,
      kurtosis: ku,
    };
  }

  /** Original metrics + Phase 2 analytics extensions. */
  private computeMetricsV2(
    portfolioValues: number[],
    riskFreeRate: number,
    periodsPerYear: number,
  ): ExtendedMetrics {
    const base = this.computeMetrics(portfolioValues, riskFreeRate, periodsPerYear);
    const returns = portfolioValues.length >= 2 ? getReturns(portfolioValues) : [];
    const { avgWin, avgLoss } = avgWinLoss(returns);

    return {
      ...base,
      winRate: winRate(returns),
      profitFactor: profitFactor(returns),
      calmarRatio: calmarRatio(base.annualizedReturn, base.maxDrawdown),
      avgWin,
      avgLoss,
    };
  }

  private emptyMetrics(): BacktestMetrics {
    return {
      annualizedReturn: 0,
      annualizedVol: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      maxDrawdown: 0,
      alpha: 0,
      cvar: 0,
      skewness: 0,
      kurtosis: 0,
    };
  }

  private emptyResult(): BacktestResult {
    return {
      dates: [],
      portfolioValues: [],
      weights: [],
      trades: [],
      metrics: this.emptyMetrics(),
    };
  }

  private emptyResultV2(): BacktestResultV2 {
    return {
      dates: [],
      portfolioValues: [],
      weights: [],
      trades: [],
      metrics: {
        ...this.emptyMetrics(),
        winRate: 0,
        profitFactor: 0,
        calmarRatio: 0,
        avgWin: 0,
        avgLoss: 0,
      },
      monthlyReturns: [],
      topDrawdowns: [],
      benchmarkValues: null,
      benchmarkDates: null,
    };
  }
}
