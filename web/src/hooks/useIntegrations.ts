/**
 * useIntegrations Hook
 *
 * Hook for managing integration connections to external data sources.
 * Used in settings/connections UI for adding, removing, and testing integrations.
 *
 * @module hooks/useIntegrations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '../lib/firebase';
import { getIntegrationService } from '../lib/services/integrations';
import { adapterRegistry, getAvailableAdapters } from '../lib/services/adapters';
import type { DataSource } from '../types/assets';
import type {
  SourceIntegration,
  SourceCredentials,
} from '../types/integrations';
import type { AdapterInfo, ConnectionResult } from '../lib/services/adapters/types';

// ============================================================================
// Types
// ============================================================================

export interface IntegrationsState {
  /** Current user integrations */
  integrations: SourceIntegration[];

  /** Available adapters that can be connected */
  availableAdapters: AdapterInfo[];

  /** Currently connecting source */
  connecting: DataSource | null;

  /** Currently testing source */
  testing: DataSource | null;

  /** Whether data is loading */
  isLoading: boolean;

  /** Whether user is authenticated */
  isAuthenticated: boolean;

  /** Current user ID */
  userId: string | null;

  /** Errors by source */
  errors: Map<DataSource, string>;

  // ─────────────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Add a new integration
   */
  addIntegration: (
    source: DataSource,
    credentials: SourceCredentials
  ) => Promise<ConnectionResult>;

  /**
   * Remove an integration
   */
  removeIntegration: (source: DataSource) => Promise<void>;

  /**
   * Test an integration connection
   */
  testConnection: (source: DataSource) => Promise<ConnectionResult>;

  /**
   * Refresh integrations list
   */
  refresh: () => Promise<void>;

  /**
   * Check if a source is connected
   */
  isConnected: (source: DataSource) => boolean;

  /**
   * Get integration for a source
   */
  getIntegration: (source: DataSource) => SourceIntegration | undefined;

  /**
   * Get adapter info for a source
   */
  getAdapterInfo: (source: DataSource) => AdapterInfo | undefined;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useIntegrations(): IntegrationsState {
  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────

  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [integrations, setIntegrations] = useState<SourceIntegration[]>([]);
  const [connecting, setConnecting] = useState<DataSource | null>(null);
  const [testing, setTesting] = useState<DataSource | null>(null);
  const [errors, setErrors] = useState<Map<DataSource, string>>(new Map());

  // ─────────────────────────────────────────────────────────────────────────
  // Services & Computed
  // ─────────────────────────────────────────────────────────────────────────

  const integrationService = useMemo(() => getIntegrationService(), []);

  const availableAdapters = useMemo(() => {
    return getAvailableAdapters();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Add a new integration
   */
  const addIntegration = useCallback(async (
    source: DataSource,
    credentials: SourceCredentials
  ): Promise<ConnectionResult> => {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    setConnecting(source);
    setErrors(prev => {
      const next = new Map(prev);
      next.delete(source);
      return next;
    });

    try {
      const result = await integrationService.addIntegration(userId, source, credentials);

      if (!result.success) {
        setErrors(prev => new Map(prev).set(source, result.error || 'Connection failed'));
      }

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection failed';
      setErrors(prev => new Map(prev).set(source, errorMsg));
      return { success: false, error: errorMsg };
    } finally {
      setConnecting(null);
    }
  }, [userId, integrationService]);

  /**
   * Remove an integration
   */
  const removeIntegration = useCallback(async (source: DataSource): Promise<void> => {
    if (!userId) return;

    try {
      await integrationService.removeIntegration(userId, source);
      setErrors(prev => {
        const next = new Map(prev);
        next.delete(source);
        return next;
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to remove integration';
      setErrors(prev => new Map(prev).set(source, errorMsg));
      throw err;
    }
  }, [userId, integrationService]);

  /**
   * Test an integration connection
   */
  const testConnection = useCallback(async (source: DataSource): Promise<ConnectionResult> => {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    setTesting(source);

    try {
      const result = await integrationService.testConnection(userId, source);

      if (!result.success) {
        setErrors(prev => new Map(prev).set(source, result.error || 'Connection test failed'));
      } else {
        setErrors(prev => {
          const next = new Map(prev);
          next.delete(source);
          return next;
        });
      }

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection test failed';
      setErrors(prev => new Map(prev).set(source, errorMsg));
      return { success: false, error: errorMsg };
    } finally {
      setTesting(null);
    }
  }, [userId, integrationService]);

  /**
   * Refresh integrations list
   */
  const refresh = useCallback(async (): Promise<void> => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const userIntegrations = await integrationService.getIntegrations(userId);
      setIntegrations(userIntegrations);
    } finally {
      setIsLoading(false);
    }
  }, [userId, integrationService]);

  /**
   * Check if a source is connected
   */
  const isConnected = useCallback((source: DataSource): boolean => {
    const integration = integrations.find(i => i.source === source);
    return integration?.status === 'active';
  }, [integrations]);

  /**
   * Get integration for a source
   */
  const getIntegration = useCallback((source: DataSource): SourceIntegration | undefined => {
    return integrations.find(i => i.source === source);
  }, [integrations]);

  /**
   * Get adapter info for a source
   */
  const getAdapterInfo = useCallback((source: DataSource): AdapterInfo | undefined => {
    return availableAdapters.find(a => a.id === source);
  }, [availableAdapters]);

  // ─────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────

  // Auth state listener
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setIntegrations([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to integrations
  useEffect(() => {
    if (!userId) return;

    const db = getFirebaseDb();
    const integrationsRef = collection(db, `users/${userId}/integrations`);

    setIsLoading(true);

    const unsubscribe = onSnapshot(integrationsRef, (snapshot) => {
      const integrationData = snapshot.docs.map(doc => ({
        source: doc.id as DataSource,
        ...doc.data(),
      })) as SourceIntegration[];
      setIntegrations(integrationData);
      setIsLoading(false);
    }, (err) => {
      console.error('Integrations subscription error:', err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Return Value
  // ─────────────────────────────────────────────────────────────────────────

  return {
    integrations,
    availableAdapters,
    connecting,
    testing,
    isLoading,
    isAuthenticated: userId !== null,
    userId,
    errors,
    addIntegration,
    removeIntegration,
    testConnection,
    refresh,
    isConnected,
    getIntegration,
    getAdapterInfo,
  };
}

export default useIntegrations;
