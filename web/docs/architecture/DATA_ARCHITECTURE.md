# Universal Asset Data Architecture

> Comprehensive data architecture for TradePilot supporting multi-asset classes, reactive market data, and CyberEco Platform compatibility.

## Overview

The Universal Asset Data Architecture provides:

1. **Reactive Market Data** - Real-time prices with intelligent caching
2. **Multi-Asset Classes** - Stocks, forex, crypto, prediction markets, physical assets, cash
3. **User-Generated Content** - Strategies, portfolios with full access control
4. **Social & AI Capabilities** - Sharing, collaboration, AI-powered insights
5. **CyberEco Compatibility** - Designed for future integration with decentralized data layer

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           React Components                                   │
│  OrderForm, PriceDisplay, PortfolioChart, MarketWatch, StrategyBuilder      │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ useMarketData() / usePrice() hooks
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MarketDataContext                                     │
│  - Global price state              - Connection management                   │
│  - Subscription registry           - Preferences management                  │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MarketDataService                                     │
│  - Provider coordination           - Batch quote fetching                    │
│  - WebSocket management            - History retrieval                       │
│  - Event emission                  - Error handling                          │
└───────────┬──────────────┬──────────────┬──────────────┬────────────────────┘
            │              │              │              │
            ▼              ▼              ▼              ▼
      ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
      │ Alpaca  │   │CoinGecko │   │  Forex   │   │Polymarket│
      │Provider │   │ Provider │   │ Provider │   │ Provider │
      │(active) │   │ (planned)│   │ (planned)│   │ (planned)│
      └────┬────┘   └──────────┘   └──────────┘   └──────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MarketDataCache                                       │
│  ┌─────────────┐   ┌─────────────────┐   ┌──────────────────┐               │
│  │   Memory    │   │  localStorage   │   │    IndexedDB     │               │
│  │  (fastest)  │   │ (persist tabs)  │   │ (history data)   │               │
│  └─────────────┘   └─────────────────┘   └──────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Type System

### Asset Classification

```typescript
// Primary asset classes
type AssetClass =
  | 'equity'           // Stocks, ETFs
  | 'fixed_income'     // Bonds, CDs
  | 'crypto'           // Cryptocurrencies
  | 'forex'            // Currency pairs
  | 'commodity'        // Gold, oil, agricultural
  | 'derivative'       // Options, futures
  | 'prediction'       // Prediction markets
  | 'real_asset'       // Real estate, collectibles
  | 'cash'             // Cash positions
  | 'external';        // Manual/external assets

// Data source providers
type DataSource =
  | 'alpaca'           // Stocks (active)
  | 'coingecko'        // Crypto (planned)
  | 'exchangerate'     // Forex (planned)
  | 'polymarket'       // Predictions (planned)
  | 'yahoo'            // Fallback (planned)
  | 'manual'           // User-entered
  | 'cybereco';        // Future decentralized layer
```

### Universal Asset Model

```typescript
interface UniversalAsset {
  // Identity
  id: string;
  symbol: string;                    // AAPL, BTC-USD, EUR/USD
  name: string;
  assetClass: AssetClass;
  subclass?: string;

  // Data Source
  dataSource: DataSource;
  externalId?: string;

  // Pricing
  baseCurrency: Currency;
  quoteCurrency?: Currency;          // For forex pairs

  // Metadata
  exchange?: string;
  sector?: string;
  country?: string;
  tags?: string[];

  // Capabilities
  isTradeable: boolean;
  isActive: boolean;
  fractionalAllowed: boolean;

  // CyberEco Future
  did?: string;                      // Decentralized identifier
  dataHash?: string;                 // Integrity verification
}
```

### Price Quote Model

```typescript
interface PriceQuote {
  assetId: string;
  symbol: string;
  assetClass: AssetClass;

  // Prices
  price: number;
  bid?: number;
  ask?: number;
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;

  // Volume
  volume?: number;
  volumeWeighted?: number;

  // Change
  change: number;
  changePercent: number;

  // Metadata
  source: DataSource;
  timestamp: Date;
  marketStatus: MarketStatus;

  // Cache control
  fetchedAt: Date;
  expiresAt: Date;
  stale: boolean;
  fromCache: boolean;
}
```

## Services

