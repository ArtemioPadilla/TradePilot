import { useState } from 'react';
import { createAccount } from '../../lib/services/accounts';
import type { AccountType, Currency, AccountFormData } from '../../types/portfolio';

interface AddAccountModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const accountTypes: { value: AccountType; label: string }[] = [
  { value: 'brokerage', label: 'Brokerage' },
  { value: '401k', label: '401(k)' },
  { value: 'ira', label: 'Traditional IRA' },
  { value: 'roth_ira', label: 'Roth IRA' },
  { value: 'crypto', label: 'Crypto Exchange' },
  { value: 'bank', label: 'Bank Account' },
  { value: 'other', label: 'Other' },
];

const currencies: { value: Currency; label: string }[] = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'AUD', label: 'AUD ($)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'CHF', label: 'CHF' },
];

export function AddAccountModal({ userId, onClose, onSuccess }: AddAccountModalProps) {
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    type: 'brokerage',
    institution: '',
    currency: 'USD',
    cashBalance: 0,
    notes: '',
    isDefault: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Account name is required');
      return;
    }

    try {
      setLoading(true);
      await createAccount(userId, formData);
      onSuccess();
    } catch (err) {
      console.error('Failed to create account:', err);
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              type === 'number' ? parseFloat(value) || 0 : value,
    }));
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>Add New Account</h2>
          <button onClick={onClose} className="close-btn" aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="name">Account Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Main Brokerage"
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Account Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                {accountTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="currency">Currency</label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
              >
                {currencies.map((curr) => (
                  <option key={curr.value} value={curr.value}>
                    {curr.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="institution">Institution (optional)</label>
            <input
              type="text"
              id="institution"
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              placeholder="e.g., Fidelity, Schwab, Coinbase"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cashBalance">Starting Cash Balance</label>
            <div className="input-with-prefix">
              <span className="input-prefix">$</span>
              <input
                type="number"
                id="cashBalance"
                name="cashBalance"
                value={formData.cashBalance || ''}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes about this account..."
              rows={3}
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
              />
              <span>Set as default account</span>
            </label>
            <p className="help-text">
              New positions will be added to the default account by default.
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
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

          .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: var(--text-muted);
            cursor: pointer;
            padding: 0;
            line-height: 1;
          }

          .close-btn:hover {
            color: var(--text-primary);
          }

          .modal-form {
            padding: 1.5rem;
          }

          .form-group {
            margin-bottom: 1.25rem;
          }

          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }

          label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 0.5rem;
          }

          input[type="text"],
          input[type="number"],
          select,
          textarea {
            width: 100%;
            padding: 0.625rem 0.75rem;
            background: var(--bg-primary);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            color: var(--text-primary);
            font-size: 0.875rem;
          }

          input:focus,
          select:focus,
          textarea:focus {
            outline: none;
            border-color: var(--accent);
          }

          textarea {
            resize: vertical;
            min-height: 80px;
          }

          .input-with-prefix {
            position: relative;
          }

          .input-prefix {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
          }

          .input-with-prefix input {
            padding-left: 1.5rem;
          }

          .checkbox-group {
            padding: 0.75rem;
            background: var(--bg-tertiary);
            border-radius: var(--radius-md);
          }

          .checkbox-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            margin-bottom: 0.25rem;
          }

          .checkbox-label input {
            width: auto;
          }

          .checkbox-label span {
            font-weight: 500;
            color: var(--text-primary);
          }

          .help-text {
            font-size: 0.75rem;
            color: var(--text-muted);
            margin: 0;
          }

          .error-message {
            background: var(--negative-bg);
            color: var(--negative);
            padding: 0.75rem;
            border-radius: var(--radius-md);
            margin-bottom: 1rem;
            font-size: 0.875rem;
          }

          .modal-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
            padding-top: 0.5rem;
          }

          .btn {
            padding: 0.625rem 1.25rem;
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

          .btn-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .btn-secondary {
            background: var(--bg-tertiary);
            color: var(--text-secondary);
          }

          .btn-secondary:hover {
            background: var(--border);
          }

          @media (max-width: 480px) {
            .form-row {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

export default AddAccountModal;
