/**
 * Market cache — quote + sparkline caching for the dashboard/market islands.
 *
 * DESTINATION: web/src/lib/market/cache.ts (import as '@/lib/market/cache').
 *
 * Sits on top of the engine's network layer (`@/lib/engine/data`, which owns
 * the CORS-proxy chain and polite request spacing) and adds:
 *
 *   - in-memory quote cache with a 15-minute TTL
 *   - localStorage persistence ('tp.quotes.v1') so reloads stay warm
 *   - in-flight dedup: N concurrent `getQuote('AAPL')` calls → one fetch
 *   - `getQuotes(symbols)` batching — concurrency throttling is inherited
 *     from the engine module's politeDelay(), which serializes/spaces all
 *     Yahoo requests process-wide, so we simply fan out here
 *   - 30-day sparkline series cached in localStorage ('tp.spark.v1') with a
 *     24-hour TTL and a ~50-entry LRU cap
 *
 * Deliberately dependency-light: no IndexedDB, no TanStack Query. For heavier
 * datasets (full historical price maps, backtest inputs) the per-island
 * TanStack Query + idb-keyval persister (`@/lib/queryClient`) remains the
 * right tool — this module only covers small, hot dashboard data.
 *
 * SSR-safe: every localStorage access is guarded; on the server the cache
 * degrades to in-memory only (and islands only call this post-hydration).
 */

import { fetchHistoricalPrices, fetchLivePrice } from '@/lib/engine/data';

export interface Quote {
  /** Last close/live price in the instrument's quote currency (USD for US listings). */
  price: number;
  /** Epoch ms when the quote was fetched. */
  at: number;
}

export interface SparklineSeries {
  dates: string[];
  prices: number[];
}

export interface QuoteOptions {
  /** Bypass the TTL and refetch (used by explicit Refresh buttons). */
  force?: boolean;
}

export const QUOTES_STORAGE_KEY = 'tp.quotes.v1';
export const SPARK_STORAGE_KEY = 'tp.spark.v1';
export const QUOTE_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const SPARK_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const SPARK_MAX_ENTRIES = 50; // LRU cap for cached sparklines

interface SparkEntry extends SparklineSeries {
  /** Epoch ms when fetched (TTL anchor). */
  at: number;
  /** Epoch ms when last read (LRU anchor). */
  used: number;
}

type PersistedQuotes = Record<string, Quote | undefined>;
type PersistedSparks = Record<string, SparkEntry | undefined>;

// ---------------------------------------------------------------------------
// storage helpers (never throw — quota errors and SSR degrade gracefully)
// ---------------------------------------------------------------------------

function storageAvailable(): boolean {
  return typeof localStorage !== 'undefined';
}

function readStore<T>(key: string): Record<string, T | undefined> {
  if (!storageAvailable()) return {};
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, T | undefined>;
    }
    return {};
  } catch {
    return {};
  }
}

function writeStore(key: string, store: Record<string, unknown>): void {
  if (!storageAvailable()) return;
  try {
    localStorage.setItem(key, JSON.stringify(store));
  } catch {
    // Quota exceeded / private mode — cache stays in-memory only.
  }
}

