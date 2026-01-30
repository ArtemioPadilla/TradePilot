/**
 * Social Graph Types for TradePilot
 *
 * Implements social features compatible with CyberEco's community-first design.
 * Supports following, activity feeds, interactions, and community features.
 *
 * @see https://github.com/cyber-eco/cybereco-monorepo
 */

import type { AccessControl, VisibilityLevel } from './permissions';

// ============================================================================
// User Profile
// ============================================================================

/**
 * Enhanced user profile for social features
 */
export interface UserProfile {
  // ─────────────────────────────────────────────────────────────────────────
  // Identity
  // ─────────────────────────────────────────────────────────────────────────
  id: string;                        // Firebase Auth UID
  displayName: string;
  username: string;                  // Unique handle (@username)
  email?: string;                    // Only visible based on privacy settings

  // ─────────────────────────────────────────────────────────────────────────
  // Profile Content
  // ─────────────────────────────────────────────────────────────────────────
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  location?: string;
  website?: string;
  twitterHandle?: string;

  // ─────────────────────────────────────────────────────────────────────────
  // Social Stats (denormalized for performance)
  // ─────────────────────────────────────────────────────────────────────────
  followersCount: number;
  followingCount: number;
  strategiesCount: number;
  portfoliosCount: number;
  tradesCount: number;

  // ─────────────────────────────────────────────────────────────────────────
  // Trading Stats (public-facing)
  // ─────────────────────────────────────────────────────────────────────────
  tradingStats?: {
    totalReturn?: number;            // Lifetime return %
    winRate?: number;                // Win rate %
    avgHoldingPeriod?: number;       // Days
    favoriteAssetClass?: string;
    memberSince: Date;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Privacy & Visibility
  // ─────────────────────────────────────────────────────────────────────────
  isPublic: boolean;                 // Public profile
  showPerformance: boolean;          // Show returns publicly
  showHoldings: boolean;             // Show portfolio composition

  // ─────────────────────────────────────────────────────────────────────────
  // Verification & Status
  // ─────────────────────────────────────────────────────────────────────────
  isVerified: boolean;               // Verified account (blue check)
  isPremium: boolean;                // Premium subscriber
  badges: Badge[];

  // ─────────────────────────────────────────────────────────────────────────
  // Activity
  // ─────────────────────────────────────────────────────────────────────────
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;

  // ─────────────────────────────────────────────────────────────────────────
  // CyberEco Future Compatibility
  // ─────────────────────────────────────────────────────────────────────────
  /** Decentralized identifier (future) */
  did?: string;
}

/**
 * User badge types
 */
export interface Badge {
  id: string;
  type: BadgeType;
  name: string;
  description: string;
  iconUrl?: string;
  earnedAt: Date;
}

export type BadgeType =
  | 'early_adopter'
  | 'top_performer'
  | 'strategy_creator'
  | 'community_contributor'
  | 'verified_trader'
  | 'premium_member'
  | 'milestone_1k'
  | 'milestone_10k'
  | 'milestone_100k';

// ============================================================================
// Social Relationships
// ============================================================================

/**
 * Follow relationship
 * Firestore: /follows/{followerId}_{followingId}
 */
export interface Follow {
  id: string;                        // {followerId}_{followingId}
  followerId: string;                // Who is following
  followingId: string;               // Who is being followed
  createdAt: Date;

  // Notification preferences for this follow
  notifyOnTrade?: boolean;
  notifyOnStrategy?: boolean;
  notifyOnPost?: boolean;
}

/**
 * Block relationship
 * Firestore: /blocks/{blockerId}_{blockedId}
 */
export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  reason?: string;
  createdAt: Date;
}

/**
 * Follow request (for private accounts)
 * Firestore: /follow_requests/{requestId}
 */
export interface FollowRequest {
  id: string;
  requesterId: string;
  targetId: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  createdAt: Date;
  respondedAt?: Date;
}

// ============================================================================
// Activity Feed
// ============================================================================

/**
 * Activity feed item
 * Firestore: /activities/{activityId}
 */
export interface Activity {
  id: string;
  userId: string;                    // Who performed the action
  type: ActivityType;

  // ─────────────────────────────────────────────────────────────────────────
  // Polymorphic Reference
  // ─────────────────────────────────────────────────────────────────────────
  targetType: ActivityTargetType;
  targetId: string;

