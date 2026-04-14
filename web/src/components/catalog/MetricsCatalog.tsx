import { useState, useMemo } from 'react';
import {
  generateSamplePrices, generateSampleReturns, SAMPLE_STOCKS, STOCK_NAMES,
  annualizeReturns, annualizeVol, calcVaRHistoric, calcVaRGaussian,
  calcMaxDrawdown, calcSharpe, calcSortino, calcSkewness, calcKurtosis,
} from '../../lib/utils/sampleData';

interface MetricDef {
  id: string;
  name: string;
  category: 'Return' | 'Risk' | 'Distribution' | 'Portfolio';
  categoryColor: string;
  description: string;
  formula: string;
  formulaDesc: string;
  whyItMatters: string;
  exampleValue: string; // calculated from sample data
}

const CATEGORY_COLORS: Record<string, string> = {
  Return: '#22c55e',
  Risk: '#ef4444',
  Distribution: '#8b5cf6',
  Portfolio: '#3b82f6',
};

export function MetricsCatalog() {
  const [filter, setFilter] = useState<string>('All');

  const { prices } = useMemo(() => generateSamplePrices(), []);
  const returns = useMemo(() => generateSampleReturns(prices), [prices]);

  // Compute example values for AAPL
  const aaplReturns = returns['AAPL'];
  const aaplPrices = prices['AAPL'];

  const metrics: MetricDef[] = useMemo(() => [
    {
      id: 'returns',
      name: 'Daily Returns',
      category: 'Return',
      categoryColor: CATEGORY_COLORS.Return,
      description: 'Percentage change in price from one period to the next. The fundamental building block of all other metrics.',
      formula: 'R_t = (P_t - P_{t-1}) / P_{t-1}',
      formulaDesc: 'Where P_t is the price at time t. Also called simple returns or arithmetic returns.',
      whyItMatters: 'Returns normalize price movements across different price levels, enabling comparison between assets and time periods.',
      exampleValue: `Mean: ${(aaplReturns.reduce((a, b) => a + b, 0) / aaplReturns.length * 100).toFixed(4)}%`,
    },
    {
      id: 'annualized_returns',
      name: 'Annualized Returns',
      category: 'Return',
      categoryColor: CATEGORY_COLORS.Return,
      description: 'Compound returns scaled to a one-year period for standardized comparison across different time horizons.',
      formula: 'R_annual = (∏(1 + R_t))^(252/N) - 1',
      formulaDesc: 'Where N is the number of periods and 252 is trading days per year. Uses geometric (compound) growth.',
      whyItMatters: 'Enables apples-to-apples comparison of returns across different holding periods and investment strategies.',
      exampleValue: `${(annualizeReturns(aaplReturns) * 100).toFixed(2)}%`,
    },
    {
      id: 'volatility',
      name: 'Annualized Volatility',
      category: 'Risk',
      categoryColor: CATEGORY_COLORS.Risk,
      description: 'Standard deviation of returns, scaled to annual frequency. The most common measure of total risk.',
      formula: 'σ_annual = std(R) × √252',
      formulaDesc: 'Volatility scales with the square root of time (assuming i.i.d. returns).',
      whyItMatters: 'Higher volatility means wider range of possible outcomes. Used in Sharpe ratio, option pricing, and risk budgeting.',
      exampleValue: `${(annualizeVol(aaplReturns) * 100).toFixed(2)}%`,
    },
    {
      id: 'semideviation',
      name: 'Semideviation',
      category: 'Risk',
      categoryColor: CATEGORY_COLORS.Risk,
      description: 'Standard deviation of only negative returns. Measures downside risk, ignoring upside volatility.',
      formula: 'σ_down = std(R | R < 0)',
      formulaDesc: 'Only considers returns below zero. Investors care more about downside risk than upside "risk".',
      whyItMatters: 'Captures the asymmetric nature of risk preferences. Used in the Sortino ratio as a better denominator than total volatility.',
      exampleValue: (() => {
        const neg = aaplReturns.filter(r => r < 0);
        const mean = neg.reduce((a, b) => a + b, 0) / neg.length;
        const std = Math.sqrt(neg.reduce((acc, r) => acc + (r - mean) ** 2, 0) / (neg.length - 1));
        return `${(std * Math.sqrt(252) * 100).toFixed(2)}%`;
      })(),
    },
    {
      id: 'sharpe',
      name: 'Sharpe Ratio',
      category: 'Portfolio',
      categoryColor: CATEGORY_COLORS.Portfolio,
      description: 'Excess return per unit of total risk. The gold standard for risk-adjusted performance measurement.',
      formula: 'SR = (R_p - R_f) / σ_p',
      formulaDesc: 'Where R_p = annualized portfolio return, R_f = risk-free rate, σ_p = annualized portfolio volatility.',
      whyItMatters: 'A Sharpe > 1.0 is generally considered good, > 2.0 is very good. Enables comparison of strategies with different risk levels.',
      exampleValue: calcSharpe(aaplReturns).toFixed(2),
    },
    {
      id: 'sortino',
      name: 'Sortino Ratio',
      category: 'Portfolio',
      categoryColor: CATEGORY_COLORS.Portfolio,
      description: 'Excess return per unit of downside risk. A more nuanced alternative to the Sharpe ratio.',
      formula: 'Sortino = (R_p - R_f) / σ_down',
      formulaDesc: 'Uses semideviation (downside volatility) instead of total volatility in the denominator.',
      whyItMatters: 'Penalizes only harmful volatility. An asset with high upside volatility and low downside will have a better Sortino than Sharpe.',
      exampleValue: calcSortino(aaplReturns).toFixed(2),
    },
    {
      id: 'var_historic',
      name: 'Historic VaR',
      category: 'Risk',
      categoryColor: CATEGORY_COLORS.Risk,
      description: 'The loss threshold at a given confidence level based on historical return distribution.',
      formula: 'VaR_α = -Percentile(R, α)',
      formulaDesc: 'At 5% level: "There is a 5% chance that daily losses will exceed this value." Non-parametric — uses actual return data.',
      whyItMatters: 'Required by regulators for bank capital requirements. Provides a concrete dollar-loss estimate at a given confidence.',
      exampleValue: `${(calcVaRHistoric(aaplReturns) * 100).toFixed(2)}%`,
    },
    {
      id: 'var_gaussian',
      name: 'Gaussian VaR',
      category: 'Risk',
      categoryColor: CATEGORY_COLORS.Risk,
      description: 'Parametric VaR assuming returns follow a normal distribution.',
      formula: 'VaR = -(μ + z_α × σ)',
      formulaDesc: 'Where z_α is the z-score for the confidence level (e.g., -1.645 for 5%). Assumes normality of returns.',
      whyItMatters: 'Fast to compute and analytically tractable. But underestimates risk if returns have fat tails (which they usually do).',
      exampleValue: `${(calcVaRGaussian(aaplReturns) * 100).toFixed(2)}%`,
    },
    {
      id: 'var_cf',
      name: 'Cornish-Fisher VaR',
      category: 'Risk',
      categoryColor: CATEGORY_COLORS.Risk,
      description: 'Modified VaR that adjusts for skewness and kurtosis in the return distribution.',
      formula: 'z_cf = z + (z²-1)S/6 + (z³-3z)(K-3)/24 - (2z³-5z)S²/36',
      formulaDesc: 'Adjusts the Gaussian z-score using observed skewness (S) and kurtosis (K). Then VaR = -(μ + z_cf × σ).',
      whyItMatters: 'Better captures tail risk than Gaussian VaR when returns are skewed or have fat tails — which is common in financial data.',
      exampleValue: (() => {
        const mean = aaplReturns.reduce((a, b) => a + b, 0) / aaplReturns.length;
        const std = Math.sqrt(aaplReturns.reduce((acc, r) => acc + (r - mean) ** 2, 0) / aaplReturns.length);
        const s = calcSkewness(aaplReturns);
        const k = calcKurtosis(aaplReturns);
        let z = -1.645;
        z = z + (z**2 - 1) * s / 6 + (z**3 - 3*z) * (k - 3) / 24 - (2*z**3 - 5*z) * (s**2) / 36;
        return `${(-(mean + z * std) * 100).toFixed(2)}%`;
      })(),
    },
    {
      id: 'cvar',
      name: 'Conditional VaR (CVaR)',
      category: 'Risk',
      categoryColor: CATEGORY_COLORS.Risk,
      description: 'Expected loss given that losses exceed VaR. Also called Expected Shortfall — answers "how bad is it when things go bad?"',
      formula: 'CVaR = -E[R | R ≤ -VaR]',
      formulaDesc: 'Average of all returns that fall below the VaR threshold. Always ≥ VaR.',
      whyItMatters: 'VaR only tells you the threshold; CVaR tells you what to expect beyond it. Preferred by risk managers because it is coherent and sub-additive.',
      exampleValue: (() => {
        const var5 = calcVaRHistoric(aaplReturns);
        const tail = aaplReturns.filter(r => r <= -var5);
        const cvar = tail.length > 0 ? -tail.reduce((a, b) => a + b, 0) / tail.length : 0;
        return `${(cvar * 100).toFixed(2)}%`;
      })(),
    },
    {
      id: 'max_drawdown',
      name: 'Maximum Drawdown',
      category: 'Risk',
      categoryColor: CATEGORY_COLORS.Risk,
      description: 'The largest peak-to-trough decline in portfolio value. Measures the worst-case loss from a historical high.',
      formula: 'MDD = min((V_t - V_peak) / V_peak)',
      formulaDesc: 'Where V_peak is the running maximum value up to time t. Expressed as a negative percentage.',
      whyItMatters: 'The most intuitive risk metric — "what is the most I could have lost?" Critical for investor psychology and fund survival.',
      exampleValue: `${(calcMaxDrawdown(aaplPrices) * 100).toFixed(2)}%`,
    },
    {
      id: 'skewness',
      name: 'Skewness',
      category: 'Distribution',
      categoryColor: CATEGORY_COLORS.Distribution,
      description: 'Measures asymmetry of the return distribution. Negative skew means more frequent large losses.',
      formula: 'S = E[(R - μ)³] / σ³',
      formulaDesc: 'Third standardized moment. S < 0 = left-skewed (fat left tail), S > 0 = right-skewed, S = 0 = symmetric.',
      whyItMatters: 'Most equity returns are negatively skewed — crashes are more common than equivalent surges. Used in Cornish-Fisher VaR.',
      exampleValue: calcSkewness(aaplReturns).toFixed(4),
    },
    {
      id: 'kurtosis',
      name: 'Kurtosis',
      category: 'Distribution',
      categoryColor: CATEGORY_COLORS.Distribution,
      description: 'Measures tail heaviness of the distribution. Higher kurtosis means more extreme events than a normal distribution.',
      formula: 'K = E[(R - μ)⁴] / σ⁴',
      formulaDesc: 'Fourth standardized moment. K = 3 for normal distribution (mesokurtic). K > 3 = fat tails (leptokurtic).',
      whyItMatters: 'Financial returns typically have K >> 3, meaning extreme events (crashes, spikes) occur more often than normal distribution predicts.',
      exampleValue: calcKurtosis(aaplReturns).toFixed(4),
    },
    {
      id: 'alpha',
      name: 'Alpha',
      category: 'Portfolio',
      categoryColor: CATEGORY_COLORS.Portfolio,
      description: 'Excess return of the portfolio over the risk-free rate. Measures absolute value added by active management.',
      formula: 'α = R_p - R_f',
      formulaDesc: 'Simple excess return. In CAPM: α = R_p - [R_f + β(R_m - R_f)] but TradePilot uses the simpler definition.',
      whyItMatters: 'Positive alpha means the strategy outperformed the risk-free benchmark. The holy grail of active management.',
      exampleValue: `${((annualizeReturns(aaplReturns) - 0.04) * 100).toFixed(2)}%`,
    },
    {
      id: 'momentum_metric',
      name: 'Momentum',
      category: 'Return',
      categoryColor: CATEGORY_COLORS.Return,
      description: 'Price difference over a lookback window. Used both as a metric and a ranking/selection criterion.',
      formula: 'M(i, t) = P(i, today) - P(i, today - t)',
      formulaDesc: 'Simple price-level momentum over t periods. Not returns-based — uses raw price difference.',
      whyItMatters: 'The backbone of momentum strategies. Positive momentum indicates upward trend; negative indicates downward pressure.',
      exampleValue: `$${(aaplPrices[aaplPrices.length - 1] - aaplPrices[aaplPrices.length - 21]).toFixed(2)}`,
    },
  ], [aaplReturns, aaplPrices]);

  const categories = ['All', 'Return', 'Risk', 'Distribution', 'Portfolio'];
  const filtered = filter === 'All' ? metrics : metrics.filter(m => m.category === filter);

  return (
    <div className="metrics-catalog">
      <nav className="breadcrumb">
        <a href="/catalog">Catalog</a><span className="sep">/</span><span>Metrics</span>
      </nav>

      <div className="mc-header">
        <h1>Risk & Performance Metrics</h1>
        <p>Every metric in TradePilot explained — with formulas, descriptions, and live calculations using AAPL sample data.</p>
      </div>

      {/* Category filter */}
      <div className="filter-bar">
        {categories.map(cat => (
          <button
            key={cat}
            className={`filter-btn ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
            style={cat !== 'All' ? { '--cat-color': CATEGORY_COLORS[cat] } as React.CSSProperties : undefined}
          >
            {cat} {cat !== 'All' && <span className="filter-count">({metrics.filter(m => m.category === cat).length})</span>}
          </button>
        ))}
      </div>

      <div className="metrics-grid">
        {filtered.map(metric => (
          <div key={metric.id} className="metric-card" style={{ '--metric-color': metric.categoryColor } as React.CSSProperties}>
            <div className="metric-top">
              <span className="category-badge" style={{ background: `color-mix(in srgb, ${metric.categoryColor} 15%, transparent)`, color: metric.categoryColor }}>
                {metric.category}
              </span>
              <div className="example-value">{metric.exampleValue}</div>
            </div>
            <h3>{metric.name}</h3>
            <p className="metric-desc">{metric.description}</p>

            <div className="metric-formula-box">
              <pre>{metric.formula}</pre>
              <p>{metric.formulaDesc}</p>
            </div>

            <div className="metric-why">
              <strong>Why it matters:</strong> {metric.whyItMatters}
            </div>
          </div>
        ))}
      </div>

      <div className="mc-footer">
        <p>Example values calculated from 252 days of generated AAPL sample data (risk-free rate: 4%)</p>
      </div>

      <style>{metricsStyles}</style>
    </div>
  );
}

const metricsStyles = `
  .metrics-catalog {
    max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem;
  }
  .breadcrumb {
    display: flex; align-items: center; gap: 0.5rem;
    font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.5rem;
  }
  .breadcrumb a { color: var(--accent); text-decoration: none; }
  .breadcrumb a:hover { text-decoration: underline; }
  .breadcrumb .sep { opacity: 0.5; }

  .mc-header { margin-bottom: 1.5rem; }
  .mc-header h1 { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.5rem; }
  .mc-header p { color: var(--text-muted); margin: 0; }

  .filter-bar {
    display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 2rem;
  }
  .filter-btn {
    padding: 0.375rem 0.875rem; border-radius: 99px; border: 1px solid var(--border);
    background: transparent; color: var(--text-muted); font-size: 0.8rem; font-weight: 500;
    cursor: pointer; transition: all 0.2s;
  }
  .filter-btn:hover { border-color: var(--text-secondary, var(--text-muted)); color: var(--text-primary); }
  .filter-btn.active {
    background: var(--accent); border-color: var(--accent); color: white;
  }
  .filter-count { opacity: 0.7; }

  .metrics-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.25rem;
  }

  .metric-card {
    background: var(--glass-bg, var(--bg-secondary));
    border: 1px solid var(--glass-border, var(--border));
    border-radius: 16px; padding: 1.5rem;
    transition: border-color 0.2s;
  }
  .metric-card:hover { border-color: var(--metric-color); }

  .metric-top {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;
  }
  .category-badge {
    display: inline-block; padding: 0.15rem 0.625rem; border-radius: 99px;
    font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
  }
  .example-value {
    font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.9rem;
    font-weight: 700; color: var(--text-primary);
  }

  .metric-card h3 {
    font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.5rem;
  }
  .metric-desc {
    font-size: 0.85rem; color: var(--text-secondary, var(--text-muted)); line-height: 1.5; margin: 0 0 1rem;
  }

  .metric-formula-box {
    background: var(--bg-tertiary, #1a1a2e); border: 1px solid var(--border);
    border-radius: 10px; padding: 0.875rem; margin-bottom: 0.875rem;
  }
  .metric-formula-box pre {
    font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.9rem;
    color: var(--accent); margin: 0 0 0.375rem; white-space: pre-wrap;
  }
  .metric-formula-box p {
    font-size: 0.75rem; color: var(--text-muted); margin: 0; line-height: 1.4;
  }

  .metric-why {
    font-size: 0.8rem; color: var(--text-secondary, var(--text-muted)); line-height: 1.5;
  }
  .metric-why strong { color: var(--text-primary); font-weight: 600; }

  .mc-footer { margin-top: 2rem; text-align: center; }
  .mc-footer p { font-size: 0.8rem; color: var(--text-muted); opacity: 0.7; }

  @media (max-width: 768px) {
    .metrics-catalog { padding: 1rem; }
    .metrics-grid { grid-template-columns: 1fr; }
  }
`;

export default MetricsCatalog;
