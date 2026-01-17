# TradePilot Data Models & API Specification

## TypeScript Interfaces

### User & Authentication

```typescript
// User profile stored in Firestore: users/{uid}
interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp | null;
  inviteCode: string | null; // Code used to register
}

type UserRole = 'pending' | 'user' | 'premium' | 'admin';
type UserStatus = 'pending' | 'active' | 'suspended';

// User preferences stored in Firestore: users/{uid}/preferences
interface UserPreferences {
  theme: 'bloomberg' | 'modern' | 'dashboard';
  layout: LayoutConfig;
  notifications: NotificationPreferences;
  defaultAccountId: string | null;
  currency: string; // ISO 4217 currency code (USD, EUR, etc.)
  timezone: string; // IANA timezone
}

interface LayoutConfig {
  dashboardWidgets: WidgetConfig[];
  sidebarCollapsed: boolean;
}

interface WidgetConfig {
  id: string;
  type: WidgetType;
  position: { x: number; y: number; w: number; h: number };
  settings: Record<string, unknown>;
}

type WidgetType =
  | 'portfolio-summary'
  | 'holdings-table'
  | 'performance-chart'
  | 'allocation-chart'
  | 'watchlist'
  | 'recent-activity'
  | 'alerts'
  | 'news';

interface NotificationPreferences {
  email: {
    enabled: boolean;
    digest: 'realtime' | 'daily' | 'weekly' | 'none';
    types: NotificationType[];
  };
  push: {
    enabled: boolean;
    types: NotificationType[];
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
  };
}

type NotificationType =
  | 'price_alert'
  | 'trade_executed'
  | 'rebalance_due'
  | 'strategy_signal'
  | 'drawdown_alert'
  | 'dividend_received';
```

### Invites

```typescript
// Stored in Firestore: invites/{code}
interface Invite {
  code: string;
  email: string | null; // Optional: restrict to specific email
  createdBy: string; // Admin UID
  createdAt: Timestamp;
  expiresAt: Timestamp | null;
  usedAt: Timestamp | null;
  usedBy: string | null; // UID of user who used it
  maxUses: number;
  useCount: number;
}
```

### Accounts & Holdings

```typescript
// Stored in Firestore: users/{uid}/accounts/{accountId}
interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  institution: string | null;
  isConnected: boolean; // For broker accounts
  lastSyncAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata: AccountMetadata;
}

type AccountType =
  | 'alpaca'
  | 'manual'
  | 'crypto'
  | '401k'
  | 'ira'
  | 'roth_ira'
  | 'brokerage'
  | 'other';

interface AccountMetadata {
  // Alpaca-specific
  alpaca?: {
    accountId: string;
    environment: 'paper' | 'live';
    buyingPower: number;
    cash: number;
    portfolioValue: number;
    daytradeCount: number;
    pdtStatus: boolean;
  };
}

// Stored in Firestore: users/{uid}/accounts/{accountId}/holdings/{holdingId}
interface Holding {
  id: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  quantity: number;
  avgCost: number; // Per share/unit cost basis
  currentPrice: number;
  lastUpdated: Timestamp;
  lots: TaxLot[];
}

type AssetType =
  | 'stock'
  | 'etf'
  | 'mutual_fund'
  | 'bond'
  | 'crypto'
  | 'option'
  | 'other';

interface TaxLot {
  id: string;
  purchaseDate: Timestamp;
  quantity: number;
  costPerShare: number;
}

// Stored in Firestore: users/{uid}/accounts/{accountId}/transactions/{txId}
interface Transaction {
  id: string;
  type: TransactionType;
  symbol: string | null;
  quantity: number | null;
  price: number | null;
  amount: number; // Total value
  fees: number;
  timestamp: Timestamp;
  status: TransactionStatus;
  notes: string | null;
  orderId: string | null; // Reference to order if from trading
}

type TransactionType =
  | 'buy'
  | 'sell'
  | 'dividend'
  | 'interest'
  | 'deposit'
  | 'withdrawal'
  | 'fee'
  | 'transfer_in'
  | 'transfer_out'
  | 'split'
  | 'merger';

type TransactionStatus = 'pending' | 'completed' | 'cancelled' | 'failed';
```

### Trading

