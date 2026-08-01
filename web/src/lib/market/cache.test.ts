/**
 * Tests for the market cache (quotes + sparklines).
 *
 * DESTINATION: web/src/lib/market/cache.test.ts (next to cache.ts).
 *
 * Node environment + an explicit in-memory localStorage mock (jsdom's
 * Storage is method-less under vitest 4 / Node 25, so a stubbed global is
 * the reliable route). The engine's network layer is mocked. The cache
 * keeps module-level state, so every test re-imports a fresh module via
 * vi.resetModules() — the stubbed localStorage intentionally survives that
 * reset in the persistence tests.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
}

vi.mock('@/lib/engine/data', () => ({
  fetchLivePrice: vi.fn(),
  fetchHistoricalPrices: vi.fn(),
}));

type CacheModule = typeof import('@/lib/market/cache');
type DataModule = typeof import('@/lib/engine/data');

/**
 * Fresh module instances. vi.resetModules() also re-instantiates the mocked
 * engine module, so the mock fns must be re-grabbed alongside the cache.
 */
async function fresh(): Promise<{
  cache: CacheModule;
  live: ReturnType<typeof vi.mocked<DataModule['fetchLivePrice']>>;
  hist: ReturnType<typeof vi.mocked<DataModule['fetchHistoricalPrices']>>;
}> {
  vi.resetModules();
  const cache = await import('@/lib/market/cache');
  const data = await import('@/lib/engine/data');
  return {
    cache,
    live: vi.mocked(data.fetchLivePrice),
    hist: vi.mocked(data.fetchHistoricalPrices),
  };
}

const T0 = new Date('2026-08-01T12:00:00Z');

