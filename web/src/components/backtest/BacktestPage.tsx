/**
 * Backtest Page Component
 *
 * Container component that orchestrates the backtest workflow:
 * config -> running -> results, with history sidebar.
 */

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '../../lib/firebase';
import { BacktestConfigForm } from './BacktestConfigForm';
import { BacktestProgress } from './BacktestProgress';
import { BacktestResults } from './BacktestResults';
import { BacktestHistory } from './BacktestHistory';
import type {
  BacktestConfig,
  BacktestResult,
  BacktestJobStatus,
} from '../../types/backtest';

type ViewState = 'config' | 'running' | 'results';

export function BacktestPage() {
  // Auth state
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // View state
  const [view, setView] = useState<ViewState>('config');
  const [showHistory, setShowHistory] = useState(false);

  // Backtest state
  const [currentConfig, setCurrentConfig] = useState<BacktestConfig | null>(null);
  const [jobStatus, setJobStatus] = useState<BacktestJobStatus>('pending');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<BacktestResult | null>(null);

  // Listen to auth state
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Check URL params for pre-selected strategy
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const strategyId = params.get('strategy');
    if (strategyId) {
      // TODO: Load strategy and pre-fill config
      console.log('Pre-selected strategy:', strategyId);
    }
  }, []);

  const runBacktest = useCallback(async (config: BacktestConfig) => {
    setCurrentConfig(config);
    setView('running');
    setJobStatus('pending');
    setProgress(0);
    setProgressMessage('Initializing backtest...');

    try {
      // Simulate backtest progress
      // In production, this would call the Python backend
      setJobStatus('running');

      // Simulate progress updates
      const progressSteps = [
        { progress: 10, message: 'Loading market data...' },
        { progress: 30, message: 'Calculating signals...' },
        { progress: 50, message: 'Simulating trades...' },
        { progress: 70, message: 'Computing metrics...' },
        { progress: 90, message: 'Generating results...' },
        { progress: 100, message: 'Complete!' },
      ];

      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setProgress(step.progress);
        setProgressMessage(step.message);
      }

      setJobStatus('completed');

      // Generate mock result
      const mockResult: BacktestResult = {
        id: `backtest_${Date.now()}`,
        success: true,
        config,
        executedAt: new Date(),
        executionDuration: 2500,
        metrics: {
          totalReturn: 0.2534,
          cagr: 0.1823,
          volatility: 0.1456,
          sharpeRatio: 1.25,
          maxDrawdown: -0.1234,
          maxDrawdownDuration: 45,
          calmarRatio: 1.48,
          sortinoRatio: 1.89,
          winRate: 0.58,
          profitFactor: 1.67,
          avgWin: 0.0234,
          avgLoss: -0.0156,
          totalTrades: 48,
        },
        equityCurve: generateMockEquityCurve(config),
        drawdownCurve: generateMockDrawdownCurve(config),
        monthlyReturns: generateMockMonthlyReturns(),
        trades: [],
        portfolioSnapshots: [],
        topDrawdowns: [],
      };

      setResult(mockResult);
      setView('results');
    } catch (error) {
      console.error('Backtest failed:', error);
      setJobStatus('failed');
      setProgressMessage(error instanceof Error ? error.message : 'Backtest failed');
    }
  }, []);

  const handleCancel = useCallback(() => {
    setJobStatus('cancelled');
    setView('config');
  }, []);

  const handleRunAnother = useCallback(() => {
    setView('config');
    setResult(null);
    setCurrentConfig(null);
  }, []);

  const handleSaveResult = useCallback((result: BacktestResult) => {
    // TODO: Save to Firestore
    console.log('Saving result:', result);
  }, []);

  const handleViewHistoryResult = useCallback((historyResult: BacktestResult) => {
    setResult(historyResult);
    setView('results');
    setShowHistory(false);
  }, []);

  const handleRerunConfig = useCallback((config: BacktestConfig) => {
    setCurrentConfig(config);
    setView('config');
    setShowHistory(false);
  }, []);

  // Render not authenticated state
  if (!userId && !isLoading) {
    return (
      <div className="backtest-page backtest-page--not-auth" data-testid="backtest-page-not-auth">
        <div className="message-container">
          <div className="message-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
          </div>
          <h2>Authentication Required</h2>
          <p>Please sign in to run backtests.</p>
          <a href="/auth/login" className="btn btn-primary">Sign In</a>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="backtest-page backtest-page--loading" data-testid="backtest-page-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="backtest-page" data-testid="backtest-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>Backtest</h1>
          <p className="page-description">
            Test your trading strategies against historical data
          </p>
        </div>
        <button
          className="history-button"
          onClick={() => setShowHistory(!showHistory)}
          data-testid="toggle-history"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          History
          {showHistory && <span className="active-indicator" />}
        </button>
      </div>

      <div className={`page-content ${showHistory ? 'with-sidebar' : ''}`}>
        {/* Main Content */}
        <div className="main-content">
          {view === 'config' && (
            <BacktestConfigForm
              onSubmit={runBacktest}
              initialConfig={currentConfig ? {
                ...currentConfig,
                name: currentConfig.name,
              } : undefined}
              isLoading={false}
            />
          )}

          {view === 'running' && (
            <div className="running-container">
              <BacktestProgress
                status={jobStatus}
                progress={progress}
                message={progressMessage}
                onCancel={handleCancel}
                canCancel={jobStatus === 'running' || jobStatus === 'pending'}
              />
            </div>
          )}

          {view === 'results' && result && (
            <BacktestResults
              result={result}
              onRunAnother={handleRunAnother}
              onSave={handleSaveResult}
            />
          )}
        </div>

        {/* History Sidebar */}
        {showHistory && userId && (
          <div className="history-sidebar">
            <BacktestHistory
              userId={userId}
              onViewResult={handleViewHistoryResult}
              onRerun={handleRerunConfig}
            />
          </div>
        )}
      </div>

      <style>{styles}</style>
    </div>
  );
}

