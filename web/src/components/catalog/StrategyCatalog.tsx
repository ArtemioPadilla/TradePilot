import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  generateSamplePrices,
  generateSampleReturns,
  generateSampleBacktest,
  SAMPLE_STOCKS,
  STOCK_NAMES,
} from '../../lib/utils/sampleData';

export function StrategyCatalog() {
  const { dates, prices } = useMemo(() => generateSamplePrices(), []);
  const returns = useMemo(() => generateSampleReturns(prices), [prices]);

  const momentumRanking = useMemo(() => {
    const t = 20;
    const scores: { symbol: string; name: string; score: number }[] = [];
    for (const sym of Object.keys(prices)) {
      const p = prices[sym];
      const score = p[p.length - 1] - p[p.length - 1 - t];
      scores.push({ symbol: sym, name: STOCK_NAMES[sym] || sym, score });
    }
    return scores.sort((a, b) => b.score - a.score);
  }, [prices]);

  const meanRevRanking = useMemo(() => {
    const t = 20;
    const scores: { symbol: string; name: string; score: number }[] = [];
    for (const sym of Object.keys(prices)) {
      const p = prices[sym];
      const sma = p.slice(-t).reduce((a, b) => a + b, 0) / t;
      const score = p[p.length - 1] - sma;
      scores.push({ symbol: sym, name: STOCK_NAMES[sym] || sym, score });
    }
    return scores.sort((a, b) => a.score - b.score);
  }, [prices]);

  const smartBetaRanking = useMemo(() => {
    const scores: { symbol: string; name: string; score: number }[] = [];
    for (const sym of Object.keys(returns)) {
      const r = returns[sym];
      const mean = r.reduce((a, b) => a + b, 0) / r.length;
      const std = Math.sqrt(r.reduce((acc, v) => acc + (v - mean) ** 2, 0) / r.length);
      const score = std === 0 ? 0 : mean / std;
      scores.push({ symbol: sym, name: STOCK_NAMES[sym] || sym, score });
    }
    return scores.sort((a, b) => b.score - a.score);
  }, [returns]);

  const backtest = useMemo(() => generateSampleBacktest(), []);
  const chartData = useMemo(
    () =>
      backtest.dates.map((d, i) => ({
        date: d,
        portfolio: Math.round(backtest.portfolioValues[i]),
        benchmark: Math.round(backtest.benchmarkValues[i]),
      })),
    [backtest],
  );

  const strategies = [
    {
      id: 'momentum',
      title: 'Momentum Strategy',
      color: '#3b82f6',
      description:
        'Selects assets with the strongest recent price momentum, betting that recent winners will continue to outperform.',
      formula: 'Momentum(i) = P(i, today) - P(i, today - t)',
      formulaDesc:
        'Where P(i,t) is the price of asset i at time t, and t is the lookback period (default: 20 days)',
      parameters: [
        { name: 't', desc: 'Lookback period in trading days (default: 20)', type: 'int' },
        {
          name: 'prices',
          desc: 'DataFrame of historical prices with datetime index',
          type: 'DataFrame',
        },
      ],
      steps: [
        'Fetch historical closing prices for all assets in the universe',
        'Calculate momentum = current price - price t periods ago',
        'Rank assets by momentum score (highest first)',
        'Select top N assets for the portfolio',
        'Pass selected assets to the optimizer for weight allocation',
      ],
      ranking: momentumRanking,
      pros: [
        'Simple and intuitive',
        'Well-documented academic support',
        'Works in trending markets',
        'Easy to implement and backtest',
      ],
      cons: [
        'Suffers in mean-reverting markets',
        'Can lead to high turnover',
        'Momentum crashes during regime changes',
        'Lookback period sensitivity',
      ],
      useCase:
        'Best for trending markets with clear directional moves. Commonly used in cross-sectional equity strategies.',
      code: `from tradepilot.ranking import momentum_ranking\n\n# Rank assets by 20-day momentum\nscores = momentum_ranking(prices, t=20)\n# Higher score = stronger momentum\nselected = scores.nlargest(5).index.tolist()`,
    },
    {
      id: 'mean_reversion',
      title: 'Mean Reversion Strategy',
      color: '#22c55e',
      description:
        'Identifies oversold assets trading below their moving average, betting they will revert to the mean.',
      formula: 'Deviation(i) = P(i, today) - SMA(i, t)',
      formulaDesc:
        'Where SMA(i,t) is the Simple Moving Average of asset i over t periods. Most negative = most oversold.',
      parameters: [
        {
          name: 't',
          desc: 'Moving average window in trading days (default: 20)',
          type: 'int',
        },
        { name: 'prices', desc: 'DataFrame of historical prices', type: 'DataFrame' },
      ],
      steps: [
        'Calculate t-period Simple Moving Average for each asset',
        'Compute deviation = current price - SMA',
        'Rank assets by deviation (ascending — most oversold first)',
        'Select top N most oversold assets',
        'Allocate weights via the chosen optimizer',
      ],
      ranking: meanRevRanking,
      pros: [
        'Contrarian approach captures rebounds',
        'Works well in range-bound markets',
        'Can identify undervalued assets',
        'Natural buy-low mechanism',
      ],
      cons: [
        'Can catch falling knives',
        'Underperforms in strong trends',
        'Requires accurate mean estimation',
        'Risk of value traps',
      ],
      useCase:
        'Best for range-bound or mean-reverting markets. Pairs well with the GMV optimizer for risk management.',
      code: `from strategies.mean_reversion import mean_reversion_strategy\n\n# Find assets below their 20-day moving average\nordered = mean_reversion_strategy(prices, t=20)\n# First assets are most oversold\nselected = ordered[:5]`,
    },
    {
      id: 'smart_beta',
      title: 'Smart Beta Strategy',
      color: '#f59e0b',
      description:
        'Ranks assets by their risk-adjusted returns (return per unit of risk), similar to a per-asset Sharpe ratio.',
      formula: 'SmartBeta(i) = mean(R_i) / std(R_i)',
      formulaDesc:
        'Where R_i are the returns of asset i. Higher ratio = better risk-adjusted performance.',
      parameters: [
        { name: 'prices', desc: 'DataFrame of historical prices', type: 'DataFrame' },
      ],
      steps: [
        'Calculate daily returns for each asset',
        'Compute mean return and standard deviation for each',
        'Calculate ratio: mean / std (risk-adjusted return)',
        'Rank by ratio descending (highest risk-adjusted return first)',
        'Select top N assets and optimize weights',
      ],
      ranking: smartBetaRanking,
      pros: [
        'Risk-aware selection',
        'Favors consistent performers',
        'Less volatile portfolios',
        'Academic Sharpe ratio foundation',
      ],
      cons: [
        'Backward-looking (past ≠ future)',
        'Penalizes high-growth volatile stocks',
        'Sensitive to estimation period',
        'May underperform in bull markets',
      ],
      useCase:
        'Best for investors seeking risk-adjusted returns. Works well for long-term portfolio construction.',
      code: `from strategies.smart_beta import smart_beta_strategy\n\n# Rank by risk-adjusted return (mean/std)\nscores = smart_beta_strategy(prices)\nselected = scores.nlargest(5).index.tolist()`,
    },
  ];

  return (
    <div className="strategy-catalog">
      <nav className="breadcrumb">
        <a href="/catalog">Catalog</a>
        <span className="sep">/</span>
        <span>Strategies</span>
      </nav>

      <div className="sc-header">
        <h1>Trading Strategies</h1>
        <p>
          Explore how each strategy selects and ranks assets for portfolio construction.
        </p>
      </div>

      {strategies.map((strat) => (
        <section
          key={strat.id}
          className="strategy-section"
          style={{ '--strat-color': strat.color } as React.CSSProperties}
        >
          <div className="strat-card">
            <h2>{strat.title}</h2>
            <p className="strat-desc">{strat.description}</p>

            <div className="formula-box">
              <div className="formula-label">Formula</div>
              <pre className="formula">{strat.formula}</pre>
              <p className="formula-note">{strat.formulaDesc}</p>
            </div>

            <div className="params-section">
              <h3>Parameters</h3>
              <table className="params-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {strat.parameters.map((p) => (
                    <tr key={p.name}>
                      <td>
                        <code>{p.name}</code>
                      </td>
                      <td>
                        <code>{p.type}</code>
                      </td>
                      <td>{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="steps-section">
              <h3>How It Works</h3>
              <ol className="steps-list">
                {strat.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="demo-section">
              <h3>Live Demo — Ranking Output</h3>
              <p className="demo-note">
                Ranked using 252 days of generated sample data for{' '}
                {Object.keys(prices).join(', ')}
              </p>
              <table className="demo-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Symbol</th>
                    <th>Name</th>
                    <th>Score</th>
                    <th>Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {strat.ranking.map((item, idx) => (
                    <tr key={item.symbol}>
                      <td className="rank">#{idx + 1}</td>
                      <td className="symbol">{item.symbol}</td>
                      <td>{item.name}</td>
                      <td className="score">{item.score.toFixed(4)}</td>
                      <td>
                        <span className={`signal ${idx < 3 ? 'buy' : 'hold'}`}>
                          {idx < 3 ? 'Buy' : 'Hold'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mini-chart">
                <h4>Sample Backtest Performance</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" tick={false} stroke="var(--text-muted)" />
                    <YAxis
                      stroke="var(--text-muted)"
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                      }}
                      formatter={(v: number) => [`$${v.toLocaleString()}`, '']}
                    />
                    <Line
                      type="monotone"
                      dataKey="portfolio"
                      stroke={strat.color}
                      dot={false}
                      strokeWidth={2}
                      name="Portfolio"
                    />
                    <Line
                      type="monotone"
                      dataKey="benchmark"
                      stroke="var(--text-muted)"
                      dot={false}
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      name="Benchmark"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="usecase-section">
              <h3>When to Use</h3>
              <p>{strat.useCase}</p>
              <div className="pros-cons">
                <div className="pros">
                  <h4>Pros</h4>
                  <ul>
                    {strat.pros.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
                <div className="cons">
                  <h4>Cons</h4>
                  <ul>
                    {strat.cons.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="code-section">
              <h3>Code Example</h3>
              <pre className="code-block">
                <code>{strat.code}</code>
              </pre>
            </div>
          </div>
        </section>
      ))}

      <style>{strategyCatalogStyles}</style>
    </div>
  );
}

const strategyCatalogStyles = `
  .strategy-catalog {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-bottom: 1.5rem;
  }
  .breadcrumb a { color: var(--accent); text-decoration: none; }
  .breadcrumb a:hover { text-decoration: underline; }
  .breadcrumb .sep { opacity: 0.5; }

  .sc-header { margin-bottom: 2rem; }
  .sc-header h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 0.5rem;
  }
  .sc-header p { color: var(--text-muted); margin: 0; }

  .strategy-section { margin-bottom: 2.5rem; }

  .strat-card {
    background: var(--glass-bg, var(--bg-secondary));
    border: 1px solid var(--glass-border, var(--border));
    border-left: 4px solid var(--strat-color);
    border-radius: 16px;
    padding: 2rem;
  }

  .strat-card h2 {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 0.5rem;
  }

  .strat-desc {
    color: var(--text-secondary, var(--text-muted));
    margin: 0 0 1.5rem;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .strat-card h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 1.5rem 0 0.75rem;
  }

  .strat-card h4 {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 0.5rem;
  }

  /* Formula */
  .formula-box {
    background: var(--bg-tertiary, #1a1a2e);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1rem;
  }
  .formula-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 0.5rem;
  }
  .formula {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 1.1rem;
    color: var(--accent);
    margin: 0 0 0.5rem;
    white-space: pre-wrap;
  }
  .formula-note {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.4;
  }

  /* Params table */
  .params-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }
  .params-table th {
    text-align: left;
    padding: 0.5rem 0.75rem;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border);
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .params-table td {
    padding: 0.5rem 0.75rem;
    color: var(--text-secondary, var(--text-muted));
    border-bottom: 1px solid var(--border);
  }
  .params-table code {
    background: var(--bg-tertiary, #1a1a2e);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.8rem;
    color: var(--accent);
  }

  /* Steps */
  .steps-list {
    padding-left: 1.5rem;
    font-size: 0.875rem;
    color: var(--text-secondary, var(--text-muted));
    line-height: 1.8;
  }

  /* Demo */
  .demo-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
  }
  .demo-note {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin: 0 0 1rem;
  }
  .demo-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    margin-bottom: 1.5rem;
  }
  .demo-table th {
    text-align: left;
    padding: 0.625rem 0.75rem;
    color: var(--text-muted);
    border-bottom: 2px solid var(--border);
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
  }
  .demo-table td {
    padding: 0.625rem 0.75rem;
    border-bottom: 1px solid var(--border);
    color: var(--text-secondary, var(--text-muted));
  }
  .demo-table .rank {
    font-weight: 700;
    color: var(--text-primary);
  }
  .demo-table .symbol {
    font-weight: 600;
    color: var(--text-primary);
  }
  .demo-table .score {
    font-family: monospace;
  }
  .signal {
    display: inline-block;
    padding: 0.125rem 0.625rem;
    border-radius: 99px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .signal.buy {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }
  .signal.hold {
    background: rgba(156, 163, 175, 0.15);
    color: #9ca3af;
  }

  .mini-chart {
    background: var(--bg-tertiary, #1a1a2e);
    border-radius: 12px;
    padding: 1rem;
  }
  .mini-chart h4 { margin-bottom: 0.75rem; }

  /* Pros/Cons */
  .pros-cons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-top: 0.75rem;
  }
  .pros ul, .cons ul {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 0.85rem;
    color: var(--text-secondary, var(--text-muted));
  }
  .pros li::before { content: '\\2713  '; color: #22c55e; font-weight: 700; }
  .cons li::before { content: '\\2717  '; color: #ef4444; font-weight: 700; }
  .pros li, .cons li { padding: 0.25rem 0; }

  /* Code */
  .code-section { margin-top: 1.5rem; }
  .code-block {
    background: var(--bg-tertiary, #0d1117);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.25rem;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.8rem;
    color: var(--text-secondary, #c9d1d9);
    overflow-x: auto;
    white-space: pre-wrap;
    line-height: 1.6;
  }

  /* Use case */
  .usecase-section p {
    color: var(--text-secondary, var(--text-muted));
    font-size: 0.9rem;
    line-height: 1.5;
  }

  @media (max-width: 768px) {
    .strategy-catalog { padding: 1rem; }
    .strat-card { padding: 1.25rem; }
    .pros-cons { grid-template-columns: 1fr; }
  }
`;

export default StrategyCatalog;