beforeEach(() => {
  vi.stubGlobal('localStorage', createLocalStorageMock());
  vi.useFakeTimers();
  vi.setSystemTime(T0);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('getQuote', () => {
  it('fetches once and serves from cache within the TTL', async () => {
    const { cache, live } = await fresh();
    live.mockResolvedValue(123.45);

    const first = await cache.getQuote('AAPL');
    expect(first).toEqual({ price: 123.45, at: T0.getTime() });

    vi.setSystemTime(T0.getTime() + cache.QUOTE_TTL_MS - 1);
    const second = await cache.getQuote('aapl'); // case-insensitive
    expect(second).toBe(first);
    expect(live).toHaveBeenCalledTimes(1);
    expect(live).toHaveBeenCalledWith('AAPL');
  });

  it('refetches after the 15-minute TTL expires', async () => {
    const { cache, live } = await fresh();
    live.mockResolvedValueOnce(100).mockResolvedValueOnce(110);

    await cache.getQuote('MSFT');
    vi.setSystemTime(T0.getTime() + cache.QUOTE_TTL_MS + 1);
    const refreshed = await cache.getQuote('MSFT');

    expect(refreshed.price).toBe(110);
    expect(refreshed.at).toBe(T0.getTime() + cache.QUOTE_TTL_MS + 1);
    expect(live).toHaveBeenCalledTimes(2);
  });

  it('bypasses the TTL with { force: true }', async () => {
    const { cache, live } = await fresh();
    live.mockResolvedValueOnce(100).mockResolvedValueOnce(101);

    await cache.getQuote('NVDA');
    const forced = await cache.getQuote('NVDA', { force: true });

    expect(forced.price).toBe(101);
    expect(live).toHaveBeenCalledTimes(2);
  });

  it('dedups concurrent in-flight requests for the same symbol', async () => {
    const { cache, live } = await fresh();
    let resolve!: (price: number) => void;
    live.mockReturnValue(new Promise<number>((r) => (resolve = r)));

    const p1 = cache.getQuote('TSLA');
    const p2 = cache.getQuote('TSLA');
    resolve(42);
    const [q1, q2] = await Promise.all([p1, p2]);

    expect(q1).toBe(q2);
    expect(q1.price).toBe(42);
    expect(live).toHaveBeenCalledTimes(1);
  });

  it('persists to localStorage and survives a module reload without refetching', async () => {
    const first = await fresh();
    first.live.mockResolvedValue(250);
    await first.cache.getQuote('AMZN');

    const raw = localStorage.getItem(first.cache.QUOTES_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string)).toHaveProperty('AMZN.price', 250);

    // Fresh cache module (new in-memory map) — still served from storage.
    // NOTE: vitest memoizes the vi.mock factory across resetModules, so the
    // mock fn instance survives; clear its call log before asserting.
    const second = await fresh();
    second.live.mockClear();
    const quote = await second.cache.getQuote('AMZN');
    expect(quote.price).toBe(250);
    expect(second.live).not.toHaveBeenCalled();
  });

  it('rejects on empty symbols', async () => {
    const { cache } = await fresh();
    await expect(cache.getQuote('   ')).rejects.toThrow('Empty symbol');
  });
});

describe('getQuotes', () => {
  it('dedups symbols, normalizes case, and omits failures', async () => {
    const { cache, live } = await fresh();
    live.mockImplementation((symbol: string) => {
      if (symbol === 'BAD') return Promise.reject(new Error('no data'));
      return Promise.resolve(10);
    });

    const quotes = await cache.getQuotes(['aapl', 'AAPL', 'bad', '']);

    expect(live).toHaveBeenCalledTimes(2); // AAPL once, BAD once, '' skipped
    expect(quotes.size).toBe(1);
    expect(quotes.get('AAPL')?.price).toBe(10);
    expect(quotes.has('BAD')).toBe(false);
  });
});

describe('getSparkline', () => {
  const series = { dates: ['2026-07-30', '2026-07-31'], prices: [1, 2] };

  it('fetches once and serves from localStorage within 24 h', async () => {
    const { cache, hist } = await fresh();
    hist.mockResolvedValue(series);

    const first = await cache.getSparkline('AAPL');
    expect(first).toEqual(series);

    vi.setSystemTime(T0.getTime() + cache.SPARK_TTL_MS - 1);
    const second = await cache.getSparkline('AAPL');
    expect(second).toEqual(series);
    expect(hist).toHaveBeenCalledTimes(1);
  });

  it('refetches after the 24-hour TTL expires', async () => {
    const { cache, hist } = await fresh();
    hist.mockResolvedValue(series);

    await cache.getSparkline('AAPL');
    vi.setSystemTime(T0.getTime() + cache.SPARK_TTL_MS + 1);
    await cache.getSparkline('AAPL');

    expect(hist).toHaveBeenCalledTimes(2);
  });

  it('dedups concurrent in-flight requests for the same key', async () => {
    const { cache, hist } = await fresh();
    let resolve!: (v: typeof series) => void;
    hist.mockReturnValue(new Promise((r) => (resolve = r)));

    const p1 = cache.getSparkline('AAPL');
    const p2 = cache.getSparkline('AAPL');
    resolve(series);
    await Promise.all([p1, p2]);

    expect(hist).toHaveBeenCalledTimes(1);
  });

  it('caps the store at SPARK_MAX_ENTRIES, evicting the least-recently-used', async () => {
    const { cache, hist } = await fresh();
    hist.mockResolvedValue(series);

    const total = cache.SPARK_MAX_ENTRIES + 1; // one over the cap
    for (let i = 0; i < total; i++) {
      // Distinct timestamps so LRU ordering is deterministic.
      vi.setSystemTime(T0.getTime() + i * 1000);
      await cache.getSparkline(`S${i}`);
    }

    const store = JSON.parse(
      localStorage.getItem(cache.SPARK_STORAGE_KEY) ?? '{}',
    ) as Record<string, unknown>;
    const keys = Object.keys(store);

    expect(keys.length).toBe(cache.SPARK_MAX_ENTRIES);
    expect(store['S0:30']).toBeUndefined(); // oldest evicted
    expect(store[`S${total - 1}:30`]).toBeDefined(); // newest kept
  });

  it('trims the returned series to the requested number of days', async () => {
    const { cache, hist } = await fresh();
    const long = {
      dates: Array.from({ length: 60 }, (_, i) => `d${i}`),
      prices: Array.from({ length: 60 }, (_, i) => i),
    };
    hist.mockResolvedValue(long);

    const spark = await cache.getSparkline('AAPL', 30);
    expect(spark.prices).toHaveLength(30);
    expect(spark.prices[0]).toBe(30); // most-recent 30 points kept
    expect(spark.dates).toHaveLength(30);
  });
});

describe('clearMarketCache', () => {
  it('wipes both stores and the in-memory cache', async () => {
    const { cache, live, hist } = await fresh();
    live.mockResolvedValue(1);
    hist.mockResolvedValue({ dates: ['d'], prices: [1] });

    await cache.getQuote('AAPL');
    await cache.getSparkline('AAPL');
    cache.clearMarketCache();

    expect(localStorage.getItem(cache.QUOTES_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(cache.SPARK_STORAGE_KEY)).toBeNull();

    await cache.getQuote('AAPL');
    expect(live).toHaveBeenCalledTimes(2); // memory cache was cleared too
  });
});
