type TradeUpdate = {
  symbol: string;
  price: number;
  size: number;
  timestamp: number;
  conditions: string[];
  tape: string;
};

type WebSocketMessage =
  | { T: 'success'; msg: string }
  | { T: 'error'; code: number; msg: string }
  | { T: 'subscription'; trades: string[]; quotes: string[]; bars: string[] }
  | { T: 't'; S: string; p: number; s: number; t: string; c: string[]; z: string };

type TradeCallback = (trade: TradeUpdate) => void;
type ConnectionCallback = (status: 'connected' | 'disconnected' | 'error') => void;

const IEX_WS_URL = 'wss://stream.data.alpaca.markets/v2/iex';
const SIP_WS_URL = 'wss://stream.data.alpaca.markets/v2/sip';

const MAX_RECONNECT_DELAY = 30000;
const BASE_RECONNECT_DELAY = 1000;

export class AlpacaWebSocket {
  private ws: WebSocket | null = null;
  private apiKey = '';
  private apiSecret = '';
  private environment = 'paper';
  private subscribedSymbols: Set<string> = new Set();
  private tradeCallbacks: TradeCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;
  private authenticated = false;

  connect(apiKey: string, apiSecret: string, environment: string = 'paper'): void {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.environment = environment;
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    this.openConnection();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.authenticated = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }

    this.emitConnectionStatus('disconnected');
  }

  subscribe(symbols: string[]): void {
    for (const s of symbols) {
      this.subscribedSymbols.add(s.toUpperCase());
    }

    if (this.authenticated && this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscription(symbols, 'subscribe');
    }
  }

  unsubscribe(symbols: string[]): void {
    for (const s of symbols) {
      this.subscribedSymbols.delete(s.toUpperCase());
    }

    if (this.authenticated && this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscription(symbols, 'unsubscribe');
    }
  }

  onTrade(callback: TradeCallback): () => void {
    this.tradeCallbacks.push(callback);
    return () => {
      this.tradeCallbacks = this.tradeCallbacks.filter((cb) => cb !== callback);
    };
  }

  onConnection(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.push(callback);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter((cb) => cb !== callback);
    };
  }

  isConnected(): boolean {
    return this.authenticated && this.ws?.readyState === WebSocket.OPEN;
  }

  getSubscribedSymbols(): string[] {
    return Array.from(this.subscribedSymbols);
  }

  private openConnection(): void {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
    }

    const url = this.environment === 'live' ? SIP_WS_URL : IEX_WS_URL;

    try {
      this.ws = new WebSocket(url);
    } catch (err) {
      console.error('[alpaca-ws] failed to create WebSocket:', err);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log('[alpaca-ws] connection opened');
    };

    this.ws.onmessage = (event: MessageEvent) => {
      this.handleMessage(event.data);
    };

    this.ws.onerror = (event: Event) => {
      console.error('[alpaca-ws] error:', event);
      this.emitConnectionStatus('error');
    };

    this.ws.onclose = () => {
      console.log('[alpaca-ws] connection closed');
      this.authenticated = false;
      this.emitConnectionStatus('disconnected');

      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };
  }

  private handleMessage(raw: string): void {
    let messages: WebSocketMessage[];
    try {
      messages = JSON.parse(raw);
    } catch {
      console.error('[alpaca-ws] failed to parse message:', raw);
      return;
    }

    if (!Array.isArray(messages)) {
      messages = [messages as WebSocketMessage];
    }

    for (const msg of messages) {
      switch (msg.T) {
        case 'success':
          if (msg.msg === 'connected') {
            this.authenticate();
          } else if (msg.msg === 'authenticated') {
            this.authenticated = true;
            this.reconnectAttempts = 0;
            this.emitConnectionStatus('connected');
            // Re-subscribe to any previously subscribed symbols
            if (this.subscribedSymbols.size > 0) {
              this.sendSubscription(Array.from(this.subscribedSymbols), 'subscribe');
            }
          }
          break;

        case 'error':
          console.error('[alpaca-ws] server error:', msg.code, msg.msg);
          if (msg.code === 402 || msg.code === 403) {
            // Auth failure - don't reconnect
            this.shouldReconnect = false;
            this.emitConnectionStatus('error');
          }
          break;

        case 'subscription':
          console.log('[alpaca-ws] subscribed to trades:', msg.trades);
          break;

        case 't': {
          const trade: TradeUpdate = {
            symbol: msg.S,
            price: msg.p,
            size: msg.s,
            timestamp: new Date(msg.t).getTime(),
            conditions: msg.c || [],
            tape: msg.z || '',
          };
          for (const cb of this.tradeCallbacks) {
            try {
              cb(trade);
            } catch (err) {
              console.error('[alpaca-ws] trade callback error:', err);
            }
          }
          break;
        }
      }
    }
  }

  private authenticate(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(
      JSON.stringify({
        action: 'auth',
        key: this.apiKey,
        secret: this.apiSecret,
      })
    );
  }

  private sendSubscription(symbols: string[], action: 'subscribe' | 'unsubscribe'): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(
      JSON.stringify({
        action,
        trades: symbols.map((s) => s.toUpperCase()),
      })
    );
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.reconnectTimer) return;

    const delay = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_DELAY
    );

    console.log(`[alpaca-ws] reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      this.openConnection();
    }, delay);
  }

  private emitConnectionStatus(status: 'connected' | 'disconnected' | 'error'): void {
    for (const cb of this.connectionCallbacks) {
      try {
        cb(status);
      } catch (err) {
        console.error('[alpaca-ws] connection callback error:', err);
      }
    }
  }
}

// Singleton instance
let instance: AlpacaWebSocket | null = null;

export function getAlpacaWebSocket(): AlpacaWebSocket {
  if (!instance) {
    instance = new AlpacaWebSocket();
  }
  return instance;
}

export type { TradeUpdate, TradeCallback, ConnectionCallback };
