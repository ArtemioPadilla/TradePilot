import { useState } from 'react';
import { createHolding, getHoldingBySymbol, addToPosition } from '../../lib/services/holdings';
import type { HoldingFormData, AssetType, Currency } from '../../types/portfolio';

interface AddPositionModalProps {
  userId: string;
  accountId: string;
  accountCurrency: Currency;
  onClose: () => void;
  onSuccess: () => void;
}

const assetTypes: { value: AssetType; label: string }[] = [
  { value: 'stock', label: 'Stock' },
  { value: 'etf', label: 'ETF' },
  { value: 'mutual_fund', label: 'Mutual Fund' },
  { value: 'bond', label: 'Bond' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'option', label: 'Option' },
  { value: 'other', label: 'Other' },
];

export function AddPositionModal({
  userId,
  accountId,
  accountCurrency,
  onClose,
  onSuccess,
}: AddPositionModalProps) {
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('stock');
  const [quantity, setQuantity] = useState('');
  const [costBasisPerShare, setCostBasisPerShare] = useState('');
  const [openDate, setOpenDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingPosition, setExistingPosition] = useState<{
    id: string;
    quantity: number;
    costBasisPerShare: number;
  } | null>(null);

  const totalCostBasis =
    (parseFloat(quantity) || 0) * (parseFloat(costBasisPerShare) || 0);

  async function checkExistingPosition() {
    if (!symbol.trim()) return;

    try {
      const existing = await getHoldingBySymbol(userId, accountId, symbol.trim().toUpperCase());
      if (existing) {
        setExistingPosition({
          id: existing.id,
          quantity: existing.quantity,
          costBasisPerShare: existing.costBasisPerShare,
        });
      } else {
        setExistingPosition(null);
      }
    } catch (err) {
      console.error('Error checking existing position:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!symbol.trim()) {
      setError('Symbol is required');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity greater than 0');
      return;
    }

    const costBasis = parseFloat(costBasisPerShare);
    if (isNaN(costBasis) || costBasis < 0) {
      setError('Please enter a valid cost basis per share');
      return;
    }

    setLoading(true);

    try {
      if (existingPosition) {
        // Add to existing position
        await addToPosition(userId, existingPosition.id, qty, costBasis);
      } else {
        // Create new holding
        const formData: HoldingFormData = {
          accountId,
          symbol: symbol.trim().toUpperCase(),
          name: name.trim() || undefined,
          assetType,
          quantity: qty,
          costBasisPerShare: costBasis,
          currency: accountCurrency,
          openDate: new Date(openDate),
          notes: notes.trim() || undefined,
        };

        await createHolding(userId, formData);
      }

      onSuccess();
    } catch (err) {
      console.error('Failed to add position:', err);
      setError('Failed to add position. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: accountCurrency,
    }).format(amount);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{existingPosition ? 'Add to Position' : 'Add Position'}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          {existingPosition && (
            <div className="existing-position-notice">
              <p>
                You already have a position in <strong>{symbol.toUpperCase()}</strong>.
              </p>
              <p>
                Current: {existingPosition.quantity} shares @ {formatCurrency(existingPosition.costBasisPerShare)}
              </p>
              <p>Adding shares will update your average cost basis.</p>
            </div>
          )}

          <div className="form-row">
            <div className="form-group flex-2">
              <label htmlFor="position-symbol">Symbol *</label>
              <input
                type="text"
                id="position-symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                onBlur={checkExistingPosition}
                placeholder="e.g., AAPL"
                required
                autoFocus
                data-testid="position-symbol-input"
              />
            </div>
            <div className="form-group flex-1">
              <label htmlFor="position-type">Type</label>
              <select
                id="position-type"
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
          </div>

          <div className="form-group">
            <label htmlFor="position-name">Security Name (optional)</label>
            <input
              type="text"
              id="position-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Apple Inc."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="position-quantity">Quantity *</label>
              <input
                type="number"
                id="position-quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                min="0"
                step="any"
                required
                data-testid="position-quantity-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="position-cost-basis">Cost Per Share *</label>
              <input
                type="number"
                id="position-cost-basis"
                value={costBasisPerShare}
                onChange={(e) => setCostBasisPerShare(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
                data-testid="position-cost-basis-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="position-date">Purchase Date</label>
            <input
              type="date"
              id="position-date"
              value={openDate}
              onChange={(e) => setOpenDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="cost-summary">
            <span>Total Cost Basis:</span>
            <span className="cost-value">{formatCurrency(totalCostBasis)}</span>
          </div>

          <div className="form-group">
            <label htmlFor="position-notes">Notes (optional)</label>
            <textarea
              id="position-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this position..."
              rows={2}
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
              data-testid="add-position-submit"
            >
              {loading ? 'Adding...' : existingPosition ? 'Add Shares' : 'Add Position'}
            </button>
          </div>
        </form>

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
            max-width: 500px;
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

          form {
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

          .existing-position-notice {
            background: var(--accent-bg, rgba(59, 130, 246, 0.1));
            border: 1px solid var(--accent);
            border-radius: var(--radius-md);
            padding: 0.75rem 1rem;
            margin-bottom: 1rem;
            font-size: 0.875rem;
          }

          .existing-position-notice p {
            margin: 0 0 0.25rem 0;
            color: var(--text-secondary);
          }

          .existing-position-notice p:last-child {
            margin-bottom: 0;
          }

          .form-row {
            display: flex;
            gap: 1rem;
          }

          .form-row .form-group {
            flex: 1;
          }

          .form-row .flex-2 {
            flex: 2;
          }

          .form-row .flex-1 {
            flex: 1;
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

          .cost-summary {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 1rem;
            background: var(--bg-tertiary);
            border-radius: var(--radius-md);
            margin-bottom: 1rem;
          }

          .cost-summary span {
            font-size: 0.875rem;
            color: var(--text-secondary);
          }

          .cost-value {
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--text-primary) !important;
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

          .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          @media (max-width: 480px) {
            .form-row {
              flex-direction: column;
              gap: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

export default AddPositionModal;
