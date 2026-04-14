/**
 * HoldingsTable Component
 *
 * Displays user's current holdings from all connected sources.
 */

import { formatCurrency, formatPercent } from '../../lib/utils';
import { appPath } from '../../lib/utils/paths';
import type { Holding } from '../../types/portfolio';

// Map common stock symbols to company names
const SYMBOL_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc',
  GOOGL: 'Alphabet Inc',
  GOOG: 'Alphabet Inc',
  MSFT: 'Microsoft Corp',
  AMZN: 'Amazon.com Inc',
  NVDA: 'NVIDIA Corp',
  TSLA: 'Tesla Inc',
  META: 'Meta Platforms',
  JPM: 'JPMorgan Chase',
  V: 'Visa Inc',
  JNJ: 'Johnson & Johnson',
  UNH: 'UnitedHealth Group',
  AMD: 'AMD Inc',
  NFLX: 'Netflix Inc',
  DIS: 'Walt Disney Co',
  PYPL: 'PayPal Holdings',
  INTC: 'Intel Corp',
  VTI: 'Vanguard Total Stock',
  VOO: 'Vanguard S&P 500',
  QQQ: 'Invesco QQQ Trust',
  SPY: 'SPDR S&P 500',
  IWM: 'iShares Russell 2000',
  BND: 'Vanguard Total Bond',
};

export interface HoldingsTableProps {
  holdings: Holding[];
  isLoading: boolean;
  hasIntegrations: boolean;
}

export default function HoldingsTable({
  holdings: portfolioHoldings,
  isLoading,
  hasIntegrations,
}: HoldingsTableProps) {

  // Transform holdings to table data
  const holdings = portfolioHoldings.map(holding => ({
    id: holding.id,
    symbol: holding.symbol,
    name: holding.name || SYMBOL_NAMES[holding.symbol] || holding.symbol,
    quantity: holding.quantity,
    currentPrice: holding.currentPrice || 0,
    marketValue: holding.marketValue || 0,
    costBasis: holding.totalCostBasis,
    avgCost: holding.costBasisPerShare,
    unrealizedPL: holding.unrealizedPL || 0,
    unrealizedPLPercent: holding.unrealizedPLPercent || 0,
    source: holding.dataSource,
  }));

  // Sort by market value descending
  const sortedHoldings = holdings.sort((a, b) => b.marketValue - a.marketValue).slice(0, 10);

  if (!hasIntegrations && !isLoading) {
    return (
      <div className="holdings-table-container">
        <div className="empty-state">
          <p>Connect an account to see your holdings</p>
          <a href={appPath('/dashboard/settings?tab=connections')} className="connect-link">Connect Account</a>
        </div>
        <style>{`
          .holdings-table-container {
            overflow-x: auto;
          }
          .empty-state {
            padding: 2rem;
            text-align: center;
            color: var(--text-muted);
          }
          .connect-link {
            display: inline-block;
            margin-top: 0.5rem;
            color: var(--accent);
            text-decoration: none;
          }
          .connect-link:hover {
            text-decoration: underline;
          }
        `}</style>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="holdings-table-container">
        <table className="holdings-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Name</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Price</th>
              <th className="text-right">Value</th>
              <th className="text-right">P&L</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map(i => (
              <tr key={i}>
                <td><span className="skeleton" style={{ width: '50px' }} /></td>
                <td><span className="skeleton" style={{ width: '120px' }} /></td>
                <td className="text-right"><span className="skeleton" style={{ width: '40px' }} /></td>
                <td className="text-right"><span className="skeleton" style={{ width: '70px' }} /></td>
                <td className="text-right"><span className="skeleton" style={{ width: '80px' }} /></td>
                <td className="text-right"><span className="skeleton" style={{ width: '90px' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <style>{`
          .holdings-table-container { overflow-x: auto; }
          .holdings-table { width: 100%; border-collapse: collapse; }
          .holdings-table th, .holdings-table td {
            padding: calc(0.75rem * var(--spacing-density)) calc(0.5rem * var(--spacing-density));
            text-align: left;
            border-bottom: 1px solid var(--border);
          }
          .holdings-table th {
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .text-right { text-align: right; }
          .skeleton {
            display: inline-block;
            height: 16px;
            background: var(--bg-tertiary);
            border-radius: var(--radius-sm);
            animation: pulse 1.5s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="holdings-table-container">
      <table className="holdings-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th className="text-right">Qty</th>
            <th className="text-right">Price</th>
            <th className="text-right">Value</th>
            <th className="text-right">P&L</th>
          </tr>
        </thead>
        <tbody>
          {sortedHoldings.map((holding) => (
            <tr key={holding.id}>
              <td>
                <span className="symbol">{holding.symbol}</span>
              </td>
              <td>
                <span className="name">{holding.name}</span>
              </td>
              <td className="text-right">{holding.quantity}</td>
              <td className="text-right">{formatCurrency(holding.currentPrice)}</td>
              <td className="text-right">{formatCurrency(holding.marketValue)}</td>
              <td className="text-right">
                <div className="pnl-cell">
                  <span className={holding.unrealizedPL >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(holding.unrealizedPL)}
                  </span>
                  <span className={`pnl-percent ${holding.unrealizedPLPercent >= 0 ? 'positive' : 'negative'}`}>
                    {formatPercent(holding.unrealizedPLPercent)}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sortedHoldings.length === 0 && (
        <div className="empty-state">
          <p>No positions yet. Start trading to build your portfolio.</p>
        </div>
      )}

      <style>{`
        .holdings-table-container {
          overflow-x: auto;
        }

        .holdings-table {
          width: 100%;
          border-collapse: collapse;
        }

        .holdings-table th,
        .holdings-table td {
          padding: calc(0.75rem * var(--spacing-density)) calc(0.5rem * var(--spacing-density));
          text-align: left;
          border-bottom: 1px solid var(--border);
        }

        .holdings-table th {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .holdings-table td {
          font-size: 0.875rem;
        }

        .holdings-table tbody tr:hover {
          background-color: var(--bg-tertiary);
        }

        .text-right {
          text-align: right;
        }

        .symbol {
          font-weight: 600;
          color: var(--text-primary);
        }

        .name {
          color: var(--text-muted);
          font-size: 0.8125rem;
        }

        .pnl-cell {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.125rem;
        }

        .pnl-percent {
          font-size: 0.75rem;
        }

        .positive {
          color: var(--positive);
        }

        .negative {
          color: var(--negative);
        }

        .empty-state {
          padding: 2rem;
          text-align: center;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