```typescript
// Stored in Firestore: users/{uid}/orders/{orderId}
interface Order {
  id: string;
  accountId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: OrderType;
  timeInForce: TimeInForce;
  quantity: number;
  limitPrice: number | null;
  stopPrice: number | null;
  trailPercent: number | null;
  trailAmount: number | null;
  status: OrderStatus;
  filledQty: number;
  filledAvgPrice: number | null;
  submittedAt: Timestamp;
  filledAt: Timestamp | null;
  cancelledAt: Timestamp | null;
  expiresAt: Timestamp | null;
  brokerId: string | null; // External broker order ID
  errorMessage: string | null;
}

type OrderType =
  | 'market'
  | 'limit'
  | 'stop'
  | 'stop_limit'
  | 'trailing_stop';

type TimeInForce =
  | 'day'
  | 'gtc'      // Good til cancelled
  | 'ioc'      // Immediate or cancel
  | 'fok'      // Fill or kill
  | 'opg'      // At open
  | 'cls';     // At close

type OrderStatus =
  | 'pending'
  | 'submitted'
  | 'accepted'
  | 'partially_filled'
  | 'filled'
  | 'cancelled'
  | 'rejected'
  | 'expired';
```

### Strategies & Backtesting

```typescript
// Stored in Firestore: users/{uid}/strategies/{strategyId}
interface Strategy {
  id: string;
  name: string;
  description: string;
  type: StrategyType;
  code: string | null; // Python code for custom strategies
  parameters: StrategyParameters;
  isPublic: boolean;
  showAuthor: boolean;
  allowCopy: boolean;
  copiedFrom: string | null; // Original strategy ID if forked
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
}

type StrategyType =
  | 'momentum'
  | 'mean_reversion'
  | 'equal_weight'
  | 'risk_parity'
  | 'smart_beta'
  | 'custom';

interface StrategyParameters {
  // Common parameters
  rebalanceFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';

  // Momentum parameters
  momentum?: {
    lookbackPeriod: number;
    topN: number;
    minWeight: number;
    maxWeight: number;
  };

  // Mean Reversion parameters
  meanReversion?: {
    maPeriod: number;
    deviationThreshold: number;
    topN: number;
  };

  // Risk Parity parameters
  riskParity?: {
    targetVolatility: number;
    lookbackPeriod: number;
  };

  // Smart Beta parameters
  smartBeta?: {
    valueWeight: number;
    momentumWeight: number;
    qualityWeight: number;
    lowVolWeight: number;
  };
}

// Stored in Firestore: users/{uid}/backtests/{backtestId}
interface Backtest {
  id: string;
  strategyId: string;
  name: string;
  config: BacktestConfig;
  status: BacktestStatus;
  results: BacktestResults | null;
  createdAt: Timestamp;
  completedAt: Timestamp | null;
  expiresAt: Timestamp;
  errorMessage: string | null;
}

interface BacktestConfig {
  universe: string[]; // List of symbols or preset name
  startDate: string;  // YYYY-MM-DD
  endDate: string;
  initialCapital: number;
  benchmark: string;  // Benchmark symbol (e.g., 'SPY')
  optimization: 'msr' | 'gmv' | 'equal_weight';
  transactionCost: number; // As decimal (0.001 = 0.1%)
  slippage: number;
}

type BacktestStatus = 'pending' | 'running' | 'completed' | 'failed';

interface BacktestResults {
  // Performance metrics
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownDuration: number; // Days
  volatility: number;
  calmarRatio: number;
  winRate: number;
  profitFactor: number;

  // Comparison to benchmark
  benchmarkReturn: number;
  alpha: number;
  beta: number;
  correlation: number;
  informationRatio: number;

  // Time series data
  equityCurve: TimeSeriesPoint[];
  drawdownCurve: TimeSeriesPoint[];
  monthlyReturns: MonthlyReturn[];

  // Trade analysis
  totalTrades: number;
  trades: Trade[];
}

interface TimeSeriesPoint {
  date: string;
  value: number;
}

interface MonthlyReturn {
  year: number;
  month: number;
  return: number;
}

interface Trade {
  symbol: string;
  side: 'buy' | 'sell';
  entryDate: string;
  entryPrice: number;
  exitDate: string | null;
  exitPrice: number | null;
  quantity: number;
  pnl: number | null;
  pnlPercent: number | null;
}
```

### Alerts

```typescript
// Stored in Firestore: users/{uid}/alerts/{alertId}
interface Alert {
  id: string;
  name: string;
  type: AlertType;
  enabled: boolean;
  conditions: AlertCondition[];
  actions: AlertAction[];
  lastTriggeredAt: Timestamp | null;
  triggerCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type AlertType =
  | 'price'
  | 'percent_change'
  | 'rebalance'
  | 'strategy_signal'
  | 'drawdown'
  | 'volume';

interface AlertCondition {
  field: string;      // e.g., 'price', 'change_percent', 'volume'
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'crosses_above' | 'crosses_below';
  value: number;
  symbol?: string;    // For price/volume alerts
  accountId?: string; // For portfolio alerts
}

interface AlertAction {
  type: 'notification' | 'email' | 'webhook';
  config: Record<string, unknown>;
}

// Stored in Firestore: users/{uid}/notifications/{notificationId}
interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: Timestamp;
  expiresAt: Timestamp | null;
}
```

