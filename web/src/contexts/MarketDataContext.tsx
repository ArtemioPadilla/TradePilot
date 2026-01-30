/**
 * Market Data Context
 *
 * Provides global market data state and services to React components.
 * Manages connections, subscriptions, and cache across the app.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  PriceQuote,
  MarketDataPreferences,
  MarketDataServiceState,
  MarketStatus,
} from '../types/market-data';
import type { AlpacaCredentials } from '../types/alpaca';
import {
  MarketDataService,
  getMarketDataService,
  type MarketDataEvent,
} from '../lib/services/market-data/service';
import { getAlpacaProvider } from '../lib/services/data-providers/alpaca';
import { DEFAULT_MARKET_DATA_PREFERENCES } from '../types/market-data';

// ============================================================================
// Context Types
// ============================================================================

export interface MarketDataContextValue {
  /** Whether the service is initialized */
  initialized: boolean;

  /** Whether connected to real-time data */
  connected: boolean;

  /** Current market status */
  marketStatus: MarketStatus;

  /** User preferences */
  preferences: MarketDataPreferences;

  /** Service state */
  serviceState: MarketDataServiceState | null;

  /** Recent errors */
  errors: Error[];

  /** Initialize with credentials */
  initialize: (credentials: AlpacaCredentials) => Promise<void>;

  /** Update preferences */
  setPreferences: (prefs: Partial<MarketDataPreferences>) => void;

  /** Get current price for a symbol */
  getPrice: (symbol: string) => PriceQuote | null;

  /** Subscribe to price updates */
  subscribeToPrice: (
    symbol: string,
    callback: (price: PriceQuote) => void
  ) => () => void;

  /** Refresh all prices */
  refreshAll: () => Promise<void>;

  /** Clear cache */
  clearCache: () => Promise<void>;

  /** The underlying service (for advanced usage) */
  service: MarketDataService | null;
}

// ============================================================================
// Context
// ============================================================================

const MarketDataContext = createContext<MarketDataContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface MarketDataProviderProps {
  children: ReactNode;
  /** Initial preferences */
  initialPreferences?: Partial<MarketDataPreferences>;
  /** Auto-connect when credentials are available */
  autoConnect?: boolean;
}

