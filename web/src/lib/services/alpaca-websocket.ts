// TODO: implement Alpaca WebSocket service

export class AlpacaWebSocket {
  connect(apiKey: string, apiSecret: string, environment: string): void {
    // TODO: implement WebSocket connection to Alpaca streaming API
  }

  disconnect(): void {
    // TODO: implement graceful disconnect
  }

  subscribe(channels: string[], symbols: string[]): void {
    // TODO: implement channel/symbol subscription
  }

  onMessage(callback: (data: any) => void): void {
    // TODO: implement message handler registration
  }
}

export function getAlpacaWebSocket(): AlpacaWebSocket {
  return new AlpacaWebSocket();
}
