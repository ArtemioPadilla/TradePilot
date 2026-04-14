export interface MarketDataEvent {
  type: 'quote' | 'trade' | 'bar';
  symbol: string;
  price: number;
  timestamp: number;
}

export class MarketDataService {
  subscribe(symbols: string[], callback: (event: MarketDataEvent) => void): () => void {
    // TODO: implement WebSocket subscription
    return () => {};
  }

  unsubscribe(symbols: string[]): void {
    // TODO: implement WebSocket unsubscription
  }

  disconnect(): void {
    // TODO: implement WebSocket disconnect
  }
}

let instance: MarketDataService | null = null;

export function getMarketDataService(): MarketDataService {
  if (!instance) instance = new MarketDataService();
  return instance;
}