### Watchlists

```typescript
// Stored in Firestore: users/{uid}/watchlists/{watchlistId}
interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
  isDefault: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Price Data

```typescript
// Cached in Firestore: priceCache/{symbol}
interface PriceCache {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
  marketCap: number | null;
  pe: number | null;
  timestamp: Timestamp;
  source: 'alpaca' | 'yahoo' | 'polygon';
}

// Historical data (not stored, fetched on demand)
interface HistoricalBar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

### Social Features

```typescript
// Stored in Firestore: strategies_public/{strategyId}
interface PublicStrategy {
  id: string;
  authorId: string;
  authorName: string | null; // Null if anonymous
  name: string;
  description: string;
  type: StrategyType;
  parameters: StrategyParameters;

  // Performance (from latest backtest)
  performance: {
    annualizedReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    backtestPeriod: string;
  } | null;

  // Social metrics
  copyCount: number;
  likeCount: number;
  viewCount: number;

  publishedAt: Timestamp;
  updatedAt: Timestamp;
}

// Stored in Firestore: leaderboards/{period}
interface Leaderboard {
  period: 'weekly' | 'monthly' | 'all_time';
  updatedAt: Timestamp;
  rankings: LeaderboardEntry[];
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string | null; // Null if anonymous
  totalReturn: number;
  sharpeRatio: number;
  portfolioValue: number | null; // Null if hidden
  isAnonymous: boolean;
}
```

---

## API Endpoints (Cloud Functions)

### Authentication

```typescript
// No custom endpoints - using Firebase Auth directly
// - createUserWithEmailAndPassword
// - signInWithEmailAndPassword
// - signOut
// - sendPasswordResetEmail
```

### User Management

```typescript
// POST /api/users/profile
// Create or update user profile
interface CreateUserProfileRequest {
  displayName: string;
  inviteCode?: string;
}

// GET /api/users/profile
// Get current user profile
interface GetUserProfileResponse {
  user: User;
  preferences: UserPreferences;
}

// PATCH /api/users/preferences
// Update user preferences
interface UpdatePreferencesRequest {
  theme?: string;
  notifications?: Partial<NotificationPreferences>;
  defaultAccountId?: string;
}
```

### Admin

```typescript
// GET /api/admin/users
// List all users (admin only)
interface ListUsersResponse {
  users: User[];
  total: number;
  nextCursor?: string;
}

// PATCH /api/admin/users/{uid}/status
// Update user status (admin only)
interface UpdateUserStatusRequest {
  status: UserStatus;
}

// POST /api/admin/invites
// Create invite code (admin only)
interface CreateInviteRequest {
  email?: string;
  expiresInDays?: number;
  maxUses?: number;
}

interface CreateInviteResponse {
  invite: Invite;
  inviteUrl: string;
}

// GET /api/admin/invites
// List all invites (admin only)
interface ListInvitesResponse {
  invites: Invite[];
}

// DELETE /api/admin/invites/{code}
// Revoke invite (admin only)
```

### Accounts

```typescript
// GET /api/accounts
// List user's accounts
interface ListAccountsResponse {
  accounts: Account[];
}

// POST /api/accounts
// Create new account
interface CreateAccountRequest {
  name: string;
  type: AccountType;
  currency?: string;
  institution?: string;
}

// PATCH /api/accounts/{accountId}
// Update account
interface UpdateAccountRequest {
  name?: string;
  institution?: string;
}

// DELETE /api/accounts/{accountId}
// Delete account

// POST /api/accounts/{accountId}/connect/alpaca
// Connect Alpaca account
interface ConnectAlpacaRequest {
  apiKey: string;
  apiSecret: string;
  environment: 'paper' | 'live';
}

// POST /api/accounts/{accountId}/sync
// Sync account positions from broker
interface SyncAccountResponse {
  holdings: Holding[];
  lastSyncAt: Timestamp;
}
```

### Holdings

```typescript
// GET /api/accounts/{accountId}/holdings
// List holdings for an account
interface ListHoldingsResponse {
  holdings: Holding[];
}

// POST /api/accounts/{accountId}/holdings
// Add manual holding
interface CreateHoldingRequest {
  symbol: string;
  quantity: number;
  avgCost: number;
  purchaseDate?: string;
}

// PATCH /api/accounts/{accountId}/holdings/{holdingId}
// Update holding
interface UpdateHoldingRequest {
  quantity?: number;
  avgCost?: number;
}

// DELETE /api/accounts/{accountId}/holdings/{holdingId}
// Remove holding

// POST /api/accounts/{accountId}/holdings/import
// Import holdings from CSV
interface ImportHoldingsRequest {
  csv: string; // CSV content
  format: 'standard' | 'fidelity' | 'schwab' | 'vanguard';
}
```

