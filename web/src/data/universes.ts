/**
 * Asset Universe Symbol Lists
 *
 * Predefined symbol lists for strategy universes.
 * These are representative samples of the actual indices.
 */

import type { AssetUniverse } from '../types/markets';

/**
 * S&P 500 - Top 100 by market cap (representative sample)
 */
export const SP500_SYMBOLS: string[] = [
  // Technology
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'META', 'NVDA', 'AVGO', 'ORCL', 'CSCO', 'ADBE',
  'CRM', 'ACN', 'IBM', 'INTC', 'AMD', 'QCOM', 'TXN', 'AMAT', 'ADI', 'MU',
  // Communication Services
  'NFLX', 'DIS', 'CMCSA', 'VZ', 'T', 'TMUS',
  // Consumer Discretionary
  'AMZN', 'TSLA', 'HD', 'MCD', 'NKE', 'SBUX', 'LOW', 'TJX', 'BKNG', 'CMG',
  // Consumer Staples
  'PG', 'KO', 'PEP', 'COST', 'WMT', 'PM', 'MO', 'CL', 'MDLZ', 'KHC',
  // Energy
  'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'OXY', 'HAL',
  // Financials
  'BRK.B', 'JPM', 'V', 'MA', 'BAC', 'WFC', 'GS', 'MS', 'SPGI', 'BLK',
  'C', 'AXP', 'SCHW', 'MMC', 'PGR', 'CB', 'MET', 'AIG', 'TRV', 'AFL',
  // Healthcare
  'UNH', 'JNJ', 'LLY', 'PFE', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR', 'BMY',
  'AMGN', 'GILD', 'ISRG', 'MDT', 'CVS', 'ELV', 'CI', 'HUM', 'VRTX', 'REGN',
  // Industrials
  'CAT', 'DE', 'UNP', 'HON', 'UPS', 'BA', 'RTX', 'LMT', 'GE', 'MMM',
  'ADP', 'ITW', 'EMR', 'FDX', 'WM', 'ETN', 'NSC', 'CSX', 'JCI', 'PH',
  // Materials
  'LIN', 'APD', 'ECL', 'SHW', 'FCX', 'NEM', 'NUE', 'DOW', 'DD', 'PPG',
  // Real Estate
  'AMT', 'PLD', 'CCI', 'EQIX', 'SPG', 'PSA', 'O', 'WELL', 'DLR', 'AVB',
  // Utilities
  'NEE', 'DUK', 'SO', 'D', 'AEP', 'EXC', 'SRE', 'XEL', 'ED', 'WEC',
];

/**
 * NASDAQ 100 - Tech-heavy index
 */
export const NASDAQ100_SYMBOLS: string[] = [
  // Mega-cap tech
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'NVDA', 'TSLA', 'AVGO', 'COST',
  // Software & Services
  'ADBE', 'CRM', 'NFLX', 'AMD', 'INTC', 'QCOM', 'TXN', 'INTU', 'AMAT', 'ISRG',
  'ADI', 'MU', 'LRCX', 'SNPS', 'CDNS', 'KLAC', 'ASML', 'MRVL', 'NXPI', 'MCHP',
  // Biotech & Healthcare
  'AMGN', 'GILD', 'VRTX', 'REGN', 'ILMN', 'MRNA', 'BIIB', 'DXCM', 'IDXX', 'SGEN',
  // Consumer
  'PEP', 'SBUX', 'MDLZ', 'ADP', 'BKNG', 'MAR', 'LULU', 'ROST', 'ORLY', 'PAYX',
  // Communication
  'CMCSA', 'TMUS', 'CHTR', 'ATVI', 'EA', 'WBD', 'TTWO', 'ZM', 'MTCH', 'ROKU',
  // Others
  'PYPL', 'CSX', 'HON', 'PCAR', 'CTAS', 'ODFL', 'FAST', 'VRSK', 'CPRT', 'EXC',
  'XEL', 'AEP', 'WBA', 'KDP', 'DLTR', 'EBAY', 'JD', 'PDD', 'BIDU', 'WDAY',
  // EV & Clean Energy
  'LCID', 'RIVN', 'ENPH', 'FSLR', 'ON',
  // Fintech
  'SQ', 'COIN', 'HOOD', 'AFRM', 'SOFI',
];

