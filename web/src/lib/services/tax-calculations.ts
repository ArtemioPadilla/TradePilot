// TODO: implement tax calculation service

export interface TaxSummary {
  shortTermGains: number;
  shortTermLosses: number;
  longTermGains: number;
  longTermLosses: number;
  netShortTerm: number;
  netLongTerm: number;
  totalNetGainLoss: number;
}

export interface Form8949Entry {
  symbol: string;
  description: string;
  dateAcquired: Date;
  dateSold: Date;
  proceeds: number;
  costBasis: number;
  gainLoss: number;
  isShortTerm: boolean;
  holdingPeriodDays: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  total: number;
  date: Date;
}

export async function calculateTaxSummary(trades: Trade[], year: number): Promise<TaxSummary> {
  // TODO: implement real tax calculation
  return {
    shortTermGains: 0,
    shortTermLosses: 0,
    longTermGains: 0,
    longTermLosses: 0,
    netShortTerm: 0,
    netLongTerm: 0,
    totalNetGainLoss: 0,
  };
}

export async function generateForm8949(trades: Trade[], year: number): Promise<Form8949Entry[]> {
  // TODO: implement Form 8949 generation
  return [];
}

export function exportTaxDataCSV(entries: Form8949Entry[]): string {
  // TODO: implement CSV export
  return '';
}

export function estimateTaxLiability(summary: TaxSummary, taxBracket?: number): number {
  // TODO: implement tax liability estimation
  return 0;
}