### Trading

```typescript
// POST /api/accounts/{accountId}/orders
// Submit new order
interface SubmitOrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  type: OrderType;
  quantity: number;
  timeInForce?: TimeInForce;
  limitPrice?: number;
  stopPrice?: number;
  trailPercent?: number;
  trailAmount?: number;
}

interface SubmitOrderResponse {
  order: Order;
}

// GET /api/accounts/{accountId}/orders
// List orders
interface ListOrdersRequest {
  status?: OrderStatus;
  symbol?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

// GET /api/accounts/{accountId}/orders/{orderId}
// Get order details

// DELETE /api/accounts/{accountId}/orders/{orderId}
// Cancel order
```

### Strategies

```typescript
// GET /api/strategies
// List user's strategies
interface ListStrategiesResponse {
  strategies: Strategy[];
}

// POST /api/strategies
// Create strategy
interface CreateStrategyRequest {
  name: string;
  description?: string;
  type: StrategyType;
  code?: string;
  parameters: StrategyParameters;
}

// GET /api/strategies/{strategyId}
// Get strategy details

// PATCH /api/strategies/{strategyId}
// Update strategy
interface UpdateStrategyRequest {
  name?: string;
  description?: string;
  code?: string;
  parameters?: Partial<StrategyParameters>;
}

// DELETE /api/strategies/{strategyId}
// Delete strategy

// POST /api/strategies/{strategyId}/publish
// Publish strategy to public
interface PublishStrategyRequest {
  showAuthor: boolean;
  allowCopy: boolean;
}

// POST /api/strategies/{strategyId}/copy
// Copy a public strategy
interface CopyStrategyRequest {
  name: string;
}
```

### Backtesting

```typescript
// POST /api/backtests
// Run backtest
interface RunBacktestRequest {
  strategyId: string;
  config: BacktestConfig;
}

interface RunBacktestResponse {
  backtest: Backtest;
}

// GET /api/backtests
// List backtests
interface ListBacktestsResponse {
  backtests: Backtest[];
}

// GET /api/backtests/{backtestId}
// Get backtest results

// DELETE /api/backtests/{backtestId}
// Delete backtest
```

### Alerts

```typescript
// GET /api/alerts
// List alerts
interface ListAlertsResponse {
  alerts: Alert[];
}

// POST /api/alerts
// Create alert
interface CreateAlertRequest {
  name: string;
  type: AlertType;
  conditions: AlertCondition[];
  actions: AlertAction[];
}

// PATCH /api/alerts/{alertId}
// Update alert
interface UpdateAlertRequest {
  name?: string;
  enabled?: boolean;
  conditions?: AlertCondition[];
  actions?: AlertAction[];
}

// DELETE /api/alerts/{alertId}
// Delete alert
```

### Market Data

```typescript
// GET /api/market/quote/{symbol}
// Get current quote
interface GetQuoteResponse {
  quote: PriceCache;
}

// GET /api/market/quotes
// Get multiple quotes
interface GetQuotesRequest {
  symbols: string[];
}

interface GetQuotesResponse {
  quotes: Record<string, PriceCache>;
}

// GET /api/market/history/{symbol}
// Get historical data
interface GetHistoryRequest {
  symbol: string;
  start: string;
  end: string;
  timeframe: '1Min' | '5Min' | '15Min' | '1Hour' | '1Day';
}

interface GetHistoryResponse {
  bars: HistoricalBar[];
}

// GET /api/market/search
// Search symbols
interface SearchSymbolsRequest {
  query: string;
  limit?: number;
}

interface SearchSymbolsResponse {
  results: {
    symbol: string;
    name: string;
    type: AssetType;
    exchange: string;
  }[];
}
```

### Social

```typescript
// GET /api/social/strategies
// Browse public strategies
interface BrowseStrategiesRequest {
  type?: StrategyType;
  sortBy?: 'popular' | 'recent' | 'performance';
  limit?: number;
  cursor?: string;
}

// GET /api/social/leaderboard/{period}
// Get leaderboard
interface GetLeaderboardResponse {
  leaderboard: Leaderboard;
}
```

### Reports

