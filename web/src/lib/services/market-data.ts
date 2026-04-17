/**
 * Market Data Service
 *
 * Handles market data fetching and caching.
 * Currently uses enhanced mock data - can be replaced with real API later.
 */

import type {
  MarketAsset,
  AssetCategory,
  PerformancePeriod,
  StrategySignal,
  StrategySignalType,
} from '../../types/markets';
import { getUniversesForSymbol } from '../../data/universes';

/**
 * Enhanced mock market data with multi-period performance
 */
const mockMarketData: MarketAsset[] = [
  // Stocks - Tech Giants
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    category: 'stocks',
    price: 495.22,
    previousClose: 482.77,
    change: 12.45,
    changePercent: 2.58,
    weekChange: 35.50,
    weekChangePercent: 7.72,
    monthChange: 89.22,
    monthChangePercent: 21.98,
    volume: 45_000_000,
    avgVolume: 42_000_000,
    marketCap: 1_220_000_000_000,
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc',
    category: 'stocks',
    price: 248.50,
    previousClose: 253.80,
    change: -5.30,
    changePercent: -2.09,
    weekChange: -18.20,
    weekChangePercent: -6.82,
    monthChange: 12.50,
    monthChangePercent: 5.30,
    volume: 120_000_000,
    avgVolume: 110_000_000,
    marketCap: 790_000_000_000,
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc',
    category: 'stocks',
    price: 185.92,
    previousClose: 184.64,
    change: 1.28,
    changePercent: 0.69,
    weekChange: 4.20,
    weekChangePercent: 2.31,
    monthChange: -2.08,
    monthChangePercent: -1.11,
    volume: 52_000_000,
    avgVolume: 58_000_000,
    marketCap: 2_890_000_000_000,
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp',
    category: 'stocks',
    price: 378.91,
    previousClose: 374.35,
    change: 4.56,
    changePercent: 1.22,
    weekChange: 12.80,
    weekChangePercent: 3.50,
    monthChange: 28.91,
    monthChangePercent: 8.26,
    volume: 22_000_000,
    avgVolume: 25_000_000,
    marketCap: 2_810_000_000_000,
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc',
    category: 'stocks',
    price: 142.56,
    previousClose: 141.67,
    change: 0.89,
    changePercent: 0.63,
    weekChange: 5.60,
    weekChangePercent: 4.09,
    monthChange: 10.56,
    monthChangePercent: 8.00,
    volume: 28_000_000,
    avgVolume: 30_000_000,
    marketCap: 1_780_000_000_000,
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc',
    category: 'stocks',
    price: 153.42,
    previousClose: 151.08,
    change: 2.34,
    changePercent: 1.55,
    weekChange: 8.42,
    weekChangePercent: 5.81,
    monthChange: 15.42,
    monthChangePercent: 11.18,
    volume: 55_000_000,
    avgVolume: 50_000_000,
    marketCap: 1_590_000_000_000,
  },
  {
    symbol: 'META',
    name: 'Meta Platforms',
    category: 'stocks',
    price: 356.78,
    previousClose: 359.99,
    change: -3.21,
    changePercent: -0.89,
    weekChange: 15.78,
    weekChangePercent: 4.63,
    monthChange: 56.78,
    monthChangePercent: 18.93,
    volume: 15_000_000,
    avgVolume: 18_000_000,
    marketCap: 915_000_000_000,
  },
  {
    symbol: 'AMD',
    name: 'AMD Inc',
    category: 'stocks',
    price: 124.89,
    previousClose: 118.11,
    change: 6.78,
    changePercent: 5.74,
    weekChange: 18.89,
    weekChangePercent: 17.82,
    monthChange: 34.89,
    monthChangePercent: 38.76,
    volume: 72_000_000,
    avgVolume: 65_000_000,
    marketCap: 202_000_000_000,
  },
  // More stocks
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase',
    category: 'stocks',
    price: 172.34,
    previousClose: 170.50,
    change: 1.84,
    changePercent: 1.08,
    weekChange: 5.34,
    weekChangePercent: 3.20,
    monthChange: 12.34,
    monthChangePercent: 7.71,
    volume: 12_000_000,
    avgVolume: 11_000_000,
    marketCap: 498_000_000_000,
  },
  {
    symbol: 'V',
    name: 'Visa Inc',
    category: 'stocks',
    price: 267.89,
    previousClose: 265.20,
    change: 2.69,
    changePercent: 1.01,
    weekChange: 8.89,
    weekChangePercent: 3.43,
    monthChange: 17.89,
    monthChangePercent: 7.16,
    volume: 8_000_000,
    avgVolume: 7_500_000,
    marketCap: 545_000_000_000,
  },
  {
    symbol: 'JNJ',
    name: 'Johnson & Johnson',
    category: 'stocks',
    price: 158.42,
    previousClose: 159.10,
    change: -0.68,
    changePercent: -0.43,
    weekChange: -2.58,
    weekChangePercent: -1.60,
    monthChange: -5.58,
    monthChangePercent: -3.40,
    volume: 6_500_000,
    avgVolume: 7_000_000,
    marketCap: 382_000_000_000,
  },
  {
    symbol: 'UNH',
    name: 'UnitedHealth Group',
    category: 'stocks',
    price: 527.33,
    previousClose: 530.00,
    change: -2.67,
    changePercent: -0.50,
    weekChange: -12.67,
    weekChangePercent: -2.35,
    monthChange: 7.33,
    monthChangePercent: 1.41,
    volume: 3_200_000,
    avgVolume: 3_500_000,
    marketCap: 486_000_000_000,
  },

  // ETFs
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF',
    category: 'etfs',
    price: 478.32,
    previousClose: 474.11,
    change: 4.21,
    changePercent: 0.89,
    weekChange: 12.32,
    weekChangePercent: 2.64,
    monthChange: 28.32,
    monthChangePercent: 6.29,
    volume: 85_000_000,
    avgVolume: 80_000_000,
    marketCap: 450_000_000_000,
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    category: 'etfs',
    price: 412.56,
    previousClose: 414.90,
    change: -2.34,
    changePercent: -0.56,
    weekChange: 15.56,
    weekChangePercent: 3.92,
    monthChange: 42.56,
    monthChangePercent: 11.50,
    volume: 52_000_000,
    avgVolume: 48_000_000,
    marketCap: 200_000_000_000,
  },
  {
    symbol: 'VTI',
    name: 'Vanguard Total Stock Market',
    category: 'etfs',
    price: 252.34,
    previousClose: 250.80,
    change: 1.54,
    changePercent: 0.61,
    weekChange: 6.34,
    weekChangePercent: 2.58,
    monthChange: 15.34,
    monthChangePercent: 6.47,
    volume: 4_500_000,
    avgVolume: 4_200_000,
    marketCap: 350_000_000_000,
  },
  {
    symbol: 'IWM',
    name: 'iShares Russell 2000',
    category: 'etfs',
    price: 198.45,
    previousClose: 195.20,
    change: 3.25,
    changePercent: 1.67,
    weekChange: 10.45,
    weekChangePercent: 5.56,
    monthChange: 18.45,
    monthChangePercent: 10.25,
    volume: 32_000_000,
    avgVolume: 28_000_000,
    marketCap: 62_000_000_000,
  },
  {
    symbol: 'DIA',
    name: 'SPDR Dow Jones Industrial',
    category: 'etfs',
    price: 385.67,
    previousClose: 382.90,
    change: 2.77,
    changePercent: 0.72,
    weekChange: 8.67,
    weekChangePercent: 2.30,
    monthChange: 15.67,
    monthChangePercent: 4.24,
    volume: 3_800_000,
    avgVolume: 3_500_000,
    marketCap: 32_000_000_000,
  },
  {
    symbol: 'ARKK',
    name: 'ARK Innovation ETF',
    category: 'etfs',
    price: 48.92,
    previousClose: 47.10,
    change: 1.82,
    changePercent: 3.86,
    weekChange: 5.92,
    weekChangePercent: 13.77,
    monthChange: 8.92,
    monthChangePercent: 22.30,
    volume: 28_000_000,
    avgVolume: 25_000_000,
    marketCap: 8_000_000_000,
  },

  // Bonds
  {
    symbol: 'TLT',
    name: 'iShares 20+ Year Treasury',
    category: 'bonds',
    price: 92.45,
    previousClose: 93.10,
    change: -0.65,
    changePercent: -0.70,
    weekChange: -2.55,
    weekChangePercent: -2.68,
    monthChange: -5.55,
    monthChangePercent: -5.66,
    volume: 22_000_000,
    avgVolume: 20_000_000,
  },
  {
    symbol: 'BND',
    name: 'Vanguard Total Bond Market',
    category: 'bonds',
    price: 72.15,
    previousClose: 72.35,
    change: -0.20,
    changePercent: -0.28,
    weekChange: -0.85,
    weekChangePercent: -1.16,
    monthChange: -1.85,
    monthChangePercent: -2.50,
    volume: 8_500_000,
    avgVolume: 8_000_000,
  },
  {
    symbol: 'LQD',
    name: 'iShares Investment Grade Corp',
    category: 'bonds',
    price: 108.23,
    previousClose: 108.55,
    change: -0.32,
    changePercent: -0.29,
    weekChange: -1.23,
    weekChangePercent: -1.12,
    monthChange: -2.77,
    monthChangePercent: -2.50,
    volume: 12_000_000,
    avgVolume: 11_000_000,
  },
  {
    symbol: 'HYG',
    name: 'iShares High Yield Corp',
    category: 'bonds',
    price: 76.89,
    previousClose: 76.50,
    change: 0.39,
    changePercent: 0.51,
    weekChange: 1.09,
    weekChangePercent: 1.44,
    monthChange: 2.89,
    monthChangePercent: 3.90,
    volume: 18_000_000,
    avgVolume: 16_000_000,
  },

  // Fixed Income
  {
    symbol: 'SGOV',
    name: 'iShares 0-3 Month Treasury',
    category: 'fixed-income',
    price: 100.12,
    previousClose: 100.10,
    change: 0.02,
    changePercent: 0.02,
    weekChange: 0.08,
    weekChangePercent: 0.08,
    monthChange: 0.35,
    monthChangePercent: 0.35,
    volume: 5_000_000,
    avgVolume: 4_800_000,
  },
  {
    symbol: 'SHY',
    name: 'iShares 1-3 Year Treasury',
    category: 'fixed-income',
    price: 81.45,
    previousClose: 81.42,
    change: 0.03,
    changePercent: 0.04,
    weekChange: 0.15,
    weekChangePercent: 0.18,
    monthChange: 0.45,
    monthChangePercent: 0.56,
    volume: 4_200_000,
    avgVolume: 4_000_000,
  },
  {
    symbol: 'MINT',
    name: 'PIMCO Enhanced Short Maturity',
    category: 'fixed-income',
    price: 100.89,
    previousClose: 100.85,
    change: 0.04,
    changePercent: 0.04,
    weekChange: 0.14,
    weekChangePercent: 0.14,
    monthChange: 0.39,
    monthChangePercent: 0.39,
    volume: 1_800_000,
    avgVolume: 1_600_000,
  },

  // Commodities
  {
    symbol: 'GLD',
    name: 'SPDR Gold Shares',
    category: 'commodities',
    price: 189.45,
    previousClose: 188.20,
    change: 1.25,
    changePercent: 0.66,
    weekChange: 4.45,
    weekChangePercent: 2.40,
    monthChange: 9.45,
    monthChangePercent: 5.25,
    volume: 8_500_000,
    avgVolume: 8_000_000,
  },
  {
    symbol: 'SLV',
    name: 'iShares Silver Trust',
    category: 'commodities',
    price: 22.34,
    previousClose: 21.90,
    change: 0.44,
    changePercent: 2.01,
    weekChange: 1.34,
    weekChangePercent: 6.38,
    monthChange: 2.34,
    monthChangePercent: 11.70,
    volume: 25_000_000,
    avgVolume: 22_000_000,
  },
  {
    symbol: 'USO',
    name: 'United States Oil Fund',
    category: 'commodities',
    price: 72.56,
    previousClose: 73.80,
    change: -1.24,
    changePercent: -1.68,
    weekChange: -3.44,
    weekChangePercent: -4.53,
    monthChange: 2.56,
    monthChangePercent: 3.66,
    volume: 4_200_000,
    avgVolume: 4_000_000,
  },
  {
    symbol: 'UNG',
    name: 'United States Natural Gas',
    category: 'commodities',
    price: 5.89,
    previousClose: 6.12,
    change: -0.23,
    changePercent: -3.76,
    weekChange: -0.89,
    weekChangePercent: -13.13,
    monthChange: -1.11,
    monthChangePercent: -15.86,
    volume: 12_000_000,
    avgVolume: 10_000_000,
  },

  // Crypto
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    category: 'crypto',
    price: 43567.89,
    previousClose: 42250.00,
    change: 1317.89,
    changePercent: 3.12,
    weekChange: 5567.89,
    weekChangePercent: 14.65,
    monthChange: 8567.89,
    monthChangePercent: 24.48,
    volume: 28_000_000_000,
    avgVolume: 25_000_000_000,
    marketCap: 854_000_000_000,
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    category: 'crypto',
    price: 2345.67,
    previousClose: 2280.00,
    change: 65.67,
    changePercent: 2.88,
    weekChange: 245.67,
    weekChangePercent: 11.70,
    monthChange: 445.67,
    monthChangePercent: 23.45,
    volume: 15_000_000_000,
    avgVolume: 14_000_000_000,
    marketCap: 282_000_000_000,
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    category: 'crypto',
    price: 98.45,
    previousClose: 92.30,
    change: 6.15,
    changePercent: 6.66,
    weekChange: 18.45,
    weekChangePercent: 23.06,
    monthChange: 38.45,
    monthChangePercent: 64.08,
    volume: 3_500_000_000,
    avgVolume: 3_000_000_000,
    marketCap: 42_000_000_000,
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    category: 'crypto',
    price: 0.52,
    previousClose: 0.50,
    change: 0.02,
    changePercent: 4.00,
    weekChange: 0.07,
    weekChangePercent: 15.56,
    monthChange: 0.12,
    monthChangePercent: 30.00,
    volume: 650_000_000,
    avgVolume: 580_000_000,
    marketCap: 18_500_000_000,
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    category: 'crypto',
    price: 35.78,
    previousClose: 34.20,
    change: 1.58,
    changePercent: 4.62,
    weekChange: 7.78,
    weekChangePercent: 27.79,
    monthChange: 15.78,
    monthChangePercent: 78.90,
    volume: 890_000_000,
    avgVolume: 750_000_000,
    marketCap: 13_200_000_000,
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    category: 'crypto',
    price: 0.082,
    previousClose: 0.079,
    change: 0.003,
    changePercent: 3.80,
    weekChange: 0.012,
    weekChangePercent: 17.14,
    monthChange: 0.022,
    monthChangePercent: 36.67,
    volume: 1_200_000_000,
    avgVolume: 1_000_000_000,
    marketCap: 11_700_000_000,
  },
];

