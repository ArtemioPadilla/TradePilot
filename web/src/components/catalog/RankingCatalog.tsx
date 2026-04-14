import { useMemo } from 'react';
import {
  generateSamplePrices,
  generateSampleReturns,
  calcVaRHistoric,
  STOCK_NAMES,
} from '../../lib/utils/sampleData';

const EXTENDED_STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'JPM', 'V', 'JNJ'];

interface RankItem {
  symbol: string;
  name: string;
  score: number;
}

const EXTENDED_NAMES: Record<string, string> = {
  ...STOCK_NAMES,
  NVDA: 'NVIDIA Corp.',
  META: 'Meta Platforms Inc.',
  JPM: 'JPMorgan Chase & Co.',
  V: 'Visa Inc.',
  JNJ: 'Johnson & Johnson',
};

interface RankingInfo {
  id: string;
  title: string;
  color: string;
  description: string;
  formula: string;
  formulaDesc: string;
  parameters: { name: string; desc: string; type: string; default?: string }[];
  howItWorks: string;
  useCase: string;
  code: string;
}

const RANKINGS: RankingInfo[] = [
  {
    id: 'momentum',
    title: 'Momentum Ranking',
    color: '#3b82f6',
    description: 'Ranks assets by price momentum — the difference between the current price and the price t periods ago. Higher momentum = higher rank.',
    formula: 'Score(i) = P(i, today) - P(i, today - t)',
    formulaDesc: 'Assets with the largest positive price change over t periods are ranked highest. The simulator handles the sorting (descending).',
    parameters: [
      { name: 'prices', desc: 'DataFrame of historical prices (datetime index, symbol columns)', type: 'DataFrame' },
      { name: 't', desc: 'Lookback period in trading days', type: 'int', default: '10' },
    ],
    howItWorks: 'Computes simple price difference over the lookback window for each asset. Returns a Series of momentum values. The TPS simulator sorts descending to select top assets.',
    useCase: 'Use when you believe recent winners will continue to outperform. Standard in cross-sectional momentum strategies.',
    code: `from tradepilot.ranking import momentum_ranking\n\nscores = momentum_ranking(prices, t=10)\n# Returns pd.Series with momentum scores per asset\n# Simulator selects top N by descending score`,
  },
  {
    id: 'random',
    title: 'Random Ranking',
    color: '#8b5cf6',
    description: 'Assigns random scores to each asset — useful for testing, benchmarking, and Monte Carlo simulations.',
    formula: 'Score(i) = random()  ∈ [0, 1)',
    formulaDesc: 'Each asset gets a uniform random value. Optional seed parameter for reproducibility.',
    parameters: [
      { name: 'prices', desc: 'DataFrame of historical prices (only used for column names)', type: 'DataFrame' },
      { name: 'seed', desc: 'Random seed for reproducibility', type: 'int | None', default: 'None' },
    ],
    howItWorks: 'Uses numpy random to generate a random score for each asset column. With a fixed seed, produces reproducible rankings for testing.',
    useCase: 'Use as a baseline benchmark to verify that your real strategy outperforms random selection. Essential for statistical significance testing.',
    code: `from tradepilot.ranking import random_ranking\n\nscores = random_ranking(prices, seed=42)\n# Returns pd.Series with random scores [0, 1)\n# Use seed for reproducible results`,
  },
  {
    id: 'var',
    title: 'VaR Ranking',
    color: '#06b6d4',
    description: 'Ranks assets by historic Value at Risk — lower VaR means lower risk. Selects the safest assets first.',
    formula: 'Score(i) = VaR_historic(i, t, level)',
    formulaDesc: 'VaR is the loss threshold such that only `level`% of returns fall below it. Lower VaR = less risky = ranked first.',
    parameters: [
      { name: 'prices', desc: 'DataFrame of historical prices', type: 'DataFrame' },
      { name: 't', desc: 'Number of past periods to consider (0 = all)', type: 'int', default: '100' },
      { name: 'level', desc: 'Percentile level for VaR calculation', type: 'int', default: '5' },
    ],
    howItWorks: 'Converts prices to returns, then computes the historic VaR at the given percentile for each asset. Assets with lower VaR (less risk) are preferred. The simulator sorts ascending to select lowest-risk assets.',
    useCase: 'Use for risk-averse portfolio construction. Prioritizes capital preservation by selecting assets with the smallest tail risk.',
    code: `from tradepilot.ranking import var_ranking\n\nscores = var_ranking(prices, t=100, level=5)\n# Returns pd.Series with VaR values per asset\n# Lower VaR = less risky = ranked first`,
  },
];

