/**
 * AddToWatchlistModal Component
 *
 * Modal for adding an asset to the watchlist with optional notes.
 */

import { useState } from 'react';
import { X, Star, Check } from 'lucide-react';

interface AddToWatchlistModalProps {
  symbol: string;
  name: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes?: string) => void;
  isLoading?: boolean;
}

export default function AddToWatchlistModal({
  symbol,
  name,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: AddToWatchlistModalProps) {
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(notes.trim() || undefined);
    setNotes('');
  };

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-icon">
            <Star size={20} />
          </div>
          <h3>Add to Watchlist</h3>
          <button className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="asset-preview">
            <span className="symbol">{symbol}</span>
            <span className="name">{name}</span>
          </div>

          <div className="form-group">
            <label htmlFor="watchlist-notes">Notes (optional)</label>
            <textarea
              id="watchlist-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add a note about why you're watching this asset..."
              rows={3}
              maxLength={200}
            />
            <span className="char-count">{notes.length}/200</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              'Adding...'
            ) : (
              <>
                <Check size={16} />
                Add to Watchlist
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal-content {
          background-color: var(--bg-secondary);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          width: 100%;
          max-width: 420px;
          box-shadow: var(--shadow-xl);
          animation: slideUp 0.2s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.25rem;
          border-bottom: 1px solid var(--border);
        }

        .header-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(var(--accent-rgb), 0.1);
          border-radius: var(--radius-md);
          color: var(--accent);
        }

        .modal-header h3 {
          flex: 1;
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .close-btn {
          padding: 0.5rem;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: all 0.15s ease;
        }

        .close-btn:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .modal-body {
          padding: 1.25rem;
        }

        .asset-preview {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 1rem;
          background-color: var(--bg-tertiary);
          border-radius: var(--radius-md);
          margin-bottom: 1.25rem;
        }

        .asset-preview .symbol {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--accent);
        }

        .asset-preview .name {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .form-group textarea {
          padding: 0.75rem;
          font-size: 0.875rem;
          color: var(--text-primary);
          background-color: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          resize: none;
          font-family: inherit;
          transition: border-color 0.15s ease;
        }

        .form-group textarea:focus {
          outline: none;
          border-color: var(--accent);
        }

        .form-group textarea::placeholder {
          color: var(--text-muted);
        }

        .char-count {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-align: right;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1.25rem;
          border-top: 1px solid var(--border);
          background-color: var(--bg-tertiary);
        }

        .btn-secondary {
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          background: none;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-secondary:hover {
          background-color: var(--bg-secondary);
          color: var(--text-primary);
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: white;
          background-color: var(--accent);
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-primary:hover:not(:disabled) {
          filter: brightness(1.1);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