/**
 * Get all market assets
 */
export async function getMarketAssets(category?: AssetCategory): Promise<MarketAsset[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  if (category) {
    return mockMarketData.filter(asset => asset.category === category);
  }
  return [...mockMarketData];
}

/**
 * Get top performers by period
 */
export async function getTopPerformers(
  period: PerformancePeriod,
  limit: number = 5
): Promise<MarketAsset[]> {
  const assets = await getMarketAssets();

  const sorted = [...assets].sort((a, b) => {
    const aChange = getChangeByPeriod(a, period);
    const bChange = getChangeByPeriod(b, period);
    return bChange - aChange;
  });

  return sorted.slice(0, limit);
}

/**
 * Get lowest performers (potential opportunities)
 */
export async function getLowestPerformers(
  period: PerformancePeriod,
  limit: number = 5
): Promise<MarketAsset[]> {
  const assets = await getMarketAssets();

  const sorted = [...assets].sort((a, b) => {
    const aChange = getChangeByPeriod(a, period);
    const bChange = getChangeByPeriod(b, period);
    return aChange - bChange;
  });

  return sorted.slice(0, limit);
}

/**
 * Get asset by symbol
 */
export async function getAssetBySymbol(symbol: string): Promise<MarketAsset | null> {
  const assets = await getMarketAssets();
  return assets.find(a => a.symbol.toUpperCase() === symbol.toUpperCase()) || null;
}

