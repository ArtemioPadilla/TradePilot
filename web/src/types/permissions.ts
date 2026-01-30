/**
 * Access Control & Permissions for TradePilot
 *
 * CyberEco-compatible permission model supporting:
 * - Granular visibility levels
 * - GDPR-compliant consent management
 * - Privacy-aware data queries
 * - Future decentralized access control
 *
 * @see https://github.com/cyber-eco/cybereco-monorepo/blob/main/apps/website/src/app/documentation/privacy-controls/page.tsx
 */

// ============================================================================
// Visibility Levels (CyberEco-compatible)
// ============================================================================

/**
 * Visibility level for content
 * Matches CyberEco's privacy visibility model
 */
export type VisibilityLevel =
  | 'private'        // Only owner can see
  | 'confidential'   // Owner + explicitly shared users
  | 'internal'       // All authenticated TradePilot users
  | 'public';        // Anyone (including unauthenticated)

/**
 * Activity-specific visibility
 * Matches CyberEco's ActivityVisibility interface
 */
export interface ActivityVisibility {
  /** Portfolio holdings visibility */
  holdings: VisibilityLevel;
  /** Trade history visibility */
  trades: VisibilityLevel;
  /** Strategy configurations */
  strategies: VisibilityLevel;
  /** Performance metrics */
  performance: VisibilityLevel;
  /** Watchlists */
  watchlists: VisibilityLevel;
  /** Profile information */
  profile: VisibilityLevel;
}

/**
 * Default activity visibility settings
 */
export const DEFAULT_ACTIVITY_VISIBILITY: ActivityVisibility = {
  holdings: 'private',
  trades: 'private',
  strategies: 'private',
  performance: 'private',
  watchlists: 'private',
  profile: 'confidential',
};

// ============================================================================
// Permission Roles
// ============================================================================

/**
 * Permission role for shared access
 */
export type PermissionRole =
  | 'owner'          // Full control, can delete
  | 'editor'         // Can modify content
  | 'commenter'      // Can add comments only
  | 'viewer';        // Read-only access

/**
 * Role hierarchy (higher index = more permissions)
 */
export const ROLE_HIERARCHY: PermissionRole[] = [
  'viewer',
  'commenter',
  'editor',
  'owner',
];

/**
 * Check if a role has at least the required permission level
 */
export function hasMinimumRole(
  userRole: PermissionRole,
  requiredRole: PermissionRole
): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(requiredRole);
}

// ============================================================================
// Consent Management (GDPR-compliant, CyberEco-compatible)
// ============================================================================

/**
 * Consent type categories
 * Matches CyberEco's ConsentType enum
 */
export type ConsentType =
  | 'necessary'           // Required for basic functionality
  | 'functional'          // Enhanced features and preferences
  | 'analytics'           // Usage analytics and improvements
  | 'marketing'           // Promotional communications
  | 'personalization';    // Tailored content and recommendations

/**
 * User consent record
 */
export interface ConsentRecord {
  type: ConsentType;
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    source?: string;       // Where consent was given
  };
}

/**
 * User consent state
 */
export interface UserConsent {
  userId: string;
  consents: Record<ConsentType, ConsentRecord>;
  lastUpdated: Date;
  version: number;         // Consent version for tracking policy changes
}

/**
 * Default consent (only necessary)
 */
export const DEFAULT_CONSENT: Record<ConsentType, boolean> = {
  necessary: true,         // Always required
  functional: false,
  analytics: false,
  marketing: false,
  personalization: false,
};

// ============================================================================
// Access Control
// ============================================================================

/**
 * Shared access entry
 */
export interface SharedAccess {
  /** Specific user ID */
  userId?: string;
  /** Invite by email (pending user) */
  email?: string;
  /** Team/group ID (future) */
  teamId?: string;
  /** Permission level */
  role: PermissionRole;
  /** When access was granted */
  grantedAt: Date;
  /** Who granted access */
  grantedBy: string;
  /** Optional expiration (temporary access) */
  expiresAt?: Date;
  /** Optional note about the share */
  note?: string;
}

/**
 * Complete access control configuration
 * Applied to portfolios, strategies, watchlists, etc.
 */
export interface AccessControl {
  // ─────────────────────────────────────────────────────────────────────────
  // Visibility
  // ─────────────────────────────────────────────────────────────────────────
  visibility: VisibilityLevel;

