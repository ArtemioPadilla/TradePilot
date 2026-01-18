/**
 * AlertsList Component
 *
 * Displays a list of user alerts with filtering, sorting, and actions.
 */

import { useState, useMemo, useCallback } from 'react';
import type { Alert, AlertType, AlertStatus, ALERT_TYPE_INFO } from '../../types/alerts';

interface AlertsListProps {
  /** List of alerts to display */
  alerts: Alert[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Callback when alert is clicked for viewing/editing */
  onAlertClick?: (alert: Alert) => void;
  /** Callback to toggle alert enabled state */
  onToggleAlert?: (alertId: string, enabled: boolean) => void;
  /** Callback to delete an alert */
  onDeleteAlert?: (alertId: string) => void;
  /** Callback to duplicate an alert */
  onDuplicateAlert?: (alertId: string) => void;
}

type SortField = 'name' | 'type' | 'status' | 'createdAt' | 'lastTriggeredAt';
type SortDirection = 'asc' | 'desc';

// Status colors
const STATUS_COLORS: Record<AlertStatus, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  triggered: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  disabled: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  expired: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
};

// Alert type labels
const TYPE_LABELS: Record<AlertType, string> = {
  price_above: 'Price Above',
  price_below: 'Price Below',
  price_crosses: 'Price Crosses',
  percent_change: 'Percent Change',
  portfolio_value: 'Portfolio Value',
  position_gain: 'Position Gain',
  position_loss: 'Position Loss',
  drawdown: 'Drawdown',
  rebalance_due: 'Rebalance Due',
  trade_executed: 'Trade Executed',
  custom: 'Custom',
};

