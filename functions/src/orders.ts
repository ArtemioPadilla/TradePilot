/**
 * Order Execution Cloud Functions
 *
 * Secure server-side order execution with:
 * - Server-side validation
 * - Audit logging
 * - Rate limiting
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getDecryptedCredentials } from './credentials';

const db = admin.firestore();

// Rate limiting configuration
const MAX_ORDERS_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW_MS = 60000;

// Order validation
interface OrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
  timeInForce: 'day' | 'gtc' | 'ioc' | 'fok';
  qty?: number;
  notional?: number;
  limitPrice?: number;
  stopPrice?: number;
  trailPercent?: number;
  trailPrice?: number;
  extendedHours?: boolean;
  clientOrderId?: string;
}

/**
 * Validate order request
 */
function validateOrder(order: OrderRequest): { valid: boolean; error?: string } {
  // Symbol validation
  if (!order.symbol || typeof order.symbol !== 'string') {
    return { valid: false, error: 'Symbol is required' };
  }

  // Symbol format validation (basic)
  if (!/^[A-Z]{1,5}$/.test(order.symbol.toUpperCase())) {
    return { valid: false, error: 'Invalid symbol format' };
  }

  // Side validation
  if (!['buy', 'sell'].includes(order.side)) {
    return { valid: false, error: 'Side must be "buy" or "sell"' };
  }

  // Type validation
  const validTypes = ['market', 'limit', 'stop', 'stop_limit', 'trailing_stop'];
  if (!validTypes.includes(order.type)) {
    return { valid: false, error: `Invalid order type: ${order.type}` };
  }

  // Time in force validation
  const validTif = ['day', 'gtc', 'ioc', 'fok'];
  if (!validTif.includes(order.timeInForce)) {
    return { valid: false, error: `Invalid time in force: ${order.timeInForce}` };
  }

  // Quantity validation
  if (!order.qty && !order.notional) {
    return { valid: false, error: 'Quantity or notional amount is required' };
  }

  if (order.qty !== undefined) {
    if (typeof order.qty !== 'number' || order.qty <= 0) {
      return { valid: false, error: 'Quantity must be a positive number' };
    }
    if (order.qty > 100000) {
      return { valid: false, error: 'Quantity exceeds maximum allowed' };
    }
  }

  if (order.notional !== undefined) {
    if (typeof order.notional !== 'number' || order.notional <= 0) {
      return { valid: false, error: 'Notional amount must be positive' };
    }
    if (order.notional > 1000000) {
      return { valid: false, error: 'Notional amount exceeds maximum allowed' };
    }
  }

  // Limit price validation for limit orders
  if (['limit', 'stop_limit'].includes(order.type) && !order.limitPrice) {
    return { valid: false, error: 'Limit price required for limit orders' };
  }

  if (order.limitPrice !== undefined && order.limitPrice <= 0) {
    return { valid: false, error: 'Limit price must be positive' };
  }

  // Stop price validation for stop orders
  if (['stop', 'stop_limit'].includes(order.type) && !order.stopPrice) {
    return { valid: false, error: 'Stop price required for stop orders' };
  }

  if (order.stopPrice !== undefined && order.stopPrice <= 0) {
    return { valid: false, error: 'Stop price must be positive' };
  }

  // Trailing stop validation
  if (order.type === 'trailing_stop' && !order.trailPercent && !order.trailPrice) {
    return { valid: false, error: 'Trail percent or price required for trailing stop' };
  }

  return { valid: true };
}

/**
 * Check rate limit for user
 */
async function checkRateLimit(userId: string): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  const recentOrders = await db
    .collection(`users/${userId}/orders`)
    .where('submittedAt', '>', admin.firestore.Timestamp.fromMillis(windowStart))
    .get();

  return recentOrders.size < MAX_ORDERS_PER_MINUTE;
}

/**
 * Log order for audit trail
 */
async function logOrder(
  userId: string,
  order: OrderRequest,
  result: { success: boolean; orderId?: string; error?: string }
): Promise<void> {
  await db.collection('audit_logs').add({
    userId,
    action: 'submit_order',
    symbol: order.symbol,
    side: order.side,
    type: order.type,
    qty: order.qty,
    notional: order.notional,
    success: result.success,
    orderId: result.orderId,
    error: result.error,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ip: null, // Cloud Functions don't expose client IP directly
  });
}

/**
 * Execute trade via Cloud Function
 *
 * This is the secure way to submit orders:
 * - Credentials never leave the server
 * - Orders are validated server-side
 * - All trades are logged for audit
 * - Rate limiting is enforced
 */
