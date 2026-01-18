/**
 * OrderHistoryTable Component
 *
 * Displays order history with filtering, sorting, and pagination.
 */

import { useState, useMemo } from 'react';
import type { AlpacaOrder, OrderStatus, OrderSide, OrderType } from '../../types/alpaca';

interface OrderHistoryTableProps {
  /** List of orders to display */
  orders: AlpacaOrder[];
  /** Whether data is loading */
  loading?: boolean;
  /** Callback when refresh is requested */
  onRefresh?: () => void;
  /** Callback to cancel an order */
  onCancelOrder?: (orderId: string) => Promise<void>;
  /** Currency symbol */
  currency?: string;
  /** Items per page */
  pageSize?: number;
}

type StatusFilter = 'all' | 'open' | 'filled' | 'canceled' | 'pending';
type SideFilter = 'all' | 'buy' | 'sell';
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';
type SortField = 'createdAt' | 'symbol' | 'side' | 'status' | 'qty';
type SortDirection = 'asc' | 'desc';

const STATUS_COLORS: Record<OrderStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  partially_filled: 'bg-yellow-100 text-yellow-800',
  filled: 'bg-green-100 text-green-800',
  done_for_day: 'bg-gray-100 text-gray-800',
  canceled: 'bg-gray-100 text-gray-600',
  expired: 'bg-gray-100 text-gray-600',
  replaced: 'bg-purple-100 text-purple-800',
  pending_cancel: 'bg-orange-100 text-orange-800',
  pending_replace: 'bg-orange-100 text-orange-800',
  pending_new: 'bg-blue-100 text-blue-800',
  accepted: 'bg-blue-100 text-blue-800',
  stopped: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
  suspended: 'bg-red-100 text-red-800',
  calculated: 'bg-gray-100 text-gray-800',
};

