/**
 * Market Status Component
 *
 * Displays current market status, connection state, and refresh info.
 */

import React from 'react';
import type { MarketStatus as MarketStatusType } from '../../types/market-data';
import { useMarketDataContext } from '../../contexts/MarketDataContext';
import styles from './MarketStatus.module.css';

// ============================================================================
// Types
// ============================================================================

interface MarketStatusProps {
  /** Show connection status */
  showConnection?: boolean;

  /** Show refresh interval */
  showRefreshInterval?: boolean;

  /** Show current time */
  showTime?: boolean;

  /** Compact mode */
  compact?: boolean;

  /** Custom class name */
  className?: string;
}

// ============================================================================
// Status Labels
// ============================================================================

const STATUS_LABELS: Record<MarketStatusType, string> = {
  open: 'Markets Open',
  closed: 'Markets Closed',
  pre: 'Pre-Market',
  post: 'After Hours',
  extended: 'Extended Hours',
  holiday: 'Market Holiday',
  unknown: 'Status Unknown',
};

const STATUS_ICONS: Record<MarketStatusType, string> = {
  open: '\u{1F7E2}', // Green circle
  closed: '\u{1F534}', // Red circle
  pre: '\u{1F7E1}', // Yellow circle
  post: '\u{1F7E1}', // Yellow circle
  extended: '\u{1F7E1}', // Yellow circle
  holiday: '\u{26D4}', // No entry
  unknown: '\u{26AA}', // White circle
};

// ============================================================================
// Component
// ============================================================================

export function MarketStatus({
  showConnection = true,
  showRefreshInterval = true,
  showTime = true,
  compact = false,
  className = '',
}: MarketStatusProps) {
  const {
    marketStatus,
    connected,
    preferences,
    initialized,
  } = useMarketDataContext();

  const [currentTime, setCurrentTime] = React.useState(new Date());

  // Update time every minute
  React.useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Get refresh interval in seconds
  const getRefreshSeconds = (): number => {
    if (preferences.customIntervalMs && preferences.refreshMode === 'custom') {
      return Math.round(preferences.customIntervalMs / 1000);
    }
    const presets = { fast: 5, balanced: 15, conservative: 60, custom: 15 };
    return presets[preferences.refreshMode];
  };

  if (compact) {
    return (
      <div className={`${styles.compact} ${className}`}>
        <span className={styles.statusIndicator}>
          {STATUS_ICONS[marketStatus]}
        </span>
        {showConnection && (
          <span className={connected ? styles.connected : styles.disconnected}>
            {connected ? '\u{1F4E1}' : '\u{1F4F4}'} {/* Antenna or no signal */}
          </span>
        )}
        {showRefreshInterval && (
          <span className={styles.refresh}>
            {'\u21BB'} {getRefreshSeconds()}s
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Market Status */}
      <div className={`${styles.item} ${styles[marketStatus]}`}>
        <span className={styles.icon}>{STATUS_ICONS[marketStatus]}</span>
        <span className={styles.label}>{STATUS_LABELS[marketStatus]}</span>
      </div>

      {/* Divider */}
      <span className={styles.divider}>|</span>

      {/* Connection Status */}
      {showConnection && (
        <>
          <div className={`${styles.item} ${connected ? styles.connected : styles.disconnected}`}>
            <span className={styles.icon}>
              {connected ? '\u{1F4E1}' : '\u{1F4F4}'}
            </span>
            <span className={styles.label}>
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>
          <span className={styles.divider}>|</span>
        </>
      )}

      {/* Refresh Interval */}
      {showRefreshInterval && (
        <>
          <div className={styles.item}>
            <span className={styles.icon}>{'\u21BB'}</span>
            <span className={styles.label}>{getRefreshSeconds()}s</span>
          </div>
          <span className={styles.divider}>|</span>
        </>
      )}

      {/* Current Time */}
      {showTime && (
        <div className={styles.item}>
          <span className={styles.time}>
            {currentTime.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Standalone Status Badge
// ============================================================================

interface MarketStatusBadgeProps {
  status?: MarketStatusType;
  className?: string;
}

export function MarketStatusBadge({
  status,
  className = '',
}: MarketStatusBadgeProps) {
  const context = useMarketDataContext();
  const actualStatus = status || context.marketStatus;

  return (
    <span className={`${styles.badge} ${styles[actualStatus]} ${className}`}>
      {STATUS_ICONS[actualStatus]} {STATUS_LABELS[actualStatus]}
    </span>
  );
}

// ============================================================================
// Connection Indicator
// ============================================================================

interface ConnectionIndicatorProps {
  className?: string;
}

export function ConnectionIndicator({ className = '' }: ConnectionIndicatorProps) {
  const { connected, initialized } = useMarketDataContext();

  if (!initialized) {
    return (
      <span className={`${styles.connectionDot} ${styles.initializing} ${className}`}>
        {'\u26AA'} Initializing
      </span>
    );
  }

  return (
    <span
      className={`${styles.connectionDot} ${connected ? styles.connected : styles.disconnected} ${className}`}
    >
      {connected ? '\u{1F7E2}' : '\u{1F534}'} {connected ? 'Connected' : 'Disconnected'}
    </span>
  );
}

// ============================================================================
// Default Export
// ============================================================================

export default MarketStatus;
