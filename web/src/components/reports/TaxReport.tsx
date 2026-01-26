/**
 * Tax Report Component
 *
 * Displays tax summary, Form 8949 data, and estimated tax liability.
 * Provides CSV export functionality.
 */

import { useState, useMemo } from 'react';
import type {
  TaxSummary,
  Form8949Entry,
  Trade,
} from '../../lib/services/tax-calculations';
import {
  calculateTaxSummary,
  generateForm8949,
  exportTaxDataCSV,
  estimateTaxLiability,
} from '../../lib/services/tax-calculations';

// Mock trades for development
const MOCK_TRADES: Trade[] = [
  {
    id: '1',
    symbol: 'AAPL',
    side: 'buy',
    qty: 50,
    price: 150.0,
    total: 7500.0,
    date: new Date('2024-01-15'),
  },
  {
    id: '2',
    symbol: 'AAPL',
    side: 'sell',
    qty: 25,
    price: 175.0,
    total: 4375.0,
    date: new Date('2024-06-20'),
  },
  {
    id: '3',
    symbol: 'GOOGL',
    side: 'buy',
    qty: 20,
    price: 140.0,
    total: 2800.0,
    date: new Date('2023-03-10'),
  },
  {
    id: '4',
    symbol: 'GOOGL',
    side: 'sell',
    qty: 20,
    price: 175.0,
    total: 3500.0,
    date: new Date('2024-07-15'),
  },
  {
    id: '5',
    symbol: 'MSFT',
    side: 'buy',
    qty: 30,
    price: 380.0,
    total: 11400.0,
    date: new Date('2024-02-01'),
  },
  {
    id: '6',
    symbol: 'MSFT',
    side: 'sell',
    qty: 15,
    price: 365.0,
    total: 5475.0,
    date: new Date('2024-08-10'),
  },
  {
    id: '7',
    symbol: 'NVDA',
    side: 'buy',
    qty: 10,
    price: 480.0,
    total: 4800.0,
    date: new Date('2024-04-05'),
  },
  {
    id: '8',
    symbol: 'NVDA',
    side: 'sell',
    qty: 10,
    price: 720.0,
    total: 7200.0,
    date: new Date('2024-09-01'),
  },
  {
    id: '9',
    symbol: 'TSLA',
    side: 'buy',
    qty: 25,
    price: 250.0,
    total: 6250.0,
    date: new Date('2024-05-15'),
  },
  {
    id: '10',
    symbol: 'TSLA',
    side: 'sell',
    qty: 25,
    price: 220.0,
    total: 5500.0,
    date: new Date('2024-05-25'),
  },
  {
    id: '11',
    symbol: 'TSLA',
    side: 'buy',
    qty: 20,
    price: 225.0,
    total: 4500.0,
    date: new Date('2024-05-28'),
  },
];

// Summary card component
function SummaryCard({
  label,
  value,
  subtitle,
  isPositive,
  isNegative,
}: {
  label: string;
  value: string;
  subtitle?: string;
  isPositive?: boolean;
  isNegative?: boolean;
}) {
  return (
    <div className="summary-card">
      <span className="summary-label">{label}</span>
      <span
        className={`summary-value ${isPositive ? 'positive' : ''} ${isNegative ? 'negative' : ''}`}
      >
        {value}
      </span>
      {subtitle && <span className="summary-subtitle">{subtitle}</span>}
    </div>
  );
}

