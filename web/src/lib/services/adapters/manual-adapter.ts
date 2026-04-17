/**
 * Manual Source Adapter
 *
 * Implements SourceAdapter interface for manually entered assets.
 * Used for tracking assets that don't have API connections (real estate, collectibles, etc.)
 *
 * @module adapters/manual-adapter
 */

import type { AssetClass } from '../../../types/assets';
import type {
  SourceAdapter,
  AdapterCapabilities,
  ExternalAccount,
  ExternalPosition,
  ConnectionResult,
} from './types';
import { adapterRegistry } from './registry';

// ============================================================================
// Manual Credentials (no actual credentials needed)
// ============================================================================

export interface ManualCredentials {
  // No credentials needed for manual entries
  // This exists for type consistency with the adapter interface
  userId?: string;
}

// ============================================================================
// Manual Adapter
// ============================================================================

export class ManualAdapter implements SourceAdapter<ManualCredentials> {
  // ─────────────────────────────────────────────────────────────────────────
  // Identity
  // ─────────────────────────────────────────────────────────────────────────

  readonly id = 'manual' as const;
  readonly displayName = 'Manual Entry';
  readonly description = 'Manually track assets like real estate, collectibles, and other holdings';
  readonly icon = '/icons/manual.svg';
  readonly supportedAssetClasses: AssetClass[] = [
    'equity',
    'fixed_income',
    'crypto',
    'forex',
    'commodity',
    'derivative',
    'prediction',
    'real_asset',
    'cash',
    'external',
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // Capabilities
  // ─────────────────────────────────────────────────────────────────────────

  readonly capabilities: AdapterCapabilities = {
    canTrade: false,
    canGetOrders: false,
    canGetHistory: false,
    canGetTransactions: false,
    supportsRealtime: false,
    supportsWebSocket: false,
    requiresCredentials: false,
    credentialsSchema: [], // No credentials needed
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Private State
  // ─────────────────────────────────────────────────────────────────────────

  private _isConnected = false;
  private userId: string | null = null;

  // ─────────────────────────────────────────────────────────────────────────
  // Connection Lifecycle
  // ─────────────────────────────────────────────────────────────────────────

  async connect(credentials: ManualCredentials): Promise<void> {
    // Manual adapter is always "connected" - no external API to connect to
    this.userId = credentials.userId || null;
    this._isConnected = true;
  }

  async disconnect(): Promise<void> {
    this._isConnected = false;
    this.userId = null;
  }

  async testConnection(): Promise<ConnectionResult> {
    // Manual adapter always succeeds - no external connection to test
    return {
      success: true,
      latency: 0,
    };
  }

  isConnected(): boolean {
    return this._isConnected;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Account Data
  // ─────────────────────────────────────────────────────────────────────────

  async getAccounts(): Promise<ExternalAccount[]> {
    // Manual adapter doesn't sync accounts from an external source
    // Accounts are created directly by the user in the app
    // This returns an empty array - the account data lives in Firestore
    return [];
  }

  async getPositions(accountId?: string): Promise<ExternalPosition[]> {
    // Manual adapter doesn't sync positions from an external source
    // Holdings are created directly by the user in the app
    // This returns an empty array - the position data lives in Firestore
    return [];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Not Supported
  // ─────────────────────────────────────────────────────────────────────────

  // Orders, transactions, trading, etc. are not supported for manual entries
  // These methods are intentionally not implemented
}

// ============================================================================
// Factory & Registration
// ============================================================================

/**
 * Create a new ManualAdapter instance
 */
export function createManualAdapter(): ManualAdapter {
  return new ManualAdapter();
}

/**
 * Register ManualAdapter with the global registry
 * Called on module import
 */
adapterRegistry.register('manual', createManualAdapter, 'available');

export default ManualAdapter;