  // ─────────────────────────────────────────────────────────────────────────
  // Denormalized for Display
  // ─────────────────────────────────────────────────────────────────────────
  summary: string;                   // "Shared a new strategy: Momentum Alpha"
  details?: string;                  // Additional context
  metadata?: Record<string, unknown>;

  // ─────────────────────────────────────────────────────────────────────────
  // Preview Data (denormalized)
  // ─────────────────────────────────────────────────────────────────────────
  preview?: {
    title?: string;
    description?: string;
    imageUrl?: string;
    stats?: Record<string, number>;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Visibility
  // ─────────────────────────────────────────────────────────────────────────
  visibility: VisibilityLevel;

  // ─────────────────────────────────────────────────────────────────────────
  // Engagement (denormalized counts)
  // ─────────────────────────────────────────────────────────────────────────
  likesCount: number;
  commentsCount: number;
  sharesCount: number;

  // ─────────────────────────────────────────────────────────────────────────
  // Timestamps
  // ─────────────────────────────────────────────────────────────────────────
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Activity types
 */
export type ActivityType =
  // Strategy related
  | 'strategy_created'
  | 'strategy_updated'
  | 'strategy_shared'
  | 'strategy_copied'
  | 'strategy_published'
  // Portfolio related
  | 'portfolio_created'
  | 'portfolio_updated'
  | 'portfolio_shared'
  // Trading related
  | 'trade_executed'
  | 'position_opened'
  | 'position_closed'
  // Milestones
  | 'milestone_reached'
  | 'achievement_earned'
  | 'streak_achieved'
  // Social
  | 'followed_user'
  | 'comment_added'
  | 'review_posted'
  // Backtesting
  | 'backtest_completed'
  | 'backtest_shared';

/**
 * Activity target types
 */
export type ActivityTargetType =
  | 'strategy'
  | 'portfolio'
  | 'trade'
  | 'user'
  | 'backtest'
  | 'achievement'
  | 'comment';

// ============================================================================
// Social Interactions
// ============================================================================

/**
 * Like/reaction
 * Firestore: /likes/{userId}_{targetType}_{targetId}
 */
export interface Like {
  id: string;                        // {userId}_{targetType}_{targetId}
  userId: string;
  targetType: LikeTargetType;
  targetId: string;
  reactionType?: ReactionType;       // Optional reaction type
  createdAt: Date;
}

export type LikeTargetType =
  | 'activity'
  | 'strategy'
  | 'portfolio'
  | 'comment'
  | 'review';

export type ReactionType =
  | 'like'
  | 'love'
  | 'insightful'
  | 'celebrate'
  | 'support';

/**
 * Comment
 * Firestore: /comments/{commentId}
 */
export interface Comment {
  id: string;
  userId: string;
  targetType: CommentTargetType;
  targetId: string;

  // Content
  content: string;
  mentions?: string[];               // User IDs mentioned

  // Threading
  parentId?: string;                 // For replies
  replyCount: number;

  // Moderation
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;

  // Engagement
  likesCount: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export type CommentTargetType =
  | 'activity'
  | 'strategy'
  | 'portfolio'
  | 'backtest';

/**
 * Review (for strategies)
 * Firestore: /reviews/{reviewId}
 */
export interface Review {
  id: string;
  userId: string;
  strategyId: string;

  // Rating
  rating: number;                    // 1-5 stars
  title?: string;
  content: string;

  // Usage context
  usedDuration?: string;             // "3 months"
  tradeCount?: number;

  // Moderation
  isVerifiedPurchase: boolean;       // User actually used the strategy
  isEdited: boolean;

  // Engagement
  helpfulCount: number;
  notHelpfulCount: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Notifications
// ============================================================================

/**
 * Social notification
 * Firestore: /users/{userId}/notifications/{notificationId}
 */
export interface SocialNotification {
  id: string;
  userId: string;                    // Recipient
  type: NotificationType;

  // Actor (who triggered)
  actorId: string;
  actorName?: string;                // Denormalized
  actorAvatarUrl?: string;           // Denormalized

  // Target
  targetType?: string;
  targetId?: string;

  // Content
  title: string;
  body: string;
  imageUrl?: string;
  actionUrl?: string;

  // State
  isRead: boolean;
  readAt?: Date;

  // Timestamps
  createdAt: Date;
}

export type NotificationType =
  // Social
  | 'new_follower'
  | 'follow_request'
  | 'follow_accepted'
  | 'mention'
  | 'comment'
  | 'reply'
  | 'like'
  // Strategy
  | 'strategy_copied'
  | 'strategy_reviewed'
  | 'strategy_trending'
  // Portfolio
  | 'portfolio_milestone'
  // Trading
  | 'trade_alert'
  | 'price_alert'
  // System
  | 'system_announcement'
  | 'achievement_earned';

// ============================================================================
// Leaderboards
// ============================================================================

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  isVerified: boolean;

  // Metric being ranked
  metric: string;
  value: number;
  change?: number;                   // Change from previous period
  changeRank?: number;               // Rank change

  // Context
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Leaderboard types
 */
export type LeaderboardType =
  | 'returns_daily'
  | 'returns_weekly'
  | 'returns_monthly'
  | 'returns_ytd'
  | 'returns_all_time'
  | 'strategies_copies'
  | 'strategies_rating'
  | 'followers'
  | 'win_rate';

/**
 * Leaderboard
 * Firestore: /leaderboards/{type}_{period}
 */
export interface Leaderboard {
  id: string;
  type: LeaderboardType;
  period: string;                    // "2024-01", "2024-W01", "2024-01-15"

  entries: LeaderboardEntry[];

  // Metadata
  totalParticipants: number;
  updatedAt: Date;
  nextUpdateAt: Date;
}

// ============================================================================
// Discovery & Search
// ============================================================================

/**
 * User search filters
 */
export interface UserSearchFilters {
  query?: string;
  verified?: boolean;
  premium?: boolean;
  minFollowers?: number;
  maxFollowers?: number;
  minReturns?: number;
  badgeTypes?: BadgeType[];
  sortBy?: 'relevance' | 'followers' | 'returns' | 'recent';
  limit?: number;
  offset?: number;
}

/**
 * User search result
 */
export interface UserSearchResult {
  users: UserProfile[];
  total: number;
  hasMore: boolean;
}

/**
 * Trending topics/tags
 */
export interface TrendingTopic {
  tag: string;
  count: number;
  change: number;                    // Change from previous period
  relatedAssets?: string[];
}

// ============================================================================
// Feed Generation
// ============================================================================

/**
 * Feed request options
 */
export interface FeedOptions {
  userId: string;
  feedType: 'home' | 'following' | 'discover' | 'notifications';
  limit?: number;
  cursor?: string;                   // For pagination
  includeOwnActivity?: boolean;
}

/**
 * Feed response
 */
export interface FeedResponse {
  items: Activity[];
  nextCursor?: string;
  hasMore: boolean;
  fetchedAt: Date;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate follow document ID
 */
export function createFollowId(followerId: string, followingId: string): string {
  return `${followerId}_${followingId}`;
}

/**
 * Generate like document ID
 */
export function createLikeId(
  userId: string,
  targetType: LikeTargetType,
  targetId: string
): string {
  return `${userId}_${targetType}_${targetId}`;
}

/**
 * Format follower count for display
 */
export function formatFollowerCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Generate activity summary
 */
export function generateActivitySummary(
  type: ActivityType,
  targetName?: string
): string {
  const summaries: Record<ActivityType, string> = {
    strategy_created: `Created a new strategy${targetName ? `: ${targetName}` : ''}`,
    strategy_updated: `Updated strategy${targetName ? `: ${targetName}` : ''}`,
    strategy_shared: `Shared a strategy${targetName ? `: ${targetName}` : ''}`,
    strategy_copied: `Copied a strategy${targetName ? `: ${targetName}` : ''}`,
    strategy_published: `Published a strategy${targetName ? `: ${targetName}` : ''}`,
    portfolio_created: `Created a new portfolio${targetName ? `: ${targetName}` : ''}`,
    portfolio_updated: `Updated their portfolio`,
    portfolio_shared: `Shared their portfolio`,
    trade_executed: `Executed a trade`,
    position_opened: `Opened a position${targetName ? ` in ${targetName}` : ''}`,
    position_closed: `Closed a position${targetName ? ` in ${targetName}` : ''}`,
    milestone_reached: `Reached a milestone${targetName ? `: ${targetName}` : ''}`,
    achievement_earned: `Earned an achievement${targetName ? `: ${targetName}` : ''}`,
    streak_achieved: `Achieved a streak${targetName ? `: ${targetName}` : ''}`,
    followed_user: `Started following${targetName ? ` ${targetName}` : ' someone'}`,
    comment_added: `Added a comment`,
    review_posted: `Posted a review`,
    backtest_completed: `Completed a backtest`,
    backtest_shared: `Shared backtest results`,
  };

  return summaries[type] || 'Activity';
}
