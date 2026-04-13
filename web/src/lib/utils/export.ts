/**
 * Export portfolio data to CSV and JSON formats.
 */

import type { Account, Holding, Transaction, PortfolioSummary } from '../../types/portfolio';

/**
 * Generate a timestamped filename for exports.
 */
export function generateExportFilename(prefix: string, extension: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `tradepilot-${prefix}-${date}.${extension}`;
}

/**
 * Escape a value for CSV output.
 */
function escapeCSV(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Build a CSV string from headers and rows.
 */
function buildCSV(headers: string[], rows: (string | number | undefined | null)[][]): string {
  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map((row) => row.map(escapeCSV).join(','));
  return [headerLine, ...dataLines].join('\n');
}

/**
 * Export holdings data to CSV format.
 */
export function exportHoldingsToCSV(holdings: Holding[], accounts: Account[]): string {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

  const headers = [
    'Symbol',
    'Name',
    'Account',
    'Asset Type',
    'Quantity',
    'Cost Basis Per Share',
    'Total Cost Basis',
    'Current Price',
    'Market Value',
    'Unrealized P&L',
    'Unrealized P&L %',
  ];

  const rows = holdings.map((h) => [
    h.symbol,
    h.name || '',
    accountMap.get(h.accountId) || h.accountId,
    h.assetType,
    h.quantity,
    h.costBasisPerShare,
    h.quantity * h.costBasisPerShare,
    h.currentPrice ?? '',
    h.marketValue ?? '',
    h.unrealizedPL ?? '',
    h.unrealizedPLPercent != null ? `${(h.unrealizedPLPercent * 100).toFixed(2)}%` : '',
  ]);

  return buildCSV(headers, rows);
}

/**
 * Export transactions data to CSV format.
 */
export function exportTransactionsToCSV(
  transactions: Transaction[],
  accounts: Account[]
): string {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

  const headers = [
    'Date',
    'Type',
    'Symbol',
    'Account',
    'Quantity',
    'Price Per Share',
    'Total Amount',
    'Notes',
  ];

  const rows = transactions.map((t) => [
    t.date instanceof Date ? t.date.toISOString().slice(0, 10) : t.date,
    t.type,
    t.symbol || '',
    accountMap.get(t.accountId) || t.accountId,
    t.quantity ?? '',
    t.pricePerShare ?? '',
    t.amount ?? '',
    t.notes || '',
  ]);

  return buildCSV(headers, rows);
}

/**
 * Export full portfolio snapshot to JSON format.
 */
export function exportPortfolioToJSON(
  accounts: Account[],
  holdings: Holding[],
  summary: PortfolioSummary
): string {
  const data = {
    exportDate: new Date().toISOString(),
    summary: {
      totalValue: summary.totalValue,
      totalCash: summary.totalCash,
      totalCostBasis: summary.totalCostBasis,
      totalUnrealizedPL: summary.totalUnrealizedPL,
      totalUnrealizedPLPercent: summary.totalUnrealizedPLPercent,
      dailyChange: summary.dailyChange,
      dailyChangePercent: summary.dailyChangePercent,
    },
    accounts: accounts.map((a) => ({
      name: a.name,
      type: a.type,
      institution: a.institution,
      currency: a.currency,
    })),
    holdings: holdings.map((h) => ({
      symbol: h.symbol,
      name: h.name,
      assetType: h.assetType,
      quantity: h.quantity,
      costBasisPerShare: h.costBasisPerShare,
      currentPrice: h.currentPrice,
      marketValue: h.marketValue,
      unrealizedPL: h.unrealizedPL,
    })),
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Trigger a CSV file download in the browser.
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

/**
 * Trigger a JSON file download in the browser.
 */
export function downloadJSON(jsonContent: string, filename: string): void {
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
