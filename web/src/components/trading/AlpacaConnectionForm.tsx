import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import {
  getAlpacaCredentials,
  saveAlpacaCredentials,
  deleteAlpacaCredentials,
  testAlpacaConnection,
} from '../../lib/services/alpaca';
import type { AlpacaEnvironment, AlpacaAccount } from '../../types/alpaca';

interface AlpacaConnectionFormProps {
  onConnectionChange?: (connected: boolean, account?: AlpacaAccount) => void;
}

export function AlpacaConnectionForm({ onConnectionChange }: AlpacaConnectionFormProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Form state
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [environment, setEnvironment] = useState<AlpacaEnvironment>('paper');
  const [showSecret, setShowSecret] = useState(false);

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<AlpacaAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Whether we're editing existing credentials
  const [isEditing, setIsEditing] = useState(false);
  const [hasExistingCredentials, setHasExistingCredentials] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) {
      loadCredentials();
    }
  }, [userId]);

  async function loadCredentials() {
    if (!userId) return;

    try {
      setLoading(true);
      const credentials = await getAlpacaCredentials(userId);

      if (credentials) {
        setHasExistingCredentials(true);
        setApiKey(credentials.apiKey);
        setEnvironment(credentials.environment);
        // Don't show the actual secret
        setApiSecret('');

        // Try to connect
        try {
          const accountInfo = await testAlpacaConnection(
            credentials.apiKey,
            credentials.apiSecret,
            credentials.environment
          );
          setIsConnected(true);
          setAccount(accountInfo);
          onConnectionChange?.(true, accountInfo);
        } catch (err) {
          setIsConnected(false);
          setError('Saved credentials are invalid. Please update them.');
        }
      }
    } catch (err) {
      console.error('Failed to load credentials:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTestConnection() {
    if (!apiKey || !apiSecret) {
      setError('Please enter both API Key and API Secret');
      return;
    }

    setTesting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const accountInfo = await testAlpacaConnection(apiKey, apiSecret, environment);
      setAccount(accountInfo);
      setSuccessMessage(`Connected to ${environment === 'paper' ? 'Paper' : 'Live'} trading account!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setAccount(null);
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    if (!userId || !apiKey || !apiSecret) {
      setError('Please enter both API Key and API Secret');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Test connection first
      const accountInfo = await testAlpacaConnection(apiKey, apiSecret, environment);

      // Save credentials
      await saveAlpacaCredentials(userId, apiKey, apiSecret, environment);

      setIsConnected(true);
      setAccount(accountInfo);
      setHasExistingCredentials(true);
      setIsEditing(false);
      setSuccessMessage('Credentials saved successfully!');
      onConnectionChange?.(true, accountInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save credentials');
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    if (!userId) return;

    if (!confirm('Are you sure you want to disconnect your Alpaca account?')) {
      return;
    }

    try {
      await deleteAlpacaCredentials(userId);
      setIsConnected(false);
      setAccount(null);
      setApiKey('');
      setApiSecret('');
      setHasExistingCredentials(false);
      setSuccessMessage('Disconnected successfully');
      onConnectionChange?.(false);
    } catch (err) {
      setError('Failed to disconnect');
    }
  }

  function handleEdit() {
    setIsEditing(true);
    setApiSecret('');
    setError(null);
    setSuccessMessage(null);
  }

  function handleCancel() {
    setIsEditing(false);
    setApiSecret('');
    setError(null);
    loadCredentials();
  }

  if (loading) {
    return (
      <div className="alpaca-connection loading">
        <div className="loading-spinner"></div>
        <p>Loading connection status...</p>
      </div>
    );
  }

  return (
    <div className="alpaca-connection" data-testid="alpaca-connection-form">
      <div className="connection-header">
        <div className="header-info">
          <h3>Alpaca Trading</h3>
          <p className="description">
            Connect your Alpaca account to enable automated trading and real-time portfolio sync.
          </p>
        </div>
        {isConnected && !isEditing && (
          <div className="connection-status connected">
            <span className="status-dot"></span>
            Connected
          </div>
        )}
      </div>

      {/* Connected State */}
      {isConnected && !isEditing && account && (
        <div className="connected-info">
          <div className="account-summary">
            <div className="account-item">
              <span className="label">Account</span>
              <span className="value">{account.accountNumber}</span>
            </div>
            <div className="account-item">
              <span className="label">Environment</span>
              <span className={`value env-badge ${environment}`}>
                {environment === 'paper' ? 'Paper Trading' : 'Live Trading'}
              </span>
            </div>
            <div className="account-item">
              <span className="label">Buying Power</span>
              <span className="value">
                ${account.buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="account-item">
              <span className="label">Portfolio Value</span>
              <span className="value">
                ${account.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="connected-actions">
            <button onClick={handleEdit} className="btn btn-secondary">
              Update Credentials
            </button>
            <button onClick={handleDisconnect} className="btn btn-danger">
              Disconnect
            </button>
          </div>
        </div>
      )}

      {/* Form State */}
      {(!isConnected || isEditing) && (
        <div className="connection-form">
          {/* Environment Toggle */}
          <div className="form-group">
            <label>Trading Environment</label>
            <div className="environment-toggle">
              <button
                type="button"
                className={`env-btn ${environment === 'paper' ? 'active' : ''}`}
                onClick={() => setEnvironment('paper')}
              >
                <span className="env-icon">📝</span>
                Paper Trading
                <span className="env-desc">Practice with fake money</span>
              </button>
              <button
                type="button"
                className={`env-btn ${environment === 'live' ? 'active' : ''}`}
                onClick={() => setEnvironment('live')}
              >
                <span className="env-icon">💰</span>
                Live Trading
                <span className="env-desc">Real money trading</span>
              </button>
            </div>
          </div>

          {/* API Key */}
          <div className="form-group">
            <label htmlFor="api-key">API Key</label>
            <input
              id="api-key"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Alpaca API Key"
              autoComplete="off"
              data-testid="alpaca-api-key"
            />
          </div>

          {/* API Secret */}
          <div className="form-group">
            <label htmlFor="api-secret">
              API Secret
              {hasExistingCredentials && !isEditing && (
                <span className="hint">(hidden for security)</span>
              )}
            </label>
            <div className="secret-input">
              <input
                id="api-secret"
                type={showSecret ? 'text' : 'password'}
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder={hasExistingCredentials ? 'Enter new secret to update' : 'Enter your Alpaca API Secret'}
                autoComplete="off"
                data-testid="alpaca-api-secret"
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowSecret(!showSecret)}
                aria-label={showSecret ? 'Hide secret' : 'Show secret'}
              >
                {showSecret ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="message error" data-testid="connection-error">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="message success" data-testid="connection-success">
              {successMessage}
            </div>
          )}

          {/* Account Preview */}
          {account && !isConnected && (
            <div className="account-preview">
              <h4>Account Preview</h4>
              <div className="preview-grid">
                <div>
                  <span className="label">Account</span>
                  <span className="value">{account.accountNumber}</span>
                </div>
                <div>
                  <span className="label">Status</span>
                  <span className="value">{account.status}</span>
                </div>
                <div>
                  <span className="label">Buying Power</span>
                  <span className="value">${account.buyingPower.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="form-actions">
            {isEditing && (
              <button onClick={handleCancel} className="btn btn-secondary">
                Cancel
              </button>
            )}
            <button
              onClick={handleTestConnection}
              className="btn btn-secondary"
              disabled={testing || !apiKey || !apiSecret}
              data-testid="test-connection-btn"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
              disabled={saving || !apiKey || !apiSecret}
              data-testid="save-credentials-btn"
            >
              {saving ? 'Saving...' : 'Save & Connect'}
            </button>
          </div>

          {/* Help Text */}
          <div className="help-text">
            <p>
              Get your API keys from the{' '}
              <a href="https://app.alpaca.markets/paper/dashboard/overview" target="_blank" rel="noopener noreferrer">
                Alpaca Dashboard
              </a>
              .
            </p>
            <p className="warning">
              ⚠️ Never share your API secret. We store credentials securely and never expose them.
            </p>
          </div>
        </div>
      )}

      <style>{`
        .alpaca-connection {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 12px);
          padding: 1.5rem;
        }

        .alpaca-connection.loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          color: var(--text-muted);
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .connection-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .header-info h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          color: var(--text-primary);
        }

        .header-info .description {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin: 0;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0.375rem 0.75rem;
          border-radius: var(--radius-full, 999px);
        }

        .connection-status.connected {
          background: var(--positive-bg, rgba(16, 185, 129, 0.1));
          color: var(--positive, #10b981);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }

        .connected-info {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .account-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .account-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .account-item .label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .account-item .value {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .env-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm, 4px);
          font-size: 0.75rem;
        }

        .env-badge.paper {
          background: var(--accent-bg, rgba(59, 130, 246, 0.1));
          color: var(--accent);
        }

        .env-badge.live {
          background: var(--warning-bg, rgba(245, 158, 11, 0.1));
          color: var(--warning, #f59e0b);
        }

        .connected-actions {
          display: flex;
          gap: 0.75rem;
        }

        .connection-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .form-group .hint {
          font-weight: 400;
          color: var(--text-muted);
          margin-left: 0.5rem;
        }

        .form-group input {
          padding: 0.75rem;
          font-size: 0.875rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md, 8px);
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-bg, rgba(59, 130, 246, 0.1));
        }

        .secret-input {
          position: relative;
        }

        .secret-input input {
          width: 100%;
          padding-right: 3rem;
        }

        .toggle-visibility {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          padding: 0.25rem;
        }

        .environment-toggle {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }

        .env-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 1rem;
          border: 2px solid var(--border);
          border-radius: var(--radius-md, 8px);
          background: var(--bg-primary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .env-btn:hover {
          border-color: var(--accent);
        }

        .env-btn.active {
          border-color: var(--accent);
          background: var(--accent-bg, rgba(59, 130, 246, 0.1));
        }

        .env-icon {
          font-size: 1.5rem;
        }

        .env-btn .env-desc {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .message {
          padding: 0.75rem;
          border-radius: var(--radius-md, 8px);
          font-size: 0.875rem;
        }

        .message.error {
          background: var(--negative-bg, rgba(239, 68, 68, 0.1));
          color: var(--negative, #ef4444);
        }

        .message.success {
          background: var(--positive-bg, rgba(16, 185, 129, 0.1));
          color: var(--positive, #10b981);
        }

        .account-preview {
          background: var(--bg-tertiary);
          border-radius: var(--radius-md, 8px);
          padding: 1rem;
        }

        .account-preview h4 {
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0 0 0.75rem 0;
          color: var(--text-primary);
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .preview-grid .label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .preview-grid .value {
          display: block;
          font-weight: 500;
          color: var(--text-primary);
        }

        .form-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }

        .btn {
          padding: 0.625rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 500;
          border: none;
          border-radius: var(--radius-md, 8px);
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: var(--accent);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--accent-hover, #2563eb);
        }

        .btn-secondary {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--border);
        }

        .btn-danger {
          background: var(--negative, #ef4444);
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          opacity: 0.9;
        }

        .help-text {
          font-size: 0.75rem;
          color: var(--text-muted);
          border-top: 1px solid var(--border);
          padding-top: 1rem;
        }

        .help-text p {
          margin: 0 0 0.5rem 0;
        }

        .help-text a {
          color: var(--accent);
          text-decoration: none;
        }

        .help-text a:hover {
          text-decoration: underline;
        }

        .help-text .warning {
          color: var(--warning, #f59e0b);
        }

        @media (max-width: 640px) {
          .connection-header {
            flex-direction: column;
            gap: 1rem;
          }

          .environment-toggle {
            grid-template-columns: 1fr;
          }

          .preview-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .form-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default AlpacaConnectionForm;
