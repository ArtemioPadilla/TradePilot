/**
 * PriceDisplay Component
 *
 * Displays real-time price information with change indicators.
 */

import { useState, useEffect } from 'react';
import type { AlpacaQuote } from '../../types/alpaca';

interface PriceDisplayProps {
  /** Current price */
  price: number;
  /** Previous close price (for calculating change) */
  previousClose?: number;
  /** Symbol being displayed */
  symbol?: string;
  /** Currency symbol */
  currency?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show change indicators */
  showChange?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Real-time quote data */
  quote?: AlpacaQuote;
  /** Additional CSS class */
  className?: string;
}

export function PriceDisplay({
  price,
  previousClose,
  symbol,
  currency = '$',
  size = 'md',
  showChange = true,
  loading = false,
  quote,
  className = '',
}: PriceDisplayProps) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const [lastPrice, setLastPrice] = useState(price);

  // Flash effect when price changes
  useEffect(() => {
    if (price !== lastPrice) {
      setFlash(price > lastPrice ? 'up' : 'down');
      setLastPrice(price);
      const timer = setTimeout(() => setFlash(null), 500);
      return () => clearTimeout(timer);
    }
  }, [price, lastPrice]);

  // Calculate change
  const change = previousClose ? price - previousClose : 0;
  const changePercent = previousClose ? ((price - previousClose) / previousClose) * 100 : 0;
  const isPositive = change >= 0;

  // Format price with proper decimals
  const formatPrice = (value: number): string => {
    if (value >= 1000) {
      return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (value >= 1) {
      return value.toFixed(2);
    }
    return value.toFixed(4);
  };

  // Size classes
  const sizeClasses = {
    sm: {
      price: 'text-lg font-semibold',
      change: 'text-xs',
      symbol: 'text-xs',
    },
    md: {
      price: 'text-2xl font-bold',
      change: 'text-sm',
      symbol: 'text-sm',
    },
    lg: {
      price: 'text-4xl font-bold',
      change: 'text-base',
      symbol: 'text-base',
    },
  };

  const classes = sizeClasses[size];

  if (loading) {
    return (
      <div className={`price-display price-display--loading ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-24 mb-1"></div>
          {showChange && <div className="h-4 bg-gray-200 rounded w-16"></div>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`price-display ${className}`}
      data-testid="price-display"
    >
      {symbol && (
        <div className={`price-symbol text-gray-500 ${classes.symbol}`}>
          {symbol}
        </div>
      )}

      <div
        className={`price-value ${classes.price} ${
          flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''
        }`}
        data-testid="price-value"
      >
        {currency}{formatPrice(price)}
      </div>

      {showChange && previousClose && (
        <div
          className={`price-change flex items-center gap-2 ${classes.change} ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}
          data-testid="price-change"
        >
          <span className="change-amount">
            {isPositive ? '+' : ''}{currency}{formatPrice(Math.abs(change))}
          </span>
          <span className="change-percent">
            ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
          </span>
          <span className="change-arrow">
            {isPositive ? '▲' : '▼'}
          </span>
        </div>
      )}

      {quote && (
        <div className="quote-details text-xs text-gray-500 mt-1" data-testid="quote-details">
          <span className="bid">Bid: {currency}{formatPrice(quote.bidPrice)} × {quote.bidSize}</span>
          <span className="mx-2">|</span>
          <span className="ask">Ask: {currency}{formatPrice(quote.askPrice)} × {quote.askSize}</span>
        </div>
      )}

      <style>{`
        .price-display {
          display: inline-block;
        }

        .flash-up {
          animation: flashUp 0.5s ease-out;
        }

        .flash-down {
          animation: flashDown 0.5s ease-out;
        }

        @keyframes flashUp {
          0% { background-color: rgba(34, 197, 94, 0.3); }
          100% { background-color: transparent; }
        }

        @keyframes flashDown {
          0% { background-color: rgba(239, 68, 68, 0.3); }
          100% { background-color: transparent; }
        }

        .price-value {
          transition: background-color 0.3s ease;
          padding: 2px 4px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

/**
 * Compact inline price display for tables
 */
interface InlinePriceProps {
  price: number;
  previousClose?: number;
  currency?: string;
  showChange?: boolean;
}

export function InlinePrice({
  price,
  previousClose,
  currency = '$',
  showChange = true,
}: InlinePriceProps) {
  const change = previousClose ? price - previousClose : 0;
  const changePercent = previousClose ? ((price - previousClose) / previousClose) * 100 : 0;
  const isPositive = change >= 0;

  const formatPrice = (value: number): string => {
    return value >= 1 ? value.toFixed(2) : value.toFixed(4);
  };

  return (
    <span className="inline-price" data-testid="inline-price">
      <span className="font-medium">{currency}{formatPrice(price)}</span>
      {showChange && previousClose && (
        <span className={`ml-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
        </span>
      )}
    </span>
  );
}

/**
 * Price ticker component for watchlist
 */
interface PriceTickerProps {
  symbol: string;
  price: number;
  previousClose?: number;
  currency?: string;
  onClick?: () => void;
}

export function PriceTicker({
  symbol,
  price,
  previousClose,
  currency = '$',
  onClick,
}: PriceTickerProps) {
  const change = previousClose ? price - previousClose : 0;
  const changePercent = previousClose ? ((price - previousClose) / previousClose) * 100 : 0;
  const isPositive = change >= 0;

  const formatPrice = (value: number): string => {
    return value >= 1 ? value.toFixed(2) : value.toFixed(4);
  };

  return (
    <div
      className={`price-ticker flex items-center justify-between p-2 rounded-lg border cursor-pointer
        hover:bg-gray-50 transition-colors ${
          isPositive ? 'border-green-200' : 'border-red-200'
        }`}
      onClick={onClick}
      data-testid="price-ticker"
    >
      <span className="font-medium">{symbol}</span>
      <div className="text-right">
        <div className="font-semibold">{currency}{formatPrice(price)}</div>
        {previousClose && (
          <div className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
          </div>
        )}
      </div>
    </div>
  );
}

export default PriceDisplay;
