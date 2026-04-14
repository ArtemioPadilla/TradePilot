import {
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import type { Account, Holding } from '../../types/portfolio';

export interface PortfolioData {
  totalValue: number;
  totalCostBasis: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dailyChange: number;
  dailyChangePercent: number;
  holdings: Holding[];
  accounts: Account[];
}

export async function getPortfolioData(userId: string): Promise<PortfolioData> {
  const db = getFirebaseDb();
  if (!db) {
    console.warn('[portfolio] Firestore not initialized');
    return emptyPortfolio();
  }

  try {
    // Fetch all accounts
    const accountsCol = collection(db, 'users', userId, 'accounts');
    const accountsSnap = await getDocs(query(accountsCol, orderBy('createdAt', 'desc')));
    const accounts = accountsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Account));

    // Fetch all holdings across all accounts
    const allHoldings: Holding[] = [];
    for (const account of accounts) {
      const holdingsCol = collection(db, 'users', userId, 'accounts', account.id, 'holdings');
      const holdingsSnap = await getDocs(query(holdingsCol));
      const holdings = holdingsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Holding));
      allHoldings.push(...holdings);
    }

    // Aggregate values
    let totalValue = 0;
    let totalCostBasis = 0;
    let dailyChange = 0;

    for (const holding of allHoldings) {
      const mv = holding.marketValue ?? (holding.quantity * (holding.currentPrice ?? holding.costBasisPerShare));
      totalValue += mv;
      totalCostBasis += holding.totalCostBasis;
      dailyChange += (holding.dailyChange ?? 0) * holding.quantity;
    }

    // Add cash balances
    for (const account of accounts) {
      totalValue += account.cashBalance || 0;
    }

    const totalGainLoss = totalValue - totalCostBasis;
    const totalGainLossPercent = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;
    const dailyChangePercent = totalValue > 0 ? (dailyChange / (totalValue - dailyChange)) * 100 : 0;

    console.log('[portfolio] aggregated:', {
      accounts: accounts.length,
      holdings: allHoldings.length,
      totalValue,
    });

    return {
      totalValue,
      totalCostBasis,
      totalGainLoss,
      totalGainLossPercent,
      dailyChange,
      dailyChangePercent,
      holdings: allHoldings,
      accounts,
    };
  } catch (error) {
    console.error('[portfolio] error fetching portfolio data:', error);
    return emptyPortfolio();
  }
}

export function calculateDiversityScore(holdings: any[]): number {
  if (!holdings.length) return 0;

  // Herfindahl-Hirschman Index (HHI) based diversity score
  const totalValue = holdings.reduce((sum: number, h: any) => {
    return sum + (h.marketValue ?? h.totalCostBasis ?? 0);
  }, 0);

  if (totalValue === 0) return 0;

  // Calculate HHI (sum of squared weights)
  const hhi = holdings.reduce((sum: number, h: any) => {
    const value = h.marketValue ?? h.totalCostBasis ?? 0;
    const weight = value / totalValue;
    return sum + weight * weight;
  }, 0);

  // Convert HHI to 0-100 score (1/n is perfectly diversified, 1.0 is concentrated)
  // HHI ranges from 1/n to 1.0
  const n = holdings.length;
  const minHHI = 1 / n;
  const score = n > 1
    ? Math.round(((1 - hhi) / (1 - minHHI)) * 100)
    : 0;

  return Math.max(0, Math.min(100, score));
}

function emptyPortfolio(): PortfolioData {
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
