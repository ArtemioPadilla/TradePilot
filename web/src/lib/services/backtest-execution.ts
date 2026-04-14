const API_BASE = 'http://localhost:8000';

export async function runBacktest(config: any): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/backtest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        universe: config.universe,
        strategy: config.strategy,
        start_date: config.start_date,
        end_date: config.end_date,
        initial_capital: config.initial_capital,
        risk_free: config.risk_free,
        optimization: config.optimization,
        n_stocks: config.n_stocks,
      }),
    });
    return await response.json();
  } catch (error) {
    return { id: null, status: 'error', error: String(error) };
  }
}

export async function getBacktestStatus(backtestId: string): Promise<string> {
  return 'completed';
}

export async function cancelBacktest(backtestId: string): Promise<void> {}
