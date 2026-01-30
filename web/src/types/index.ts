/**
 * Type Exports
 *
 * Central export point for all TradePilot types.
 * Note: Some types have the same name across modules, so we use explicit exports.
 */

// Alpaca types
export * from './alpaca';

// Portfolio types
export type {
  AccountType,
  Account,
  Holding,
  AssetType,
  Transaction,
  TransactionType,
  PortfolioSummary,
  AllocationItem,
  NetWorthSnapshot,
  CSVFormat,
  // Note: Currency also defined in assets.ts
} from './portfolio';

// Backtest types (renamed to avoid conflicts with strategies)
export type {
  RebalanceFrequency as BacktestRebalanceFrequency,
  AssetUniverse as BacktestAssetUniverse,
  Benchmark,
  StrategyType as BacktestStrategyType,
  MomentumStrategyConfig,
  MeanReversionStrategyConfig,
  EqualWeightStrategyConfig,
  RiskParityStrategyConfig,
  SmartBetaStrategyConfig,
  CustomStrategyConfig,
  StrategyConfig as BacktestStrategyConfig,
  BacktestConfig,
  BacktestResult,
  TradeRecord,
  PortfolioSnapshot,
  PerformanceMetrics,
  MonthlyReturns,
  DrawdownPeriod,
  BacktestJobStatus,
  BacktestJob,
  StrategyPreset,
} from './backtest';

// Strategies types (renamed to avoid conflicts)
export type {
  BuiltInStrategyType,
  StrategyStatus,
  ParameterType,
  ParameterDefinition,
  StrategyConfig,
  AssetUniverse,
  RebalanceFrequency,
  Strategy,
  StrategyType,
} from './strategies';

// Markets types
export * from './markets';

// Alerts types
export * from './alerts';

// Reports types
export * from './reports';

// Leaderboard types (renamed to avoid conflicts with social.ts)
export type {
  LeaderboardPeriod,
  RankingMetric,
  LeaderboardEntry as LeaderboardEntryType,
  Leaderboard as LeaderboardType,
  LeaderboardPreferences,
  PrivacySettings as LeaderboardPrivacySettings,
  LeaderboardCalculationRequest,
} from './leaderboard';

// ============================================================================
// New Universal Asset Architecture types
// ============================================================================

// Universal asset types
export * from './assets';

// Market data types
export * from './market-data';

// Permissions types
export * from './permissions';

// Social types
export * from './social';
