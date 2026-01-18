/**
 * Strategy Types
 *
 * Type definitions for trading strategies and their parameters.
 */

/**
 * Built-in strategy types that come with pre-defined logic
 */
export type BuiltInStrategyType =
  | 'momentum'
  | 'mean_reversion'
  | 'equal_weight'
  | 'risk_parity'
  | 'smart_beta'
  | 'buy_and_hold';

/**
 * Strategy type including custom strategies
 */
export type StrategyType = BuiltInStrategyType | 'custom';

/**
 * Strategy execution status
 */
export type StrategyStatus = 'draft' | 'active' | 'paused' | 'archived';

/**
 * Rebalancing frequency options
 */
export type RebalanceFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'manual';

/**
 * Asset universe options
 */
export type AssetUniverse = 'sp500' | 'nasdaq100' | 'dow30' | 'etf_universe' | 'custom';

/**
 * Parameter types for strategy configuration
 */
export type ParameterType = 'number' | 'select' | 'multi_select' | 'boolean' | 'date' | 'text';

/**
 * Parameter definition for dynamic form generation
 */
export interface ParameterDefinition {
  key: string;
  label: string;
  type: ParameterType;
  description?: string;
  required?: boolean;
  default?: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string | number; label: string }[];
  placeholder?: string;
  unit?: string;
}

/**
 * Built-in strategy parameter schemas
 */
export const STRATEGY_PARAMETER_SCHEMAS: Record<BuiltInStrategyType, ParameterDefinition[]> = {
  momentum: [
    {
      key: 'lookbackPeriod',
      label: 'Lookback Period',
      type: 'number',
      description: 'Number of days to look back for momentum calculation',
      default: 90,
      min: 20,
      max: 252,
      unit: 'days',
    },
    {
      key: 'topN',
      label: 'Number of Holdings',
      type: 'number',
      description: 'Number of top performing assets to hold',
      default: 10,
      min: 1,
      max: 50,
    },
    {
      key: 'minMomentum',
      label: 'Minimum Momentum',
      type: 'number',
      description: 'Minimum momentum threshold to include asset',
      default: 0,
      min: -100,
      max: 100,
      unit: '%',
    },
  ],
  mean_reversion: [
    {
      key: 'lookbackPeriod',
      label: 'Lookback Period',
      type: 'number',
      description: 'Number of days for moving average calculation',
      default: 20,
      min: 5,
      max: 100,
      unit: 'days',
    },
    {
      key: 'deviationThreshold',
      label: 'Deviation Threshold',
      type: 'number',
      description: 'Standard deviations below mean to trigger buy',
      default: 2,
      min: 0.5,
      max: 5,
      step: 0.1,
    },
    {
      key: 'topN',
      label: 'Max Positions',
      type: 'number',
      description: 'Maximum number of positions to hold',
      default: 10,
      min: 1,
      max: 50,
    },
  ],
  equal_weight: [
    {
      key: 'topN',
      label: 'Number of Holdings',
      type: 'number',
      description: 'Number of assets to hold with equal weight',
      default: 20,
      min: 2,
      max: 100,
    },
    {
      key: 'selectionMethod',
      label: 'Selection Method',
      type: 'select',
      description: 'How to select which assets to include',
      default: 'market_cap',
      options: [
        { value: 'market_cap', label: 'Market Cap Weighted' },
        { value: 'random', label: 'Random Selection' },
        { value: 'all', label: 'All in Universe' },
      ],
    },
  ],
  risk_parity: [
    {
      key: 'targetVolatility',
      label: 'Target Volatility',
      type: 'number',
      description: 'Target portfolio annualized volatility',
      default: 10,
      min: 5,
      max: 30,
      unit: '%',
    },
    {
      key: 'lookbackPeriod',
      label: 'Volatility Lookback',
      type: 'number',
      description: 'Days to look back for volatility calculation',
      default: 60,
      min: 20,
      max: 252,
      unit: 'days',
    },
    {
      key: 'useLeverage',
      label: 'Allow Leverage',
      type: 'boolean',
      description: 'Allow leverage to achieve target volatility',
      default: false,
    },
  ],
  smart_beta: [
    {
      key: 'factors',
      label: 'Factor Exposure',
      type: 'multi_select',
      description: 'Factors to tilt portfolio toward',
      default: ['value', 'momentum'],
      options: [
        { value: 'value', label: 'Value' },
        { value: 'momentum', label: 'Momentum' },
        { value: 'quality', label: 'Quality' },
        { value: 'low_volatility', label: 'Low Volatility' },
        { value: 'size', label: 'Size (Small Cap)' },
      ],
    },
    {
      key: 'factorWeight',
      label: 'Factor Weight',
      type: 'number',
      description: 'Weight given to factor scores vs market cap',
      default: 50,
      min: 0,
      max: 100,
      unit: '%',
    },
  ],
  buy_and_hold: [
    {
      key: 'allocation',
      label: 'Asset Allocation',
      type: 'text',
      description: 'JSON allocation map (e.g., {"SPY": 60, "BND": 40})',
      default: '{"SPY": 100}',
      placeholder: '{"SYMBOL": percentage, ...}',
    },
  ],
};

