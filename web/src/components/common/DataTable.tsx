import { useState, useMemo } from 'react';

/**
 * Column definition for DataTable
 */
export interface Column<T> {
  /** Unique key for the column */
  key: string;
  /** Column header text */
  header: string;
  /** Function to render cell content */
  render: (item: T) => React.ReactNode;
  /** Function to get sortable value */
  sortValue?: (item: T) => string | number;
  /** Whether column is sortable (default: true if sortValue provided) */
  sortable?: boolean;
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
  /** Column width (CSS value) */
  width?: string;
  /** CSS class for the column */
  className?: string;
}

/**
 * Sort direction
 */
type SortDirection = 'asc' | 'desc' | null;

/**
 * DataTable props
 */
interface DataTableProps<T> {
  /** Data items to display */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Function to get unique key for each row */
  getRowKey: (item: T) => string;
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row keys */
  selectedKeys?: Set<string>;
  /** Callback when selection changes */
  onSelectionChange?: (selectedKeys: Set<string>) => void;
  /** Callback when row is clicked */
  onRowClick?: (item: T) => void;
  /** Empty state message */
  emptyMessage?: string;
  /** Loading state */
  loading?: boolean;
  /** Search/filter value */
  filterValue?: string;
  /** Function to filter items */
  filterFn?: (item: T, filterValue: string) => boolean;
  /** CSS class for the table */
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  onRowClick,
  emptyMessage = 'No data',
  loading = false,
  filterValue = '',
  filterFn,
  className = '',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Filter data
  const filteredData = useMemo(() => {
    if (!filterValue || !filterFn) return data;
    return data.filter((item) => filterFn(item, filterValue));
  }, [data, filterValue, filterFn]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredData;

    const column = columns.find((c) => c.key === sortKey);
    if (!column?.sortValue) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = column.sortValue!(a);
      const bVal = column.sortValue!(b);

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      const comparison = (aVal as number) - (bVal as number);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection, columns]);

  // Handle column header click for sorting
  function handleSort(columnKey: string) {
    const column = columns.find((c) => c.key === columnKey);
    if (!column?.sortValue && column?.sortable !== true) return;

    if (sortKey === columnKey) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(columnKey);
      setSortDirection('asc');
    }
  }

  // Handle select all checkbox
  function handleSelectAll() {
    if (!onSelectionChange) return;

    const allKeys = new Set(sortedData.map(getRowKey));
    const allSelected = sortedData.every((item) => selectedKeys.has(getRowKey(item)));

    if (allSelected) {
      // Deselect all
      onSelectionChange(new Set());
    } else {
      // Select all
      onSelectionChange(allKeys);
    }
  }

  // Handle row checkbox
  function handleRowSelect(key: string, event: React.MouseEvent) {
    event.stopPropagation();
    if (!onSelectionChange) return;

    const newSelected = new Set(selectedKeys);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    onSelectionChange(newSelected);
  }

  const allSelected = sortedData.length > 0 && sortedData.every((item) => selectedKeys.has(getRowKey(item)));
  const someSelected = sortedData.some((item) => selectedKeys.has(getRowKey(item)));

  return (
    <div className={`data-table-container ${className}`}>
      {loading ? (
        <div className="data-table-loading">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      ) : sortedData.length === 0 ? (
        <div className="data-table-empty">
          <p>{filterValue ? 'No matching results' : emptyMessage}</p>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {selectable && (
                  <th className="checkbox-cell">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected && !allSelected;
                      }}
                      onChange={handleSelectAll}
                      aria-label="Select all rows"
                    />
                  </th>
                )}
                {columns.map((column) => {
                  const isSortable = column.sortValue !== undefined || column.sortable === true;
                  const isSorted = sortKey === column.key;

                  return (
                    <th
                      key={column.key}
                      className={`
                        ${column.className || ''}
                        ${column.align ? `align-${column.align}` : ''}
                        ${isSortable ? 'sortable' : ''}
                        ${isSorted ? `sorted-${sortDirection}` : ''}
                      `}
                      style={{ width: column.width }}
                      onClick={() => isSortable && handleSort(column.key)}
                    >
                      <span className="header-content">
                        {column.header}
                        {isSortable && (
                          <span className="sort-indicator">
                            {isSorted && sortDirection === 'asc' && '↑'}
                            {isSorted && sortDirection === 'desc' && '↓'}
                            {!isSorted && '⇅'}
                          </span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item) => {
                const key = getRowKey(item);
                const isSelected = selectedKeys.has(key);

                return (
                  <tr
                    key={key}
                    className={`
                      ${onRowClick ? 'clickable' : ''}
                      ${isSelected ? 'selected' : ''}
                    `}
                    onClick={() => onRowClick?.(item)}
                  >
                    {selectable && (
                      <td className="checkbox-cell">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          onClick={(e) => handleRowSelect(key, e)}
                          aria-label={`Select row ${key}`}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`
                          ${column.className || ''}
                          ${column.align ? `align-${column.align}` : ''}
                        `}
                      >
                        {column.render(item)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .data-table-container {
          width: 100%;
        }

        .data-table-loading,
        .data-table-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: var(--text-muted);
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 0.5rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .data-table-wrapper {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }

        .data-table th {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: var(--bg-tertiary);
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .data-table th.sortable {
          cursor: pointer;
          user-select: none;
        }

        .data-table th.sortable:hover {
          color: var(--text-primary);
          background: var(--border);
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .sort-indicator {
          font-size: 0.625rem;
          opacity: 0.5;
        }

        .data-table th.sorted-asc .sort-indicator,
        .data-table th.sorted-desc .sort-indicator {
          opacity: 1;
          color: var(--accent);
        }

        .data-table td {
          color: var(--text-primary);
        }

        .data-table tbody tr {
          transition: background-color 0.15s;
        }

        .data-table tbody tr.clickable {
          cursor: pointer;
        }

        .data-table tbody tr.clickable:hover {
          background-color: var(--bg-tertiary);
        }

        .data-table tbody tr.selected {
          background-color: var(--accent-bg, rgba(59, 130, 246, 0.1));
        }

        .data-table tbody tr.selected:hover {
          background-color: var(--accent-bg, rgba(59, 130, 246, 0.15));
        }

        .checkbox-cell {
          width: 40px;
          text-align: center;
        }

        .checkbox-cell input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .align-left { text-align: left; }
        .align-center { text-align: center; }
        .align-right { text-align: right; }

        @media (max-width: 768px) {
          .data-table th,
          .data-table td {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default DataTable;
