/**
 * TradePilot Engine — Shared Type Definitions
 *
 * All types used across the client-side trading engine.
 */

// ---------------------------------------------------------------------------
// Price / Market Data
// ---------------------------------------------------------------------------

/** Time series of closing prices for a single symbol. */
export interface PriceData {
  dates: string[];
  prices: number[];
}

/** Search result from symbol lookup. */
export interface SymbolInfo {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

// ---------------------------------------------------------------------------
// Strategy & Optimizer enums
// ---------------------------------------------------------------------------

export type StrategyType = 'momentum' | 'meanReversion' | 'smartBeta';
export type OptimizerType = 'MSR' | 'GMV' | 'EW';
export type RankingType = 'momentum' | 'random' | 'var';

// ---------------------------------------------------------------------------
// Backtest configuration & results
// ---------------------------------------------------------------------------

export interface BacktestConfig {
  /** Ticker symbols in the universe. */
  symbols: string[];
  /** Ranking / selection strategy. */
  strategy: StrategyType;
  /** Portfolio weight optimizer. */
  optimizer: OptimizerType;
  /** ISO date string, e.g. "2022-01-01". */
  startDate: string;
  /** ISO date string, e.g. "2024-01-01". */
  endDate: string;
  /** Starting portfolio value in USD. */
  initialCapital: number;
  /** Rebalancing cadence in trading days. */
  rebalanceFreq: number;
  /** Number of top-ranked assets to hold. */
  topN: number;
  /** Annual risk-free rate (decimal, e.g. 0.04). */
  riskFreeRate: number;
  /** Lookback window in trading days for ranking. */
  window: number;
  /** Momentum / ranking lookback parameter. */
  t: number;
  /** Minimum weight per asset (default 0.01). */
  minWeight?: number;
  /** Maximum weight per asset (default 0.95). */
  maxWeight?: number;
  /** Transaction cost model. When omitted, trading is free (Phase 2). */
  costs?: TransactionCostConfig;
  /** Benchmark symbol for buy-and-hold comparison (default 'SPY') (Phase 2). */
  benchmarkSymbol?: string;
}

/**
 * Transaction cost model, expressed in basis points per trade side.
 * Total friction per trade = (costBps + slippageBps) / 10000 * trade notional.
 * Both default to 0 (frictionless).
 */
export interface TransactionCostConfig {
  /** Commission / fees per trade side, in basis points. */
  costBps: number;
  /** Slippage per trade side, in basis points. */
  slippageBps: number;
}

export interface Trade {
  date: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
}

export interface BacktestMetrics {
  annualizedReturn: number;
  annualizedVol: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  alpha: number;
  cvar: number;
  skewness: number;
  kurtosis: number;
}

export interface BacktestResult {
  dates: string[];
  portfolioValues: number[];
  weights: Record<string, number>[];
  trades: Trade[];
  metrics: BacktestMetrics;
}

// ---------------------------------------------------------------------------
// Extended analytics (Phase 2)
// ---------------------------------------------------------------------------

/**
 * One peak-to-trough-to-recovery drawdown episode.
 * All dates are ISO strings (YYYY-MM-DD); `end` is null when the
 * drawdown had not recovered by the last date in the series.
 */
export interface DrawdownPeriod {
  /** Date of the peak preceding the drawdown. */
  start: string;
  /** Date of the lowest value during the episode. */
  trough: string;
  /** Date of recovery to the prior peak, or null if unrecovered. */
  end: string | null;
  /** Depth as a fraction, always <= 0 (e.g. -0.12 = -12%). */
  depth: number;
  /** Calendar days from start to end (or to the last date if unrecovered). */
  lengthDays: number;
}

/** Compounded return for one calendar month. */
export interface MonthlyReturn {
  /** Calendar month in YYYY-MM format. */
  month: string;
  /** Compounded return over the month (decimal). */
  return: number;
}

/** Original metric set plus Phase 2 trade-quality metrics. */
export interface ExtendedMetrics extends BacktestMetrics {
  /** Fraction of periods with a positive return (0..1). */
  winRate: number;
  /** Sum of gains / |sum of losses|. Positive Infinity when there are gains but no losses. */
  profitFactor: number;
  /** Annualized return / |max drawdown|; 0 when max drawdown is 0. */
  calmarRatio: number;
  /** Mean of positive period returns (0 when none). */
  avgWin: number;
  /** Mean of negative period returns, itself negative (0 when none). */
  avgLoss: number;
}

/**
 * Phase 2 backtest result. Daily-valued equity curve plus extended
 * analytics and an optional buy-and-hold benchmark curve.
 *
 * Everything is JSON-serializable (plain arrays / records — no Maps or
 * Dates), suitable for a `backtests.metrics` / `equity_curve` JSONB insert.
 * Caveat: `metrics.profitFactor` may be Number.POSITIVE_INFINITY, which
 * JSON.stringify renders as null — coerce before persisting if needed.
 */
export interface BacktestResultV2 {
  /** Every trading date in [startDate, endDate] present in the price data. */
  dates: string[];
  /** Portfolio value on each date in `dates`. */
  portfolioValues: number[];
  /** Target weights recorded at each successful rebalance. */
  weights: Record<string, number>[];
  trades: Trade[];
  metrics: ExtendedMetrics;
  monthlyReturns: MonthlyReturn[];
  topDrawdowns: DrawdownPeriod[];
  /** Buy-and-hold benchmark values, or null if the benchmark symbol has no data. */
  benchmarkValues: number[] | null;
  /** Dates for `benchmarkValues` (same daily index), or null. */
  benchmarkDates: string[] | null;
}

// ---------------------------------------------------------------------------
// Worker protocol (Phase 2)
// ---------------------------------------------------------------------------

/**
 * Message posted to the backtest worker. `priceMap` is a plain record
 * (structured-clone friendly) — the worker converts it to a Map internally.
 */
export interface WorkerRunMessage {
  type: 'run';
  config: BacktestConfig;
  priceMap: Record<string, PriceData>;
}

/** Messages posted back from the backtest worker. */
export type WorkerResponse =
  | { type: 'progress'; fraction: number }
  | { type: 'result'; result: BacktestResultV2 }
  | { type: 'error'; message: string };

// ---------------------------------------------------------------------------
// Efficient Frontier
// ---------------------------------------------------------------------------

export interface EfficientFrontierResult {
  returns: number[];
  vols: number[];
  weights: number[][];
}
