/**
 * OrderConfirmationModal Component
 *
 * Displays order details for user confirmation before submission.
 */

import { useState } from 'react';
import type { OrderRequest, AlpacaOrder } from '../../types/alpaca';

interface OrderConfirmationModalProps {
  /** Order details to confirm */
  order: OrderRequest;
  /** Estimated price per share */
  estimatedPrice: number;
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Callback to confirm and submit order */
  onConfirm: (order: OrderRequest) => Promise<AlpacaOrder>;
  /** Currency symbol */
  currency?: string;
  /** Current portfolio value for impact calculation */
  portfolioValue?: number;
  /** Current cash balance */
  cashBalance?: number;
  /** Current position in this symbol (shares) */
  currentShares?: number;
}

export function OrderConfirmationModal({
  order,
  estimatedPrice,
  isOpen,
  onClose,
  onConfirm,
  currency = '$',
  portfolioValue = 0,
  cashBalance = 0,
  currentShares = 0,
}: OrderConfirmationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<AlpacaOrder | null>(null);

  if (!isOpen) return null;

  const isBuy = order.side === 'buy';
  const estimatedTotal = (order.qty || 0) * estimatedPrice;

  // Calculate portfolio impact
  const currentPositionValue = currentShares * estimatedPrice;
  const currentAllocation = portfolioValue > 0 ? (currentPositionValue / portfolioValue) * 100 : 0;

  const newShares = isBuy
    ? currentShares + (order.qty || 0)
    : currentShares - (order.qty || 0);
  const newPositionValue = newShares * estimatedPrice;
  const newPortfolioValue = isBuy
    ? portfolioValue + estimatedTotal
    : portfolioValue - estimatedTotal + estimatedTotal; // For sells, portfolio value stays same (asset -> cash)
  const newAllocation = portfolioValue > 0 ? (newPositionValue / portfolioValue) * 100 : 0;

  const cashAfterTrade = isBuy
    ? cashBalance - estimatedTotal
    : cashBalance + estimatedTotal;
  const allocationChange = newAllocation - currentAllocation;

  // Order type labels
  const orderTypeLabels: Record<string, string> = {
    market: 'Market Order',
    limit: 'Limit Order',
    stop: 'Stop Order',
    stop_limit: 'Stop Limit Order',
    trailing_stop: 'Trailing Stop Order',
  };

  // Time in force labels
  const tifLabels: Record<string, string> = {
    day: 'Day Order',
    gtc: 'Good Til Canceled',
    opg: 'At Open',
    cls: 'At Close',
    ioc: 'Immediate or Cancel',
    fok: 'Fill or Kill',
  };

  // Warnings based on order configuration
  const warnings: string[] = [];

  if (order.type === 'market') {
    warnings.push('Market orders execute immediately at the best available price, which may differ from the current quote.');
  }

  if (order.extendedHours) {
    warnings.push('Extended hours trading may have lower liquidity and higher volatility.');
  }

  if (order.timeInForce === 'gtc') {
    warnings.push('Good til canceled orders remain active for up to 90 days.');
  }

  if (order.type === 'trailing_stop') {
    warnings.push('Trailing stop orders follow price movements and may execute during volatile periods.');
  }

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onConfirm(order);
      setSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    onClose();
  };

  return (
    <div
      className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
      data-testid="order-confirmation-modal"
    >
      <div
        className="modal-content bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`modal-header p-4 rounded-t-xl ${
            isBuy ? 'bg-green-600' : 'bg-red-600'
          } text-white`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {success ? 'Order Submitted' : 'Confirm Order'}
            </h2>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm opacity-90 mt-1">
            {orderTypeLabels[order.type]} • {tifLabels[order.timeInForce]}
          </p>
        </div>

        {/* Success State */}
        {success && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Order Submitted Successfully
            </h3>
            <p className="text-gray-600 mb-4">
              Your {order.side} order for {order.symbol} has been placed.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Order ID</span>
                <span className="font-mono text-xs">{success.id.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Status</span>
                <span className="capitalize">{success.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Submitted At</span>
                <span>{new Date(success.submittedAt).toLocaleTimeString()}</span>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="mt-6 w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {/* Error State */}
        {error && !success && (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-medium text-red-800">Order Failed</h4>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Confirmation State */}
        {!success && !error && (
          <div className="p-6">
            {/* Order Details */}
            <div className="order-details space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Action</span>
                <span className={`font-semibold ${isBuy ? 'text-green-600' : 'text-red-600'}`}>
                  {isBuy ? 'BUY' : 'SELL'}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Symbol</span>
                <span className="font-semibold">{order.symbol}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">
                  {order.notional ? 'Dollar Amount' : 'Quantity'}
                </span>
                <span className="font-semibold">
                  {order.notional
                    ? `${currency}${order.notional.toLocaleString()}`
                    : `${order.qty} shares`}
                </span>
              </div>

              {order.limitPrice && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Limit Price</span>
                  <span className="font-semibold">{currency}{order.limitPrice.toFixed(2)}</span>
                </div>
              )}

              {order.stopPrice && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Stop Price</span>
                  <span className="font-semibold">{currency}{order.stopPrice.toFixed(2)}</span>
                </div>
              )}

              {order.trailPercent && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Trail Percent</span>
                  <span className="font-semibold">{order.trailPercent}%</span>
                </div>
              )}

              {order.trailPrice && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Trail Price</span>
                  <span className="font-semibold">{currency}{order.trailPrice.toFixed(2)}</span>
                </div>
              )}

              {order.extendedHours && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Extended Hours</span>
                  <span className="font-semibold text-blue-600">Enabled</span>
                </div>
              )}

              <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-3 mt-4">
                <span className="text-gray-700 font-medium">
                  Estimated {isBuy ? 'Cost' : 'Proceeds'}
                </span>
                <span className="text-xl font-bold">
                  {currency}{estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Portfolio Impact Section */}
            {portfolioValue > 0 && (
              <div className="portfolio-impact bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6" data-testid="portfolio-impact">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Portfolio Impact
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Position Weight</span>
                    <span className="text-blue-900">
                      {currentAllocation.toFixed(2)}%
                      <span className="mx-1">→</span>
                      <span className={`font-semibold ${allocationChange > 0 ? 'text-green-600' : allocationChange < 0 ? 'text-red-600' : ''}`}>
                        {newAllocation.toFixed(2)}%
                      </span>
                      <span className={`text-xs ml-1 ${allocationChange > 0 ? 'text-green-600' : allocationChange < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        ({allocationChange > 0 ? '+' : ''}{allocationChange.toFixed(2)}%)
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Cash After Trade</span>
                    <span className={`font-medium ${cashAfterTrade < 0 ? 'text-red-600' : 'text-blue-900'}`}>
                      {currency}{Math.max(0, cashAfterTrade).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">New Position Size</span>
                    <span className="text-blue-900">
                      {newShares.toLocaleString()} shares
                      <span className="text-xs text-gray-500 ml-1">
                        ({currency}{newPositionValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="warnings bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                data-testid="cancel-order-button"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className={`flex-1 py-3 rounded-lg font-semibold text-white transition-colors ${
                  isBuy
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                data-testid="confirm-order-button"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  `Confirm ${isBuy ? 'Buy' : 'Sell'}`
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              By confirming, you agree to execute this trade at Alpaca Markets.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderConfirmationModal;
