# TradePilot Web Application

> Modern portfolio management and trading platform built with Astro + React.

## Overview

TradePilot Web is the frontend application for the TradePilot trading platform. It provides:

- **Portfolio Dashboard** - Real-time portfolio tracking and analytics
- **Trading Interface** - Execute trades via Alpaca Markets
- **Strategy Builder** - Create and backtest trading strategies
- **Market Data** - Real-time prices with intelligent caching
- **Social Features** - Share strategies and follow traders

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run E2E tests
npx playwright test --project=chromium
```

## Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Astro 4.x with React islands |
| State | Nanostores |
| Auth | Firebase Authentication |
| Database | Firestore |
| Trading | Alpaca Markets API |
| Styling | CSS Modules with theme variables |
| Testing | Playwright (E2E), Vitest (unit) |

### Project Structure

```
web/
├── src/
│   ├── components/       # React components
│   │   ├── common/       # Shared UI components
│   │   ├── dashboard/    # Dashboard widgets
│   │   ├── market/       # Market data components
│   │   ├── trading/      # Trading interface
│   │   └── strategies/   # Strategy builder
│   │
│   ├── contexts/         # React contexts
│   │   └── MarketDataContext.tsx
│   │
│   ├── hooks/            # Custom React hooks
│   │   └── useMarketData.ts
│   │
│   ├── lib/              # Utilities and services
│   │   ├── services/     # Business logic services
│   │   │   ├── market-data/    # Real-time data service
│   │   │   └── data-providers/ # Data source integrations
│   │   ├── firebase.ts   # Firebase initialization
│   │   └── validation.ts # Form validation
│   │
│   ├── pages/            # Astro pages
│   ├── stores/           # Nanostores state
│   ├── styles/           # Global styles
│   └── types/            # TypeScript types
│
├── docs/                 # Documentation
│   └── architecture/     # Architecture docs
│
├── tests/                # Test files
│   ├── e2e/              # Playwright E2E tests
│   └── unit/             # Vitest unit tests
│
└── public/               # Static assets
```

## Key Features

### Market Data

Real-time price data with intelligent caching:

```typescript
import { useMarketData } from '@/hooks/useMarketData';

function WatchList() {
  const { prices, loading, isConnected } = useMarketData({
    symbols: ['AAPL', 'GOOGL', 'MSFT'],
    enableWebSocket: true,
  });

  return (
    <div>
      {Array.from(prices.values()).map(quote => (
        <PriceDisplay key={quote.symbol} quote={quote} />
      ))}
    </div>
  );
}
```

See [Data Architecture](./docs/architecture/DATA_ARCHITECTURE.md) for details.

### Access Control

Privacy-first permission model with GDPR compliance:

```typescript
import { canViewData, VisibilityLevel } from '@/types/permissions';

// Check access before showing data
const result = canViewData({
  viewerId: currentUser.id,
  targetUserId: portfolioOwner.id,
  dataType: 'holdings',
}, ownerPrivacySettings);

if (result.canView) {
  // Show data with appropriate redaction
}
```

See [Permissions](./docs/architecture/PERMISSIONS.md) for details.

### Trading

Execute trades via Alpaca Markets:

```typescript
import { submitOrder } from '@/lib/services/order-execution';

await submitOrder(userId, {
  symbol: 'AAPL',
  qty: 10,
  side: 'buy',
  type: 'market',
  time_in_force: 'day',
});
```

## Environment Variables

```bash
# Firebase
PUBLIC_FIREBASE_API_KEY=
PUBLIC_FIREBASE_AUTH_DOMAIN=
PUBLIC_FIREBASE_PROJECT_ID=
PUBLIC_FIREBASE_STORAGE_BUCKET=
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
PUBLIC_FIREBASE_APP_ID=

# Optional
PUBLIC_SENTRY_DSN=
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at localhost:4321 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run lint` | Lint code |
| `npm run format` | Format code |

## Testing

### E2E Tests

```bash
# Run all tests
npx playwright test --project=chromium

# Run specific test file
npx playwright test tests/e2e/trading.spec.ts

# Run with UI
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

### Unit Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Documentation

- [Data Architecture](./docs/architecture/DATA_ARCHITECTURE.md) - Market data and caching
- [Permissions](./docs/architecture/PERMISSIONS.md) - Access control and privacy

## CyberEco Compatibility

This application is designed for future integration with the [CyberEco Platform](https://github.com/cyber-eco/cybereco-monorepo):

- **Privacy Controls** - GDPR-compliant with CyberEco's consent model
- **Access Control** - Compatible visibility levels and sharing
- **Hub Gateway** - Ready for SSO via CyberEco Hub
- **Data Portability** - JSON export for data sovereignty

## Contributing

1. Create a feature branch
2. Make changes with tests
3. Run `npm run lint && npm run test`
4. Submit a pull request

## License

Proprietary - All rights reserved
