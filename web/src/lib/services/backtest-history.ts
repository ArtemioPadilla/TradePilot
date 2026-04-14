const API_BASE = 'http://localhost:8000';

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
  try {
    const response = await fetch(`${API_BASE}/backtest/history?userId=${encodeURIComponent(userId)}`);
    return await response.json();
  } catch {
    return [];
  }
}

export async function deleteBacktestEntry(userId: string, entryId: string): Promise<void> {
  // TODO: implement backtest history entry deletion
}
