/**
 * TradePilot Engine — Backtest Simulator
 *
 * Pure TypeScript port of tradepilot/simulator.py + backtest.py.
 * Runs entirely in the browser — no server needed.
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
  portfolioReturn as calcPortfolioReturn,
} from './metrics';
import { msr, gmv, equalWeight } from './optimization';
import { momentumStrategy, meanReversionStrategy, smartBetaStrategy } from './strategies';
import type {
  BacktestConfig,
  BacktestResult,
  BacktestMetrics,
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
    dates.push(filtered[i]);
  }
  return dates;
}

/** Build a price matrix (rows=dates, cols=symbols) from aligned price data. */
function buildPriceMatrix(
  priceMap: Map<string, PriceData>,
  symbols: string[],
  dateIndex: string[],
): { matrix: number[][]; validSymbols: string[] } {
  // Build lookup: symbol -> date -> price
  const lookups = new Map<string, Map<string, number>>();
  for (const sym of symbols) {
    const pd = priceMap.get(sym);
    if (!pd) continue;
    const m = new Map<string, number>();
    for (let i = 0; i < pd.dates.length; i++) {
      m.set(pd.dates[i], pd.prices[i]);
    }
    lookups.set(sym, m);
  }

  // Only keep symbols with data on all dates
  const validSymbols = symbols.filter(sym => {
    const lookup = lookups.get(sym);
    if (!lookup) return false;
    return dateIndex.every(d => lookup.has(d));
  });

  const matrix: number[][] = dateIndex.map(d =>
    validSymbols.map(sym => lookups.get(sym)!.get(d)!),
  );

  return { matrix, validSymbols };
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
   * Run the backtest and return results.
   */
  run(): BacktestResult {
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
    const priceLookup = new Map<string, Map<string, number>>();
    for (const sym of symbols) {
      const pd = this.priceMap.get(sym);
      if (!pd) continue;
      const m = new Map<string, number>();
      for (let i = 0; i < pd.dates.length; i++) {
        m.set(pd.dates[i], pd.prices[i]);
      }
      priceLookup.set(sym, m);
    }

    // Simulation state
    let capital = initialCapital;
    let holdings: Record<string, number> = {}; // symbol -> qty
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
          Object.fromEntries(topSymbols.map((s, i) => [s, eqW[i]])),
        );
        continue;
      }

      // Build aligned matrix (all top symbols must have same # of data points)
      const minLen = Math.min(...topPriceArrays.map(p => p.length));
      const aligned = topPriceArrays.map(p => p.slice(p.length - minLen));

      // Transpose to rows=time, cols=assets
      const matrix: number[][] = [];
      for (let row = 0; row < minLen; row++) {
        matrix.push(aligned.map(p => p[row]));
      }

      const returnsMatrix = getReturnsMatrix(matrix);
      if (returnsMatrix.length < 2) {
        const eqW = equalWeight(topSymbols.length);
        this.allocate(topSymbols, eqW, capital, date, priceLookup, holdings, trades);
        weightHistory.push(
          Object.fromEntries(topSymbols.map((s, i) => [s, eqW[i]])),
        );
        continue;
      }

      const cov = covarianceMatrix(returnsMatrix);
      const nAssets = topPriceArrays.length;

      // Expected returns: annualized mean per asset
      const expReturns: number[] = [];
      for (let j = 0; j < nAssets; j++) {
        const assetReturns = returnsMatrix.map(row => row[j]);
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
        Object.fromEntries(actualSymbols.map((s, i) => [s, weights[i]])),
      );
    }

    // Compute metrics from portfolio values
    const metrics = this.computeMetrics(portfolioValues, riskFreeRate);

    return {
      dates: resultDates,
      portfolioValues,
      weights: weightHistory,
      trades,
      metrics,
    };
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
      if (!symbols.includes(sym) && holdings[sym] > 0) {
        const price = priceLookup.get(sym)?.get(date);
        if (price) {
          trades.push({ date, symbol: sym, side: 'sell', qty: holdings[sym], price });
        }
        delete holdings[sym];
      }
    }

    // Buy new positions
    for (let i = 0; i < symbols.length; i++) {
      const sym = symbols[i];
      const price = priceLookup.get(sym)?.get(date);
      if (!price) continue;
      const allocatedCapital = capital * weights[i];
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

  private computeMetrics(portfolioValues: number[], riskFreeRate: number): BacktestMetrics {
    if (portfolioValues.length < 2) {
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

    const returns = getReturns(portfolioValues);
    // Use weekly periods (52 per year) since rebalance is typically weekly
    const periodsPerYear = 52;

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

  private emptyResult(): BacktestResult {
    return {
      dates: [],
      portfolioValues: [],
      weights: [],
      trades: [],
      metrics: {
        annualizedReturn: 0,
        annualizedVol: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        maxDrawdown: 0,
        alpha: 0,
        cvar: 0,
        skewness: 0,
        kurtosis: 0,
      },
    };
  }
}
