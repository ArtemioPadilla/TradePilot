import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '../../lib/firebase';
import {
  getAlpacaCredentials,
  saveAlpacaCredentials,
  deleteAlpacaCredentials,
  testAlpacaConnection,
} from '../../lib/services/alpaca';
import type { AlpacaEnvironment, AlpacaAccount } from '../../types/alpaca';

// Simple SVG icons to avoid lucide-react hook conflicts
const FileTextIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const DollarSignIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

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
    const auth = getFirebaseAuth();
    if (!auth) return;
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
                <span className="env-icon">
                  <FileTextIcon />
                </span>
                Paper Trading
                <span className="env-desc">Practice with fake money</span>
              </button>
              <button
                type="button"
                className={`env-btn ${environment === 'live' ? 'active' : ''}`}
                onClick={() => setEnvironment('live')}
              >
                <span className="env-icon">
                  <DollarSignIcon />
                </span>
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
                {showSecret ? <EyeOffIcon /> : <EyeIcon />}
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
              <AlertTriangleIcon />
              Never share your API secret. We store credentials securely and never expose them.
            </p>
          </div>
        </div>
      )}

      <style>{`
        .alpaca-connection {
          background: var(--glass-bg, var(--bg-secondary));
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid var(--glass-border, var(--border));
          border-radius: var(--radius-xl, 16px);
          padding: var(--space-6, 1.5rem);
        }

        .alpaca-connection.loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 240px;
          color: var(--text-muted);
          gap: var(--space-4, 1rem);
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 2px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .connection-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-6, 1.5rem);
          gap: var(--space-4, 1rem);
        }

        .header-info h3 {
          font-size: var(--text-xl, 1.25rem);
          font-weight: 700;
          margin: 0 0 var(--space-2, 0.5rem) 0;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .header-info .description {
          font-size: var(--text-sm, 0.875rem);
          color: var(--text-muted);
          margin: 0;
          max-width: 400px;
          line-height: 1.5;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: var(--space-2, 0.5rem);
          font-size: var(--text-sm, 0.875rem);
          font-weight: 600;
          padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
          border-radius: var(--radius-full, 9999px);
          flex-shrink: 0;
        }

        .connection-status.connected {
          background: var(--positive-bg);
          color: var(--positive);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: var(--radius-full, 9999px);
          background: currentColor;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .connected-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-6, 1.5rem);
        }

        .account-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: var(--space-4, 1rem);
        }

        .account-item {
          display: flex;
          flex-direction: column;
          gap: var(--space-1, 0.25rem);
          padding: var(--space-4, 1rem);
          background: var(--bg-tertiary);
          border-radius: var(--radius-lg, 12px);
          transition: var(--transition-fast);
        }

        .account-item:hover {
          background: var(--bg-hover);
        }

        .account-item .label {
          font-size: var(--text-xs, 0.75rem);
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .account-item .value {
          font-size: var(--text-lg, 1.125rem);
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .env-badge {
          display: inline-flex;
          align-items: center;
          padding: var(--space-1, 0.25rem) var(--space-3, 0.75rem);
          border-radius: var(--radius-full, 9999px);
          font-size: var(--text-xs, 0.75rem);
          font-weight: 600;
        }

        .env-badge.paper {
          background: var(--accent-muted);
          color: var(--accent);
        }

        .env-badge.live {
          background: var(--warning-bg);
          color: var(--warning);
        }

        .connected-actions {
          display: flex;
          gap: var(--space-3, 0.75rem);
        }

        .connection-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-5, 1.25rem);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-2, 0.5rem);
        }

        .form-group label {
          font-size: var(--text-sm, 0.875rem);
          font-weight: 600;
          color: var(--text-primary);
        }

        .form-group .hint {
          font-weight: 400;
          color: var(--text-muted);
          margin-left: var(--space-2, 0.5rem);
        }

        .form-group input {
          padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
          font-size: var(--text-sm, 0.875rem);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 12px);
          background: var(--bg-primary);
          color: var(--text-primary);
          transition: var(--transition-fast);
        }

        .form-group input::placeholder {
          color: var(--text-muted);
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-muted);
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
          right: var(--space-3, 0.75rem);
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          border-radius: var(--radius-md, 8px);
          transition: var(--transition-fast);
        }

        .toggle-visibility:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .environment-toggle {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-4, 1rem);
        }

        .env-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2, 0.5rem);
          padding: var(--space-5, 1.25rem);
          border: 2px solid var(--border);
          border-radius: var(--radius-xl, 16px);
          background: var(--bg-tertiary);
          cursor: pointer;
          transition: var(--transition-base);
          color: var(--text-primary);
          font-weight: 600;
        }

        .env-btn:hover {
          border-color: var(--accent);
          background: var(--bg-hover);
          transform: translateY(-2px);
        }

        .env-btn.active {
          border-color: var(--accent);
          background: var(--accent-muted);
          box-shadow: 0 0 0 1px var(--accent);
        }

        .env-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: var(--radius-lg, 12px);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          transition: var(--transition-fast);
        }

        .env-btn:hover .env-icon {
          color: var(--accent);
        }

        .env-btn.active .env-icon {
          background: var(--accent);
          color: white;
        }

        .env-btn .env-desc {
          font-size: var(--text-xs, 0.75rem);
          font-weight: 400;
          color: var(--text-muted);
        }

        .message {
          padding: var(--space-4, 1rem);
          border-radius: var(--radius-lg, 12px);
          font-size: var(--text-sm, 0.875rem);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: var(--space-3, 0.75rem);
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message.error {
          background: var(--negative-bg);
          color: var(--negative);
          border: 1px solid var(--negative-border);
        }

        .message.success {
          background: var(--positive-bg);
          color: var(--positive);
          border: 1px solid var(--positive-border);
        }

        .account-preview {
          background: var(--bg-tertiary);
          border-radius: var(--radius-lg, 12px);
          padding: var(--space-5, 1.25rem);
          border: 1px solid var(--border);
        }

        .account-preview h4 {
          font-size: var(--text-sm, 0.875rem);
          font-weight: 600;
          margin: 0 0 var(--space-4, 1rem) 0;
          color: var(--text-primary);
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-4, 1rem);
        }

        .preview-grid .label {
          display: block;
          font-size: var(--text-xs, 0.75rem);
          color: var(--text-muted);
          margin-bottom: var(--space-1, 0.25rem);
        }

        .preview-grid .value {
          display: block;
          font-weight: 600;
          color: var(--text-primary);
        }

        .form-actions {
          display: flex;
          gap: var(--space-3, 0.75rem);
          justify-content: flex-end;
          padding-top: var(--space-4, 1rem);
        }

        .btn {
          padding: var(--space-3, 0.75rem) var(--space-5, 1.25rem);
          font-size: var(--text-sm, 0.875rem);
          font-weight: 600;
          border: none;
          border-radius: var(--radius-lg, 12px);
          cursor: pointer;
          transition: var(--transition-fast);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2, 0.5rem);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn:not(:disabled):active {
          transform: scale(0.98);
        }

        .btn-primary {
          background: var(--accent);
          color: white;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--accent-hover);
          box-shadow: var(--shadow-md);
        }

        .btn-secondary {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .btn-danger {
          background: var(--negative);
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          filter: brightness(1.1);
        }

        .help-text {
          font-size: var(--text-xs, 0.75rem);
          color: var(--text-muted);
          border-top: 1px solid var(--border);
          padding-top: var(--space-5, 1.25rem);
          line-height: 1.6;
        }

        .help-text p {
          margin: 0 0 var(--space-2, 0.5rem) 0;
        }

        .help-text a {
          color: var(--accent);
          text-decoration: none;
          font-weight: 500;
        }

        .help-text a:hover {
          text-decoration: underline;
        }

        .help-text .warning {
          display: flex;
          align-items: flex-start;
          gap: var(--space-2, 0.5rem);
          color: var(--warning);
          background: var(--warning-bg);
          padding: var(--space-3, 0.75rem);
          border-radius: var(--radius-md, 8px);
          margin-top: var(--space-3, 0.75rem);
        }

        @media (max-width: 640px) {
          .connection-header {
            flex-direction: column;
            gap: var(--space-4, 1rem);
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

          .account-summary {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

export default AlpacaConnectionForm;
