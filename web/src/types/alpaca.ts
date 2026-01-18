/**
 * Alpaca API Types
 *
 * Type definitions for Alpaca trading integration.
 */

/**
 * Alpaca environment (paper trading vs live)
 */
export type AlpacaEnvironment = 'paper' | 'live';

/**
 * Alpaca API credentials
 */
export interface AlpacaCredentials {
  /** API Key ID */
  apiKey: string;
  /** API Secret Key (encrypted in storage) */
  apiSecret: string;
  /** Trading environment */
  environment: AlpacaEnvironment;
  /** When credentials were last verified */
  verifiedAt?: Date;
  /** Whether credentials are currently valid */
  isValid?: boolean;
}

/**
 * Alpaca account information
 */
export interface AlpacaAccount {
  /** Account ID */
  id: string;
  /** Account number */
  accountNumber: string;
  /** Account status */
  status: 'ACTIVE' | 'ONBOARDING' | 'APPROVAL_PENDING' | 'DISABLED';
  /** Currency */
  currency: string;
  /** Cash available for trading */
  cash: number;
  /** Portfolio value (cash + positions) */
  portfolioValue: number;
  /** Buying power */
  buyingPower: number;
  /** Pattern day trader status */
  patternDayTrader: boolean;
  /** Day trades remaining (PDT rule) */
  dayTradesRemaining?: number;
  /** Whether trading is blocked */
  tradingBlocked: boolean;
  /** Whether transfers are blocked */
  transfersBlocked: boolean;
  /** Whether account is blocked */
  accountBlocked: boolean;
  /** Created at timestamp */
  createdAt: Date;
}

/**
 * Alpaca position
 */
export interface AlpacaPosition {
  /** Symbol */
  symbol: string;
  /** Quantity of shares */
  qty: number;
  /** Average entry price */
  avgEntryPrice: number;
  /** Current market value */
  marketValue: number;
  /** Cost basis */
  costBasis: number;
  /** Unrealized P&L */
  unrealizedPl: number;
  /** Unrealized P&L percentage */
  unrealizedPlPercent: number;
  /** Current price */
  currentPrice: number;
  /** Last day's price */
  lastdayPrice: number;
  /** Change today */
  changeToday: number;
  /** Asset ID */
  assetId: string;
  /** Asset class */
  assetClass: 'us_equity' | 'crypto';
  /** Exchange */
  exchange: string;
}

/**
 * Order side
 */
export type OrderSide = 'buy' | 'sell';

/**
 * Order type
 */
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';

/**
 * Time in force
 */
export type TimeInForce = 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';

/**
 * Order status
 */
export type OrderStatus =
  | 'new'
  | 'partially_filled'
  | 'filled'
  | 'done_for_day'
  | 'canceled'
  | 'expired'
  | 'replaced'
  | 'pending_cancel'
  | 'pending_replace'
  | 'pending_new'
  | 'accepted'
  | 'stopped'
  | 'rejected'
  | 'suspended'
  | 'calculated';

/**
 * Order request
 */
export interface OrderRequest {
  /** Symbol to trade */
  symbol: string;
  /** Number of shares */
  qty?: number;
  /** Dollar amount (for fractional shares) */
  notional?: number;
  /** Buy or sell */
  side: OrderSide;
  /** Order type */
  type: OrderType;
  /** Time in force */
  timeInForce: TimeInForce;
  /** Limit price (for limit/stop_limit orders) */
  limitPrice?: number;
  /** Stop price (for stop/stop_limit orders) */
  stopPrice?: number;
  /** Trail percent (for trailing_stop orders) */
  trailPercent?: number;
  /** Trail price (for trailing_stop orders) */
  trailPrice?: number;
  /** Whether order is extended hours eligible */
  extendedHours?: boolean;
  /** Client order ID for idempotency */
  clientOrderId?: string;
}

/**
 * Order response from Alpaca
 */
export interface AlpacaOrder {
  /** Order ID */
  id: string;
  /** Client order ID */
  clientOrderId: string;
  /** Symbol */
  symbol: string;
  /** Asset ID */
  assetId: string;
  /** Asset class */
  assetClass: 'us_equity' | 'crypto';
  /** Order side */
  side: OrderSide;
  /** Order type */
  type: OrderType;
  /** Time in force */
  timeInForce: TimeInForce;
  /** Ordered quantity */
  qty: number;
  /** Filled quantity */
  filledQty: number;
  /** Filled average price */
  filledAvgPrice?: number;
  /** Limit price */
  limitPrice?: number;
  /** Stop price */
  stopPrice?: number;
  /** Order status */
  status: OrderStatus;
  /** Extended hours */
  extendedHours: boolean;
  /** Created at */
  createdAt: Date;
  /** Updated at */
  updatedAt: Date;
  /** Submitted at */
  submittedAt: Date;
  /** Filled at */
  filledAt?: Date;
  /** Expired at */
  expiredAt?: Date;
  /** Canceled at */
  canceledAt?: Date;
}

/**
 * Real-time quote
 */
export interface AlpacaQuote {
  /** Symbol */
  symbol: string;
  /** Bid price */
  bidPrice: number;
  /** Bid size */
  bidSize: number;
  /** Ask price */
  askPrice: number;
  /** Ask size */
  askSize: number;
  /** Last trade price */
  lastPrice: number;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Real-time trade
 */
export interface AlpacaTrade {
  /** Symbol */
  symbol: string;
  /** Trade price */
  price: number;
  /** Trade size */
  size: number;
  /** Exchange */
  exchange: string;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Bar (OHLCV) data
 */
export interface AlpacaBar {
  /** Symbol */
  symbol: string;
  /** Open price */
  open: number;
  /** High price */
  high: number;
  /** Low price */
  low: number;
  /** Close price */
  close: number;
  /** Volume */
  volume: number;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Connection status
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Alpaca connection state
 */
export interface AlpacaConnectionState {
  /** Whether credentials are configured */
  hasCredentials: boolean;
  /** Current connection status */
  status: ConnectionStatus;
  /** Last error message */
  error?: string;
  /** Last sync timestamp */
  lastSync?: Date;
  /** Account info */
  account?: AlpacaAccount;
}
