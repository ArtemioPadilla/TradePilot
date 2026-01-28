/**
 * OrderForm Component
 *
 * Form for creating buy/sell orders with Alpaca.
 */

import { useState, useEffect } from 'react';
import type {
  OrderSide,
  OrderType,
  TimeInForce,
  OrderRequest,
  AlpacaQuote,
} from '../../types/alpaca';
import { PriceDisplay } from './PriceDisplay';

interface OrderFormProps {
  /** Symbol to trade (pre-filled) */
  symbol?: string;
  /** Current quote for the symbol */
  quote?: AlpacaQuote;
  /** Available buying power */
  buyingPower?: number;
  /** Current position quantity (for sell orders) */
  currentPosition?: number;
  /** Callback when order is submitted for preview */
  onPreview: (order: OrderRequest) => void;
  /** Callback to cancel */
  onCancel?: () => void;
  /** Whether form is submitting */
  isSubmitting?: boolean;
  /** Default side (buy/sell) */
  defaultSide?: OrderSide;
  /** Currency symbol */
  currency?: string;
}

const ORDER_TYPES: { value: OrderType; label: string; description: string }[] = [
  { value: 'market', label: 'Market', description: 'Execute immediately at best available price' },
  { value: 'limit', label: 'Limit', description: 'Execute at specified price or better' },
  { value: 'stop', label: 'Stop', description: 'Trigger market order when price reaches stop' },
  { value: 'stop_limit', label: 'Stop Limit', description: 'Trigger limit order when price reaches stop' },
  { value: 'trailing_stop', label: 'Trailing Stop', description: 'Dynamic stop that follows price' },
];

const TIME_IN_FORCE: { value: TimeInForce; label: string; description: string }[] = [
  { value: 'day', label: 'Day', description: 'Valid until market close' },
  { value: 'gtc', label: 'GTC', description: 'Good til canceled (90 days max)' },
  { value: 'opg', label: 'Opening', description: 'Execute at market open' },
  { value: 'cls', label: 'Closing', description: 'Execute at market close' },
  { value: 'ioc', label: 'IOC', description: 'Immediate or cancel' },
  { value: 'fok', label: 'FOK', description: 'Fill or kill (all or nothing)' },
];

