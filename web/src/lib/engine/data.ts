/**
 * TradePilot Engine — Market Data (Client-Side)
 *
 * Fetches stock data using Yahoo Finance via a CORS proxy.
 * No backend required — everything runs in the browser.
 */

import type { PriceData, SymbolInfo } from './types';

const PROXY = 'https://api.allorigins.win/raw?url=';

/**
 * Build a proxied Yahoo Finance chart URL.
 */
function yahooChartUrl(
  symbol: string,
  period1: number,
  period2: number,
  interval = '1d',
): string {
  const base = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`;
  const params = `?period1=${period1}&period2=${period2}&interval=${interval}`;
  return PROXY + encodeURIComponent(base + params);
}

/**
 * Parse a date string (YYYY-MM-DD) to Unix timestamp (seconds).
 */
function toUnix(dateStr: string): number {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

/**
 * Fetch historical closing prices for a single symbol.
 *
 * @param symbol Ticker symbol (e.g. "AAPL").
 * @param start Start date ISO string.
 * @param end End date ISO string.
 * @returns PriceData with dates and closing prices.
 */
export async function fetchHistoricalPrices(
  symbol: string,
  start: string,
  end: string,
): Promise<PriceData> {
  const url = yahooChartUrl(symbol, toUnix(start), toUnix(end));
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch ${symbol}: HTTP ${res.status}`);
  }

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) {
    throw new Error(`No data returned for ${symbol}`);
  }

  const timestamps: number[] = result.timestamp ?? [];
  const closes: number[] =
    result.indicators?.quote?.[0]?.close ?? [];

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
  const url = yahooChartUrl(symbol, fiveDaysAgo, now);
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch live price for ${symbol}`);
  }

  const json = await res.json();
  const closes: number[] =
    json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];

  // Last valid close
  for (let i = closes.length - 1; i >= 0; i--) {
    if (closes[i] != null && !isNaN(closes[i])) return closes[i];
  }

  throw new Error(`No live price available for ${symbol}`);
}

/**
 * Fetch historical prices for multiple symbols in parallel.
 * Returns a Map where each key is a symbol.
 */
export async function fetchMultiplePrices(
  symbols: string[],
  start: string,
  end: string,
): Promise<Map<string, PriceData>> {
  const results = await Promise.allSettled(
    symbols.map(s => fetchHistoricalPrices(s, start, end)),
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
  const url = PROXY + encodeURIComponent(base);

  const res = await fetch(url);
  if (!res.ok) return [];

  const json = await res.json();
  const quotes: any[] = json?.quotes ?? [];

  return quotes.map((q: any) => ({
    symbol: q.symbol ?? '',
    name: q.shortname ?? q.longname ?? '',
    exchange: q.exchange ?? '',
    type: q.quoteType ?? '',
  }));
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
