/**
 * Export Menu Component
 *
 * Dropdown menu for exporting data in various formats.
 */

import { useState } from 'react';
import type { Account, Holding, Transaction, PortfolioSummary } from '../../types/portfolio';
import {
  exportHoldingsToCSV,
  exportTransactionsToCSV,
  exportPortfolioToJSON,
  downloadCSV,
  downloadJSON,
  generateExportFilename,
} from '../../lib/utils/export';

export interface ExportMenuProps {
  accounts: Account[];
  holdings: Holding[];
  transactions: Transaction[];
  portfolioSummary: PortfolioSummary;
}

export function ExportMenu({
  accounts,
  holdings,
  transactions,
  portfolioSummary,
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportHoldings = async () => {
    setIsExporting(true);
    try {
      const csv = exportHoldingsToCSV(holdings, accounts);
      const filename = generateExportFilename('holdings', 'csv');
      downloadCSV(csv, filename);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  const handleExportTransactions = async () => {
    setIsExporting(true);
    try {
      const csv = exportTransactionsToCSV(transactions, accounts);
      const filename = generateExportFilename('transactions', 'csv');
      downloadCSV(csv, filename);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  const handleExportPortfolio = async () => {
    setIsExporting(true);
    try {
      const json = exportPortfolioToJSON(accounts, holdings, portfolioSummary);
      const filename = generateExportFilename('portfolio', 'json');
      downloadJSON(json, filename);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="export-menu" data-testid="export-menu">
      <button
        className="export-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        disabled={isExporting}
        data-testid="export-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Export
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="export-backdrop" onClick={() => setIsOpen(false)} />
          <div className="export-dropdown" role="menu" data-testid="export-dropdown">
            <button
              className="export-option"
              onClick={handleExportHoldings}
              disabled={isExporting || holdings.length === 0}
              role="menuitem"
              data-testid="export-holdings"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <div className="option-content">
                <span className="option-title">Holdings (CSV)</span>
                <span className="option-description">{holdings.length} positions</span>
              </div>
            </button>

            <button
              className="export-option"
              onClick={handleExportTransactions}
              disabled={isExporting || transactions.length === 0}
              role="menuitem"
              data-testid="export-transactions"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <div className="option-content">
                <span className="option-title">Transactions (CSV)</span>
                <span className="option-description">{transactions.length} records</span>
              </div>
            </button>

            <button
              className="export-option"
              onClick={handleExportPortfolio}
              disabled={isExporting}
              role="menuitem"
              data-testid="export-portfolio"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
              <div className="option-content">
                <span className="option-title">Portfolio Snapshot (JSON)</span>
                <span className="option-description">Full portfolio data</span>
              </div>
            </button>
          </div>
        </>
      )}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .export-menu {
    position: relative;
    display: inline-block;
  }

  .export-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background-color: var(--bg-secondary, #f8f9fa);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary, #111827);
    cursor: pointer;
    transition: all 0.2s;
  }

  .export-button:hover:not(:disabled) {
    background-color: var(--bg-tertiary, #f3f4f6);
    border-color: var(--border-hover, #d1d5db);
  }

  .export-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .export-backdrop {
    position: fixed;
    inset: 0;
    z-index: 10;
  }

  .export-dropdown {
    position: absolute;
    top: calc(100% + 0.25rem);
    right: 0;
    min-width: 220px;
    background-color: var(--bg-primary, white);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-lg, 0.5rem);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 20;
    overflow: hidden;
  }

  .export-option {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .export-option:hover:not(:disabled) {
    background-color: var(--bg-secondary, #f8f9fa);
  }

  .export-option:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .export-option:not(:last-child) {
    border-bottom: 1px solid var(--border, #e5e7eb);
  }

  .export-option svg {
    flex-shrink: 0;
    margin-top: 0.125rem;
    color: var(--text-muted, #6b7280);
  }

  .option-content {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .option-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary, #111827);
  }

  .option-description {
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
  }
`;

export default ExportMenu;
