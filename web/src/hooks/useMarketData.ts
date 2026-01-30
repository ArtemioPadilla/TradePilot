/**
 * useMarketData Hook
 *
 * React hook for consuming market data with automatic caching,
 * real-time updates, and refresh management.
 *
 * Features:
 * - Automatic subscription management
 * - Refresh timer display
 * - Offline support
 * - CyberEco-compatible data structures
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  PriceQuote,
  PriceHistory,
  MarketDataPreferences,
  Timeframe,
} from '../types/market-data';
import type { AssetClass, DataSource } from '../types/assets';
import { DEFAULT_MARKET_DATA_PREFERENCES, REFRESH_PRESETS } from '../types/market-data';
import { getMarketDataService, MarketDataService } from '../lib/services/market-data/service';
import { getAlpacaProvider } from '../lib/services/data-providers/alpaca';

// ============================================================================
// Types
// ============================================================================

export interface UseMarketDataOptions {
  /** Symbols to fetch quotes for */
  symbols: string[];

  /** Asset class (for determining TTL and provider) */
  assetClass?: AssetClass;

  /** Data source override */
  dataSource?: DataSource;

  /** Enable WebSocket real-time updates */
  enableWebSocket?: boolean;

  /** Enable automatic refresh */
  enableRefresh?: boolean;

  /** Custom refresh interval (ms) */
  refreshInterval?: number;

  /** Include historical data */
  includeHistory?: boolean;

  /** Timeframe for historical data */
  historyTimeframe?: Timeframe;

  /** User preferences (overrides defaults) */
  preferences?: Partial<MarketDataPreferences>;
}

export interface UseMarketDataReturn {
  /** Map of symbol -> current price quote */
  prices: Map<string, PriceQuote>;

  /** Map of symbol -> price history (if requested) */
  history: Map<string, PriceHistory>;

  /** Loading state */
  loading: boolean;

  /** Error state */
  error: Error | null;

  /** Last successful update time */
  lastUpdated: Date | null;

  /** Next scheduled refresh time */
  nextRefresh: Date | null;

  /** Seconds until next refresh */
  secondsUntilRefresh: number;

  /** Whether data is stale (older than TTL) */
  isStale: boolean;

  /** Whether currently connected to real-time stream */
  isConnected: boolean;

  /** Manual refresh function */
  refresh: () => Promise<void>;

  /** Subscribe to additional symbols */
  subscribe: (symbols: string[]) => void;

  /** Unsubscribe from symbols */
  unsubscribe: (symbols: string[]) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useMarketData(options: UseMarketDataOptions): UseMarketDataReturn {
  const {
    symbols,
    assetClass = 'equity',
    dataSource,
    enableWebSocket = true,
    enableRefresh = true,
    refreshInterval,
    includeHistory = false,
    historyTimeframe = '1d',
    preferences = {},
  } = options;

  // Merge preferences with defaults
  const mergedPrefs: MarketDataPreferences = {
    ...DEFAULT_MARKET_DATA_PREFERENCES,
    ...preferences,
  };

  // State
  const [prices, setPrices] = useState<Map<string, PriceQuote>>(new Map());
  const [history, setHistory] = useState<Map<string, PriceHistory>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nextRefresh, setNextRefresh] = useState<Date | null>(null);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(0);
  const [isStale, setIsStale] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Refs for cleanup
  const serviceRef = useRef<MarketDataService | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const symbolsRef = useRef<string[]>(symbols);

  // Calculate refresh interval
  const getRefreshMs = useCallback(() => {
    if (refreshInterval) return refreshInterval;
    if (mergedPrefs.customIntervalMs && mergedPrefs.refreshMode === 'custom') {
      return mergedPrefs.customIntervalMs;
    }
    return REFRESH_PRESETS[mergedPrefs.refreshMode];
  }, [refreshInterval, mergedPrefs.refreshMode, mergedPrefs.customIntervalMs]);

  // Initialize service
  useEffect(() => {
    serviceRef.current = getMarketDataService();

    // Register Alpaca provider if not already registered
    const registeredProviders = serviceRef.current.getRegisteredProviders();
    if (!registeredProviders.includes('alpaca')) {
      const alpacaProvider = getAlpacaProvider();
      serviceRef.current.registerProvider(alpacaProvider);
    }

    return () => {
      // Cleanup subscriptions
      if (serviceRef.current) {
        serviceRef.current.unsubscribe(symbolsRef.current);
      }
    };
  }, []);

