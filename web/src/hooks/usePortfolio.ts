/**
 * usePortfolio Hook
 *
 * Unified hook for portfolio data across all connected sources.
 * Replaces useAlpacaData with a multi-source architecture.
 *
 * @module hooks/usePortfolio
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '../lib/firebase';
import { getIntegrationService } from '../lib/services/integrations';
import { getAccountSyncService } from '../lib/services/account-sync';
import type { DataSource } from '../types/assets';
import type { Account, Holding } from '../types/portfolio';
import type { SourceIntegration, SyncResult } from '../types/integrations';
import type { PortfolioHistoryPoint } from '../lib/services/adapters/types';

// ============================================================================
// Types
// ============================================================================

export interface PortfolioState {
  /** All user accounts across all sources */
  accounts: Account[];

  /** All holdings across all accounts */
  holdings: Holding[];

  /** Connected integrations */
  integrations: SourceIntegration[];

  // ─────────────────────────────────────────────────────────────────────────
  // Aggregated Values
  // ─────────────────────────────────────────────────────────────────────────

  /** Total portfolio value (all accounts) */
  totalValue: number;

  /** Total cash across all accounts */
  totalCash: number;

  /** Total cost basis */
  totalCostBasis: number;

  /** Total unrealized P&L */
  totalGainLoss: number;

  /** Total unrealized P&L as percentage */
  totalGainLossPercent: number;

  /** Today's change in value */
  dailyChange: number;

  /** Today's change as percentage */
  dailyChangePercent: number;

  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────

  /** Whether data is loading */
  isLoading: boolean;

  /** Whether user is authenticated */
  isAuthenticated: boolean;

  /** Whether user has any connected integrations */
  hasIntegrations: boolean;

  /** Current user ID */
  userId: string | null;

  /** Errors by source */
  errors: Map<DataSource, Error>;

  // ─────────────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────────────

  /** Refresh all data */
  refresh: () => Promise<void>;

  /** Sync a specific source */
  syncSource: (source: DataSource) => Promise<SyncResult | null>;

  /** Sync all sources */
  syncAll: () => Promise<SyncResult[]>;

  /** Portfolio history from primary source */
  portfolioHistory: PortfolioHistoryPoint[];
}

export interface UsePortfolioOptions {
  /** Auto-refresh interval in ms (0 to disable) */
  refreshInterval?: number;

  /** Whether to fetch portfolio history */
  includeHistory?: boolean;

  /** History period */
  historyPeriod?: '1D' | '1W' | '1M' | '3M' | '1A' | 'all';

