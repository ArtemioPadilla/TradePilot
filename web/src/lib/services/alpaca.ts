import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';

const PAPER_BASE_URL = 'https://paper-api.alpaca.markets';
const LIVE_BASE_URL = 'https://api.alpaca.markets';

export function getAlpacaBaseUrl(environment: string): string {
  return environment === 'live' ? LIVE_BASE_URL : PAPER_BASE_URL;
}

async function alpacaFetch(
  endpoint: string,
  apiKey: string,
  apiSecret: string,
  environment: string,
  options: RequestInit = {}
): Promise<Response> {
  const baseUrl = getAlpacaBaseUrl(environment);
  return fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'APCA-API-KEY-ID': apiKey,
      'APCA-API-SECRET-KEY': apiSecret,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

export async function getAlpacaCredentials(
  userId: string
): Promise<{ apiKey: string; apiSecret: string; environment: 'paper' | 'live' } | null> {
  const db = getFirebaseDb();
  if (!db) return null;

  const ref = doc(db, 'users', userId, 'integrations', 'alpaca');
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    apiKey: data.apiKey,
    apiSecret: data.apiSecret,
    environment: data.environment || 'paper',
  };
}

export async function testAlpacaConnection(
  apiKey: string,
  apiSecret: string,
  environment: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await alpacaFetch('/v2/account', apiKey, apiSecret, environment);
    if (response.ok) {
      const account = await response.json();
      console.log('[alpaca] connection successful, account:', account.account_number);
      return { success: true };
    }

    const error = await response.text();
    console.error('[alpaca] connection failed:', response.status, error);
    return { success: false, error: `API returned ${response.status}: ${error}` };
  } catch (error) {
    console.error('[alpaca] connection error:', error);
    return { success: false, error: String(error) };
  }
}

export async function fetchAlpacaOrders(
  apiKey: string,
  apiSecret: string,
  environment: string,
  status?: string,
  limit?: number
): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (limit) params.set('limit', String(limit));

    const endpoint = `/v2/orders${params.toString() ? '?' + params.toString() : ''}`;
    const response = await alpacaFetch(endpoint, apiKey, apiSecret, environment);
    if (!response.ok) {
      console.error('[alpaca] fetch orders failed:', response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('[alpaca] error fetching orders:', error);
    return [];
  }
}

export async function fetchAlpacaPositions(
  apiKey: string,
  apiSecret: string,
  environment: string
): Promise<any[]> {
  try {
    const response = await alpacaFetch('/v2/positions', apiKey, apiSecret, environment);
    if (!response.ok) {
      console.error('[alpaca] fetch positions failed:', response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('[alpaca] error fetching positions:', error);
    return [];
  }
}

export async function submitOrder(
  userId: string,
  order: any
): Promise<any> {
  const creds = await getAlpacaCredentials(userId);
  if (!creds) return { success: false, error: 'No Alpaca credentials configured' };

  try {
    const response = await alpacaFetch(
      '/v2/orders',
      creds.apiKey,
      creds.apiSecret,
      creds.environment,
      {
        method: 'POST',
        body: JSON.stringify({
          symbol: order.symbol,
          qty: order.qty,
          side: order.side,
          type: order.type || 'market',
          time_in_force: order.timeInForce || 'day',
          limit_price: order.limitPrice,
          stop_price: order.stopPrice,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[alpaca] submit order failed:', response.status, error);
      return { success: false, error };
    }

    const result = await response.json();
    console.log('[alpaca] order submitted:', result.id);
    return { success: true, order: result };
  } catch (error) {
    console.error('[alpaca] error submitting order:', error);
    return { success: false, error: String(error) };
  }
}

export async function cancelOrder(
  userId: string,
  orderId: string
): Promise<any> {
  const creds = await getAlpacaCredentials(userId);
  if (!creds) return { success: false, error: 'No Alpaca credentials configured' };

  try {
    const response = await alpacaFetch(
      `/v2/orders/${orderId}`,
      creds.apiKey,
      creds.apiSecret,
      creds.environment,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    console.log('[alpaca] order cancelled:', orderId);
    return { success: true };
  } catch (error) {
    console.error('[alpaca] error cancelling order:', error);
    return { success: false, error: String(error) };
  }
}

export async function saveAlpacaCredentials(
  userId: string,
  credentials: any
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firestore not initialized');

  const ref = doc(db, 'users', userId, 'integrations', 'alpaca');
  await setDoc(ref, {
    apiKey: credentials.apiKey,
    apiSecret: credentials.apiSecret,
    environment: credentials.environment || 'paper',
    savedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  console.log('[alpaca] credentials saved for user:', userId);
}

export async function deleteAlpacaCredentials(userId: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firestore not initialized');

  const ref = doc(db, 'users', userId, 'integrations', 'alpaca');
  await deleteDoc(ref);
  console.log('[alpaca] credentials deleted for user:', userId);
}