### MarketDataService

Central service for fetching and managing market data.

```typescript
import { getMarketDataService } from '@/lib/services/market-data';

const service = getMarketDataService();

// Register provider
service.registerProvider(alpacaProvider);

// Get single quote
const quote = await service.getQuote('AAPL', {
  assetClass: 'equity',
  forceRefresh: false,
});

// Get batch quotes
const response = await service.getQuotes({
  symbols: ['AAPL', 'GOOGL', 'MSFT'],
  forceRefresh: false,
});

// Subscribe to real-time updates
service.subscribe(['AAPL'], (quote) => {
  console.log('Price update:', quote);
});

// Get historical data
const history = await service.getHistory({
  symbol: 'AAPL',
  timeframe: '1d',
  startDate: new Date('2024-01-01'),
});
```

### MarketDataCache

Multi-layer caching with configurable TTL.

```typescript
// Default TTL by asset class
const ttl = {
  equity: 15_000,        // 15 seconds
  crypto: 15_000,        // 15 seconds (24/7)
  forex: 15_000,         // 15 seconds
  prediction: 30_000,    // 30 seconds
  commodity: 60_000,     // 1 minute
  real_asset: 3600_000,  // 1 hour
  cash: 86400_000,       // 24 hours
};
```

## React Integration

### useMarketData Hook

```typescript
import { useMarketData, usePrice } from '@/hooks/useMarketData';

// Multiple symbols with options
function WatchList() {
  const {
    prices,
    loading,
    error,
    lastUpdated,
    nextRefresh,
    secondsUntilRefresh,
    isStale,
    isConnected,
    refresh,
  } = useMarketData({
    symbols: ['AAPL', 'GOOGL', 'MSFT'],
    enableWebSocket: true,
    enableRefresh: true,
    refreshInterval: 15000,
  });

  return (
    <div>
      {Array.from(prices.values()).map(quote => (
        <PriceDisplay key={quote.symbol} quote={quote} />
      ))}
    </div>
  );
}

// Single price
function StockPrice({ symbol }: { symbol: string }) {
  const { price, loading, error } = usePrice(symbol);

  if (loading) return <Skeleton />;
  if (error) return <Error message={error.message} />;

  return <span>${price?.price.toFixed(2)}</span>;
}
```

### MarketDataContext

Global context for application-wide market data state.

```typescript
import { MarketDataProvider, useMarketDataContext } from '@/contexts/MarketDataContext';

// Wrap your app
function App() {
  return (
    <MarketDataProvider
      initialPreferences={{
        refreshMode: 'balanced',
        enableWebSocket: true,
      }}
    >
      <Dashboard />
    </MarketDataProvider>
  );
}

// Use in components
function TradingPanel() {
  const {
    marketStatus,
    connected,
    getPrice,
    subscribeToPrice,
  } = useMarketDataContext();

  // Subscribe to updates
  useEffect(() => {
    const unsubscribe = subscribeToPrice('AAPL', (price) => {
      console.log('New price:', price);
    });
    return unsubscribe;
  }, []);
}
```

## UI Components

### PriceDisplay

```typescript
import { PriceDisplay } from '@/components/market';

// Full display
<PriceDisplay
  symbol="AAPL"
  showChange={true}
  showPercent={true}
  showLastUpdate={true}
  showCountdown={true}
  flashOnChange={true}
  size="lg"
/>

// Compact inline
<PriceDisplay
  symbol="AAPL"
  compact={true}
  size="sm"
/>
```

### MarketStatus

```typescript
import { MarketStatus, MarketStatusBadge } from '@/components/market';

// Full status bar
<MarketStatus
  showConnection={true}
  showRefreshInterval={true}
  showTime={true}
/>

// Compact badge
<MarketStatusBadge />
```

## CyberEco Compatibility

The architecture is designed for seamless integration with CyberEco Platform's data layer.

### Privacy Controls

```typescript
// Visibility levels (CyberEco-compatible)
type VisibilityLevel =
  | 'private'        // Only owner
  | 'confidential'   // Owner + explicitly shared
  | 'internal'       // All authenticated users
  | 'public';        // Anyone

// Access control
interface AccessControl {
  visibility: VisibilityLevel;
  sharedWith: SharedAccess[];
  createdBy: string;
  authorVisible: boolean;
  allowCopy: boolean;
  allowComment: boolean;
  allowDerivatives: boolean;
}
```

