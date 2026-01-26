# Firestore Infrastructure as Code

This document describes the Firestore database structure, security rules, and deployment procedures for TradePilot.

## Overview

TradePilot uses Firebase Firestore as its primary database. All infrastructure is defined as code and version-controlled.

## Files

| File | Purpose |
|------|---------|
| `firestore.rules` | Security rules defining access control |
| `firestore.indexes.json` | Composite index definitions |
| `firebase.json` | Firebase project configuration |

## Data Model

### Collection Structure

```
firestore/
├── users/{userId}                          # User profiles
│   ├── accounts/{accountId}                # Brokerage accounts
│   │   ├── holdings/{holdingId}            # Portfolio positions
│   │   └── transactions/{txId}             # Transaction history
│   ├── strategies/{strategyId}             # Trading strategies
│   ├── backtests/{backtestId}              # Backtest results
│   ├── alerts/{alertId}                    # Price/portfolio alerts
│   ├── notifications/{notificationId}      # In-app notifications
│   ├── integrations/{integrationId}        # Third-party integrations (Alpaca)
│   ├── preferences/{preferenceId}          # User preferences
│   ├── settings/{settingId}                # User settings
│   ├── watchlists/{watchlistId}            # Stock watchlists
│   ├── goals/{goalId}                      # Financial goals
│   ├── networth/{snapshotId}               # Net worth snapshots
│   ├── orders/{orderId}                    # Trade orders
│   └── syncHistory/{syncId}                # Position sync history
│
├── invites/{inviteId}                      # Invite codes (admin-managed)
├── publicStrategies/{strategyId}           # Shared strategies
├── leaderboards/{leaderboardId}            # Performance leaderboards
└── admin/{documentId}                      # Admin-only data
```

### Document Schemas

#### User Document (`users/{userId}`)
```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin';
  status: 'pending' | 'active' | 'suspended';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
}
```

#### Account Document (`users/{userId}/accounts/{accountId}`)
```typescript
interface Account {
  id: string;
  userId: string;
  name: string;
  type: 'brokerage' | '401k' | 'ira' | 'roth_ira' | 'crypto' | 'bank' | 'other';
  institution?: string;
  accountNumberLast4?: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'BTC' | 'ETH';
  cashBalance: number;
  status: 'active' | 'inactive' | 'closed';
  notes?: string;
  isDefault?: boolean;
  sortOrder?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Holding Document (`users/{userId}/accounts/{accountId}/holdings/{holdingId}`)
```typescript
interface Holding {
  id: string;
  accountId: string;
  symbol: string;
  name?: string;
  quantity: number;
  averageCost: number;
  currentPrice?: number;
  marketValue?: number;
  unrealizedGain?: number;
  unrealizedGainPercent?: number;
  assetType: 'stock' | 'etf' | 'crypto' | 'bond' | 'mutual_fund' | 'option' | 'other';
  sector?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Integration Document (`users/{userId}/integrations/alpaca`)
```typescript
interface AlpacaIntegration {
  apiKey: string;           // Obfuscated
  apiSecret: string;        // Obfuscated
  environment: 'paper' | 'live';
  isConnected: boolean;
  lastVerifiedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Security Rules

### Rule Categories

1. **Authentication Required**: All operations require `request.auth != null`
2. **Owner Access**: Users can only access their own data via `isOwner(userId)`
3. **Active User**: Some operations require `status == 'active'`
4. **Admin Only**: Certain collections restricted to admin role

### Rule Helpers

```javascript
// Check if user is authenticated
function isAuthenticated() {
  return request.auth != null;
}

// Check if user is accessing their own data
function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}

// Check if user is admin
function isAdmin() {
  return hasRole('admin');
}