function seededRandom(seed: number) {
  return function () {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function RankingCatalog() {
  const { prices } = useMemo(() => generateSamplePrices(EXTENDED_STOCKS, 252, 42), []);
  const returns = useMemo(() => generateSampleReturns(prices), [prices]);

  const momentumRanking = useMemo((): RankItem[] => {
    const t = 10;
    return EXTENDED_STOCKS.map(sym => {
      const p = prices[sym];
      return { symbol: sym, name: EXTENDED_NAMES[sym] || sym, score: p[p.length - 1] - p[p.length - 1 - t] };
    }).sort((a, b) => b.score - a.score);
  }, [prices]);

  const randomRanking = useMemo((): RankItem[] => {
    const rng = seededRandom(42);
    return EXTENDED_STOCKS.map(sym => ({
      symbol: sym, name: EXTENDED_NAMES[sym] || sym, score: rng(),
    })).sort((a, b) => b.score - a.score);
  }, []);

  const varRanking = useMemo((): RankItem[] => {
    return EXTENDED_STOCKS.map(sym => {
      const r = returns[sym];
      const var5 = calcVaRHistoric(r, 5);
      return { symbol: sym, name: EXTENDED_NAMES[sym] || sym, score: var5 };
    }).sort((a, b) => a.score - b.score); // ascending — lowest risk first
  }, [returns]);

  const rankingData: Record<string, RankItem[]> = {
    momentum: momentumRanking,
    random: randomRanking,
    var: varRanking,
  };

  return (
    <div className="ranking-catalog">
      <nav className="breadcrumb">
        <a href="/catalog">Catalog</a><span className="sep">/</span><span>Ranking Functions</span>
      </nav>

      <div className="rc-header">
        <h1>Ranking Functions</h1>
        <p>How assets are scored and selected for portfolio construction.</p>
      </div>

      {RANKINGS.map(rank => (
        <section key={rank.id} className="rank-section" style={{ '--rank-color': rank.color } as React.CSSProperties}>
          <div className="rank-card">
            <h2>{rank.title}</h2>
            <p className="rank-desc">{rank.description}</p>

            <div className="formula-box">
              <div className="formula-label">Formula</div>
              <pre className="formula">{rank.formula}</pre>
              <p className="formula-note">{rank.formulaDesc}</p>
            </div>

            <div className="params-section">
              <h3>Parameters</h3>
              <table className="params-table">
                <thead><tr><th>Name</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
                <tbody>
                  {rank.parameters.map(p => (
                    <tr key={p.name}>
                      <td><code>{p.name}</code></td>
                      <td><code>{p.type}</code></td>
                      <td><code>{p.default || '—'}</code></td>
                      <td>{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="how-section">
              <h3>How It Works</h3>
              <p>{rank.howItWorks}</p>
            </div>

            {/* Live Demo */}
            <div className="demo-section">
              <h3>Live Demo — 10 Stocks Ranked</h3>
              <p className="demo-note">Sample data: 252 trading days, seeded random walk</p>
              <table className="demo-table">
                <thead>
                  <tr><th>Rank</th><th>Symbol</th><th>Name</th><th>Score</th><th>Selected</th></tr>
                </thead>
                <tbody>
                  {rankingData[rank.id].map((item, idx) => (
                    <tr key={item.symbol} className={idx < 5 ? 'selected-row' : ''}>
                      <td className="rank-num">#{idx + 1}</td>
                      <td className="symbol">{item.symbol}</td>
                      <td>{item.name}</td>
                      <td className="score">{item.score.toFixed(4)}</td>
                      <td>
                        {idx < 5 ? (
                          <span className="badge selected">Top 5</span>
                        ) : (
                          <span className="badge excluded">Excluded</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="usecase-section">
              <h3>When to Use</h3>
              <p>{rank.useCase}</p>
            </div>

            <div className="code-section">
              <h3>Code Example</h3>
              <pre className="code-block"><code>{rank.code}</code></pre>
            </div>
          </div>
        </section>
      ))}

      <style>{rankingStyles}</style>
    </div>
  );
}

const rankingStyles = `
  .ranking-catalog {
    max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem;
  }

  .breadcrumb {
    display: flex; align-items: center; gap: 0.5rem;
    font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.5rem;
  }
  .breadcrumb a { color: var(--accent); text-decoration: none; }
  .breadcrumb a:hover { text-decoration: underline; }
  .breadcrumb .sep { opacity: 0.5; }

  .rc-header { margin-bottom: 2rem; }
  .rc-header h1 { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.5rem; }
  .rc-header p { color: var(--text-muted); margin: 0; }

  .rank-section { margin-bottom: 2.5rem; }
  .rank-card {
    background: var(--glass-bg, var(--bg-secondary));
    border: 1px solid var(--glass-border, var(--border));
    border-left: 4px solid var(--rank-color);
    border-radius: 16px; padding: 2rem;
  }
  .rank-card h2 { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.5rem; }
  .rank-desc { color: var(--text-secondary, var(--text-muted)); margin: 0 0 1.5rem; font-size: 0.95rem; line-height: 1.5; }
  .rank-card h3 { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 1.5rem 0 0.75rem; }

  .formula-box {
    background: var(--bg-tertiary, #1a1a2e); border: 1px solid var(--border);
    border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem;
  }
  .formula-label { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem; }
  .formula { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 1.1rem; color: var(--accent); margin: 0 0 0.5rem; white-space: pre-wrap; }
  .formula-note { font-size: 0.8rem; color: var(--text-muted); margin: 0; line-height: 1.4; }

  .params-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  .params-table th { text-align: left; padding: 0.5rem 0.75rem; color: var(--text-muted); border-bottom: 1px solid var(--border); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .params-table td { padding: 0.5rem 0.75rem; color: var(--text-secondary, var(--text-muted)); border-bottom: 1px solid var(--border); }
  .params-table code { background: var(--bg-tertiary, #1a1a2e); padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.8rem; color: var(--accent); }

  .how-section p { color: var(--text-secondary, var(--text-muted)); font-size: 0.9rem; line-height: 1.6; }

  .demo-section { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }
  .demo-note { font-size: 0.8rem; color: var(--text-muted); margin: 0 0 1rem; }
  .demo-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  .demo-table th { text-align: left; padding: 0.625rem 0.75rem; color: var(--text-muted); border-bottom: 2px solid var(--border); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; }
  .demo-table td { padding: 0.625rem 0.75rem; border-bottom: 1px solid var(--border); color: var(--text-secondary, var(--text-muted)); }
  .rank-num { font-weight: 700; color: var(--text-primary); }
  .symbol { font-weight: 600; color: var(--text-primary); }
  .score { font-family: monospace; }
  .selected-row { background: rgba(59, 130, 246, 0.05); }

  .badge {
    display: inline-block; padding: 0.125rem 0.625rem; border-radius: 99px;
    font-size: 0.75rem; font-weight: 600;
  }
  .badge.selected { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
  .badge.excluded { background: rgba(156, 163, 175, 0.1); color: #6b7280; }

  .usecase-section p { color: var(--text-secondary, var(--text-muted)); font-size: 0.9rem; line-height: 1.5; }

  .code-section { margin-top: 1.5rem; }
  .code-block {
    background: var(--bg-tertiary, #0d1117); border: 1px solid var(--border);
    border-radius: 12px; padding: 1.25rem;
    font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.8rem;
    color: var(--text-secondary, #c9d1d9); overflow-x: auto; white-space: pre-wrap; line-height: 1.6;
  }

  @media (max-width: 768px) {
    .ranking-catalog { padding: 1rem; }
    .rank-card { padding: 1.25rem; }
  }
`;

export default RankingCatalog;
