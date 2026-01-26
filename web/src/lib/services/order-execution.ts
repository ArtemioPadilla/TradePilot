/**
 * Order Execution Service
 *
 * Handles order submission, tracking, and management with Alpaca.
 * Note: In production, order execution should go through Cloud Functions
 * for security. This service provides the client-side interface.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import {
  getAlpacaCredentials,
  getAlpacaBaseUrl,
  fetchAlpacaOrders,
} from './alpaca';
import { createNotification } from './notifications';
import { requestNotificationPermission, sendPushNotification } from './push-notifications';
import type {
  OrderRequest,
  AlpacaOrder,
  OrderStatus,
  AlpacaEnvironment,
} from '../../types/alpaca';

/**
 * Order submission result
 */
export interface OrderResult {
  success: boolean;
  order?: AlpacaOrder;
  error?: string;
}

/**
 * Local order record for Firestore
 */
export interface OrderRecord {
  id: string;
  userId: string;
  alpacaOrderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: string;
  qty?: number;
  notional?: number;
  limitPrice?: number;
  stopPrice?: number;
  status: OrderStatus;
  filledQty: number;
  filledAvgPrice?: number;
  environment: AlpacaEnvironment;
  createdAt: Date;
  updatedAt: Date;
  submittedAt: Date;
  filledAt?: Date;
  canceledAt?: Date;
}

/**
 * Submit an order to Alpaca
 */
