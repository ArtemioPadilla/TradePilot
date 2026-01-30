# TradePilot Integration Architecture

> How the Python backend and Web application work together for a unified trading platform.

## Overview

TradePilot consists of two main components:

1. **Python Backend (`tradepilot/`)** - Algorithmic trading engine for backtesting and live execution
2. **Web Application (`web/`)** - React/Astro frontend for portfolio management and trading UI

This document describes how these components integrate and share data.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  USER INTERFACE                                  │
│                                                                                  │
│  ┌──────────────────────────────┐    ┌──────────────────────────────────────┐   │
│  │      Web Application          │    │       Python Scripts/Notebooks       │   │
│  │      (Astro + React)          │    │       (Direct library usage)         │   │
│  │                               │    │                                      │   │
│  │  - Dashboard                  │    │  - Jupyter notebooks                 │   │
│  │  - Trading Interface          │    │  - CLI tools                         │   │
│  │  - Portfolio View             │    │  - Automated scripts                 │   │
│  │  - Strategy Builder           │    │                                      │   │
│  └──────────────┬────────────────┘    └──────────────────┬───────────────────┘   │
│                 │                                        │                       │
└─────────────────┼────────────────────────────────────────┼───────────────────────┘
                  │                                        │
                  ▼                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                    API LAYER                                     │
│                                                                                  │
│  ┌──────────────────────────────┐    ┌──────────────────────────────────────┐   │
│  │   Firebase Cloud Functions    │    │     TradePilot Python Library        │   │
│  │   (Node.js/TypeScript)        │    │     (Direct import)                  │   │
│  │                               │    │                                      │   │
│  │  - Order execution            │    │  from tradepilot import Backtest     │   │
│  │  - Backtest jobs              │    │  from tradepilot import BrokerAPI    │   │
│  │  - Account sync               │    │                                      │   │
│  └──────────────┬────────────────┘    └──────────────────┬───────────────────┘   │
│                 │                                        │                       │
└─────────────────┼────────────────────────────────────────┼───────────────────────┘
                  │                                        │
                  ▼                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               DATA & SERVICES                                    │
│                                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │    Firestore    │  │  Alpaca API     │  │  Yahoo Finance  │                  │
│  │                 │  │                 │  │  (yfinance)     │                  │
│  │  - User data    │  │  - Live trading │  │                 │                  │
│  │  - Portfolios   │  │  - Positions    │  │  - Historical   │                  │
│  │  - Strategies   │  │  - Orders       │  │  - Live quotes  │                  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Patterns

### Pattern 1: Web UI → Firebase → Alpaca (Current)

For live trading through the web interface:

```
Web UI (OrderForm)
    │
    │ 1. User submits order
    ▼
Firebase Cloud Functions
    │
    │ 2. Validate & forward to Alpaca
    ▼
Alpaca API
    │
    │ 3. Execute order
    ▼
Firestore
    │
    │ 4. Store trade record
    ▼
Web UI
    │
    │ 5. Update UI with result
```

### Pattern 2: Python Backend → Alpaca (Direct)

For automated trading scripts:

```
Python Script
    │
    │ 1. Import tradepilot
    ▼
tradepilot.BrokerAPI
    │
    │ 2. execute_trade()
    ▼
Alpaca API
    │
    │ 3. Execute order
    ▼
Python Script
    │
    │ 4. Log result, update state
```

### Pattern 3: Hybrid (Python ↔ Firebase)

For synchronized state between Python and Web:

```
Python Backend                         Web Application
     │                                       │
     │ 1. Run backtest                       │
     ▼                                       │
 Backtest results                            │
     │                                       │
     │ 2. Export to JSON                     │
     ▼                                       │
Firebase Firestore ─────────────────────────→│
     │                                       │
     │                        3. Fetch results
     │                                       ▼
     │                              Display in UI
```

## Shared Data Models

### Order Model