/**
 * Strategy configuration
 */
export interface StrategyConfig {
  type: StrategyType;
  parameters: Record<string, unknown>;
  universe: AssetUniverse;
  customSymbols?: string[];
  rebalanceFrequency: RebalanceFrequency;
  rebalanceDay?: number; // Day of week (0-6) or month (1-31)
}

/**
 * Strategy entity stored in Firestore
 */
export interface Strategy {
  id: string;
  userId: string;
  name: string;
  description: string;
  config: StrategyConfig;
  status: StrategyStatus;

  // For custom strategies
  code?: string;

  // Metadata
  tags: string[];
  isFavorite: boolean;

  // Sharing
  isPublic: boolean;
  authorVisible: boolean;
  allowCopy: boolean;
  copyCount: number;
  copiedFrom?: string; // Original strategy ID if forked

  // Performance tracking
  lastBacktestId?: string;
  lastBacktestReturn?: number;
  lastBacktestSharpe?: number;

  // Linked accounts for live trading
  linkedAccounts: string[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
}

/**
 * Strategy template for quick creation
 */
export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  type: StrategyType;
  config: Partial<StrategyConfig>;
  code?: string;
  icon?: string;
  category: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Pre-defined strategy templates
 */
export const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    id: 'momentum-basic',
    name: 'Basic Momentum',
    description: 'Buy the top performing stocks based on recent returns',
    type: 'momentum',
    config: {
      type: 'momentum',
      parameters: { lookbackPeriod: 90, topN: 10, minMomentum: 0 },
      universe: 'sp500',
      rebalanceFrequency: 'monthly',
    },
    icon: '📈',
    category: 'beginner',
  },
  {
    id: 'mean-reversion-basic',
    name: 'Mean Reversion',
    description: 'Buy oversold stocks expecting them to recover',
    type: 'mean_reversion',
    config: {
      type: 'mean_reversion',
      parameters: { lookbackPeriod: 20, deviationThreshold: 2, topN: 10 },
      universe: 'sp500',
      rebalanceFrequency: 'weekly',
    },
    icon: '🔄',
    category: 'intermediate',
  },
  {
    id: 'equal-weight-sp500',
    name: 'Equal Weight S&P 500',
    description: 'Hold equal amounts of top S&P 500 stocks',
    type: 'equal_weight',
    config: {
      type: 'equal_weight',
      parameters: { topN: 50, selectionMethod: 'market_cap' },
      universe: 'sp500',
      rebalanceFrequency: 'quarterly',
    },
    icon: '⚖️',
    category: 'beginner',
  },
  {
    id: 'risk-parity',
    name: 'Risk Parity',
    description: 'Balance portfolio by risk contribution, not dollar amount',
    type: 'risk_parity',
    config: {
      type: 'risk_parity',
      parameters: { targetVolatility: 10, lookbackPeriod: 60, useLeverage: false },
      universe: 'etf_universe',
      rebalanceFrequency: 'monthly',
    },
    icon: '🎯',
    category: 'advanced',
  },
  {
    id: 'multi-factor',
    name: 'Multi-Factor Smart Beta',
    description: 'Combine value and momentum factors for better risk-adjusted returns',
    type: 'smart_beta',
    config: {
      type: 'smart_beta',
      parameters: { factors: ['value', 'momentum'], factorWeight: 50 },
      universe: 'sp500',
      rebalanceFrequency: 'monthly',
    },
    icon: '🧠',
    category: 'advanced',
  },
  {
    id: 'buy-hold-60-40',
    name: '60/40 Portfolio',
    description: 'Classic 60% stocks, 40% bonds allocation',
    type: 'buy_and_hold',
    config: {
      type: 'buy_and_hold',
      parameters: { allocation: '{"SPY": 60, "BND": 40}' },
      universe: 'custom',
      customSymbols: ['SPY', 'BND'],
      rebalanceFrequency: 'yearly',
    },
    icon: '🏛️',
    category: 'beginner',
  },
];