export function OrderForm({
  symbol: initialSymbol = '',
  quote,
  buyingPower = 0,
  currentPosition = 0,
  onPreview,
  onCancel,
  isSubmitting = false,
  defaultSide = 'buy',
  currency = '$',
}: OrderFormProps) {
  // Form state
  const [symbol, setSymbol] = useState(initialSymbol);
  const [side, setSide] = useState<OrderSide>(defaultSide);
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [timeInForce, setTimeInForce] = useState<TimeInForce>('day');
  const [quantity, setQuantity] = useState<string>('');
  const [notional, setNotional] = useState<string>('');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [stopPrice, setStopPrice] = useState<string>('');
  const [trailPercent, setTrailPercent] = useState<string>('');
  const [trailPrice, setTrailPrice] = useState<string>('');
  const [extendedHours, setExtendedHours] = useState(false);
  const [useNotional, setUseNotional] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update symbol when prop changes
  useEffect(() => {
    if (initialSymbol) {
      setSymbol(initialSymbol);
    }
  }, [initialSymbol]);

  // Calculate estimated cost/proceeds
  const estimatedPrice = quote?.lastPrice || parseFloat(limitPrice) || 0;
  const qty = parseFloat(quantity) || 0;
  const estimatedValue = qty * estimatedPrice;

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!symbol.trim()) {
      newErrors.symbol = 'Symbol is required';
    }

    if (!useNotional && !quantity) {
      newErrors.quantity = 'Quantity is required';
    } else if (!useNotional && parseFloat(quantity) <= 0) {
      newErrors.quantity = 'Quantity must be positive';
    }

    if (useNotional && !notional) {
      newErrors.notional = 'Dollar amount is required';
    } else if (useNotional && parseFloat(notional) <= 0) {
      newErrors.notional = 'Amount must be positive';
    }

    if ((orderType === 'limit' || orderType === 'stop_limit') && !limitPrice) {
      newErrors.limitPrice = 'Limit price is required';
    }

    if ((orderType === 'stop' || orderType === 'stop_limit') && !stopPrice) {
      newErrors.stopPrice = 'Stop price is required';
    }

    if (orderType === 'trailing_stop' && !trailPercent && !trailPrice) {
      newErrors.trailPercent = 'Trail percent or price required';
    }

    if (side === 'buy' && estimatedValue > buyingPower && buyingPower > 0) {
      newErrors.quantity = 'Exceeds buying power';
    }

    if (side === 'sell' && qty > currentPosition && currentPosition > 0) {
      newErrors.quantity = 'Exceeds current position';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const order: OrderRequest = {
      symbol: symbol.toUpperCase(),
      side,
      type: orderType,
      timeInForce,
      extendedHours,
    };

    if (useNotional) {
      order.notional = parseFloat(notional);
    } else {
      order.qty = parseFloat(quantity);
    }

    if (orderType === 'limit' || orderType === 'stop_limit') {
      order.limitPrice = parseFloat(limitPrice);
    }

    if (orderType === 'stop' || orderType === 'stop_limit') {
      order.stopPrice = parseFloat(stopPrice);
    }

    if (orderType === 'trailing_stop') {
      if (trailPercent) {
        order.trailPercent = parseFloat(trailPercent);
      } else if (trailPrice) {
        order.trailPrice = parseFloat(trailPrice);
      }
    }

    onPreview(order);
  };

  // Quick fill buttons
  const handleQuickFill = (percent: number) => {
    if (side === 'buy' && buyingPower > 0 && estimatedPrice > 0) {
      const maxQty = Math.floor((buyingPower * percent) / estimatedPrice);
      setQuantity(maxQty.toString());
    } else if (side === 'sell' && currentPosition > 0) {
      const qty = Math.floor(currentPosition * percent);
      setQuantity(qty.toString());
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="order-form rounded-lg shadow-sm"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      data-testid="order-form"
    >
      {/* Side Toggle */}
      <div className="side-toggle flex" style={{ borderBottom: '1px solid var(--border)' }}>
        <button
          type="button"
          className={`flex-1 py-3 font-semibold transition-colors ${
            side === 'buy'
              ? 'bg-green-600 text-white'
              : ''
          }`}
          style={side !== 'buy' ? { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' } : undefined}
          onClick={() => setSide('buy')}
          data-testid="buy-button"
        >
          Buy
        </button>
        <button
          type="button"
          className={`flex-1 py-3 font-semibold transition-colors ${
            side === 'sell'
              ? 'bg-red-600 text-white'
              : ''
          }`}
          style={side !== 'sell' ? { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' } : undefined}
          onClick={() => setSide('sell')}
          data-testid="sell-button"
        >
          Sell
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Symbol Input */}
        <div className="form-group">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Symbol
          </label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="AAPL"
            className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.symbol ? 'border-red-500' : ''
            }`}
            style={{ background: 'var(--bg-tertiary)', border: `1px solid ${errors.symbol ? '#ef4444' : 'var(--border)'}`, color: 'var(--text-primary)' }}
            data-testid="symbol-input"
          />
          {errors.symbol && (
            <p className="text-red-500 text-xs mt-1">{errors.symbol}</p>
          )}
        </div>

        {/* Current Price Display */}
        {quote && (
          <div className="price-display-wrapper rounded-lg p-3" style={{ background: 'var(--bg-tertiary)' }}>
            <PriceDisplay
              price={quote.lastPrice}
              symbol={symbol}
              quote={quote}
              size="sm"
              showChange={false}
            />
          </div>
        )}

        {/* Order Type */}
        <div className="form-group">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Order Type
          </label>
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as OrderType)}
            className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            data-testid="order-type-select"
          >
            {ORDER_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {ORDER_TYPES.find((t) => t.value === orderType)?.description}
          </p>
        </div>

        {/* Quantity / Notional Toggle */}
        <div className="form-group">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              {useNotional ? 'Dollar Amount' : 'Shares'}
            </label>
            <button
              type="button"
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={() => setUseNotional(!useNotional)}
            >
              Switch to {useNotional ? 'shares' : 'dollars'}
            </button>
          </div>

          {useNotional ? (
            <div className="relative">
              <span className="absolute left-3 top-2" style={{ color: 'var(--text-muted)' }}>{currency}</span>
              <input
                type="number"
                value={notional}
                onChange={(e) => setNotional(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full pl-7 pr-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                style={{ background: 'var(--bg-tertiary)', border: `1px solid ${errors.notional ? '#ef4444' : 'var(--border)'}`, color: 'var(--text-primary)' }}
                data-testid="notional-input"
              />
              {errors.notional && (
                <p className="text-red-500 text-xs mt-1">{errors.notional}</p>
              )}
            </div>
          ) : (
            <>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                step="1"
                min="0"
                className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                style={{ background: 'var(--bg-tertiary)', border: `1px solid ${errors.quantity ? '#ef4444' : 'var(--border)'}`, color: 'var(--text-primary)' }}
                data-testid="quantity-input"
              />
              {errors.quantity && (
                <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
              )}
            </>
          )}

          {/* Quick fill buttons */}
          <div className="flex gap-2 mt-2">
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <button
                key={pct}
                type="button"
                className="flex-1 py-1 text-xs rounded transition-colors"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                onClick={() => handleQuickFill(pct)}
              >
                {pct === 1 ? 'Max' : `${pct * 100}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Limit Price (for limit/stop_limit orders) */}
        {(orderType === 'limit' || orderType === 'stop_limit') && (
          <div className="form-group">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Limit Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2" style={{ color: 'var(--text-muted)' }}>{currency}</span>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full pl-7 pr-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                style={{ background: 'var(--bg-tertiary)', border: `1px solid ${errors.limitPrice ? '#ef4444' : 'var(--border)'}`, color: 'var(--text-primary)' }}
                data-testid="limit-price-input"
              />
            </div>
            {errors.limitPrice && (
              <p className="text-red-500 text-xs mt-1">{errors.limitPrice}</p>
            )}
          </div>
        )}

        {/* Stop Price (for stop/stop_limit orders) */}
        {(orderType === 'stop' || orderType === 'stop_limit') && (
          <div className="form-group">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Stop Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2" style={{ color: 'var(--text-muted)' }}>{currency}</span>
              <input
                type="number"
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full pl-7 pr-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                style={{ background: 'var(--bg-tertiary)', border: `1px solid ${errors.stopPrice ? '#ef4444' : 'var(--border)'}`, color: 'var(--text-primary)' }}
                data-testid="stop-price-input"
              />
            </div>
            {errors.stopPrice && (
              <p className="text-red-500 text-xs mt-1">{errors.stopPrice}</p>
            )}
          </div>
        )}

        {/* Trailing Stop Options */}
        {orderType === 'trailing_stop' && (
          <div className="form-group">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Trail Amount
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  value={trailPercent}
                  onChange={(e) => {
                    setTrailPercent(e.target.value);
                    if (e.target.value) setTrailPrice('');
                  }}
                  placeholder="Trail %"
                  step="0.1"
                  min="0"
                  className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  data-testid="trail-percent-input"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2" style={{ color: 'var(--text-muted)' }}>{currency}</span>
                <input
                  type="number"
                  value={trailPrice}
                  onChange={(e) => {
                    setTrailPrice(e.target.value);
                    if (e.target.value) setTrailPercent('');
                  }}
                  placeholder="Trail $"
                  step="0.01"
                  min="0"
                  className="w-full pl-7 pr-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  data-testid="trail-price-input"
                />
              </div>
            </div>
            {errors.trailPercent && (
              <p className="text-red-500 text-xs mt-1">{errors.trailPercent}</p>
            )}
          </div>
        )}

        {/* Time in Force */}
        <div className="form-group">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Time in Force
          </label>
          <select
            value={timeInForce}
            onChange={(e) => setTimeInForce(e.target.value as TimeInForce)}
            className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            data-testid="time-in-force-select"
          >
            {TIME_IN_FORCE.map((tif) => (
              <option key={tif.value} value={tif.value}>
                {tif.label} - {tif.description}
              </option>
            ))}
          </select>
        </div>

        {/* Extended Hours */}
        {orderType === 'limit' && (
          <div className="form-group">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={extendedHours}
                onChange={(e) => setExtendedHours(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                style={{ borderColor: 'var(--border)' }}
                data-testid="extended-hours-checkbox"
              />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Allow extended hours trading
              </span>
            </label>
          </div>
        )}

        {/* Order Summary */}
        <div className="order-summary rounded-lg p-3 space-y-2" style={{ background: 'var(--bg-tertiary)' }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>Estimated {side === 'buy' ? 'Cost' : 'Proceeds'}</span>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {currency}{estimatedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>Estimated Fees</span>
            <span className="text-green-500 font-medium">
              {currency}0.00
              <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>(Commission-free)</span>
            </span>
          </div>
          {side === 'buy' && buyingPower > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Buying Power</span>
              <span className={estimatedValue > buyingPower ? 'text-red-500' : ''} style={estimatedValue > buyingPower ? undefined : { color: 'var(--text-primary)' }}>
                {currency}{buyingPower.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          {side === 'sell' && currentPosition > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Current Position</span>
              <span className={qty > currentPosition ? 'text-red-500' : ''} style={qty > currentPosition ? undefined : { color: 'var(--text-primary)' }}>
                {currentPosition} shares
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 px-4 rounded-lg transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold text-white transition-colors ${
              side === 'buy'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            data-testid="preview-order-button"
          >
            {isSubmitting ? 'Processing...' : `Review ${side === 'buy' ? 'Buy' : 'Sell'} Order`}
          </button>
        </div>
      </div>
    </form>
  );
}

export default OrderForm;
