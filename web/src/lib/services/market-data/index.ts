import type { MarketAsset, SymbolSearchResult } from '../../../types/markets';
import { getQuote } from './service';

// Popular symbols to show as default market assets
const DEFAULT_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM',
  'V', 'JNJ', 'WMT', 'PG', 'UNH', 'HD', 'DIS',
];

export async function getMarketAssets(): Promise<MarketAsset[]> {
  const assets: MarketAsset[] = [];

  const promises = DEFAULT_SYMBOLS.map(async (symbol) => {
    const quote = await getQuote(symbol);
    if (quote) {
      assets.push({
        symbol: quote.symbol,
        name: quote.name || symbol,
        category: 'stocks',
        price: quote.price,
        previousClose: quote.previousClose,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        marketCap: quote.marketCap,
        updatedAt: new Date(),
      });
    }
  });

  await Promise.all(promises);
  return assets.sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export async function getTopPerformers(): Promise<MarketAsset[]> {
  const assets = await getMarketAssets();
  return assets
    .filter((a) => a.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 5);
}

export async function getLowestPerformers(): Promise<MarketAsset[]> {
  const assets = await getMarketAssets();
  return assets
    .filter((a) => a.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 5);
}

export async function searchAssets(queryStr: string): Promise<SymbolSearchResult[]> {
  if (!queryStr || queryStr.length < 1) return [];

  const upper = queryStr.toUpperCase();
  // Try direct quote lookup
  const quote = await getQuote(upper);
  if (quote) {
    return [{
      symbol: quote.symbol,
      name: quote.name || quote.symbol,
      category: 'stocks',
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      source: 'search',
      isInWatchlist: false,
      isOwned: false,
    }];
  }

  return [];
}

export function calculateStrategySignals(assets: MarketAsset[]): MarketAsset[] {
  // Pass-through for now — strategy signals will be enriched in Phase 3 features
  return assets;
}
