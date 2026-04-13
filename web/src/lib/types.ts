/**
 * Shared Type Definitions
 *
 * Central types module for TradePilot web application.
 * Re-exports core domain types and defines shared interfaces
 * used across multiple components.
 */

// ============================================================================
// Re-exports from existing type modules
// ============================================================================

export type {
  Account,
  AccountType,
  AccountStatus,
  Currency,
  SyncStatus,
  Holding,
  AssetType,
  HoldingFormData,
  Transaction,
  TransactionType,
  PortfolioSummary,
  AllocationItem,
  NetWorthSnapshot,
  CSVFormat,
  CSVValidationResult,
} from '../types/portfolio';

export type {
  Alert,
  AlertType,
  AlertStatus,
  AlertConfig,
  AlertFrequency,
  NotificationChannel,
  Notification,
  NotificationSeverity,
  NotificationPreferences,
} from '../types/alerts';

export type {
  Strategy,
  StrategyType,
  StrategyStatus,
  StrategyConfig,
  RebalanceFrequency,
  AssetUniverse,
} from '../types/strategies';

export type {
  WatchlistItem,
  MarketAsset,
  MarketAssetWithContext,
  SymbolSearchResult,
  AssetCategory,
} from '../types/markets';

export type {
  Goal,
  GoalCategory,
  GoalStatus,
  GoalProgress,
  TaxSummary,
  RealizedGainLoss,
  TaxLot,
} from '../types/reports';

export type {
  LeaderboardEntry,
  LeaderboardPeriod,
  RankingMetric,
} from '../types/leaderboard';

export type {
  UserProfile,
} from '../types/social';

// ============================================================================
// User (auth domain)
// ============================================================================

/**
 * Authenticated user from Firebase Auth + Firestore profile.
 * Matches the shape in stores/auth.ts.
 */
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'pending' | 'user' | 'premium' | 'admin';
  status: 'pending' | 'active' | 'suspended';
}

// ============================================================================
// Position (risk / analytics domain)
// ============================================================================

/**
 * A portfolio position used for risk analytics.
 * Sourced from RiskDashboard component usage.
 */
export interface Position {
  symbol: string;
  qty: number;
  marketValue: number;
  costBasis: number;
  unrealizedPl: number;
  currentPrice: number;
}

// ============================================================================
// Trade (execution / tax domain)
// ============================================================================

/**
 * A completed trade record used for tax calculations and trade history.
 * Sourced from TaxReport component usage.
 */
export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  total: number;
  date: Date;
}

// ============================================================================
// Portfolio (aggregated view)
// ============================================================================

/**
 * Aggregated portfolio state used by dashboard and portfolio views.
 * Combines real-time valuation with historical context.
 */
export interface Portfolio {
  totalValue: number;
  totalCostBasis: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dailyChange: number;
  dailyChangePercent: number;
  holdings: Holding[];
  accounts: Account[];
  portfolioHistory: NetWorthSnapshot[];
  hasIntegrations: boolean;
  isLoading: boolean;
}

// ============================================================================
// NetWorth (convenience alias)
// ============================================================================

/**
 * Net worth data point — alias for NetWorthSnapshot.
 */
export type NetWorth = NetWorthSnapshot;

// ============================================================================
// RiskMetrics
// ============================================================================

/**
 * Portfolio-level risk metrics displayed in RiskDashboard.
 * Sourced from RiskDashboard component usage.
 */
export interface RiskMetrics {
  /** Value at Risk (95% confidence, 1-day) */
  valueAtRisk: number;
  /** Annualised portfolio volatility */
  volatility: number;
  /** Sharpe ratio */
  sharpeRatio: number;
  /** Portfolio beta vs benchmark */
  beta: number;
  /** Portfolio alpha vs benchmark */
  alpha: number;
  /** Maximum drawdown percentage */
  maxDrawdown: number;
  /** Per-position risk breakdown */
  positionRisks: PositionRisk[];
  /** Pairwise correlation matrix keyed by symbol */
  correlationMatrix: Record<string, Record<string, number>>;
}

/**
 * Risk breakdown for a single position.
 */
export interface PositionRisk {
  symbol: string;
  weight: number;
  volatility: number;
  beta: number;
  contributionToRisk: number;
  valueAtRisk: number;
}

// ============================================================================
// TaxReport
// ============================================================================

/**
 * Tax report combining summary data with Form 8949 entries.
 * Used by the TaxReport component.
 */
export interface TaxReport {
  year: number;
  summary: TaxReportSummary;
  form8949Entries: Form8949Entry[];
  estimatedLiability: number;
}

/**
 * Summarised gains/losses for a tax year.
 */
export interface TaxReportSummary {
  shortTermGains: number;
  shortTermLosses: number;
  longTermGains: number;
  longTermLosses: number;
  netShortTerm: number;
  netLongTerm: number;
  totalNetGainLoss: number;
}

/**
 * IRS Form 8949 line item.
 */
export interface Form8949Entry {
  symbol: string;
  description: string;
  dateAcquired: Date;
  dateSold: Date;
  proceeds: number;
  costBasis: number;
  gainLoss: number;
  isShortTerm: boolean;
  holdingPeriodDays: number;
}

// ============================================================================
// Price history (analytics support)
// ============================================================================

/**
 * Historical price series for a symbol, used by risk analytics.
 */
export interface PriceHistory {
  symbol: string;
  prices: number[];
  dates: string[];
}

// ============================================================================
// Stress testing
// ============================================================================

/**
 * Result of a stress-test scenario.
 */
export interface StressTestResult {
  scenario: string;
  description: string;
  portfolioImpact: number;
  portfolioImpactPercent: number;
  positionImpacts: Array<{
    symbol: string;
    impact: number;
    impactPercent: number;
  }>;
}