/**
 * Get multiple assets by symbols
 */
export async function getAssetsBySymbols(symbols: string[]): Promise<MarketAsset[]> {
  const assets = await getMarketAssets();
  const upperSymbols = symbols.map(s => s.toUpperCase());
  return assets.filter(a => upperSymbols.includes(a.symbol.toUpperCase()));
}

/**
 * Search assets by query
 */
export async function searchAssets(query: string, category?: AssetCategory): Promise<MarketAsset[]> {
  const assets = await getMarketAssets(category);
  const lowerQuery = query.toLowerCase();

  return assets.filter(
    asset =>
      asset.symbol.toLowerCase().includes(lowerQuery) ||
      asset.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Calculate strategy signals for an asset
 */
export function calculateStrategySignals(
  asset: MarketAsset,
  strategyTypes: StrategySignalType[]
): StrategySignal[] {
  const signals: StrategySignal[] = [];

  for (const type of strategyTypes) {
    signals.push(calculateSignalForType(asset, type));
  }

  return signals;
}

/**
 * Get assets with strategy context
 */
export async function getAssetsWithContext(
  watchlistSymbols: string[],
  ownedSymbols: string[],
  strategyTypes?: StrategySignalType[]
) {
  const assets = await getMarketAssets();
  const watchlistSet = new Set(watchlistSymbols.map(s => s.toUpperCase()));
  const ownedSet = new Set(ownedSymbols.map(s => s.toUpperCase()));

  return assets.map(asset => ({
    ...asset,
    isInWatchlist: watchlistSet.has(asset.symbol.toUpperCase()),
    isOwned: ownedSet.has(asset.symbol.toUpperCase()),
    inUniverses: getUniversesForSymbol(asset.symbol),
    strategySignals: strategyTypes
      ? calculateStrategySignals(asset, strategyTypes)
      : undefined,
  }));
}

// Helper functions

function getChangeByPeriod(asset: MarketAsset, period: PerformancePeriod): number {
  switch (period) {
    case 'day':
      return asset.changePercent;
    case 'week':
      return asset.weekChangePercent ?? asset.changePercent;
    case 'month':
      return asset.monthChangePercent ?? asset.changePercent;
    default:
      return asset.changePercent;
  }
}

function calculateSignalForType(asset: MarketAsset, type: StrategySignalType): StrategySignal {
  // Simplified signal calculations for demo purposes
  // In production, these would use actual historical data and proper algorithms

  switch (type) {
    case 'momentum': {
      const monthChange = asset.monthChangePercent ?? 0;
      const score = Math.min(100, Math.max(0, 50 + monthChange * 2));
      return {
        type: 'momentum',
        score,
        signal: getSignalFromScore(score),
        details: {
          momentumScore: score,
          lookbackReturn: monthChange,
        },
      };
    }

    case 'mean_reversion': {
      // Negative month change could indicate oversold
      const monthChange = asset.monthChangePercent ?? 0;
      const deviation = -monthChange; // Inverse for mean reversion
      const score = Math.min(100, Math.max(0, 50 + deviation * 3));
      return {
        type: 'mean_reversion',
        score,
        signal: getSignalFromScore(score),
        details: {
          deviationFromMA: deviation,
          zScore: deviation / 10, // Simplified
        },
      };
    }

    case 'smart_beta': {
      // Combine multiple factors
      const momentum = asset.monthChangePercent ?? 0;
      const value = asset.marketCap ? (100 - Math.log10(asset.marketCap) * 5) : 50;
      const score = Math.min(100, Math.max(0, (momentum + value) / 2 + 50));
      return {
        type: 'smart_beta',
        score,
        signal: getSignalFromScore(score),
        details: {
          factorScores: {
            momentum: momentum + 50,
            value: value,
          },
        },
      };
    }

    default:
      return {
        type,
        score: 50,
        signal: 'neutral',
      };
  }
}

function getSignalFromScore(score: number): StrategySignal['signal'] {
  if (score >= 80) return 'strong_buy';
  if (score >= 60) return 'buy';
  if (score >= 40) return 'neutral';
  if (score >= 20) return 'sell';
  return 'strong_sell';
}
