/**
 * TradePilot Engine — Market Data (Client-Side)
 *
 * Fetches stock data using Yahoo Finance via a CORS proxy chain
 * (spec §3: allorigins → corsproxy.io fallback, rate-limit friendliness).
 * No backend required — everything runs in the browser.
 *
 * NOTE: network lives HERE, outside the pure engine modules. The simulator
 * never fetches; it receives a pre-fetched priceMap.
 */

import type { PriceData, SymbolInfo } from './types';

/** Ordered proxy chain — first success wins. */
const PROXIES: ReadonlyArray<(target: string) => string> = [
  (t) => `https://api.allorigins.win/raw?url=${encodeURIComponent(t)}`,
  (t) => `https://corsproxy.io/?url=${encodeURIComponent(t)}`,
];

/** Minimum delay between Yahoo requests (rate-limit friendliness). */
const REQUEST_SPACING_MS = 150;
let lastRequestAt = 0;

async function politeDelay(): Promise<void> {
  const now = Date.now();
  const wait = lastRequestAt + REQUEST_SPACING_MS - now;
  lastRequestAt = Math.max(now, lastRequestAt + REQUEST_SPACING_MS);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

/** Fetch a Yahoo URL through the proxy chain; throws after the last proxy fails. */
async function fetchViaProxies(target: string): Promise<Response> {
  let lastError: Error | null = null;
  for (const proxy of PROXIES) {
    await politeDelay();
    try {
      const res = await fetch(proxy(target));
      if (res.ok) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastError ?? new Error('All proxies failed');
}

function yahooChartUrl(symbol: string, period1: number, period2: number, interval = '1d'): string {
  const base = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`;
  return `${base}?period1=${period1}&period2=${period2}&interval=${interval}`;
}

/** Parse a date string (YYYY-MM-DD) to Unix timestamp (seconds). */
function toUnix(dateStr: string): number {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

/**
 * Fetch historical closing prices for a single symbol.
 */
export async function fetchHistoricalPrices(
  symbol: string,
  start: string,
  end: string,
): Promise<PriceData> {
  const res = await fetchViaProxies(yahooChartUrl(symbol, toUnix(start), toUnix(end)));

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) {
    throw new Error(`No data returned for ${symbol}`);
  }

  const timestamps: number[] = result.timestamp ?? [];
  const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];

  const dates: string[] = [];
  const prices: number[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    if (closes[i] != null && !isNaN(closes[i])) {
      const d = new Date(timestamps[i] * 1000);
      dates.push(d.toISOString().split('T')[0]);
      prices.push(closes[i]);
    }
  }

  if (prices.length === 0) {
    throw new Error(`No valid price data for ${symbol}`);
  }

  return { dates, prices };
}

/**
 * Fetch the latest price for a symbol.
 */
export async function fetchLivePrice(symbol: string): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  const fiveDaysAgo = now - 5 * 86400;
  const res = await fetchViaProxies(yahooChartUrl(symbol, fiveDaysAgo, now));

  const json = await res.json();
  const closes: number[] = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];

  for (let i = closes.length - 1; i >= 0; i--) {
    if (closes[i] != null && !isNaN(closes[i])) return closes[i];
  }

  throw new Error(`No live price available for ${symbol}`);
}

/**
 * Fetch historical prices for multiple symbols in parallel.
 * Symbols that fail are omitted from the returned Map (caller decides
 * whether missing data is fatal).
 */
export async function fetchMultiplePrices(
  symbols: string[],
  start: string,
  end: string,
): Promise<Map<string, PriceData>> {
  const results = await Promise.allSettled(
    symbols.map((s) => fetchHistoricalPrices(s, start, end)),
  );

  const map = new Map<string, PriceData>();
  for (let i = 0; i < symbols.length; i++) {
    const r = results[i];
    if (r.status === 'fulfilled') {
      map.set(symbols[i], r.value);
    }
  }

  return map;
}

/**
 * Search for symbols matching a query using Yahoo Finance autocomplete.
 */
export async function searchSymbols(query: string): Promise<SymbolInfo[]> {
  if (!query || query.length < 1) return [];

  const base = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;

  let res: Response;
  try {
    res = await fetchViaProxies(base);
  } catch {
    return [];
  }

  const json = await res.json();
  const quotes: unknown[] = json?.quotes ?? [];

  return quotes.map((raw) => {
    const q = raw as Record<string, unknown>;
    return {
      symbol: typeof q.symbol === 'string' ? q.symbol : '',
      name:
        typeof q.shortname === 'string'
          ? q.shortname
          : typeof q.longname === 'string'
            ? q.longname
            : '',
      exchange: typeof q.exchange === 'string' ? q.exchange : '',
      type: typeof q.quoteType === 'string' ? q.quoteType : '',
    };
  });
}

/**
 * Fetch the current US risk-free rate (13-week T-Bill yield via ^IRX).
 * Returns annualized rate as a decimal (e.g. 0.045 for 4.5%).
 */
export async function fetchRiskFreeRate(): Promise<number> {
  try {
    const price = await fetchLivePrice('^IRX');
    // ^IRX reports yield in percentage points (e.g. 4.5 = 4.5%)
    return price / 100;
  } catch {
    // Fallback to a reasonable default
    return 0.04;
  }
}
