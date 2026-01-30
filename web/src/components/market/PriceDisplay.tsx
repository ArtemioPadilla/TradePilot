/**
 * Price Display Component
 *
 * Displays real-time price with change indicators and refresh status.
 * Supports flash animation on price changes.
 */

import React, { useState, useEffect, useRef } from 'react';
import type { PriceQuote } from '../../types/market-data';
import { usePrice } from '../../hooks/useMarketData';
import styles from './PriceDisplay.module.css';

// ============================================================================
// Types
// ============================================================================

interface PriceDisplayProps {
  /** Symbol to display */
  symbol: string;

  /** Pre-fetched quote (optional - will fetch if not provided) */
  quote?: PriceQuote | null;

  /** Size variant */
  size?: 'sm' | 'md' | 'lg';

  /** Show change indicator */
  showChange?: boolean;

  /** Show percentage */
  showPercent?: boolean;

  /** Show last update time */
  showLastUpdate?: boolean;

  /** Show refresh countdown */
  showCountdown?: boolean;

  /** Flash on change */
  flashOnChange?: boolean;

  /** Custom class name */
  className?: string;

  /** Compact mode (single line) */
  compact?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function PriceDisplay({
  symbol,
  quote: providedQuote,
  size = 'md',
  showChange = true,
  showPercent = true,
  showLastUpdate = false,
  showCountdown = false,
  flashOnChange = true,
  className = '',
  compact = false,
}: PriceDisplayProps) {
  // Use hook if quote not provided
  const hookResult = usePrice(symbol, { enableRefresh: !providedQuote });
  const quote = providedQuote || hookResult.price;
  const loading = !providedQuote && hookResult.loading;

  // Flash state
  const [flashClass, setFlashClass] = useState('');
  const prevPriceRef = useRef<number | null>(null);

  // Handle price change flash
  useEffect(() => {
    if (!flashOnChange || !quote || prevPriceRef.current === null) {
      prevPriceRef.current = quote?.price ?? null;
      return;
    }

    const prevPrice = prevPriceRef.current;
    const newPrice = quote.price;

    if (newPrice > prevPrice) {
      setFlashClass(styles.flashUp);
    } else if (newPrice < prevPrice) {
      setFlashClass(styles.flashDown);
    }

    prevPriceRef.current = newPrice;

    // Clear flash after animation
    const timer = setTimeout(() => setFlashClass(''), 500);
    return () => clearTimeout(timer);
  }, [quote?.price, flashOnChange]);

  // Loading state
  if (loading) {
    return (
      <div className={`${styles.container} ${styles[size]} ${className}`}>
        <div className={styles.loading}>
          <span className={styles.symbol}>{symbol}</span>
          <span className={styles.skeleton} />
        </div>
      </div>
    );
  }

  // No data state
  if (!quote) {
    return (
      <div className={`${styles.container} ${styles[size]} ${className}`}>
        <span className={styles.symbol}>{symbol}</span>
        <span className={styles.noData}>--</span>
      </div>
    );
  }

  const isPositive = quote.change >= 0;
  const changeColor = isPositive ? styles.positive : styles.negative;
  const sign = isPositive ? '+' : '';

  // Format price based on magnitude
  const formatPrice = (price: number): string => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(4);
  };

  // Format time ago
  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  if (compact) {
    return (
      <span className={`${styles.compact} ${styles[size]} ${flashClass} ${className}`}>
        <span className={styles.symbol}>{symbol}</span>
        <span className={styles.price}>${formatPrice(quote.price)}</span>
        {showChange && (
          <span className={`${styles.change} ${changeColor}`}>
            {sign}{quote.change.toFixed(2)}
            {showPercent && ` (${sign}${quote.changePercent.toFixed(2)}%)`}
          </span>
        )}
      </span>
    );
  }

  return (
    <div className={`${styles.container} ${styles[size]} ${flashClass} ${className}`}>
      <div className={styles.header}>
        <span className={styles.symbol}>{symbol}</span>
        {quote.marketStatus && (
          <span className={`${styles.status} ${styles[quote.marketStatus]}`}>
            {quote.marketStatus}
          </span>
        )}
      </div>

      <div className={styles.priceRow}>
        <span className={styles.price}>${formatPrice(quote.price)}</span>
        {showChange && (
          <span className={`${styles.change} ${changeColor}`}>
            {sign}{quote.change.toFixed(2)}
            {showPercent && (
              <span className={styles.percent}>
                ({sign}{quote.changePercent.toFixed(2)}%)
              </span>
            )}
          </span>
        )}
      </div>

      {(showLastUpdate || showCountdown) && (
        <div className={styles.footer}>
          {showLastUpdate && quote.fetchedAt && (
            <span className={styles.lastUpdate}>
              {formatTimeAgo(quote.fetchedAt)}
            </span>
          )}
          {showCountdown && (
            <RefreshCountdown expiresAt={quote.expiresAt} />
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Refresh Countdown Sub-component
// ============================================================================

interface RefreshCountdownProps {
  expiresAt: Date;
}

function RefreshCountdown({ expiresAt }: RefreshCountdownProps) {
  const [seconds, setSeconds] = useState(0);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const updateCountdown = () => {
      const remaining = Math.max(0, expiresAt.getTime() - Date.now());
      const secs = Math.ceil(remaining / 1000);
      setSeconds(secs);

      // Assume 15 second TTL for progress calculation
      const ttl = 15_000;
      setProgress(Math.min(100, (remaining / ttl) * 100));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span className={styles.countdown}>
      <span
        className={styles.progressBar}
        style={{ width: `${progress}%` }}
      />
      <span className={styles.countdownText}>{seconds}s</span>
    </span>
  );
}

// ============================================================================
// Default Export
// ============================================================================

export default PriceDisplay;
