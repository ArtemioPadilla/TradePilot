// TODO: implement backtest execution service

export async function runBacktest(config: any): Promise<any> {
  // TODO: implement backtest execution via cloud function
  return { id: 'mock', status: 'pending' };
}

export async function getBacktestStatus(backtestId: string): Promise<string> {
  // TODO: implement backtest status polling
  return 'pending';
}

export async function cancelBacktest(backtestId: string): Promise<void> {
  // TODO: implement backtest cancellation
}
