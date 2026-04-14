/**
 * Update Leaderboard Cloud Function
 *
 * Scheduled daily function that calculates leaderboard rankings
 * from opted-in users' backtest results.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

type LeaderboardPeriod = 'weekly' | 'monthly' | 'all_time';

interface UserStats {
  userId: string;
  displayName: string;
  isAnonymous: boolean;
  totalReturn: number;
  sharpeRatio: number;
  winRate: number;
  maxDrawdown: number;
  volatility: number;
  totalTrades: number;
  profitableTrades: number;
  accountAge: number;
}

interface LeaderboardEntryDoc {
  userId: string;
  displayName: string;
  isAnonymous: boolean;
  rank: number;
  previousRank?: number;
  totalReturn: number;
  sharpeRatio: number;
  winRate: number;
  maxDrawdown: number;
  volatility: number;
  totalTrades: number;
  profitableTrades: number;
  accountAge: number;
  updatedAt: FirebaseFirestore.FieldValue;
}

/**
 * Get the start date for a given leaderboard period.
 */
function getPeriodStart(period: LeaderboardPeriod): Date {
  const now = new Date();
  switch (period) {
    case 'weekly': {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return start;
    }
    case 'monthly': {
      const start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      return start;
    }
    case 'all_time':
      return new Date(0);
  }
}

/**
 * Fetch all opted-in users.
 */
async function getOptedInUsers(): Promise<Array<{ userId: string; displayName: string; isAnonymous: boolean; createdAt: Date }>> {
  const usersSnapshot = await db.collection('users').get();
  const optedInUsers: Array<{ userId: string; displayName: string; isAnonymous: boolean; createdAt: Date }> = [];

  for (const userDoc of usersSnapshot.docs) {
    const settingsRef = db.doc(`users/${userDoc.id}/settings/leaderboard`);
    const settingsSnap = await settingsRef.get();

    if (settingsSnap.exists && settingsSnap.data()?.optedIn === true) {
      const userData = userDoc.data();
      const createdAt = userData.createdAt?.toDate?.() || new Date();
      optedInUsers.push({
        userId: userDoc.id,
        displayName: settingsSnap.data()?.displayAnonymously
          ? `Trader #${userDoc.id.slice(0, 6)}`
          : userData.displayName || 'Anonymous',
        isAnonymous: settingsSnap.data()?.displayAnonymously ?? true,
        createdAt,
      });
    }
  }

  functions.logger.info(`Found ${optedInUsers.length} opted-in users`);
  return optedInUsers;
}

/**
 * Calculate stats for a single user based on their backtests.
 */
