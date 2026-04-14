import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';

export interface BacktestHistoryEntry {
  id: string;
  userId: string;
  strategyName: string;
  strategyType: string;
  universe: string[];
  startDate: string;
  endDate: string;
  annualReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalReturn: number;
  volatility: number;
  parameters: Record<string, unknown>;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BacktestFilters {
  strategyName?: string;
  startAfter?: Date;
  endBefore?: Date;
  minReturn?: number;
  limit?: number;
}

export interface BacktestComparison {
  backtests: BacktestHistoryEntry[];
  metrics: {
    bestReturn: { id: string; value: number };
    bestSharpe: { id: string; value: number };
    lowestDrawdown: { id: string; value: number };
  };
}

function backtestsCollection(userId: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firestore not initialized');
  return collection(db, 'users', userId, 'backtests');
}

function backtestDoc(userId: string, backtestId: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firestore not initialized');
  return doc(db, 'users', userId, 'backtests', backtestId);
}

function toEntry(id: string, data: Record<string, unknown>): BacktestHistoryEntry {
  return {
    id,
    userId: data.userId as string,
    strategyName: data.strategyName as string,
    strategyType: (data.strategyType as string) || '',
    universe: (data.universe as string[]) || [],
    startDate: data.startDate as string,
    endDate: data.endDate as string,
    annualReturn: data.annualReturn as number,
    sharpeRatio: data.sharpeRatio as number,
    maxDrawdown: data.maxDrawdown as number,
    totalReturn: (data.totalReturn as number) || 0,
    volatility: (data.volatility as number) || 0,
    parameters: (data.parameters as Record<string, unknown>) || {},
    deleted: (data.deleted as boolean) || false,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  };
}

/**
 * Save a backtest result to Firestore.
 */
export async function saveBacktestResult(
  userId: string,
  result: Omit<BacktestHistoryEntry, 'id' | 'userId' | 'deleted' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const col = backtestsCollection(userId);
    const docRef = await addDoc(col, {
      userId,
      ...result,
      deleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('[backtest-history] saved result:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[backtest-history] failed to save result:', error);
    throw error;
  }
}

/**
 * Get backtest history for a user, sorted by date descending.
 */
export async function getBacktestHistory(
  userId: string,
  filters?: BacktestFilters
): Promise<BacktestHistoryEntry[]> {
  try {
    const col = backtestsCollection(userId);
    const constraints = [
      where('deleted', '==', false),
      orderBy('createdAt', 'desc'),
    ];

    if (filters?.strategyName) {
      constraints.push(where('strategyName', '==', filters.strategyName));
    }

    if (filters?.limit) {
      constraints.push(firestoreLimit(filters.limit));
    }

    const q = query(col, ...constraints);
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map((d) => toEntry(d.id, d.data()));

    // Client-side filters for range queries
    if (filters?.startAfter) {
      results = results.filter((r) => r.createdAt >= filters.startAfter!);
    }
    if (filters?.endBefore) {
      results = results.filter((r) => r.createdAt <= filters.endBefore!);
    }
    if (filters?.minReturn !== undefined) {
      results = results.filter((r) => r.annualReturn >= filters.minReturn!);
    }

    console.log('[backtest-history] fetched', results.length, 'results for user:', userId);
    return results;
  } catch (error) {
    console.error('[backtest-history] failed to fetch history:', error);
    return [];
  }
}

/**
 * Get a single backtest result by ID.
 */
export async function getBacktestById(
  userId: string,
  backtestId: string
): Promise<BacktestHistoryEntry | null> {
  try {
    const ref = backtestDoc(userId, backtestId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const entry = toEntry(snap.id, snap.data());
    if (entry.deleted) return null;

    return entry;
  } catch (error) {
    console.error('[backtest-history] failed to fetch backtest:', backtestId, error);
    return null;
  }
}

/**
 * Soft-delete a backtest result.
 */
export async function deleteBacktest(
  userId: string,
  backtestId: string
): Promise<void> {
  try {
    const ref = backtestDoc(userId, backtestId);
    await updateDoc(ref, {
      deleted: true,
      updatedAt: serverTimestamp(),
    });
    console.log('[backtest-history] soft-deleted backtest:', backtestId);
  } catch (error) {
    console.error('[backtest-history] failed to delete backtest:', backtestId, error);
    throw error;
  }
}

/**
 * Compare multiple backtests side-by-side.
 */
export async function compareBacktests(
  userId: string,
  ids: string[]
): Promise<BacktestComparison> {
  try {
    const entries = await Promise.all(
      ids.map((id) => getBacktestById(userId, id))
    );

    const backtests = entries.filter((e): e is BacktestHistoryEntry => e !== null);

    if (backtests.length === 0) {
      return {
        backtests: [],
        metrics: {
          bestReturn: { id: '', value: 0 },
          bestSharpe: { id: '', value: 0 },
          lowestDrawdown: { id: '', value: 0 },
        },
      };
    }

    const bestReturn = backtests.reduce((best, b) =>
      b.annualReturn > best.annualReturn ? b : best
    );
    const bestSharpe = backtests.reduce((best, b) =>
      b.sharpeRatio > best.sharpeRatio ? b : best
    );
    const lowestDrawdown = backtests.reduce((best, b) =>
      b.maxDrawdown > best.maxDrawdown ? b : best
    );

    console.log('[backtest-history] compared', backtests.length, 'backtests');
    return {
      backtests,
      metrics: {
        bestReturn: { id: bestReturn.id, value: bestReturn.annualReturn },
        bestSharpe: { id: bestSharpe.id, value: bestSharpe.sharpeRatio },
        lowestDrawdown: { id: lowestDrawdown.id, value: lowestDrawdown.maxDrawdown },
      },
    };
  } catch (error) {
    console.error('[backtest-history] failed to compare backtests:', error);
    throw error;
  }
}
