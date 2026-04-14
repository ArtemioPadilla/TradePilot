import { useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts';
import {
  generateSamplePrices, generateSampleReturns,
  computeCovMatrix, annualizeReturns, annualizeVol,
  generateEfficientFrontier, portfolioReturn, portfolioVol,
  SAMPLE_STOCKS, STOCK_NAMES,
} from '../../lib/utils/sampleData';

interface OptimizerInfo {
  id: string;
  title: string;
  shortName: string;
  color: string;
  description: string;
  formula: string;
  formulaDesc: string;
  howItWorks: string;
  objective: string;
  characteristics: string[];
  useCase: string;
  code: string;
}

const OPTIMIZERS: OptimizerInfo[] = [
  {
    id: 'msr',
    title: 'Maximum Sharpe Ratio (MSR)',
    shortName: 'MSR',
    color: '#ef4444',
    description: 'Finds the portfolio weights that maximize the Sharpe ratio — the best risk-adjusted return.',
    formula: 'max_w  (w^T * μ - r_f) / √(w^T * Σ * w)',
    formulaDesc: 'Subject to: Σw_i = 1, w_min ≤ w_i ≤ w_max. Where μ = expected returns, Σ = covariance matrix, r_f = risk-free rate.',
    howItWorks: 'Uses scipy.optimize.minimize with SLSQP method to find weights that minimize the negative Sharpe ratio (equivalent to maximizing Sharpe), subject to weight constraints (min 1%, max 95% per asset) and the constraint that weights sum to 1.',
    objective: 'Maximize risk-adjusted return',
    characteristics: [
      'Highest Sharpe ratio among all portfolios on the frontier',
      'Located on the tangent line from the risk-free rate to the frontier',
      'Concentrates in high-return, low-correlation assets',
      'Sensitive to expected return estimates',
    ],
    useCase: 'Best when you have reliable return forecasts and want to maximize reward per unit of risk.',
    code: `from tradepilot.optimization import msr\n\nweights = msr(\n    riskfree_rate=0.04,\n    er=expected_returns,\n    cov=covariance_matrix,\n    min_w=0.01, max_w=0.95\n)`,
  },
  {
    id: 'gmv',
    title: 'Global Minimum Variance (GMV)',
    shortName: 'GMV',
    color: '#22c55e',
    description: 'Finds the portfolio with the lowest possible volatility — the leftmost point on the efficient frontier.',
    formula: 'min_w  √(w^T * Σ * w)',
    formulaDesc: 'Subject to: Σw_i = 1, w_min ≤ w_i ≤ w_max. Uses the MSR trick: when all expected returns are equal, maximizing Sharpe minimizes volatility.',
    howItWorks: 'Calls the MSR optimizer with all expected returns set to 1 and risk-free rate of 0. When returns are identical, maximizing Sharpe ratio is equivalent to minimizing portfolio variance.',
    objective: 'Minimize portfolio risk',
    characteristics: [
      'Lowest volatility portfolio on the efficient frontier',
      'Does not require expected return estimates',
      'Only depends on the covariance matrix',
      'More diversified than MSR typically',
    ],
    useCase: 'Best when return estimates are unreliable or when the primary goal is capital preservation and risk minimization.',
    code: `from tradepilot.optimization import gmv\n\nweights = gmv(\n    cov=covariance_matrix,\n    min_w=0.01, max_w=0.95\n)`,
  },
  {
    id: 'ew',
    title: 'Equal Weight (EW)',
    shortName: 'EW',
    color: '#eab308',
    description: 'Allocates equal weight to every asset in the portfolio — the simplest possible allocation.',
    formula: 'w_i = 1 / N  for all i',
    formulaDesc: 'Where N is the number of assets. No optimization needed — just divide equally.',
    howItWorks: 'Returns a weight vector where each element is 1/N. Serves as a baseline benchmark for comparing optimization methods.',
    objective: 'Maximum simplicity and diversification',
    characteristics: [
      'No estimation error — completely model-free',
      'Maximum naive diversification',
      'Often surprisingly competitive (the "1/N puzzle")',
      'Zero rebalancing complexity',
    ],
    useCase: 'Best as a robust baseline, when you distrust all forecasts, or for simple rebalancing strategies.',
    code: `from tradepilot.optimization import eq_weighted\n\nweights = eq_weighted(expected_returns)\n# Returns array([0.2, 0.2, 0.2, 0.2, 0.2]) for 5 assets`,
  },
];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
      {d.label && <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.label}</div>}
      <div>Volatility: {(d.volatility * 100).toFixed(2)}%</div>
      <div>Return: {(d.expectedReturn * 100).toFixed(2)}%</div>
    </div>
  );
}

