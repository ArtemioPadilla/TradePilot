import { atom, computed } from 'nanostores';

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  lastUpdated: Date;
}

export interface Account {
  id: string;
  name: string;
  type: 'alpaca' | 'manual' | 'crypto' | '401k' | 'ira' | 'other';
  currency: string;
  holdings: Holding[];
}

export const $accounts = atom<Account[]>([]);
export const $selectedAccountId = atom<string | null>(null);
export const $pricesLoading = atom<boolean>(false);

export const $selectedAccount = computed(
  [$accounts, $selectedAccountId],
  (accounts, selectedId) => accounts.find((a) => a.id === selectedId) || null
);

export const $totalPortfolioValue = computed($accounts, (accounts) => {
  return accounts.reduce((total, account) => {
    const accountValue = account.holdings.reduce(
      (sum, h) => sum + h.quantity * h.currentPrice,
      0
    );
    return total + accountValue;
  }, 0);
});

export const $totalCostBasis = computed($accounts, (accounts) => {
  return accounts.reduce((total, account) => {
    const accountCost = account.holdings.reduce(
      (sum, h) => sum + h.quantity * h.avgCost,
      0
    );
    return total + accountCost;
  }, 0);
});

export const $totalPnL = computed(
  [$totalPortfolioValue, $totalCostBasis],
  (value, cost) => value - cost
);

export const $totalPnLPercent = computed(
  [$totalPnL, $totalCostBasis],
  (pnl, cost) => (cost > 0 ? (pnl / cost) * 100 : 0)
);

// Mock data for development
export function loadMockData() {
  $accounts.set([
    {
      id: '1',
      name: 'Alpaca Trading',
      type: 'alpaca',
      currency: 'USD',
      holdings: [
        {
          id: '1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          quantity: 50,
          avgCost: 150.0,
          currentPrice: 185.42,
          lastUpdated: new Date(),
        },
        {
          id: '2',
          symbol: 'GOOGL',
          name: 'Alphabet Inc.',
          quantity: 20,
          avgCost: 120.0,
          currentPrice: 141.8,
          lastUpdated: new Date(),
        },
        {
          id: '3',
          symbol: 'MSFT',
          name: 'Microsoft Corp.',
          quantity: 30,
          avgCost: 280.0,
          currentPrice: 378.91,
          lastUpdated: new Date(),
        },
        {
          id: '4',
          symbol: 'NVDA',
          name: 'NVIDIA Corp.',
          quantity: 15,
          avgCost: 450.0,
          currentPrice: 721.28,
          lastUpdated: new Date(),
        },
        {
          id: '5',
          symbol: 'TSLA',
          name: 'Tesla Inc.',
          quantity: 25,
          avgCost: 200.0,
          currentPrice: 248.5,
          lastUpdated: new Date(),
        },
      ],
    },
    {
      id: '2',
      name: '401k Retirement',
      type: '401k',
      currency: 'USD',
      holdings: [
        {
          id: '6',
          symbol: 'VTI',
          name: 'Vanguard Total Stock',
          quantity: 100,
          avgCost: 200.0,
          currentPrice: 252.34,
          lastUpdated: new Date(),
        },
        {
          id: '7',
          symbol: 'BND',
          name: 'Vanguard Total Bond',
          quantity: 50,
          avgCost: 75.0,
          currentPrice: 72.15,
          lastUpdated: new Date(),
        },
      ],
    },
  ]);
}
