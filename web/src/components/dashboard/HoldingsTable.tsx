import { useStore } from '@nanostores/react';
import { $accounts } from '../../stores/portfolio';
import { formatCurrency, formatPercent, calculatePnL } from '../../lib/utils';

export default function HoldingsTable() {
  const accounts = useStore($accounts);

  // Flatten all holdings from all accounts
  const allHoldings = accounts.flatMap((account) =>
    account.holdings.map((holding) => ({
      ...holding,
      accountName: account.name,
      pnl: calculatePnL(holding.quantity, holding.avgCost, holding.currentPrice),
      marketValue: holding.quantity * holding.currentPrice,
    }))
  );

  // Sort by market value descending
  const sortedHoldings = allHoldings.sort((a, b) => b.marketValue - a.marketValue).slice(0, 10);

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
                  <span className={holding.pnl.value >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(holding.pnl.value)}
                  </span>
                  <span className={`pnl-percent ${holding.pnl.percent >= 0 ? 'positive' : 'negative'}`}>
                    {formatPercent(holding.pnl.percent)}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sortedHoldings.length === 0 && (
        <div className="empty-state">
          <p>No holdings yet. Add your first position to get started.</p>
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
