/**
 * Market Data Types for TradePilot
 *
 * Defines price quotes, historical data, and caching structures.
 * Designed for CyberEco Platform compatibility with privacy-aware queries.
 *
 * @see https://github.com/cyber-eco/cybereco-monorepo
 */

import type { AssetClass, Currency, DataSource } from './assets';

// ============================================================================
// Price Quotes
// ============================================================================

/**
 * Real-time price quote for an asset
 */
export interface PriceQuote {
  // ─────────────────────────────────────────────────────────────────────────
  // Identity
  // ─────────────────────────────────────────────────────────────────────────
  assetId: string;                   // Reference to UniversalAsset.id
  symbol: string;                    // Trading symbol
  assetClass: AssetClass;            // For cache TTL decisions

  // ─────────────────────────────────────────────────────────────────────────
  // Core Prices
  // ─────────────────────────────────────────────────────────────────────────
  price: number;                     // Current/last price
  bid?: number;                      // Best bid
  ask?: number;                      // Best ask
  bidSize?: number;                  // Bid quantity
  askSize?: number;                  // Ask quantity

  // ─────────────────────────────────────────────────────────────────────────
  // OHLC (Intraday)
  // ─────────────────────────────────────────────────────────────────────────
  open?: number;                     // Today's open
  high?: number;                     // Today's high
  low?: number;                      // Today's low
  previousClose?: number;            // Yesterday's close

  // ─────────────────────────────────────────────────────────────────────────
  // Volume
  // ─────────────────────────────────────────────────────────────────────────
  volume?: number;                   // Today's volume
  volumeWeighted?: number;           // VWAP

  // ─────────────────────────────────────────────────────────────────────────
  // Change
  // ─────────────────────────────────────────────────────────────────────────
  change: number;                    // Absolute change
  changePercent: number;             // Percentage change

  // ─────────────────────────────────────────────────────────────────────────
  // Metadata
  // ─────────────────────────────────────────────────────────────────────────
  currency: Currency;
  source: DataSource;
  timestamp: Date;                   // When price was recorded at source
  marketStatus: MarketStatus;

  // ─────────────────────────────────────────────────────────────────────────
  // Cache Control
  // ─────────────────────────────────────────────────────────────────────────
  fetchedAt: Date;                   // When we fetched it
  expiresAt: Date;                   // When cache expires
  stale: boolean;                    // Is data potentially outdated?
  fromCache: boolean;                // Was this served from cache?
}

/**
 * Market status
 */
export type MarketStatus =
  | 'open'              // Regular trading hours
  | 'closed'            // Market closed
  | 'pre'               // Pre-market
  | 'post'              // After-hours
  | 'extended'          // Extended hours (combined pre/post)
  | 'holiday'           // Market holiday
  | 'unknown';          // Status not available (crypto, forex)

// ============================================================================
// Historical Data
// ============================================================================

/**
 * Timeframe for historical data
 */
export type Timeframe =
  | '1m'    // 1 minute
  | '5m'    // 5 minutes
  | '15m'   // 15 minutes
  | '30m'   // 30 minutes
  | '1h'    // 1 hour
  | '4h'    // 4 hours
  | '1d'    // 1 day
  | '1w'    // 1 week
  | '1M';   // 1 month

/**
 * OHLCV bar (candlestick data)
 */
export interface OHLCV {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;

  // Optional extended data
  vwap?: number;                     // Volume-weighted average price
  trades?: number;                   // Number of trades in period
}

/**
 * Price history for an asset
 */
export interface PriceHistory {
  assetId: string;
  symbol: string;
  timeframe: Timeframe;

  // Data
  bars: OHLCV[];

  // Metadata
  source: DataSource;
  startDate: Date;
  endDate: Date;
  totalBars: number;

  // Cache control
  fetchedAt: Date;
  expiresAt: Date;
}

// ============================================================================
// Cache Configuration
// ============================================================================

/**
 * Cache configuration for market data
 */
export interface MarketDataCacheConfig {
  // TTL by asset class (milliseconds)
  ttl: Record<AssetClass, number>;

  // Storage layers
  storage: {
    memory: boolean;                 // In-memory cache (fastest)
    localStorage: boolean;           // Persist across page loads
    indexedDB: boolean;              // Large historical data
  };

  // Refresh strategies
  refresh: {
    onFocus: boolean;                // Refresh when tab gains focus
    onReconnect: boolean;            // Refresh after network recovery
    background: boolean;             // Background polling
    websocket: boolean;              // Real-time streaming
  };

  // Limits
  maxMemoryEntries: number;          // Max items in memory cache
  maxLocalStorageSize: number;       // Max localStorage usage (bytes)
  maxHistoryBars: number;            // Max historical bars per asset
}

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: MarketDataCacheConfig = {
  ttl: {
    equity: 15_000,          // 15 seconds
    fixed_income: 300_000,   // 5 minutes
    crypto: 15_000,          // 15 seconds
    forex: 15_000,           // 15 seconds
    commodity: 60_000,       // 1 minute
    derivative: 15_000,      // 15 seconds
    prediction: 30_000,      // 30 seconds
    real_asset: 3600_000,    // 1 hour
    cash: 86400_000,         // 24 hours
    external: 3600_000,      // 1 hour
  },
  storage: {
    memory: true,
    localStorage: true,
    indexedDB: true,
  },
  refresh: {
    onFocus: true,
    onReconnect: true,
    background: true,
    websocket: true,
  },
  maxMemoryEntries: 500,
  maxLocalStorageSize: 5 * 1024 * 1024,  // 5MB
  maxHistoryBars: 5000,
};

// ============================================================================
// User Preferences
// ============================================================================

/**
 * User preferences for market data
 * Stored in Firestore under user preferences
 */
