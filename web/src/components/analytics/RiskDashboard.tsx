/**
 * RiskDashboard Component
 *
 * Displays portfolio risk analytics including:
 * - Portfolio risk metrics (VaR, Volatility, Sharpe, Beta, Alpha, Max Drawdown)
 * - Position-level risk breakdown
 * - Correlation matrix heatmap
 * - Stress test scenarios
 *
 * Supports three analysis modes:
 * - Full Portfolio: Analyze all holdings
 * - Custom Selection: Analyze a subset of holdings
 * - Research: Analyze any assets (not owned)
 */

import { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '../../lib/firebase';
import {
  calculateRiskMetrics,
  runStressTests,
  STANDARD_STRESS_SCENARIOS,
  type RiskMetrics,
  type PositionRisk,
  type StressTestResult,
  type Position,
  type PriceHistory,
} from '../../lib/services/risk-analytics';

// Analysis modes
type AnalysisMode = 'portfolio' | 'custom' | 'research';

// Mock data for development - User's portfolio
const MOCK_POSITIONS: Position[] = [
  { symbol: 'AAPL', qty: 50, marketValue: 9271, costBasis: 7500, unrealizedPl: 1771, currentPrice: 185.42 },
  { symbol: 'MSFT', qty: 30, marketValue: 11367, costBasis: 8400, unrealizedPl: 2967, currentPrice: 378.91 },
  { symbol: 'NVDA', qty: 15, marketValue: 10819, costBasis: 6750, unrealizedPl: 4069, currentPrice: 721.28 },
  { symbol: 'GOOGL', qty: 20, marketValue: 2836, costBasis: 2400, unrealizedPl: 436, currentPrice: 141.80 },
  { symbol: 'TSLA', qty: 25, marketValue: 6212, costBasis: 5000, unrealizedPl: 1212, currentPrice: 248.50 },
];

const MOCK_PRICE_HISTORIES: PriceHistory[] = [
  { symbol: 'AAPL', prices: [175, 178, 180, 182, 185, 183, 185], dates: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-06', '2024-01-07'] },
  { symbol: 'MSFT', prices: [360, 365, 370, 375, 378, 376, 379], dates: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-06', '2024-01-07'] },
  { symbol: 'NVDA', prices: [680, 695, 710, 720, 725, 718, 721], dates: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-06', '2024-01-07'] },
  { symbol: 'GOOGL', prices: [135, 137, 139, 140, 142, 141, 142], dates: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-06', '2024-01-07'] },
  { symbol: 'TSLA', prices: [240, 245, 248, 252, 250, 248, 249], dates: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-06', '2024-01-07'] },
];

// Additional research assets (not owned)
const RESEARCH_ASSETS_DATA: Record<string, { price: number; volatility: number; beta: number; priceHistory: number[] }> = {
  'AMZN': { price: 178.25, volatility: 0.32, beta: 1.22, priceHistory: [165, 168, 172, 175, 177, 176, 178] },
  'META': { price: 505.75, volatility: 0.38, beta: 1.35, priceHistory: [470, 480, 490, 498, 505, 502, 506] },
  'AMD': { price: 142.50, volatility: 0.48, beta: 1.65, priceHistory: [125, 130, 135, 140, 145, 142, 143] },
  'NFLX': { price: 628.90, volatility: 0.35, beta: 1.18, priceHistory: [590, 600, 610, 620, 625, 622, 629] },
  'CRM': { price: 272.40, volatility: 0.33, beta: 1.15, priceHistory: [255, 260, 265, 270, 272, 270, 272] },
  'ORCL': { price: 125.80, volatility: 0.28, beta: 0.95, priceHistory: [118, 120, 122, 124, 125, 124, 126] },
  'INTC': { price: 31.25, volatility: 0.42, beta: 1.08, priceHistory: [28, 29, 30, 31, 32, 31, 31] },
  'IBM': { price: 193.50, volatility: 0.22, beta: 0.72, priceHistory: [185, 187, 189, 191, 193, 192, 194] },
  'PYPL': { price: 63.80, volatility: 0.45, beta: 1.42, priceHistory: [58, 60, 62, 64, 65, 63, 64] },
  'SHOP': { price: 78.90, volatility: 0.52, beta: 1.75, priceHistory: [68, 72, 75, 78, 80, 78, 79] },
  'SQ': { price: 71.25, volatility: 0.50, beta: 1.68, priceHistory: [62, 65, 68, 70, 72, 71, 71] },
  'UBER': { price: 65.40, volatility: 0.40, beta: 1.25, priceHistory: [58, 60, 62, 64, 66, 65, 65] },
  'COIN': { price: 225.60, volatility: 0.72, beta: 2.15, priceHistory: [180, 195, 210, 220, 230, 225, 226] },
  'PLTR': { price: 24.80, volatility: 0.55, beta: 1.45, priceHistory: [20, 21, 23, 24, 25, 24, 25] },
  'SNOW': { price: 165.30, volatility: 0.48, beta: 1.38, priceHistory: [150, 155, 160, 165, 168, 164, 165] },
};

// Generate mock metrics for any set of positions
function generateMockMetrics(positions: Position[]): RiskMetrics {
  const totalValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const symbols = positions.map(p => p.symbol);

  // Generate correlation matrix
  const correlationMatrix: Record<string, Record<string, number>> = {};
  symbols.forEach(sym1 => {
    correlationMatrix[sym1] = {};
    symbols.forEach(sym2 => {
      if (sym1 === sym2) {
        correlationMatrix[sym1][sym2] = 1;
      } else {
        // Generate semi-realistic correlations (tech stocks correlate more)
        const isTech1 = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'AMZN', 'AMD', 'NFLX', 'CRM'].includes(sym1);
        const isTech2 = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'AMZN', 'AMD', 'NFLX', 'CRM'].includes(sym2);
        const baseCorr = isTech1 && isTech2 ? 0.65 : 0.35;
        const randomFactor = (Math.random() - 0.5) * 0.3;
        correlationMatrix[sym1][sym2] = Math.max(-0.5, Math.min(0.95, baseCorr + randomFactor));
      }
    });
  });

  // Make symmetric
  symbols.forEach(sym1 => {
    symbols.forEach(sym2 => {
      if (sym1 !== sym2) {
        const avg = (correlationMatrix[sym1][sym2] + correlationMatrix[sym2][sym1]) / 2;
        correlationMatrix[sym1][sym2] = Number(avg.toFixed(2));
        correlationMatrix[sym2][sym1] = Number(avg.toFixed(2));
      }
    });
  });

  // Generate position risks
  const positionRisks: PositionRisk[] = positions.map(pos => {
    const weight = pos.marketValue / totalValue;
    const researchData = RESEARCH_ASSETS_DATA[pos.symbol];
    const volatility = researchData?.volatility || (0.2 + Math.random() * 0.3);
    const beta = researchData?.beta || (0.8 + Math.random() * 0.8);
    const individualVaR = pos.marketValue * volatility * 1.645 * Math.sqrt(1/252);
    const componentVaR = individualVaR * weight;

    return {
      symbol: pos.symbol,
      weight,
      volatility,
      beta,
      individualVaR: Math.round(individualVaR),
      marginalVaR: Math.round(componentVaR),
      componentVaR: Math.round(componentVaR),
    };
  });

  // Calculate portfolio-level metrics
  const avgVolatility = positionRisks.reduce((sum, p) => sum + p.volatility * p.weight, 0);
  const avgBeta = positionRisks.reduce((sum, p) => sum + p.beta * p.weight, 0);
  const portfolioVaR = positionRisks.reduce((sum, p) => sum + p.componentVaR, 0) * 1.2; // Diversification adjustment

  return {
    portfolioVaR,
    portfolioVaRPercent: (portfolioVaR / totalValue) * 100,
    portfolioVolatility: avgVolatility,
    sharpeRatio: 0.8 + Math.random() * 0.8,
    beta: avgBeta,
    alpha: (Math.random() - 0.3) * 0.1,
    maxDrawdown: 0.05 + Math.random() * 0.1,
    correlationMatrix,
    positionRisks,
  };
}

// Popular tickers for research suggestions
const POPULAR_RESEARCH_TICKERS = ['AMZN', 'META', 'AMD', 'NFLX', 'CRM', 'ORCL', 'INTC', 'IBM', 'PYPL', 'SHOP', 'SQ', 'UBER', 'COIN', 'PLTR', 'SNOW'];

interface RiskDashboardProps {
  useMockData?: boolean;
}

export function RiskDashboard({ useMockData = true }: RiskDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null);
  const [stressResults, setStressResults] = useState<StressTestResult[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Analysis mode state
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('portfolio');
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set(MOCK_POSITIONS.map(p => p.symbol)));
  const [researchTickers, setResearchTickers] = useState<string[]>(['AMZN', 'META', 'AMD']);
  const [newTicker, setNewTicker] = useState('');
  const [researchAllocation, setResearchAllocation] = useState<Record<string, number>>({
    'AMZN': 10000,
    'META': 10000,
    'AMD': 10000,
  });

  // Get positions based on analysis mode
  const activePositions = useMemo(() => {
    switch (analysisMode) {
      case 'portfolio':
        return MOCK_POSITIONS;
      case 'custom':
        return MOCK_POSITIONS.filter(p => selectedPositions.has(p.symbol));
      case 'research':
        return researchTickers.map(symbol => {
          const data = RESEARCH_ASSETS_DATA[symbol];
          const allocation = researchAllocation[symbol] || 10000;
          if (data) {
            return {
              symbol,
              qty: Math.round(allocation / data.price),
              marketValue: allocation,
              costBasis: allocation,
              unrealizedPl: 0,
              currentPrice: data.price,
            };
          }
          // Fallback for unknown tickers
          return {
            symbol,
            qty: 100,
            marketValue: allocation,
            costBasis: allocation,
            unrealizedPl: 0,
            currentPrice: allocation / 100,
          };
        });
      default:
        return MOCK_POSITIONS;
    }
  }, [analysisMode, selectedPositions, researchTickers, researchAllocation]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      if (useMockData) {
        loadData();
      }
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, [useMockData]);

  useEffect(() => {
    loadData();
  }, [userId, useMockData, activePositions]);

  async function loadData() {
    if (activePositions.length === 0) {
      setMetrics(null);
      setStressResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const generatedMetrics = generateMockMetrics(activePositions);
      setMetrics(generatedMetrics);

      const stressTests = runStressTests(activePositions, STANDARD_STRESS_SCENARIOS);
      setStressResults(stressTests);
    } catch (err) {
      console.error('Failed to load risk data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load risk data');
    } finally {
      setLoading(false);
    }
  }

  // Toggle position selection for custom mode
  const togglePosition = (symbol: string) => {
    setSelectedPositions(prev => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return next;
    });
  };

  // Add research ticker
  const addResearchTicker = () => {
    const ticker = newTicker.toUpperCase().trim();
    if (ticker && !researchTickers.includes(ticker)) {
      setResearchTickers([...researchTickers, ticker]);
      setResearchAllocation(prev => ({ ...prev, [ticker]: 10000 }));
      setNewTicker('');
    }
  };

  // Remove research ticker
  const removeResearchTicker = (ticker: string) => {
    setResearchTickers(researchTickers.filter(t => t !== ticker));
    setResearchAllocation(prev => {
      const next = { ...prev };
      delete next[ticker];
      return next;
    });
  };

  // Update research allocation
  const updateAllocation = (ticker: string, value: number) => {
    setResearchAllocation(prev => ({ ...prev, [ticker]: value }));
  };

  if (loading) {
    return (
      <div className="risk-dashboard risk-dashboard--loading">
        <div className="loading-spinner"></div>
        <p>Calculating risk metrics...</p>
        <style>{styles}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="risk-dashboard risk-dashboard--error">
        <div className="error-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <button onClick={loadData} className="btn btn-primary">
          Retry
        </button>
        <style>{styles}</style>
      </div>
    );
  }

  const symbols = metrics ? Object.keys(metrics.correlationMatrix) : [];
  const totalValue = activePositions.reduce((sum, p) => sum + p.marketValue, 0);

  return (
    <div className="risk-dashboard" data-testid="risk-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Risk Analytics</h1>
          <p>
            {analysisMode === 'portfolio' && 'Full portfolio risk metrics and stress testing'}
            {analysisMode === 'custom' && `Analyzing ${selectedPositions.size} selected positions`}
            {analysisMode === 'research' && `Research mode: ${researchTickers.length} assets`}
          </p>
        </div>
        <button onClick={loadData} className="btn btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Analysis Mode Selector */}
      <div className="mode-selector">
        <div className="mode-tabs">
          <button
            className={`mode-tab ${analysisMode === 'portfolio' ? 'active' : ''}`}
            onClick={() => setAnalysisMode('portfolio')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
            </svg>
            My Portfolio
          </button>
          <button
            className={`mode-tab ${analysisMode === 'custom' ? 'active' : ''}`}
            onClick={() => setAnalysisMode('custom')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" />
              <path d="M7 12h10" />
              <path d="M10 18h4" />
            </svg>
            Custom Selection
          </button>
          <button
            className={`mode-tab ${analysisMode === 'research' ? 'active' : ''}`}
            onClick={() => setAnalysisMode('research')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            Research
          </button>
        </div>

        {/* Custom Selection Panel */}
        {analysisMode === 'custom' && (
          <div className="selection-panel">
            <h3>Select positions to analyze:</h3>
            <div className="position-chips">
              {MOCK_POSITIONS.map(pos => (
                <button
                  key={pos.symbol}
                  className={`position-chip ${selectedPositions.has(pos.symbol) ? 'selected' : ''}`}
                  onClick={() => togglePosition(pos.symbol)}
                >
                  <span className="chip-symbol">{pos.symbol}</span>
                  <span className="chip-value">${pos.marketValue.toLocaleString()}</span>
                  {selectedPositions.has(pos.symbol) && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="selection-summary">
              <span>{selectedPositions.size} positions selected</span>
              <span className="divider">•</span>
              <span>Total: ${MOCK_POSITIONS.filter(p => selectedPositions.has(p.symbol)).reduce((sum, p) => sum + p.marketValue, 0).toLocaleString()}</span>
              <button className="link-btn" onClick={() => setSelectedPositions(new Set(MOCK_POSITIONS.map(p => p.symbol)))}>Select All</button>
              <button className="link-btn" onClick={() => setSelectedPositions(new Set())}>Clear</button>
            </div>
          </div>
        )}

        {/* Research Panel */}
        {analysisMode === 'research' && (
          <div className="research-panel">
            <h3>Research any assets:</h3>
            <div className="ticker-input-row">
              <input
                type="text"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && addResearchTicker()}
                placeholder="Enter ticker symbol..."
                className="ticker-input"
              />
              <button onClick={addResearchTicker} className="btn btn-primary btn-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add
              </button>
            </div>

            <div className="popular-tickers">
              <span className="label">Popular:</span>
              {POPULAR_RESEARCH_TICKERS.filter(t => !researchTickers.includes(t)).slice(0, 8).map(ticker => (
                <button
                  key={ticker}
                  className="quick-add-btn"
                  onClick={() => {
                    setResearchTickers([...researchTickers, ticker]);
                    setResearchAllocation(prev => ({ ...prev, [ticker]: 10000 }));
                  }}
                >
                  +{ticker}
                </button>
              ))}
            </div>

            <div className="research-assets">
              {researchTickers.map(ticker => (
                <div key={ticker} className="research-asset-row">
                  <div className="asset-info">
                    <span className="asset-symbol">{ticker}</span>
                    <span className="asset-price">
                      ${RESEARCH_ASSETS_DATA[ticker]?.price.toFixed(2) || '—'}
                    </span>
                  </div>
                  <div className="asset-allocation">
                    <label>Allocation:</label>
                    <input
                      type="number"
                      value={researchAllocation[ticker] || 10000}
                      onChange={(e) => updateAllocation(ticker, Number(e.target.value))}
                      className="allocation-input"
                      min="1000"
                      step="1000"
                    />
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => removeResearchTicker(ticker)}
                    aria-label={`Remove ${ticker}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="research-summary">
              <span>Total hypothetical investment: ${Object.values(researchAllocation).reduce((sum, v) => sum + v, 0).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* No positions selected message */}
      {activePositions.length === 0 && !loading && (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3>No Assets Selected</h3>
          <p>
            {analysisMode === 'custom' && 'Select at least one position from your portfolio to analyze.'}
            {analysisMode === 'research' && 'Add at least one ticker symbol to analyze.'}
          </p>
        </div>
      )}

      {/* Loading and Error states */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Calculating risk metrics...</p>
        </div>
      )}

      {/* Risk Metrics - only show when we have data */}
      {metrics && !loading && (
        <>
      {/* Risk Metrics Cards */}
      <section className="metrics-section">
        <h2>Portfolio Risk Metrics</h2>
        <div className="metrics-grid">
          <MetricCard
            title="Value at Risk (95%)"
            value={`$${metrics.portfolioVaR.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            subtitle={`${metrics.portfolioVaRPercent.toFixed(2)}% of portfolio`}
            tooltip="Maximum expected loss at 95% confidence over one day"
            negative
          />
          <MetricCard
            title="Volatility"
            value={`${(metrics.portfolioVolatility * 100).toFixed(1)}%`}
            subtitle="Annualized"
            tooltip="Standard deviation of returns, annualized"
          />
          <MetricCard
            title="Sharpe Ratio"
            value={metrics.sharpeRatio.toFixed(2)}
            subtitle={metrics.sharpeRatio >= 1 ? 'Good' : metrics.sharpeRatio >= 0.5 ? 'Average' : 'Poor'}
            tooltip="Risk-adjusted return (return - risk-free rate) / volatility"
            positive={metrics.sharpeRatio >= 1}
          />
          <MetricCard
            title="Beta"
            value={metrics.beta.toFixed(2)}
            subtitle={metrics.beta > 1 ? 'More volatile than market' : 'Less volatile than market'}
            tooltip="Sensitivity to market movements"
          />
          <MetricCard
            title="Alpha"
            value={`${(metrics.alpha * 100).toFixed(2)}%`}
            subtitle="Excess return"
            tooltip="Return above/below expected given beta"
            positive={metrics.alpha > 0}
            negative={metrics.alpha < 0}
          />
          <MetricCard
            title="Max Drawdown"
            value={`${(metrics.maxDrawdown * 100).toFixed(1)}%`}
            subtitle="Peak to trough"
            tooltip="Largest decline from peak value"
            negative
          />
        </div>
      </section>

      {/* Position Risk Table */}
      <section className="position-risk-section">
        <h2>Position Risk Breakdown</h2>
        <div className="table-container">
          <table className="risk-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Weight</th>
                <th>Volatility</th>
                <th>Beta</th>
                <th>Individual VaR</th>
                <th>Component VaR</th>
              </tr>
            </thead>
            <tbody>
              {metrics.positionRisks.map((pos) => (
                <tr key={pos.symbol}>
                  <td className="symbol">{pos.symbol}</td>
                  <td>{(pos.weight * 100).toFixed(1)}%</td>
                  <td>{(pos.volatility * 100).toFixed(1)}%</td>
                  <td className={pos.beta > 1.2 ? 'high-beta' : ''}>{pos.beta.toFixed(2)}</td>
                  <td>${pos.individualVaR.toLocaleString()}</td>
                  <td>${pos.componentVaR.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Correlation Matrix */}
      <section className="correlation-section">
        <h2>Correlation Matrix</h2>
        <p className="section-description">Asset return correlations (higher = move together)</p>
        <div className="correlation-matrix">
          <div className="matrix-header">
            <div className="cell corner"></div>
            {symbols.map((sym) => (
              <div key={sym} className="cell header">{sym}</div>
            ))}
          </div>
          {symbols.map((rowSym) => (
            <div key={rowSym} className="matrix-row">
              <div className="cell header">{rowSym}</div>
              {symbols.map((colSym) => {
                const corr = metrics.correlationMatrix[rowSym][colSym];
                return (
                  <div
                    key={colSym}
                    className="cell value"
                    style={{ backgroundColor: getCorrelationColor(corr) }}
                    title={`${rowSym} / ${colSym}: ${corr.toFixed(2)}`}
                  >
                    {corr.toFixed(2)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="correlation-legend">
          <span>-1.0</span>
          <div className="legend-gradient"></div>
          <span>+1.0</span>
        </div>
      </section>

      {/* Stress Tests */}
      <section className="stress-test-section">
        <h2>Stress Test Scenarios</h2>
        <p className="section-description">Impact of market scenarios on your portfolio</p>
        <div className="table-container">
          <table className="stress-table">
            <thead>
              <tr>
                <th>Scenario</th>
                <th>Description</th>
                <th>Portfolio Impact</th>
                <th>Impact %</th>
              </tr>
            </thead>
            <tbody>
              {stressResults.map((result) => (
                <tr key={result.scenario} className={result.portfolioImpact < 0 ? 'negative' : 'positive'}>
                  <td className="scenario-name">{result.scenario}</td>
                  <td className="scenario-desc">{result.description}</td>
                  <td className={result.portfolioImpact < 0 ? 'loss' : 'gain'}>
                    {result.portfolioImpact < 0 ? '-' : '+'}${Math.abs(result.portfolioImpact).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className={result.portfolioImpactPercent < 0 ? 'loss' : 'gain'}>
                    {result.portfolioImpactPercent.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
        </>
      )}

      <style>{styles}</style>
    </div>
  );
}

// Helper component for metric cards
function MetricCard({
  title,
  value,
  subtitle,
  tooltip,
  positive,
  negative,
}: {
  title: string;
  value: string;
  subtitle: string;
  tooltip: string;
  positive?: boolean;
  negative?: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={`metric-card ${positive ? 'positive' : ''} ${negative ? 'negative' : ''}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        <button className="info-btn" aria-label="More info">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </button>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-subtitle">{subtitle}</div>
      {showTooltip && <div className="metric-tooltip">{tooltip}</div>}
    </div>
  );
}

// Helper function for correlation color
function getCorrelationColor(corr: number): string {
  if (corr === 1) return 'var(--bg-tertiary)';
  const intensity = Math.abs(corr);
  if (corr > 0) {
    return `rgba(34, 197, 94, ${intensity * 0.6})`;
  } else {
    return `rgba(239, 68, 68, ${intensity * 0.6})`;
  }
}

const styles = `
  .risk-dashboard {
    max-width: 1400px;
    margin: 0 auto;
    padding: var(--space-6, 1.5rem);
  }

  .risk-dashboard--loading,
  .risk-dashboard--error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    text-align: center;
    color: var(--text-muted);
    gap: var(--space-4, 1rem);
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-icon {
    color: var(--negative);
  }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-8, 2rem);
    gap: var(--space-4, 1rem);
  }

  .dashboard-header h1 {
    font-size: var(--text-2xl, 1.5rem);
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 var(--space-2, 0.5rem) 0;
  }

  .dashboard-header p {
    color: var(--text-muted);
    margin: 0;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2, 0.5rem);
    padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
    font-size: var(--text-sm, 0.875rem);
    font-weight: 500;
    border: none;
    border-radius: var(--radius-lg, 12px);
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: var(--accent);
    color: white;
  }

  .btn-primary:hover {
    background: var(--accent-hover);
  }

  .btn-secondary {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
  }

  .btn-sm {
    padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
    font-size: var(--text-xs, 0.75rem);
  }

  /* Mode Selector */
  .mode-selector {
    margin-bottom: var(--space-6, 1.5rem);
  }

  .mode-tabs {
    display: flex;
    gap: var(--space-2, 0.5rem);
    background: var(--bg-secondary);
    padding: var(--space-1, 0.25rem);
    border-radius: var(--radius-xl, 16px);
    width: fit-content;
    margin-bottom: var(--space-4, 1rem);
  }

  .mode-tab {
    display: flex;
    align-items: center;
    gap: var(--space-2, 0.5rem);
    padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
    background: transparent;
    border: none;
    border-radius: var(--radius-lg, 12px);
    color: var(--text-muted);
    font-size: var(--text-sm, 0.875rem);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .mode-tab:hover {
    color: var(--text-primary);
    background: var(--bg-hover);
  }

  .mode-tab.active {
    background: var(--accent);
    color: white;
  }

  /* Selection Panel */
  .selection-panel,
  .research-panel {
    background: var(--glass-bg, var(--bg-secondary));
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border, var(--border));
    border-radius: var(--radius-xl, 16px);
    padding: var(--space-5, 1.25rem);
    margin-bottom: var(--space-4, 1rem);
  }

  .selection-panel h3,
  .research-panel h3 {
    font-size: var(--text-sm, 0.875rem);
    font-weight: 600;
    color: var(--text-secondary);
    margin: 0 0 var(--space-3, 0.75rem) 0;
  }

  .position-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2, 0.5rem);
    margin-bottom: var(--space-3, 0.75rem);
  }

  .position-chip {
    display: flex;
    align-items: center;
    gap: var(--space-2, 0.5rem);
    padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    border-radius: var(--radius-full, 9999px);
    cursor: pointer;
    transition: all 0.2s;
  }

  .position-chip:hover {
    border-color: var(--accent);
  }

  .position-chip.selected {
    background: var(--accent-muted, rgba(59, 130, 246, 0.15));
    border-color: var(--accent);
  }

  .position-chip.selected svg {
    color: var(--accent);
  }

  .chip-symbol {
    font-weight: 600;
    color: var(--text-primary);
  }

  .chip-value {
    font-size: var(--text-xs, 0.75rem);
    color: var(--text-muted);
  }

  .selection-summary {
    display: flex;
    align-items: center;
    gap: var(--space-3, 0.75rem);
    font-size: var(--text-sm, 0.875rem);
    color: var(--text-muted);
  }

  .selection-summary .divider {
    color: var(--border);
  }

  .link-btn {
    background: none;
    border: none;
    color: var(--accent);
    font-size: var(--text-sm, 0.875rem);
    cursor: pointer;
    padding: 0;
  }

  .link-btn:hover {
    text-decoration: underline;
  }

  /* Research Panel */
  .ticker-input-row {
    display: flex;
    gap: var(--space-2, 0.5rem);
    margin-bottom: var(--space-3, 0.75rem);
  }

  .ticker-input {
    flex: 1;
    max-width: 200px;
    padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-md, 8px);
    color: var(--text-primary);
    font-size: var(--text-sm, 0.875rem);
  }

  .ticker-input:focus {
    outline: none;
    border-color: var(--accent);
  }

  .popular-tickers {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2, 0.5rem);
    margin-bottom: var(--space-4, 1rem);
  }

  .popular-tickers .label {
    font-size: var(--text-xs, 0.75rem);
    color: var(--text-muted);
  }

  .quick-add-btn {
    padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm, 4px);
    color: var(--text-muted);
    font-size: var(--text-xs, 0.75rem);
    cursor: pointer;
    transition: all 0.15s;
  }

  .quick-add-btn:hover {
    background: var(--accent-muted);
    border-color: var(--accent);
    color: var(--accent);
  }

  .research-assets {
    display: flex;
    flex-direction: column;
    gap: var(--space-2, 0.5rem);
    margin-bottom: var(--space-3, 0.75rem);
  }

  .research-asset-row {
    display: flex;
    align-items: center;
    gap: var(--space-4, 1rem);
    padding: var(--space-3, 0.75rem);
    background: var(--bg-tertiary);
    border-radius: var(--radius-md, 8px);
  }

  .asset-info {
    display: flex;
    flex-direction: column;
    min-width: 80px;
  }

  .asset-symbol {
    font-weight: 600;
    color: var(--text-primary);
  }

  .asset-price {
    font-size: var(--text-xs, 0.75rem);
    color: var(--text-muted);
  }

  .asset-allocation {
    display: flex;
    align-items: center;
    gap: var(--space-2, 0.5rem);
    flex: 1;
  }

  .asset-allocation label {
    font-size: var(--text-xs, 0.75rem);
    color: var(--text-muted);
  }

  .allocation-input {
    width: 100px;
    padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm, 4px);
    color: var(--text-primary);
    font-size: var(--text-sm, 0.875rem);
  }

  .allocation-input:focus {
    outline: none;
    border-color: var(--accent);
  }

  .remove-btn {
    padding: var(--space-1, 0.25rem);
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: var(--radius-sm, 4px);
    transition: all 0.15s;
  }

  .remove-btn:hover {
    color: var(--negative);
    background: rgba(239, 68, 68, 0.1);
  }

  .research-summary {
    font-size: var(--text-sm, 0.875rem);
    color: var(--text-muted);
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-12, 3rem);
    text-align: center;
    color: var(--text-muted);
  }

  .empty-state svg {
    margin-bottom: var(--space-4, 1rem);
    opacity: 0.5;
  }

  .empty-state h3 {
    font-size: var(--text-lg, 1.125rem);
    color: var(--text-secondary);
    margin: 0 0 var(--space-2, 0.5rem) 0;
  }

  .empty-state p {
    margin: 0;
    max-width: 300px;
  }

  /* Loading Overlay */
  .loading-overlay {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-12, 3rem);
    text-align: center;
    color: var(--text-muted);
    gap: var(--space-4, 1rem);
  }

  .btn-secondary:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  section {
    margin-bottom: var(--space-8, 2rem);
  }

  section h2 {
    font-size: var(--text-lg, 1.125rem);
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 var(--space-4, 1rem) 0;
  }

  .section-description {
    color: var(--text-muted);
    font-size: var(--text-sm, 0.875rem);
    margin: -0.5rem 0 1rem 0;
  }

  /* Metrics Grid */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--space-4, 1rem);
  }

  .metric-card {
    position: relative;
    background: var(--glass-bg, var(--bg-secondary));
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border, var(--border));
    border-radius: var(--radius-xl, 16px);
    padding: var(--space-5, 1.25rem);
    transition: all 0.2s;
  }

  .metric-card:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
  }

  .metric-card.positive .metric-value {
    color: var(--positive);
  }

  .metric-card.negative .metric-value {
    color: var(--negative);
  }

  .metric-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-2, 0.5rem);
  }

  .metric-title {
    font-size: var(--text-xs, 0.75rem);
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .info-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 2px;
    border-radius: var(--radius-sm, 4px);
    opacity: 0.5;
    transition: opacity 0.2s;
  }

  .info-btn:hover {
    opacity: 1;
  }

  .metric-value {
    font-size: var(--text-2xl, 1.5rem);
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }

  .metric-subtitle {
    font-size: var(--text-xs, 0.75rem);
    color: var(--text-muted);
    margin-top: var(--space-1, 0.25rem);
  }

  .metric-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-md, 8px);
    padding: var(--space-3, 0.75rem);
    font-size: var(--text-xs, 0.75rem);
    color: var(--text-secondary);
    white-space: nowrap;
    box-shadow: var(--shadow-lg);
    z-index: 10;
    margin-bottom: var(--space-2, 0.5rem);
  }

  /* Tables */
  .table-container {
    overflow-x: auto;
    border-radius: var(--radius-lg, 12px);
    border: 1px solid var(--border);
  }

  .risk-table,
  .stress-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm, 0.875rem);
  }

  .risk-table th,
  .stress-table th {
    background: var(--bg-tertiary);
    padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
    text-align: left;
    font-weight: 600;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border);
  }

  .risk-table td,
  .stress-table td {
    padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
    border-bottom: 1px solid var(--border);
    color: var(--text-secondary);
  }

  .risk-table tr:last-child td,
  .stress-table tr:last-child td {
    border-bottom: none;
  }

  .risk-table tr:hover,
  .stress-table tr:hover {
    background: var(--bg-hover);
  }

  .risk-table .symbol {
    font-weight: 600;
    color: var(--text-primary);
  }

  .risk-table .high-beta {
    color: var(--warning);
  }

  .stress-table .scenario-name {
    font-weight: 600;
    color: var(--text-primary);
  }

  .stress-table .scenario-desc {
    color: var(--text-muted);
    font-size: var(--text-xs, 0.75rem);
  }

  .stress-table .loss {
    color: var(--negative);
    font-weight: 600;
  }

  .stress-table .gain {
    color: var(--positive);
    font-weight: 600;
  }

  /* Correlation Matrix */
  .correlation-matrix {
    display: inline-block;
    background: var(--bg-secondary);
    border-radius: var(--radius-lg, 12px);
    padding: var(--space-2, 0.5rem);
    border: 1px solid var(--border);
  }

  .matrix-header,
  .matrix-row {
    display: flex;
  }

  .correlation-matrix .cell {
    width: 60px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-xs, 0.75rem);
  }

  .correlation-matrix .cell.header {
    font-weight: 600;
    color: var(--text-primary);
    background: transparent;
  }

  .correlation-matrix .cell.corner {
    background: transparent;
  }

  .correlation-matrix .cell.value {
    border-radius: var(--radius-sm, 4px);
    color: var(--text-primary);
    font-weight: 500;
    cursor: default;
    transition: transform 0.1s;
  }

  .correlation-matrix .cell.value:hover {
    transform: scale(1.1);
    z-index: 1;
  }

  .correlation-legend {
    display: flex;
    align-items: center;
    gap: var(--space-2, 0.5rem);
    margin-top: var(--space-3, 0.75rem);
    font-size: var(--text-xs, 0.75rem);
    color: var(--text-muted);
  }

  .legend-gradient {
    width: 120px;
    height: 12px;
    background: linear-gradient(to right, rgb(239, 68, 68), rgb(255, 255, 255), rgb(34, 197, 94));
    border-radius: var(--radius-sm, 4px);
  }

  @media (max-width: 768px) {
    .risk-dashboard {
      padding: var(--space-4, 1rem);
    }

    .dashboard-header {
      flex-direction: column;
    }

    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .correlation-matrix .cell {
      width: 50px;
      height: 35px;
      font-size: 0.65rem;
    }
  }

  @media (max-width: 480px) {
    .metrics-grid {
      grid-template-columns: 1fr;
    }
  }
`;

export default RiskDashboard;
