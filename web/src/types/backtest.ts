/**
 * Backtest Types
 *
 * Type definitions for backtesting functionality.
 */

/**
 * Available strategy types
 */
export type StrategyType =
  | 'momentum'
  | 'mean_reversion'
  | 'equal_weight'
  | 'risk_parity'
  | 'smart_beta'
  | 'custom';

/**
 * Rebalance frequency options
 */
export type RebalanceFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

/**
 * Asset universe options
 */
export type AssetUniverse = 'sp500' | 'nasdaq100' | 'dow30' | 'custom';

/**
 * Benchmark options
 */
export type Benchmark = 'SPY' | 'QQQ' | 'DIA' | 'IWM' | 'VTI' | 'custom';

/**
 * Base strategy configuration
 */
export interface BaseStrategyConfig {
  type: StrategyType;
  name: string;
  description?: string;
}

/**
 * Momentum strategy configuration
 */
export interface MomentumStrategyConfig extends BaseStrategyConfig {
  type: 'momentum';
  /** Lookback period in days for momentum calculation */
  lookbackPeriod: number;
  /** Number of top assets to select */
  topN: number;
  /** Rebalance frequency */
  rebalanceFrequency: RebalanceFrequency;
  /** Minimum momentum threshold (optional) */
  minMomentum?: number;
  /** Use volatility adjustment */
  volatilityAdjusted?: boolean;
}

/**
 * Mean Reversion strategy configuration
 */
export interface MeanReversionStrategyConfig extends BaseStrategyConfig {
  type: 'mean_reversion';
  /** Moving average period */
  maPeriod: number;
  /** Standard deviation threshold for entry */
  entryThreshold: number;
  /** Standard deviation threshold for exit */
  exitThreshold: number;
  /** Number of assets to select */
  topN: number;
  /** Rebalance frequency */
  rebalanceFrequency: RebalanceFrequency;
}

/**
 * Equal Weight strategy configuration
 */
export interface EqualWeightStrategyConfig extends BaseStrategyConfig {
  type: 'equal_weight';
  /** List of symbols to include */
  symbols: string[];
  /** Rebalance frequency */
  rebalanceFrequency: RebalanceFrequency;
}

/**
 * Risk Parity strategy configuration
 */
export interface RiskParityStrategyConfig extends BaseStrategyConfig {
  type: 'risk_parity';
  /** Lookback period for volatility calculation */
  volatilityLookback: number;
  /** Target portfolio volatility (annualized) */
  targetVolatility?: number;
  /** List of symbols to include */
  symbols: string[];
  /** Rebalance frequency */
  rebalanceFrequency: RebalanceFrequency;
}

/**
 * Smart Beta strategy configuration
 */
export interface SmartBetaStrategyConfig extends BaseStrategyConfig {
  type: 'smart_beta';
  /** Factor weights */
  factors: {
    momentum?: number;
    value?: number;
    quality?: number;
    lowVolatility?: number;
    size?: number;
  };
  /** Number of assets to select */
  topN: number;
  /** Rebalance frequency */
  rebalanceFrequency: RebalanceFrequency;
}

/**
 * Custom strategy configuration
 */
export interface CustomStrategyConfig extends BaseStrategyConfig {
  type: 'custom';
  /** Custom Python code */
  code: string;
}

/**
 * Union type for all strategy configurations
 */
export type StrategyConfig =
  | MomentumStrategyConfig
  | MeanReversionStrategyConfig
  | EqualWeightStrategyConfig
  | RiskParityStrategyConfig
  | SmartBetaStrategyConfig
  | CustomStrategyConfig;

/**
 * Backtest configuration
 */
export interface BacktestConfig {
  /** Unique identifier */
  id?: string;
  /** Configuration name */
  name: string;
  /** Strategy configuration */
  strategy: StrategyConfig;
  /** Asset universe */
  universe: AssetUniverse;
  /** Custom symbols (if universe is custom) */
  customSymbols?: string[];
  /** Start date */
  startDate: Date;
  /** End date */
  endDate: Date;
  /** Initial capital */
  initialCapital: number;
  /** Benchmark to compare against */
  benchmark: Benchmark;
  /** Custom benchmark symbol (if benchmark is custom) */
  customBenchmark?: string;
  /** Include transaction costs */
  includeTransactionCosts?: boolean;
  /** Transaction cost per trade (percentage) */
  transactionCost?: number;
  /** Include slippage */
  includeSlippage?: boolean;
  /** Slippage (percentage) */
  slippage?: number;
}

/**
 * Single trade record
 */
export interface TradeRecord {
  date: Date;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  value: number;
  commission?: number;
}

/**
 * Portfolio snapshot at a point in time
 */
