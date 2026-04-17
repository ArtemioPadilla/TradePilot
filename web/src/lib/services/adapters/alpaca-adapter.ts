/**
 * Alpaca Source Adapter
 *
 * Implements SourceAdapter interface for Alpaca Markets API.
 * Handles account data, positions, orders, and portfolio history.
 *
 * @module adapters/alpaca-adapter
 */

import type { AssetClass } from '../../../types/assets';
import type {
  AlpacaCredentials,
  AlpacaEnvironment,
  AlpacaAccount,
  AlpacaPosition,
  AlpacaOrder,
} from '../../../types/alpaca';
import type {
  SourceAdapter,
  AdapterCapabilities,
  ExternalAccount,
  ExternalPosition,
  ExternalOrder,
  ConnectionResult,
  OrderQueryOptions,
  OrderRequest,
  OrderResult,
  PortfolioHistoryPoint,
} from './types';
import { adapterRegistry } from './registry';

// ============================================================================
// Alpaca API Helpers
// ============================================================================

/**
 * Get Alpaca API base URL for environment
 */
function getAlpacaBaseUrl(environment: AlpacaEnvironment): string {
  return environment === 'paper'
    ? 'https://paper-api.alpaca.markets'
    : 'https://api.alpaca.markets';
}

/**
 * Get Alpaca data API base URL
 */
function getAlpacaDataUrl(): string {
  return 'https://data.alpaca.markets';
}

// ============================================================================
// Alpaca Adapter
// ============================================================================

export class AlpacaAdapter implements SourceAdapter<AlpacaCredentials> {
  // ─────────────────────────────────────────────────────────────────────────
  // Identity
  // ─────────────────────────────────────────────────────────────────────────

  readonly id = 'alpaca' as const;
  readonly displayName = 'Alpaca Markets';
  readonly description = 'US stocks and ETFs with commission-free trading';
  readonly icon = '/icons/alpaca.svg';
  readonly supportedAssetClasses: AssetClass[] = ['equity', 'derivative'];

  // ─────────────────────────────────────────────────────────────────────────
  // Capabilities
  // ─────────────────────────────────────────────────────────────────────────

  readonly capabilities: AdapterCapabilities = {
    canTrade: true,
    canGetOrders: true,
    canGetHistory: true,
    canGetTransactions: false, // Alpaca doesn't have direct transaction API
    supportsRealtime: true,
    supportsWebSocket: true,
    requiresCredentials: true,
    credentialsSchema: [
      {
        name: 'apiKey',
        label: 'API Key ID',
        type: 'text',
        required: true,
        placeholder: 'PK...',
        helpText: 'Found in your Alpaca dashboard under API Keys',
      },
      {
        name: 'apiSecret',
        label: 'API Secret Key',
        type: 'password',
        required: true,
        placeholder: 'Your secret key',
        helpText: 'Only shown once when you create the key',
      },
      {
        name: 'environment',
        label: 'Environment',
        type: 'select',
        required: true,
        defaultValue: 'paper',
        options: [
          { value: 'paper', label: 'Paper Trading (Simulated)' },
          { value: 'live', label: 'Live Trading (Real Money)' },
        ],
        helpText: 'Use Paper for testing, Live for real trades',
      },
    ],
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Private State
  // ─────────────────────────────────────────────────────────────────────────

  private credentials: AlpacaCredentials | null = null;
  private _isConnected = false;
  private cachedAccount: AlpacaAccount | null = null;

  // ─────────────────────────────────────────────────────────────────────────
  // Connection Lifecycle
  // ─────────────────────────────────────────────────────────────────────────

  async connect(credentials: AlpacaCredentials): Promise<void> {
    this.credentials = credentials;

    // Verify connection works
    const result = await this.testConnection();
    if (!result.success) {
      this.credentials = null;
      throw new Error(result.error || 'Failed to connect to Alpaca');
    }

    this._isConnected = true;
  }

  async disconnect(): Promise<void> {
    this.credentials = null;
    this._isConnected = false;
    this.cachedAccount = null;
  }

  async testConnection(): Promise<ConnectionResult> {
    if (!this.credentials) {
      return { success: false, error: 'Credentials not set' };
    }

    const startTime = Date.now();

    try {
      const baseUrl = getAlpacaBaseUrl(this.credentials.environment);
      const response = await fetch(`${baseUrl}/v2/account`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          error: error.message || `Connection failed: ${response.status}`,
          latency: Date.now() - startTime,
        };
      }

      const data = await response.json();
      const account = this.parseAlpacaAccount(data);
      this.cachedAccount = account;

      return {
        success: true,
        account: this.toExternalAccount(account),
        latency: Date.now() - startTime,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Connection failed',
        latency: Date.now() - startTime,
      };
    }
  }

