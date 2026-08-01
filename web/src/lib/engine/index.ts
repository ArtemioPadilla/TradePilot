/**
 * TradePilot Engine — Public API (Phase 2)
 *
 * Re-exports everything for clean imports:
 *   import { sharpeRatio, msr, BacktestEngine, runBacktestInWorker } from '@lib/engine';
 *
 * Note: market data fetching (data.ts) is handled separately in Phase 2
 * and is intentionally not part of this module.
 */

// Types
export type {
  PriceData,
  SymbolInfo,
  StrategyType,
  OptimizerType,
  RankingType,
  BacktestConfig,
  BacktestResult,
  BacktestMetrics,
  Trade,
  EfficientFrontierResult,
  // Phase 2 additions
  TransactionCostConfig,
  DrawdownPeriod,
  MonthlyReturn,
  ExtendedMetrics,
  BacktestResultV2,
  WorkerRunMessage,
  WorkerResponse,
} from './types';

// Metrics
export {
  getReturns,
  getReturnsMatrix,
  annualizeReturns,
  annualizeVol,
  semideviation,
  annualizeSemideviation,
  sharpeRatio,
  sortinoRatio,
  getDrawdown,
  maxDrawdown,
  momentum,
  varHistoric,
  varGaussian,
  cvarHistoric,
  skewness,
  kurtosis,
  getCompoundedReturn,
  portfolioReturn,
  portfolioVol,
  alpha,
  covarianceMatrix,
  normalCDF,
  normalPPF,
} from './metrics';

// Analytics (Phase 2)
export {
  winRate,
  profitFactor,
  calmarRatio,
  avgWinLoss,
  monthlyReturns,
  topDrawdowns,
} from './analytics';

// Ranking
export {
  momentumRanking,
  randomRanking,
  varRanking,
} from './ranking';

// Optimization
export {
  msr,
  gmv,
  equalWeight,
  minimizeVol,
  efficientFrontier,
} from './optimization';

// Strategies
export {
  momentumStrategy,
  meanReversionStrategy,
  smartBetaStrategy,
} from './strategies';

// Simulator
export { BacktestEngine } from './simulator';

// Backtest runners (Phase 2)
export { runBacktest, runBacktestInWorker } from './runBacktest';
export type { PriceMapInput } from './runBacktest';

// Market data (network layer — kept out of the pure engine modules above).
export {
  fetchHistoricalPrices,
  fetchLivePrice,
  fetchMultiplePrices,
  searchSymbols,
  fetchRiskFreeRate,
} from './data';