### Consent Management

```typescript
// GDPR-compliant consent types
type ConsentType =
  | 'necessary'
  | 'functional'
  | 'analytics'
  | 'marketing'
  | 'personalization';

// Check consent before tracking
if (hasConsent(userConsent, 'analytics')) {
  trackEvent('price_viewed', { symbol });
}
```

### Future Hub Gateway Integration

```typescript
// Detect if running behind CyberEco Hub proxy
const isProxied = request.headers.get('x-hub-proxy') === 'true';

if (isProxied) {
  // Use Hub's authentication
  const auth = getHubAuth();
} else {
  // Direct access
  const auth = getFirebaseAuth();
}
```

## File Structure

```
web/src/
├── types/
│   ├── assets.ts              # Universal asset model
│   ├── market-data.ts         # Price/quote types
│   ├── permissions.ts         # Access control types
│   └── social.ts              # Social graph types
│
├── lib/services/
│   ├── market-data/
│   │   ├── cache.ts           # Multi-layer caching
│   │   ├── service.ts         # Main service
│   │   └── index.ts           # Exports
│   │
│   └── data-providers/
│       ├── alpaca.ts          # Alpaca implementation
│       └── index.ts           # Provider registry
│
├── hooks/
│   └── useMarketData.ts       # React hooks
│
├── contexts/
│   └── MarketDataContext.tsx  # Global context
│
└── components/market/
    ├── PriceDisplay.tsx       # Price display component
    ├── MarketStatus.tsx       # Market status indicator
    └── index.ts               # Component exports
```

## Configuration

### User Preferences

```typescript
interface MarketDataPreferences {
  refreshMode: 'fast' | 'balanced' | 'conservative' | 'custom';
  customIntervalMs?: number;
  enableWebSocket: boolean;
  showRefreshTimer: boolean;
  offlineMode: 'cache' | 'stale' | 'hide';
  flashOnChange: boolean;
  soundOnSignificantChange: boolean;
  significantChangeThreshold: number;  // percent
}
```

### Refresh Intervals

| Mode | Interval | Use Case |
|------|----------|----------|
| fast | 5s | Active trading |
| balanced | 15s | Normal use (default) |
| conservative | 60s | Battery/data saving |
| custom | User-defined | Power users |

## Error Handling

```typescript
// Service errors
service.addEventListener((event) => {
  if (event.type === 'error') {
    logger.error('Market data error', {
      error: event.error,
      symbol: event.symbol,
    });

    // Show user notification
    notify.error('Failed to fetch price data');
  }
});

// Hook errors
const { error } = useMarketData({ symbols: ['AAPL'] });

if (error) {
  return <ErrorBoundary error={error} retry={refresh} />;
}
```

## Testing

```typescript
// Mock provider for tests
const mockProvider: DataProvider = {
  id: 'mock',
  name: 'Mock Provider',
  supportedAssetClasses: ['equity'],
  supportsRealtime: false,
  supportsHistory: false,

  async getQuote(symbol) {
    return {
      symbol,
      price: 100,
      change: 1.5,
      changePercent: 1.52,
      // ...
    };
  },

  async getQuotes(symbols) {
    return new Map(symbols.map(s => [s, this.getQuote(s)]));
  },
};

// In tests
service.registerProvider(mockProvider);
```

## Roadmap

### Sprint 1: Market Data Foundation ✅
- [x] Universal asset types
- [x] Market data types
- [x] Multi-layer cache
- [x] MarketDataService
- [x] Alpaca provider
- [x] useMarketData hook
- [x] MarketDataContext
- [x] PriceDisplay component
- [x] MarketStatus component

### Sprint 2: Enhanced Permissions
- [ ] Wire OrderForm to useMarketData
- [ ] Add sharing UI components
- [ ] Update Firestore security rules

### Sprint 3: Social Graph
- [ ] Follow/unfollow
- [ ] Activity feed
- [ ] Comments/likes
- [ ] Profile pages

### Sprint 4: Additional Providers
- [ ] CoinGecko integration
- [ ] Forex provider
- [ ] Polymarket integration
