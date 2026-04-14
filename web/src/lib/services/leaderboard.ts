import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb, getFirebaseAuth } from '../firebase';
import type {
  LeaderboardEntry,
  LeaderboardPeriod,
  RankingMetric,
} from '../../types/leaderboard';

function leaderboardsCollection() {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firestore not initialized');
  return collection(db, 'leaderboards');
}

function leaderboardDoc(period: LeaderboardPeriod) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firestore not initialized');
  return doc(db, 'leaderboards', period);
}

function userPrefsDoc(userId: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firestore not initialized');
  return doc(db, 'users', userId, 'settings', 'leaderboard');
}

function toLeaderboardEntry(data: Record<string, unknown>): LeaderboardEntry {
  return {
    userId: data.userId as string,
    displayName: data.displayName as string,
    isAnonymous: (data.isAnonymous as boolean) || false,
    rank: data.rank as number,
    previousRank: data.previousRank as number | undefined,
    totalReturn: data.totalReturn as number,
    sharpeRatio: data.sharpeRatio as number,
    winRate: (data.winRate as number) || 0,
    maxDrawdown: data.maxDrawdown as number,
    volatility: (data.volatility as number) || 0,
    totalTrades: (data.totalTrades as number) || 0,
    profitableTrades: (data.profitableTrades as number) || 0,
    accountAge: (data.accountAge as number) || 0,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  };
}

/**
 * Get the metric key used for sorting entries.
 */
function metricSortKey(metric: RankingMetric): keyof LeaderboardEntry {
  const keys: Record<RankingMetric, keyof LeaderboardEntry> = {
    return: 'totalReturn',
    sharpe: 'sharpeRatio',
    win_rate: 'winRate',
    consistency: 'volatility',
  };
  return keys[metric];
}

/**
 * Fetch leaderboard entries from Firestore.
 */
export async function getLeaderboard(
  period: LeaderboardPeriod = 'monthly',
  metric: RankingMetric = 'return',
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  try {
    const db = getFirebaseDb();
    if (!db) throw new Error('Firestore not initialized');

    const entriesCol = collection(db, 'leaderboards', period, 'entries');
    const sortKey = metricSortKey(metric);
    const sortDirection = metric === 'consistency' ? 'asc' : 'desc';

    const q = query(
      entriesCol,
      orderBy(sortKey, sortDirection),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map((d, index) => {
      const entry = toLeaderboardEntry(d.data());
      entry.rank = index + 1;
      return entry;
    });

    console.log('[leaderboard] fetched', entries.length, 'entries for', period, metric);
    return entries;
  } catch (error) {
    console.error('[leaderboard] failed to fetch leaderboard:', error);
    return [];
  }
}

/**
 * Get a specific user's rank in the leaderboard.
 */
export async function getUserRank(
  userId: string,
  period: LeaderboardPeriod = 'monthly'
): Promise<{ rank: number; entry: LeaderboardEntry } | null> {
  try {
    const db = getFirebaseDb();
    if (!db) throw new Error('Firestore not initialized');

    const entryRef = doc(db, 'leaderboards', period, 'entries', userId);
    const snap = await getDoc(entryRef);

    if (!snap.exists()) return null;

    const entry = toLeaderboardEntry(snap.data());
    console.log('[leaderboard] user rank:', userId, 'rank:', entry.rank);
    return { rank: entry.rank, entry };
  } catch (error) {
    console.error('[leaderboard] failed to get user rank:', error);
    return null;
  }
}

/**
 * Opt a user into the leaderboard.
 */
export async function optInToLeaderboard(userId: string): Promise<void> {
  try {
    const ref = userPrefsDoc(userId);
    await setDoc(ref, {
      optedIn: true,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    console.log('[leaderboard] user opted in:', userId);
  } catch (error) {
    console.error('[leaderboard] failed to opt in:', error);
    throw error;
  }
}

/**
 * Opt a user out of the leaderboard.
 */
export async function optOutOfLeaderboard(userId: string): Promise<void> {
  try {
    const ref = userPrefsDoc(userId);
    await setDoc(ref, {
      optedIn: false,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    console.log('[leaderboard] user opted out:', userId);
  } catch (error) {
    console.error('[leaderboard] failed to opt out:', error);
    throw error;
  }
}

/**
 * Get leaderboard stats (total participants, last updated).
 */
export async function getLeaderboardStats(): Promise<{
  totalParticipants: number;
  lastUpdated: Date | null;
}> {
  try {
    const ref = leaderboardDoc('monthly');
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return { totalParticipants: 0, lastUpdated: null };
    }

    const data = snap.data();
    return {
      totalParticipants: (data.totalParticipants as number) || 0,
      lastUpdated: data.calculatedAt instanceof Timestamp
        ? data.calculatedAt.toDate()
        : null,
    };
  } catch (error) {
    console.error('[leaderboard] failed to get stats:', error);
    return { totalParticipants: 0, lastUpdated: null };
  }
}

/**
 * Get privacy settings for a user.
 * If no userId is provided, uses the currently authenticated user.
 */
export async function getPrivacySettings(
  userId?: string
): Promise<{ optedIn: boolean; displayAnonymously: boolean }> {
  try {
    const uid = userId || getFirebaseAuth()?.currentUser?.uid;
    if (!uid) return { optedIn: false, displayAnonymously: true };
    const ref = userPrefsDoc(uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return { optedIn: false, displayAnonymously: true };
    }

    const data = snap.data();
    return {
      optedIn: (data.optedIn as boolean) || false,
      displayAnonymously: (data.displayAnonymously as boolean) ?? true,
    };
  } catch (error) {
    console.error('[leaderboard] failed to get privacy settings:', error);
    return { optedIn: false, displayAnonymously: true };
  }
}

/**
 * Update privacy settings for leaderboard.
 */
export async function updatePrivacySettings(
  userId: string,
  settings: { optedIn?: boolean; displayAnonymously?: boolean }
): Promise<void> {
  try {
    const ref = userPrefsDoc(userId);
    await setDoc(ref, {
      ...settings,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    console.log('[leaderboard] updated privacy settings for:', userId);
  } catch (error) {
    console.error('[leaderboard] failed to update privacy settings:', error);
    throw error;
  }
}

// Re-export legacy aliases for backward compatibility
export {
  getLeaderboard as getTopLeaderboardEntries,
  getUserRank as getCurrentUserRank,
  optInToLeaderboard as setLeaderboardOptIn,
};
