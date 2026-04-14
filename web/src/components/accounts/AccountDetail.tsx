import { appPath } from '../../lib/utils/paths';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '../../lib/firebase';
import { getAccount, deleteAccount, updateAccountStatus } from '../../lib/services/accounts';
import { getHoldingsByAccount, deleteHolding } from '../../lib/services/holdings';
import { AddPositionModal } from './AddPositionModal';
import { EditPositionModal } from './EditPositionModal';
import { CSVImportModal } from './CSVImportModal';
import { HoldingsDataTable } from './HoldingsDataTable';
import type { Account, Holding, AccountType } from '../../types/portfolio';

interface AccountDetailProps {
  accountId: string;
}

const accountTypeLabels: Record<AccountType, string> = {
  brokerage: 'Brokerage',
  '401k': '401(k)',
  ira: 'IRA',
  roth_ira: 'Roth IRA',
  crypto: 'Crypto',
  bank: 'Bank',
  other: 'Other',
};

export function AccountDetail({ accountId }: AccountDetailProps) {
  const [account, setAccount] = useState<Account | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const [selectedHoldingIds, setSelectedHoldingIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

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
    loadAccountData();
  }, [userId, accountId]);

  async function loadAccountData() {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const [accountData, holdingsData] = await Promise.all([
        getAccount(userId, accountId),
        getHoldingsByAccount(userId, accountId),
      ]);

      if (!accountData) {
        setError('Account not found');
        return;
      }

      setAccount(accountData);
      setHoldings(holdingsData);
    } catch (err) {
      console.error('Failed to load account:', err);
      setError('Failed to load account data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!userId || !account) return;

    try {
      setDeleting(true);
      await deleteAccount(userId, account.id);
      window.location.href = appPath('/dashboard/accounts');
    } catch (err) {
      console.error('Failed to delete account:', err);
      setError('Failed to delete account. Please try again.');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  async function handleToggleStatus() {
    if (!userId || !account) return;

    const newStatus = account.status === 'active' ? 'inactive' : 'active';
    try {
      await updateAccountStatus(userId, account.id, newStatus);
      setAccount({ ...account, status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update account status.');
    }
  }

  function formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  function formatPercent(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  }

  async function handleBulkAction(action: string, selectedHoldings: Holding[]) {
    if (!userId || selectedHoldings.length === 0) return;

    setBulkActionLoading(true);
    try {
      switch (action) {
        case 'close':
          // Close all selected positions
          await Promise.all(
            selectedHoldings.map((holding) => deleteHolding(userId, holding.id))
          );
          setSelectedHoldingIds(new Set());
          await loadAccountData();
          break;

        case 'export':
          // Export selected holdings to CSV
          const csvContent = generateHoldingsCSV(selectedHoldings);
          downloadCSV(csvContent, `holdings-export-${new Date().toISOString().split('T')[0]}.csv`);
          break;

        case 'sell':
          // For sell, we'll open the edit modal for the first selected holding
          // A more advanced implementation would have a multi-sell modal
          if (selectedHoldings.length === 1) {
            setEditingHolding(selectedHoldings[0]);
          } else {
            alert(`Selected ${selectedHoldings.length} positions. Please edit them individually to sell.`);
          }
          break;
      }
    } catch (err) {
      console.error('Bulk action failed:', err);
      setError('Bulk action failed. Please try again.');
    } finally {
      setBulkActionLoading(false);
    }
  }

  function generateHoldingsCSV(holdingsToExport: Holding[]): string {
    const headers = ['Symbol', 'Name', 'Quantity', 'Cost Basis Per Share', 'Total Cost Basis', 'Current Price', 'Market Value', 'P&L', 'P&L %'];
    const rows = holdingsToExport.map((h) => [
      h.symbol,
      h.name || '',
      h.quantity,
      h.costBasisPerShare.toFixed(2),
      h.totalCostBasis.toFixed(2),
      h.currentPrice?.toFixed(2) || '',
      h.marketValue?.toFixed(2) || '',
      h.unrealizedPL?.toFixed(2) || '',
      h.unrealizedPLPercent?.toFixed(2) || '',
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  function downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) {
    return (
      <div className="account-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading account...</p>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="account-detail-error">
        <h2>Error</h2>
        <p>{error || 'Account not found'}</p>
        <a href={appPath("/dashboard/accounts")} className="btn btn-primary" data-testid="back-to-accounts">
          Back to Accounts
        </a>
      </div>
    );
  }

  const totalMarketValue = holdings.reduce((sum, h) => sum + (h.marketValue || 0), 0);
  const totalCostBasis = holdings.reduce((sum, h) => sum + h.totalCostBasis, 0);
  const totalPL = totalMarketValue - totalCostBasis;
  const totalPLPercent = totalCostBasis > 0 ? (totalPL / totalCostBasis) * 100 : 0;
  const totalValue = account.cashBalance + totalMarketValue;

  return (
    <div className="account-detail">
      {/* Header */}
      <div className="account-header">
        <div className="header-left">
          <a href={appPath("/dashboard/accounts")} className="back-link">
            ← Back to Accounts
          </a>
          <h1>{account.name}</h1>
          <p className="account-meta">
            {accountTypeLabels[account.type]}
            {account.institution && ` • ${account.institution}`}
            <span className={`status-badge status-${account.status}`}>
              {account.status}
            </span>
          </p>
        </div>
        <div className="header-actions">
          <button onClick={handleToggleStatus} className="btn btn-secondary">
            {account.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn btn-danger"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <span className="card-label">Total Value</span>
          <span className="card-value">{formatCurrency(totalValue, account.currency)}</span>
        </div>
        <div className="summary-card">
          <span className="card-label">Cash Balance</span>
          <span className="card-value">{formatCurrency(account.cashBalance, account.currency)}</span>
        </div>
        <div className="summary-card">
          <span className="card-label">Market Value</span>
          <span className="card-value">{formatCurrency(totalMarketValue, account.currency)}</span>
        </div>
        <div className="summary-card">
          <span className="card-label">Unrealized P&L</span>
          <span className={`card-value ${totalPL >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(totalPL, account.currency)}
            <span className="card-percent">{formatPercent(totalPLPercent)}</span>
          </span>
        </div>
      </div>

      {/* Holdings Section */}
      <div className="holdings-section">
        <div className="section-header">
          <h2>Holdings ({holdings.length})</h2>
          <div className="section-actions">
            <button
              className="btn btn-secondary"
              data-testid="import-csv-btn"
              onClick={() => setShowCSVImport(true)}
            >
              Import CSV
            </button>
            <button
              className="btn btn-primary"
              data-testid="add-position-btn"
              onClick={() => setShowAddPosition(true)}
            >
              + Add Position
            </button>
          </div>
        </div>

        {holdings.length === 0 ? (
          <div className="holdings-empty">
            <p>No positions in this account yet.</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddPosition(true)}
            >
              Add Your First Position
            </button>
          </div>
        ) : (
          <HoldingsDataTable
            holdings={holdings}
            totalPortfolioValue={totalValue}
            onRowClick={(holding) => setEditingHolding(holding)}
            selectable={true}
            selectedIds={selectedHoldingIds}
            onSelectionChange={setSelectedHoldingIds}
            onBulkAction={handleBulkAction}
            loading={bulkActionLoading}
          />
        )}
      </div>

      {/* Notes Section */}
      {account.notes && (
        <div className="notes-section">
          <h3>Notes</h3>
          <p>{account.notes}</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal delete-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Account?</h2>
            <p>
              Are you sure you want to delete <strong>{account.name}</strong>?
              This will also delete all holdings and transactions in this account.
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-danger"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Position Modal */}
      {showAddPosition && userId && account && (
        <AddPositionModal
          userId={userId}
          accountId={account.id}
          accountCurrency={account.currency}
          onClose={() => setShowAddPosition(false)}
          onSuccess={() => {
            setShowAddPosition(false);
            loadAccountData();
          }}
        />
      )}

      {/* Edit Position Modal */}
      {editingHolding && userId && account && (
        <EditPositionModal
          userId={userId}
          holding={editingHolding}
          accountCurrency={account.currency}
          onClose={() => setEditingHolding(null)}
          onSuccess={() => {
            setEditingHolding(null);
            loadAccountData();
          }}
        />
      )}

      {/* CSV Import Modal */}
      {showCSVImport && userId && account && (
        <CSVImportModal
          userId={userId}
          accountId={account.id}
          accountCurrency={account.currency}
          onClose={() => setShowCSVImport(false)}
          onSuccess={() => {
            setShowCSVImport(false);
            loadAccountData();
          }}
        />
      )}

      <style>{`
        .account-detail {
          padding: 1.5rem;
          max-width: 1200px;
        }

        .account-detail-loading,
        .account-detail-error {
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

        .account-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          gap: 1rem;
        }

        .back-link {
          color: var(--text-muted);
          text-decoration: none;
          font-size: 0.875rem;
          display: inline-block;
          margin-bottom: 0.5rem;
        }

        .back-link:hover {
          color: var(--accent);
        }

        .account-header h1 {
          font-size: 1.75rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          color: var(--text-primary);
        }

        .account-meta {
          color: var(--text-muted);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .status-badge {
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

        .header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .summary-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
        }

        .card-label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .card-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .card-value.positive {
          color: var(--positive);
        }

        .card-value.negative {
          color: var(--negative);
        }

        .card-percent {
          font-size: 0.875rem;
          margin-left: 0.5rem;
          opacity: 0.8;
        }

        .holdings-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .section-header h2 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
          color: var(--text-primary);
        }

        .section-actions {
          display: flex;
          gap: 0.5rem;
        }

        .holdings-empty {
          text-align: center;
          padding: 2rem;
          color: var(--text-muted);
        }

        .holdings-table-wrapper {
          overflow-x: auto;
        }

        .holdings-table {
          width: 100%;
          border-collapse: collapse;
        }

        .holdings-table th,
        .holdings-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }

        .holdings-table th {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .holdings-table td {
          color: var(--text-primary);
        }

        .holding-row {
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .holding-row:hover {
          background-color: var(--bg-tertiary);
        }

        .symbol-cell {
          display: flex;
          flex-direction: column;
        }

        .symbol-cell .symbol {
          font-weight: 600;
        }

        .symbol-cell .name {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .positive {
          color: var(--positive);
        }

        .negative {
          color: var(--negative);
        }

        .notes-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
        }

        .notes-section h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.75rem 0;
          color: var(--text-primary);
        }

        .notes-section p {
          color: var(--text-secondary);
          margin: 0;
          white-space: pre-wrap;
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

        .btn-primary:hover {
          background: var(--accent-hover);
        }

        .btn-secondary {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
        }

        .btn-secondary:hover {
          background: var(--border);
        }

        .btn-danger {
          background: var(--negative);
          color: white;
        }

        .btn-danger:hover {
          opacity: 0.9;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

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
          padding: 1.5rem;
          max-width: 400px;
          width: 100%;
        }

        .delete-modal h2 {
          color: var(--negative);
          margin: 0 0 1rem 0;
        }

        .delete-modal p {
          color: var(--text-secondary);
          margin: 0 0 1.5rem 0;
          line-height: 1.6;
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }

        @media (max-width: 768px) {
          .account-header {
            flex-direction: column;
          }

          .header-actions {
            width: 100%;
          }

          .header-actions .btn {
            flex: 1;
          }

          .summary-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 480px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default AccountDetail;