function normalize(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function isValidQuote(v: unknown): v is Quote {
  if (!v || typeof v !== 'object') return false;
  const q = v as Record<string, unknown>;
  return typeof q.price === 'number' && Number.isFinite(q.price) && typeof q.at === 'number';
}

// ---------------------------------------------------------------------------
// quotes
// ---------------------------------------------------------------------------

const memQuotes = new Map<string, Quote>();
const quoteInflight = new Map<string, Promise<Quote>>();
let quotesHydrated = false;

function hydrateQuotes(): void {
  if (quotesHydrated) return;
  quotesHydrated = true;
  const persisted = readStore<Quote>(QUOTES_STORAGE_KEY);
  for (const [sym, quote] of Object.entries(persisted)) {
    if (isValidQuote(quote)) memQuotes.set(sym, quote);
  }
}

function persistQuotes(): void {
  const out: PersistedQuotes = {};
  for (const [sym, quote] of memQuotes) out[sym] = quote;
  writeStore(QUOTES_STORAGE_KEY, out);
}

/**
 * Latest price for a symbol. Served from cache when younger than 15 minutes;
 * concurrent calls for the same symbol share one network request.
 */
export function getQuote(symbol: string, opts?: QuoteOptions): Promise<Quote> {
  const sym = normalize(symbol);
  if (!sym) return Promise.reject(new Error('Empty symbol'));
  hydrateQuotes();

  if (!opts?.force) {
    const hit = memQuotes.get(sym);
    if (hit && Date.now() - hit.at < QUOTE_TTL_MS) return Promise.resolve(hit);
  }

  const pending = quoteInflight.get(sym);
  if (pending) return pending;

  const request = (async () => {
    try {
      const price = await fetchLivePrice(sym);
      const quote: Quote = { price, at: Date.now() };
      memQuotes.set(sym, quote);
      persistQuotes();
      return quote;
    } finally {
      quoteInflight.delete(sym);
    }
  })();

  quoteInflight.set(sym, request);
  return request;
}

/**
 * Batch quotes. Fans out through `getQuote` (so dedup + TTL apply per symbol);
 * the engine's politeDelay() spaces the underlying network requests, so this
 * is rate-limit friendly without extra throttling here. Symbols that fail are
 * omitted from the returned Map — callers decide how to render gaps.
 */
export async function getQuotes(
  symbols: readonly string[],
  opts?: QuoteOptions,
): Promise<Map<string, Quote>> {
  const unique = [...new Set(symbols.map(normalize).filter(Boolean))];
  const settled = await Promise.allSettled(unique.map((s) => getQuote(s, opts)));

  const out = new Map<string, Quote>();
  for (let i = 0; i < unique.length; i++) {
    const sym = unique[i];
    const result = settled[i];
    if (sym && result && result.status === 'fulfilled') out.set(sym, result.value);
  }
  return out;
}

// ---------------------------------------------------------------------------
// sparklines
// ---------------------------------------------------------------------------

const sparkInflight = new Map<string, Promise<SparklineSeries>>();

function isValidSparkEntry(v: unknown): v is SparkEntry {
  if (!v || typeof v !== 'object') return false;
  const e = v as Record<string, unknown>;
  return (
    Array.isArray(e.dates) &&
    Array.isArray(e.prices) &&
    typeof e.at === 'number' &&
    typeof e.used === 'number'
  );
}

/** Drop the least-recently-used entries until the store fits the cap. */
function evictSparkLru(store: PersistedSparks): void {
  const keys = Object.keys(store).filter((k) => isValidSparkEntry(store[k]));
  if (keys.length <= SPARK_MAX_ENTRIES) return;
  keys.sort((a, b) => (store[a]?.used ?? 0) - (store[b]?.used ?? 0));
  const excess = keys.length - SPARK_MAX_ENTRIES;
  for (let i = 0; i < excess; i++) {
    const key = keys[i];
    if (key !== undefined) delete store[key];
  }
}

/**
 * Closing-price series for the trailing `days` days (default 30), for tiny
 * trend charts. Cached in localStorage for 24 h, capped at ~50 entries (LRU
 * on last read).
 */
export function getSparkline(symbol: string, days = 30): Promise<SparklineSeries> {
  const sym = normalize(symbol);
  if (!sym) return Promise.reject(new Error('Empty symbol'));
  const cacheKey = `${sym}:${days}`;

  const store = readStore<SparkEntry>(SPARK_STORAGE_KEY);
  const hit = store[cacheKey];
  const now = Date.now();
  if (isValidSparkEntry(hit) && now - hit.at < SPARK_TTL_MS) {
    hit.used = now; // touch for LRU
    writeStore(SPARK_STORAGE_KEY, store);
    return Promise.resolve({ dates: hit.dates, prices: hit.prices });
  }

  const pending = sparkInflight.get(cacheKey);
  if (pending) return pending;

  const request = (async () => {
    try {
      const end = new Date(now);
      // Pad the window: markets are closed on weekends/holidays, so asking for
      // `days` calendar days straight would under-deliver trading days.
      const start = new Date(now - Math.ceil(days * 1.5 + 4) * 86_400_000);
      const iso = (d: Date) => d.toISOString().slice(0, 10);
      const series = await fetchHistoricalPrices(sym, iso(start), iso(end));

      // Keep at most `days` most-recent points.
      const dates = series.dates.slice(-days);
      const prices = series.prices.slice(-days);

      const fresh = readStore<SparkEntry>(SPARK_STORAGE_KEY);
      const t = Date.now();
      fresh[cacheKey] = { dates, prices, at: t, used: t };
      evictSparkLru(fresh);
      writeStore(SPARK_STORAGE_KEY, fresh);

      return { dates, prices };
    } finally {
      sparkInflight.delete(cacheKey);
    }
  })();

  sparkInflight.set(cacheKey, request);
  return request;
}

// ---------------------------------------------------------------------------
// maintenance
// ---------------------------------------------------------------------------

/** Wipe both caches (dev tooling / sign-out hygiene). */
export function clearMarketCache(): void {
  memQuotes.clear();
  quoteInflight.clear();
  sparkInflight.clear();
  quotesHydrated = false;
  if (!storageAvailable()) return;
  try {
    localStorage.removeItem(QUOTES_STORAGE_KEY);
    localStorage.removeItem(SPARK_STORAGE_KEY);
  } catch {
    // ignore
  }
}
