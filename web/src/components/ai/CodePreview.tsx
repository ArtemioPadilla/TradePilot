import { useState } from 'react';

interface CodePreviewProps {
  code: string;
  onChange?: (code: string) => void;
  readOnly?: boolean;
}

export function CodePreview({ code, onChange, readOnly = false }: CodePreviewProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="code-preview">
      <div className="code-header">
        <span className="code-lang">TypeScript</span>
        <div className="code-actions">
          {onChange && (
            <button
              className={`code-btn ${readOnly ? '' : 'active'}`}
              onClick={() => onChange(code)}
              title={readOnly ? 'Click to edit' : 'Editing enabled'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
              </svg>
              {readOnly ? 'Edit' : 'Editing'}
            </button>
          )}
          <button className="code-btn" onClick={handleCopy} title="Copy code">
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>
      <div className="code-body">
        <textarea
          value={code}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          spellCheck={false}
          data-testid="code-editor"
        />
      </div>

      <style>{`
        .code-preview {
          display: flex;
          flex-direction: column;
          height: 100%;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 12px);
          overflow: hidden;
          background: var(--bg-primary);
        }

        .code-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
        }

        .code-lang {
          font-size: var(--text-xs, 0.75rem);
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .code-actions {
          display: flex;
          gap: var(--space-2, 0.5rem);
        }

        .code-btn {
          display: flex;
          align-items: center;
          gap: var(--space-1, 0.25rem);
          padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--radius, 8px);
          color: var(--text-muted);
          font-size: var(--text-xs, 0.75rem);
          cursor: pointer;
          transition: all var(--transition-fast, 150ms ease-out);
        }

        .code-btn:hover {
          color: var(--text-primary);
          border-color: var(--text-muted);
        }

        .code-btn.active {
          color: var(--accent);
          border-color: var(--accent);
        }

        .code-body {
          flex: 1;
          min-height: 0;
          overflow: auto;
        }

        .code-body textarea {
          width: 100%;
          height: 100%;
          min-height: 300px;
          padding: var(--space-4, 1rem);
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-family: var(--font-mono, 'IBM Plex Mono', monospace);
          font-size: var(--text-sm, 0.875rem);
          line-height: 1.7;
          resize: none;
          outline: none;
          tab-size: 2;
          white-space: pre;
          overflow-wrap: normal;
          overflow-x: auto;
        }

        .code-body textarea[readonly] {
          cursor: default;
        }
      `}</style>
    </div>
  );
}