async function calculateUserStats(
  userId: string,
  displayName: string,
  isAnonymous: boolean,
  accountCreatedAt: Date,
  periodStart: Date
): Promise<UserStats | null> {
  const backtestsRef = db.collection(`users/${userId}/backtests`);
  let q: FirebaseFirestore.Query = backtestsRef
    .where('deleted', '==', false);

  if (periodStart.getTime() > 0) {
    q = q.where('createdAt', '>=', admin.firestore.Timestamp.fromDate(periodStart));
  }

  const snapshot = await q.get();

  if (snapshot.empty) return null;

  const backtests = snapshot.docs.map((d) => d.data());

  // Aggregate metrics
  const returns = backtests.map((b) => (b.annualReturn as number) || 0);
  const sharpes = backtests.map((b) => (b.sharpeRatio as number) || 0);
  const drawdowns = backtests.map((b) => (b.maxDrawdown as number) || 0);
  const volatilities = backtests.map((b) => (b.volatility as number) || 0);

  const totalReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const avgSharpe = sharpes.reduce((sum, s) => sum + s, 0) / sharpes.length;
  const worstDrawdown = Math.min(...drawdowns);
  const avgVolatility = volatilities.reduce((sum, v) => sum + v, 0) / volatilities.length;

  const profitable = backtests.filter((b) => ((b.annualReturn as number) || 0) > 0).length;
  const winRate = (profitable / backtests.length) * 100;

  const accountAge = Math.floor(
    (Date.now() - accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    userId,
    displayName,
    isAnonymous,
    totalReturn,
    sharpeRatio: avgSharpe,
    winRate,
    maxDrawdown: worstDrawdown,
    volatility: avgVolatility,
    totalTrades: backtests.length,
    profitableTrades: profitable,
    accountAge,
  };
}

/**
 * Get previous ranks for computing rank changes.
 */
async function getPreviousRanks(period: LeaderboardPeriod): Promise<Map<string, number>> {
  const ranks = new Map<string, number>();
  try {
    const entriesSnap = await db.collection(`leaderboards/${period}/entries`).get();
    for (const d of entriesSnap.docs) {
      ranks.set(d.id, (d.data().rank as number) || 0);
    }
  } catch {
    // No previous data
  }
  return ranks;
}

/**
 * Write ranked entries to Firestore for a given period.
 */
async function writeLeaderboard(
  period: LeaderboardPeriod,
  stats: UserStats[],
  previousRanks: Map<string, number>,
  limit: number = 100
): Promise<void> {
  // Sort by total return descending
  const sorted = [...stats].sort((a, b) => b.totalReturn - a.totalReturn);
  const top = sorted.slice(0, limit);

  const batch = db.batch();

  // Write period metadata
  const periodRef = db.doc(`leaderboards/${period}`);
  batch.set(periodRef, {
    period,
    totalParticipants: stats.length,
    calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
    nextCalculation: getNextCalculationDate(),
    topEntryReturn: top.length > 0 ? top[0].totalReturn : 0,
  });

  // Write individual entries
  for (let i = 0; i < top.length; i++) {
    const user = top[i];
    const entryRef = db.doc(`leaderboards/${period}/entries/${user.userId}`);
    const entryData: LeaderboardEntryDoc = {
      userId: user.userId,
      displayName: user.displayName,
      isAnonymous: user.isAnonymous,
      rank: i + 1,
      previousRank: previousRanks.get(user.userId),
      totalReturn: user.totalReturn,
      sharpeRatio: user.sharpeRatio,
      winRate: user.winRate,
      maxDrawdown: user.maxDrawdown,
      volatility: user.volatility,
      totalTrades: user.totalTrades,
      profitableTrades: user.profitableTrades,
      accountAge: user.accountAge,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    batch.set(entryRef, entryData);
  }

  await batch.commit();
  functions.logger.info(`Wrote ${top.length} entries for ${period} leaderboard`);
}

function getNextCalculationDate(): Date {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(2, 0, 0, 0); // 2 AM next day
  return next;
}

/**
 * Scheduled Cloud Function: runs daily at 2 AM UTC.
 * Recalculates leaderboard rankings for all periods.
 */
export const updateLeaderboard = functions.pubsub
  .schedule('every day 02:00')
  .timeZone('UTC')
  .onRun(async () => {
    functions.logger.info('Starting leaderboard calculation');

    try {
      const users = await getOptedInUsers();

      if (users.length === 0) {
        functions.logger.info('No opted-in users, skipping calculation');
        return;
      }

      const periods: LeaderboardPeriod[] = ['weekly', 'monthly', 'all_time'];

      for (const period of periods) {
        const periodStart = getPeriodStart(period);
        const previousRanks = await getPreviousRanks(period);

        const statsPromises = users.map((u) =>
          calculateUserStats(u.userId, u.displayName, u.isAnonymous, u.createdAt, periodStart)
        );
        const allStats = await Promise.all(statsPromises);
        const validStats = allStats.filter((s): s is UserStats => s !== null);

        await writeLeaderboard(period, validStats, previousRanks);
      }

      functions.logger.info('Leaderboard calculation complete');
    } catch (error) {
      functions.logger.error('Leaderboard calculation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  });

/**
 * Callable function to manually trigger leaderboard update (admin only).
 */
export const triggerLeaderboardUpdate = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  // Check admin claim
  if (!context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  functions.logger.info('Manual leaderboard update triggered by:', context.auth.uid);

  const users = await getOptedInUsers();
  const periods: LeaderboardPeriod[] = ['weekly', 'monthly', 'all_time'];

  for (const period of periods) {
    const periodStart = getPeriodStart(period);
    const previousRanks = await getPreviousRanks(period);

    const statsPromises = users.map((u) =>
      calculateUserStats(u.userId, u.displayName, u.isAnonymous, u.createdAt, periodStart)
    );
    const allStats = await Promise.all(statsPromises);
    const validStats = allStats.filter((s): s is UserStats => s !== null);

    await writeLeaderboard(period, validStats, previousRanks);
  }

  return { success: true, usersProcessed: users.length };
});