export interface MarketDataPreferences {
  /** Refresh mode */
  refreshMode: 'fast' | 'balanced' | 'conservative' | 'custom';

  /** Custom interval (ms) - only used when refreshMode is 'custom' */
  customIntervalMs?: number;

  /** Enable WebSocket real-time streaming */
  enableWebSocket: boolean;

  /** Show refresh countdown timer in UI */
  showRefreshTimer: boolean;

  /** Behavior when offline */
  offlineMode: 'cache' | 'stale' | 'hide';

  /** Flash price on change */
  flashOnChange: boolean;

  /** Sound on significant price change */
  soundOnSignificantChange: boolean;

  /** Significant change threshold (percent) */
  significantChangeThreshold: number;
}

/**
 * Default user preferences
 */
export const DEFAULT_MARKET_DATA_PREFERENCES: MarketDataPreferences = {
  refreshMode: 'balanced',
  enableWebSocket: true,
  showRefreshTimer: true,
  offlineMode: 'stale',
  flashOnChange: true,
  soundOnSignificantChange: false,
  significantChangeThreshold: 5,
};

/**
 * Refresh interval presets (ms)
 */
export const REFRESH_PRESETS: Record<MarketDataPreferences['refreshMode'], number> = {
  fast: 5_000,         // 5 seconds
  balanced: 15_000,    // 15 seconds
  conservative: 60_000, // 1 minute
  custom: 15_000,      // Default for custom
};

// ============================================================================
// Cached Entry
// ============================================================================

/**
 * Cached price entry with metadata
 */
export interface CachedPrice {
  data: PriceQuote;
  cachedAt: number;                  // Unix timestamp (ms)
  expiresAt: number;                 // Unix timestamp (ms)
  source: CacheSource;
  hits: number;                      // Access count
}

/**
 * Cache source
 */
export type CacheSource = 'memory' | 'localStorage' | 'indexedDB' | 'api';

/**
 * Cache statistics
 */
export interface CacheStats {
  memorySize: number;
  localStorageSize: number;
  indexedDBSize: number;
  hitRate: number;                   // 0-1
  missRate: number;                  // 0-1
  avgFetchTime: number;              // ms
  oldestEntry: Date | null;
  newestEntry: Date | null;
}

// ============================================================================
// Subscription & Updates
// ============================================================================

/**
 * Price update event
 */
export interface PriceUpdateEvent {
  type: 'quote' | 'trade' | 'bar';
  symbol: string;
  quote?: PriceQuote;
  trade?: TradeUpdate;
  bar?: OHLCV;
  timestamp: Date;
}

/**
 * Trade update (from WebSocket)
 */
export interface TradeUpdate {
  symbol: string;
  price: number;
  size: number;
  timestamp: Date;
  exchange?: string;
  conditions?: string[];
}

/**
 * Subscription status
 */
export interface SubscriptionStatus {
  symbol: string;
  subscribed: boolean;
  subscribedAt?: Date;
  lastUpdate?: Date;
  updateCount: number;
  errors: number;
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Batch quote request
 */
export interface BatchQuoteRequest {
  symbols: string[];
  dataSource?: DataSource;           // Override default source
  maxAge?: number;                   // Max cache age (ms)
  forceRefresh?: boolean;            // Bypass cache
}

/**
 * Batch quote response
 */
export interface BatchQuoteResponse {
  quotes: Map<string, PriceQuote>;
  errors: Map<string, Error>;
  fromCache: number;                 // Count of cached results
  fromApi: number;                   // Count of fresh fetches
  totalTime: number;                 // Total request time (ms)
}

/**
 * History request
 */
export interface HistoryRequest {
  symbol: string;
  timeframe: Timeframe;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  dataSource?: DataSource;
}

// ============================================================================
// Service State
// ============================================================================

/**
 * Market data service state
 */
export interface MarketDataServiceState {
  // Connection status
  connected: boolean;
  websocketStatus: 'disconnected' | 'connecting' | 'connected' | 'error';

  // Subscriptions
  subscriptions: Map<string, SubscriptionStatus>;

  // Last activity
  lastFetch: Date | null;
  lastWebSocketMessage: Date | null;

  // Errors
  lastError: Error | null;
  errorCount: number;

  // Performance
  avgFetchTime: number;
  cacheStats: CacheStats;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Check if a quote is stale based on cache config
 */
export function isQuoteStale(
  quote: PriceQuote,
  config: MarketDataCacheConfig = DEFAULT_CACHE_CONFIG
): boolean {
  const ttl = config.ttl[quote.assetClass] || config.ttl.equity;
  const age = Date.now() - quote.fetchedAt.getTime();
  return age > ttl;
}

/**
 * Get TTL for an asset class
 */
export function getTTL(
  assetClass: AssetClass,
  config: MarketDataCacheConfig = DEFAULT_CACHE_CONFIG
): number {
  return config.ttl[assetClass] || config.ttl.equity;
}

/**
 * Calculate expiration date
 */
export function calculateExpiration(
  assetClass: AssetClass,
  config: MarketDataCacheConfig = DEFAULT_CACHE_CONFIG
): Date {
  const ttl = getTTL(assetClass, config);
  return new Date(Date.now() + ttl);
}

/**
 * Format price change for display
 */
export function formatPriceChange(
  change: number,
  changePercent: number
): { text: string; color: string } {
  const sign = change >= 0 ? '+' : '';
  const text = `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
  const color = change > 0 ? 'green' : change < 0 ? 'red' : 'neutral';
  return { text, color };
}

/**
 * Determine if market is currently open
 */
export function isMarketOpen(status: MarketStatus): boolean {
  return ['open', 'pre', 'post', 'extended'].includes(status);
}