```typescript
// POST /api/reports/generate
// Generate PDF report
interface GenerateReportRequest {
  type: 'portfolio_summary' | 'performance' | 'tax' | 'transactions';
  accountIds?: string[];
  startDate: string;
  endDate: string;
}

interface GenerateReportResponse {
  reportId: string;
  downloadUrl: string;
  expiresAt: Timestamp;
}

// GET /api/reports
// List generated reports
interface ListReportsResponse {
  reports: {
    id: string;
    type: string;
    createdAt: Timestamp;
    downloadUrl: string;
    expiresAt: Timestamp;
  }[];
}
```

---

## WebSocket Events

### Price Updates

```typescript
// Subscribe to price updates
interface PriceSubscription {
  action: 'subscribe' | 'unsubscribe';
  symbols: string[];
}

// Price update event
interface PriceUpdate {
  type: 'price';
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}
```

### Order Updates

```typescript
// Order update event
interface OrderUpdate {
  type: 'order';
  orderId: string;
  status: OrderStatus;
  filledQty: number;
  filledAvgPrice: number | null;
  timestamp: string;
}
```

### Account Updates

```typescript
// Account update event (balance, positions)
interface AccountUpdate {
  type: 'account';
  accountId: string;
  buyingPower: number;
  cash: number;
  portfolioValue: number;
  timestamp: string;
}
```

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isAdmin() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isActive() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'active';
    }

    // Users collection
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isSignedIn() && isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if false;

      // Nested collections
      match /accounts/{accountId} {
        allow read, write: if isOwner(userId) && isActive();

        match /holdings/{holdingId} {
          allow read, write: if isOwner(userId) && isActive();
        }

        match /transactions/{txId} {
          allow read: if isOwner(userId) && isActive();
          allow write: if false; // Only Cloud Functions can write
        }
      }

      match /strategies/{strategyId} {
        allow read, write: if isOwner(userId) && isActive();
      }

      match /backtests/{backtestId} {
        allow read: if isOwner(userId) && isActive();
        allow create: if isOwner(userId) && isActive();
        allow delete: if isOwner(userId) && isActive();
        allow update: if false; // Only Cloud Functions can update
      }

      match /alerts/{alertId} {
        allow read, write: if isOwner(userId) && isActive();
      }

      match /watchlists/{watchlistId} {
        allow read, write: if isOwner(userId) && isActive();
      }

      match /notifications/{notificationId} {
        allow read: if isOwner(userId);
        allow update: if isOwner(userId); // Mark as read
        allow delete: if isOwner(userId);
        allow create: if false; // Only Cloud Functions can create
      }

      match /orders/{orderId} {
        allow read: if isOwner(userId) && isActive();
        allow create: if isOwner(userId) && isActive();
        allow update: if false; // Only Cloud Functions can update
        allow delete: if false;
      }
    }

    // Invites collection
    match /invites/{code} {
      allow read: if true; // Anyone can validate an invite
      allow create: if isAdmin();
      allow update: if isSignedIn(); // To mark as used
      allow delete: if isAdmin();
    }

    // Public strategies
    match /strategies_public/{strategyId} {
      allow read: if isSignedIn() && isActive();
      allow write: if false; // Only Cloud Functions can write
    }

    // Leaderboards
    match /leaderboards/{period} {
      allow read: if isSignedIn() && isActive();
      allow write: if false; // Only Cloud Functions can write
    }

    // Price cache
    match /priceCache/{symbol} {
      allow read: if isSignedIn();
      allow write: if false; // Only Cloud Functions can write
    }

    // Admin config
    match /admin/{document=**} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
  }
}
```

---

## Database Indexes

```json
{
  "indexes": [
    {
      "collectionGroup": "transactions",
      "fields": [
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "orders",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "submittedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "backtests",
      "fields": [
        { "fieldPath": "strategyId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "strategies_public",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "copyCount", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "fields": [
        { "fieldPath": "read", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## Validation Rules

### Symbol Format
- US stocks: 1-5 uppercase letters (e.g., `AAPL`, `GOOGL`)
- Crypto: Symbol-USD format (e.g., `BTC-USD`, `ETH-USD`)
- ETFs: 1-5 uppercase letters (same as stocks)

### Amount/Price Validation
- Prices: >= 0, max 2 decimal places for USD
- Quantities: >= 0 for holdings, can be fractional
- Percentages: 0-100 for most cases

### Date Formats
- All dates stored as ISO 8601 strings: `YYYY-MM-DD`
- All timestamps stored as Firestore Timestamps
- API accepts ISO 8601 strings for date parameters

### String Limits
- Display names: 1-100 characters
- Strategy names: 1-200 characters
- Descriptions: max 2000 characters
- Notes: max 500 characters
