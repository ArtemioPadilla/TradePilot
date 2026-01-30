# Access Control & Permissions

> CyberEco-compatible permission model supporting granular visibility, GDPR compliance, and privacy-aware data queries.

## Overview

TradePilot's permission system is designed for:

1. **User Privacy** - Privacy-first defaults with granular controls
2. **GDPR Compliance** - Full consent management and data rights
3. **Social Features** - Flexible sharing with role-based access
4. **CyberEco Compatibility** - Ready for decentralized identity integration

## Visibility Levels

```typescript
type VisibilityLevel =
  | 'private'        // Only owner can see
  | 'confidential'   // Owner + explicitly shared users
  | 'internal'       // All authenticated TradePilot users
  | 'public';        // Anyone (including unauthenticated)
```

### Activity-Specific Visibility

Users can set different visibility for different data types:

```typescript
interface ActivityVisibility {
  holdings: VisibilityLevel;      // Portfolio positions
  trades: VisibilityLevel;        // Trade history
  strategies: VisibilityLevel;    // Strategy configurations
  performance: VisibilityLevel;   // Return metrics
  watchlists: VisibilityLevel;    // Watched symbols
  profile: VisibilityLevel;       // Profile information
}

// Default: everything private
const DEFAULT_ACTIVITY_VISIBILITY: ActivityVisibility = {
  holdings: 'private',
  trades: 'private',
  strategies: 'private',
  performance: 'private',
  watchlists: 'private',
  profile: 'confidential',
};
```

## Permission Roles

```typescript
type PermissionRole =
  | 'owner'          // Full control, can delete
  | 'editor'         // Can modify content
  | 'commenter'      // Can add comments only
  | 'viewer';        // Read-only access

// Check permission hierarchy
function hasMinimumRole(userRole: PermissionRole, requiredRole: PermissionRole): boolean {
  const hierarchy = ['viewer', 'commenter', 'editor', 'owner'];
  return hierarchy.indexOf(userRole) >= hierarchy.indexOf(requiredRole);
}
```

## Access Control

### Sharing Access

```typescript
interface SharedAccess {
  userId?: string;             // Specific user
  email?: string;              // Invite by email (pending)
  teamId?: string;             // Team access (future)
  role: PermissionRole;
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;            // Temporary access
  note?: string;               // Optional note
}
```

### Complete Access Control

```typescript
interface AccessControl {
  // Visibility
  visibility: VisibilityLevel;

  // Sharing
  sharedWith: SharedAccess[];

  // Authorship
  createdBy: string;           // User ID
  authorVisible: boolean;      // Show author publicly

  // Capabilities
  allowCopy: boolean;          // Can be forked
  allowComment: boolean;       // Public comments
  allowDerivatives: boolean;   // Allow modifications

  // License (for public content)
  license?: 'all_rights' | 'cc_by' | 'cc_by_sa' | 'cc_by_nc' | 'cc0';
}
```

## GDPR Compliance

### Consent Types

```typescript
type ConsentType =
  | 'necessary'           // Required for basic functionality
  | 'functional'          // Enhanced features
  | 'analytics'           // Usage analytics
  | 'marketing'           // Promotional communications
  | 'personalization';    // Tailored content
```

### Consent Management

```typescript
// Record consent
await recordConsent(userId, 'analytics', true, {
  ipAddress: request.ip,
  userAgent: request.headers['user-agent'],
});

// Check consent
if (hasConsent(userConsent, 'analytics')) {
  await trackUserBehavior(userId, event);
}

// Get all granted consents
const grantedTypes = getGrantedConsents(userConsent);
// Returns: ['necessary', 'functional']
```

### Data Rights

```typescript
type GDPRRequestType =
  | 'access'         // Right to access (export)
  | 'rectification'  // Right to correct
  | 'erasure'        // Right to be forgotten
  | 'portability'    // Right to data portability
  | 'restriction'    // Right to restrict processing
  | 'objection';     // Right to object

// Request data export
const request = await requestDataPortability(userId, 'json');

// Request deletion
await requestDataDeletion(userId, 'User requested account deletion');

// Generate privacy report
const report = await generatePrivacyReport(userId);
```

## Privacy-Aware Queries

### Privacy Filter

```typescript
interface PrivacyFilter {
  viewerId: string;              // Who is requesting
  targetUserId: string;          // Whose data
  dataType: DataType;            // What type of data
  relationship?: UserRelationship;
}

type DataType = 'holdings' | 'trades' | 'strategies' | 'performance' | 'watchlists' | 'profile' | 'activity';

type UserRelationship =
  | 'self'           // Same user
  | 'following'      // Viewer follows target
  | 'follower'       // Target follows viewer
  | 'mutual'         // Both follow each other
  | 'shared'         // Explicit share access
  | 'none';          // No relationship
```

### Checking Access

```typescript
import { canViewData, anonymizeUserData } from '@/types/permissions';

// Check if viewer can access data
const result = canViewData(
  {
    viewerId: currentUser.id,
    targetUserId: portfolioOwner.id,
    dataType: 'holdings',
    relationship: 'following',
  },
  ownerPrivacySettings,
  portfolioAccessControl
);

if (!result.canView) {
  throw new AccessDeniedError(result.reason);
}

// Get data with appropriate anonymization
if (result.accessLevel === 'anonymized') {
  userData = anonymizeUserData(userData, ownerPrivacySettings);
}
```

## Privacy Settings

### User Preferences

