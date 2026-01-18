import { useState, useMemo } from 'react';
import { DataTable, type Column } from '../common';
import type { Holding } from '../../types/portfolio';

/**
 * Props for HoldingsDataTable
 */
interface HoldingsDataTableProps {
  /** Holdings to display */
  holdings: Holding[];
  /** Total portfolio value for weight calculations */
  totalPortfolioValue: number;
  /** Callback when a row is clicked */
  onRowClick?: (holding: Holding) => void;
  /** Enable row selection */
  selectable?: boolean;
  /** Selected holding IDs */
  selectedIds?: Set<string>;
  /** Callback when selection changes */
  onSelectionChange?: (selectedIds: Set<string>) => void;
  /** Callback for bulk actions */
  onBulkAction?: (action: string, holdings: Holding[]) => void;
  /** Loading state */
  loading?: boolean;
}

/**
 * Format currency value
 */
function formatCurrency(value: number | undefined, currency = 'USD'): string {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage value
 */
function formatPercent(value: number | undefined): string {
  if (value === undefined || value === null) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format quantity with appropriate precision
 */
function formatQuantity(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString();
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

/**
 * Get CSS class for P&L value
 */
function getPLClass(value: number | undefined): string {
  if (value === undefined || value === null) return '';
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
}

/**
 * Holdings data table with sorting, filtering, and row selection
 */
export function HoldingsDataTable({
  holdings,
  totalPortfolioValue,
  onRowClick,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  onBulkAction,
  loading = false,
}: HoldingsDataTableProps) {
  const [filterValue, setFilterValue] = useState('');
  const [showBulkMenu, setShowBulkMenu] = useState(false);

  // Calculate weight for each holding
  const holdingsWithWeight = useMemo(() => {
    return holdings.map((holding) => ({
      ...holding,
      weight: totalPortfolioValue > 0 && holding.marketValue
        ? (holding.marketValue / totalPortfolioValue) * 100
        : 0,
    }));
  }, [holdings, totalPortfolioValue]);

  // Define columns
  const columns: Column<Holding & { weight: number }>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      render: (item) => (
        <div className="symbol-cell">
          <span className="symbol">{item.symbol}</span>
          {item.name && <span className="name">{item.name}</span>}
        </div>
      ),
      sortValue: (item) => item.symbol,
      width: '150px',
    },
    {
      key: 'quantity',
      header: 'Qty',
      render: (item) => formatQuantity(item.quantity),
      sortValue: (item) => item.quantity,
      align: 'right',
      width: '100px',
    },
    {
      key: 'currentPrice',
      header: 'Price',
      render: (item) => formatCurrency(item.currentPrice, item.currency),
      sortValue: (item) => item.currentPrice ?? 0,
      align: 'right',
      width: '110px',
    },
    {
      key: 'marketValue',
      header: 'Mkt Value',
      render: (item) => formatCurrency(item.marketValue, item.currency),
      sortValue: (item) => item.marketValue ?? 0,
      align: 'right',
      width: '120px',
    },
    {
      key: 'costBasis',
      header: 'Cost Basis',
      render: (item) => formatCurrency(item.totalCostBasis, item.currency),
      sortValue: (item) => item.totalCostBasis,
      align: 'right',
      width: '120px',
    },
    {
      key: 'unrealizedPL',
      header: 'P&L ($)',
      render: (item) => (
        <span className={`pl-value ${getPLClass(item.unrealizedPL)}`}>
          {item.unrealizedPL !== undefined
            ? `${item.unrealizedPL >= 0 ? '+' : ''}${formatCurrency(item.unrealizedPL, item.currency).replace('$', '')}`
            : '—'}
        </span>
      ),
      sortValue: (item) => item.unrealizedPL ?? 0,
      align: 'right',
      width: '110px',
    },
    {
      key: 'unrealizedPLPercent',
      header: 'P&L (%)',
      render: (item) => (
        <span className={`pl-value ${getPLClass(item.unrealizedPLPercent)}`}>
          {formatPercent(item.unrealizedPLPercent)}
        </span>
      ),
      sortValue: (item) => item.unrealizedPLPercent ?? 0,
      align: 'right',
      width: '90px',
    },
    {
      key: 'dailyChange',
      header: 'Day Chg',
      render: (item) => (
        <span className={`pl-value ${getPLClass(item.dailyChangePercent)}`}>
          {formatPercent(item.dailyChangePercent)}
        </span>
      ),
      sortValue: (item) => item.dailyChangePercent ?? 0,
      align: 'right',
      width: '90px',
    },
    {
      key: 'weight',
      header: 'Weight',
      render: (item) => `${item.weight.toFixed(1)}%`,
      sortValue: (item) => item.weight,
      align: 'right',
      width: '80px',
    },
  ];

  // Filter function
  const filterFn = (item: Holding & { weight: number }, filter: string): boolean => {
    const searchLower = filter.toLowerCase();
    return (
      item.symbol.toLowerCase().includes(searchLower) ||
      (item.name?.toLowerCase().includes(searchLower) ?? false)
    );
  };

  // Get selected holdings
  const selectedHoldings = holdingsWithWeight.filter((h) => selectedIds.has(h.id));

  // Handle bulk action
  function handleBulkAction(action: string) {
    setShowBulkMenu(false);
    onBulkAction?.(action, selectedHoldings);
  }

  return (
    <div className="holdings-data-table">
      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Filter by symbol or name..."
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="filter-input"
          />
          {filterValue && (
            <button
              className="clear-filter"
              onClick={() => setFilterValue('')}
              aria-label="Clear filter"
            >
              ×
            </button>
          )}
        </div>

        {selectable && selectedIds.size > 0 && (
          <div className="bulk-actions">
            <span className="selection-count">
              {selectedIds.size} selected
            </span>
            <div className="bulk-menu-container">
              <button
                className="bulk-menu-trigger"
                onClick={() => setShowBulkMenu(!showBulkMenu)}
              >
                Actions ▾
              </button>
              {showBulkMenu && (
                <div className="bulk-menu">
                  <button onClick={() => handleBulkAction('sell')}>
                    Sell Selected
                  </button>
                  <button onClick={() => handleBulkAction('close')}>
                    Close Positions
                  </button>
                  <button onClick={() => handleBulkAction('export')}>
                    Export to CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        data={holdingsWithWeight}
        columns={columns}
        getRowKey={(item) => item.id}
        selectable={selectable}
        selectedKeys={selectedIds}
        onSelectionChange={onSelectionChange}
        onRowClick={onRowClick}
        filterValue={filterValue}
        filterFn={filterFn}
        loading={loading}
        emptyMessage="No holdings in this account"
      />

      <style>{`
        .holdings-data-table {
          width: 100%;
        }

        .table-toolbar {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 200px;
          max-width: 300px;
        }

        .filter-input {
          width: 100%;
          padding: 0.5rem 2rem 0.5rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .filter-input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-bg, rgba(59, 130, 246, 0.1));
        }

        .clear-filter {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1.25rem;
          line-height: 1;
          padding: 0;
        }

        .clear-filter:hover {
          color: var(--text-primary);
        }

        .bulk-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .selection-count {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .bulk-menu-container {
          position: relative;
        }

        .bulk-menu-trigger {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .bulk-menu-trigger:hover {
          background: var(--accent-hover, #2563eb);
        }

        .bulk-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.25rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 100;
          min-width: 150px;
        }

        .bulk-menu button {
          display: block;
          width: 100%;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          text-align: left;
          background: none;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .bulk-menu button:hover {
          background: var(--bg-tertiary);
        }

        .bulk-menu button:first-child {
          border-radius: 6px 6px 0 0;
        }

        .bulk-menu button:last-child {
          border-radius: 0 0 6px 6px;
        }

        /* Cell styles */
        .symbol-cell {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .symbol-cell .symbol {
          font-weight: 600;
          color: var(--text-primary);
        }

        .symbol-cell .name {
          font-size: 0.75rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
        }

        .pl-value {
          font-weight: 500;
        }

        .pl-value.positive {
          color: var(--success, #10b981);
        }

        .pl-value.negative {
          color: var(--error, #ef4444);
        }

        .pl-value.neutral {
          color: var(--text-muted);
        }

        @media (max-width: 768px) {
          .table-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .search-box {
            max-width: none;
          }

          .bulk-actions {
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}

export default HoldingsDataTable;
