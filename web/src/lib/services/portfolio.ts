// TODO: implement with real Firebase/API calls

/**
 * Aggregated portfolio data returned to the UI.
 */
export interface PortfolioData {
  totalValue: number;
  totalCostBasis: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dailyChange: number;
  dailyChangePercent: number;
  holdings: any[];
  accounts: any[];
}

/**
 * Fetch aggregated portfolio data across all accounts for a user.
 */
export async function getPortfolioData(userId: string): Promise<PortfolioData> {
  // TODO: aggregate holdings and accounts from Firestore, enrich with market prices
  console.warn('[portfolio] getPortfolioData is a stub');
  return {
    totalValue: 0,
    totalCostBasis: 0,
    totalGainLoss: 0,
    totalGainLossPercent: 0,
    dailyChange: 0,
    dailyChangePercent: 0,
    holdings: [],
    accounts: [],
  };
}

/**
 * Calculate a diversity score (0-100) based on sector/asset-class spread.
 */
export function calculateDiversityScore(holdings: any[]): number {
  // TODO: implement real diversity calculation (HHI or similar)
  console.warn('[portfolio] calculateDiversityScore is a stub');
  return 0;
}
