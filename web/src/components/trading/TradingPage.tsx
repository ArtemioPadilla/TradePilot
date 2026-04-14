import { appPath } from '../../lib/utils/paths';
/**
 * TradingPage Component
 *
 * Main container component for the trading page that orchestrates
 * the OrderForm, OrderHistoryTable, OrderConfirmationModal, and
 * AlpacaConnectionForm components.
 */

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '../../lib/firebase';
import {
  getAlpacaCredentials,
  testAlpacaConnection,
  fetchAlpacaOrders,
  fetchAlpacaPositions,
  submitOrder,
  cancelOrder,
} from '../../lib/services/alpaca';
import type {
  AlpacaAccount,
  AlpacaOrder,
  AlpacaPosition,
  AlpacaCredentials,
  OrderRequest,
} from '../../types/alpaca';

import { AlpacaConnectionForm } from './AlpacaConnectionForm';
import { OrderForm } from './OrderForm';
import { OrderHistoryTable } from './OrderHistoryTable';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import { ErrorBoundary } from '../common/ErrorBoundary';

type PageState = 'loading' | 'not-authenticated' | 'not-connected' | 'connected';

/**
 * Inner Trading Page component with all the logic
 */
function TradingPageInner() {
  // Auth state
  const [userId, setUserId] = useState<string | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');

  // Alpaca state
  const [credentials, setCredentials] = useState<AlpacaCredentials | null>(null);
  const [account, setAccount] = useState<AlpacaAccount | null>(null);
  const [orders, setOrders] = useState<AlpacaOrder[]>([]);
  const [positions, setPositions] = useState<AlpacaPosition[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Order form state
  const [pendingOrder, setPendingOrder] = useState<OrderRequest | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Listen to auth state
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setPageState('not-authenticated');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setPageState('not-authenticated');
      }
    });

    return () => unsubscribe();
  }, []);

  // Check Alpaca connection when user is authenticated
  useEffect(() => {
    if (userId) {
      checkConnection();
    }
  }, [userId]);

  const checkConnection = async () => {
    if (!userId) return;

    setPageState('loading');
    try {
      const creds = await getAlpacaCredentials(userId);
      if (!creds) {
        setPageState('not-connected');
        return;
      }

      setCredentials(creds);

      // Test the connection
      const accountInfo = await testAlpacaConnection(
        creds.apiKey,
        creds.apiSecret,
        creds.environment
      );
      setAccount(accountInfo);
      setPageState('connected');

      // Load initial data
      await loadTradingData(creds);
    } catch (err) {
      console.error('Failed to connect to Alpaca:', err);
      setPageState('not-connected');
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  };

  const loadTradingData = async (creds: AlpacaCredentials) => {
    setLoadingData(true);
    try {
      const [ordersData, positionsData] = await Promise.all([
        fetchAlpacaOrders(creds.apiKey, creds.apiSecret, creds.environment, 'all', 100),
        fetchAlpacaPositions(creds.apiKey, creds.apiSecret, creds.environment),
      ]);
      setOrders(ordersData);
      setPositions(positionsData);
    } catch (err) {
      console.error('Failed to load trading data:', err);
      setError('Failed to load trading data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleConnectionChange = useCallback((connected: boolean, accountInfo?: AlpacaAccount) => {
    if (connected && accountInfo) {
      setAccount(accountInfo);
      setPageState('connected');
      // Reload credentials and data
      if (userId) {
        getAlpacaCredentials(userId).then((creds) => {
          if (creds) {
            setCredentials(creds);
            loadTradingData(creds);
          }
        });
      }
    } else {
      setPageState('not-connected');
      setAccount(null);
      setCredentials(null);
    }
  }, [userId]);

  const handlePreviewOrder = useCallback((order: OrderRequest) => {
    setPendingOrder(order);
    // Get estimated price from current position or use a default
    const position = positions.find((p) => p.symbol === order.symbol);
    const price = position?.currentPrice || order.limitPrice || 100; // Fallback price
    setEstimatedPrice(price);
    setIsModalOpen(true);
  }, [positions]);

  const handleConfirmOrder = useCallback(async (order: OrderRequest): Promise<AlpacaOrder> => {
    if (!credentials) {
      throw new Error('Not connected to Alpaca');
    }

    const result = await submitOrder(
      credentials.apiKey,
      credentials.apiSecret,
      credentials.environment,
      order
    );

    // Refresh orders list
    await loadTradingData(credentials);

    return result;
  }, [credentials]);

  const handleCancelOrder = useCallback(async (orderId: string) => {
    if (!credentials) {
      throw new Error('Not connected to Alpaca');
    }

    await cancelOrder(
      credentials.apiKey,
      credentials.apiSecret,
      credentials.environment,
      orderId
    );

    // Refresh orders list
    await loadTradingData(credentials);
  }, [credentials]);

  const handleRefreshOrders = useCallback(() => {
    if (credentials) {
      loadTradingData(credentials);
    }
  }, [credentials]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setPendingOrder(null);
  }, []);

  // Get current position for selected symbol
  const getCurrentPosition = useCallback((symbol: string): number => {
    const position = positions.find((p) => p.symbol.toUpperCase() === symbol.toUpperCase());
    return position?.qty || 0;
  }, [positions]);

  // Render loading state
  if (pageState === 'loading') {
    return (
      <div className="trading-page trading-page--loading" data-testid="trading-page-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading trading interface...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Render not authenticated state
  if (pageState === 'not-authenticated') {
    return (
      <div className="trading-page trading-page--not-auth" data-testid="trading-page-not-auth">
        <div className="message-container">
          <div className="message-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2>Authentication Required</h2>
          <p>Please sign in to access the trading interface.</p>
          <a href={appPath("/auth/login")} className="btn btn-primary">Sign In</a>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Render not connected state
  if (pageState === 'not-connected') {
    return (
      <div className="trading-page trading-page--not-connected" data-testid="trading-page-not-connected">
        <div className="connection-container">
          <div className="connection-header">
            <h1>Connect Your Brokerage</h1>
            <p>Link your Alpaca account to start trading. You can use paper trading to practice without risking real money.</p>
          </div>
          {error && (
            <div className="error-banner">
              <span>{error}</span>
              <button onClick={() => setError(null)}>&times;</button>
            </div>
          )}
          <AlpacaConnectionForm onConnectionChange={handleConnectionChange} />
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Render connected state with trading interface
  return (
    <div className="trading-page trading-page--connected" data-testid="trading-page">
      {/* Account Info Bar */}
      {account && (
        <div className="account-bar" data-testid="account-bar">
          <div className="account-info">
            <div className="account-item">
              <span className="label">Account</span>
              <span className="value">{account.accountNumber}</span>
            </div>
            <div className="account-item">
              <span className="label">Environment</span>
              <span className={`value env-badge ${credentials?.environment}`}>
                {credentials?.environment === 'paper' ? 'Paper' : 'Live'}
              </span>
            </div>
            <div className="account-item">
              <span className="label">Buying Power</span>
              <span className="value highlight">
                ${account.buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="account-item">
              <span className="label">Portfolio Value</span>
              <span className="value">
                ${account.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="account-item">
              <span className="label">Cash</span>
              <span className="value">
                ${account.cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <button
            onClick={handleRefreshOrders}
            className="btn btn-icon"
            title="Refresh data"
            disabled={loadingData}
          >
            <svg className={loadingData ? 'spinning' : ''} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {/* Main Content */}
      <div className="trading-content">
        {/* Order Form Column */}
        <div className="order-form-column">
          <OrderForm
            buyingPower={account?.buyingPower || 0}
            currentPosition={0}
            onPreview={handlePreviewOrder}
          />
        </div>

        {/* Order History Column */}
        <div className="order-history-column">
          <OrderHistoryTable
            orders={orders}
            loading={loadingData}
            onRefresh={handleRefreshOrders}
            onCancelOrder={handleCancelOrder}
          />
        </div>
      </div>

      {/* Order Confirmation Modal */}
      {pendingOrder && (
        <OrderConfirmationModal
          order={pendingOrder}
          estimatedPrice={estimatedPrice}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onConfirm={handleConfirmOrder}
          portfolioValue={account?.portfolioValue || 0}
          cashBalance={account?.cash || 0}
          currentShares={getCurrentPosition(pendingOrder.symbol)}
        />
      )}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .trading-page {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1.5rem;
  }

  .trading-page--loading,
  .trading-page--not-auth {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
  }

  .loading-container,
  .message-container {
    text-align: center;
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .message-icon {
    color: var(--accent);
    margin-bottom: 1rem;
    opacity: 0.8;
  }

  .message-container h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 0.5rem 0;
  }

  .message-container p {
    color: var(--text-muted);
    margin: 0 0 1.5rem 0;
  }

  .trading-page--not-connected {
    max-width: 600px;
  }

  .connection-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .connection-header {
    text-align: center;
    margin-bottom: 1rem;
  }

  .connection-header h1 {
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 0.5rem 0;
  }

  .connection-header p {
    color: var(--text-muted);
    margin: 0;
  }

  .error-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: var(--negative-bg, rgba(239, 68, 68, 0.1));
    border: 1px solid var(--negative, #ef4444);
    border-radius: var(--radius-md, 8px);
    color: var(--negative, #ef4444);
    margin-bottom: 1rem;
  }

  .error-banner button {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: inherit;
    padding: 0;
    line-height: 1;
  }

  .account-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg, 12px);
    padding: 1rem 1.5rem;
    margin-bottom: 1.5rem;
  }

  .account-info {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
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

  .account-item .value.highlight {
    color: var(--positive, #10b981);
  }

  .env-badge {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius-sm, 4px);
    font-size: 0.75rem;
    font-weight: 500;
  }

  .env-badge.paper {
    background: var(--accent-bg, rgba(59, 130, 246, 0.1));
    color: var(--accent);
  }

  .env-badge.live {
    background: var(--warning-bg, rgba(245, 158, 11, 0.1));
    color: var(--warning, #f59e0b);
  }

  .btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 500;
    border: none;
    border-radius: var(--radius-md, 8px);
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-block;
  }

  .btn-primary {
    background: var(--accent);
    color: white;
  }

  .btn-primary:hover {
    background: var(--accent-hover, #2563eb);
  }

  .btn-icon {
    padding: 0.5rem;
    background: var(--bg-tertiary);
    border-radius: var(--radius-md, 8px);
  }

  .btn-icon:hover:not(:disabled) {
    background: var(--border);
  }

  .btn-icon:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-icon svg.spinning {
    animation: spin 1s linear infinite;
  }

  .trading-content {
    display: grid;
    grid-template-columns: 400px 1fr;
    gap: 1.5rem;
    align-items: start;
  }

  .order-form-column {
    position: sticky;
    top: 1.5rem;
  }

  .order-history-column {
    min-width: 0;
  }

  @media (max-width: 1024px) {
    .trading-content {
      grid-template-columns: 1fr;
    }

    .order-form-column {
      position: static;
    }

    .account-info {
      gap: 1rem;
    }
  }

  @media (max-width: 640px) {
    .trading-page {
      padding: 1rem;
    }

    .account-bar {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .account-info {
      justify-content: space-between;
    }

    .account-item {
      text-align: center;
    }
  }
`;

/**
 * TradingPage wrapper with Error Boundary and Firebase initialization guard
 */
export function TradingPage() {
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Firebase is ready
    const checkFirebase = async () => {
      try {
        const auth = getFirebaseAuth();
        if (auth) {
          setIsFirebaseReady(true);
        } else {
          // Retry after a short delay
          setTimeout(() => {
            const retryAuth = getFirebaseAuth();
            if (retryAuth) {
              setIsFirebaseReady(true);
            } else {
              setInitError('Failed to initialize Firebase. Please refresh the page.');
            }
          }, 1000);
        }
      } catch (err) {
        console.error('[TradingPage] Firebase initialization error:', err);
        setInitError(err instanceof Error ? err.message : 'Firebase initialization failed');
      }
    };

    checkFirebase();
  }, []);

  // Show loading while Firebase initializes
  if (!isFirebaseReady && !initError) {
    return (
      <div className="trading-page trading-page--loading" data-testid="trading-page-init">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Initializing...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Show error if Firebase failed to initialize
  if (initError) {
    return (
      <div className="trading-page trading-page--not-auth" data-testid="trading-page-init-error">
        <div className="message-container">
          <div className="message-icon" style={{ color: 'var(--negative, #ef4444)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2>Initialization Error</h2>
          <p>{initError}</p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Render with Error Boundary
  return (
    <ErrorBoundary
      fallback={
        <div className="trading-page trading-page--not-auth">
          <div className="message-container">
            <div className="message-icon" style={{ color: 'var(--warning, #f59e0b)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2>Something went wrong</h2>
            <p>The trading page encountered an error. Please try again.</p>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
          <style>{styles}</style>
        </div>
      }
    >
      <TradingPageInner />
    </ErrorBoundary>
  );
}

export default TradingPage;
