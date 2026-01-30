/**
 * Market Data Types
 *
 * Types for market data display, user watchlists, and strategy integration.
 */

/**
 * Asset category for filtering
 */
export type AssetCategory =
  | 'stocks'
  | 'etfs'
  | 'bonds'
  | 'fixed-income'
  | 'commodities'
  | 'crypto';

/**
 * Time period for performance calculations
 */
export type PerformancePeriod = 'day' | 'week' | 'month';

/**
 * Asset universe types (matches strategy types)
 */
export type AssetUniverse =
  | 'sp500'
  | 'nasdaq100'
  | 'dow30'
  | 'etf_universe'
  | 'custom';

/**
 * Strategy signal type for comprehensive integration
 */
export type StrategySignalType =
  | 'momentum'
  | 'mean_reversion'
  | 'smart_beta'
  | 'equal_weight'
  | 'risk_parity';

/**
 * Market asset with extended data
 */
export interface MarketAsset {
  symbol: string;
  name: string;
  category: AssetCategory;

  // Current price data
  price: number;
  previousClose: number;

  // Daily changes
  change: number;
  changePercent: number;

  // Extended periods (for performance cards)
  weekChange?: number;
  weekChangePercent?: number;
  monthChange?: number;
  monthChangePercent?: number;

  // Volume and market data
  volume?: number;
  avgVolume?: number;
  marketCap?: number;

  // Last update timestamp
  updatedAt?: Date;
}

/**
 * Strategy signal data for an asset
 */
export interface StrategySignal {
  type: StrategySignalType;
  score: number; // Normalized 0-100
  rank?: number; // Rank within universe
  signal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  details?: {
    // Momentum specific
    momentumScore?: number;
    lookbackReturn?: number;
    // Mean reversion specific
    deviationFromMA?: number;
    zScore?: number;
    // Smart beta specific
    factorScores?: Record<string, number>;
  };
}

/**
 * Market asset with user context and strategy signals
 */
export interface MarketAssetWithContext extends MarketAsset {
  // User context
  isInWatchlist: boolean;
  isOwned: boolean;
  ownedQuantity?: number;
  ownedValue?: number;
  costBasis?: number;
  unrealizedPL?: number;

  // Strategy context
  inUniverses: AssetUniverse[];
  strategySignals?: StrategySignal[];
}

/**
 * Watchlist item (user data - stored in Firestore)
 */
export interface WatchlistItem {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  category: AssetCategory;
  notes?: string;
  addedAt: Date;
  updatedAt?: Date;

  // Populated from market data (not stored)
  currentPrice?: number;
  change?: number;
  changePercent?: number;
}

/**
 * Watchlist form data for creating/updating
 */
export interface WatchlistFormData {
  symbol: string;
  name: string;
  category: AssetCategory;
  notes?: string;
}

/**
 * Performance summary for cards
 */
export interface PerformanceSummary {
  period: PerformancePeriod;
  topPerformers: MarketAsset[];
  lowestPerformers: MarketAsset[];
  calculatedAt: Date;
}

/**
 * Strategy universe preview for user's strategies
 */
export interface StrategyUniversePreview {
  strategyId: string;
  strategyName: string;
  strategyType: string;
  universe: AssetUniverse;
  symbolCount: number;
  sampleSymbols: string[];
  matchingWatchlist: string[];
  isActive: boolean;
}

/**
 * Holdings snapshot item
 */
export interface HoldingSnapshotItem {
  symbol: string;
  name: string;
  quantity: number;
  currentPrice: number;
  currentValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalPL: number;
  totalPLPercent: number;
}

/**
 * Sort options for asset table
 */
export type AssetSortField =
  | 'symbol'
  | 'name'
  | 'price'
  | 'change'
  | 'changePercent'
  | 'volume'
  | 'marketCap';

export type SortDirection = 'asc' | 'desc';

export interface AssetSortConfig {
  field: AssetSortField;
  direction: SortDirection;
}

/**
 * Asset action types for action menu
 */
export type AssetAction =
  | 'add_to_watchlist'
  | 'remove_from_watchlist'
  | 'create_alert'
  | 'view_chart'
  | 'add_to_strategy'
  | 'run_backtest';

/**
 * Source of a symbol search result for prioritization
 */
export type SymbolSearchSource =
  | 'watchlist'
  | 'holdings'
  | 'recent'
  | 'search';

/**
 * Symbol search result for autocomplete dropdown
 */
export interface SymbolSearchResult {
  symbol: string;
  name: string;
  category: AssetCategory;

  // Price data (optional, fetched separately)
  price?: number;
  change?: number;
  changePercent?: number;

  // Source for grouping and prioritization
  source: SymbolSearchSource;

  // User context
  isInWatchlist: boolean;
  isOwned: boolean;
  ownedQuantity?: number;
}
