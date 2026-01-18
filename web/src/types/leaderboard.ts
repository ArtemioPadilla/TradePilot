/**
 * Leaderboard Types
 *
 * Type definitions for the trading leaderboard system.
 */

/**
 * Time period for leaderboard rankings
 */
export type LeaderboardPeriod = 'weekly' | 'monthly' | 'yearly' | 'all_time';

/**
 * Ranking metric used for sorting
 */
export type RankingMetric = 'return' | 'sharpe' | 'win_rate' | 'consistency';

/**
 * Leaderboard entry for a single user
 */
export interface LeaderboardEntry {
  userId: string;
  displayName: string; // Anonymous if privacy enabled
  isAnonymous: boolean;
  rank: number;
  previousRank?: number; // For showing rank changes

  // Performance metrics
  totalReturn: number; // Percentage
  sharpeRatio: number;
  winRate: number; // Percentage
  maxDrawdown: number; // Percentage (negative)
  volatility: number; // Annualized percentage

  // Trading stats
  totalTrades: number;
  profitableTrades: number;

  // Account info
  accountAge: number; // Days since account creation

  // Timestamps
  updatedAt: Date;
}

/**
 * Full leaderboard document stored in Firestore
 */
export interface Leaderboard {
  id: string;
  period: LeaderboardPeriod;
  metric: RankingMetric;
  entries: LeaderboardEntry[];
  totalParticipants: number;

  // Period range
  startDate: Date;
  endDate: Date;

  // Metadata
  calculatedAt: Date;
  nextCalculation: Date;
}

/**
 * User's leaderboard preferences
 */
export interface LeaderboardPreferences {
  optedIn: boolean;
  displayAnonymously: boolean;
  showOnProfile: boolean;
}

/**
 * User privacy settings for social features
 */
export interface PrivacySettings {
  // Leaderboard
  leaderboardOptIn: boolean;
  leaderboardAnonymous: boolean;

  // Profile
  showProfile: boolean;
  showPerformance: boolean;
  showStrategies: boolean;

  // Strategy defaults
  defaultStrategyPublic: boolean;
  defaultAuthorVisible: boolean;
  defaultAllowCopy: boolean;
}

/**
 * Default privacy settings for new users
 */
export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  leaderboardOptIn: false,
  leaderboardAnonymous: true,
  showProfile: false,
  showPerformance: false,
  showStrategies: false,
  defaultStrategyPublic: false,
  defaultAuthorVisible: false,
  defaultAllowCopy: true,
};

/**
 * Leaderboard calculation request
 */
export interface LeaderboardCalculationRequest {
  period: LeaderboardPeriod;
  metric: RankingMetric;
  limit?: number;
}

/**
 * Get display name for leaderboard period
 */
export function getLeaderboardPeriodName(period: LeaderboardPeriod): string {
  const names: Record<LeaderboardPeriod, string> = {
    weekly: 'This Week',
    monthly: 'This Month',
    yearly: 'This Year',
    all_time: 'All Time',
  };
  return names[period];
}

/**
 * Get display name for ranking metric
 */
export function getRankingMetricName(metric: RankingMetric): string {
  const names: Record<RankingMetric, string> = {
    return: 'Total Return',
    sharpe: 'Sharpe Ratio',
    win_rate: 'Win Rate',
    consistency: 'Consistency',
  };
  return names[metric];
}

/**
 * Get rank change indicator
 */
export function getRankChange(current: number, previous?: number): {
  direction: 'up' | 'down' | 'same' | 'new';
  amount: number;
} {
  if (previous === undefined) {
    return { direction: 'new', amount: 0 };
  }

  if (current < previous) {
    return { direction: 'up', amount: previous - current };
  }

  if (current > previous) {
    return { direction: 'down', amount: current - previous };
  }

  return { direction: 'same', amount: 0 };
}

/**
 * Format rank with ordinal suffix
 */
export function formatRank(rank: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const remainder = rank % 100;

  if (remainder >= 11 && remainder <= 13) {
    return `${rank}th`;
  }

  const suffix = suffixes[rank % 10] || suffixes[0];
  return `${rank}${suffix}`;
}
