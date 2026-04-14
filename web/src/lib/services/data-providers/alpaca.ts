// TODO: implement Alpaca data provider

export function getAlpacaProvider() {
  return {
    getName: () => 'alpaca',
    connect: async () => {},
    disconnect: async () => {},
    subscribe: (symbols: string[], callback: (data: any) => void) => () => {},
    getQuote: async (symbol: string) => null,
    getBars: async (symbol: string, timeframe: string) => [],
  };
}