  // Fetch quotes
  const fetchQuotes = useCallback(async (forceRefresh = false) => {
    if (!serviceRef.current || symbols.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await serviceRef.current.getQuotes({
        symbols,
        dataSource,
        forceRefresh,
      });

      // Update prices
      setPrices(response.quotes);
      setLastUpdated(new Date());

      // Check for staleness
      const now = Date.now();
      let anyStale = false;
      for (const quote of response.quotes.values()) {
        if (quote.stale || now > quote.expiresAt.getTime()) {
          anyStale = true;
          break;
        }
      }
      setIsStale(anyStale);

      // Log errors if any
      if (response.errors.size > 0) {
        console.warn('Some quotes failed to fetch:', response.errors);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [symbols, dataSource]);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    if (!serviceRef.current || !includeHistory || symbols.length === 0) return;

    const historyMap = new Map<string, PriceHistory>();

    for (const symbol of symbols) {
      try {
        const hist = await serviceRef.current.getHistory({
          symbol,
          timeframe: historyTimeframe,
          dataSource,
        });

        if (hist) {
          historyMap.set(symbol, hist);
        }
      } catch (err) {
        console.warn(`Failed to fetch history for ${symbol}:`, err);
      }
    }

    setHistory(historyMap);
  }, [symbols, includeHistory, historyTimeframe, dataSource]);

  // Handle real-time updates
  const handleQuoteUpdate = useCallback((quote: PriceQuote) => {
    setPrices(prev => {
      const next = new Map(prev);
      next.set(quote.symbol, quote);
      return next;
    });
    setLastUpdated(new Date());
  }, []);

  // Setup WebSocket subscription
  useEffect(() => {
    if (!enableWebSocket || !serviceRef.current || symbols.length === 0) {
      return;
    }

    const service = serviceRef.current;

    // Subscribe to real-time updates
    service.subscribe(symbols, handleQuoteUpdate, dataSource || 'alpaca');
    setIsConnected(true);

    // Listen for connection changes
    const handleEvent = (event: any) => {
      if (event.type === 'connection_changed') {
        setIsConnected(event.status === 'connected');
      }
    };

    service.addEventListener(handleEvent);

    return () => {
      service.unsubscribe(symbols);
      service.removeEventListener(handleEvent);
      setIsConnected(false);
    };
  }, [symbols, enableWebSocket, dataSource, handleQuoteUpdate]);

  // Setup refresh timer
  useEffect(() => {
    if (!enableRefresh) return;

    const refreshMs = getRefreshMs();

    // Clear existing timers
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    // Set next refresh time
    const updateNextRefresh = () => {
      const next = new Date(Date.now() + refreshMs);
      setNextRefresh(next);
    };

    updateNextRefresh();

    // Refresh timer
    refreshTimerRef.current = setInterval(() => {
      fetchQuotes(true);
      updateNextRefresh();
    }, refreshMs);

    // Countdown timer (updates every second if showing timer)
    if (mergedPrefs.showRefreshTimer) {
      countdownTimerRef.current = setInterval(() => {
        setSecondsUntilRefresh(prev => {
          const seconds = Math.max(0, Math.ceil((nextRefresh?.getTime() || Date.now()) - Date.now()) / 1000);
          return Math.round(seconds);
        });
      }, 1000);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [enableRefresh, getRefreshMs, fetchQuotes, mergedPrefs.showRefreshTimer, nextRefresh]);

  // Initial fetch
  useEffect(() => {
    fetchQuotes();
    if (includeHistory) {
      fetchHistory();
    }
  }, [fetchQuotes, fetchHistory, includeHistory]);

  // Update symbols ref
  useEffect(() => {
    symbolsRef.current = symbols;
  }, [symbols]);

  // Manual refresh
  const refresh = useCallback(async () => {
    await fetchQuotes(true);
    if (includeHistory) {
      await fetchHistory();
    }
  }, [fetchQuotes, fetchHistory, includeHistory]);

  // Subscribe to additional symbols
  const subscribe = useCallback((newSymbols: string[]) => {
    if (!serviceRef.current) return;
    serviceRef.current.subscribe(newSymbols, handleQuoteUpdate, dataSource || 'alpaca');
  }, [handleQuoteUpdate, dataSource]);

  // Unsubscribe from symbols
  const unsubscribe = useCallback((removeSymbols: string[]) => {
    if (!serviceRef.current) return;
    serviceRef.current.unsubscribe(removeSymbols, dataSource || 'alpaca');
  }, [dataSource]);

  return {
    prices,
    history,
    loading,
    error,
    lastUpdated,
    nextRefresh,
    secondsUntilRefresh,
    isStale,
    isConnected,
    refresh,
    subscribe,
    unsubscribe,
  };
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Get a single price quote
 */
export function usePrice(
  symbol: string,
  options?: Omit<UseMarketDataOptions, 'symbols'>
): {
  price: PriceQuote | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const { prices, loading, error, refresh } = useMarketData({
    symbols: [symbol],
    ...options,
  });

  return {
    price: prices.get(symbol) || null,
    loading,
    error,
    refresh,
  };
}

/**
 * Get price history for a symbol
 */
export function usePriceHistory(
  symbol: string,
  timeframe: Timeframe = '1d',
  options?: Omit<UseMarketDataOptions, 'symbols' | 'includeHistory' | 'historyTimeframe'>
): {
  history: PriceHistory | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const { history, loading, error, refresh } = useMarketData({
    symbols: [symbol],
    includeHistory: true,
    historyTimeframe: timeframe,
    ...options,
  });

  return {
    history: history.get(symbol) || null,
    loading,
    error,
    refresh,
  };
}
