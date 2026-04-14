import { appPath } from '../../lib/utils/paths';
import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, Legend, AreaChart, Area,
  Cell,
} from 'recharts';
import {
  generateSamplePrices, generateSampleReturns, generateSampleBacktest,
  generateEfficientFrontier, computeCovMatrix, annualizeReturns,
  calcVaRHistoric, calcVaRGaussian, SAMPLE_STOCKS, STOCK_NAMES,
} from '../../lib/utils/sampleData';

const CHART_TOOLTIP_STYLE = {
  background: 'var(--bg-secondary, #1e1e2e)',
  border: '1px solid var(--border, #333)',
  borderRadius: '8px',
  color: 'var(--text-primary, #fff)',
  fontSize: '0.8rem',
};

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

interface VizInfo {
  id: string;
  title: string;
  pythonFunc: string;
  description: string;
  whenToUse: string;
  component: string;
}

const VIZ_INFO: VizInfo[] = [
  {
    id: 'portfolio-valuation', title: 'Portfolio Valuation', pythonFunc: 'plot_portfolio_valuation()',
    description: 'Line chart showing portfolio value over time with optional benchmark overlay. The core visualization for tracking overall portfolio performance.',
    whenToUse: 'Use after running a backtest to visualize the growth of your portfolio vs a benchmark like S&P 500.',
    component: 'PortfolioValuation',
  },
  {
    id: 'efficient-frontier', title: 'Efficient Frontier', pythonFunc: 'plot_efficient_frontier()',
    description: 'Scatter plot of the risk-return trade-off for all possible portfolio combinations. Shows MSR, GMV, and EW special portfolios.',
    whenToUse: 'Use when analyzing portfolio optimization to understand the range of achievable risk-return profiles.',
    component: 'EfficientFrontier',
  },
  {
    id: 'drawdown', title: 'Drawdown Chart', pythonFunc: 'plot_drawdown()',
    description: 'Shows the percentage decline from historical peaks. Helps identify the worst loss periods and recovery times.',
    whenToUse: 'Use to assess downside risk and understand the pain experienced by investors during market downturns.',
    component: 'DrawdownChart',
  },
  {
    id: 'returns-dist', title: 'Returns Distribution', pythonFunc: 'plot_returns_distribution()',
    description: 'Histogram of daily returns with a normal distribution overlay. Reveals skewness, fat tails, and non-normality.',
    whenToUse: 'Use to check if returns are normally distributed and to identify tail risk not captured by standard metrics.',
    component: 'ReturnsDistribution',
  },
  {
    id: 'risk-metrics', title: 'Risk Metrics', pythonFunc: 'plot_risk_metrics()',
    description: 'Grouped bar chart comparing Historic VaR, Gaussian VaR, and CVaR across multiple assets.',
    whenToUse: 'Use to compare risk levels across assets in your portfolio and identify which carry the most tail risk.',
    component: 'RiskMetrics',
  },
  {
    id: 'strategy-comparison', title: 'Strategy Comparison', pythonFunc: 'plot_strategy_comparison()',
    description: 'Overlaid line charts comparing portfolio valuations from multiple strategy backtests.',
    whenToUse: 'Use when evaluating which strategy performs best over a given time period.',
    component: 'StrategyComparison',
  },
  {
    id: 'allocation', title: 'Allocation Timeline', pythonFunc: 'plot_allocation_over_time()',
    description: 'Animated/stacked bar chart showing how portfolio composition changes at each rebalancing date.',
    whenToUse: 'Use to understand how the optimizer shifts weights between assets over time as market conditions change.',
    component: 'AllocationTimeline',
  },
  {
    id: 'momentum', title: 'Momentum Chart', pythonFunc: 'plot_momentum()',
    description: 'Line chart of rolling momentum (price - lagged price) for each asset over time.',
    whenToUse: 'Use to visualize momentum trends and identify assets gaining or losing relative strength.',
    component: 'MomentumChart',
  },
];

