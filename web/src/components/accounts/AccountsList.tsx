import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '../../lib/firebase';
import { getAccounts } from '../../lib/services/accounts';
import type { Account, AccountType } from '../../types/portfolio';
import { AddAccountModal } from './AddAccountModal';
import {
  TrendingUp,
  Building,
  Building2,
  Wallet,
  Bitcoin,
  Landmark,
  FolderOpen,
  BarChart3,
  Plus
} from 'lucide-react';

const accountTypeLabels: Record<AccountType, string> = {
  brokerage: 'Brokerage',
  '401k': '401(k)',
  ira: 'IRA',
  roth_ira: 'Roth IRA',
  crypto: 'Crypto',
  bank: 'Bank',
  other: 'Other',
};

const AccountTypeIcon = ({ type }: { type: AccountType }) => {
  const iconProps = { size: 20, strokeWidth: 1.5 };
  switch (type) {
    case 'brokerage': return <TrendingUp {...iconProps} />;
    case '401k': return <Building {...iconProps} />;
    case 'ira': return <Building2 {...iconProps} />;
    case 'roth_ira': return <Wallet {...iconProps} />;
    case 'crypto': return <Bitcoin {...iconProps} />;
    case 'bank': return <Landmark {...iconProps} />;
    default: return <FolderOpen {...iconProps} />;
  }
};

export function AccountsList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadAccounts();
  }, [userId]);

  async function loadAccounts() {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getAccounts(userId);
      setAccounts(data);
    } catch (err: any) {
      console.error('Failed to load accounts:', err);

      // If permission denied, likely a pending/suspended user
      // AuthGuard will handle the redirect, so don't show error
      if (err?.code === 'permission-denied') {
        // Just show loading state while AuthGuard redirects
        setLoading(true);
        return;
      }

      setError('Failed to load accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleAccountAdded() {
    setShowAddModal(false);
    loadAccounts();
  }

  function formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  if (loading) {
    return (
      <div className="accounts-loading">
        <div className="loading-spinner"></div>
        <p>Loading accounts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="accounts-error">
        <p>{error}</p>
        <button onClick={loadAccounts} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const totalValue = accounts.reduce((sum, acc) => sum + acc.cashBalance, 0);

  return (
    <div className="accounts-list">
      <div className="accounts-header">
        <div className="accounts-summary">
          <h2>Your Accounts</h2>
          <p className="total-value">
            Total Cash: <strong>{formatCurrency(totalValue)}</strong>
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          data-testid="add-account-btn"
        >
          <Plus size={18} strokeWidth={2} />
          Add Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="accounts-empty">
          <div className="empty-icon">
            <BarChart3 size={48} strokeWidth={1.5} />
          </div>
          <h3>No accounts yet</h3>
          <p>Add your first account to start tracking your portfolio.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            Add Your First Account
          </button>
        </div>
      ) : (
        <div className="accounts-grid">
          {accounts.map((account) => (
            <a
              key={account.id}
              href={`/dashboard/account?id=${account.id}`}
              className="account-card"
              data-testid={`account-card-${account.id}`}
            >
              <div className="account-card-header">
                <span className="account-icon">
                  <AccountTypeIcon type={account.type} />
                </span>
                <span className={`account-status status-${account.status}`}>
                  {account.status}
                </span>
              </div>
              <h3 className="account-name">{account.name}</h3>
              <p className="account-type">
                {accountTypeLabels[account.type]}
                {account.institution && ` • ${account.institution}`}
              </p>
              <div className="account-balance">
                <span className="balance-label">Cash Balance</span>
                <span className="balance-value">
                  {formatCurrency(account.cashBalance, account.currency)}
                </span>
              </div>
              {account.isDefault && (
                <span className="default-badge">Default</span>
              )}
            </a>
          ))}
        </div>
      )}

      {showAddModal && userId && (
        <AddAccountModal
          userId={userId}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAccountAdded}
        />
      )}

      <style>{`
        .accounts-list {
          padding: 1.5rem;
        }

        .accounts-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          gap: 1rem;
        }

        .accounts-summary h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
          color: var(--text-primary);
        }

        .total-value {
          color: var(--text-muted);
          margin: 0;
        }

        .total-value strong {
          color: var(--text-primary);
        }

        .accounts-loading,
        .accounts-error,
        .accounts-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .accounts-error p {
          color: var(--negative);
          margin-bottom: 1rem;
        }

        .empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 20px;
          background: var(--accent-muted, rgba(99, 102, 241, 0.1));
          color: var(--accent, #6366f1);
          margin-bottom: 1.5rem;
        }

        .accounts-empty h3 {
          font-size: 1.25rem;
          margin: 0 0 0.5rem 0;
          color: var(--text-primary);
        }

        .accounts-empty p {
          color: var(--text-muted);
          margin: 0 0 1.5rem 0;
        }

        .accounts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .account-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
          position: relative;
        }

        .account-card:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .account-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .account-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: var(--accent-muted, rgba(99, 102, 241, 0.1));
          color: var(--accent, #6366f1);
        }

        .account-status {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          text-transform: capitalize;
        }

        .status-active {
          background: var(--positive-bg);
          color: var(--positive);
        }

        .status-inactive {
          background: var(--bg-tertiary);
          color: var(--text-muted);
        }

        .status-closed {
          background: var(--negative-bg);
          color: var(--negative);
        }

        .account-name {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
          color: var(--text-primary);
        }

        .account-type {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin: 0 0 1rem 0;
        }

        .account-balance {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border);
        }

        .balance-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .balance-value {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .default-badge {
          position: absolute;
          top: -8px;
          right: 12px;
          background: var(--accent);
          color: white;
          font-size: 0.625rem;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
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

        .btn-primary:hover {
          background: var(--accent-hover);
        }

        @media (max-width: 640px) {
          .accounts-header {
            flex-direction: column;
          }

          .accounts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default AccountsList;