  // ─────────────────────────────────────────────────────────────────────────
  // Sharing
  // ─────────────────────────────────────────────────────────────────────────
  sharedWith: SharedAccess[];

  // ─────────────────────────────────────────────────────────────────────────
  // Authorship
  // ─────────────────────────────────────────────────────────────────────────
  createdBy: string;                 // User ID of creator
  authorVisible: boolean;            // Show author publicly

  // ─────────────────────────────────────────────────────────────────────────
  // Capabilities
  // ─────────────────────────────────────────────────────────────────────────
  allowCopy: boolean;                // Can be forked/copied
  allowComment: boolean;             // Public comments allowed
  allowDerivatives: boolean;         // Allow modifications to copies

  // ─────────────────────────────────────────────────────────────────────────
  // License (for public content)
  // ─────────────────────────────────────────────────────────────────────────
  license?: ContentLicense;
}

/**
 * Content license types
 */
export type ContentLicense =
  | 'all_rights'     // All rights reserved
  | 'cc_by'          // Attribution
  | 'cc_by_sa'       // Attribution-ShareAlike
  | 'cc_by_nc'       // Attribution-NonCommercial
  | 'cc0';           // Public domain

/**
 * Default access control for new content
 */
export const DEFAULT_ACCESS_CONTROL: AccessControl = {
  visibility: 'private',
  sharedWith: [],
  createdBy: '',
  authorVisible: false,
  allowCopy: false,
  allowComment: false,
  allowDerivatives: false,
};

// ============================================================================
// Privacy Settings (User Preferences)
// ============================================================================

/**
 * User privacy settings
 * Stored in Firestore under user/preferences
 */
export interface PrivacySettings {
  // Activity visibility
  activityVisibility: ActivityVisibility;

  // Profile visibility
  profileVisibility: VisibilityLevel;
  showPerformance: boolean;          // Show returns publicly
  showHoldings: boolean;             // Show portfolio composition

  // Discovery
  searchable: boolean;               // Appear in user search
  showInLeaderboards: boolean;       // Appear in rankings

  // Data sharing
  shareAnalytics: boolean;           // Share usage analytics
  shareForImprovement: boolean;      // Share anonymized data

  // Communication
  allowDirectMessages: boolean;
  allowFollowRequests: boolean;

  // Anonymization preferences
  anonymizeInPublicViews: boolean;   // Hide real name in public contexts
  useDisplayNameOnly: boolean;       // Use display name, not email

  // Data retention
  autoDeleteOldData: boolean;
  dataRetentionDays?: number;
}

/**
 * Default privacy settings (privacy-first)
 */
export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
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

// ============================================================================
// Privacy-Aware Data Queries (CyberEco-compatible)
// ============================================================================

/**
 * Privacy filter for data queries
 * Used by privacyAwareDataService equivalent
 */
export interface PrivacyFilter {
  viewerId: string;                  // Who is requesting
  targetUserId: string;              // Whose data
  dataType: DataType;                // What type of data
  relationship?: UserRelationship;   // How they're related
}

/**
 * Data types for privacy filtering
 */
export type DataType =
  | 'holdings'
  | 'trades'
  | 'strategies'
  | 'performance'
  | 'watchlists'
  | 'profile'
  | 'activity';

/**
 * User relationship types
 */
export type UserRelationship =
  | 'self'           // Same user
  | 'following'      // Viewer follows target
  | 'follower'       // Target follows viewer
  | 'mutual'         // Both follow each other
  | 'shared'         // Explicit share access
  | 'none';          // No relationship

/**
 * Privacy check result
 */
export interface PrivacyCheckResult {
  canView: boolean;
  reason?: string;
  accessLevel: 'full' | 'partial' | 'anonymized' | 'none';
  hiddenFields?: string[];           // Fields to redact
}

// ============================================================================
// GDPR Rights (CyberEco-compatible)
// ============================================================================

/**
 * GDPR data request types
 */
export type GDPRRequestType =
  | 'access'         // Right to access (export data)
  | 'rectification'  // Right to correct data
  | 'erasure'        // Right to be forgotten
  | 'portability'    // Right to data portability
  | 'restriction'    // Right to restrict processing
  | 'objection';     // Right to object

/**
 * GDPR request status
 */
