import { useState, useRef } from 'react';
import { processCSV, GENERIC_CSV_SPEC } from '../../lib/csv-parser';
import { createHolding, getHoldingBySymbol, addToPosition } from '../../lib/services/holdings';
import type { CSVFormat, CSVValidationResult, HoldingFormData, Currency } from '../../types/portfolio';

interface CSVImportModalProps {
  userId: string;
  accountId: string;
  accountCurrency: Currency;
  onClose: () => void;
  onSuccess: () => void;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

const formatOptions: { value: CSVFormat | 'auto'; label: string }[] = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'generic', label: 'Generic CSV' },
  { value: 'fidelity', label: 'Fidelity' },
  { value: 'schwab', label: 'Charles Schwab' },
  { value: 'vanguard', label: 'Vanguard' },
  { value: 'robinhood', label: 'Robinhood' },
  { value: 'coinbase', label: 'Coinbase' },
];

export function CSVImportModal({
  userId,
  accountId,
  accountCurrency,
  onClose,
  onSuccess,
}: CSVImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [selectedFormat, setSelectedFormat] = useState<CSVFormat | 'auto'>('auto');
  const [detectedFormat, setDetectedFormat] = useState<CSVFormat>('generic');
  const [results, setResults] = useState<CSVValidationResult[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    imported: number;
    updated: number;
    failed: number;
    errors: string[];
  }>({ imported: 0, updated: 0, failed: 0, errors: [] });
  const [showSpec, setShowSpec] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvString = event.target?.result as string;
      processFile(csvString);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  }

  function processFile(csvString: string) {
    setError(null);

    const format = selectedFormat === 'auto' ? undefined : selectedFormat;
    const result = processCSV(csvString, accountId, format);

    if (result.results.length === 0) {
      setError('No valid data found in CSV file');
      return;
    }

    setDetectedFormat(result.format);
    setResults(result.results);
    setValidCount(result.validCount);
    setInvalidCount(result.invalidCount);
    setStep('preview');
  }

  async function handleImport() {
    const validResults = results.filter((r) => r.valid && r.data);
    if (validResults.length === 0) return;

    setStep('importing');
    setImportProgress(0);

    const importResults = {
      imported: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < validResults.length; i++) {
      const result = validResults[i];
      const data = result.data as HoldingFormData;

      try {
        // Check if position already exists
        const existing = await getHoldingBySymbol(userId, accountId, data.symbol);

        if (existing) {
          // Add to existing position
          await addToPosition(userId, existing.id, data.quantity, data.costBasisPerShare);
          importResults.updated++;
        } else {
          // Create new holding
          await createHolding(userId, {
            ...data,
            currency: accountCurrency,
          });
          importResults.imported++;
        }
      } catch (err) {
        importResults.failed++;
        importResults.errors.push(`Row ${result.row}: Failed to import ${data.symbol}`);
        console.error(`Failed to import ${data.symbol}:`, err);
      }

      setImportProgress(Math.round(((i + 1) / validResults.length) * 100));
    }

    setImportResults(importResults);
    setStep('complete');
  }

  function handleClose() {
    if (step === 'complete' && (importResults.imported > 0 || importResults.updated > 0)) {
      onSuccess();
    } else {
      onClose();
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: accountCurrency,
    }).format(amount);
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal csv-modal" role="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import Positions from CSV</h2>
          <button
            type="button"
            className="modal-close"
            onClick={handleClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="modal-content">
          {error && <div className="form-error">{error}</div>}

          {/* Upload Step */}
          {step === 'upload' && (
            <div className="upload-step">
              <div className="form-group">
                <label htmlFor="csv-format">CSV Format</label>
                <select
                  id="csv-format"
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value as CSVFormat | 'auto')}
                >
                  {formatOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="upload-zone"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      processFile(event.target?.result as string);
                    };
                    reader.readAsText(file);
                  }
                }}
              >
                <div className="upload-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="upload-text">
                  Click to select a CSV file<br />
                  <span>or drag and drop</span>
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  hidden
                  data-testid="csv-file-input"
                />
              </div>

              <button
                type="button"
                className="btn btn-link"
                onClick={() => setShowSpec(!showSpec)}
              >
                {showSpec ? 'Hide' : 'Show'} CSV Format Specification
              </button>

              {showSpec && (
                <pre className="csv-spec">{GENERIC_CSV_SPEC}</pre>
              )}
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="preview-step">
              <div className="preview-header">
                <div className="preview-stats">
                  <span className="stat valid">
                    <span className="stat-value">{validCount}</span> valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="stat invalid">
                      <span className="stat-value">{invalidCount}</span> invalid
                    </span>
                  )}
                </div>
                <span className="detected-format">
                  Format: {formatOptions.find((f) => f.value === detectedFormat)?.label}
                </span>
              </div>

              <div className="preview-table-wrapper">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Symbol</th>
                      <th>Quantity</th>
                      <th>Cost/Share</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr
                        key={result.row}
                        className={result.valid ? 'valid-row' : 'invalid-row'}
                      >
                        <td>{result.row}</td>
                        <td>{result.data?.symbol || '-'}</td>
                        <td>{result.data?.quantity?.toLocaleString() || '-'}</td>
                        <td>
                          {result.data?.costBasisPerShare !== undefined
                            ? formatCurrency(result.data.costBasisPerShare)
                            : '-'}
                        </td>
                        <td>
                          {result.data?.quantity && result.data?.costBasisPerShare !== undefined
                            ? formatCurrency(result.data.quantity * result.data.costBasisPerShare)
                            : '-'}
                        </td>
                        <td>
                          {result.valid ? (
                            <span className="status-badge success">Valid</span>
                          ) : (
                            <span className="status-badge error" title={result.errors.join(', ')}>
                              Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {invalidCount > 0 && (
                <div className="validation-errors">
                  <h4>Validation Errors</h4>
                  <ul>
                    {results
                      .filter((r) => !r.valid)
                      .slice(0, 5)
                      .map((r) => (
                        <li key={r.row}>
                          Row {r.row}: {r.errors.join(', ')}
                        </li>
                      ))}
                    {invalidCount > 5 && (
                      <li>...and {invalidCount - 5} more errors</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setStep('upload');
                    setResults([]);
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleImport}
                  disabled={validCount === 0}
                  data-testid="import-btn"
                >
                  Import {validCount} Position{validCount !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}

          {/* Importing Step */}
          {step === 'importing' && (
            <div className="importing-step">
              <div className="progress-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <span className="progress-text">{importProgress}%</span>
              </div>
              <p>Importing positions...</p>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="complete-step">
              <div className="complete-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--positive)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="9 12 11.5 14.5 16 9" />
                </svg>
              </div>
              <h3>Import Complete</h3>

              <div className="import-summary">
                <div className="summary-item">
                  <span className="summary-label">New Positions</span>
                  <span className="summary-value">{importResults.imported}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Updated Positions</span>
                  <span className="summary-value">{importResults.updated}</span>
                </div>
                {importResults.failed > 0 && (
                  <div className="summary-item error">
                    <span className="summary-label">Failed</span>
                    <span className="summary-value">{importResults.failed}</span>
                  </div>
                )}
              </div>

              {importResults.errors.length > 0 && (
                <div className="import-errors">
                  <h4>Import Errors</h4>
                  <ul>
                    {importResults.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleClose}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        <style>{`
          .csv-modal {
            max-width: 700px;
          }

          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
          }

          .modal {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid var(--border);
          }

          .modal-header h2 {
            font-size: 1.25rem;
            font-weight: 600;
            margin: 0;
            color: var(--text-primary);
          }

          .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: var(--text-muted);
            cursor: pointer;
            padding: 0;
            line-height: 1;
          }

          .modal-close:hover {
            color: var(--text-primary);
          }

          .modal-content {
            padding: 1.5rem;
          }

          .form-error {
            background: var(--negative-bg);
            color: var(--negative);
            padding: 0.75rem 1rem;
            border-radius: var(--radius-md);
            margin-bottom: 1rem;
            font-size: 0.875rem;
          }

          .form-group {
            margin-bottom: 1rem;
          }

          .form-group label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 0.375rem;
          }

          .form-group select {
            width: 100%;
            padding: 0.625rem 0.75rem;
            font-size: 0.9375rem;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            background: var(--bg-primary);
            color: var(--text-primary);
          }

          .upload-zone {
            border: 2px dashed var(--border);
            border-radius: var(--radius-lg);
            padding: 2rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
          }

          .upload-zone:hover {
            border-color: var(--accent);
            background: var(--bg-tertiary);
          }

          .upload-icon {
            color: var(--text-muted);
            margin-bottom: 1rem;
          }

          .upload-text {
            color: var(--text-primary);
            margin: 0;
          }

          .upload-text span {
            color: var(--text-muted);
            font-size: 0.875rem;
          }

          .btn-link {
            background: none;
            border: none;
            color: var(--accent);
            font-size: 0.875rem;
            cursor: pointer;
            padding: 0.5rem 0;
            margin-top: 0.5rem;
          }

          .btn-link:hover {
            text-decoration: underline;
          }

          .csv-spec {
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 1rem;
            font-size: 0.75rem;
            overflow-x: auto;
            white-space: pre-wrap;
            color: var(--text-secondary);
            margin-top: 1rem;
          }

          .preview-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
          }

          .preview-stats {
            display: flex;
            gap: 1rem;
          }

          .stat {
            font-size: 0.875rem;
          }

          .stat-value {
            font-weight: 600;
          }

          .stat.valid .stat-value {
            color: var(--positive);
          }

          .stat.invalid .stat-value {
            color: var(--negative);
          }

          .detected-format {
            font-size: 0.75rem;
            color: var(--text-muted);
          }

          .preview-table-wrapper {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
          }

          .preview-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
          }

          .preview-table th,
          .preview-table td {
            padding: 0.5rem 0.75rem;
            text-align: left;
            border-bottom: 1px solid var(--border);
          }

          .preview-table th {
            background: var(--bg-tertiary);
            font-weight: 600;
            font-size: 0.75rem;
            color: var(--text-muted);
            text-transform: uppercase;
            position: sticky;
            top: 0;
          }

          .valid-row {
            background: var(--bg-secondary);
          }

          .invalid-row {
            background: var(--negative-bg);
          }

          .status-badge {
            font-size: 0.7rem;
            padding: 0.25rem 0.5rem;
            border-radius: var(--radius-sm);
            font-weight: 500;
          }

          .status-badge.success {
            background: var(--positive-bg);
            color: var(--positive);
          }

          .status-badge.error {
            background: var(--negative-bg);
            color: var(--negative);
            cursor: help;
          }

          .validation-errors {
            margin-top: 1rem;
            padding: 1rem;
            background: var(--negative-bg);
            border-radius: var(--radius-md);
          }

          .validation-errors h4 {
            margin: 0 0 0.5rem 0;
            font-size: 0.875rem;
            color: var(--negative);
          }

          .validation-errors ul {
            margin: 0;
            padding-left: 1.25rem;
            font-size: 0.8rem;
            color: var(--text-secondary);
          }

          .importing-step {
            text-align: center;
            padding: 2rem 0;
          }

          .progress-container {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .progress-bar {
            flex: 1;
            height: 8px;
            background: var(--bg-tertiary);
            border-radius: 4px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: var(--accent);
            transition: width 0.3s ease;
          }

          .progress-text {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-primary);
            min-width: 3rem;
          }

          .complete-step {
            text-align: center;
          }

          .complete-icon {
            margin-bottom: 1rem;
          }

          .complete-step h3 {
            font-size: 1.25rem;
            margin: 0 0 1.5rem 0;
            color: var(--text-primary);
          }

          .import-summary {
            display: flex;
            justify-content: center;
            gap: 2rem;
            margin-bottom: 1.5rem;
          }

          .summary-item {
            text-align: center;
          }

          .summary-label {
            display: block;
            font-size: 0.75rem;
            color: var(--text-muted);
            margin-bottom: 0.25rem;
          }

          .summary-value {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--positive);
          }

          .summary-item.error .summary-value {
            color: var(--negative);
          }

          .import-errors {
            text-align: left;
            padding: 1rem;
            background: var(--negative-bg);
            border-radius: var(--radius-md);
            margin-bottom: 1rem;
          }

          .import-errors h4 {
            margin: 0 0 0.5rem 0;
            font-size: 0.875rem;
            color: var(--negative);
          }

          .import-errors ul {
            margin: 0;
            padding-left: 1.25rem;
            font-size: 0.8rem;
          }

          .form-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
            margin-top: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border);
          }

          .btn {
            padding: 0.625rem 1rem;
            border-radius: var(--radius-md);
            font-weight: 500;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
          }

          .btn-primary {
            background: var(--accent);
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            background: var(--accent-hover);
          }

          .btn-secondary {
            background: var(--bg-tertiary);
            color: var(--text-secondary);
          }

          .btn-secondary:hover:not(:disabled) {
            background: var(--border);
          }

          .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </div>
  );
}

export default CSVImportModal;
