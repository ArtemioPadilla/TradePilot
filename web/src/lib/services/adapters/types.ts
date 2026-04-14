export interface AdapterInfo {
  id: string;
  name: string;
  description: string;
  icon?: string;
  supportedFeatures: string[];
}

export interface ConnectionResult {
  success: boolean;
  error?: string;
  adapterId?: string;
}

export interface PortfolioHistoryPoint {
  date: string;
  totalValue: number;
  totalCostBasis: number;
  dailyReturn: number;
}

export interface ExternalOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  status: string;
  filledAt?: string;
  source: string;
}
