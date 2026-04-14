import type { ExecutionResult } from '../../lib/services/strategy-executor';

interface StrategyExplainerProps {
  explanation: string;
  executionResult?: ExecutionResult | null;
  strategyName: string;
}

export function StrategyExplainer({ explanation, executionResult, strategyName }: StrategyExplainerProps) {
  return (
    <div className="strategy-explainer">
      {explanation && (
        <div className="explainer-section">
          <h4>How It Works</h4>
          <div className="explanation-text">
            {explanation.split('\n').map((line, i) => {
              if (line.startsWith('**') && line.endsWith('**')) {
                return <h5 key={i}>{line.replace(/\*\*/g, '')}</h5>;
              }
              if (line.match(/^\d+\.\s/)) {
                return <p key={i} className="step">{line}</p>;
              }
              if (line.trim() === '') return <br key={i} />;
              return <p key={i}>{line}</p>;
            })}
          </div>
        </div>
      )}

      {executionResult && (
        <div className="explainer-section">
          <h4>Execution Results</h4>
          {executionResult.success ? (
            <div className="execution-success">
              <div className="result-header">
                <span className="status-badge success">Passed</span>
                <span className="exec-time">{executionResult.executionTimeMs}ms</span>
              </div>
              {executionResult.rankedSymbols && executionResult.rankedSymbols.length > 0 && (
                <div className="ranked-symbols">
                  <span className="rank-label">Ranked Output ({executionResult.rankedSymbols.length} symbols):</span>
                  <div className="symbol-list">
                    {executionResult.rankedSymbols.map((symbol, i) => (
                      <span key={symbol} className="symbol-chip">
                        <span className="rank">#{i + 1}</span>
                        {symbol}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="execution-error">
              <span className="status-badge error">Failed</span>
              <pre className="error-message">{executionResult.error}</pre>
            </div>
          )}
        </div>
      )}

      <style>{`
        .strategy-explainer {
          display: flex;
          flex-direction: column;
          gap: var(--space-4, 1rem);
        }

        .explainer-section h4 {
          font-size: var(--text-sm, 0.875rem);
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 var(--space-3, 0.75rem);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .explanation-text h5 {
          font-size: var(--text-sm, 0.875rem);
          font-weight: 600;
          color: var(--accent);
          margin: var(--space-3, 0.75rem) 0 var(--space-2, 0.5rem);
        }

        .explanation-text p {
          margin: 0 0 var(--space-2, 0.5rem);
          color: var(--text-secondary);
          font-size: var(--text-sm, 0.875rem);
          line-height: 1.6;
        }

        .explanation-text p.step {
          padding-left: var(--space-3, 0.75rem);
        }

        .result-header {
          display: flex;
          align-items: center;
          gap: var(--space-3, 0.75rem);
          margin-bottom: var(--space-3, 0.75rem);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: var(--space-1, 0.25rem) var(--space-3, 0.75rem);
          border-radius: var(--radius, 8px);
          font-size: var(--text-xs, 0.75rem);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .status-badge.success {
          background: rgba(16, 185, 129, 0.1);
          color: var(--positive, #10b981);
        }

        .status-badge.error {
          background: rgba(239, 68, 68, 0.1);
          color: var(--negative, #ef4444);
        }

        .exec-time {
          font-size: var(--text-xs, 0.75rem);
          color: var(--text-muted);
          font-family: var(--font-mono, monospace);
        }

        .ranked-symbols {
          margin-top: var(--space-3, 0.75rem);
        }

        .rank-label {
          font-size: var(--text-xs, 0.75rem);
          color: var(--text-muted);
          display: block;
          margin-bottom: var(--space-2, 0.5rem);
        }

        .symbol-list {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2, 0.5rem);
        }

        .symbol-chip {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1, 0.25rem);
          padding: var(--space-1, 0.25rem) var(--space-3, 0.75rem);
          background: var(--bg-tertiary, var(--bg-hover));
          border: 1px solid var(--border);
          border-radius: var(--radius, 8px);
          font-size: var(--text-sm, 0.875rem);
          font-weight: 500;
          color: var(--text-primary);
          font-family: var(--font-mono, monospace);
        }

        .symbol-chip .rank {
          font-size: var(--text-xs, 0.75rem);
          color: var(--text-muted);
          font-weight: 400;
        }

        .execution-error {
          display: flex;
          flex-direction: column;
          gap: var(--space-2, 0.5rem);
        }

        .error-message {
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius, 8px);
          padding: var(--space-3, 0.75rem);
          color: var(--negative, #ef4444);
          font-size: var(--text-sm, 0.875rem);
          font-family: var(--font-mono, monospace);
          margin: 0;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
}
