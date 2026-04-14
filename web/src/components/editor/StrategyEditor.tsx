/**
 * Strategy Editor Component
 *
 * Monaco-based Python code editor for writing trading strategies.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import Editor, { type OnMount, type BeforeMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { EDITOR_DEFAULT_OPTIONS, TRADEPILOT_DARK_THEME } from './monacoConfig';
import { registerAutocompleteProvider } from './autocomplete';
import { registerSnippetProvider } from './snippets';
import { validateStrategy, toMonacoSeverity, type ValidationError } from '../../lib/validation/strategyValidator';

export interface StrategyEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onValidation?: (errors: ValidationError[]) => void;
  readOnly?: boolean;
  height?: string;
}

let providersRegistered = false;

export function StrategyEditor({
  value,
  onChange,
  onValidation,
  readOnly = false,
  height = '500px',
}: StrategyEditorProps) {
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Parameters<BeforeMount>[0] | null>(null);

  const applyValidationMarkers = useCallback((code: string) => {
    const monaco = monacoRef.current;
    const editorInstance = editorRef.current;
    if (!monaco || !editorInstance) return;

    const errors = validateStrategy(code);
    setValidationErrors(errors);
    onValidation?.(errors);

    const model = editorInstance.getModel();
    if (!model) return;

    const markers = errors.map((err) => ({
      severity: toMonacoSeverity(err.severity) as unknown as import('monaco-editor').MarkerSeverity,
      message: err.message,
      startLineNumber: err.line,
      startColumn: 1,
      endLineNumber: err.line,
      endColumn: model.getLineLength(err.line) + 1,
    }));

    monaco.editor.setModelMarkers(model, 'tradepilot-validator', markers);
  }, [onValidation]);

  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    monaco.editor.defineTheme('tradepilot-dark', TRADEPILOT_DARK_THEME);

    if (!providersRegistered) {
      registerAutocompleteProvider(monaco as any);
      registerSnippetProvider(monaco as any);
      providersRegistered = true;
    }

    monacoRef.current = monaco;
  }, []);

  const handleMount: OnMount = useCallback((editorInstance) => {
    editorRef.current = editorInstance;

    editorInstance.onDidChangeCursorPosition((e) => {
      setCursorPosition({ line: e.position.lineNumber, column: e.position.column });
    });

    // Run initial validation
    applyValidationMarkers(editorInstance.getValue());

    editorInstance.focus();
  }, [applyValidationMarkers]);

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      if (newValue !== undefined) {
        onChange?.(newValue);
        applyValidationMarkers(newValue);
      }
    },
    [onChange, applyValidationMarkers]
  );

  return (
    <div className="strategy-editor" data-testid="strategy-editor">
      <div className="editor-container">
        <Editor
          height={height}
          language="python"
          theme="tradepilot-dark"
          value={value}
          onChange={handleChange}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          options={{
            ...EDITOR_DEFAULT_OPTIONS,
            readOnly,
          }}
          loading={
            <div className="editor-loading">
              <div className="editor-loading-spinner" />
              <span>Loading editor...</span>
            </div>
          }
        />
      </div>

      <div className="editor-statusbar" data-testid="editor-statusbar">
        <span className="statusbar-item">
          Ln {cursorPosition.line}, Col {cursorPosition.column}
        </span>
        <span className="statusbar-item">Python</span>
        {validationErrors.length > 0 && (
          <span className="statusbar-item statusbar-errors" data-testid="validation-errors">
            {validationErrors.filter(e => e.severity === 'error').length} error(s),{' '}
            {validationErrors.filter(e => e.severity === 'warning').length} warning(s)
          </span>
        )}
        {validationErrors.length === 0 && (
          <span className="statusbar-item statusbar-valid" data-testid="validation-ok">Valid</span>
        )}
        {readOnly && <span className="statusbar-item statusbar-readonly">Read Only</span>}
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .strategy-editor {
    border: 1px solid var(--border, #1e2130);
    border-radius: var(--radius-lg, 0.5rem);
    overflow: hidden;
    background-color: #0f1117;
  }

  .editor-container {
    min-height: 200px;
  }

  .editor-statusbar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.375rem 0.75rem;
    background-color: #151822;
    border-top: 1px solid #1e2130;
    font-size: 0.75rem;
    color: #9ca3af;
    font-family: monospace;
  }

  .statusbar-item {
    white-space: nowrap;
  }

  .statusbar-readonly {
    color: #fbbf24;
    font-weight: 500;
  }

  .statusbar-errors {
    color: #f87171;
    font-weight: 500;
  }

  .statusbar-valid {
    color: #34d399;
    font-weight: 500;
  }

  .editor-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    height: 100%;
    min-height: 200px;
    color: #9ca3af;
    font-size: 0.875rem;
    background-color: #0f1117;
  }

  .editor-loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #1e2130;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: editor-spin 0.8s linear infinite;
  }

  @keyframes editor-spin {
    to { transform: rotate(360deg); }
  }
`;