export async function submitOrder(
  userId: string,
  orderRequest: OrderRequest
): Promise<OrderResult> {
  try {
    // Get credentials
    const credentials = await getAlpacaCredentials(userId);

    if (!credentials) {
      return {
        success: false,
        error: 'Alpaca credentials not found. Please connect your account.',
      };
    }

    // Validate order
    const validation = validateOrder(orderRequest);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Build order payload
    const orderPayload = buildOrderPayload(orderRequest);

    // Submit to Alpaca
    const baseUrl = getAlpacaBaseUrl(credentials.environment);
    const response = await fetch(`${baseUrl}/v2/orders`, {
      method: 'POST',
      headers: {
        'APCA-API-KEY-ID': credentials.apiKey,
        'APCA-API-SECRET-KEY': credentials.apiSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Order failed: ${response.status}`,
      };
    }

    const orderData = await response.json();

    // Map response to AlpacaOrder
    const order = mapOrderResponse(orderData);

    // Store order in Firestore
    await storeOrder(userId, order, credentials.environment);

    // Send trade confirmation notifications
    await sendTradeConfirmation(userId, order, orderRequest);

    return {
      success: true,
      order,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Order submission failed',
    };
  }
}

/**
 * Send trade confirmation notifications (in-app and push)
 */
async function sendTradeConfirmation(
  userId: string,
  order: AlpacaOrder,
  request: OrderRequest
): Promise<void> {
  const isBuy = order.side === 'buy';
  const orderTypeLabel = request.type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const title = `${isBuy ? 'Buy' : 'Sell'} Order Submitted`;
  const message = `Your ${orderTypeLabel.toLowerCase()} order to ${isBuy ? 'buy' : 'sell'} ${
    order.qty
  } shares of ${order.symbol} has been submitted.`;

  // Create in-app notification
  try {
    await createNotification(userId, {
      title,
      message,
      severity: 'success',
      link: '/dashboard/trading?tab=orders',
      metadata: {
        orderId: order.id,
        symbol: order.symbol,
        side: order.side,
        qty: order.qty,
        type: order.type,
        status: order.status,
      },
    });
  } catch (error) {
    console.error('Failed to create in-app notification:', error);
  }

  // Send push notification
  try {
    await sendPushNotification({
      title,
      body: message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: `order-${order.id}`,
      data: {
        url: '/dashboard/trading?tab=orders',
        orderId: order.id,
      },
    });
  } catch (error) {
    // Push notification failure is non-critical
    console.log('Push notification not sent:', error);
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(
  userId: string,
  orderId: string
): Promise<OrderResult> {
  try {
    const credentials = await getAlpacaCredentials(userId);

    if (!credentials) {
      return {
        success: false,
        error: 'Alpaca credentials not found',
      };
    }

    const baseUrl = getAlpacaBaseUrl(credentials.environment);
    const response = await fetch(`${baseUrl}/v2/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        'APCA-API-KEY-ID': credentials.apiKey,
        'APCA-API-SECRET-KEY': credentials.apiSecret,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Cancel failed: ${response.status}`,
      };
    }

    // Update local record
    await updateOrderStatus(userId, orderId, 'pending_cancel');

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cancel failed',
    };
  }
}

/**
 * Replace/modify an order
 */
export async function replaceOrder(
  userId: string,
  orderId: string,
  updates: {
    qty?: number;
    limitPrice?: number;
    stopPrice?: number;
    timeInForce?: string;
  }
): Promise<OrderResult> {
  try {
    const credentials = await getAlpacaCredentials(userId);

    if (!credentials) {
      return {
        success: false,
        error: 'Alpaca credentials not found',
      };
    }

    const baseUrl = getAlpacaBaseUrl(credentials.environment);
    const response = await fetch(`${baseUrl}/v2/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'APCA-API-KEY-ID': credentials.apiKey,
        'APCA-API-SECRET-KEY': credentials.apiSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Replace failed: ${response.status}`,
      };
    }

    const orderData = await response.json();
    const order = mapOrderResponse(orderData);

    return {
      success: true,
      order,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Replace failed',
    };
  }
}

/**
 * Get orders from Alpaca and sync to Firestore
 */
export async function syncOrders(
  userId: string,
  status: 'open' | 'closed' | 'all' = 'all',
  limit: number = 100
): Promise<AlpacaOrder[]> {
  const credentials = await getAlpacaCredentials(userId);

  if (!credentials) {
    throw new Error('Alpaca credentials not found');
  }

  const orders = await fetchAlpacaOrders(
    credentials.apiKey,
    credentials.apiSecret,
    credentials.environment,
    status,
    limit
  );

  // Update local records
  for (const order of orders) {
    await storeOrder(userId, order, credentials.environment);
  }

  return orders;
}

/**
 * Get orders from local Firestore
 */
export async function getLocalOrders(
  userId: string,
  options: {
    status?: 'open' | 'filled' | 'canceled' | 'all';
    symbol?: string;
    limit?: number;
  } = {}
): Promise<OrderRecord[]> {
  const ordersRef = collection(getFirebaseDb(), `users/${userId}/orders`);

  let q = query(ordersRef, orderBy('createdAt', 'desc'));

  if (options.status && options.status !== 'all') {
    const statusMap: Record<string, OrderStatus[]> = {
      open: ['new', 'accepted', 'pending_new', 'partially_filled'],
      filled: ['filled'],
      canceled: ['canceled', 'expired', 'rejected'],
    };
    // Note: Firestore doesn't support 'in' with orderBy on different field
    // This is a simplified version - production would use compound queries
  }

  if (options.limit) {
    q = query(q, limit(options.limit));
  }

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      alpacaOrderId: data.alpacaOrderId,
      symbol: data.symbol,
      side: data.side,
      type: data.type,
      qty: data.qty,
      notional: data.notional,
      limitPrice: data.limitPrice,
      stopPrice: data.stopPrice,
      status: data.status,
      filledQty: data.filledQty,
      filledAvgPrice: data.filledAvgPrice,
      environment: data.environment,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      submittedAt: data.submittedAt?.toDate(),
      filledAt: data.filledAt?.toDate(),
      canceledAt: data.canceledAt?.toDate(),
    };
  });
}

// Helper functions

function validateOrder(order: OrderRequest): { valid: boolean; error?: string } {
  if (!order.symbol || order.symbol.trim() === '') {
    return { valid: false, error: 'Symbol is required' };
  }

  if (!order.qty && !order.notional) {
    return { valid: false, error: 'Quantity or dollar amount is required' };
  }

  if (order.qty && order.qty <= 0) {
    return { valid: false, error: 'Quantity must be positive' };
  }

  if (order.notional && order.notional <= 0) {
    return { valid: false, error: 'Dollar amount must be positive' };
  }

  if ((order.type === 'limit' || order.type === 'stop_limit') && !order.limitPrice) {
    return { valid: false, error: 'Limit price is required for limit orders' };
  }

  if ((order.type === 'stop' || order.type === 'stop_limit') && !order.stopPrice) {
    return { valid: false, error: 'Stop price is required for stop orders' };
  }

  if (order.type === 'trailing_stop' && !order.trailPercent && !order.trailPrice) {
    return { valid: false, error: 'Trail percent or price is required for trailing stop orders' };
  }

  return { valid: true };
}

function buildOrderPayload(order: OrderRequest): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    symbol: order.symbol.toUpperCase(),
    side: order.side,
    type: order.type,
    time_in_force: order.timeInForce,
  };

  if (order.qty) {
    payload.qty = order.qty.toString();
  }

  if (order.notional) {
    payload.notional = order.notional.toString();
  }

  if (order.limitPrice) {
    payload.limit_price = order.limitPrice.toString();
  }

  if (order.stopPrice) {
    payload.stop_price = order.stopPrice.toString();
  }

  if (order.trailPercent) {
    payload.trail_percent = order.trailPercent.toString();
  }

  if (order.trailPrice) {
    payload.trail_price = order.trailPrice.toString();
  }

  if (order.extendedHours) {
    payload.extended_hours = true;
  }

  if (order.clientOrderId) {
    payload.client_order_id = order.clientOrderId;
  }

  return payload;
}

function mapOrderResponse(data: Record<string, unknown>): AlpacaOrder {
  return {
    id: data.id as string,
    clientOrderId: data.client_order_id as string,
    symbol: data.symbol as string,
    assetId: data.asset_id as string,
    assetClass: data.asset_class as 'us_equity' | 'crypto',
    side: data.side as 'buy' | 'sell',
    type: data.type as any,
    timeInForce: data.time_in_force as any,
    qty: parseFloat(data.qty as string),
    filledQty: parseFloat(data.filled_qty as string),
    filledAvgPrice: data.filled_avg_price
      ? parseFloat(data.filled_avg_price as string)
      : undefined,
    limitPrice: data.limit_price
      ? parseFloat(data.limit_price as string)
      : undefined,
    stopPrice: data.stop_price
      ? parseFloat(data.stop_price as string)
      : undefined,
    status: data.status as OrderStatus,
    extendedHours: data.extended_hours as boolean,
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
    submittedAt: new Date(data.submitted_at as string),
    filledAt: data.filled_at ? new Date(data.filled_at as string) : undefined,
    expiredAt: data.expired_at ? new Date(data.expired_at as string) : undefined,
    canceledAt: data.canceled_at ? new Date(data.canceled_at as string) : undefined,
  };
}

async function storeOrder(
  userId: string,
  order: AlpacaOrder,
  environment: AlpacaEnvironment
): Promise<void> {
  const orderRef = doc(getFirebaseDb(), `users/${userId}/orders`, order.id);

  await setDoc(
    orderRef,
    {
      userId,
      alpacaOrderId: order.id,
      clientOrderId: order.clientOrderId,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      timeInForce: order.timeInForce,
      qty: order.qty,
      filledQty: order.filledQty,
      filledAvgPrice: order.filledAvgPrice,
      limitPrice: order.limitPrice,
      stopPrice: order.stopPrice,
      status: order.status,
      extendedHours: order.extendedHours,
      environment,
      createdAt: Timestamp.fromDate(order.createdAt),
      updatedAt: Timestamp.fromDate(order.updatedAt),
      submittedAt: Timestamp.fromDate(order.submittedAt),
      filledAt: order.filledAt ? Timestamp.fromDate(order.filledAt) : null,
      canceledAt: order.canceledAt ? Timestamp.fromDate(order.canceledAt) : null,
      expiredAt: order.expiredAt ? Timestamp.fromDate(order.expiredAt) : null,
    },
    { merge: true }
  );
}

async function updateOrderStatus(
  userId: string,
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const orderRef = doc(getFirebaseDb(), `users/${userId}/orders`, orderId);
  await updateDoc(orderRef, {
    status,
    updatedAt: Timestamp.now(),
  });
}

export default submitOrder;