// Check if user is active (not pending or suspended)
function isActiveUser() {
  return isAuthenticated() && getUserData().status == 'active';
}
```

### Access Matrix

| Collection | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| `users/{userId}` | Owner/Admin | Owner | Owner (limited) | Never |
| `users/{userId}/accounts/*` | Owner + Active | Owner + Active | Owner + Active | Owner + Active |
| `users/{userId}/holdings/*` | Owner + Active | Owner + Active | Owner + Active | Owner + Active |
| `users/{userId}/transactions/*` | Owner + Active | Owner + Active | Never | Never |
| `users/{userId}/strategies/*` | Owner + Active | Owner + Active | Owner + Active | Owner + Active |
| `users/{userId}/integrations/*` | Owner | Owner | Owner | Owner |
| `users/{userId}/notifications/*` | Owner | Never | Owner (read field only) | Owner |
| `invites/*` | Anyone | Admin | Claimant | Admin |
| `publicStrategies/*` | Active users | Author | Author | Author |
| `leaderboards/*` | Active users | Never | Never | Never |
| `admin/*` | Admin | Admin | Admin | Admin |

## Deployment

### Prerequisites

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Select project
firebase use tradepilot-827d1
```

### Deploy Commands

```bash
# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Firestore indexes
firebase deploy --only firestore:indexes

# Deploy all Firestore configuration
firebase deploy --only firestore

# Deploy everything
firebase deploy
```

### CI/CD Integration

Add to your CI/CD pipeline (e.g., GitHub Actions):

```yaml
# .github/workflows/deploy-firestore.yml
name: Deploy Firestore Rules

on:
  push:
    branches: [main]
    paths:
      - 'firestore.rules'
      - 'firestore.indexes.json'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Firebase CLI
        run: npm install -g firebase-tools

      - name: Deploy Firestore
        run: firebase deploy --only firestore --token ${{ secrets.FIREBASE_TOKEN }}
```

### Generate Firebase Token for CI

```bash
firebase login:ci
# Copy the token and add as FIREBASE_TOKEN secret in GitHub
```

## Local Development

### Emulator Setup

```bash
# Start Firestore emulator
firebase emulators:start --only firestore

# Emulator UI available at http://localhost:4000
# Firestore available at localhost:8080
```

### Environment Variables

```bash
# .env.local
PUBLIC_FIREBASE_USE_EMULATOR=true
PUBLIC_FIRESTORE_EMULATOR_HOST=localhost:8080
```

## Indexes

Composite indexes are defined in `firestore.indexes.json`. Only composite indexes need to be defined - Firestore automatically creates single-field indexes.

**Note:** Single-field indexes (with only one field) are NOT valid in the indexes file and will cause deployment errors. Always use composite indexes with 2+ fields.

Current composite indexes include:

| Collection | Query Scope | Fields |
|------------|-------------|--------|
| `accounts` | COLLECTION_GROUP | sortOrder ↑, name ↑ |
| `accounts` | COLLECTION_GROUP | status ↑, sortOrder ↑ |
| `holdings` | COLLECTION_GROUP | accountId ↑, symbol ↑ |
| `users` | COLLECTION | status ↑, createdAt ↓ |
| `users` | COLLECTION | role ↑, createdAt ↓ |
| `invites` | COLLECTION | createdBy ↑, createdAt ↓ |
| `invites` | COLLECTION | usedAt ↑, expiresAt ↑ |
| `transactions` | COLLECTION_GROUP | type ↑, timestamp ↓ |
| `backtests` | COLLECTION_GROUP | status ↑, createdAt ↓ |
| `alerts` | COLLECTION_GROUP | enabled ↑, createdAt ↓ |
| `notifications` | COLLECTION_GROUP | read ↑, createdAt ↓ |
| `publicStrategies` | COLLECTION | type ↑, copyCount ↓ |

Example entry format:
```json
{
  "collectionGroup": "accounts",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "sortOrder", "order": "ASCENDING" }
  ]
}
```

## Backup & Recovery

### Manual Backup

```bash
# Export Firestore data
gcloud firestore export gs://tradepilot-827d1-backups/$(date +%Y-%m-%d)

# Import Firestore data
gcloud firestore import gs://tradepilot-827d1-backups/2024-01-15
```

### Automated Backups

Configure in Google Cloud Console:
1. Go to Firestore > Import/Export
2. Set up scheduled exports to Cloud Storage

## Monitoring

### Firebase Console
- https://console.firebase.google.com/project/tradepilot-827d1/firestore

### Usage Metrics
- Document reads/writes/deletes
- Storage usage
- Rule evaluations

### Alerts
Configure alerts for:
- High read/write rates
- Failed security rule evaluations
- Storage threshold exceeded

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Check if user is authenticated
   - Verify user status is 'active'
   - Confirm correct userId in path

2. **Index Required**
   - Check console for missing index link
   - Add to `firestore.indexes.json`
   - Deploy indexes

3. **Quota Exceeded**
   - Check daily operation limits
   - Optimize queries
   - Enable caching

### Debug Rules

Use Firebase Emulator to test rules:

```bash
firebase emulators:start --only firestore

# Run tests
npm test -- --grep "firestore"
```

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-19 | 1.1.0 | Added integrations subcollection for Alpaca |
| 2026-01-19 | 1.0.1 | Fixed alerts/notifications to use user subcollections |
| 2026-01-15 | 1.0.0 | Initial Firestore structure |
