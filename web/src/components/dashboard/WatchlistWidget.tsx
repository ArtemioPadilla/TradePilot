import { formatCurrency, formatPercent } from '../../lib/utils';

interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const mockWatchlist: WatchlistItem[] = [
  { symbol: 'SPY', name: 'S&P 500 ETF', price: 478.32, change: 4.21, changePercent: 0.89 },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF', price: 412.56, change: -2.34, changePercent: -0.56 },
  { symbol: 'BTC-USD', name: 'Bitcoin', price: 43250.0, change: 1250.0, changePercent: 2.98 },
  { symbol: 'AMZN', name: 'Amazon', price: 178.42, change: 3.12, changePercent: 1.78 },
  { symbol: 'META', name: 'Meta Platforms', price: 485.23, change: -5.67, changePercent: -1.15 },
];

export default function WatchlistWidget() {
  return (
    <div className="watchlist-widget">
      <div className="watchlist-items">
        {mockWatchlist.map((item) => (
          <div key={item.symbol} className="watchlist-item">
            <div className="item-info">
              <span className="item-symbol">{item.symbol}</span>
              <span className="item-name">{item.name}</span>
            </div>
            <div className="item-price">
              <span className="price">{formatCurrency(item.price)}</span>
              <span className={`change ${item.change >= 0 ? 'positive' : 'negative'}`}>
                {formatPercent(item.changePercent)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .watchlist-widget {
          display: flex;
          flex-direction: column;
        }

        .watchlist-items {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .watchlist-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.625rem 0;
          border-bottom: 1px solid var(--border);
        }

        .watchlist-item:last-child {
          border-bottom: none;
        }

        .item-info {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .item-symbol {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .item-name {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .item-price {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.125rem;
        }

        .price {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .change {
          font-size: 0.75rem;
          font-weight: 500;
        }

        .change.positive {
          color: var(--positive);
        }

        .change.negative {
          color: var(--negative);
        }
      `}</style>
    </div>
  );
}
