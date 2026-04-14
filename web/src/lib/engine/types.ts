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
// Efficient Frontier
// ---------------------------------------------------------------------------

export interface EfficientFrontierResult {
  returns: number[];
  vols: number[];
  weights: number[][];
}