export function VisualizationCatalog() {
  const { dates, prices } = useMemo(() => generateSamplePrices(), []);
  const returns = useMemo(() => generateSampleReturns(prices), [prices]);
  const backtest = useMemo(() => generateSampleBacktest(), []);

  // Chart 1: Portfolio Valuation
  const valuationData = useMemo(() =>
    backtest.dates.map((d, i) => ({
      date: d.slice(5), // MM-DD
      portfolio: Math.round(backtest.portfolioValues[i]),
      benchmark: Math.round(backtest.benchmarkValues[i]),
    })), [backtest]);

  // Chart 2: Efficient Frontier
  const frontierData = useMemo(() => {
    const { matrix } = computeCovMatrix(returns);
    const er = SAMPLE_STOCKS.map(s => annualizeReturns(returns[s]));
    return generateEfficientFrontier(er, matrix, 40);
  }, [returns]);

  // Chart 3: Drawdown
  const drawdownData = useMemo(() => {
    const p = backtest.portfolioValues;
    let peak = p[0];
    return backtest.dates.map((d, i) => {
      if (p[i] > peak) peak = p[i];
      return { date: d.slice(5), drawdown: ((p[i] - peak) / peak) * 100 };
    });
  }, [backtest]);

  // Chart 4: Returns Distribution (histogram buckets)
  const histData = useMemo(() => {
    const r = returns['AAPL'];
    const min = Math.min(...r), max = Math.max(...r);
    const nBins = 30;
    const binWidth = (max - min) / nBins;
    const bins = Array.from({ length: nBins }, (_, i) => ({
      range: ((min + i * binWidth) * 100).toFixed(1),
      count: 0,
      x: min + (i + 0.5) * binWidth,
    }));
    for (const v of r) {
      const idx = Math.min(Math.floor((v - min) / binWidth), nBins - 1);
      bins[idx].count++;
    }
    return bins;
  }, [returns]);

  // Chart 5: Risk Metrics bars
  const riskBarsData = useMemo(() =>
    SAMPLE_STOCKS.map(sym => ({
      symbol: sym,
      'Historic VaR': +(calcVaRHistoric(returns[sym]) * 100).toFixed(2),
      'Gaussian VaR': +(calcVaRGaussian(returns[sym]) * 100).toFixed(2),
    })), [returns]);

  // Chart 6: Strategy Comparison - 3 mock strategies
  const stratCompData = useMemo(() => {
    const bt1 = generateSampleBacktest(42);
    const bt2 = generateSampleBacktest(99);
    const bt3 = generateSampleBacktest(7);
    return bt1.dates.map((d, i) => ({
      date: d.slice(5),
      Momentum: Math.round(bt1.portfolioValues[i]),
      'Mean Rev': Math.round(bt2.portfolioValues[i]),
      'Smart Beta': Math.round(bt3.portfolioValues[i]),
    }));
  }, []);

  // Chart 7: Allocation over time - stacked bars for 4 dates
  const allocData = useMemo(() => {
    const rebalDates = [0, 63, 126, 189].map(i => dates[Math.min(i, dates.length - 1)]);
    return rebalDates.map(d => {
      const weights: Record<string, number> = {};
      let total = 0;
      SAMPLE_STOCKS.forEach((sym, idx) => {
        const w = 15 + Math.sin(idx + rebalDates.indexOf(d)) * 8;
        weights[sym] = w;
        total += w;
      });
      // normalize to 100
      const entry: any = { date: d.slice(5) };
      SAMPLE_STOCKS.forEach(sym => { entry[sym] = +((weights[sym] / total) * 100).toFixed(1); });
      return entry;
    });
  }, [dates]);

  // Chart 8: Momentum over time
  const momentumData = useMemo(() => {
    const t = 20;
    const result: any[] = [];
    for (let i = t; i < dates.length; i += 5) {
      const entry: any = { date: dates[i].slice(5) };
      for (const sym of SAMPLE_STOCKS.slice(0, 3)) {
        entry[sym] = +(prices[sym][i] - prices[sym][i - t]).toFixed(2);
      }
      result.push(entry);
    }
    return result;
  }, [dates, prices]);

  // Map viz id to chart render
  const chartRenderers: Record<string, () => JSX.Element> = {
    'portfolio-valuation': () => (
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={valuationData}>
          <XAxis dataKey="date" tick={false} stroke="var(--text-muted)" />
          <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          <Legend />
          <Line type="monotone" dataKey="portfolio" stroke="#3b82f6" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="benchmark" stroke="#6b7280" dot={false} strokeWidth={1} strokeDasharray="4 4" />
        </LineChart>
      </ResponsiveContainer>
    ),
    'efficient-frontier': () => (
      <ResponsiveContainer width="100%" height={250}>
        <ScatterChart>
          <XAxis type="number" dataKey="volatility" tickFormatter={(v: number) => `${(v*100).toFixed(0)}%`} stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <YAxis type="number" dataKey="expectedReturn" tickFormatter={(v: number) => `${(v*100).toFixed(0)}%`} stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          <Scatter data={frontierData} fill="#3b82f6" r={3} />
        </ScatterChart>
      </ResponsiveContainer>
    ),
    'drawdown': () => (
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={drawdownData}>
          <XAxis dataKey="date" tick={false} stroke="var(--text-muted)" />
          <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number) => [`${v.toFixed(2)}%`, 'Drawdown']} />
          <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fill="rgba(239,68,68,0.15)" />
        </AreaChart>
      </ResponsiveContainer>
    ),
    'returns-dist': () => (
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={histData}>
          <XAxis dataKey="range" tick={false} stroke="var(--text-muted)" />
          <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number) => [v, 'Count']} />
          <Bar dataKey="count" fill="#8b5cf6" radius={[2, 2, 0, 0]}>
            {histData.map((_, i) => <Cell key={i} fill={histData[i].x < 0 ? '#ef4444' : '#22c55e'} opacity={0.7} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    ),
    'risk-metrics': () => (
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={riskBarsData}>
          <XAxis dataKey="symbol" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
          <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          <Legend />
          <Bar dataKey="Historic VaR" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Gaussian VaR" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    ),
    'strategy-comparison': () => (
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={stratCompData}>
          <XAxis dataKey="date" tick={false} stroke="var(--text-muted)" />
          <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          <Legend />
          <Line type="monotone" dataKey="Momentum" stroke="#3b82f6" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="Mean Rev" stroke="#22c55e" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="Smart Beta" stroke="#f59e0b" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    ),
    'allocation': () => (
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={allocData}>
          <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
          <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          <Legend />
          {SAMPLE_STOCKS.map((sym, i) => (
            <Bar key={sym} dataKey={sym} stackId="a" fill={COLORS[i]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    ),
    'momentum': () => (
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={momentumData}>
          <XAxis dataKey="date" tick={false} stroke="var(--text-muted)" />
          <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          <Legend />
          {SAMPLE_STOCKS.slice(0, 3).map((sym, i) => (
            <Line key={sym} type="monotone" dataKey={sym} stroke={COLORS[i]} dot={false} strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    ),
  };

  return (
    <div className="viz-catalog">
      <nav className="breadcrumb">
        <a href={appPath("/catalog")}>Catalog</a><span className="sep">/</span><span>Visualizations</span>
      </nav>

      <div className="vc-header">
        <h1>Visualization Gallery</h1>
        <p>All 8 analytics chart types with live demos using generated sample data.</p>
      </div>

      <div className="viz-grid">
        {VIZ_INFO.map(viz => (
          <div key={viz.id} className="viz-card">
            <div className="viz-chart-area">
              {chartRenderers[viz.id]?.()}
            </div>
            <div className="viz-info">
              <div className="viz-title-row">
                <h3>{viz.title}</h3>
                <code className="viz-func">{viz.pythonFunc}</code>
              </div>
              <p className="viz-desc">{viz.description}</p>
              <p className="viz-use"><strong>When to use:</strong> {viz.whenToUse}</p>
              <div className="viz-component-tag">React: <code>{viz.component}</code></div>
            </div>
          </div>
        ))}
      </div>

      <style>{vizStyles}</style>
    </div>
  );
}

const vizStyles = `
  .viz-catalog { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }

  .breadcrumb {
    display: flex; align-items: center; gap: 0.5rem;
    font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.5rem;
  }
  .breadcrumb a { color: var(--accent); text-decoration: none; }
  .breadcrumb a:hover { text-decoration: underline; }
  .breadcrumb .sep { opacity: 0.5; }

  .vc-header { margin-bottom: 2rem; }
  .vc-header h1 { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.5rem; }
  .vc-header p { color: var(--text-muted); margin: 0; }

  .viz-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(500px, 1fr)); gap: 1.5rem;
  }

  .viz-card {
    background: var(--glass-bg, var(--bg-secondary));
    border: 1px solid var(--glass-border, var(--border));
    border-radius: 16px; overflow: hidden;
    transition: border-color 0.2s, transform 0.2s;
  }
  .viz-card:hover { border-color: var(--accent); transform: translateY(-2px); }

  .viz-chart-area {
    background: var(--bg-tertiary, #1a1a2e);
    padding: 1rem 0.5rem 0.5rem;
    border-bottom: 1px solid var(--border);
  }

  .viz-info { padding: 1.25rem; }

  .viz-title-row {
    display: flex; justify-content: space-between; align-items: center;
    gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap;
  }
  .viz-title-row h3 { font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0; }
  .viz-func {
    font-size: 0.7rem; background: var(--bg-tertiary, #1a1a2e);
    padding: 0.2rem 0.5rem; border-radius: 4px; color: var(--accent);
  }

  .viz-desc { font-size: 0.85rem; color: var(--text-secondary, var(--text-muted)); line-height: 1.5; margin: 0 0 0.5rem; }
  .viz-use { font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; margin: 0 0 0.5rem; }
  .viz-use strong { color: var(--text-primary); }

  .viz-component-tag {
    font-size: 0.75rem; color: var(--text-muted);
  }
  .viz-component-tag code {
    background: var(--bg-tertiary, #1a1a2e); padding: 0.1rem 0.375rem;
    border-radius: 4px; color: var(--accent); font-size: 0.75rem;
  }

  @media (max-width: 768px) {
    .viz-catalog { padding: 1rem; }
    .viz-grid { grid-template-columns: 1fr; }
  }
`;

export default VisualizationCatalog;