export function OrderHistoryTable({
  orders,
  loading = false,
  onRefresh,
  onCancelOrder,
  currency = '$',
  pageSize = 10,
}: OrderHistoryTableProps) {
  // Filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sideFilter, setSideFilter] = useState<SideFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [symbolFilter, setSymbolFilter] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // UI state
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Get date filter range
  const getDateRange = (filter: DateFilter): Date | null => {
    const now = new Date();
    switch (filter) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      case 'year':
        return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      default:
        return null;
    }
  };

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Status filter
    if (statusFilter !== 'all') {
      const statusMap: Record<StatusFilter, OrderStatus[]> = {
        all: [],
        open: ['new', 'accepted', 'pending_new', 'partially_filled'],
        filled: ['filled'],
        canceled: ['canceled', 'expired', 'rejected'],
        pending: ['pending_cancel', 'pending_replace'],
      };
      filtered = filtered.filter((order) =>
        statusMap[statusFilter].includes(order.status)
      );
    }

    // Side filter
    if (sideFilter !== 'all') {
      filtered = filtered.filter((order) => order.side === sideFilter);
    }

    // Date filter
    const dateRange = getDateRange(dateFilter);
    if (dateRange) {
      filtered = filtered.filter(
        (order) => new Date(order.createdAt) >= dateRange
      );
    }

    // Symbol filter
    if (symbolFilter.trim()) {
      const search = symbolFilter.toUpperCase().trim();
      filtered = filtered.filter((order) =>
        order.symbol.toUpperCase().includes(search)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'side':
          comparison = a.side.localeCompare(b.side);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'qty':
          comparison = a.qty - b.qty;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [orders, statusFilter, sideFilter, dateFilter, symbolFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Reset page when filters change
  const handleFilterChange = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setCurrentPage(1);
  };

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // Handle order cancellation
  const handleCancelOrder = async (orderId: string) => {
    if (!onCancelOrder) return;
    setCancelingOrderId(orderId);
    try {
      await onCancelOrder(orderId);
    } finally {
      setCancelingOrderId(null);
    }
  };

  const canCancel = (status: OrderStatus): boolean => {
    return ['new', 'accepted', 'pending_new', 'partially_filled'].includes(status);
  };

  const formatOrderType = (type: OrderType, limitPrice?: number, stopPrice?: number): string => {
    let display = type.replace('_', ' ').toUpperCase();
    if (limitPrice) display += ` @ ${currency}${limitPrice.toFixed(2)}`;
    if (stopPrice) display += ` (stop: ${currency}${stopPrice.toFixed(2)})`;
    return display;
  };

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>;
  };

  // Count active filters
  const activeFilterCount = [
    statusFilter !== 'all',
    sideFilter !== 'all',
    dateFilter !== 'all',
    symbolFilter.trim() !== '',
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="order-history-table bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="order-history-table bg-white rounded-lg shadow-sm border border-gray-200"
      data-testid="order-history-table"
    >
      {/* Header */}
      <div className="table-header p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              data-testid="toggle-filters"
            >
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </span>
            </button>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh orders"
                data-testid="refresh-button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange(setStatusFilter)(e.target.value as StatusFilter)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-testid="status-filter"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="filled">Filled</option>
                <option value="canceled">Canceled/Rejected</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Side</label>
              <select
                value={sideFilter}
                onChange={(e) => handleFilterChange(setSideFilter)(e.target.value as SideFilter)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-testid="side-filter"
              >
                <option value="all">All Sides</option>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => handleFilterChange(setDateFilter)(e.target.value as DateFilter)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-testid="date-filter"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Symbol</label>
              <input
                type="text"
                value={symbolFilter}
                onChange={(e) => handleFilterChange(setSymbolFilter)(e.target.value)}
                placeholder="Search symbol..."
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-testid="symbol-filter"
              />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {paginatedOrders.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-medium">No orders found</p>
          <p className="text-sm mt-1">
            {activeFilterCount > 0
              ? 'Try adjusting your filters to see more orders.'
              : 'Place your first order to see it here.'}
          </p>
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setSideFilter('all');
                setDateFilter('all');
                setSymbolFilter('');
                setCurrentPage(1);
              }}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdAt')}
                >
                  Date <SortIndicator field="createdAt" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('symbol')}
                >
                  Symbol <SortIndicator field="symbol" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('side')}
                >
                  Side <SortIndicator field="side" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('qty')}
                >
                  Qty <SortIndicator field="qty" />
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Filled
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Price
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  Status <SortIndicator field="status" />
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedOrders.map((order) => (
                <>
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors"
                    data-testid={`order-row-${order.id}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{order.symbol}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          order.side === 'buy'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {order.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {formatOrderType(order.type, order.limitPrice, order.stopPrice)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {order.qty}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                      {order.filledQty > 0 ? order.filledQty : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {order.filledAvgPrice
                        ? `${currency}${order.filledAvgPrice.toFixed(2)}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          STATUS_COLORS[order.status]
                        }`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            setExpandedOrderId(
                              expandedOrderId === order.id ? null : order.id
                            )
                          }
                          className="text-gray-400 hover:text-gray-600 p-1"
                          title="View details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        {canCancel(order.status) && onCancelOrder && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancelingOrderId === order.id}
                            className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50"
                            title="Cancel order"
                            data-testid={`cancel-order-${order.id}`}
                          >
                            {cancelingOrderId === order.id ? (
                              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedOrderId === order.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={9} className="px-4 py-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Order ID</span>
                            <p className="font-mono text-xs mt-1">{order.id}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Client Order ID</span>
                            <p className="font-mono text-xs mt-1">{order.clientOrderId}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Time in Force</span>
                            <p className="mt-1 uppercase">{order.timeInForce}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Extended Hours</span>
                            <p className="mt-1">{order.extendedHours ? 'Yes' : 'No'}</p>
                          </div>
                          {order.filledAt && (
                            <div>
                              <span className="text-gray-500">Filled At</span>
                              <p className="mt-1">{new Date(order.filledAt).toLocaleString()}</p>
                            </div>
                          )}
                          {order.canceledAt && (
                            <div>
                              <span className="text-gray-500">Canceled At</span>
                              <p className="mt-1">{new Date(order.canceledAt).toLocaleString()}</p>
                            </div>
                          )}
                          {order.expiredAt && (
                            <div>
                              <span className="text-gray-500">Expired At</span>
                              <p className="mt-1">{new Date(order.expiredAt).toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer with pagination */}
      <div className="table-footer px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {paginatedOrders.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
          {filteredOrders.length !== orders.length && ` (${orders.length} total)`}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="First page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous page"
              data-testid="prev-page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <span className="px-3 py-1 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next page"
              data-testid="next-page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Last page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderHistoryTable;