export function OptimizerCatalog() {
  const { prices } = useMemo(() => generateSamplePrices(), []);
  const returns = useMemo(() => generateSampleReturns(prices), [prices]);

  const { frontier, msrPoint, gmvPoint, ewPoint, comparison } = useMemo(() => {
    const { symbols, matrix: covMatrix } = computeCovMatrix(returns);
    const er = symbols.map(s => annualizeReturns(returns[s]));
    const n = symbols.length;

    const frontier = generateEfficientFrontier(er, covMatrix, 60);

    // Simple weight heuristics for demo
    // MSR-like: bias toward highest return
    const maxIdx = er.indexOf(Math.max(...er));
    const msrWeights = er.map((_, i) => i === maxIdx ? 0.4 : 0.6 / (n - 1));
    // GMV-like: bias toward lowest vol
    const vols = symbols.map(s => annualizeVol(returns[s]));
    const invVol = vols.map(v => 1 / (v + 1e-10));
    const invVolSum = invVol.reduce((a, b) => a + b, 0);
    const gmvWeights = invVol.map(v => v / invVolSum);
    // EW
    const ewWeights = symbols.map(() => 1 / n);

    const msrPoint = {
      volatility: portfolioVol(msrWeights, covMatrix) * Math.sqrt(252),
      expectedReturn: portfolioReturn(msrWeights, er),
      label: 'Max Sharpe Ratio',
    };
    const gmvPoint = {
      volatility: portfolioVol(gmvWeights, covMatrix) * Math.sqrt(252),
      expectedReturn: portfolioReturn(gmvWeights, er),
      label: 'Global Min Variance',
    };
    const ewPoint = {
      volatility: portfolioVol(ewWeights, covMatrix) * Math.sqrt(252),
      expectedReturn: portfolioReturn(ewWeights, er),
      label: 'Equal Weight',
    };

    const comparison = [
      { name: 'MSR', ret: msrPoint.expectedReturn, vol: msrPoint.volatility, sharpe: msrPoint.expectedReturn / msrPoint.volatility, weights: Object.fromEntries(symbols.map((s, i) => [s, msrWeights[i]])) },
      { name: 'GMV', ret: gmvPoint.expectedReturn, vol: gmvPoint.volatility, sharpe: gmvPoint.expectedReturn / gmvPoint.volatility, weights: Object.fromEntries(symbols.map((s, i) => [s, gmvWeights[i]])) },
      { name: 'EW', ret: ewPoint.expectedReturn, vol: ewPoint.volatility, sharpe: ewPoint.expectedReturn / ewPoint.volatility, weights: Object.fromEntries(symbols.map((s, i) => [s, ewWeights[i]])) },
    ];

    return { frontier, msrPoint, gmvPoint, ewPoint, comparison };
  }, [returns]);

  return (
    <div className="optimizer-catalog">
      <nav className="breadcrumb">
        <a href="/catalog">Catalog</a><span className="sep">/</span><span>Optimization Methods</span>
      </nav>

      <div className="oc-header">
        <h1>Optimization Methods</h1>
        <p>Portfolio weight allocation techniques from Modern Portfolio Theory.</p>
      </div>

      {/* Live Efficient Frontier Demo */}
      <div className="ef-demo-card">
        <h2>Live Demo — Efficient Frontier</h2>
        <p className="demo-note">Generated from 252 days of sample data for {SAMPLE_STOCKS.join(', ')}</p>
        <div className="ef-chart">
          <ResponsiveContainer width="100%" height={420}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <XAxis type="number" dataKey="volatility" name="Volatility"
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                label={{ value: 'Volatility (Risk)', position: 'insideBottom', offset: -10, fill: 'var(--text-muted)' }}
              />
              <YAxis type="number" dataKey="expectedReturn" name="Return"
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                label={{ value: 'Expected Return', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <Scatter name="Frontier" data={frontier} fill="#3b82f6" r={3} />
              <Scatter name="MSR" data={[msrPoint]} fill="#ef4444" r={10} />
              <Scatter name="GMV" data={[gmvPoint]} fill="#22c55e" r={10} />
              <Scatter name="EW" data={[ewPoint]} fill="#eab308" r={10} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Comparison Table */}
        <h3>Comparison</h3>
        <table className="comparison-table">
          <thead>
            <tr><th>Method</th><th>Return</th><th>Volatility</th><th>Sharpe</th>{SAMPLE_STOCKS.map(s => <th key={s}>{s}</th>)}</tr>
          </thead>
          <tbody>
            {comparison.map(c => (
              <tr key={c.name}>
                <td className="method-name"><span className="dot" style={{ background: c.name === 'MSR' ? '#ef4444' : c.name === 'GMV' ? '#22c55e' : '#eab308' }} />{c.name}</td>
                <td>{(c.ret * 100).toFixed(2)}%</td>
                <td>{(c.vol * 100).toFixed(2)}%</td>
                <td>{c.sharpe.toFixed(2)}</td>
                {SAMPLE_STOCKS.map(s => <td key={s}>{((c.weights[s] || 0) * 100).toFixed(1)}%</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed sections for each optimizer */}
      {OPTIMIZERS.map(opt => (
        <section key={opt.id} className="opt-section" style={{ '--opt-color': opt.color } as React.CSSProperties}>
          <div className="opt-card">
            <div className="opt-badge" style={{ background: opt.color }}>{opt.shortName}</div>
            <h2>{opt.title}</h2>
            <p className="opt-desc">{opt.description}</p>

            <div className="formula-box">
              <div className="formula-label">Objective</div>
              <pre className="formula">{opt.formula}</pre>
              <p className="formula-note">{opt.formulaDesc}</p>
            </div>

            <div className="how-section">
              <h3>How It Works</h3>
              <p>{opt.howItWorks}</p>
            </div>

            <div className="chars-section">
              <h3>Characteristics</h3>
              <ul>{opt.characteristics.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </div>

            <div className="usecase-section">
              <h3>When to Use</h3>
              <p>{opt.useCase}</p>
            </div>

            <div className="code-section">
              <h3>Code Example</h3>
              <pre className="code-block"><code>{opt.code}</code></pre>
            </div>
          </div>
        </section>
      ))}

      <style>{optimizerStyles}</style>
    </div>
  );
}

const optimizerStyles = `
  .optimizer-catalog {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }

  .breadcrumb {
    display: flex; align-items: center; gap: 0.5rem;
    font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.5rem;
  }
  .breadcrumb a { color: var(--accent); text-decoration: none; }
  .breadcrumb a:hover { text-decoration: underline; }
  .breadcrumb .sep { opacity: 0.5; }

  .oc-header { margin-bottom: 2rem; }
  .oc-header h1 { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.5rem; }
  .oc-header p { color: var(--text-muted); margin: 0; }

  .ef-demo-card {
    background: var(--glass-bg, var(--bg-secondary));
    border: 1px solid var(--glass-border, var(--border));
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 2.5rem;
  }
  .ef-demo-card h2 { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.5rem; }
  .ef-demo-card h3 { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 1.5rem 0 0.75rem; }
  .demo-note { font-size: 0.8rem; color: var(--text-muted); margin: 0 0 1rem; }

  .ef-chart {
    background: var(--bg-tertiary, #1a1a2e);
    border-radius: 12px;
    padding: 1rem;
  }

  .comparison-table {
    width: 100%; border-collapse: collapse; font-size: 0.85rem;
  }
  .comparison-table th {
    text-align: left; padding: 0.625rem 0.75rem; color: var(--text-muted);
    border-bottom: 2px solid var(--border); font-weight: 600; font-size: 0.75rem;
    text-transform: uppercase; letter-spacing: 0.05em;
  }
  .comparison-table td {
    padding: 0.625rem 0.75rem; border-bottom: 1px solid var(--border);
    color: var(--text-secondary, var(--text-muted)); font-family: monospace;
  }
  .method-name {
    display: flex; align-items: center; gap: 0.5rem;
    font-weight: 600; color: var(--text-primary) !important; font-family: inherit !important;
  }
  .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  .opt-section { margin-bottom: 2rem; }
  .opt-card {
    background: var(--glass-bg, var(--bg-secondary));
    border: 1px solid var(--glass-border, var(--border));
    border-left: 4px solid var(--opt-color);
    border-radius: 16px;
    padding: 2rem;
    position: relative;
  }
  .opt-badge {
    display: inline-block; padding: 0.25rem 0.75rem; border-radius: 99px;
    font-size: 0.75rem; font-weight: 700; color: white; margin-bottom: 0.75rem;
  }
  .opt-card h2 { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.5rem; }
  .opt-desc { color: var(--text-secondary, var(--text-muted)); margin: 0 0 1.5rem; font-size: 0.95rem; line-height: 1.5; }
  .opt-card h3 { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 1.5rem 0 0.75rem; }

  .formula-box {
    background: var(--bg-tertiary, #1a1a2e); border: 1px solid var(--border);
    border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem;
  }
  .formula-label {
    font-size: 0.7rem; font-weight: 700; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem;
  }
  .formula {
    font-family: 'SF Mono', 'Fira Code', monospace; font-size: 1.1rem;
    color: var(--accent); margin: 0 0 0.5rem; white-space: pre-wrap;
  }
  .formula-note { font-size: 0.8rem; color: var(--text-muted); margin: 0; line-height: 1.4; }

  .how-section p, .usecase-section p {
    color: var(--text-secondary, var(--text-muted)); font-size: 0.9rem; line-height: 1.6;
  }

  .chars-section ul {
    list-style: none; padding: 0; margin: 0;
    font-size: 0.85rem; color: var(--text-secondary, var(--text-muted));
  }
  .chars-section li { padding: 0.25rem 0; }
  .chars-section li::before { content: '• '; color: var(--opt-color); font-weight: 700; }

  .code-section { margin-top: 1.5rem; }
  .code-block {
    background: var(--bg-tertiary, #0d1117); border: 1px solid var(--border);
    border-radius: 12px; padding: 1.25rem;
    font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.8rem;
    color: var(--text-secondary, #c9d1d9); overflow-x: auto; white-space: pre-wrap; line-height: 1.6;
  }

  @media (max-width: 768px) {
    .optimizer-catalog { padding: 1rem; }
    .opt-card, .ef-demo-card { padding: 1.25rem; }
    .comparison-table { font-size: 0.75rem; }
  }
`;

export default OptimizerCatalog;