export function MarketDataProvider({
  children,
  initialPreferences,
  autoConnect = true,
}: MarketDataProviderProps) {
  // State
  const [initialized, setInitialized] = useState(false);
  const [connected, setConnected] = useState(false);
  const [marketStatus, setMarketStatus] = useState<MarketStatus>('unknown');
  const [preferences, setPreferencesState] = useState<MarketDataPreferences>({
    ...DEFAULT_MARKET_DATA_PREFERENCES,
    ...initialPreferences,
  });
  const [serviceState, setServiceState] = useState<MarketDataServiceState | null>(null);
  const [errors, setErrors] = useState<Error[]>([]);
  const [service, setService] = useState<MarketDataService | null>(null);

  // Price cache (for quick lookups)
  const [priceCache, setPriceCache] = useState<Map<string, PriceQuote>>(new Map());

  // Subscriber registry
  const [subscribers] = useState<Map<string, Set<(price: PriceQuote) => void>>>(
    () => new Map()
  );

  // Initialize service
  useEffect(() => {
    const svc = getMarketDataService();
    setService(svc);

    // Listen for events
    const handleEvent = (event: MarketDataEvent) => {
      switch (event.type) {
        case 'quote_updated':
          setPriceCache(prev => {
            const next = new Map(prev);
            next.set(event.symbol, event.quote);
            return next;
          });

          // Notify subscribers
          const callbacks = subscribers.get(event.symbol);
          if (callbacks) {
            for (const cb of callbacks) {
              try {
                cb(event.quote);
              } catch (e) {
                console.error('Subscriber callback error:', e);
              }
            }
          }
          break;

        case 'connection_changed':
          setConnected(event.status === 'connected');
          break;

        case 'error':
          setErrors(prev => [...prev.slice(-9), event.error]);
          break;
      }
    };

    svc.addEventListener(handleEvent);

    return () => {
      svc.removeEventListener(handleEvent);
      svc.disconnect();
    };
  }, [subscribers]);

  // Initialize with credentials
  const initialize = useCallback(async (credentials: AlpacaCredentials) => {
    if (!service) return;

    try {
      // Set credentials on Alpaca provider
      const alpacaProvider = getAlpacaProvider(credentials);

      // Register provider if not already
      const registeredProviders = service.getRegisteredProviders();
      if (!registeredProviders.includes('alpaca')) {
        service.registerProvider(alpacaProvider);
      }

      // Connect to WebSocket if enabled
      if (preferences.enableWebSocket && autoConnect) {
        await service.connect();
        setConnected(true);
      }

      // Update market status
      updateMarketStatus();

      setInitialized(true);
    } catch (error) {
      setErrors(prev => [...prev.slice(-9), error as Error]);
      throw error;
    }
  }, [service, preferences.enableWebSocket, autoConnect]);

  // Update preferences
  const setPreferences = useCallback((prefs: Partial<MarketDataPreferences>) => {
    setPreferencesState(prev => ({
      ...prev,
      ...prefs,
    }));
  }, []);

  // Get price from cache
  const getPrice = useCallback((symbol: string): PriceQuote | null => {
    return priceCache.get(symbol) || null;
  }, [priceCache]);

  // Subscribe to price updates
  const subscribeToPrice = useCallback((
    symbol: string,
    callback: (price: PriceQuote) => void
  ): (() => void) => {
    // Add to subscribers
    if (!subscribers.has(symbol)) {
      subscribers.set(symbol, new Set());
    }
    subscribers.get(symbol)!.add(callback);

    // Subscribe via service
    if (service) {
      service.subscribe([symbol], (quote) => {
        // Will be handled by event listener
      });
    }

    // Return unsubscribe function
    return () => {
      const callbacks = subscribers.get(symbol);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          subscribers.delete(symbol);
          service?.unsubscribe([symbol]);
        }
      }
    };
  }, [service, subscribers]);

  // Refresh all prices
  const refreshAll = useCallback(async () => {
    if (!service) return;

    // Get all subscribed symbols
    const symbols = Array.from(subscribers.keys());
    if (symbols.length === 0) return;

    const response = await service.getQuotes({
      symbols,
      forceRefresh: true,
    });

    // Update cache
    setPriceCache(response.quotes);
  }, [service, subscribers]);

  // Clear cache
  const clearCache = useCallback(async () => {
    if (!service) return;
    await service.clearCache();
    setPriceCache(new Map());
  }, [service]);

  // Update market status
  const updateMarketStatus = useCallback(() => {
    const now = new Date();
    const estHour = getESTHour(now);
    const day = now.getDay();

    // Weekend
    if (day === 0 || day === 6) {
      setMarketStatus('closed');
      return;
    }

    // Pre-market: 4:00 AM - 9:30 AM EST
    if (estHour >= 4 && estHour < 9.5) {
      setMarketStatus('pre');
      return;
    }

    // Regular hours: 9:30 AM - 4:00 PM EST
    if (estHour >= 9.5 && estHour < 16) {
      setMarketStatus('open');
      return;
    }

    // After hours: 4:00 PM - 8:00 PM EST
    if (estHour >= 16 && estHour < 20) {
      setMarketStatus('post');
      return;
    }

    setMarketStatus('closed');
  }, []);

  // Update market status periodically
  useEffect(() => {
    updateMarketStatus();
    const interval = setInterval(updateMarketStatus, 60_000); // Every minute
    return () => clearInterval(interval);
  }, [updateMarketStatus]);

  // Update service state periodically
  useEffect(() => {
    if (!service) return;

    const updateState = async () => {
      const state = await service.getState();
      setServiceState(state);
    };

    updateState();
    const interval = setInterval(updateState, 30_000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [service]);

  // Context value
  const value = useMemo<MarketDataContextValue>(() => ({
    initialized,
    connected,
    marketStatus,
    preferences,
    serviceState,
    errors,
    initialize,
    setPreferences,
    getPrice,
    subscribeToPrice,
    refreshAll,
    clearCache,
    service,
  }), [
    initialized,
    connected,
    marketStatus,
    preferences,
    serviceState,
    errors,
    initialize,
    setPreferences,
    getPrice,
    subscribeToPrice,
    refreshAll,
    clearCache,
    service,
  ]);

  return (
    <MarketDataContext.Provider value={value}>
      {children}
    </MarketDataContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useMarketDataContext(): MarketDataContextValue {
  const context = useContext(MarketDataContext);

  if (!context) {
    throw new Error(
      'useMarketDataContext must be used within a MarketDataProvider'
    );
  }

  return context;
}

// ============================================================================
// Helpers
// ============================================================================

function getESTHour(date: Date): number {
  const estDate = new Date(
    date.toLocaleString('en-US', { timeZone: 'America/New_York' })
  );
  return estDate.getHours() + estDate.getMinutes() / 60;
}