Both Python and TypeScript use compatible order structures:

```python
# Python: tradepilot/broker.py
order = {
    'symbol': 'AAPL',
    'qty': '10',
    'side': 'buy',
    'type': 'market',
    'time_in_force': 'gtc',
}
```

```typescript
// TypeScript: web/src/types/alpaca.ts
interface AlpacaOrder {
  symbol: string;
  qty: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
}
```

### Price Quote Model

```python
# Python: MarketData returns
{
    'AAPL': 185.50,  # Closing price
    'GOOGL': 140.25,
}
```

```typescript
// TypeScript: web/src/types/market-data.ts
interface PriceQuote {
  symbol: string;
  price: number;
  bid?: number;
  ask?: number;
  change: number;
  changePercent: number;
  timestamp: Date;
  source: DataSource;
}
```

### Portfolio Model

```python
# Python: TPS state
portfolio = {
    'holdings': {'AAPL': 50, 'GOOGL': 30},
    'cash': 5000.00,
    'portfolio_value': 45000.00,
}
```

```typescript
// TypeScript: web/src/types/portfolio.ts
interface Holding {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice?: number;
  marketValue?: number;
}
```

## Market Data Architecture

### Web Application (Real-time)

The web application uses a multi-layer caching architecture:

```
┌───────────────────────────────────────────────────────────────┐
│                    React Components                            │
│  useMarketData() → PriceDisplay, OrderForm, PortfolioChart    │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                   MarketDataContext                            │
│  - Global price state           - Subscription management      │
│  - Refresh timers               - Connection status            │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                   MarketDataService                            │
│  - Provider coordination        - WebSocket management         │
│  - Batch fetching               - Error handling               │
└───────────────────────────┬───────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌──────────────────────┐      ┌──────────────────────┐
│   Alpaca Provider    │      │  MarketDataCache     │
│                      │      │                      │
│  - REST API          │      │  - Memory (fast)     │
│  - WebSocket         │      │  - localStorage      │
│  - Paper/Live        │      │  - IndexedDB         │
└──────────────────────┘      └──────────────────────┘
```

### Python Backend (Historical)

The Python backend focuses on historical data for backtesting:

```
┌───────────────────────────────────────────────────────────────┐
│                    Backtest / TPT                              │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                    MarketData Class                            │
│  - get_historical_data()        - get_live_price()            │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                    yfinance                                    │
│  - Yahoo Finance API                                           │
│  - Historical OHLCV                                            │
│  - Current quotes                                              │
└───────────────────────────────────────────────────────────────┘
```

## Authentication & Authorization

### Web Application

Uses Firebase Authentication with Firestore security rules:

```typescript
// Firebase Auth state
const user = await auth.currentUser;
const idToken = await user.getIdToken();

// Firestore rules enforce access
// users/{userId}/holdings/* - user can only access own data
```

### Python Backend

Uses API keys directly for broker access:

```python
# Direct API key usage
from tradepilot.config import API_KEYS

broker = BrokerAPI('alpaca')  # Uses API_KEYS['alpaca']
```

### Unified Access (Future CyberEco)

Designed for future Hub Gateway integration:

```python
# Python: Hub detection
def get_auth(request):
    if request.headers.get('X-Hub-Proxy') == 'true':
        return get_hub_auth()  # CyberEco SSO
    return get_firebase_auth()
```

```typescript
// TypeScript: Hub detection
function isRunningBehindHub(request: Request): boolean {
  return request.headers.get('x-hub-proxy') === 'true';
}
```

## Firestore Schema

Both components share access to Firestore:

