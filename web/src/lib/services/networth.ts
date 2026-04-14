// TODO: implement with real Firebase/API calls

export type DateRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

export interface NetWorthDataPoint {
  date: string;
  value: number;
}

export interface PeriodStats {
  startValue: number;
  endValue: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
}

/**
 * Fetch net-worth snapshots for a user within the given date range.
 */
export async function getNetWorthByRange(
  userId: string,
  range: DateRange
): Promise<any[]> {
  // TODO: query Firestore net-worth snapshots filtered by range
  console.warn('[networth] getNetWorthByRange is a stub');
  return [];
}

/**
 * Convert raw Firestore snapshots to chart-ready data points.
 */
export function convertToDataPoints(snapshots: any[]): NetWorthDataPoint[] {
  // TODO: map Firestore timestamps to ISO date strings
  console.warn('[networth] convertToDataPoints is a stub');
  return [];
}

/**
 * Calculate summary statistics for a set of data points.
 */
export function calculatePeriodStats(dataPoints: NetWorthDataPoint[]): PeriodStats {
  // TODO: compute from real data points
  console.warn('[networth] calculatePeriodStats is a stub');
  return {
    startValue: 0,
    endValue: 0,
    change: 0,
    changePercent: 0,
    high: 0,
    low: 0,
  };
}

/**
 * Generate mock net-worth data for demo/development purposes.
 * Returns 30 data points with a random-walk pattern.
 */
export function generateMockData(range: DateRange): NetWorthDataPoint[] {
  const points: NetWorthDataPoint[] = [];
  const now = new Date();
  const baseValue = 10000;

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const noise = (Math.random() - 0.5) * 500;
    points.push({
      date: date.toISOString().split('T')[0],
      value: Math.round((baseValue + noise + (30 - i) * 50) * 100) / 100,
    });
  }

  return points;
}