  /** Filter by specific sources */
  sources?: DataSource[];
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePortfolio(options: UsePortfolioOptions = {}): PortfolioState {
  const {
    refreshInterval = 30000, // 30 seconds default
    includeHistory = true,
    historyPeriod = '1M',
    sources,
  } = options;

  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────

  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [integrations, setIntegrations] = useState<SourceIntegration[]>([]);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryPoint[]>([]);

  // Ref to access current integrations without causing dependency loops
  const integrationsRef = useRef<SourceIntegration[]>([]);
  // Keep ref in sync with state
  useEffect(() => {
    integrationsRef.current = integrations;
  }, [integrations]);

  const [errors, setErrors] = useState<Map<DataSource, Error>>(new Map());

  // ─────────────────────────────────────────────────────────────────────────
  // Services
  // ─────────────────────────────────────────────────────────────────────────

  const integrationService = useMemo(() => getIntegrationService(), []);
  const syncService = useMemo(() => getAccountSyncService(), []);

  // ─────────────────────────────────────────────────────────────────────────
  // Computed Values
  // ─────────────────────────────────────────────────────────────────────────

  const totalValue = useMemo(() => {
    const holdingsValue = holdings.reduce(
      (sum, h) => sum + (h.marketValue || 0),
      0
    );
    const cashValue = accounts.reduce(
      (sum, a) => sum + (a.cashBalance || 0),
      0
    );
    return holdingsValue + cashValue;
  }, [holdings, accounts]);

  const totalCash = useMemo(() => {
    return accounts.reduce((sum, a) => sum + (a.cashBalance || 0), 0);
  }, [accounts]);

  const totalCostBasis = useMemo(() => {
    return holdings.reduce((sum, h) => sum + (h.totalCostBasis || 0), 0);
  }, [holdings]);

  const totalGainLoss = useMemo(() => {
    return holdings.reduce((sum, h) => sum + (h.unrealizedPL || 0), 0);
  }, [holdings]);

  const totalGainLossPercent = useMemo(() => {
    if (totalCostBasis === 0) return 0;
    return (totalGainLoss / totalCostBasis) * 100;
  }, [totalGainLoss, totalCostBasis]);

  const dailyChange = useMemo(() => {
    return holdings.reduce((sum, h) => sum + (h.dailyChange || 0), 0);
  }, [holdings]);

  const dailyChangePercent = useMemo(() => {
    const totalValueYesterday = totalValue - dailyChange;
    if (totalValueYesterday === 0) return 0;
    return (dailyChange / totalValueYesterday) * 100;
  }, [totalValue, dailyChange]);

  const hasIntegrations = useMemo(() => {
    return integrations.some(i => i.status === 'active');
  }, [integrations]);

  // ─────────────────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Load integrations
   */
  const loadIntegrations = useCallback(async (uid: string) => {
    try {
      const userIntegrations = await integrationService.getIntegrations(uid);
      setIntegrations(userIntegrations);
    } catch (err) {
      console.error('Failed to load integrations:', err);
    }
  }, [integrationService]);

  /**
   * Load portfolio history from connected sources that support it
   * Prioritizes sources in order: alpaca, then others
   */
  const loadPortfolioHistory = useCallback(async (uid: string) => {
    if (!includeHistory) return;

    try {
      // Get all active integrations (use ref to avoid dependency loop)
      const activeIntegrations = integrationsRef.current.filter(i => i.status === 'active');

      // Prioritize Alpaca, then try others
      const prioritizedSources: DataSource[] = ['alpaca'];
      const otherSources = activeIntegrations
        .map(i => i.source)
        .filter(s => s !== 'alpaca');
      const orderedSources = [...prioritizedSources, ...otherSources];

      // Try each source until we get history data
      for (const source of orderedSources) {
        const integration = activeIntegrations.find(i => i.source === source);
        if (!integration) continue;

        try {
          const adapter = await integrationService.getConnectedAdapter(uid, source);
          if (adapter?.getPortfolioHistory) {
            const history = await adapter.getPortfolioHistory(historyPeriod);
            if (history.length > 0) {
              setPortfolioHistory(history);
              return; // Got data, stop trying other sources
            }
          }
        } catch (err) {
          console.warn(`Failed to load portfolio history from ${source}:`, err);
          // Continue to next source
        }
      }

      // No history available from any source
      setPortfolioHistory([]);
    } catch (err) {
      console.error('Failed to load portfolio history:', err);
      setPortfolioHistory([]);
    }
  }, [integrationService, includeHistory, historyPeriod]);

  /**
   * Sync a specific source
   */
  const syncSource = useCallback(async (source: DataSource): Promise<SyncResult | null> => {
    if (!userId) return null;

    try {
      const result = await syncService.syncSource(userId, source);

      if (!result.success) {
        setErrors(prev => new Map(prev).set(source, new Error(result.errors[0]?.message || 'Sync failed')));
      } else {
        setErrors(prev => {
          const next = new Map(prev);
          next.delete(source);
          return next;
        });
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sync failed');
      setErrors(prev => new Map(prev).set(source, error));
      return null;
    }
  }, [userId, syncService]);

  /**
   * Sync all sources
   */
  const syncAll = useCallback(async (): Promise<SyncResult[]> => {
    if (!userId) return [];

    try {
      const results = await syncService.syncAll(userId);

      // Update errors map
      const newErrors = new Map<DataSource, Error>();
      for (const result of results) {
        if (!result.success && result.errors.length > 0) {
          newErrors.set(result.source, new Error(result.errors[0].message));
        }
      }
      setErrors(newErrors);

      return results;
    } catch (err) {
      console.error('Failed to sync all:', err);
      return [];
    }
  }, [userId, syncService]);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);

    try {
      // Sync all sources to get fresh data
      const results = await syncAll();

      // Check for any sync failures and log them
      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        console.warn('Some sources failed to sync:', failures.map(f => f.source));
      }

      // Reload portfolio history
      await loadPortfolioHistory(userId);
    } catch (err) {
      console.error('Failed to refresh portfolio data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, syncAll, loadPortfolioHistory]);

  // ─────────────────────────────────────────────────────────────────────────
  // Real-time Subscriptions
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
        // Clear all state on logout
        setUserId(null);
        setAccounts([]);
        setHoldings([]);
        setIntegrations([]);
        setPortfolioHistory([]);
        setErrors(new Map()); // Clear errors on logout
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to accounts
  useEffect(() => {
    if (!userId) return;

    const db = getFirebaseDb();
    const accountsRef = collection(db, `users/${userId}/accounts`);

    // Filter by source if specified
    const q = sources
      ? query(accountsRef, where('source', 'in', sources))
      : accountsRef;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const accountData = snapshot.docs
        .map(doc => {
          const data = doc.data();
          // Basic validation - ensure required fields exist
          if (!data.name || !data.type) {
            console.warn(`Account ${doc.id} missing required fields, skipping`);
            return null;
          }
          return {
            id: doc.id,
            ...data,
          } as Account;
        })
        .filter((account): account is Account => account !== null);
      setAccounts(accountData);
    }, (err) => {
      console.error('Accounts subscription error:', err);
      console.error('Accounts subscription context:', { userId, path: `users/${userId}/accounts` });
      // On permission error, clear accounts and stop retrying
      if (err.code === 'permission-denied') {
        setAccounts([]);
      }
    });

    return () => unsubscribe();
  }, [userId, sources]);

