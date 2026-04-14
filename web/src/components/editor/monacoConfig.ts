/**
 * Monaco Editor Configuration
 *
 * Custom theme and default options for the Python strategy editor.
 */

import type { editor } from 'monaco-editor';

export const EDITOR_DEFAULT_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  fontSize: 14,
  lineNumbers: 'on',
  minimap: { enabled: false },
  wordWrap: 'on',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 4,
  insertSpaces: true,
  renderLineHighlight: 'line',
  cursorBlinking: 'smooth',
  smoothScrolling: true,
  padding: { top: 12, bottom: 12 },
  bracketPairColorization: { enabled: true },
  folding: true,
  suggestOnTriggerCharacters: true,
};

export const TRADEPILOT_DARK_THEME: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'c084fc' },
    { token: 'string', foreground: '34d399' },
    { token: 'number', foreground: 'fbbf24' },
    { token: 'type', foreground: '60a5fa' },
    { token: 'function', foreground: '67e8f9' },
    { token: 'variable', foreground: 'e2e8f0' },
    { token: 'operator', foreground: 'f472b6' },
    { token: 'decorator', foreground: 'fb923c' },
  ],
  colors: {
    'editor.background': '#0f1117',
    'editor.foreground': '#e2e8f0',
    'editor.lineHighlightBackground': '#1e2130',
    'editor.selectionBackground': '#6366f140',
    'editor.inactiveSelectionBackground': '#6366f120',
    'editorCursor.foreground': '#6366f1',
    'editorLineNumber.foreground': '#4b5563',
    'editorLineNumber.activeForeground': '#9ca3af',
    'editor.selectionHighlightBackground': '#6366f120',
    'editorBracketMatch.background': '#6366f130',
    'editorBracketMatch.border': '#6366f180',
    'editorIndentGuide.background': '#1e2130',
    'editorIndentGuide.activeBackground': '#374151',
    'editorWidget.background': '#151822',
    'editorWidget.border': '#1e2130',
    'editorSuggestWidget.background': '#151822',
    'editorSuggestWidget.border': '#1e2130',
    'editorSuggestWidget.selectedBackground': '#6366f130',
    'scrollbarSlider.background': '#374151',
    'scrollbarSlider.hoverBackground': '#4b5563',
  },
};

export const PYTHON_DEFAULT_CODE = `import tradepilot as tp
from tradepilot import ranking, optimization

def strategy(context):
    """Define your trading strategy here."""
    # Select top assets by momentum
    selected = ranking.momentum_ranking(
        context.universe,
        context.date,
        top_n=10,
        lookback=90
    )

    # Optimize portfolio weights
    weights = optimization.msr(selected, context.date)

    return weights
`;