export interface PortfolioSnapshot {
  date: Date;
  totalValue: number;
  cash: number;
  positions: {
    symbol: string;
    quantity: number;
    value: number;
    weight: number;
  }[];
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Total return (percentage) */
  totalReturn: number;
  /** Compound Annual Growth Rate */
  cagr: number;
  /** Annualized volatility */
  volatility: number;
  /** Sharpe ratio (assuming risk-free rate) */
  sharpeRatio: number;
  /** Sortino ratio */
  sortinoRatio: number;
  /** Maximum drawdown (percentage) */
  maxDrawdown: number;
  /** Maximum drawdown duration (days) */
  maxDrawdownDuration: number;
  /** Win rate (percentage of winning trades) */
  winRate: number;
  /** Profit factor */
  profitFactor: number;
  /** Average win (percentage) */
  avgWin: number;
  /** Average loss (percentage) */
  avgLoss: number;
  /** Number of trades */
  totalTrades: number;
  /** Calmar ratio */
  calmarRatio: number;
  /** Beta to benchmark */
  beta?: number;
  /** Alpha */
  alpha?: number;
  /** Information ratio */
  informationRatio?: number;
}

/**
 * Monthly returns grid
 */
export interface MonthlyReturns {
  year: number;
  months: (number | null)[]; // 12 months, null if no data
  yearTotal: number;
}

/**
 * Drawdown period
 */
export interface DrawdownPeriod {
  startDate: Date;
  endDate: Date;
  recoveryDate?: Date;
  depth: number;
  duration: number;
  recoveryDuration?: number;
}

/**
 * Backtest result
 */
export interface BacktestResult {
  /** Unique identifier */
  id: string;
  /** Configuration used */
  config: BacktestConfig;
  /** Execution timestamp */
  executedAt: Date;
  /** Execution duration (ms) */
  executionDuration: number;
  /** Success status */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Performance metrics */
  metrics: PerformanceMetrics;
  /** Benchmark metrics */
  benchmarkMetrics?: PerformanceMetrics;
  /** Equity curve (daily values) */
  equityCurve: { date: Date; value: number; benchmark?: number }[];
  /** Drawdown curve */
  drawdownCurve: { date: Date; drawdown: number }[];
  /** Monthly returns */
  monthlyReturns: MonthlyReturns[];
  /** Trade log */
  trades: TradeRecord[];
  /** Portfolio snapshots (at rebalance dates) */
  portfolioSnapshots: PortfolioSnapshot[];
  /** Top drawdown periods */
  topDrawdowns: DrawdownPeriod[];
}

/**
 * Backtest job status
 */
export type BacktestJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Backtest job (for async execution)
 */
export interface BacktestJob {
  id: string;
  userId: string;
  config: BacktestConfig;
  status: BacktestJobStatus;
  progress?: number;
  message?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: BacktestResult;
}

/**
 * Strategy preset
 */
export interface StrategyPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  config: StrategyConfig;
  isBuiltIn: boolean;
}

/**
 * Default strategy presets
 */
export const DEFAULT_STRATEGY_PRESETS: StrategyPreset[] = [
  {
    id: 'momentum-12-1',
    name: 'Momentum 12-1',
    description: 'Classic momentum strategy: 12-month lookback, skip last month, top 10 stocks',
    category: 'Momentum',
    isBuiltIn: true,
    config: {
      type: 'momentum',
      name: 'Momentum 12-1',
      lookbackPeriod: 252, // ~12 months
      topN: 10,
      rebalanceFrequency: 'monthly',
      volatilityAdjusted: false,
    },
  },
  {
    id: 'momentum-6m',
    name: 'Momentum 6M',
    description: '6-month momentum strategy with volatility adjustment',
    category: 'Momentum',
    isBuiltIn: true,
    config: {
      type: 'momentum',
      name: 'Momentum 6M',
      lookbackPeriod: 126, // ~6 months
      topN: 10,
      rebalanceFrequency: 'monthly',
      volatilityAdjusted: true,
    },
  },
  {
    id: 'mean-reversion-20',
    name: 'Mean Reversion 20-day',
    description: 'Buy oversold stocks (2 std below 20-day MA)',
    category: 'Mean Reversion',
    isBuiltIn: true,
    config: {
      type: 'mean_reversion',
      name: 'Mean Reversion 20-day',
      maPeriod: 20,
      entryThreshold: -2,
      exitThreshold: 0,
      topN: 10,
      rebalanceFrequency: 'weekly',
    },
  },
  {
    id: 'equal-weight-sp500',
    name: 'Equal Weight S&P 500',
    description: 'Equal weight all S&P 500 stocks',
    category: 'Passive',
    isBuiltIn: true,
    config: {
      type: 'equal_weight',
      name: 'Equal Weight S&P 500',
      symbols: [], // Will be populated from universe
      rebalanceFrequency: 'quarterly',
    },
  },
  {
    id: 'risk-parity',
    name: 'Risk Parity',
    description: 'Allocate inversely to volatility',
    category: 'Risk-Based',
    isBuiltIn: true,
    config: {
      type: 'risk_parity',
      name: 'Risk Parity',
      volatilityLookback: 60,
      symbols: ['SPY', 'TLT', 'GLD', 'VNQ'],
      rebalanceFrequency: 'monthly',
    },
  },
  {
    id: 'smart-beta-quality',
    name: 'Quality Factor',
    description: 'Focus on high-quality companies',
    category: 'Smart Beta',
    isBuiltIn: true,
    config: {
      type: 'smart_beta',
      name: 'Quality Factor',
      factors: {
        quality: 1,
        momentum: 0.3,
      },
      topN: 20,
      rebalanceFrequency: 'quarterly',
    },
  },
];
