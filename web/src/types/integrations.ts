/**
 * Integration Types
 *
 * Types for managing connections to external data sources.
 * Each integration represents a user's connection to a service like Alpaca, GBM, Bitso, etc.
 *
 * @module types/integrations
 */

import type { Timestamp } from 'firebase/firestore';
import type { DataSource } from './assets';

// ============================================================================
// Integration Status
// ============================================================================

/**
 * Status of an integration connection
 */
export type IntegrationStatus =
  | 'active'        // Connected and working
  | 'disconnected'  // User disconnected
  | 'error'         // Connection error
  | 'pending'       // Awaiting verification
  | 'expired';      // Credentials expired (needs refresh)

// ============================================================================
// Source Integration
// ============================================================================

/**
 * A user's integration with an external data source
 */
export interface SourceIntegration {
  /** User ID who owns this integration */
  userId: string;

  /** Data source identifier */
  source: DataSource;

  /** Current connection status */
  status: IntegrationStatus;

  /** When the connection was established */
  connectedAt?: Timestamp;

  /** When the connection was last verified */
  lastVerified?: Timestamp;

  /** When data was last synced */
  lastSyncedAt?: Timestamp;

  /** Number of accounts synced */
  accountCount?: number;

  /** Number of positions synced */
  positionCount?: number;

  /** Error message if status is 'error' */
  error?: string;

  /** Source-specific settings */
  settings?: Record<string, unknown>;

  /** When the integration was created */
  createdAt: Timestamp;

  /** When the integration was last updated */
  updatedAt: Timestamp;
}

// ============================================================================
// Credential Types
// ============================================================================

/**
 * Base credential interface
 */
export interface BaseCredentials {
  /** When credentials were created */
  createdAt?: Date;
  /** When credentials expire (if applicable) */
  expiresAt?: Date;
}

/**
 * Alpaca API credentials
 */
export interface AlpacaCredentials extends BaseCredentials {
  /** API Key ID */
  apiKey: string;
  /** API Secret Key (encrypted in storage) */
  apiSecret: string;
  /** Trading environment */
  environment: 'paper' | 'live';
}

/**
 * GBM (Mexican brokerage) credentials
 */
export interface GBMCredentials extends BaseCredentials {
  /** Contract number */
  contractNumber: string;
  /** Password (encrypted in storage) */
  password: string;
  /** Trading password (encrypted in storage) */
  tradingPassword?: string;
}

/**
 * Bitso (Mexican crypto exchange) credentials
 */
export interface BitsoCredentials extends BaseCredentials {
  /** API Key */
  apiKey: string;
  /** API Secret (encrypted in storage) */
  apiSecret: string;
}

/**
 * CoinGecko credentials (free tier has no credentials)
 */
export interface CoinGeckoCredentials extends BaseCredentials {
  /** API Key (optional, for pro tier) */
  apiKey?: string;
}

/**
 * Plaid credentials (for bank connections)
 */
export interface PlaidCredentials extends BaseCredentials {
  /** Plaid access token (encrypted in storage) */
  accessToken: string;
  /** Plaid item ID */
  itemId: string;
  /** Institution ID */
  institutionId: string;
  /** Institution name */
  institutionName: string;
}

/**
 * Manual entry credentials (no actual credentials needed)
 */
export interface ManualCredentials extends BaseCredentials {
  // No credentials needed for manual entries
}

/**
 * Union of all credential types
 */
export type SourceCredentials =
  | AlpacaCredentials
  | GBMCredentials
  | BitsoCredentials
  | CoinGeckoCredentials
  | PlaidCredentials
  | ManualCredentials;

// ============================================================================
// Credential Storage (Firestore format)
// ============================================================================

/**
 * How credentials are stored in Firestore
 * Sensitive fields are encrypted before storage
 */
export interface StoredCredentials {
  /** Source identifier */
  source: DataSource;

  /** Encrypted credentials data */
  data: string;

  /** Encryption version (for future migration) */
  encryptionVersion: number;

  /** When credentials were stored */
  storedAt: Timestamp;

  /** When credentials were last accessed */
  lastAccessedAt?: Timestamp;
}

// ============================================================================
// Sync Types
// ============================================================================

/**
 * Result of syncing an integration
 */
export interface SyncResult {
  /** Data source that was synced */
  source: DataSource;

  /** Whether sync was successful */
  success: boolean;

  /** Number of accounts updated */
  accountsUpdated: number;

  /** Number of holdings updated */
  holdingsUpdated: number;

  /** Sync errors (if any) */
  errors: SyncError[];

  /** When sync completed */
  syncedAt: Date;

  /** Duration in milliseconds */
  durationMs: number;
}

/**
 * Sync error details
 */
export interface SyncError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Which entity failed (account ID, symbol, etc.) */
  entityId?: string;

  /** Whether the error is recoverable */
  recoverable: boolean;
}

// ============================================================================
// Form Types
// ============================================================================

/**
 * Form data for adding an integration
 */
export interface AddIntegrationFormData {
  /** Data source to add */
  source: DataSource;

  /** Credentials (type depends on source) */
  credentials: SourceCredentials;
}

/**
 * Validation result for integration credentials
 */
export interface CredentialValidationResult {
  /** Whether credentials are valid */
  valid: boolean;

  /** Validation errors by field */
  errors: Record<string, string>;

  /** Connection test result (if validation passed) */
  connectionResult?: {
    success: boolean;
    error?: string;
    latency?: number;
  };
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if credentials are for Alpaca
 */
export function isAlpacaCredentials(creds: SourceCredentials): creds is AlpacaCredentials {
  return 'apiKey' in creds && 'apiSecret' in creds && 'environment' in creds;
}

/**
 * Check if credentials are for GBM
 */
export function isGBMCredentials(creds: SourceCredentials): creds is GBMCredentials {
  return 'contractNumber' in creds && 'password' in creds;
}

/**
 * Check if credentials are for Bitso
 */
export function isBitsoCredentials(creds: SourceCredentials): creds is BitsoCredentials {
  return 'apiKey' in creds && 'apiSecret' in creds && !('environment' in creds);
}

/**
 * Check if credentials are for Plaid
 */
export function isPlaidCredentials(creds: SourceCredentials): creds is PlaidCredentials {
  return 'accessToken' in creds && 'itemId' in creds;
}

/**
 * Check if credentials are manual (empty)
 */
export function isManualCredentials(creds: SourceCredentials): creds is ManualCredentials {
  return Object.keys(creds).length === 0 ||
    (Object.keys(creds).every(k => k === 'createdAt' || k === 'expiresAt'));
}
