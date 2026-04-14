/**
 * Monaco Autocomplete Provider for TradePilot Python Strategies
 *
 * Provides context-aware completions for TradePilot imports,
 * Strategy class methods, and common data science patterns.
 */

import type { languages, editor, IRange } from 'monaco-editor';

interface Monaco {
  languages: typeof languages;
  Range: new (startLine: number, startCol: number, endLine: number, endCol: number) => IRange;
}

function createCompletionItem(
  monaco: Monaco,
  range: IRange,
  label: string,
  kind: languages.CompletionItemKind,
  insertText: string,
  detail?: string,
  documentation?: string,
  insertTextRules?: languages.CompletionItemInsertTextRule,
): languages.CompletionItem {
  return {
    label,
    kind,
    insertText,
    range,
    detail,
    documentation: documentation ? { value: documentation } : undefined,
    insertTextRules,
  } as languages.CompletionItem;
}

function getTradePilotImports(
  monaco: Monaco,
  range: IRange,
): languages.CompletionItem[] {
  const snippet = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;

  return [
    createCompletionItem(
      monaco, range,
      'from tradepilot.strategy import Strategy',
      monaco.languages.CompletionItemKind.Module,
      'from tradepilot.strategy import Strategy',
      'TradePilot Strategy base class',
      'Import the Strategy base class for creating custom strategies.',
    ),
    createCompletionItem(
      monaco, range,
      'from tradepilot import ranking',
      monaco.languages.CompletionItemKind.Module,
      'from tradepilot import ranking',
      'Asset ranking functions',
      'Import ranking module: momentum_ranking, random_ranking.',
    ),
    createCompletionItem(
      monaco, range,
      'from tradepilot import optimization',
      monaco.languages.CompletionItemKind.Module,
      'from tradepilot import optimization',
      'Portfolio optimization',
      'Import optimization module: msr (Max Sharpe), gmv (Min Variance), eq_weighted.',
    ),
    createCompletionItem(
      monaco, range,
      'from tradepilot import metrics',
      monaco.languages.CompletionItemKind.Module,
      'from tradepilot import metrics',
      'Financial metrics',
      'Import metrics module: returns, volatility, sharpe_ratio, max_drawdown.',
    ),
    createCompletionItem(
      monaco, range,
      'from tradepilot.backtest import Backtest',
      monaco.languages.CompletionItemKind.Module,
      'from tradepilot.backtest import Backtest',
      'Backtest runner',
      'Import Backtest class for running and evaluating strategies.',
    ),
    createCompletionItem(
      monaco, range,
      'from tradepilot.data import MarketData',
      monaco.languages.CompletionItemKind.Module,
      'from tradepilot.data import MarketData',
      'Market data provider',
      'Import MarketData for fetching historical price data via yfinance.',
    ),
    createCompletionItem(
      monaco, range,
      'import tradepilot as tp',
      monaco.languages.CompletionItemKind.Module,
      'import tradepilot as tp',
      'TradePilot library',
    ),
    createCompletionItem(
      monaco, range,
      'import numpy as np',
      monaco.languages.CompletionItemKind.Module,
      'import numpy as np',
      'NumPy',
    ),
    createCompletionItem(
      monaco, range,
      'import pandas as pd',
      monaco.languages.CompletionItemKind.Module,
      'import pandas as pd',
      'pandas',
    ),
  ];
}

function getStrategyMethods(
  monaco: Monaco,
  range: IRange,
): languages.CompletionItem[] {
  const snippet = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;

  return [
    createCompletionItem(
      monaco, range,
      'rank_assets',
      monaco.languages.CompletionItemKind.Method,
      [
        'def rank_assets(self, prices: pd.DataFrame, **kwargs) -> pd.Series:',
        '\t"""Rank assets for portfolio selection.',
        '',
        '\tArgs:',
        '\t\tprices: DataFrame of historical prices (columns=tickers, rows=dates).',
        '',
        '\tReturns:',
        '\t\tSeries of scores indexed by ticker symbol.',
        '\t"""',
        '\t${0:pass}',
      ].join('\n'),
      'Strategy method',
      'Rank assets based on strategy criteria. Return a Series with scores.',
      snippet,
    ),
    createCompletionItem(
      monaco, range,
      'optimize_portfolio',
      monaco.languages.CompletionItemKind.Method,
      [
        'def optimize_portfolio(self, prices: pd.DataFrame, selected: list, **kwargs) -> dict:',
        '\t"""Compute portfolio weights for selected assets.',
        '',
        '\tArgs:',
        '\t\tprices: DataFrame of historical prices.',
        '\t\tselected: List of ticker symbols to include.',
        '',
        '\tReturns:',
        '\t\tDict mapping ticker symbols to portfolio weights.',
        '\t"""',
        '\t${0:pass}',
      ].join('\n'),
      'Strategy method',
      'Compute optimal portfolio weights for selected assets.',
      snippet,
    ),
    createCompletionItem(
      monaco, range,
      'name',
      monaco.languages.CompletionItemKind.Property,
      [
        '@property',
        'def name(self) -> str:',
        '\treturn "${0:my-strategy}"',
      ].join('\n'),
      'Strategy property',
      'Human-readable name for this strategy.',
      snippet,
    ),
  ];
}