```typescript
interface PrivacySettings {
  // Activity visibility
  activityVisibility: ActivityVisibility;

  // Profile
  profileVisibility: VisibilityLevel;
  showPerformance: boolean;
  showHoldings: boolean;

  // Discovery
  searchable: boolean;
  showInLeaderboards: boolean;

  // Data sharing
  shareAnalytics: boolean;
  shareForImprovement: boolean;

  // Communication
  allowDirectMessages: boolean;
  allowFollowRequests: boolean;

  // Anonymization
  anonymizeInPublicViews: boolean;
  useDisplayNameOnly: boolean;

  // Data retention
  autoDeleteOldData: boolean;
  dataRetentionDays?: number;
}
```

### Default Settings (Privacy-First)

```typescript
const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  activityVisibility: DEFAULT_ACTIVITY_VISIBILITY,
  profileVisibility: 'confidential',
  showPerformance: false,
  showHoldings: false,
  searchable: false,
  showInLeaderboards: false,
  shareAnalytics: false,
  shareForImprovement: false,
  allowDirectMessages: false,
  allowFollowRequests: true,
  anonymizeInPublicViews: true,
  useDisplayNameOnly: true,
  autoDeleteOldData: false,
};
```

## Audit Logging

```typescript
interface DataAccessLog {
  id: string;
  viewerId: string;
  targetUserId: string;
  dataType: DataType;
  accessLevel: 'granted' | 'denied' | 'partial';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

// Log all data access for compliance
await logDataAccess({
  viewerId: currentUser.id,
  targetUserId: portfolioOwner.id,
  dataType: 'holdings',
  accessLevel: 'granted',
  timestamp: new Date(),
});
```

## Firestore Security Rules

```javascript
// Example rules patterns
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Check visibility
    function canView(resource) {
      let access = resource.data.access;
      return access.visibility == 'public' ||
             (access.visibility == 'internal' && isAuthenticated()) ||
             isOwner(resource) ||
             isSharedWith(resource, 'viewer');
    }

    // Check edit permission
    function canEdit(resource) {
      return isOwner(resource) || isSharedWith(resource, 'editor');
    }

    // User's own data
    match /users/{userId}/{document=**} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }

    // Shared content
    match /portfolios/{portfolioId} {
      allow read: if canView(resource);
      allow write: if canEdit(resource);
    }
  }
}
```

## CyberEco Integration

### Hub Gateway Detection

```typescript
// Check if running behind CyberEco Hub
function isRunningBehindHub(request: Request): boolean {
  return request.headers.get('x-hub-proxy') === 'true';
}

// Get authentication appropriately
async function getAuth(request: Request) {
  if (isRunningBehindHub(request)) {
    return getHubAuth();  // CyberEco Hub SSO
  }
  return getFirebaseAuth();  // Direct Firebase
}
```

### Future DID Support

```typescript
interface DecentralizedIdentityHint {
  did?: string;                    // Decentralized identifier
  verificationMethod?: string;     // How to verify
  controller?: string;             // Who controls
}

// Prepared for future ZK proofs
interface ZKProofPlaceholder {
  type: 'membership' | 'range' | 'ownership';
  proof?: string;
  verificationKey?: string;
}
```

## Usage Examples

### Share a Strategy

```typescript
async function shareStrategy(strategyId: string, shareWith: string[]) {
  const strategy = await getStrategy(strategyId);

  // Update access control
  const newShares: SharedAccess[] = shareWith.map(userId => ({
    userId,
    role: 'viewer',
    grantedAt: new Date(),
    grantedBy: currentUser.id,
  }));

  await updateStrategy(strategyId, {
    access: {
      ...strategy.access,
      sharedWith: [...strategy.access.sharedWith, ...newShares],
    },
  });
}
```

### Export User Data (GDPR)

```typescript
async function handleDataExportRequest(userId: string) {
  // Create export request
  const request = await createGDPRRequest({
    userId,
    type: 'access',
    status: 'pending',
  });

  // Generate export (async job)
  const exportData = await generateUserDataExport(userId, {
    format: 'json',
    includeHistory: true,
  });

  // Upload to secure storage
  const downloadUrl = await uploadExport(exportData, userId);

  // Update request
  await updateGDPRRequest(request.id, {
    status: 'completed',
    result: { downloadUrl },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  // Notify user
  await sendNotification(userId, 'Your data export is ready');
}
```

### Check Portfolio Access

```typescript
async function getPortfolioForViewer(
  portfolioId: string,
  viewerId: string
): Promise<Portfolio | null> {
  const portfolio = await getPortfolio(portfolioId);
  const owner = await getUser(portfolio.ownerId);

  const accessResult = canViewData(
    {
      viewerId,
      targetUserId: portfolio.ownerId,
      dataType: 'holdings',
    },
    owner.privacySettings,
    portfolio.access
  );

  if (!accessResult.canView) {
    return null;
  }

  // Apply appropriate redaction
  if (accessResult.accessLevel === 'partial') {
    portfolio.holdings = portfolio.holdings.map(h => ({
      ...h,
      quantity: undefined,  // Hide quantities
      value: undefined,     // Hide values
    }));
  }

  if (accessResult.accessLevel === 'anonymized') {
    portfolio.owner = anonymizeUserData(owner, owner.privacySettings);
  }

  return portfolio;
}
```

## Best Practices

1. **Default to Private** - All new content should be private by default
2. **Explicit Consent** - Always get explicit consent before sharing data
3. **Audit Everything** - Log all data access for compliance
4. **Expire Shares** - Use expiration dates for temporary access
5. **Check on Access** - Verify permissions at query time, not just creation
6. **Honor Requests** - Process GDPR requests within 30 days
7. **Minimize Data** - Only request/store data that's needed
8. **Encrypt Sensitive** - Use encryption for sensitive fields
