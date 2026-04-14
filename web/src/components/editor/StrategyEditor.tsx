/**
 * Strategy Editor Component
 *
 * Monaco-based Python code editor for writing trading strategies.
 */

import { useState, useCallback, useRef } from 'react';
import Editor, { type OnMount, type BeforeMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { EDITOR_DEFAULT_OPTIONS, TRADEPILOT_DARK_THEME } from './monacoConfig';

export interface StrategyEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
}

export function StrategyEditor({
  value,
  onChange,
  readOnly = false,
  height = '500px',
}: StrategyEditorProps) {
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    monaco.editor.defineTheme('tradepilot-dark', TRADEPILOT_DARK_THEME);
  }, []);

  const handleMount: OnMount = useCallback((editorInstance) => {
    editorRef.current = editorInstance;

    editorInstance.onDidChangeCursorPosition((e) => {
      setCursorPosition({ line: e.position.lineNumber, column: e.position.column });
    });

    editorInstance.focus();
  }, []);

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      if (onChange && newValue !== undefined) {
        onChange(newValue);
      }
    },
    [onChange]
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
