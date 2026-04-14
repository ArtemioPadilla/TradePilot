import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';

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

function getRangeStartDate(range: DateRange): Date {
  const now = new Date();
  switch (range) {
    case '1W': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '1M': return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case '3M': return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case '6M': return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case '1Y': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    case 'ALL': return new Date(2020, 0, 1);
    default: return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  }
}

export async function getNetWorthByRange(
  userId: string,
  range: DateRange
): Promise<any[]> {
  const db = getFirebaseDb();
  if (!db) return [];

  try {
    const startDate = getRangeStartDate(range);
    const col = collection(db, 'users', userId, 'networthSnapshots');
    const q = query(
      col,
      where('date', '>=', Timestamp.fromDate(startDate)),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('[networth] error fetching snapshots:', error);
    return [];
  }
}

export function convertToDataPoints(snapshots: any[]): NetWorthDataPoint[] {
  return snapshots.map((s) => ({
    date: s.date?.toDate
      ? s.date.toDate().toISOString().split('T')[0]
      : new Date(s.date).toISOString().split('T')[0],
    value: s.totalValue ?? s.value ?? 0,
  }));
}

export function calculatePeriodStats(dataPoints: NetWorthDataPoint[]): PeriodStats {
  if (!dataPoints.length) {
    return { startValue: 0, endValue: 0, change: 0, changePercent: 0, high: 0, low: 0 };
  }

  const values = dataPoints.map((d) => d.value);
  const startValue = values[0];
  const endValue = values[values.length - 1];
  const change = endValue - startValue;
  const changePercent = startValue > 0 ? (change / startValue) * 100 : 0;

  return {
    startValue,
    endValue,
    change,
    changePercent,
    high: Math.max(...values),
    low: Math.min(...values),
  };
}

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