```
Database Schema:
├── users/
│   └── {userId}/
│       ├── alpaca/                  # Alpaca connection
│       │   └── credentials          # Encrypted API keys
│       │
│       ├── accounts/                # Trading accounts
│       │   └── {accountId}
│       │
│       ├── holdings/                # Current positions
│       │   └── {holdingId}
│       │
│       ├── transactions/            # Trade history
│       │   └── {transactionId}
│       │
│       ├── strategies/              # User strategies
│       │   └── {strategyId}
│       │
│       ├── backtests/               # Backtest results
│       │   └── {backtestId}
│       │
│       └── preferences/
│           └── settings
│
├── strategies_public/               # Shared strategies
│   └── {strategyId}
│
└── leaderboards/                    # Performance rankings
    └── {periodId}
```

## API Endpoints

### Firebase Cloud Functions

```
POST /api/orders/submit          # Submit new order
GET  /api/orders/{orderId}       # Get order status
GET  /api/positions              # Get current positions
GET  /api/account                # Get account info
POST /api/backtest/run           # Run backtest
GET  /api/backtest/{jobId}       # Get backtest results
```

### Python Library

```python
# Not REST endpoints, but importable functions
from tradepilot import (
    BrokerAPI,           # broker.execute_trade(), .get_positions()
    MarketData,          # .get_historical_data(), .get_live_price()
    Backtest,            # .run(), .evaluate()
)
```

## CyberEco Compatibility

Both components are designed for CyberEco Platform integration:

### Privacy Model

```typescript
// TypeScript: Visibility levels
type VisibilityLevel = 'private' | 'confidential' | 'internal' | 'public';

// TypeScript: Access control
interface AccessControl {
  visibility: VisibilityLevel;
  sharedWith: SharedAccess[];
  createdBy: string;
  allowCopy: boolean;
}
```

```python
# Python: Privacy-aware export
def export_portfolio(portfolio, visibility='private'):
    return {
        'data': portfolio,
        'access': {
            'visibility': visibility,
            'createdBy': user_id,
        }
    }
```

### Consent Management

```typescript
// TypeScript: GDPR consent
type ConsentType = 'necessary' | 'functional' | 'analytics' | 'marketing';

function hasConsent(userConsent: UserConsent, type: ConsentType): boolean;
```

```python
# Python: Respect consent in data operations
def track_event(user_id, event, consent):
    if consent.get('analytics'):
        analytics.track(user_id, event)
```

### Data Portability

```typescript
// TypeScript: Export user data
async function exportUserData(userId: string): Promise<ExportData> {
  // Returns JSON-serializable data matching Python format
}
```

```python
# Python: Import/export compatibility
def import_portfolio(json_data):
    """Import portfolio from web app export format"""
    return {
        'holdings': {
            h['symbol']: h['quantity']
            for h in json_data['holdings']
        }
    }
```

## Development Workflow

### Running Both Components

```bash
# Terminal 1: Web application
cd web
npm run dev
# Runs at http://localhost:4321

# Terminal 2: Python scripts
cd TradePilot
python examples/example_backtest.py
```

### Testing Integration

```bash
# Web E2E tests (includes API calls)
cd web
npx playwright test --project=chromium

# Python unit tests
pytest tests/
```

### Shared Configuration

```bash
# Environment variables (used by both)
ALPACA_API_KEY=your_key
ALPACA_SECRET_KEY=your_secret

# Firebase (web app)
PUBLIC_FIREBASE_API_KEY=...
PUBLIC_FIREBASE_PROJECT_ID=...
```

## Future Integration Plans

### Phase 1: Current State
- Web app connects directly to Alpaca
- Python library operates independently
- Firestore stores user data

### Phase 2: Python API Service
- Deploy Python backend as REST API
- Web app calls Python for backtesting
- Shared order execution

### Phase 3: CyberEco Hub
- Hub Gateway for unified auth
- Decentralized data layer
- Cross-application data sharing

## Related Documentation

- [Backend Architecture](./BACKEND_ARCHITECTURE.md) - Python library details
- [Data Architecture](./DATA_ARCHITECTURE.md) - Market data and caching
- [Permissions](./PERMISSIONS.md) - Access control and privacy
