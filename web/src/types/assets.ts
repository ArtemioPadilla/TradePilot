/**
 * Universal Asset Model for TradePilot
 *
 * Designed for compatibility with CyberEco Platform's data architecture.
 * Supports progressive decentralization and privacy-first principles.
 *
 * @see https://github.com/cyber-eco/cybereco-monorepo
 */

// ============================================================================
// Asset Classification
// ============================================================================

/**
 * Primary asset class taxonomy
 */
export type AssetClass =
  | 'equity'           // Stocks, ETFs, ADRs
  | 'fixed_income'     // Bonds, CDs
  | 'crypto'           // Cryptocurrencies
  | 'forex'            // Currency pairs
  | 'commodity'        // Gold, oil, agricultural
  | 'derivative'       // Options, futures
  | 'prediction'       // Prediction markets (Polymarket)
  | 'real_asset'       // Real estate, collectibles
  | 'cash'             // Cash positions
  | 'external';        // External/manual assets

/**
 * Asset subclass by parent class
 */
export type AssetSubclass = {
  equity: 'common_stock' | 'preferred_stock' | 'etf' | 'adr' | 'reit' | 'index';
  fixed_income: 'corporate_bond' | 'government_bond' | 'municipal_bond' | 'cd' | 'treasury';
  crypto: 'layer1' | 'layer2' | 'defi' | 'stablecoin' | 'nft' | 'memecoin' | 'utility';
  forex: 'major' | 'minor' | 'exotic' | 'crypto_pair';
  commodity: 'precious_metal' | 'energy' | 'agriculture' | 'industrial' | 'livestock';
  derivative: 'call_option' | 'put_option' | 'future' | 'perpetual' | 'warrant';
  prediction: 'binary' | 'multi_outcome' | 'range' | 'scalar';
  real_asset: 'real_estate' | 'vehicle' | 'collectible' | 'art' | 'jewelry';
  cash: 'checking' | 'savings' | 'money_market' | 'foreign_currency';
  external: 'custom' | 'import';
};

/**
 * Data source providers
 */
export type DataSource =
  | 'alpaca'           // Alpaca Markets API
  | 'coingecko'        // CoinGecko for crypto
  | 'exchangerate'     // ExchangeRate-API for forex
  | 'polymarket'       // Polymarket for predictions
  | 'yahoo'            // Yahoo Finance (fallback)
  | 'manual'           // User-entered data
  | 'cybereco';        // Future: CyberEco data layer

/**
 * Supported currencies
 */
export type Currency =
  | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY'
  | 'BTC' | 'ETH' | 'USDT' | 'USDC';

// ============================================================================
// Universal Asset
// ============================================================================

/**
 * Universal Asset - represents any tradeable or trackable asset
 *
 * Compatible with CyberEco's data architecture for future migration.
 * Supports encryption-ready fields for privacy preservation.
 */
export interface UniversalAsset {
  // ─────────────────────────────────────────────────────────────────────────
  // Identity (CyberEco-compatible: will map to on-chain identity)
  // ─────────────────────────────────────────────────────────────────────────
  id: string;                        // Unique identifier
  symbol: string;                    // Trading symbol (AAPL, BTC-USD, EUR/USD)
  name: string;                      // Human-readable name

  // ─────────────────────────────────────────────────────────────────────────
  // Classification
  // ─────────────────────────────────────────────────────────────────────────
  assetClass: AssetClass;
  subclass?: string;                 // From AssetSubclass[assetClass]

  // ─────────────────────────────────────────────────────────────────────────
  // Data Source (for price/data fetching)
  // ─────────────────────────────────────────────────────────────────────────
  dataSource: DataSource;
  externalId?: string;               // ID in source system
  externalMetadata?: Record<string, unknown>; // Source-specific metadata

  // ─────────────────────────────────────────────────────────────────────────
  // Pricing Configuration
  // ─────────────────────────────────────────────────────────────────────────
  baseCurrency: Currency;            // Primary currency (USD for stocks)
  quoteCurrency?: Currency;          // For forex pairs (EUR/USD -> quote is USD)

  // ─────────────────────────────────────────────────────────────────────────
  // Metadata
  // ─────────────────────────────────────────────────────────────────────────
  exchange?: string;                 // NYSE, NASDAQ, etc.
  sector?: string;                   // Technology, Healthcare, etc.
  industry?: string;                 // Software, Biotechnology, etc.
  country?: string;                  // ISO 3166-1 alpha-2
  tags?: string[];                   // User-defined tags
  description?: string;              // Asset description

  // ─────────────────────────────────────────────────────────────────────────
  // Trading Capabilities
  // ─────────────────────────────────────────────────────────────────────────
  isTradeable: boolean;              // Can be traded via connected brokers
  isActive: boolean;                 // Currently active/listed
  fractionalAllowed: boolean;        // Supports fractional shares
  marginEligible?: boolean;          // Eligible for margin trading
  shortable?: boolean;               // Can be sold short