  // Subscribe to holdings
  useEffect(() => {
    if (!userId) return;

    const db = getFirebaseDb();
    const holdingsRef = collection(db, `users/${userId}/holdings`);

    // Filter by source if specified
    const q = sources
      ? query(holdingsRef, where('dataSource', 'in', sources))
      : holdingsRef;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const holdingData = snapshot.docs
        .map(doc => {
          const data = doc.data();
          // Basic validation - ensure required fields exist
          if (!data.symbol || !data.accountId) {
            console.warn(`Holding ${doc.id} missing required fields, skipping`);
            return null;
          }
          return {
            id: doc.id,
            ...data,
          } as Holding;
        })
        .filter((holding): holding is Holding => holding !== null);
      setHoldings(holdingData);
    }, (err) => {
      console.error('Holdings subscription error:', err);
      console.error('Holdings subscription context:', { userId, path: `users/${userId}/holdings` });
      // On permission error, clear holdings and stop retrying
      if (err.code === 'permission-denied') {
        setHoldings([]);
      }
    });

    return () => unsubscribe();
  }, [userId, sources]);

  // Initial data load
  useEffect(() => {
    if (!userId) return;

    const loadInitialData = async () => {
      setIsLoading(true);

      try {
        await loadIntegrations(userId);
        await loadPortfolioHistory(userId);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [userId, loadIntegrations, loadPortfolioHistory]);

  // Refs to avoid recreating interval on callback changes
  const syncAllRef = useRef(syncAll);
  const loadPortfolioHistoryRef = useRef(loadPortfolioHistory);

  // Keep refs up to date
  useEffect(() => {
    syncAllRef.current = syncAll;
    loadPortfolioHistoryRef.current = loadPortfolioHistory;
  }, [syncAll, loadPortfolioHistory]);

  // Auto-refresh
  useEffect(() => {
    if (!userId || refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      // Only sync, don't trigger full loading state
      syncAllRef.current().catch(console.error);
      loadPortfolioHistoryRef.current(userId).catch(console.error);
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [userId, refreshInterval]);

  // ─────────────────────────────────────────────────────────────────────────
  // Return Value
  // ─────────────────────────────────────────────────────────────────────────

  return {
    accounts,
    holdings,
    integrations,
    totalValue,
    totalCash,
    totalCostBasis,
    totalGainLoss,
    totalGainLossPercent,
    dailyChange,
    dailyChangePercent,
    isLoading,
    isAuthenticated: userId !== null,
    hasIntegrations,
    userId,
    errors,
    refresh,
    syncSource,
    syncAll,
    portfolioHistory,
  };
}

export default usePortfolio;