// Helper functions for mock data
function generateMockEquityCurve(config: BacktestConfig): { date: Date; value: number; benchmark: number }[] {
  const curve: { date: Date; value: number; benchmark: number }[] = [];
  const startDate = new Date(config.startDate);
  const endDate = new Date(config.endDate);
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  let portfolioValue = config.initialCapital;
  let benchmarkValue = config.initialCapital;

  for (let i = 0; i <= days; i += 5) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Random walk simulation
    portfolioValue *= 1 + (Math.random() - 0.48) * 0.02;
    benchmarkValue *= 1 + (Math.random() - 0.49) * 0.015;

    curve.push({
      date,
      value: portfolioValue,
      benchmark: benchmarkValue,
    });
  }

  return curve;
}

function generateMockDrawdownCurve(config: BacktestConfig): { date: Date; drawdown: number }[] {
  const curve: { date: Date; drawdown: number }[] = [];
  const startDate = new Date(config.startDate);
  const endDate = new Date(config.endDate);
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  let peak = config.initialCapital;
  let currentValue = config.initialCapital;

  for (let i = 0; i <= days; i += 5) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Random walk simulation
    currentValue *= 1 + (Math.random() - 0.48) * 0.02;
    if (currentValue > peak) peak = currentValue;
    const drawdown = (currentValue - peak) / peak;

    curve.push({ date, drawdown });
  }

  return curve;
}

function generateMockMonthlyReturns(): { year: number; months: (number | null)[]; yearTotal: number }[] {
  const returns: { year: number; months: (number | null)[]; yearTotal: number }[] = [];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  for (let year = currentYear - 4; year <= currentYear; year++) {
    const months: (number | null)[] = [];
    let yearTotal = 0;

    for (let month = 0; month < 12; month++) {
      if (year === currentYear && month > currentMonth) {
        months.push(null);
      } else {
        const monthReturn = (Math.random() - 0.45) * 0.15;
        months.push(monthReturn);
        yearTotal += monthReturn;
      }
    }

    returns.push({ year, months, yearTotal });
  }

  return returns;
}

const styles = `
  .backtest-page {
    padding: 1.5rem;
    max-width: 1600px;
    margin: 0 auto;
  }

  .backtest-page--not-auth,
  .backtest-page--loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
  }

  .loading-container,
  .message-container {
    text-align: center;
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .message-icon {
    color: var(--accent);
    margin-bottom: 1rem;
    opacity: 0.8;
  }

  .message-container h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 0.5rem 0;
  }

  .message-container p {
    color: var(--text-muted);
    margin: 0 0 1.5rem 0;
  }

  .btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 500;
    border: none;
    border-radius: var(--radius-md, 8px);
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-block;
  }

  .btn-primary {
    background: var(--accent);
    color: white;
  }

  .btn-primary:hover {
    background: var(--accent-hover, #2563eb);
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }

  .header-left h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .page-description {
    color: var(--text-muted);
    font-size: 0.875rem;
    margin: 0.25rem 0 0 0;
  }

  .history-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-md, 8px);
    font-size: 0.875rem;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .history-button:hover {
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .active-indicator {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 8px;
    height: 8px;
    background-color: var(--accent);
    border-radius: 50%;
  }

  .page-content {
    display: flex;
    gap: 1.5rem;
  }

  .page-content.with-sidebar .main-content {
    flex: 1;
    min-width: 0;
  }

  .main-content {
    width: 100%;
  }

  .running-container {
    max-width: 500px;
    margin: 4rem auto;
  }

  .history-sidebar {
    width: 400px;
    flex-shrink: 0;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg, 12px);
    padding: 1rem;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
  }

  @media (max-width: 1024px) {
    .page-content.with-sidebar {
      flex-direction: column;
    }

    .history-sidebar {
      width: 100%;
      max-height: 400px;
    }
  }

  @media (max-width: 640px) {
    .backtest-page {
      padding: 1rem;
    }

    .page-header {
      flex-direction: column;
      gap: 1rem;
    }

    .history-button {
      width: 100%;
      justify-content: center;
    }
  }
`;

export default BacktestPage;
