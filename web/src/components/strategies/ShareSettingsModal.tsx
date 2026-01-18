/**
 * Share Settings Modal Component
 *
 * Modal for configuring strategy sharing settings.
 */

import { useState } from 'react';
import type { Strategy, StrategyShareSettings } from '../../types/strategies';

export interface ShareSettingsModalProps {
  strategy: Strategy;
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: StrategyShareSettings) => Promise<void>;
}

export function ShareSettingsModal({
  strategy,
  isOpen,
  onClose,
  onSave,
}: ShareSettingsModalProps) {
  const [isPublic, setIsPublic] = useState(strategy.isPublic);
  const [authorVisible, setAuthorVisible] = useState(strategy.authorVisible);
  const [allowCopy, setAllowCopy] = useState(strategy.allowCopy);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        isPublic,
        authorVisible,
        allowCopy,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      data-testid="share-settings-modal"
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2>Share Settings</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <p className="strategy-name">
            Sharing settings for <strong>{strategy.name}</strong>
          </p>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="settings-list">
            {/* Public Toggle */}
            <div className="setting-item">
              <div className="setting-info">
                <label htmlFor="isPublic" className="setting-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  Make Public
                </label>
                <p className="setting-description">
                  Allow others to view this strategy in the public browser
                </p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  data-testid="public-toggle"
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Author Visibility Toggle */}
            <div className={`setting-item ${!isPublic ? 'disabled' : ''}`}>
              <div className="setting-info">
                <label htmlFor="authorVisible" className="setting-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Show Author Name
                </label>
                <p className="setting-description">
                  Display your name as the strategy author
                </p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  id="authorVisible"
                  checked={authorVisible}
                  onChange={(e) => setAuthorVisible(e.target.checked)}
                  disabled={!isPublic}
                  data-testid="author-toggle"
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Allow Copy Toggle */}
            <div className={`setting-item ${!isPublic ? 'disabled' : ''}`}>
              <div className="setting-info">
                <label htmlFor="allowCopy" className="setting-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Allow Copying
                </label>
                <p className="setting-description">
                  Let others copy this strategy to their account
                </p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  id="allowCopy"
                  checked={allowCopy}
                  onChange={(e) => setAllowCopy(e.target.checked)}
                  disabled={!isPublic}
                  data-testid="copy-toggle"
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          {isPublic && (
            <div className="public-info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <p>
                Public strategies will show your backtest performance metrics.
                {strategy.copyCount > 0 && ` This strategy has been copied ${strategy.copyCount} time${strategy.copyCount === 1 ? '' : 's'}.`}
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="cancel-button"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="save-button"
            onClick={handleSave}
            disabled={isSaving}
            data-testid="save-share-settings"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background-color: var(--bg-primary, white);
    border-radius: var(--radius-lg, 0.75rem);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
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
    border-bottom: 1px solid var(--border, #e5e7eb);
  }

  .modal-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0;
  }

  .close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    border-radius: var(--radius-md, 0.375rem);
    color: var(--text-muted, #6b7280);
    cursor: pointer;
    transition: all 0.2s;
  }

  .close-button:hover {
    background-color: var(--bg-tertiary, #f3f4f6);
    color: var(--text-primary, #111827);
  }

  .modal-body {
    padding: 1.5rem;
  }

  .strategy-name {
    color: var(--text-secondary, #4b5563);
    font-size: 0.9375rem;
    margin: 0 0 1.25rem 0;
  }

  .strategy-name strong {
    color: var(--text-primary, #111827);
  }

  .error-message {
    background-color: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .settings-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1rem;
    background-color: var(--bg-secondary, #f8f9fa);
    border-radius: var(--radius-md, 0.375rem);
    transition: opacity 0.2s;
  }

  .setting-item.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .setting-info {
    flex: 1;
    margin-right: 1rem;
  }

  .setting-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    color: var(--text-primary, #111827);
    margin-bottom: 0.25rem;
    cursor: pointer;
  }

  .setting-label svg {
    color: var(--text-muted, #6b7280);
  }

  .setting-description {
    font-size: 0.8125rem;
    color: var(--text-muted, #6b7280);
    margin: 0;
    line-height: 1.4;
  }

  /* Toggle Switch */
  .toggle {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 26px;
    flex-shrink: 0;
  }

  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background-color: var(--border, #e5e7eb);
    border-radius: 13px;
    transition: background-color 0.2s;
  }

  .toggle-slider::before {
    content: '';
    position: absolute;
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .toggle input:checked + .toggle-slider {
    background-color: var(--accent, #6366f1);
  }

  .toggle input:checked + .toggle-slider::before {
    transform: translateX(22px);
  }

  .toggle input:disabled + .toggle-slider {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .public-info {
    display: flex;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    margin-top: 1rem;
    background-color: rgba(99, 102, 241, 0.1);
    border-radius: var(--radius-md, 0.375rem);
    color: var(--accent, #6366f1);
    font-size: 0.8125rem;
    line-height: 1.5;
  }

  .public-info svg {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .public-info p {
    margin: 0;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border, #e5e7eb);
  }

  .cancel-button,
  .save-button {
    padding: 0.625rem 1.25rem;
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cancel-button {
    background-color: var(--bg-tertiary, #f3f4f6);
    border: 1px solid var(--border, #e5e7eb);
    color: var(--text-primary, #111827);
  }

  .cancel-button:hover:not(:disabled) {
    background-color: var(--bg-secondary, #e5e7eb);
  }

  .save-button {
    background-color: var(--accent, #6366f1);
    border: none;
    color: white;
  }

  .save-button:hover:not(:disabled) {
    background-color: var(--accent-hover, #4f46e5);
  }

  .cancel-button:disabled,
  .save-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    .modal-content {
      max-height: 100vh;
      border-radius: 0;
    }

    .modal-footer {
      flex-direction: column;
    }

    .cancel-button,
    .save-button {
      width: 100%;
    }
  }
`;

export default ShareSettingsModal;