// Format currency
function formatCurrency(value: number): string {
  const absValue = Math.abs(value);
  const prefix = value < 0 ? '-' : '';
  return `${prefix}$${absValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function TaxReport() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Available years (last 5 years)
  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let i = 0; i < 5; i++) {
      years.push(currentYear - i);
    }
    return years;
  }, [currentYear]);

  // Calculate tax data
  const taxSummary = useMemo<TaxSummary>(() => {
    return calculateTaxSummary(MOCK_TRADES, selectedYear);
  }, [selectedYear]);

  const form8949 = useMemo(() => {
    return generateForm8949(MOCK_TRADES, selectedYear);
  }, [selectedYear]);

  const taxLiability = useMemo(() => {
    return estimateTaxLiability(taxSummary);
  }, [taxSummary]);

  // Handle CSV export
  const handleExportCSV = () => {
    const csv = exportTaxDataCSV(MOCK_TRADES, selectedYear);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-report-${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tax-report">
      {/* Header with year selector */}
      <div className="report-header">
        <div className="header-left">
          <h2>Tax Report</h2>
          <p className="header-subtitle">
            Realized gains/losses and Form 8949 data
          </p>
        </div>
        <div className="header-right">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="year-selector"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button onClick={handleExportCSV} className="export-btn">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Tax Summary Cards */}
      <section className="summary-section">
        <h3>Tax Summary</h3>
        <div className="summary-grid">
          <SummaryCard
            label="Short-term Net"
            value={formatCurrency(taxSummary.shortTermNet)}
            subtitle={`${taxSummary.shortTermGains > 0 ? `+${formatCurrency(taxSummary.shortTermGains)}` : '$0'} gains / ${taxSummary.shortTermLosses > 0 ? `-${formatCurrency(taxSummary.shortTermLosses)}` : '$0'} losses`}
            isPositive={taxSummary.shortTermNet > 0}
            isNegative={taxSummary.shortTermNet < 0}
          />
          <SummaryCard
            label="Long-term Net"
            value={formatCurrency(taxSummary.longTermNet)}
            subtitle={`${taxSummary.longTermGains > 0 ? `+${formatCurrency(taxSummary.longTermGains)}` : '$0'} gains / ${taxSummary.longTermLosses > 0 ? `-${formatCurrency(taxSummary.longTermLosses)}` : '$0'} losses`}
            isPositive={taxSummary.longTermNet > 0}
            isNegative={taxSummary.longTermNet < 0}
          />
          <SummaryCard
            label="Total Net"
            value={formatCurrency(taxSummary.totalNet)}
            subtitle={`${taxSummary.tradeCount} realized transactions`}
            isPositive={taxSummary.totalNet > 0}
            isNegative={taxSummary.totalNet < 0}
          />
          <SummaryCard
            label="Total Proceeds"
            value={formatCurrency(taxSummary.totalProceeds)}
            subtitle={`Cost basis: ${formatCurrency(taxSummary.totalCostBasis)}`}
          />
        </div>
      </section>

      {/* Estimated Tax Liability */}
      <section className="liability-section">
        <h3>Estimated Tax Liability</h3>
        <p className="liability-note">
          Based on 24% short-term and 15% long-term capital gains rates. Consult
          a tax professional for accurate calculations.
        </p>
        <div className="liability-grid">
          <div className="liability-item">
            <span className="liability-label">Short-term Tax (24%)</span>
            <span className="liability-value">
              {formatCurrency(taxLiability.shortTermTax)}
            </span>
          </div>
          <div className="liability-item">
            <span className="liability-label">Long-term Tax (15%)</span>
            <span className="liability-value">
              {formatCurrency(taxLiability.longTermTax)}
            </span>
          </div>
          <div className="liability-item total">
            <span className="liability-label">Total Estimated Tax</span>
            <span className="liability-value">
              {formatCurrency(taxLiability.totalTax)}
            </span>
          </div>
        </div>
      </section>

      {/* Form 8949 Tables */}
      <section className="form8949-section">
        <h3>Form 8949 - Sales and Dispositions</h3>

        {/* Part I - Short-term */}
        <div className="form8949-part">
          <h4>Part I: Short-term (Held 1 year or less)</h4>
          {form8949.partI.length > 0 ? (
            <div className="table-wrapper">
              <table className="form8949-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Acquired</th>
                    <th>Sold</th>
                    <th className="numeric">Proceeds</th>
                    <th className="numeric">Cost Basis</th>
                    <th className="numeric">Adjustment</th>
                    <th className="numeric">Gain/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {form8949.partI.map((entry, idx) => (
                    <tr key={idx}>
                      <td>{entry.description}</td>
                      <td>{entry.acquiredDate}</td>
                      <td>{entry.soldDate}</td>
                      <td className="numeric">{formatCurrency(entry.proceeds)}</td>
                      <td className="numeric">{formatCurrency(entry.costBasis)}</td>
                      <td className="numeric">
                        {entry.adjustment
                          ? `${entry.adjustmentCode}: ${formatCurrency(entry.adjustment)}`
                          : '—'}
                      </td>
                      <td
                        className={`numeric ${entry.gainLoss >= 0 ? 'positive' : 'negative'}`}
                      >
                        {formatCurrency(entry.gainLoss)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}>
                      <strong>Totals</strong>
                    </td>
                    <td className="numeric">
                      <strong>
                        {formatCurrency(
                          form8949.partI.reduce((sum, e) => sum + e.proceeds, 0)
                        )}
                      </strong>
                    </td>
                    <td className="numeric">
                      <strong>
                        {formatCurrency(
                          form8949.partI.reduce((sum, e) => sum + e.costBasis, 0)
                        )}
                      </strong>
                    </td>
                    <td className="numeric">
                      <strong>
                        {formatCurrency(
                          form8949.partI.reduce(
                            (sum, e) => sum + (e.adjustment || 0),
                            0
                          )
                        )}
                      </strong>
                    </td>
                    <td
                      className={`numeric ${
                        form8949.partI.reduce((sum, e) => sum + e.gainLoss, 0) >= 0
                          ? 'positive'
                          : 'negative'
                      }`}
                    >
                      <strong>
                        {formatCurrency(
                          form8949.partI.reduce((sum, e) => sum + e.gainLoss, 0)
                        )}
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="empty-state">No short-term transactions for {selectedYear}</p>
          )}
        </div>

        {/* Part II - Long-term */}
        <div className="form8949-part">
          <h4>Part II: Long-term (Held more than 1 year)</h4>
          {form8949.partII.length > 0 ? (
            <div className="table-wrapper">
              <table className="form8949-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Acquired</th>
                    <th>Sold</th>
                    <th className="numeric">Proceeds</th>
                    <th className="numeric">Cost Basis</th>
                    <th className="numeric">Adjustment</th>
                    <th className="numeric">Gain/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {form8949.partII.map((entry, idx) => (
                    <tr key={idx}>
                      <td>{entry.description}</td>
                      <td>{entry.acquiredDate}</td>
                      <td>{entry.soldDate}</td>
                      <td className="numeric">{formatCurrency(entry.proceeds)}</td>
                      <td className="numeric">{formatCurrency(entry.costBasis)}</td>
                      <td className="numeric">
                        {entry.adjustment
                          ? `${entry.adjustmentCode}: ${formatCurrency(entry.adjustment)}`
                          : '—'}
                      </td>
                      <td
                        className={`numeric ${entry.gainLoss >= 0 ? 'positive' : 'negative'}`}
                      >
                        {formatCurrency(entry.gainLoss)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}>
                      <strong>Totals</strong>
                    </td>
                    <td className="numeric">
                      <strong>
                        {formatCurrency(
                          form8949.partII.reduce((sum, e) => sum + e.proceeds, 0)
                        )}
                      </strong>
                    </td>
                    <td className="numeric">
                      <strong>
                        {formatCurrency(
                          form8949.partII.reduce((sum, e) => sum + e.costBasis, 0)
                        )}
                      </strong>
                    </td>
                    <td className="numeric">
                      <strong>
                        {formatCurrency(
                          form8949.partII.reduce(
                            (sum, e) => sum + (e.adjustment || 0),
                            0
                          )
                        )}
                      </strong>
                    </td>
                    <td
                      className={`numeric ${
                        form8949.partII.reduce((sum, e) => sum + e.gainLoss, 0) >= 0
                          ? 'positive'
                          : 'negative'
                      }`}
                    >
                      <strong>
                        {formatCurrency(
                          form8949.partII.reduce((sum, e) => sum + e.gainLoss, 0)
                        )}
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="empty-state">No long-term transactions for {selectedYear}</p>
          )}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="disclaimer">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p>
          This report is for informational purposes only and does not constitute
          tax advice. Tax calculations may not reflect your complete tax
          situation. Please consult a qualified tax professional for accurate
          tax preparation.
        </p>
      </div>

      <style>{`
        .tax-report {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-left h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
        }

        .header-subtitle {
          color: var(--text-muted);
          margin: 0.25rem 0 0;
        }

        .header-right {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .year-selector {
          padding: 0.5rem 1rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 0.875rem;
          cursor: pointer;
        }

        .export-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: var(--radius);
          border: none;
          background: var(--accent);
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }

        .export-btn:hover {
          opacity: 0.9;
        }

        section h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 1rem;
        }

        /* Summary Section */
        .summary-section {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          border: 1px solid var(--border);
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }

        .summary-card {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: var(--radius);
        }

        .summary-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .summary-value {
          font-size: 1.25rem;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        .summary-value.positive {
          color: var(--positive);
        }

        .summary-value.negative {
          color: var(--negative);
        }

        .summary-subtitle {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        /* Liability Section */
        .liability-section {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          border: 1px solid var(--border);
        }

        .liability-note {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin: 0 0 1rem;
        }

        .liability-grid {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .liability-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 1rem 1.5rem;
          background: var(--bg-secondary);
          border-radius: var(--radius);
          min-width: 150px;
        }

        .liability-item.total {
          background: var(--accent);
          color: white;
        }

        .liability-item.total .liability-label,
        .liability-item.total .liability-value {
          color: white;
        }

        .liability-label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .liability-value {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
        }

        /* Form 8949 Section */
        .form8949-section {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          border: 1px solid var(--border);
        }

        .form8949-part {
          margin-bottom: 1.5rem;
        }

        .form8949-part:last-child {
          margin-bottom: 0;
        }

        .form8949-part h4 {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-muted);
          margin: 0 0 0.75rem;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .form8949-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .form8949-table th,
        .form8949-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }

        .form8949-table th {
          font-weight: 500;
          color: var(--text-muted);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form8949-table td.numeric,
        .form8949-table th.numeric {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .form8949-table tbody tr:hover {
          background: var(--bg-tertiary);
        }

        .form8949-table tfoot td {
          border-top: 2px solid var(--border);
          border-bottom: none;
        }

        .form8949-table .positive {
          color: var(--positive);
        }

        .form8949-table .negative {
          color: var(--negative);
        }

        .empty-state {
          color: var(--text-muted);
          font-style: italic;
          padding: 1rem;
          text-align: center;
          background: var(--bg-secondary);
          border-radius: var(--radius);
        }

        /* Disclaimer */
        .disclaimer {
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          background: var(--warning-bg, rgba(234, 179, 8, 0.1));
          border: 1px solid var(--warning-border, rgba(234, 179, 8, 0.3));
          border-radius: var(--radius);
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .disclaimer svg {
          flex-shrink: 0;
          color: var(--warning, #eab308);
        }

        .disclaimer p {
          margin: 0;
          line-height: 1.5;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .report-header {
            flex-direction: column;
          }

          .header-right {
            width: 100%;
            justify-content: space-between;
          }

          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .liability-grid {
            flex-direction: column;
          }

          .liability-item {
            min-width: auto;
          }

          .form8949-table {
            font-size: 0.75rem;
          }

          .form8949-table th,
          .form8949-table td {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default TaxReport;
