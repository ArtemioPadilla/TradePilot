// TODO: implement with real Firebase/API calls

const PAPER_BASE_URL = 'https://paper-api.alpaca.markets';
const LIVE_BASE_URL = 'https://api.alpaca.markets';

/**
 * Retrieve stored Alpaca API credentials for a user.
 */
export async function getAlpacaCredentials(
  userId: string
): Promise<{ apiKey: string; apiSecret: string; environment: 'paper' | 'live' } | null> {
  // TODO: read from Firestore users/{userId}/integrations/alpaca
  console.warn('[alpaca] getAlpacaCredentials is a stub');
  return null;
}

/**
 * Verify that the provided Alpaca credentials are valid.
 */
export async function testAlpacaConnection(
  apiKey: string,
  apiSecret: string,
  environment: string
): Promise<{ success: boolean; error?: string }> {
  // TODO: call Alpaca /v2/account endpoint to verify
  console.warn('[alpaca] testAlpacaConnection is a stub');
  return { success: false, error: 'Not implemented' };
}

/**
 * Fetch orders from Alpaca.
 */
export async function fetchAlpacaOrders(
  apiKey: string,
  apiSecret: string,
  environment: string,
  status?: string,
  limit?: number
): Promise<any[]> {
  // TODO: call Alpaca /v2/orders endpoint
  console.warn('[alpaca] fetchAlpacaOrders is a stub');
  return [];
}

/**
 * Fetch current positions from Alpaca.
 */
export async function fetchAlpacaPositions(
  apiKey: string,
  apiSecret: string,
  environment: string
): Promise<any[]> {
  // TODO: call Alpaca /v2/positions endpoint
  console.warn('[alpaca] fetchAlpacaPositions is a stub');
  return [];
}

/**
 * Submit a new order through Alpaca.
 */
export async function submitOrder(
  userId: string,
  order: any
): Promise<any> {
  // TODO: call Alpaca /v2/orders POST endpoint
  console.warn('[alpaca] submitOrder is a stub');
  return { success: false, error: 'Not implemented' };
}

/**
 * Cancel an existing order.
 */
export async function cancelOrder(
  userId: string,
  orderId: string
): Promise<any> {
  // TODO: call Alpaca /v2/orders/{orderId} DELETE endpoint
  console.warn('[alpaca] cancelOrder is a stub');
  return { success: false, error: 'Not implemented' };
}

/**
 * Persist Alpaca credentials to Firestore (encrypted at rest).
 */
export async function saveAlpacaCredentials(
  userId: string,
  credentials: any
): Promise<void> {
  // TODO: write to Firestore users/{userId}/integrations/alpaca
  console.warn('[alpaca] saveAlpacaCredentials is a stub');
}

/**
 * Remove stored Alpaca credentials.
 */
export async function deleteAlpacaCredentials(userId: string): Promise<void> {
  // TODO: delete Firestore document
  console.warn('[alpaca] deleteAlpacaCredentials is a stub');
}

/**
 * Return the base URL for the given Alpaca environment.
 */
export function getAlpacaBaseUrl(environment: string): string {
  return environment === 'live' ? LIVE_BASE_URL : PAPER_BASE_URL;
}
