/**
 * useAlpacaData Hook
 *
 * Fetches and caches Alpaca account data for use across dashboard components.
 */

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '../lib/firebase';
import {
  getAlpacaCredentials,
  testAlpacaConnection,
  fetchAlpacaOrders,
  fetchAlpacaPositions,
  fetchPortfolioHistory,
  type PortfolioHistoryPoint,
} from '../lib/services/alpaca';
import type {
  AlpacaAccount,
  AlpacaOrder,
  AlpacaPosition,
  AlpacaCredentials,
} from '../types/alpaca';

interface AlpacaDataState {
  /** Whether data is loading */
  isLoading: boolean;
  /** Whether user is connected to Alpaca */
  isConnected: boolean;
  /** Error message if any */
  error: string | null;
  /** User ID */
  userId: string | null;
  /** Alpaca credentials */
  credentials: AlpacaCredentials | null;
  /** Alpaca account info */
  account: AlpacaAccount | null;
  /** User's positions */
  positions: AlpacaPosition[];
  /** User's recent orders */
  orders: AlpacaOrder[];
  /** Portfolio history data */
  portfolioHistory: PortfolioHistoryPoint[];
  /** Refresh data */
  refresh: () => Promise<void>;
}

// Cache data to avoid refetching on every component mount
let cachedData: {
  account: AlpacaAccount | null;
  positions: AlpacaPosition[];
  orders: AlpacaOrder[];
  portfolioHistory: PortfolioHistoryPoint[];
  credentials: AlpacaCredentials | null;
  fetchedAt: number;
} | null = null;

const CACHE_TTL = 30000; // 30 seconds

export function useAlpacaData(): AlpacaDataState {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<AlpacaCredentials | null>(null);
  const [account, setAccount] = useState<AlpacaAccount | null>(null);
  const [positions, setPositions] = useState<AlpacaPosition[]>([]);
  const [orders, setOrders] = useState<AlpacaOrder[]>([]);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryPoint[]>([]);

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    return cachedData && Date.now() - cachedData.fetchedAt < CACHE_TTL;
  }, []);

  // Fetch data from Alpaca
  const fetchData = useCallback(async (uid: string, forceRefresh = false) => {
    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid() && cachedData) {
      setCredentials(cachedData.credentials);
      setAccount(cachedData.account);
      setPositions(cachedData.positions);
      setOrders(cachedData.orders);
      setPortfolioHistory(cachedData.portfolioHistory);
      setIsConnected(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get credentials from Firestore
      const creds = await getAlpacaCredentials(uid);
      if (!creds) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      setCredentials(creds);

      // Test connection and get account info
      const accountInfo = await testAlpacaConnection(
        creds.apiKey,
        creds.apiSecret,
        creds.environment
      );

      if (!accountInfo) {
        setError('Failed to connect to Alpaca');
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      setAccount(accountInfo);
      setIsConnected(true);

      // Fetch positions, orders, and portfolio history in parallel
      const [positionsData, ordersData, historyData] = await Promise.all([
        fetchAlpacaPositions(creds.apiKey, creds.apiSecret, creds.environment),
        fetchAlpacaOrders(creds.apiKey, creds.apiSecret, creds.environment, 'all', 20),
        fetchPortfolioHistory(creds.apiKey, creds.apiSecret, creds.environment, '1M', '1D'),
      ]);

      setPositions(positionsData);
      setOrders(ordersData);
      setPortfolioHistory(historyData);

      // Update cache
      cachedData = {
        account: accountInfo,
        positions: positionsData,
        orders: ordersData,
        portfolioHistory: historyData,
        credentials: creds,
        fetchedAt: Date.now(),
      };
    } catch (err) {
      console.error('Failed to fetch Alpaca data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [isCacheValid]);

  // Listen to auth state and fetch data
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        fetchData(user.uid);
      } else {
        setUserId(null);
        setIsConnected(false);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchData]);

  // Refresh function
  const refresh = useCallback(async () => {
    if (userId) {
      await fetchData(userId, true);
    }
  }, [userId, fetchData]);

  return {
    isLoading,
    isConnected,
    error,
    userId,
    credentials,
    account,
    positions,
    orders,
    portfolioHistory,
    refresh,
  };
}

export default useAlpacaData;
