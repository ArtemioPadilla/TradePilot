/**
 * MarketsPage Component
 *
 * Enhanced markets page with:
 * - Market Overview (Top/Lowest performers)
 * - Category filtering and asset table
 * - User-specific section (Watchlist, Strategies, Holdings)
 */

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { Search, RefreshCw } from 'lucide-react';

import {
  $marketAssets,
  $sortedAssets,
  $selectedCategory,
  $searchQuery,
  $sortConfig,
  $marketDataLoading,
  $lastRefresh,
  loadMarketData,
  setCategory,
  setSearchQuery,
  toggleSort,
  CATEGORY_METADATA,
} from '../../stores/markets';
import {
  $watchlistSymbols,
  addToWatchlist,
  removeFromWatchlist,
} from '../../stores/watchlist';
import { $user } from '../../stores/auth';
import type { AssetCategory, AssetSortField, WatchlistFormData } from '../../types/markets';

import MarketOverviewSection from './MarketOverviewSection';
import AssetTable from './AssetTable';
import UserMarketsSection from './UserMarketsSection';
import AddToWatchlistModal from './AddToWatchlistModal';

// Category icons as SVG components
const CategoryIcons: Record<string, JSX.Element> = {
  'trending-up': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  'layers': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  'shield': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
    </svg>
  ),
  'percent': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="5" x2="5" y2="19"/>
      <circle cx="6.5" cy="6.5" r="2.5"/>
      <circle cx="17.5" cy="17.5" r="2.5"/>
    </svg>
  ),
  'gem': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12l4 6-10 13L2 9Z"/>
      <path d="M11 3 8 9l4 13 4-13-3-6"/>
      <path d="M2 9h20"/>
    </svg>
  ),
  'bitcoin': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m5.155-6.2L8.29 4.26m5.908 1.042.348-1.97M7.48 20.364l3.126-17.727"/>
    </svg>
  ),
};

const ICON_MAP: Record<AssetCategory | 'all', string> = {
  all: 'layers',
  stocks: 'trending-up',
  etfs: 'layers',
  bonds: 'shield',
  'fixed-income': 'percent',
  commodities: 'gem',
  crypto: 'bitcoin',
};