/**
 * Strategy run result
 */
export interface StrategyRunResult {
  id: string;
  strategyId: string;
  runType: 'backtest' | 'live' | 'paper';
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalValue: number;
  totalReturn: number;
  cagr: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  trades: number;
  winRate: number;
  createdAt: Date;
}

/**
 * Strategy summary for list display
 */
export interface StrategySummary {
  id: string;
  name: string;
  type: StrategyType;
  status: StrategyStatus;
  description: string;
  lastBacktestReturn?: number;
  lastBacktestSharpe?: number;
  isFavorite: boolean;
  isPublic: boolean;
  linkedAccountCount: number;
  updatedAt: Date;
}

/**
 * Public strategy for the strategies_public collection
 * Contains only the fields needed for browsing/copying
 */
export interface PublicStrategy {
  id: string; // Same as the original strategy ID
  originalStrategyId: string;
  userId: string; // Author's user ID
  authorName?: string; // Author's display name (if authorVisible)
  authorVisible: boolean;
  allowCopy: boolean;

  // Strategy info
  name: string;
  description: string;
  type: StrategyType;
  config: StrategyConfig;
  tags: string[];

  // Performance (from last backtest)
  lastBacktestReturn?: number;
  lastBacktestSharpe?: number;
  lastBacktestMaxDrawdown?: number;

  // Social metrics
  copyCount: number;
  viewCount: number;

  // Timestamps
  publishedAt: Date;
  updatedAt: Date;
}

/**
 * Share settings for a strategy
 */
export interface StrategyShareSettings {
  isPublic: boolean;
  authorVisible: boolean;
  allowCopy: boolean;
}

/**
 * Helper to get strategy type display name
 */
export function getStrategyTypeName(type: StrategyType): string {
  const names: Record<StrategyType, string> = {
    momentum: 'Momentum',
    mean_reversion: 'Mean Reversion',
    equal_weight: 'Equal Weight',
    risk_parity: 'Risk Parity',
    smart_beta: 'Smart Beta',
    buy_and_hold: 'Buy & Hold',
    custom: 'Custom',
  };
  return names[type] || type;
}

/**
 * Helper to get strategy status display info
 */
export function getStrategyStatusInfo(status: StrategyStatus): { label: string; color: string } {
  const info: Record<StrategyStatus, { label: string; color: string }> = {
    draft: { label: 'Draft', color: 'gray' },
    active: { label: 'Active', color: 'green' },
    paused: { label: 'Paused', color: 'yellow' },
    archived: { label: 'Archived', color: 'red' },
  };
  return info[status] || { label: status, color: 'gray' };
}

/**
 * Helper to get rebalance frequency display name
 */
export function getRebalanceFrequencyName(frequency: RebalanceFrequency): string {
  const names: Record<RebalanceFrequency, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
    manual: 'Manual',
  };
  return names[frequency] || frequency;
}
