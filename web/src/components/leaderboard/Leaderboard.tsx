/**
 * Leaderboard Component
 *
 * Displays user rankings based on trading performance.
 */

import { useState, useEffect } from 'react';
import type {
  LeaderboardEntry,
  LeaderboardPeriod,
  RankingMetric,
  PrivacySettings,
} from '../../types/leaderboard';
import {
  getLeaderboardPeriodName,
  getRankingMetricName,
  getRankChange,
  formatRank,
} from '../../types/leaderboard';
import {
  getTopLeaderboardEntries,
  getCurrentUserRank,
  getPrivacySettings,
  setLeaderboardOptIn,
  getLeaderboardStats,
} from '../../lib/services/leaderboard';

export interface LeaderboardProps {
  initialPeriod?: LeaderboardPeriod;
  initialMetric?: RankingMetric;
}

export function Leaderboard({
  initialPeriod = 'monthly',
  initialMetric = 'return',
}: LeaderboardProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>(initialPeriod);
  const [metric, setMetric] = useState<RankingMetric>(initialMetric);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [stats, setStats] = useState<{
    totalParticipants: number;
    averageReturn: number;
    topReturn: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptingIn, setIsOptingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [period, metric]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [entriesData, userRankData, privacyData, statsData] = await Promise.all([
        getTopLeaderboardEntries(period, metric, 100),
        getCurrentUserRank(period, metric),
        getPrivacySettings(),
        getLeaderboardStats(period),
      ]);

      setEntries(entriesData);
      setUserRank(userRankData);
      setPrivacySettings(privacyData);
      setStats(statsData);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptIn = async () => {
    setIsOptingIn(true);
    try {
      await setLeaderboardOptIn(true);
      setPrivacySettings((prev) => prev ? { ...prev, leaderboardOptIn: true } : null);
    } catch (err) {
      setError('Failed to opt in to leaderboard');
    } finally {
      setIsOptingIn(false);
    }
  };

  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const periods: LeaderboardPeriod[] = ['weekly', 'monthly', 'yearly', 'all_time'];
  const metrics: RankingMetric[] = ['return', 'sharpe', 'win_rate', 'consistency'];

  if (isLoading) {
    return (
      <div className="leaderboard" data-testid="leaderboard">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading leaderboard...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="leaderboard" data-testid="leaderboard">
      {/* Header */}
      <div className="leaderboard-header">
        <div className="header-content">
          <h1>Leaderboard</h1>
          <p>See how you stack up against other traders</p>
        </div>

        {stats && (
          <div className="stats-bar">
            <div className="stat">
              <span className="stat-value">{stats.totalParticipants}</span>
              <span className="stat-label">Participants</span>
            </div>
            <div className="stat">
              <span className="stat-value">{formatPercentage(stats.averageReturn)}</span>
              <span className="stat-label">Avg Return</span>
            </div>
            <div className="stat">
              <span className="stat-value">{formatPercentage(stats.topReturn)}</span>
              <span className="stat-label">Top Return</span>
            </div>
          </div>
        )}
      </div>

      {/* Period Tabs */}
      <div className="period-tabs" role="tablist">
        {periods.map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={period === p}
            className={`period-tab ${period === p ? 'active' : ''}`}
            onClick={() => setPeriod(p)}
            data-testid={`period-${p}`}
          >
            {getLeaderboardPeriodName(p)}
          </button>
        ))}
      </div>

      {/* Metric Selector */}
      <div className="metric-selector">
        <label htmlFor="metric-select">Rank by:</label>
        <select
          id="metric-select"
          value={metric}
          onChange={(e) => setMetric(e.target.value as RankingMetric)}
          data-testid="metric-select"
        >
          {metrics.map((m) => (
            <option key={m} value={m}>
              {getRankingMetricName(m)}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={loadData}>Retry</button>
        </div>
      )}

      {/* User's Rank Card */}
      {userRank && (
        <div className="user-rank-card" data-testid="user-rank">
          <div className="rank-badge">
            <span className="rank-number">{formatRank(userRank.rank)}</span>
            <RankChangeIndicator current={userRank.rank} previous={userRank.previousRank} />
          </div>
          <div className="user-info">
            <span className="label">Your Position</span>
            <span className="value">{formatPercentage(userRank.totalReturn)} return</span>
          </div>
          <div className="user-stats">
            <div className="mini-stat">
              <span className="label">Sharpe</span>
              <span className="value">{userRank.sharpeRatio.toFixed(2)}</span>
            </div>
            <div className="mini-stat">
              <span className="label">Win Rate</span>
              <span className="value">{userRank.winRate.toFixed(1)}%</span>
            </div>
            <div className="mini-stat">
              <span className="label">Trades</span>
              <span className="value">{userRank.totalTrades}</span>
            </div>
          </div>
        </div>
      )}

      {/* Opt-in Prompt */}
      {privacySettings && !privacySettings.leaderboardOptIn && !userRank && (
        <div className="opt-in-card" data-testid="opt-in-prompt">
          <div className="opt-in-content">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <div>
              <h3>Join the Leaderboard</h3>
              <p>Opt in to see your ranking and compete with other traders</p>
            </div>
          </div>
          <button
            className="opt-in-button"
            onClick={handleOptIn}
            disabled={isOptingIn}
            data-testid="opt-in-button"
          >
            {isOptingIn ? 'Joining...' : 'Join Leaderboard'}
          </button>
        </div>
      )}

      {/* Leaderboard Table */}
      {entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <h3>No rankings yet</h3>
          <p>The leaderboard will populate as users opt in and trade</p>
        </div>
      ) : (
        <div className="leaderboard-table">
          <div className="table-header">
            <span className="col-rank">Rank</span>
            <span className="col-user">Trader</span>
            <span className="col-return">Return</span>
            <span className="col-sharpe">Sharpe</span>
            <span className="col-win-rate">Win Rate</span>
            <span className="col-trades">Trades</span>
          </div>

          <div className="table-body" data-testid="leaderboard-entries">
            {entries.map((entry, index) => (
              <div
                key={entry.userId}
                className={`table-row ${entry.userId === userRank?.userId ? 'current-user' : ''} ${index < 3 ? `top-${index + 1}` : ''}`}
                data-testid={`entry-${entry.rank}`}
              >
                <span className="col-rank">
                  <span className="rank-display">
                    {index === 0 && <span className="medal">🥇</span>}
                    {index === 1 && <span className="medal">🥈</span>}
                    {index === 2 && <span className="medal">🥉</span>}
                    {index > 2 && entry.rank}
                  </span>
                  <RankChangeIndicator current={entry.rank} previous={entry.previousRank} small />
                </span>
                <span className="col-user">
                  <span className="user-name">
                    {entry.isAnonymous ? 'Anonymous Trader' : entry.displayName}
                  </span>
                  {entry.userId === userRank?.userId && (
                    <span className="you-badge">You</span>
                  )}
                </span>
                <span className={`col-return ${entry.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                  {formatPercentage(entry.totalReturn)}
                </span>
                <span className="col-sharpe">{entry.sharpeRatio.toFixed(2)}</span>
                <span className="col-win-rate">{entry.winRate.toFixed(1)}%</span>
                <span className="col-trades">{entry.totalTrades}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

interface RankChangeIndicatorProps {
  current: number;
  previous?: number;
  small?: boolean;
}

function RankChangeIndicator({ current, previous, small }: RankChangeIndicatorProps) {
  const change = getRankChange(current, previous);

  if (change.direction === 'same' || change.direction === 'new') {
    return null;
  }

  const size = small ? 12 : 16;

  return (
    <span className={`rank-change ${change.direction} ${small ? 'small' : ''}`}>
      {change.direction === 'up' ? (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l-8 8h6v8h4v-8h6z" />
        </svg>
      ) : (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 20l8-8h-6V4h-4v8H4z" />
        </svg>
      )}
      {!small && <span>{change.amount}</span>}
    </span>
  );
}

const styles = `
  .leaderboard {
    padding: 1rem;
    max-width: 900px;
    margin: 0 auto;
  }

  .leaderboard-header {
    margin-bottom: 1.5rem;
  }

  .header-content h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0 0 0.25rem 0;
  }

  .header-content p {
    color: var(--text-muted, #6b7280);
    margin: 0;
  }

  .stats-bar {
    display: flex;
    gap: 2rem;
    margin-top: 1rem;
    padding: 1rem;
    background-color: var(--bg-secondary, #f8f9fa);
    border-radius: var(--radius-lg, 0.5rem);
  }

  .stat {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
  }

  .period-tabs {
    display: flex;
    gap: 0.25rem;
    background-color: var(--bg-secondary, #f8f9fa);
    padding: 0.25rem;
    border-radius: var(--radius-lg, 0.5rem);
    margin-bottom: 1rem;
  }

  .period-tab {
    flex: 1;
    padding: 0.5rem 1rem;
    background: none;
    border: none;
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-muted, #6b7280);
    cursor: pointer;
    transition: all 0.2s;
  }

  .period-tab:hover {
    color: var(--text-primary, #111827);
  }

  .period-tab.active {
    background-color: var(--bg-primary, white);
    color: var(--text-primary, #111827);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .metric-selector {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .metric-selector label {
    font-size: 0.875rem;
    color: var(--text-muted, #6b7280);
  }

  .metric-selector select {
    padding: 0.5rem 2rem 0.5rem 0.75rem;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.875rem;
    background-color: var(--bg-primary, white);
    color: var(--text-primary, #111827);
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
  }

  .error-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    border-radius: var(--radius-md, 0.375rem);
    margin-bottom: 1rem;
  }

  .error-banner button {
    background: none;
    border: 1px solid currentColor;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-sm, 0.25rem);
    color: inherit;
    cursor: pointer;
  }

  .user-rank-card {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.25rem;
    background: linear-gradient(135deg, var(--accent, #6366f1), var(--accent-hover, #4f46e5));
    border-radius: var(--radius-lg, 0.5rem);
    color: white;
    margin-bottom: 1.5rem;
  }

  .rank-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .rank-number {
    font-size: 1.75rem;
    font-weight: 700;
  }

  .user-info {
    flex: 1;
  }

  .user-info .label {
    display: block;
    font-size: 0.75rem;
    opacity: 0.8;
  }

  .user-info .value {
    font-size: 1.125rem;
    font-weight: 600;
  }

  .user-stats {
    display: flex;
    gap: 1.5rem;
  }

  .mini-stat {
    text-align: center;
  }

  .mini-stat .label {
    display: block;
    font-size: 0.75rem;
    opacity: 0.8;
  }

  .mini-stat .value {
    font-size: 0.9375rem;
    font-weight: 600;
  }

  .opt-in-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
    background-color: var(--bg-secondary, #f8f9fa);
    border: 1px dashed var(--border, #e5e7eb);
    border-radius: var(--radius-lg, 0.5rem);
    margin-bottom: 1.5rem;
  }

  .opt-in-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    color: var(--text-muted, #6b7280);
  }

  .opt-in-content h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0 0 0.25rem 0;
  }

  .opt-in-content p {
    font-size: 0.875rem;
    margin: 0;
  }

  .opt-in-button {
    padding: 0.625rem 1.25rem;
    background-color: var(--accent, #6366f1);
    border: none;
    border-radius: var(--radius-md, 0.375rem);
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .opt-in-button:hover:not(:disabled) {
    background-color: var(--accent-hover, #4f46e5);
  }

  .opt-in-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .leaderboard-table {
    background-color: var(--bg-secondary, #f8f9fa);
    border-radius: var(--radius-lg, 0.5rem);
    overflow: hidden;
  }

  .table-header {
    display: grid;
    grid-template-columns: 80px 1fr 100px 80px 80px 80px;
    padding: 0.75rem 1rem;
    background-color: var(--bg-tertiary, #f3f4f6);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted, #6b7280);
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .table-row {
    display: grid;
    grid-template-columns: 80px 1fr 100px 80px 80px 80px;
    padding: 0.875rem 1rem;
    border-bottom: 1px solid var(--border, #e5e7eb);
    align-items: center;
    transition: background-color 0.2s;
  }

  .table-row:last-child {
    border-bottom: none;
  }

  .table-row:hover {
    background-color: var(--bg-primary, white);
  }

  .table-row.current-user {
    background-color: rgba(99, 102, 241, 0.05);
  }

  .table-row.top-1 { background-color: rgba(255, 215, 0, 0.1); }
  .table-row.top-2 { background-color: rgba(192, 192, 192, 0.1); }
  .table-row.top-3 { background-color: rgba(205, 127, 50, 0.1); }

  .col-rank {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .rank-display {
    font-weight: 600;
    color: var(--text-primary, #111827);
  }

  .medal {
    font-size: 1.25rem;
  }

  .rank-change {
    display: flex;
    align-items: center;
    gap: 0.125rem;
    font-size: 0.75rem;
  }

  .rank-change.up { color: #16a34a; }
  .rank-change.down { color: #dc2626; }
  .rank-change.small { font-size: 0.625rem; }

  .col-user {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .user-name {
    font-weight: 500;
    color: var(--text-primary, #111827);
  }

  .you-badge {
    padding: 0.125rem 0.375rem;
    background-color: var(--accent, #6366f1);
    color: white;
    border-radius: var(--radius-sm, 0.25rem);
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .col-return {
    font-weight: 600;
  }

  .col-return.positive { color: #16a34a; }
  .col-return.negative { color: #dc2626; }

  .col-sharpe,
  .col-win-rate,
  .col-trades {
    color: var(--text-secondary, #4b5563);
    font-size: 0.875rem;
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border, #e5e7eb);
    border-top-color: var(--accent, #6366f1);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .empty-icon {
    color: var(--text-muted, #6b7280);
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-state h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  .empty-state p {
    color: var(--text-muted, #6b7280);
    margin: 0;
  }

  @media (max-width: 768px) {
    .stats-bar {
      flex-wrap: wrap;
      gap: 1rem;
    }

    .period-tabs {
      flex-wrap: wrap;
    }

    .period-tab {
      flex: 1 1 45%;
    }

    .user-rank-card {
      flex-direction: column;
      text-align: center;
      gap: 1rem;
    }

    .user-stats {
      width: 100%;
      justify-content: space-around;
    }

    .opt-in-card {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .opt-in-content {
      flex-direction: column;
    }

    .table-header,
    .table-row {
      grid-template-columns: 60px 1fr 80px;
    }

    .col-sharpe,
    .col-win-rate,
    .col-trades {
      display: none;
    }
  }
`;

export default Leaderboard;