export const executeTrade = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to execute trades'
    );
  }

  const userId = context.auth.uid;
  const order = data as OrderRequest;

  // Validate order
  const validation = validateOrder(order);
  if (!validation.valid) {
    await logOrder(userId, order, { success: false, error: validation.error });
    throw new functions.https.HttpsError('invalid-argument', validation.error!);
  }

  // Check rate limit
  const withinLimit = await checkRateLimit(userId);
  if (!withinLimit) {
    await logOrder(userId, order, {
      success: false,
      error: 'Rate limit exceeded',
    });
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many orders. Please wait before submitting more.'
    );
  }

  // Get credentials
  const credentials = await getDecryptedCredentials(userId);
  if (!credentials) {
    await logOrder(userId, order, {
      success: false,
      error: 'Credentials not found',
    });
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Alpaca credentials not configured'
    );
  }

  try {
    // Build order payload
    const baseUrl =
      credentials.environment === 'paper'
        ? 'https://paper-api.alpaca.markets'
        : 'https://api.alpaca.markets';

    const payload: Record<string, unknown> = {
      symbol: order.symbol.toUpperCase(),
      side: order.side,
      type: order.type,
      time_in_force: order.timeInForce,
    };

    if (order.qty !== undefined) {
      payload.qty = order.qty.toString();
    }
    if (order.notional !== undefined) {
      payload.notional = order.notional.toString();
    }
    if (order.limitPrice !== undefined) {
      payload.limit_price = order.limitPrice.toString();
    }
    if (order.stopPrice !== undefined) {
      payload.stop_price = order.stopPrice.toString();
    }
    if (order.trailPercent !== undefined) {
      payload.trail_percent = order.trailPercent.toString();
    }
    if (order.trailPrice !== undefined) {
      payload.trail_price = order.trailPrice.toString();
    }
    if (order.extendedHours) {
      payload.extended_hours = true;
    }
    if (order.clientOrderId) {
      payload.client_order_id = order.clientOrderId;
    }

    // Submit order to Alpaca
    const response = await fetch(`${baseUrl}/v2/orders`, {
      method: 'POST',
      headers: {
        'APCA-API-KEY-ID': credentials.apiKey,
        'APCA-API-SECRET-KEY': credentials.apiSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const error = responseData.message || `Order failed: ${response.status}`;
      await logOrder(userId, order, { success: false, error });

      throw new functions.https.HttpsError(
        'aborted',
        error
      );
    }

    // Store order in user's orders collection
    await db.doc(`users/${userId}/orders/${responseData.id}`).set({
      userId,
      alpacaOrderId: responseData.id,
      clientOrderId: responseData.client_order_id,
      symbol: responseData.symbol,
      side: responseData.side,
      type: responseData.type,
      timeInForce: responseData.time_in_force,
      qty: parseFloat(responseData.qty || '0'),
      filledQty: parseFloat(responseData.filled_qty || '0'),
      filledAvgPrice: responseData.filled_avg_price
        ? parseFloat(responseData.filled_avg_price)
        : null,
      limitPrice: responseData.limit_price
        ? parseFloat(responseData.limit_price)
        : null,
      stopPrice: responseData.stop_price
        ? parseFloat(responseData.stop_price)
        : null,
      status: responseData.status,
      extendedHours: responseData.extended_hours,
      environment: credentials.environment,
      createdAt: admin.firestore.Timestamp.fromDate(
        new Date(responseData.created_at)
      ),
      updatedAt: admin.firestore.Timestamp.fromDate(
        new Date(responseData.updated_at)
      ),
      submittedAt: admin.firestore.Timestamp.fromDate(
        new Date(responseData.submitted_at)
      ),
    });

    // Log successful order
    await logOrder(userId, order, {
      success: true,
      orderId: responseData.id,
    });

    functions.logger.info('Order executed', {
      userId,
      orderId: responseData.id,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
    });

    return {
      success: true,
      order: {
        id: responseData.id,
        symbol: responseData.symbol,
        side: responseData.side,
        type: responseData.type,
        qty: parseFloat(responseData.qty || '0'),
        status: responseData.status,
        createdAt: responseData.created_at,
        submittedAt: responseData.submitted_at,
      },
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    functions.logger.error('Order execution failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw new functions.https.HttpsError(
      'internal',
      'Order execution failed'
    );
  }
});

/**
 * Cancel order via Cloud Function
 */
export const cancelOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated'
    );
  }

  const userId = context.auth.uid;
  const { orderId } = data;

  if (!orderId || typeof orderId !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Order ID is required'
    );
  }

  const credentials = await getDecryptedCredentials(userId);
  if (!credentials) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Credentials not found'
    );
  }

  try {
    const baseUrl =
      credentials.environment === 'paper'
        ? 'https://paper-api.alpaca.markets'
        : 'https://api.alpaca.markets';

    const response = await fetch(`${baseUrl}/v2/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        'APCA-API-KEY-ID': credentials.apiKey,
        'APCA-API-SECRET-KEY': credentials.apiSecret,
      },
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.json().catch(() => ({}));
      throw new functions.https.HttpsError(
        'aborted',
        error.message || `Cancel failed: ${response.status}`
      );
    }

    // Update local order record
    await db.doc(`users/${userId}/orders/${orderId}`).update({
      status: 'pending_cancel',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log cancellation
    await db.collection('audit_logs').add({
      userId,
      action: 'cancel_order',
      orderId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info('Order cancelled', { userId, orderId });

    return { success: true };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Cancel failed');
  }
});

/**
 * Get account info via Cloud Function
 */
export const getAccountInfo = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated'
    );
  }

  const userId = context.auth.uid;
  const credentials = await getDecryptedCredentials(userId);

  if (!credentials) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Credentials not found'
    );
  }

  try {
    const baseUrl =
      credentials.environment === 'paper'
        ? 'https://paper-api.alpaca.markets'
        : 'https://api.alpaca.markets';

    const response = await fetch(`${baseUrl}/v2/account`, {
      headers: {
        'APCA-API-KEY-ID': credentials.apiKey,
        'APCA-API-SECRET-KEY': credentials.apiSecret,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new functions.https.HttpsError(
        'aborted',
        error.message || `Failed: ${response.status}`
      );
    }

    const accountData = await response.json();

    return {
      id: accountData.id,
      accountNumber: accountData.account_number,
      status: accountData.status,
      currency: accountData.currency,
      cash: parseFloat(accountData.cash),
      portfolioValue: parseFloat(accountData.portfolio_value),
      buyingPower: parseFloat(accountData.buying_power),
      patternDayTrader: accountData.pattern_day_trader,
      dayTradesRemaining:
        accountData.daytrade_count !== undefined
          ? 3 - accountData.daytrade_count
          : undefined,
      tradingBlocked: accountData.trading_blocked,
      transfersBlocked: accountData.transfers_blocked,
      accountBlocked: accountData.account_blocked,
      environment: credentials.environment,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to get account info'
    );
  }
});
