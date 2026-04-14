// TODO: implement backtest history service

export interface BacktestHistoryEntry {
  id: string;
  strategyName: string;
  startDate: string;
  endDate: string;
  annualReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  createdAt: Date;
}

export async function getBacktestHistory(userId: string): Promise<BacktestHistoryEntry[]> {
  // TODO: implement backtest history query from Firestore
  return [];
}

export async function deleteBacktestEntry(userId: string, entryId: string): Promise<void> {
  // TODO: implement backtest history entry deletion
}
