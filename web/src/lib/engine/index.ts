/**
 * TradePilot Engine — Public API
 *
 * Re-exports everything for clean imports:
 *   import { sharpeRatio, msr, BacktestEngine } from '@lib/engine';
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

// Data
export {
  fetchHistoricalPrices,
  fetchLivePrice,
  fetchMultiplePrices,
  searchSymbols,
  fetchRiskFreeRate,
} from './data';

// Simulator
export { BacktestEngine } from './simulator';