export function AlertsList({
  alerts,
  isLoading = false,
  onAlertClick,
  onToggleAlert,
  onDeleteAlert,
  onDuplicateAlert,
}: AlertsListProps) {
  // Filter state
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<AlertType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Selected alerts for bulk actions
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());

  // Confirmation dialog state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter and sort alerts
  const filteredAlerts = useMemo(() => {
    let result = [...alerts];

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((a) => a.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter((a) => a.type === typeFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.description?.toLowerCase().includes(query) ||
          a.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'lastTriggeredAt':
          const aTime = a.lastTriggeredAt ? new Date(a.lastTriggeredAt).getTime() : 0;
          const bTime = b.lastTriggeredAt ? new Date(b.lastTriggeredAt).getTime() : 0;
          comparison = aTime - bTime;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [alerts, statusFilter, typeFilter, searchQuery, sortField, sortDirection]);

  // Handle sort
  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortDirection('desc');
      return field;
    });
  }, []);

  // Toggle alert selection
  const toggleSelection = useCallback((alertId: string) => {
    setSelectedAlerts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  }, []);

  // Select/deselect all
  const toggleSelectAll = useCallback(() => {
    if (selectedAlerts.size === filteredAlerts.length) {
      setSelectedAlerts(new Set());
    } else {
      setSelectedAlerts(new Set(filteredAlerts.map((a) => a.id)));
    }
  }, [filteredAlerts, selectedAlerts.size]);

  // Handle delete confirmation
  const handleDeleteClick = useCallback((alertId: string) => {
    setDeleteConfirmId(alertId);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteConfirmId && onDeleteAlert) {
      onDeleteAlert(deleteConfirmId);
    }
    setDeleteConfirmId(null);
  }, [deleteConfirmId, onDeleteAlert]);

  // Format config summary
  const getConfigSummary = (alert: Alert): string => {
    const config = alert.config;
    switch (config.type) {
      case 'price_above':
      case 'price_below':
      case 'price_crosses':
        return `${config.symbol} @ $${config.targetPrice}`;
      case 'percent_change':
        return `${config.symbol} ${config.percentThreshold}% ${config.period}`;
      case 'portfolio_value':
        return `${config.operator === 'greater_than' ? '>' : '<'} $${config.targetValue.toLocaleString()}`;
      case 'position_gain':
      case 'position_loss':
        return `${config.symbol} ${config.percentThreshold}%`;
      case 'drawdown':
        return `${config.operator === 'greater_than' ? '>' : '<'} ${config.targetValue}%`;
      case 'rebalance_due':
        return `${config.daysBefore} days before`;
      case 'trade_executed':
        return config.symbol || 'All trades';
      default:
        return '';
    }
  };

  // Get unique alert types for filter
  const alertTypes = useMemo(() => {
    const types = new Set(alerts.map((a) => a.type));
    return Array.from(types);
  }, [alerts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" data-testid="alerts-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="alerts-list" data-testid="alerts-list">
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            data-testid="alerts-search"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AlertStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            data-testid="status-filter"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="triggered">Triggered</option>
            <option value="disabled">Disabled</option>
            <option value="expired">Expired</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as AlertType | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            data-testid="type-filter"
          >
            <option value="all">All Types</option>
            {alertTypes.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alerts count */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">
          {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
          {statusFilter !== 'all' && ` (${statusFilter})`}
        </span>
        {selectedAlerts.size > 0 && (
          <span className="text-sm text-blue-600">
            {selectedAlerts.size} selected
          </span>
        )}
      </div>

      {/* Alerts Table */}
      {filteredAlerts.length === 0 ? (
        <div
          className="text-center py-12 bg-gray-50 rounded-lg"
          data-testid="alerts-empty"
        >
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No alerts found</h3>
          <p className="mt-2 text-gray-500">
            {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first alert to get started'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedAlerts.size === filteredAlerts.length && filteredAlerts.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Name
                    {sortField === 'name' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-1">
                    Type
                    {sortField === 'type' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Condition
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {sortField === 'status' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('lastTriggeredAt')}
                >
                  <div className="flex items-center gap-1">
                    Last Triggered
                    {sortField === 'lastTriggeredAt' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAlerts.map((alert) => (
                <tr
                  key={alert.id}
                  className={`hover:bg-gray-50 ${!alert.enabled ? 'opacity-60' : ''}`}
                  data-testid={`alert-row-${alert.id}`}
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedAlerts.has(alert.id)}
                      onChange={() => toggleSelection(alert.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => onAlertClick?.(alert)}
                      className="text-left hover:text-blue-600"
                    >
                      <div className="font-medium text-gray-900">{alert.name}</div>
                      {alert.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {alert.description}
                        </div>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {TYPE_LABELS[alert.type]}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 font-mono">
                    {getConfigSummary(alert)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_COLORS[alert.status].bg
                      } ${STATUS_COLORS[alert.status].text}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[alert.status].dot}`}
                      />
                      {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {alert.lastTriggeredAt
                      ? new Date(alert.lastTriggeredAt).toLocaleDateString()
                      : 'Never'}
                    {alert.triggerCount > 0 && (
                      <span className="text-gray-400 ml-1">
                        ({alert.triggerCount}x)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Toggle Enable/Disable */}
                      <button
                        onClick={() => onToggleAlert?.(alert.id, !alert.enabled)}
                        className={`p-1.5 rounded hover:bg-gray-100 ${
                          alert.enabled ? 'text-green-600' : 'text-gray-400'
                        }`}
                        title={alert.enabled ? 'Disable alert' : 'Enable alert'}
                        data-testid={`toggle-alert-${alert.id}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {alert.enabled ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          )}
                        </svg>
                      </button>

                      {/* Duplicate */}
                      <button
                        onClick={() => onDuplicateAlert?.(alert.id)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                        title="Duplicate alert"
                        data-testid={`duplicate-alert-${alert.id}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteClick(alert.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
                        title="Delete alert"
                        data-testid={`delete-alert-${alert.id}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setDeleteConfirmId(null)}
          data-testid="delete-confirm-modal"
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Alert
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this alert? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                data-testid="confirm-delete-button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlertsList;