  // ─────────────────────────────────────────────────────────────────────────
  // Market Data Hints
  // ─────────────────────────────────────────────────────────────────────────
  marketHours?: MarketHours;
  lotSize?: number;                  // Minimum trade unit
  tickSize?: number;                 // Minimum price movement

  // ─────────────────────────────────────────────────────────────────────────
  // Timestamps (CyberEco-compatible: Firestore Timestamps)
  // ─────────────────────────────────────────────────────────────────────────
  createdAt: Date;
  updatedAt: Date;

  // ─────────────────────────────────────────────────────────────────────────
  // CyberEco Future Compatibility
  // ─────────────────────────────────────────────────────────────────────────
  /** Data hash for integrity verification (future: on-chain) */
  dataHash?: string;
  /** Decentralized identifier (future: DID) */
  did?: string;
}

/**
 * Market hours configuration
 */
export interface MarketHours {
  timezone: string;                  // IANA timezone
  regularOpen: string;               // HH:mm format
  regularClose: string;
  extendedOpen?: string;
  extendedClose?: string;
  tradingDays: number[];             // 0-6 (Sun-Sat)
}

// ============================================================================
// Asset Registry
// ============================================================================

/**
 * Asset registry entry - for caching and lookup
 */
export interface AssetRegistryEntry {
  asset: UniversalAsset;

  // Cache metadata
  cachedAt: Date;
  expiresAt: Date;
  source: 'api' | 'cache' | 'manual';

  // Usage tracking
  lastAccessedAt: Date;
  accessCount: number;
}

/**
 * Asset search filters
 */
export interface AssetSearchFilters {
  query?: string;                    // Search term
  assetClasses?: AssetClass[];       // Filter by class
  dataSources?: DataSource[];        // Filter by source
  isTradeable?: boolean;
  isActive?: boolean;
  exchange?: string;
  sector?: string;
  country?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Asset search result
 */
export interface AssetSearchResult {
  assets: UniversalAsset[];
  total: number;
  hasMore: boolean;
  searchTime: number;                // ms
}

// ============================================================================
// Data Source Configuration
// ============================================================================

/**
 * Data provider configuration
 */
export interface DataProviderConfig {
  id: DataSource;
  name: string;
  supportedAssetClasses: AssetClass[];

  // Capabilities
  supportsRealtime: boolean;
  supportsHistory: boolean;
  supportsFundamentals: boolean;

  // Rate limits
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay?: number;
  };

  // Authentication
  requiresAuth: boolean;
  authType?: 'api_key' | 'oauth' | 'none';
}

/**
 * Default data source mappings
 */
export const DEFAULT_DATA_SOURCES: Record<AssetClass, DataSource> = {
  equity: 'alpaca',
  fixed_income: 'manual',
  crypto: 'coingecko',
  forex: 'exchangerate',
  commodity: 'manual',
  derivative: 'alpaca',
  prediction: 'polymarket',
  real_asset: 'manual',
  cash: 'manual',
  external: 'manual',
};

// ============================================================================
// Asset Helpers
// ============================================================================

/**
 * Check if an asset class supports real-time data
 */
export function supportsRealtime(assetClass: AssetClass): boolean {
  return ['equity', 'crypto', 'forex', 'derivative'].includes(assetClass);
}

/**
 * Get the default refresh interval for an asset class (ms)
 */
export function getDefaultRefreshInterval(assetClass: AssetClass): number {
  switch (assetClass) {
    case 'equity':
    case 'derivative':
      return 15_000;    // 15 seconds during market hours
    case 'crypto':
    case 'forex':
      return 15_000;    // 15 seconds (24/7)
    case 'prediction':
      return 30_000;    // 30 seconds
    case 'commodity':
      return 60_000;    // 1 minute
    default:
      return 300_000;   // 5 minutes for manual/static assets
  }
}

/**
 * Create a symbol key for caching (handles forex pairs, etc.)
 */
export function createSymbolKey(
  symbol: string,
  dataSource: DataSource,
  quoteCurrency?: Currency
): string {
  const base = `${dataSource}:${symbol.toUpperCase()}`;
  return quoteCurrency ? `${base}:${quoteCurrency}` : base;
}

/**
 * Parse a symbol key back to components
 */
export function parseSymbolKey(key: string): {
  dataSource: DataSource;
  symbol: string;
  quoteCurrency?: Currency;
} {
  const [dataSource, symbol, quoteCurrency] = key.split(':');
  return {
    dataSource: dataSource as DataSource,
    symbol,
    quoteCurrency: quoteCurrency as Currency | undefined,
  };
}
