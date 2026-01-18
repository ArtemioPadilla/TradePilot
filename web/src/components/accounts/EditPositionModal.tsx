import { useState } from 'react';
import { updateHolding, deleteHolding, reducePosition } from '../../lib/services/holdings';
import type { Holding, AssetType, Currency } from '../../types/portfolio';

interface EditPositionModalProps {
  userId: string;
  holding: Holding;
  accountCurrency: Currency;
  onClose: () => void;
  onSuccess: () => void;
}

type ModalMode = 'edit' | 'sell' | 'close';

const assetTypes: { value: AssetType; label: string }[] = [
  { value: 'stock', label: 'Stock' },
  { value: 'etf', label: 'ETF' },
  { value: 'mutual_fund', label: 'Mutual Fund' },
  { value: 'bond', label: 'Bond' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'option', label: 'Option' },
  { value: 'other', label: 'Other' },
];

export function EditPositionModal({
  userId,
  holding,
  accountCurrency,
  onClose,
  onSuccess,
}: EditPositionModalProps) {
  const [mode, setMode] = useState<ModalMode>('edit');
  const [name, setName] = useState(holding.name || '');
  const [assetType, setAssetType] = useState<AssetType>(holding.assetType);
  const [notes, setNotes] = useState(holding.notes || '');
  const [sellQuantity, setSellQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: accountCurrency,
    }).format(amount);
  }

  function formatPercent(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await updateHolding(userId, holding.id, {
        name: name.trim() || undefined,
        assetType,
        notes: notes.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to update position:', err);
      setError('Failed to update position. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSellShares(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const qty = parseFloat(sellQuantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity to sell');
      return;
    }

    if (qty > holding.quantity) {
      setError(`Cannot sell more than ${holding.quantity} shares`);
      return;
    }

    setLoading(true);

    try {
      const result = await reducePosition(userId, holding.id, qty);

      if (result.remaining === 0) {
        // Position was fully closed
        onSuccess();
      } else {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to sell shares:', err);
      setError('Failed to sell shares. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleClosePosition() {
    setError(null);
    setLoading(true);

    try {
      await deleteHolding(userId, holding.id);
      onSuccess();
    } catch (err) {
      console.error('Failed to close position:', err);
      setError('Failed to close position. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const sellQty = parseFloat(sellQuantity) || 0;
  const estimatedProceeds = sellQty * (holding.currentPrice || holding.costBasisPerShare);
  const costBasisSold = sellQty * holding.costBasisPerShare;
  const estimatedPL = estimatedProceeds - costBasisSold;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {mode === 'edit' && 'Edit Position'}
            {mode === 'sell' && 'Sell Shares'}
            {mode === 'close' && 'Close Position'}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Position Summary */}
        <div className="position-summary">
          <div className="summary-main">
            <span className="symbol">{holding.symbol}</span>
            {holding.name && <span className="name">{holding.name}</span>}
          </div>
          <div className="summary-details">
            <div className="detail">
              <span className="label">Shares</span>
              <span className="value">{holding.quantity.toLocaleString()}</span>
            </div>
            <div className="detail">
              <span className="label">Avg Cost</span>
              <span className="value">{formatCurrency(holding.costBasisPerShare)}</span>
            </div>
            <div className="detail">
              <span className="label">Market Value</span>
              <span className="value">{formatCurrency(holding.marketValue || holding.totalCostBasis)}</span>
            </div>
            <div className="detail">
              <span className="label">P&L</span>
              <span className={`value ${(holding.unrealizedPL || 0) >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(holding.unrealizedPL || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="mode-tabs">
          <button
            type="button"
            className={`tab ${mode === 'edit' ? 'active' : ''}`}
            onClick={() => setMode('edit')}
          >
            Edit
          </button>
          <button
            type="button"
            className={`tab ${mode === 'sell' ? 'active' : ''}`}
            onClick={() => setMode('sell')}
          >
            Sell
          </button>
          <button
            type="button"
            className={`tab ${mode === 'close' ? 'active' : ''}`}
            onClick={() => setMode('close')}
          >
            Close
          </button>
        </div>

        <div className="modal-content">
          {error && <div className="form-error">{error}</div>}

          {/* Edit Mode */}
          {mode === 'edit' && (
            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label htmlFor="edit-name">Security Name</label>
                <input
                  type="text"
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Apple Inc."
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-type">Asset Type</label>
                <select
                  id="edit-type"
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value as AssetType)}
                >
                  {assetTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-notes">Notes</label>
                <textarea
                  id="edit-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any notes about this position..."
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Sell Mode */}
          {mode === 'sell' && (
            <form onSubmit={handleSellShares}>
              <div className="form-group">
                <label htmlFor="sell-quantity">Shares to Sell</label>
                <input
                  type="number"
                  id="sell-quantity"
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(e.target.value)}
                  placeholder="0"
                  min="0"
                  max={holding.quantity}
                  step="any"
                  required
                  data-testid="sell-quantity-input"
                />
                <span className="input-hint">
                  Available: {holding.quantity.toLocaleString()} shares
                </span>
              </div>

              <div className="quick-sell-buttons">
                <button
                  type="button"
                  className="quick-btn"
                  onClick={() => setSellQuantity((holding.quantity * 0.25).toString())}
                >
                  25%
                </button>
                <button
                  type="button"
                  className="quick-btn"
                  onClick={() => setSellQuantity((holding.quantity * 0.5).toString())}
                >
                  50%
                </button>
                <button
                  type="button"
                  className="quick-btn"
                  onClick={() => setSellQuantity((holding.quantity * 0.75).toString())}
                >
                  75%
                </button>
                <button
                  type="button"
                  className="quick-btn"
                  onClick={() => setSellQuantity(holding.quantity.toString())}
                >
                  All
                </button>
              </div>

              {sellQty > 0 && (
                <div className="sell-summary">
                  <div className="summary-row">
                    <span>Est. Proceeds</span>
                    <span>{formatCurrency(estimatedProceeds)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Cost Basis</span>
                    <span>{formatCurrency(costBasisSold)}</span>
                  </div>
                  <div className={`summary-row total ${estimatedPL >= 0 ? 'positive' : 'negative'}`}>
                    <span>Est. P&L</span>
                    <span>{formatCurrency(estimatedPL)} ({formatPercent(costBasisSold > 0 ? (estimatedPL / costBasisSold) * 100 : 0)})</span>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-warning"
                  disabled={loading || sellQty <= 0}
                  data-testid="sell-submit"
                >
                  {loading ? 'Processing...' : `Sell ${sellQty > 0 ? sellQty.toLocaleString() : ''} Shares`}
                </button>
              </div>
            </form>
          )}

          {/* Close Mode */}
          {mode === 'close' && (
            <div className="close-content">
              {!showCloseConfirm ? (
                <>
                  <p className="warning-text">
                    Closing this position will remove it from your portfolio. This does not record a sale transaction.
                  </p>
                  <p>
                    If you want to record a sale with proceeds and P&L, use the "Sell" tab instead.
                  </p>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => setShowCloseConfirm(true)}
                    >
                      Close Position
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="confirm-message">
                    <p>Are you sure you want to close your position in <strong>{holding.symbol}</strong>?</p>
                    <p className="confirm-details">
                      {holding.quantity.toLocaleString()} shares worth {formatCurrency(holding.marketValue || holding.totalCostBasis)}
                    </p>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowCloseConfirm(false)}
                      disabled={loading}
                    >
                      Go Back
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleClosePosition}
                      disabled={loading}
                    >
                      {loading ? 'Closing...' : 'Confirm Close'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <style>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
          }

          .modal {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            width: 100%;
            max-width: 480px;
            max-height: 90vh;
            overflow-y: auto;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid var(--border);
          }

          .modal-header h2 {
            font-size: 1.25rem;
            font-weight: 600;
            margin: 0;
            color: var(--text-primary);
          }

          .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: var(--text-muted);
            cursor: pointer;
            padding: 0;
            line-height: 1;
          }

          .modal-close:hover {
            color: var(--text-primary);
          }

          .position-summary {
            padding: 1rem 1.5rem;
            background: var(--bg-tertiary);
            border-bottom: 1px solid var(--border);
          }

          .summary-main {
            margin-bottom: 0.75rem;
          }

          .summary-main .symbol {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-right: 0.5rem;
          }

          .summary-main .name {
            font-size: 0.875rem;
            color: var(--text-muted);
          }

          .summary-details {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.5rem;
          }

          .detail {
            display: flex;
            flex-direction: column;
          }

          .detail .label {
            font-size: 0.7rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .detail .value {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-primary);
          }

          .detail .value.positive {
            color: var(--positive);
          }

          .detail .value.negative {
            color: var(--negative);
          }

          .mode-tabs {
            display: flex;
            border-bottom: 1px solid var(--border);
          }

          .tab {
            flex: 1;
            padding: 0.75rem 1rem;
            background: none;
            border: none;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-muted);
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
          }

          .tab:hover {
            color: var(--text-primary);
            background: var(--bg-tertiary);
          }

          .tab.active {
            color: var(--accent);
            border-bottom-color: var(--accent);
          }

          .modal-content {
            padding: 1.5rem;
          }

          .form-error {
            background: var(--negative-bg);
            color: var(--negative);
            padding: 0.75rem 1rem;
            border-radius: var(--radius-md);
            margin-bottom: 1rem;
            font-size: 0.875rem;
          }

          .form-group {
            margin-bottom: 1rem;
          }

          .form-group label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 0.375rem;
          }

          .form-group input,
          .form-group select,
          .form-group textarea {
            width: 100%;
            padding: 0.625rem 0.75rem;
            font-size: 0.9375rem;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            background: var(--bg-primary);
            color: var(--text-primary);
            transition: border-color 0.2s, box-shadow 0.2s;
          }

          .form-group input:focus,
          .form-group select:focus,
          .form-group textarea:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 3px var(--accent-bg, rgba(59, 130, 246, 0.1));
          }

          .form-group textarea {
            resize: vertical;
            min-height: 60px;
          }

          .input-hint {
            display: block;
            font-size: 0.75rem;
            color: var(--text-muted);
            margin-top: 0.25rem;
          }

          .quick-sell-buttons {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1rem;
          }

          .quick-btn {
            flex: 1;
            padding: 0.5rem;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s;
          }

          .quick-btn:hover {
            background: var(--border);
            color: var(--text-primary);
          }

          .sell-summary {
            background: var(--bg-tertiary);
            border-radius: var(--radius-md);
            padding: 1rem;
            margin-bottom: 1rem;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            font-size: 0.875rem;
            padding: 0.25rem 0;
          }

          .summary-row.total {
            border-top: 1px solid var(--border);
            margin-top: 0.5rem;
            padding-top: 0.5rem;
            font-weight: 600;
          }

          .summary-row.positive {
            color: var(--positive);
          }

          .summary-row.negative {
            color: var(--negative);
          }

          .warning-text {
            color: var(--text-muted);
            margin-bottom: 1rem;
          }

          .close-content p {
            margin: 0 0 1rem 0;
            color: var(--text-secondary);
          }

          .confirm-message {
            text-align: center;
            padding: 1rem 0;
          }

          .confirm-details {
            font-size: 1.125rem;
            color: var(--text-primary);
          }

          .form-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
            margin-top: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border);
          }

          .btn {
            padding: 0.625rem 1rem;
            border-radius: var(--radius-md);
            font-weight: 500;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
          }

          .btn-primary {
            background: var(--accent);
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            background: var(--accent-hover);
          }

          .btn-secondary {
            background: var(--bg-tertiary);
            color: var(--text-secondary);
          }

          .btn-secondary:hover:not(:disabled) {
            background: var(--border);
          }

          .btn-warning {
            background: var(--warning, #f59e0b);
            color: white;
          }

          .btn-warning:hover:not(:disabled) {
            opacity: 0.9;
          }

          .btn-danger {
            background: var(--negative);
            color: white;
          }

          .btn-danger:hover:not(:disabled) {
            opacity: 0.9;
          }

          .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          @media (max-width: 480px) {
            .summary-details {
              grid-template-columns: repeat(2, 1fr);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

export default EditPositionModal;