  isConnected(): boolean {
    return this._isConnected && this.credentials !== null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Account Data
  // ─────────────────────────────────────────────────────────────────────────

  async getAccounts(): Promise<ExternalAccount[]> {
    if (!this.credentials) {
      throw new Error('Not connected to Alpaca');
    }

    const baseUrl = getAlpacaBaseUrl(this.credentials.environment);
    const response = await fetch(`${baseUrl}/v2/account`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch account: ${response.status}`);
    }

    const data = await response.json();
    const account = this.parseAlpacaAccount(data);
    this.cachedAccount = account;

    // Alpaca returns a single account
    return [this.toExternalAccount(account)];
  }

  async getPositions(accountId?: string): Promise<ExternalPosition[]> {
    if (!this.credentials) {
      throw new Error('Not connected to Alpaca');
    }

    const baseUrl = getAlpacaBaseUrl(this.credentials.environment);
    const response = await fetch(`${baseUrl}/v2/positions`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch positions: ${response.status}`);
    }

    const data = await response.json();
    return data.map((pos: Record<string, unknown>) => this.toExternalPosition(pos));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Orders
  // ─────────────────────────────────────────────────────────────────────────

  async getOrders(accountId?: string, options?: OrderQueryOptions): Promise<ExternalOrder[]> {
    if (!this.credentials) {
      throw new Error('Not connected to Alpaca');
    }

    const baseUrl = getAlpacaBaseUrl(this.credentials.environment);
    const params = new URLSearchParams({
      status: options?.status || 'all',
      limit: String(options?.limit || 50),
      direction: options?.direction || 'desc',
    });

    if (options?.after) {
      params.set('after', options.after.toISOString());
    }
    if (options?.until) {
      params.set('until', options.until.toISOString());
    }

    const response = await fetch(`${baseUrl}/v2/orders?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.status}`);
    }

    const data = await response.json();
    return data.map((order: Record<string, unknown>) => this.toExternalOrder(order));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Portfolio History
  // ─────────────────────────────────────────────────────────────────────────

  async getPortfolioHistory(period: string = '1M'): Promise<PortfolioHistoryPoint[]> {
    if (!this.credentials) {
      throw new Error('Not connected to Alpaca');
    }

    const baseUrl = getAlpacaBaseUrl(this.credentials.environment);
    const params = new URLSearchParams({
      period,
      timeframe: '1D',
    });

    const response = await fetch(`${baseUrl}/v2/account/portfolio/history?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch portfolio history: ${response.status}`);
    }

    const data = await response.json();
    const timestamps: number[] = data.timestamp || [];
    const equity: number[] = data.equity || [];
    const profitLoss: number[] = data.profit_loss || [];
    const profitLossPct: number[] = data.profit_loss_pct || [];

    return timestamps.map((ts, i) => ({
      timestamp: new Date(ts * 1000),
      equity: equity[i] || 0,
      profitLoss: profitLoss[i] || 0,
      profitLossPct: (profitLossPct[i] || 0) * 100,
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Trading
  // ─────────────────────────────────────────────────────────────────────────

  async submitOrder(order: OrderRequest): Promise<OrderResult> {
    if (!this.credentials) {
      return { success: false, error: 'Not connected to Alpaca' };
    }

    const baseUrl = getAlpacaBaseUrl(this.credentials.environment);

    const body: Record<string, unknown> = {
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      time_in_force: order.timeInForce,
    };

    if (order.qty !== undefined) {
      body.qty = order.qty.toString();
    }
    if (order.notional !== undefined) {
      body.notional = order.notional.toString();
    }
    if (order.limitPrice !== undefined) {
      body.limit_price = order.limitPrice.toString();
    }
    if (order.stopPrice !== undefined) {
      body.stop_price = order.stopPrice.toString();
    }
    if (order.trailPercent !== undefined) {
      body.trail_percent = order.trailPercent.toString();
    }
    if (order.trailPrice !== undefined) {
      body.trail_price = order.trailPrice.toString();
    }
    if (order.extendedHours !== undefined) {
      body.extended_hours = order.extendedHours;
    }
    if (order.clientOrderId) {
      body.client_order_id = order.clientOrderId;
    }

    try {
      const response = await fetch(`${baseUrl}/v2/orders`, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          error: error.message || `Order failed: ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        order: this.toExternalOrder(data),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Order submission failed',
      };
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    if (!this.credentials) {
      throw new Error('Not connected to Alpaca');
    }

    const baseUrl = getAlpacaBaseUrl(this.credentials.environment);
    const response = await fetch(`${baseUrl}/v2/orders/${orderId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to cancel order: ${response.status}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────────────────

  private getHeaders(): Record<string, string> {
    if (!this.credentials) {
      throw new Error('Credentials not set');
    }

    return {
      'APCA-API-KEY-ID': this.credentials.apiKey,
      'APCA-API-SECRET-KEY': this.credentials.apiSecret,
    };
  }

  private parseAlpacaAccount(data: Record<string, unknown>): AlpacaAccount {
    return {
      id: data.id as string,
      accountNumber: data.account_number as string,
      status: data.status as AlpacaAccount['status'],
      currency: data.currency as string,
      cash: parseFloat(data.cash as string),
      portfolioValue: parseFloat(data.portfolio_value as string),
      buyingPower: parseFloat(data.buying_power as string),
      patternDayTrader: data.pattern_day_trader as boolean,
      dayTradesRemaining: data.daytrade_count !== undefined
        ? 3 - (data.daytrade_count as number)
        : undefined,
      tradingBlocked: data.trading_blocked as boolean,
      transfersBlocked: data.transfers_blocked as boolean,
      accountBlocked: data.account_blocked as boolean,
      createdAt: new Date(data.created_at as string),
    };
  }

  private toExternalAccount(account: AlpacaAccount): ExternalAccount {
    return {
      externalId: account.id,
      name: this.credentials?.environment === 'paper'
        ? 'Alpaca Paper Trading'
        : 'Alpaca Live Trading',
      type: 'brokerage',
      cashBalance: account.cash,
      currency: 'USD',
      portfolioValue: account.portfolioValue,
      buyingPower: account.buyingPower,
      status: account.status === 'ACTIVE' ? 'active' : 'inactive',
      isPaper: this.credentials?.environment === 'paper',
      metadata: {
        accountNumber: account.accountNumber,
        patternDayTrader: account.patternDayTrader,
        dayTradesRemaining: account.dayTradesRemaining,
        tradingBlocked: account.tradingBlocked,
        transfersBlocked: account.transfersBlocked,
      },
    };
  }

  private toExternalPosition(pos: Record<string, unknown>): ExternalPosition {
    const quantity = parseFloat(pos.qty as string);
    const avgPrice = parseFloat(pos.avg_entry_price as string);
    const currentPrice = parseFloat(pos.current_price as string);
    const marketValue = parseFloat(pos.market_value as string);
    const costBasis = parseFloat(pos.cost_basis as string);
    const unrealizedPL = parseFloat(pos.unrealized_pl as string);
    const unrealizedPLPercent = parseFloat(pos.unrealized_plpc as string) * 100;
    const lastdayPrice = parseFloat(pos.lastday_price as string);
    const dailyChange = (currentPrice - lastdayPrice) * quantity;
    const dailyChangePercent = parseFloat(pos.change_today as string) * 100;

    return {
      externalId: pos.asset_id as string,
      symbol: pos.symbol as string,
      sourceSymbol: pos.symbol as string,
      quantity,
      avgPrice,
      currentPrice,
      marketValue,
      costBasis,
      unrealizedPL,
      unrealizedPLPercent,
      dailyChange,
      dailyChangePercent,
      assetClass: pos.asset_class === 'crypto' ? 'crypto' : 'equity',
      currency: 'USD',
      exchange: pos.exchange as string,
      metadata: {
        assetId: pos.asset_id,
        assetClass: pos.asset_class,
        lastdayPrice,
      },
    };
  }

  private toExternalOrder(order: Record<string, unknown>): ExternalOrder {
    // Map Alpaca status to our status
    const statusMap: Record<string, ExternalOrder['status']> = {
      new: 'open',
      partially_filled: 'partially_filled',
      filled: 'filled',
      done_for_day: 'filled',
      canceled: 'cancelled',
      expired: 'expired',
      replaced: 'cancelled',
      pending_cancel: 'open',
      pending_replace: 'open',
      pending_new: 'pending',
      accepted: 'open',
      stopped: 'filled',
      rejected: 'rejected',
      suspended: 'open',
      calculated: 'pending',
    };

    return {
      externalId: order.id as string,
      symbol: order.symbol as string,
      side: order.side as 'buy' | 'sell',
      type: order.type as ExternalOrder['type'],
      status: statusMap[order.status as string] || 'pending',
      quantity: parseFloat(order.qty as string),
      filledQuantity: parseFloat((order.filled_qty as string) || '0'),
      avgFillPrice: order.filled_avg_price
        ? parseFloat(order.filled_avg_price as string)
        : undefined,
      limitPrice: order.limit_price
        ? parseFloat(order.limit_price as string)
        : undefined,
      stopPrice: order.stop_price
        ? parseFloat(order.stop_price as string)
        : undefined,
      currency: 'USD',
      submittedAt: new Date(order.submitted_at as string),
      filledAt: order.filled_at ? new Date(order.filled_at as string) : undefined,
      metadata: {
        clientOrderId: order.client_order_id,
        timeInForce: order.time_in_force,
        extendedHours: order.extended_hours,
        assetClass: order.asset_class,
      },
    };
  }
}

// ============================================================================
// Factory & Registration
// ============================================================================

/**
 * Create a new AlpacaAdapter instance
 */
export function createAlpacaAdapter(): AlpacaAdapter {
  return new AlpacaAdapter();
}

/**
 * Register AlpacaAdapter with the global registry
 * Called on module import
 */
adapterRegistry.register('alpaca', createAlpacaAdapter, 'available');

export default AlpacaAdapter;