export type GDPRRequestStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'denied'
  | 'expired';

/**
 * GDPR data request
 */
export interface GDPRRequest {
  id: string;
  userId: string;
  type: GDPRRequestType;
  status: GDPRRequestStatus;
  reason?: string;                   // User-provided reason
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;                  // For data exports
  result?: {
    downloadUrl?: string;            // For export requests
    message?: string;
  };
}

/**
 * Privacy report (for right to access)
 */
export interface PrivacyReport {
  userId: string;
  generatedAt: Date;
  expiresAt: Date;

  // Data summary
  dataCategories: {
    category: string;
    itemCount: number;
    oldestItem?: Date;
    newestItem?: Date;
  }[];

  // Consent history
  consentHistory: ConsentRecord[];

  // Access log
  recentAccessLog: DataAccessLog[];

  // Third-party shares
  thirdPartyShares: {
    party: string;
    dataShared: string[];
    sharedAt: Date;
  }[];
}

// ============================================================================
// Audit Logging
// ============================================================================

/**
 * Data access log entry
 * For compliance and security auditing
 */
export interface DataAccessLog {
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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if viewer can access target's data
 */
export function canViewData(
  filter: PrivacyFilter,
  settings: PrivacySettings,
  access?: AccessControl
): PrivacyCheckResult {
  // Self always has full access
  if (filter.viewerId === filter.targetUserId) {
    return { canView: true, accessLevel: 'full' };
  }

  // Check explicit share access
  if (access?.sharedWith.some(s => s.userId === filter.viewerId)) {
    const share = access.sharedWith.find(s => s.userId === filter.viewerId)!;
    // Check expiration
    if (share.expiresAt && share.expiresAt < new Date()) {
      return { canView: false, reason: 'Share expired', accessLevel: 'none' };
    }
    return { canView: true, accessLevel: 'full' };
  }

  // Get visibility for this data type
  const visibility = settings.activityVisibility[filter.dataType as keyof ActivityVisibility]
    || settings.profileVisibility;

  switch (visibility) {
    case 'public':
      return { canView: true, accessLevel: settings.anonymizeInPublicViews ? 'anonymized' : 'full' };

    case 'internal':
      // Any authenticated user
      return { canView: !!filter.viewerId, accessLevel: 'partial' };

    case 'confidential':
      // Only explicitly shared (checked above)
      return { canView: false, reason: 'Not shared with viewer', accessLevel: 'none' };

    case 'private':
    default:
      return { canView: false, reason: 'Private data', accessLevel: 'none' };
  }
}

/**
 * Anonymize user data for public display
 */
export function anonymizeUserData<T extends { displayName?: string; email?: string; photoURL?: string }>(
  data: T,
  settings: PrivacySettings
): T {
  if (!settings.anonymizeInPublicViews) {
    return data;
  }

  return {
    ...data,
    displayName: settings.useDisplayNameOnly ? data.displayName : 'Anonymous User',
    email: 'hidden@tradepilot.app',
    photoURL: undefined,
  };
}

/**
 * Check if consent is granted for a type
 */
export function hasConsent(
  userConsent: UserConsent | null,
  type: ConsentType
): boolean {
  if (type === 'necessary') return true;
  if (!userConsent) return false;
  return userConsent.consents[type]?.granted ?? false;
}

/**
 * Get all granted consents
 */
export function getGrantedConsents(userConsent: UserConsent | null): ConsentType[] {
  if (!userConsent) return ['necessary'];
  return Object.entries(userConsent.consents)
    .filter(([_, record]) => record.granted)
    .map(([type]) => type as ConsentType);
}

// ============================================================================
// CyberEco Future Compatibility
// ============================================================================

/**
 * Decentralized identity hint (for future DID integration)
 */
export interface DecentralizedIdentityHint {
  /** User's decentralized identifier (future) */
  did?: string;
  /** Verification method */
  verificationMethod?: string;
  /** Controller (who can manage this identity) */
  controller?: string;
}

/**
 * Zero-knowledge proof placeholder (for future privacy features)
 */
export interface ZKProofPlaceholder {
  /** Proof type */
  type: 'membership' | 'range' | 'ownership';
  /** Proof data (to be implemented) */
  proof?: string;
  /** Verification key */
  verificationKey?: string;
}
