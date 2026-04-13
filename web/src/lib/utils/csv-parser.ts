/**
 * CSV parser for importing portfolio data from various brokerage formats.
 */

import type { CSVFormat, CSVValidationResult, HoldingFormData, AssetType } from '../../types/portfolio';

export const GENERIC_CSV_SPEC = `Generic CSV Format
==================
Required columns (case-insensitive):
  symbol     - Ticker symbol (e.g. AAPL, BTC-USD)
  quantity   - Number of shares/units
  cost_basis - Cost basis per share (or "cost basis", "cost_per_share", "price")

Optional columns:
  name       - Security name
  type       - Asset type (stock, etf, crypto, bond, mutual_fund, option, other)
  notes      - Additional notes

Example:
  symbol,quantity,cost_basis,name,type
  AAPL,100,150.50,Apple Inc.,stock
  GOOGL,50,2800.00,Alphabet Inc.,stock
  BTC-USD,0.5,45000,Bitcoin,crypto`;

interface CSVParseResult {
  format: CSVFormat;
  results: CSVValidationResult[];
  validCount: number;
  invalidCount: number;
}

interface ColumnMapping {
  symbol: number;
  quantity: number;
  costBasis: number;
  name?: number;
  type?: number;
  notes?: number;
}

const HEADER_ALIASES: Record<string, string[]> = {
  symbol: ['symbol', 'ticker', 'sym', 'stock'],
  quantity: ['quantity', 'qty', 'shares', 'units', 'amount'],
  costBasis: [
    'cost_basis',
    'cost basis',
    'cost_per_share',
    'cost per share',
    'price',
    'avg_cost',
    'average cost',
    'avg price',
    'purchase_price',
  ],
  name: ['name', 'security', 'description', 'security name', 'company'],
  type: ['type', 'asset_type', 'asset type', 'category', 'security type'],
  notes: ['notes', 'memo', 'comments'],
};

const FORMAT_SIGNATURES: Record<CSVFormat, string[]> = {
  generic: [],
  fidelity: ['account name/number', 'symbol', 'last price'],
  schwab: ['symbol', 'name', 'quantity', 'price', 'market value'],
  vanguard: ['account number', 'investment name', 'symbol', 'shares'],
  robinhood: ['instrument', 'name', 'type', 'quantity', 'average cost'],
  coinbase: ['timestamp', 'transaction type', 'asset', 'quantity purchased'],
};

/**
 * Parse raw CSV text into rows.
 */
function parseCSVText(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  return lines.map((line) => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
    }
    values.push(current.trim());
    return values;
  });
}

/**
 * Detect the CSV format from headers.
 */
function detectFormat(headers: string[]): CSVFormat {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  for (const [format, signatures] of Object.entries(FORMAT_SIGNATURES)) {
    if (format === 'generic' || signatures.length === 0) continue;
    const matchCount = signatures.filter((sig) =>
      lowerHeaders.some((h) => h.includes(sig))
    ).length;
    if (matchCount >= 2) return format as CSVFormat;
  }

  return 'generic';
}

/**
 * Map header names to column indices.
 */
function mapColumns(headers: string[]): ColumnMapping | null {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  function findColumn(aliases: string[]): number {
    for (const alias of aliases) {
      const idx = lowerHeaders.indexOf(alias);
      if (idx !== -1) return idx;
    }
    return -1;
  }

  const symbol = findColumn(HEADER_ALIASES.symbol);
  const quantity = findColumn(HEADER_ALIASES.quantity);
  const costBasis = findColumn(HEADER_ALIASES.costBasis);

  if (symbol === -1 || quantity === -1 || costBasis === -1) return null;

  const mapping: ColumnMapping = { symbol, quantity, costBasis };

  const name = findColumn(HEADER_ALIASES.name);
  if (name !== -1) mapping.name = name;

  const type = findColumn(HEADER_ALIASES.type);
  if (type !== -1) mapping.type = type;

  const notes = findColumn(HEADER_ALIASES.notes);
  if (notes !== -1) mapping.notes = notes;

  return mapping;
}

/**
 * Parse an asset type string into a valid AssetType.
 */
function parseAssetType(value: string | undefined): AssetType {
  if (!value) return 'stock';
  const lower = value.toLowerCase().trim();
  const typeMap: Record<string, AssetType> = {
    stock: 'stock',
    etf: 'etf',
    crypto: 'crypto',
    bond: 'bond',
    mutual_fund: 'mutual_fund',
    'mutual fund': 'mutual_fund',
    option: 'option',
    other: 'other',
  };
  return typeMap[lower] || 'stock';
}

/**
 * Validate and parse a single CSV row into holding data.
 */
function validateRow(
  row: string[],
  rowNumber: number,
  mapping: ColumnMapping,
  accountId: string
): CSVValidationResult {
  const errors: string[] = [];

  const symbol = row[mapping.symbol]?.trim().toUpperCase();
  if (!symbol) errors.push('Missing symbol');

  const quantityStr = row[mapping.quantity]?.trim().replace(/,/g, '');
  const quantity = parseFloat(quantityStr);
  if (isNaN(quantity) || quantity <= 0) errors.push('Invalid quantity');

  const costStr = row[mapping.costBasis]?.trim().replace(/[$,]/g, '');
  const costBasisPerShare = parseFloat(costStr);
  if (isNaN(costBasisPerShare) || costBasisPerShare < 0) errors.push('Invalid cost basis');

  if (errors.length > 0) {
    return { row: rowNumber, valid: false, errors };
  }

  const data: HoldingFormData = {
    accountId,
    symbol,
    quantity,
    costBasisPerShare,
    assetType: parseAssetType(mapping.type !== undefined ? row[mapping.type] : undefined),
    name: mapping.name !== undefined ? row[mapping.name]?.trim() : undefined,
    notes: mapping.notes !== undefined ? row[mapping.notes]?.trim() : undefined,
  };

  return { row: rowNumber, valid: true, errors: [], data };
}

/**
 * Process a CSV string and return validated results.
 */
export function processCSV(
  csvString: string,
  accountId: string,
  format?: CSVFormat
): CSVParseResult {
  const rows = parseCSVText(csvString);
  if (rows.length < 2) {
    return { format: format || 'generic', results: [], validCount: 0, invalidCount: 0 };
  }

  const headers = rows[0];
  const detectedFormat = format || detectFormat(headers);
  const mapping = mapColumns(headers);

  if (!mapping) {
    return {
      format: detectedFormat,
      results: [
        {
          row: 1,
          valid: false,
          errors: ['Could not find required columns: symbol, quantity, cost_basis'],
        },
      ],
      validCount: 0,
      invalidCount: 1,
    };
  }

  const results: CSVValidationResult[] = [];
  let validCount = 0;
  let invalidCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.every((cell) => !cell.trim())) continue;

    const result = validateRow(row, i + 1, mapping, accountId);
    results.push(result);

    if (result.valid) validCount++;
    else invalidCount++;
  }

  return { format: detectedFormat, results, validCount, invalidCount };
}
