export interface MarketDataEvent {
  type: 'quote' | 'trade' | 'bar';
  symbol: string;
  price: number;
  timestamp: number;
}

export interface QuoteData {
  symbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  name?: string;
}

export interface HistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

export async function getQuote(symbol: string): Promise<QuoteData | null> {
  try {
    const url = `${YAHOO_CHART_URL}/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error('[market-data] quote fetch failed:', response.status);
      return null;
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice ?? 0;
    const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    return {
      symbol: meta.symbol || symbol,
      price,
      previousClose,
      change,
      changePercent,
      volume: meta.regularMarketVolume ?? 0,
      name: meta.shortName || meta.longName || symbol,
    };
  } catch (error) {
    console.error('[market-data] error fetching quote for', symbol, error);
    return null;
  }
}

export async function getHistoricalPrices(
  symbol: string,
  range: string = '1mo',
  interval: string = '1d'
): Promise<HistoricalPrice[]> {
  try {
    const url = `${YAHOO_CHART_URL}/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result) return [];

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};

    return timestamps.map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      open: quotes.open?.[i] ?? 0,
      high: quotes.high?.[i] ?? 0,
      low: quotes.low?.[i] ?? 0,
      close: quotes.close?.[i] ?? 0,
      volume: quotes.volume?.[i] ?? 0,
    }));
  } catch (error) {
    console.error('[market-data] error fetching history for', symbol, error);
    return [];
  }
}

export async function getBatchQuotes(symbols: string[]): Promise<Map<string, QuoteData>> {
  const results = new Map<string, QuoteData>();
  // Fetch in parallel, max 5 concurrent
  const chunks: string[][] = [];
  for (let i = 0; i < symbols.length; i += 5) {
    chunks.push(symbols.slice(i, i + 5));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (symbol) => {
      const quote = await getQuote(symbol);
      if (quote) results.set(symbol, quote);
    });
    await Promise.all(promises);
  }

  return results;
}

export class MarketDataService {
  private intervalIds: Map<string, ReturnType<typeof setInterval>> = new Map();

  subscribe(symbols: string[], callback: (event: MarketDataEvent) => void): () => void {
    const pollSymbols = async () => {
      for (const symbol of symbols) {
        const quote = await getQuote(symbol);
        if (quote) {
          callback({
            type: 'quote',
            symbol: quote.symbol,
            price: quote.price,
            timestamp: Date.now(),
          });
        }
      }
    };

    // Initial fetch
    pollSymbols();

    // Poll every 30 seconds
    const id = setInterval(pollSymbols, 30000);
    const key = symbols.join(',');
    this.intervalIds.set(key, id);

    return () => {
      clearInterval(id);
      this.intervalIds.delete(key);
    };
  }

  unsubscribe(symbols: string[]): void {
    const key = symbols.join(',');
    const id = this.intervalIds.get(key);
    if (id) {
      clearInterval(id);
      this.intervalIds.delete(key);
    }
  }

  disconnect(): void {
    for (const id of this.intervalIds.values()) {
      clearInterval(id);
    }
    this.intervalIds.clear();
  }
}

let instance: MarketDataService | null = null;

export function getMarketDataService(): MarketDataService {
  if (!instance) instance = new MarketDataService();
  return instance;
}