export function MarketsPage() {
  const user = useStore($user);
  const sortedAssets = useStore($sortedAssets);
  const selectedCategory = useStore($selectedCategory);
  const searchQuery = useStore($searchQuery);
  const sortConfig = useStore($sortConfig);
  const isLoading = useStore($marketDataLoading);
  const lastRefresh = useStore($lastRefresh);
  const watchlistSymbols = useStore($watchlistSymbols);

  // Modal state
  const [watchlistModal, setWatchlistModal] = useState<{
    isOpen: boolean;
    symbol: string;
    name: string;
  }>({ isOpen: false, symbol: '', name: '' });
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);

  // Load market data on mount
  useEffect(() => {
    loadMarketData();
  }, []);

  // Handlers
  const handleCategoryChange = (category: AssetCategory | 'all') => {
    setCategory(category);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSort = (field: AssetSortField) => {
    toggleSort(field);
  };

  const handleRefresh = () => {
    loadMarketData();
  };

  const handleAssetClick = (symbol: string) => {
    // Could open asset detail modal or navigate
    console.log('Asset clicked:', symbol);
  };

  const handleOpenWatchlistModal = (symbol: string, name: string) => {
    setWatchlistModal({ isOpen: true, symbol, name });
  };

  const handleCloseWatchlistModal = () => {
    setWatchlistModal({ isOpen: false, symbol: '', name: '' });
  };

  const handleAddToWatchlist = useCallback(
    async (notes?: string) => {
      if (!user?.id) return;

      setIsAddingToWatchlist(true);

      const asset = sortedAssets.find(
        a => a.symbol.toUpperCase() === watchlistModal.symbol.toUpperCase()
      );

      const formData: WatchlistFormData = {
        symbol: watchlistModal.symbol,
        name: watchlistModal.name,
        category: asset?.category || 'stocks',
        notes,
      };

      const success = await addToWatchlist(user.id, formData);

      setIsAddingToWatchlist(false);

      if (success) {
        handleCloseWatchlistModal();
      }
    },
    [user?.id, watchlistModal.symbol, watchlistModal.name, sortedAssets]
  );

  const handleRemoveFromWatchlist = useCallback(
    async (symbol: string) => {
      if (!user?.id) return;
      await removeFromWatchlist(user.id, symbol);
    },
    [user?.id]
  );

  const handleCreateAlert = (symbol: string) => {
    // Navigate to alerts page with symbol pre-filled
    window.location.href = `/dashboard/alerts?symbol=${symbol}`;
  };

  // Categories for tabs
  const categories: (AssetCategory | 'all')[] = [
    'stocks',
    'etfs',
    'bonds',
    'fixed-income',
    'commodities',
    'crypto',
  ];

  return (
    <div className="markets-page">
      {/* Header */}
      <div className="markets-header">
        <div className="header-text">
          <h2>Markets</h2>
          <p>Browse market data across different asset classes</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={isLoading}
            title={lastRefresh ? `Last updated: ${lastRefresh.toLocaleTimeString()}` : 'Refresh'}
          >
            <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Market Overview Section */}
      <MarketOverviewSection
        watchlistSymbols={watchlistSymbols}
        onAssetClick={handleAssetClick}
        onAddToWatchlist={handleOpenWatchlistModal}
      />

      {/* Category Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          {categories.map(cat => {
            const meta = CATEGORY_METADATA[cat];
            const iconKey = ICON_MAP[cat];

            return (
              <button
                key={cat}
                className={`tab ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat)}
              >
                {CategoryIcons[iconKey]}
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Asset Table */}
      <div className="assets-section">
        <AssetTable
          assets={sortedAssets}
          sortConfig={sortConfig}
          onSort={handleSort}
          showActions={true}
          watchlistSymbols={watchlistSymbols}
          onAddToWatchlist={handleOpenWatchlistModal}
          onRemoveFromWatchlist={handleRemoveFromWatchlist}
          onCreateAlert={handleCreateAlert}
          onRowClick={handleAssetClick}
          emptyMessage={
            searchQuery
              ? `No assets found matching "${searchQuery}"`
              : 'No assets available'
          }
        />
      </div>

      {/* User Section (Watchlist, Strategies, Holdings) */}
      <UserMarketsSection
        onAssetClick={handleAssetClick}
        onRemoveFromWatchlist={handleRemoveFromWatchlist}
        onCreateAlert={handleCreateAlert}
      />

      {/* Add to Watchlist Modal */}
      <AddToWatchlistModal
        symbol={watchlistModal.symbol}
        name={watchlistModal.name}
        isOpen={watchlistModal.isOpen}
        onClose={handleCloseWatchlistModal}
        onConfirm={handleAddToWatchlist}
        isLoading={isAddingToWatchlist}
      />

      <style>{`
        .markets-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .markets-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .header-text h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.25rem;
        }

        .header-text p {
          color: var(--text-muted);
          margin: 0;
          font-size: 0.875rem;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          min-width: 250px;
          transition: border-color 0.15s ease;
        }

        .search-box:focus-within {
          border-color: var(--accent);
        }

        .search-box svg {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .search-box input {
          background: none;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 0.875rem;
          width: 100%;
        }

        .search-box input::placeholder {
          color: var(--text-muted);
        }

        .refresh-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .refresh-btn:hover:not(:disabled) {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .refresh-btn .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .tabs-container {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 0.5rem;
          overflow-x: auto;
        }

        .tabs {
          display: flex;
          gap: 0.25rem;
          min-width: max-content;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: none;
          border: none;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .tab:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .tab.active {
          background: var(--accent);
          color: white;
        }

        .tab svg {
          flex-shrink: 0;
        }

        .assets-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .markets-header {
            flex-direction: column;
          }

          .header-actions {
            width: 100%;
          }

          .search-box {
            flex: 1;
            min-width: unset;
          }

          .tab span {
            display: none;
          }

          .tab {
            padding: 0.75rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default MarketsPage;