/**
 * Dow Jones Industrial Average - 30 blue chip stocks
 */
export const DOW30_SYMBOLS: string[] = [
  'AAPL', 'AMGN', 'AXP', 'BA', 'CAT', 'CRM', 'CSCO', 'CVX', 'DIS', 'DOW',
  'GS', 'HD', 'HON', 'IBM', 'INTC', 'JNJ', 'JPM', 'KO', 'MCD', 'MMM',
  'MRK', 'MSFT', 'NKE', 'PG', 'TRV', 'UNH', 'V', 'VZ', 'WBA', 'WMT',
];

/**
 * ETF Universe - Common ETFs for diversified portfolios
 */
export const ETF_UNIVERSE_SYMBOLS: string[] = [
  // Broad Market
  'SPY', 'IVV', 'VOO', 'VTI', 'ITOT', 'SCHB',
  // Tech
  'QQQ', 'VGT', 'XLK', 'ARKK', 'SOXX', 'SMH',
  // Small/Mid Cap
  'IWM', 'IWB', 'IJR', 'VB', 'VO', 'MDY',
  // International
  'EFA', 'VEU', 'VXUS', 'EEM', 'VWO', 'IEMG',
  // Bonds
  'BND', 'AGG', 'TLT', 'IEF', 'SHY', 'LQD', 'HYG', 'TIP', 'VCIT', 'VCSH',
  // Sector
  'XLF', 'XLE', 'XLV', 'XLI', 'XLY', 'XLP', 'XLU', 'XLRE', 'XLB', 'XLC',
  // Commodities
  'GLD', 'SLV', 'IAU', 'USO', 'UNG', 'DBA', 'DBC',
  // Dividend
  'VYM', 'DVY', 'SDY', 'SCHD', 'HDV', 'DGRO',
  // Growth/Value
  'VUG', 'IWF', 'VTV', 'IWD', 'MTUM', 'QUAL',
  // Leveraged/Inverse (use with caution)
  'TQQQ', 'SQQQ', 'SPXU', 'UPRO',
];

/**
 * Get symbols for a given universe
 */
export function getUniverseSymbols(universe: AssetUniverse): string[] {
  switch (universe) {
    case 'sp500':
      return SP500_SYMBOLS;
    case 'nasdaq100':
      return NASDAQ100_SYMBOLS;
    case 'dow30':
      return DOW30_SYMBOLS;
    case 'etf_universe':
      return ETF_UNIVERSE_SYMBOLS;
    case 'custom':
      return []; // Custom universes have user-defined symbols
    default:
      return [];
  }
}

/**
 * Check if a symbol is in a given universe
 */
export function isSymbolInUniverse(symbol: string, universe: AssetUniverse): boolean {
  const symbols = getUniverseSymbols(universe);
  return symbols.includes(symbol.toUpperCase());
}

/**
 * Get all universes a symbol belongs to
 */
export function getUniversesForSymbol(symbol: string): AssetUniverse[] {
  const upperSymbol = symbol.toUpperCase();
  const universes: AssetUniverse[] = [];

  if (SP500_SYMBOLS.includes(upperSymbol)) universes.push('sp500');
  if (NASDAQ100_SYMBOLS.includes(upperSymbol)) universes.push('nasdaq100');
  if (DOW30_SYMBOLS.includes(upperSymbol)) universes.push('dow30');
  if (ETF_UNIVERSE_SYMBOLS.includes(upperSymbol)) universes.push('etf_universe');

  return universes;
}

/**
 * Universe display names
 */
export const UNIVERSE_DISPLAY_NAMES: Record<AssetUniverse, string> = {
  sp500: 'S&P 500',
  nasdaq100: 'NASDAQ 100',
  dow30: 'Dow 30',
  etf_universe: 'ETF Universe',
  custom: 'Custom',
};

/**
 * Universe descriptions
 */
export const UNIVERSE_DESCRIPTIONS: Record<AssetUniverse, string> = {
  sp500: 'Top 500 US companies by market cap',
  nasdaq100: '100 largest non-financial NASDAQ companies',
  dow30: '30 large-cap blue chip stocks',
  etf_universe: 'Diversified collection of ETFs',
  custom: 'Your custom selection of assets',
};
