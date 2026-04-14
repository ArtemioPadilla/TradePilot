/**
 * UserMarketsSection Component
 *
 * Container for user-specific market widgets with auth handling.
 */

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $user } from '../../stores/auth';
import { $watchlist, $watchlistLoading, subscribeToWatchlist, unsubscribeFromWatchlist } from '../../stores/watchlist';
import { $marketAssets } from '../../stores/markets';
import type { MarketAsset, HoldingSnapshotItem, StrategySignal, StrategySignalType } from '../../types/markets';
import { calculateStrategySignals } from '../../lib/services/market-data';
import UserWatchlistCard from './UserWatchlistCard';
import StrategyUniverseCard from './StrategyUniverseCard';
import StrategySignalsCard from './StrategySignalsCard';
import UserHoldingsSnapshot from './UserHoldingsSnapshot';
import LoginPromptOverlay from './LoginPromptOverlay';
import { appPath } from '../../lib/utils/paths';

interface Strategy {
  id: string;
  name: string;
  universe: 'sp500' | 'nasdaq100' | 'dow30' | 'etf_universe' | 'custom';
  customSymbols?: string[];
  type: string;
}

interface UserMarketsSectionProps {
  onAssetClick?: (symbol: string) => void;
  onRemoveFromWatchlist?: (symbol: string) => void;
  onCreateAlert?: (symbol: string) => void;
}

export default function UserMarketsSection({
  onAssetClick,
  onRemoveFromWatchlist,
  onCreateAlert,
}: UserMarketsSectionProps) {
  const user = useStore($user);
  const watchlist = useStore($watchlist);
  const watchlistLoading = useStore($watchlistLoading);
  const marketAssets = useStore($marketAssets);

  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('');
  const [selectedSignalType, setSelectedSignalType] = useState<StrategySignalType>('momentum');

  // Mock strategies data (in real app, this would come from Firestore)
  const [strategies] = useState<Strategy[]>([
    { id: '1', name: 'Growth Momentum', universe: 'nasdaq100', type: 'momentum' },
    { id: '2', name: 'Value Investing', universe: 'sp500', type: 'mean_reversion' },
    { id: '3', name: 'Diversified ETF', universe: 'etf_universe', type: 'equal_weight' },
  ]);

  // Mock holdings data (in real app, this would come from portfolio service)
  const [holdings] = useState<HoldingSnapshotItem[]>([
    {
      symbol: 'AAPL',
      name: 'Apple Inc',
      quantity: 50,
      currentPrice: 185.92,
      currentValue: 9296,
      dayChange: 64,
      dayChangePercent: 0.69,
      totalPL: 1796,
      totalPLPercent: 23.96,
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corp',
      quantity: 30,
      currentPrice: 378.91,
      currentValue: 11367.3,
      dayChange: 136.8,
      dayChangePercent: 1.22,
      totalPL: 2967.3,
      totalPLPercent: 35.33,
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      quantity: 15,
      currentPrice: 495.22,
      currentValue: 7428.3,
      dayChange: 186.75,
      dayChangePercent: 2.58,
      totalPL: 3178.3,
      totalPLPercent: 74.73,
    },
  ]);

  // Subscribe to watchlist when user is logged in
  useEffect(() => {
    if (user?.id) {
      subscribeToWatchlist(user.id);
    }

    return () => {
      unsubscribeFromWatchlist();
    };
  }, [user?.id]);

  // Set default strategy
  useEffect(() => {
    if (strategies.length > 0 && !selectedStrategyId) {
      setSelectedStrategyId(strategies[0].id);
    }
  }, [strategies, selectedStrategyId]);

  // Create market data map for quick lookup
  const marketDataMap = new Map<string, MarketAsset>(
    marketAssets.map(asset => [asset.symbol.toUpperCase(), asset])
  );

  // Get watchlist symbols
  const watchlistSymbols = watchlist.map(item => item.symbol);

  // Calculate signals for display
  const assetsWithSignals = marketAssets.slice(0, 8).map(asset => ({
    ...asset,
    signal: calculateStrategySignals(asset, [selectedSignalType])[0],
  }));

  // Calculate portfolio totals
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalDayChange = holdings.reduce((sum, h) => sum + h.dayChange, 0);
  const totalDayChangePercent = totalValue > 0 ? (totalDayChange / (totalValue - totalDayChange)) * 100 : 0;

  // Show login prompt for unauthenticated users
  if (!user) {
    return (
      <section className="user-markets-section">
        <div className="section-header">
          <h2>Your Trading Tools</h2>
          <p className="section-description">
            Personalized watchlist, portfolio tracking, and strategy insights
          </p>
        </div>

        <LoginPromptOverlay
          title="Sign in to unlock personalized features"
          description="Create a free account to access powerful trading tools"
          features={[
            'Track your favorite assets with watchlists',
            'Monitor your portfolio performance',
            'Get strategy-based insights',
            'Create price alerts',
          ]}
        />

        <style>{`
          .user-markets-section {
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid var(--border);
          }

          .section-header {
            margin-bottom: 1.25rem;
          }

          .section-header h2 {
            margin: 0 0 0.25rem 0;
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-primary);
          }

          .section-description {
            margin: 0;
            font-size: 0.875rem;
            color: var(--text-muted);
          }
        `}</style>
      </section>
    );
  }

  return (
    <section className="user-markets-section">
      <div className="section-header">
        <h2>Your Trading Tools</h2>
        <p className="section-description">
          Personalized watchlist, portfolio tracking, and strategy insights
        </p>
      </div>

      <div className="user-widgets-grid">
        <div className="widget-column">
          <UserWatchlistCard
            items={watchlist}
            marketData={marketDataMap}
            isLoading={watchlistLoading}
            onRemove={symbol => onRemoveFromWatchlist?.(symbol)}
            onCreateAlert={symbol => onCreateAlert?.(symbol)}
            onViewDetails={symbol => onAssetClick?.(symbol)}
          />

          <UserHoldingsSnapshot
            holdings={holdings}
            totalValue={totalValue}
            totalDayChange={totalDayChange}
            totalDayChangePercent={totalDayChangePercent}
            onViewAll={() => window.location.href = appPath('/dashboard/accounts')}
            onAssetClick={onAssetClick}
          />
        </div>

        <div className="widget-column">
          <StrategyUniverseCard
            strategies={strategies}
            marketData={marketDataMap}
            watchlistSymbols={watchlistSymbols}
            selectedStrategyId={selectedStrategyId}
            onStrategySelect={setSelectedStrategyId}
            onViewStrategy={id => window.location.href = appPath(`/dashboard/strategies?id=${id}`)}
            onRunBacktest={id => window.location.href = appPath(`/dashboard/backtest?strategy=${id}`)}
            onAssetClick={onAssetClick}
          />

          <StrategySignalsCard
            assets={assetsWithSignals}
            signalType={selectedSignalType}
            onSignalTypeChange={setSelectedSignalType}
            onAssetClick={onAssetClick}
          />
        </div>
      </div>

      <style>{`
        .user-markets-section {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border);
        }

        .section-header {
          margin-bottom: 1.25rem;
        }

        .section-header h2 {
          margin: 0 0 0.25rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .section-description {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .user-widgets-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .widget-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        @media (max-width: 1024px) {
          .user-widgets-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
