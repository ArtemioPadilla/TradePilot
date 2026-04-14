/**
 * Pre-built Code Snippets for TradePilot Strategy Editor
 *
 * Provides Monaco snippet completions for common strategy patterns.
 */

import type { languages, IRange } from 'monaco-editor';

interface Monaco {
  languages: typeof languages;
  Range: new (startLine: number, startCol: number, endLine: number, endCol: number) => IRange;
}

interface SnippetDef {
  label: string;
  prefix: string;
  body: string;
  detail: string;
  documentation: string;
}

const SNIPPETS: SnippetDef[] = [
  {
    label: 'strategy-class',
    prefix: 'strategy-class',
    detail: 'Full Strategy subclass template',
    documentation: 'Creates a complete Strategy subclass with rank_assets and optimize_portfolio methods.',
    body: [
      'import numpy as np',
      'import pandas as pd',
      'from tradepilot.strategy import Strategy',
      'from tradepilot import ranking, optimization',
      '',
      '',
      'class ${1:MyStrategy}(Strategy):',
      '\t"""${2:Custom trading strategy.}"""',
      '',
      '\t@property',
      '\tdef name(self) -> str:',
      '\t\treturn "${3:my-strategy}"',
      '',
      '\tdef rank_assets(self, prices: pd.DataFrame, **kwargs) -> pd.Series:',
      '\t\t"""Rank assets for portfolio selection."""',
      '\t\t${4:momentum = prices.iloc[-1] / prices.iloc[-kwargs.get("lookback", 90)] - 1}',
      '\t\treturn ${5:momentum.sort_values(ascending=False)}',
      '',
      '\tdef optimize_portfolio(self, prices: pd.DataFrame, selected: list, **kwargs) -> dict:',
      '\t\t"""Compute portfolio weights for selected assets."""',
      '\t\t${6:n = len(selected)}',
      '\t\treturn ${7:{ticker: 1.0 / n for ticker in selected}}',
    ].join('\n'),
  },
  {
    label: 'rank-assets',
    prefix: 'rank-assets',
    detail: 'rank_assets method with docstring',
    documentation: 'Adds a rank_assets method that scores and ranks assets for selection.',
    body: [
      'def rank_assets(self, prices: pd.DataFrame, **kwargs) -> pd.Series:',
      '\t"""Rank assets for portfolio selection.',
      '',
      '\tArgs:',
      '\t\tprices: DataFrame of historical prices (columns=tickers, rows=dates).',
      '\t\t**kwargs: Strategy-specific parameters.',
      '',
      '\tReturns:',
      '\t\tSeries of scores indexed by ticker symbol.',
      '\t"""',
      '\tlookback = kwargs.get("lookback", ${1:90})',
      '\t${2:scores = prices.iloc[-1] / prices.iloc[-lookback] - 1}',
      '\treturn ${3:scores.sort_values(ascending=False)}',
    ].join('\n'),
  },
  {
    label: 'optimize-portfolio',
    prefix: 'optimize-portfolio',
    detail: 'optimize_portfolio method',
    documentation: 'Adds an optimize_portfolio method that computes weights for selected assets.',
    body: [
      'def optimize_portfolio(self, prices: pd.DataFrame, selected: list, **kwargs) -> dict:',
      '\t"""Compute portfolio weights for selected assets.',
      '',
      '\tArgs:',
      '\t\tprices: DataFrame of historical prices.',
      '\t\tselected: List of selected ticker symbols.',
      '',
      '\tReturns:',
      '\t\tDict mapping ticker to weight (weights should sum to 1.0).',
      '\t"""',
      '\t${1:n = len(selected)}',
      '\treturn ${2:{ticker: 1.0 / n for ticker in selected}}',
    ].join('\n'),
  },
  {
    label: 'backtest-config',
    prefix: 'backtest-config',
    detail: 'BacktestConfig setup',
    documentation: 'Sets up a Backtest configuration with universe, dates, and strategy.',
    body: [
      'from tradepilot.backtest import Backtest',
      '',
      'backtest = Backtest(',
      '\tuniverse=${1:["AAPL", "MSFT", "GOOGL", "AMZN", "META"]},',
      '\tstart_date="${2:2020-01-01}",',
      '\tend_date="${3:2024-01-01}",',
      '\trebalance_frequency="${4:monthly}",',
      '\tinitial_capital=${5:100000},',
      ')',
      '',
      'results = backtest.run()',
      'metrics = backtest.evaluate()',
      'print(metrics)',
    ].join('\n'),
  },
  {
    label: 'common-imports',
    prefix: 'common-imports',
    detail: 'numpy, pandas, tradepilot imports',
    documentation: 'Standard imports for a TradePilot strategy file.',
    body: [
      'import numpy as np',
      'import pandas as pd',
      'from tradepilot.strategy import Strategy',
      'from tradepilot import ranking, optimization, metrics',
    ].join('\n'),
  },
];

export function registerSnippetProvider(monaco: Monaco): void {
  monaco.languages.registerCompletionItemProvider('python', {
    provideCompletionItems(
      model: { getWordUntilPosition: (pos: { lineNumber: number; column: number }) => { startColumn: number; endColumn: number } },
      position: { lineNumber: number; column: number },
    ): languages.ProviderResult<languages.CompletionList> {
      const word = model.getWordUntilPosition(position);
      const range = new monaco.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn,
      );

      const suggestions: languages.CompletionItem[] = SNIPPETS.map((snippet) => ({
        label: snippet.label,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: snippet.body,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: snippet.detail,
        documentation: { value: snippet.documentation },
        range,
        sortText: `0_${snippet.label}`,
      } as languages.CompletionItem));

      return { suggestions };
    },
  });
}