function getDataFrameCompletions(
  monaco: Monaco,
  range: IRange,
): languages.CompletionItem[] {
  const snippet = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
  const method = monaco.languages.CompletionItemKind.Method;

  return [
    createCompletionItem(monaco, range, '.rolling()', method,
      '.rolling(window=${1:20}).${2:mean}()', 'Rolling window', undefined, snippet),
    createCompletionItem(monaco, range, '.pct_change()', method,
      '.pct_change(periods=${1:1})', 'Percent change', undefined, snippet),
    createCompletionItem(monaco, range, '.iloc[-1]', method,
      '.iloc[${1:-1}]', 'Integer location indexing', undefined, snippet),
    createCompletionItem(monaco, range, '.mean()', method,
      '.mean(axis=${1:0})', 'Column/row mean', undefined, snippet),
    createCompletionItem(monaco, range, '.std()', method,
      '.std(axis=${1:0})', 'Standard deviation', undefined, snippet),
    createCompletionItem(monaco, range, '.sort_values()', method,
      '.sort_values(ascending=${1:False})', 'Sort values', undefined, snippet),
    createCompletionItem(monaco, range, '.dropna()', method,
      '.dropna()', 'Drop NaN values'),
    createCompletionItem(monaco, range, '.head()', method,
      '.head(${1:10})', 'First N rows', undefined, snippet),
    createCompletionItem(monaco, range, '.corr()', method,
      '.corr()', 'Correlation matrix'),
    createCompletionItem(monaco, range, '.cov()', method,
      '.cov()', 'Covariance matrix'),
  ];
}

function getTradePilotFunctionCompletions(
  monaco: Monaco,
  range: IRange,
): languages.CompletionItem[] {
  const snippet = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
  const fn = monaco.languages.CompletionItemKind.Function;

  return [
    createCompletionItem(monaco, range, 'ranking.momentum_ranking', fn,
      'ranking.momentum_ranking(${1:prices}, top_n=${2:10}, lookback=${3:90})',
      'Momentum-based asset ranking', undefined, snippet),
    createCompletionItem(monaco, range, 'ranking.random_ranking', fn,
      'ranking.random_ranking(${1:prices}, top_n=${2:10})',
      'Random asset ranking', undefined, snippet),
    createCompletionItem(monaco, range, 'optimization.msr', fn,
      'optimization.msr(${1:selected}, ${2:date})',
      'Max Sharpe Ratio optimization', undefined, snippet),
    createCompletionItem(monaco, range, 'optimization.gmv', fn,
      'optimization.gmv(${1:selected}, ${2:date})',
      'Global Minimum Variance optimization', undefined, snippet),
    createCompletionItem(monaco, range, 'optimization.eq_weighted', fn,
      'optimization.eq_weighted(${1:selected})',
      'Equal-weighted allocation', undefined, snippet),
    createCompletionItem(monaco, range, 'metrics.sharpe_ratio', fn,
      'metrics.sharpe_ratio(${1:returns})',
      'Annualized Sharpe ratio', undefined, snippet),
    createCompletionItem(monaco, range, 'metrics.max_drawdown', fn,
      'metrics.max_drawdown(${1:returns})',
      'Maximum drawdown', undefined, snippet),
  ];
}

export function registerAutocompleteProvider(monaco: Monaco): void {
  monaco.languages.registerCompletionItemProvider('python', {
    triggerCharacters: ['.', ' '],
    provideCompletionItems(
      model: editor.ITextModel,
      position: { lineNumber: number; column: number },
    ): languages.ProviderResult<languages.CompletionList> {
      const word = model.getWordUntilPosition(position);
      const range = new monaco.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn,
      );

      const lineContent = model.getLineContent(position.lineNumber);
      const textUntilPosition = lineContent.substring(0, position.column - 1);
      const suggestions: languages.CompletionItem[] = [];

      // Import completions
      if (textUntilPosition.match(/^\s*(from|import)\s/)) {
        suggestions.push(...getTradePilotImports(monaco, range));
      }

      // Strategy method completions (inside a class body)
      const fullText = model.getValue();
      if (fullText.includes('class ') && fullText.includes('Strategy')) {
        suggestions.push(...getStrategyMethods(monaco, range));
      }

      // DataFrame method completions (after a dot)
      if (textUntilPosition.endsWith('.')) {
        suggestions.push(...getDataFrameCompletions(monaco, range));
      }

      // TradePilot function completions
      if (textUntilPosition.match(/(ranking|optimization|metrics)\./)) {
        suggestions.push(...getTradePilotFunctionCompletions(monaco, range));
      }

      // Always provide TradePilot functions as general completions
      if (!textUntilPosition.match(/^\s*(from|import)\s/)) {
        suggestions.push(...getTradePilotFunctionCompletions(monaco, range));
      }

      return { suggestions };
    },
  });
}
