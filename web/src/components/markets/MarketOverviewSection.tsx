/**
 * MarketOverviewSection Component
 *
 * Container for the market overview widgets (Top/Lowest performers).
 */

import { useStore } from '@nanostores/react';
import {
  $topPerformers,
  $lowestPerformers,
  $performancePeriod,
  $marketDataLoading,
  setPerformancePeriod,
} from '../../stores/markets';
import type { PerformancePeriod } from '../../types/markets';
import TopPerformersCard from './TopPerformersCard';
import LowestPerformersCard from './LowestPerformersCard';

interface MarketOverviewSectionProps {
  watchlistSymbols?: string[];
  onAssetClick?: (symbol: string) => void;
  onAddToWatchlist?: (symbol: string, name: string) => void;
}

export default function MarketOverviewSection({
  watchlistSymbols = [],
  onAssetClick,
  onAddToWatchlist,
}: MarketOverviewSectionProps) {
  const topPerformers = useStore($topPerformers);
  const lowestPerformers = useStore($lowestPerformers);
  const period = useStore($performancePeriod);
  const isLoading = useStore($marketDataLoading);

  const handlePeriodChange = (newPeriod: PerformancePeriod) => {
    setPerformancePeriod(newPeriod);
  };

  return (
    <section className="market-overview-section">
      <div className="section-header">
        <h2>Market Overview</h2>
        <p className="section-description">
          Today's market movers across all asset classes
        </p>
      </div>

      <div className="overview-grid">
        <TopPerformersCard
          assets={topPerformers}
          period={period}
          onPeriodChange={handlePeriodChange}
          onAssetClick={onAssetClick}
          onAddToWatchlist={onAddToWatchlist}
          watchlistSymbols={watchlistSymbols}
          isLoading={isLoading}
        />
        <LowestPerformersCard
          assets={lowestPerformers}
          period={period}
          onPeriodChange={handlePeriodChange}
          onAssetClick={onAssetClick}
          onAddToWatchlist={onAddToWatchlist}
          watchlistSymbols={watchlistSymbols}
          isLoading={isLoading}
        />
      </div>

      <style>{`
        .market-overview-section {
          margin-bottom: 2rem;
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

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 1024px) {
          .overview-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
