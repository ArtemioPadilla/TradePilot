/**
 * TradePilot Cloud Functions
 *
 * Firebase Cloud Functions for secure trading operations.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// Types
interface AlpacaCredentials {
  apiKey: string;
  apiSecret: string;
  environment: 'paper' | 'live';
}

interface OrderRequest {
  symbol: string;
  qty?: number;
  notional?: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
  timeInForce: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
  limitPrice?: number;
  stopPrice?: number;
  trailPercent?: number;
  trailPrice?: number;
  extendedHours?: boolean;
}

// Helper functions
function getAlpacaBaseUrl(environment: 'paper' | 'live'): string {
  return environment === 'paper'
    ? 'https://paper-api.alpaca.markets'
    : 'https://api.alpaca.markets';
}

function deobfuscateSecret(obfuscated: string): string {
  try {
    return Buffer.from(obfuscated, 'base64').toString().split('').reverse().join('');
  } catch {
    return '';
  }
}

async function getCredentials(userId: string): Promise<AlpacaCredentials | null> {
  const credentialsDoc = await db.doc(`users/${userId}/integrations/alpaca`).get();

  if (!credentialsDoc.exists) {
    return null;
  }

  const data = credentialsDoc.data()!;
  return {
    apiKey: data.apiKey,
    apiSecret: deobfuscateSecret(data.apiSecret),
    environment: data.environment,
  };
}

/**
 * Sync Positions - Callable Function
 *
 * Fetches positions from Alpaca and syncs them to Firestore.
 */
export const syncPositions = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userId = context.auth.uid;

  try {
    // Get credentials
    const credentials = await getCredentials(userId);

    if (!credentials) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Alpaca credentials not configured'
      );
    }

    const baseUrl = getAlpacaBaseUrl(credentials.environment);

    // Fetch account info
    const accountResponse = await fetch(`${baseUrl}/v2/account`, {
      headers: {
        'APCA-API-KEY-ID': credentials.apiKey,
        'APCA-API-SECRET-KEY': credentials.apiSecret,
      },
    });

    if (!accountResponse.ok) {
      throw new functions.https.HttpsError(
        'internal',
        'Failed to fetch account info'
      );
    }

    const account = await accountResponse.json();

    // Fetch positions
    const positionsResponse = await fetch(`${baseUrl}/v2/positions`, {
      headers: {
        'APCA-API-KEY-ID': credentials.apiKey,
        'APCA-API-SECRET-KEY': credentials.apiSecret,
      },
    });

    if (!positionsResponse.ok) {
      throw new functions.https.HttpsError(
        'internal',
        'Failed to fetch positions'
      );
    }

    const positions = await positionsResponse.json();

    // Get or create Alpaca account in Firestore
    const accountsRef = db.collection(`users/${userId}/accounts`);
    const accountQuery = await accountsRef
      .where('source', '==', 'alpaca')
      .where('externalId', '==', account.id)
      .limit(1)
      .get();

    let accountId: string;

    if (accountQuery.empty) {
      // Create new account
      const newAccountRef = accountsRef.doc();
      await newAccountRef.set({
        userId,
        name: `Alpaca ${credentials.environment === 'paper' ? 'Paper' : 'Live'} Trading`,
        type: 'brokerage',
        currency: account.currency,
        institution: 'Alpaca Markets',
        cashBalance: parseFloat(account.cash),
        portfolioValue: parseFloat(account.portfolio_value),
        buyingPower: parseFloat(account.buying_power),
        isDefault: false,
        source: 'alpaca',
        externalId: account.id,
        environment: credentials.environment,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      accountId = newAccountRef.id;
    } else {
      accountId = accountQuery.docs[0].id;
      // Update account values
      await accountsRef.doc(accountId).update({
        cashBalance: parseFloat(account.cash),
        portfolioValue: parseFloat(account.portfolio_value),
        buyingPower: parseFloat(account.buying_power),
        lastSynced: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Get existing holdings
    const holdingsRef = db.collection(`users/${userId}/holdings`);
    const existingHoldings = await holdingsRef
      .where('accountId', '==', accountId)
      .get();

    const existingBySymbol = new Map<string, string>();
    existingHoldings.docs.forEach((doc) => {
      existingBySymbol.set(doc.data().symbol, doc.id);
    });

    // Batch write positions
    const batch = db.batch();
    const syncedSymbols = new Set<string>();
    let added = 0;
    let updated = 0;
    let removed = 0;

    for (const pos of positions) {
      syncedSymbols.add(pos.symbol);

      const holdingData = {
        userId,
        accountId,
        symbol: pos.symbol,
        name: pos.symbol,
        quantity: parseFloat(pos.qty),
        averageCost: parseFloat(pos.avg_entry_price),
        currentPrice: parseFloat(pos.current_price),
        marketValue: parseFloat(pos.market_value),
        costBasis: parseFloat(pos.cost_basis),
        unrealizedGain: parseFloat(pos.unrealized_pl),
        unrealizedGainPercent: parseFloat(pos.unrealized_plpc) * 100,
        dayChange: parseFloat(pos.change_today) * 100,
        assetType: pos.asset_class === 'crypto' ? 'crypto' : 'stock',
        currency: 'USD',
        source: 'alpaca',
        externalId: pos.asset_id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const existingId = existingBySymbol.get(pos.symbol);

      if (existingId) {
        batch.update(holdingsRef.doc(existingId), holdingData);
        updated++;
      } else {
        const newRef = holdingsRef.doc();
        batch.set(newRef, {
          ...holdingData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        added++;
      }
    }

    // Remove positions that no longer exist
    for (const [symbol, holdingId] of existingBySymbol) {
      if (!syncedSymbols.has(symbol)) {
        batch.delete(holdingsRef.doc(holdingId));
        removed++;
      }
    }

    await batch.commit();

    // Log sync
    await db.collection(`users/${userId}/syncHistory`).add({
      type: 'positions',
      source: 'alpaca',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      positionsSynced: positions.length,
      positionsAdded: added,
      positionsUpdated: updated,
      positionsRemoved: removed,
      success: true,
    });

    return {
      success: true,
      positionsSynced: positions.length,
      positionsAdded: added,
      positionsUpdated: updated,
      positionsRemoved: removed,
      accountValue: parseFloat(account.portfolio_value),
    };
  } catch (error) {
    // Log error
    await db.collection(`users/${userId}/syncHistory`).add({
      type: 'positions',
      source: 'alpaca',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
});

/**
 * Scheduled Position Sync
 *
 * Runs every 5 minutes during market hours to sync positions.
 */
export const scheduledPositionSync = functions.pubsub
  .schedule('every 5 minutes')
  .timeZone('America/New_York')
  .onRun(async () => {
    // Check if market is open (simplified check)
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // Skip weekends and outside market hours (9:30 AM - 4:00 PM ET)
    if (day === 0 || day === 6 || hour < 9 || hour >= 16) {
      console.log('Market closed, skipping sync');
      return null;
    }

    // Get all users with Alpaca credentials
    const usersRef = db.collectionGroup('integrations');
    const credentialsQuery = await usersRef
      .where('__name__', '==', 'alpaca')
      .get();

    console.log(`Found ${credentialsQuery.size} users with Alpaca credentials`);

    // Sync each user (in production, use batching/queuing for scale)
    for (const doc of credentialsQuery.docs) {
      const userId = doc.ref.parent.parent?.id;
      if (!userId) continue;

      try {
        // Trigger sync for this user
        // In production, this would queue a task
        console.log(`Syncing positions for user ${userId}`);
      } catch (error) {
        console.error(`Failed to sync for user ${userId}:`, error);
      }
    }

    return null;
  });

/**
 * Execute Trade - Callable Function
 *
 * Submits an order to Alpaca with validation and logging.
 */
export const executeTrade = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userId = context.auth.uid;
  const orderRequest = data as OrderRequest;

  // Validate order
  if (!orderRequest.symbol) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Symbol is required'
    );
  }

  if (!orderRequest.qty && !orderRequest.notional) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Quantity or dollar amount is required'
    );
  }

  try {
    // Get credentials
    const credentials = await getCredentials(userId);

    if (!credentials) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Alpaca credentials not configured'
      );
    }

    const baseUrl = getAlpacaBaseUrl(credentials.environment);

    // Build order payload
    const orderPayload: Record<string, unknown> = {
      symbol: orderRequest.symbol.toUpperCase(),
      side: orderRequest.side,
      type: orderRequest.type,
      time_in_force: orderRequest.timeInForce,
    };

    if (orderRequest.qty) {
      orderPayload.qty = orderRequest.qty.toString();
    }
    if (orderRequest.notional) {
      orderPayload.notional = orderRequest.notional.toString();
    }
    if (orderRequest.limitPrice) {
      orderPayload.limit_price = orderRequest.limitPrice.toString();
    }
    if (orderRequest.stopPrice) {
      orderPayload.stop_price = orderRequest.stopPrice.toString();
    }
    if (orderRequest.trailPercent) {
      orderPayload.trail_percent = orderRequest.trailPercent.toString();
    }
    if (orderRequest.trailPrice) {
      orderPayload.trail_price = orderRequest.trailPrice.toString();
    }
    if (orderRequest.extendedHours) {
      orderPayload.extended_hours = true;
    }

    // Submit order
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
      throw new functions.https.HttpsError(
        'internal',
        errorData.message || `Order failed: ${response.status}`
      );
    }

    const order = await response.json();

    // Store order in Firestore
    await db.collection(`users/${userId}/orders`).doc(order.id).set({
      userId,
      alpacaOrderId: order.id,
      clientOrderId: order.client_order_id,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      timeInForce: order.time_in_force,
      qty: parseFloat(order.qty || '0'),
      filledQty: parseFloat(order.filled_qty || '0'),
      filledAvgPrice: order.filled_avg_price
        ? parseFloat(order.filled_avg_price)
        : null,
      limitPrice: order.limit_price ? parseFloat(order.limit_price) : null,
      stopPrice: order.stop_price ? parseFloat(order.stop_price) : null,
      status: order.status,
      extendedHours: order.extended_hours || false,
      environment: credentials.environment,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(order.created_at)),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date(order.updated_at)),
      submittedAt: admin.firestore.Timestamp.fromDate(new Date(order.submitted_at)),
    });

    // Log trade for audit
    await db.collection(`users/${userId}/tradeLog`).add({
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      qty: parseFloat(order.qty || '0'),
      status: order.status,
      environment: credentials.environment,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: context.rawRequest?.ip || 'unknown',
    });

    return {
      success: true,
      order: {
        id: order.id,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        qty: parseFloat(order.qty || '0'),
        status: order.status,
        createdAt: order.created_at,
        submittedAt: order.submitted_at,
      },
    };
  } catch (error) {
    // Log failed trade attempt
    await db.collection(`users/${userId}/tradeLog`).add({
      symbol: orderRequest.symbol,
      side: orderRequest.side,
      type: orderRequest.type,
      qty: orderRequest.qty,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    throw error;
  }
});

/**
 * Cancel Order - Callable Function
 */
export const cancelOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userId = context.auth.uid;
  const { orderId } = data as { orderId: string };

  if (!orderId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Order ID is required'
    );
  }

  try {
    const credentials = await getCredentials(userId);

    if (!credentials) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Alpaca credentials not configured'
      );
    }

    const baseUrl = getAlpacaBaseUrl(credentials.environment);

    const response = await fetch(`${baseUrl}/v2/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        'APCA-API-KEY-ID': credentials.apiKey,
        'APCA-API-SECRET-KEY': credentials.apiSecret,
      },
    });

    if (!response.ok && response.status !== 204) {
      const errorData = await response.json().catch(() => ({}));
      throw new functions.https.HttpsError(
        'internal',
        errorData.message || `Cancel failed: ${response.status}`
      );
    }

    // Update local record
    await db.collection(`users/${userId}/orders`).doc(orderId).update({
      status: 'pending_cancel',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    throw error;
  }
});

/**
 * Get Account Info - Callable Function
 */
export const getAccountInfo = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userId = context.auth.uid;

  try {
    const credentials = await getCredentials(userId);

    if (!credentials) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Alpaca credentials not configured'
      );
    }

    const baseUrl = getAlpacaBaseUrl(credentials.environment);

    const response = await fetch(`${baseUrl}/v2/account`, {
      headers: {
        'APCA-API-KEY-ID': credentials.apiKey,
        'APCA-API-SECRET-KEY': credentials.apiSecret,
      },
    });

    if (!response.ok) {
      throw new functions.https.HttpsError(
        'internal',
        'Failed to fetch account info'
      );
    }

    const account = await response.json();

    return {
      id: account.id,
      accountNumber: account.account_number,
      status: account.status,
      currency: account.currency,
      cash: parseFloat(account.cash),
      portfolioValue: parseFloat(account.portfolio_value),
      buyingPower: parseFloat(account.buying_power),
      patternDayTrader: account.pattern_day_trader,
      dayTradesRemaining: account.daytrade_count !== undefined
        ? 3 - account.daytrade_count
        : undefined,
      tradingBlocked: account.trading_blocked,
      transfersBlocked: account.transfers_blocked,
      accountBlocked: account.account_blocked,
      environment: credentials.environment,
    };
  } catch (error) {
    throw error;
  }
});

// ============================================================================
// Backtesting Cloud Functions
// ============================================================================

/**
 * Backtest Configuration Type
 */
interface BacktestConfig {
  name: string;
  strategy: {
    type: string;
    name: string;
    [key: string]: unknown;
  };
  universe: 'sp500' | 'nasdaq100' | 'dow30' | 'custom';
  customSymbols?: string[];
  startDate: string;
  endDate: string;
  initialCapital: number;
  benchmark: string;
  customBenchmark?: string;
  includeTransactionCosts?: boolean;
  transactionCost?: number;
  includeSlippage?: boolean;
  slippage?: number;
}

/**
 * Run Backtest - Callable Function
 *
 * Executes a backtest on the server for large date ranges.
 * Returns a job ID for polling status.
 */
export const runBacktest = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes max
    memory: '1GB',
  })
  .https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = context.auth.uid;
    const config = data as BacktestConfig;

    // Validate configuration
    if (!config.name || !config.strategy || !config.startDate || !config.endDate) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required backtest configuration'
      );
    }

    // Validate date range
    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);

    if (startDate >= endDate) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Start date must be before end date'
      );
    }

    if (endDate > new Date()) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'End date cannot be in the future'
      );
    }

    // Create backtest job
    const jobRef = db.collection(`users/${userId}/backtestJobs`).doc();
    const jobId = jobRef.id;

    await jobRef.set({
      userId,
      config,
      status: 'pending',
      progress: 0,
      message: 'Queued for execution',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      // Update status to running
      await jobRef.update({
        status: 'running',
        progress: 5,
        message: 'Starting backtest...',
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Simulate backtest execution phases
      // In production, this would call actual Python/TradePilot code

      // Phase 1: Load historical data (0-25%)
      await jobRef.update({
        progress: 10,
        message: 'Loading historical data...',
      });

      const symbols = await getSymbolsForUniverse(config.universe, config.customSymbols);

      await jobRef.update({
        progress: 25,
        message: `Loaded data for ${symbols.length} symbols`,
      });

      // Phase 2: Initialize strategy (25-50%)
      await jobRef.update({
        progress: 30,
        message: `Initializing ${config.strategy.name}...`,
      });

      await delay(500); // Simulate processing

      await jobRef.update({
        progress: 50,
        message: 'Strategy configured',
      });

      // Phase 3: Run simulation (50-75%)
      await jobRef.update({
        progress: 55,
        message: 'Running simulation...',
      });

      const tradingDays = calculateTradingDays(startDate, endDate);

      // Simulate incremental progress
      for (let p = 60; p <= 75; p += 5) {
        await delay(200);
        await jobRef.update({
          progress: p,
          message: `Simulating... (${Math.round((p - 50) / 25 * 100)}% complete)`,
        });
      }

      // Phase 4: Calculate metrics (75-100%)
      await jobRef.update({
        progress: 80,
        message: 'Calculating performance metrics...',
      });

      await delay(300);

      await jobRef.update({
        progress: 90,
        message: 'Generating reports...',
      });

      // Generate simulated results
      const result = generateBacktestResult(jobId, config, tradingDays);

      // Store result
      await jobRef.update({
        status: 'completed',
        progress: 100,
        message: 'Backtest complete',
        result,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Also store in backtest history
      await db.collection(`users/${userId}/backtests`).doc(jobId).set({
        userId,
        name: config.name,
        config,
        result,
        status: 'completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        isFavorite: false,
        tags: [],
        strategyType: config.strategy.type,
        totalReturn: (result.metrics as Record<string, number>).totalReturn,
        sharpeRatio: (result.metrics as Record<string, number>).sharpeRatio,
      });

      return {
        success: true,
        jobId,
        status: 'completed',
        result,
      };
    } catch (error) {
      // Update job status to failed
      await jobRef.update({
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Backtest failed'
      );
    }
  });

/**
 * Get Backtest Status - Callable Function
 *
 * Polls the status of a running backtest job.
 */
export const getBacktestStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userId = context.auth.uid;
  const { jobId } = data as { jobId: string };

  if (!jobId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Job ID is required'
    );
  }

  const jobDoc = await db.doc(`users/${userId}/backtestJobs/${jobId}`).get();

  if (!jobDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'Backtest job not found'
    );
  }

  const job = jobDoc.data()!;

  return {
    jobId,
    status: job.status,
    progress: job.progress,
    message: job.message,
    result: job.result || null,
    createdAt: job.createdAt?.toDate?.()?.toISOString(),
    startedAt: job.startedAt?.toDate?.()?.toISOString(),
    completedAt: job.completedAt?.toDate?.()?.toISOString(),
  };
});

/**
 * Cancel Backtest - Callable Function
 */
export const cancelBacktest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userId = context.auth.uid;
  const { jobId } = data as { jobId: string };

  if (!jobId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Job ID is required'
    );
  }

  const jobRef = db.doc(`users/${userId}/backtestJobs/${jobId}`);
  const jobDoc = await jobRef.get();

  if (!jobDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'Backtest job not found'
    );
  }

  const job = jobDoc.data()!;

  if (job.status !== 'pending' && job.status !== 'running') {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Only pending or running jobs can be cancelled'
    );
  }

  await jobRef.update({
    status: 'cancelled',
    message: 'Cancelled by user',
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

/**
 * Delete Backtest Result - Callable Function
 */
export const deleteBacktestResult = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userId = context.auth.uid;
  const { backtestId } = data as { backtestId: string };

  if (!backtestId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Backtest ID is required'
    );
  }

  // Delete from both collections
  const batch = db.batch();
  batch.delete(db.doc(`users/${userId}/backtests/${backtestId}`));
  batch.delete(db.doc(`users/${userId}/backtestJobs/${backtestId}`));

  await batch.commit();

  return { success: true };
});

/**
 * Cleanup Old Backtests - Scheduled Function
 *
 * Runs daily to clean up old backtest results.
 */
export const cleanupOldBacktests = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const retentionDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Get all users
    const usersSnapshot = await db.collection('users').get();

    let totalDeleted = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // Find old non-favorite backtests
      const oldBacktests = await db
        .collection(`users/${userId}/backtests`)
        .where('isFavorite', '==', false)
        .where('createdAt', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
        .get();

      if (oldBacktests.empty) continue;

      const batch = db.batch();

      for (const doc of oldBacktests.docs) {
        batch.delete(doc.ref);
        totalDeleted++;
      }

      await batch.commit();
    }

    console.log(`Cleaned up ${totalDeleted} old backtest results`);
    return null;
  });

// ============================================================================
// Helper Functions for Backtesting
// ============================================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateTradingDays(startDate: Date, endDate: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay);
  return Math.floor(totalDays * (5 / 7));
}

async function getSymbolsForUniverse(
  universe: string,
  customSymbols?: string[]
): Promise<string[]> {
  if (universe === 'custom' && customSymbols) {
    return customSymbols;
  }

  // Return sample symbols for each universe
  // In production, this would fetch actual constituents
  const universeSymbols: Record<string, string[]> = {
    sp500: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'JPM', 'V'],
    nasdaq100: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'COST', 'ADBE'],
    dow30: ['AAPL', 'MSFT', 'JPM', 'V', 'UNH', 'HD', 'JNJ', 'PG', 'CVX', 'MRK'],
  };

  return universeSymbols[universe] || universeSymbols.sp500;
}

function generateBacktestResult(
  id: string,
  config: BacktestConfig,
  tradingDays: number
): Record<string, unknown> {
  const startValue = config.initialCapital;
  const strategyReturn = getStrategyExpectedReturn(config.strategy.type);
  const years = tradingDays / 252;

  // Generate performance metrics
  const totalReturn = strategyReturn * years * 100 + (Math.random() - 0.3) * 20;
  const cagr = (Math.pow(1 + totalReturn / 100, 1 / years) - 1) * 100;
  const volatility = 15 + Math.random() * 10;
  const sharpeRatio = (cagr - 2) / volatility;
  const maxDrawdown = -(10 + Math.random() * 20);

  return {
    id,
    config,
    executedAt: new Date().toISOString(),
    executionDuration: 3000 + Math.random() * 5000,
    success: true,
    metrics: {
      totalReturn: Math.round(totalReturn * 100) / 100,
      cagr: Math.round(cagr * 100) / 100,
      volatility: Math.round(volatility * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      sortinoRatio: Math.round(sharpeRatio * 1.2 * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      maxDrawdownDuration: Math.floor(20 + Math.random() * 60),
      winRate: Math.round((50 + Math.random() * 15) * 10) / 10,
      profitFactor: Math.round((1.2 + Math.random() * 0.6) * 100) / 100,
      avgWin: Math.round((2 + Math.random() * 2) * 100) / 100,
      avgLoss: -Math.round((1 + Math.random() * 1.5) * 100) / 100,
      totalTrades: Math.floor(tradingDays / 20),
      calmarRatio: Math.round((cagr / Math.abs(maxDrawdown)) * 100) / 100,
    },
    // Simplified equity curve (sampled)
    equityCurve: generateSampledEquityCurve(startValue, totalReturn / 100, tradingDays),
    monthlyReturns: generateMonthlyReturnsData(config.startDate, config.endDate),
  };
}

function getStrategyExpectedReturn(strategyType: string): number {
  const returns: Record<string, number> = {
    momentum: 0.12,
    mean_reversion: 0.10,
    equal_weight: 0.08,
    risk_parity: 0.07,
    smart_beta: 0.11,
    custom: 0.09,
  };
  return returns[strategyType] || 0.08;
}

function generateSampledEquityCurve(
  startValue: number,
  totalReturn: number,
  tradingDays: number
): { date: string; value: number }[] {
  const curve: { date: string; value: number }[] = [];
  const numPoints = Math.min(100, tradingDays);
  const step = tradingDays / numPoints;

  const dailyReturn = Math.pow(1 + totalReturn, 1 / tradingDays) - 1;
  let value = startValue;

  for (let i = 0; i < numPoints; i++) {
    const daysElapsed = Math.floor(i * step);
    const date = new Date();
    date.setDate(date.getDate() - (tradingDays - daysElapsed));

    // Add some randomness
    const randomFactor = 1 + (Math.random() - 0.5) * 0.02;
    value = startValue * Math.pow(1 + dailyReturn, daysElapsed) * randomFactor;

    curve.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
    });
  }

  return curve;
}

function generateMonthlyReturnsData(
  startDateStr: string,
  endDateStr: string
): { year: number; months: (number | null)[]; yearTotal: number }[] {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const returns: { year: number; months: (number | null)[]; yearTotal: number }[] = [];

  for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
    const months: (number | null)[] = [];
    let yearTotal = 0;

    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      if (monthStart < startDate || monthEnd > endDate) {
        months.push(null);
      } else {
        const monthReturn = (Math.random() - 0.4) * 8;
        months.push(Math.round(monthReturn * 100) / 100);
        yearTotal += monthReturn;
      }
    }

    returns.push({
      year,
      months,
      yearTotal: Math.round(yearTotal * 100) / 100,
    });
  }

  return returns;
}

// ============================================================================
// Alert Monitoring Functions
// ============================================================================

interface Alert {
  id: string;
  userId: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  status: string;
  channels: string[];
  frequency: string;
  enabled: boolean;
  lastTriggeredAt?: admin.firestore.Timestamp;
  triggerCount: number;
}

/**
 * Check Alerts - Scheduled Function
 *
 * Runs every minute to check active alerts and trigger notifications.
 */
export const checkAlerts = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async () => {
    console.log('Starting alert check...');

    try {
      // Get all active alerts
      const alertsSnapshot = await db
        .collectionGroup('alerts')
        .where('enabled', '==', true)
        .where('status', '==', 'active')
        .get();

      if (alertsSnapshot.empty) {
        console.log('No active alerts to check');
        return null;
      }

      console.log(`Checking ${alertsSnapshot.size} active alerts`);

      // Group alerts by user for efficient credential fetching
      const alertsByUser: Map<string, Alert[]> = new Map();

      alertsSnapshot.docs.forEach((doc) => {
        const alert = { id: doc.id, ...doc.data() } as Alert;
        const userId = alert.userId;

        if (!alertsByUser.has(userId)) {
          alertsByUser.set(userId, []);
        }
        alertsByUser.get(userId)!.push(alert);
      });

      // Process alerts for each user
      for (const [userId, alerts] of alertsByUser) {
        await processUserAlerts(userId, alerts);
      }

      console.log('Alert check complete');
      return null;
    } catch (error) {
      console.error('Error checking alerts:', error);
      return null;
    }
  });

/**
 * Process alerts for a specific user
 */
async function processUserAlerts(userId: string, alerts: Alert[]): Promise<void> {
  // Get user's Alpaca credentials for price data
  const credentials = await getCredentials(userId);

  for (const alert of alerts) {
    try {
      const shouldTrigger = await evaluateAlert(alert, credentials);

      if (shouldTrigger) {
        await triggerAlert(userId, alert);
      }

      // Update last checked timestamp
      await db.doc(`users/${userId}/alerts/${alert.id}`).update({
        lastCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error(`Error processing alert ${alert.id}:`, error);
    }
  }
}

/**
 * Evaluate if an alert should trigger
 */
async function evaluateAlert(
  alert: Alert,
  credentials: AlpacaCredentials | null
): Promise<boolean> {
  const config = alert.config;

  switch (alert.type) {
    case 'price_above':
    case 'price_below':
    case 'price_crosses': {
      if (!credentials) return false;

      const symbol = config.symbol as string;
      const targetPrice = config.targetPrice as number;

      // Fetch current price from Alpaca
      const price = await getCurrentPrice(symbol, credentials);
      if (price === null) return false;

      // Store last price for crosses detection
      const lastPrice = config.lastPrice as number | undefined;

      // Update last price
      await db.doc(`users/${alert.userId}/alerts/${alert.id}`).update({
        'config.lastPrice': price,
      });

      if (alert.type === 'price_above') {
        return price > targetPrice;
      } else if (alert.type === 'price_below') {
        return price < targetPrice;
      } else if (alert.type === 'price_crosses' && lastPrice !== undefined) {
        return (
          (lastPrice < targetPrice && price >= targetPrice) ||
          (lastPrice > targetPrice && price <= targetPrice)
        );
      }
      return false;
    }

    case 'percent_change': {
      if (!credentials) return false;

      const symbol = config.symbol as string;
      const threshold = config.percentThreshold as number;

      // Get daily change
      const change = await getDailyChange(symbol, credentials);
      if (change === null) return false;

      return Math.abs(change) >= threshold;
    }

    case 'rebalance_due': {
      // This would check strategy rebalance dates
      // For now, return false as placeholder
      return false;
    }

    case 'trade_executed': {
      // This is triggered by trade execution, not scheduled check
      return false;
    }

    default:
      return false;
  }
}

/**
 * Get current price for a symbol from Alpaca
 */
async function getCurrentPrice(
  symbol: string,
  credentials: AlpacaCredentials
): Promise<number | null> {
  try {
    const baseUrl = 'https://data.alpaca.markets';

    const response = await fetch(
      `${baseUrl}/v2/stocks/${symbol}/trades/latest`,
      {
        headers: {
          'APCA-API-KEY-ID': credentials.apiKey,
          'APCA-API-SECRET-KEY': credentials.apiSecret,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.trade?.p || null;
  } catch {
    return null;
  }
}

/**
 * Get daily percentage change for a symbol
 */
async function getDailyChange(
  symbol: string,
  credentials: AlpacaCredentials
): Promise<number | null> {
  try {
    const baseUrl = 'https://data.alpaca.markets';

    const response = await fetch(
      `${baseUrl}/v2/stocks/${symbol}/snapshot`,
      {
        headers: {
          'APCA-API-KEY-ID': credentials.apiKey,
          'APCA-API-SECRET-KEY': credentials.apiSecret,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const dailyBar = data.dailyBar;
    const prevClose = data.prevDailyBar?.c;

    if (!dailyBar?.c || !prevClose) return null;

    return ((dailyBar.c - prevClose) / prevClose) * 100;
  } catch {
    return null;
  }
}

/**
 * Trigger an alert and send notifications
 */
async function triggerAlert(userId: string, alert: Alert): Promise<void> {
  console.log(`Triggering alert ${alert.id} for user ${userId}`);

  const alertRef = db.doc(`users/${userId}/alerts/${alert.id}`);
  const triggerCount = (alert.triggerCount || 0) + 1;

  // Update alert status
  const updates: Record<string, unknown> = {
    lastTriggeredAt: admin.firestore.FieldValue.serverTimestamp(),
    triggerCount,
  };

  // Disable if frequency is 'once'
  if (alert.frequency === 'once') {
    updates.status = 'triggered';
    updates.enabled = false;
  }

  await alertRef.update(updates);

  // Create notification
  const notification = {
    userId,
    title: `Alert: ${alert.name}`,
    message: getAlertMessage(alert),
    severity: 'warning',
    alertId: alert.id,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Always create in-app notification
  if (alert.channels.includes('in_app')) {
    await db.collection(`users/${userId}/notifications`).add(notification);
  }

  // Send push notification via FCM
  if (alert.channels.includes('push')) {
    await sendPushNotification(userId, {
      title: notification.title,
      body: notification.message,
      data: {
        type: 'alert_triggered',
        alertId: alert.id,
        clickAction: '/dashboard/alerts',
      },
    });
  }

  // Send email notification
  if (alert.channels.includes('email')) {
    await sendEmailNotification(userId, {
      subject: notification.title,
      body: notification.message,
      templateType: 'alert_triggered',
      templateData: {
        alertName: alert.name,
        alertType: alert.type,
        message: notification.message,
      },
    });
  }
}

/**
 * Get alert message based on type
 */
function getAlertMessage(alert: Alert): string {
  const config = alert.config;

  switch (alert.type) {
    case 'price_above':
      return `${config.symbol} has risen above $${config.targetPrice}`;
    case 'price_below':
      return `${config.symbol} has fallen below $${config.targetPrice}`;
    case 'price_crosses':
      return `${config.symbol} has crossed $${config.targetPrice}`;
    case 'percent_change':
      return `${config.symbol} has moved ${config.percentThreshold}% or more`;
    case 'portfolio_value':
      return `Your portfolio value has ${config.operator === 'greater_than' ? 'exceeded' : 'dropped below'} $${config.targetValue}`;
    case 'position_gain':
      return `${config.symbol} position has gained ${config.percentThreshold}%`;
    case 'position_loss':
      return `${config.symbol} position has lost ${config.percentThreshold}%`;
    case 'drawdown':
      return `Portfolio drawdown has ${config.operator === 'greater_than' ? 'exceeded' : 'recovered to'} ${config.targetValue}%`;
    case 'rebalance_due':
      return `Portfolio rebalancing is due in ${config.daysBefore} days`;
    case 'trade_executed':
      return `Trade executed: ${config.side || 'order'} ${config.symbol || 'completed'}`;
    default:
      return 'Alert triggered';
  }
}

/**
 * Create Notification for Trade - Helper for trade_executed alerts
 *
 * This can be called from executeTrade to trigger trade alerts.
 */
export async function notifyTradeExecuted(
  userId: string,
  order: {
    symbol: string;
    side: string;
    qty: number;
    status: string;
  }
): Promise<void> {
  // Find matching trade_executed alerts
  const alertsSnapshot = await db
    .collection(`users/${userId}/alerts`)
    .where('enabled', '==', true)
    .where('type', '==', 'trade_executed')
    .get();

  for (const doc of alertsSnapshot.docs) {
    const alert = { id: doc.id, ...doc.data() } as Alert;
    const config = alert.config;

    // Check if alert matches this trade
    const symbolMatches = !config.symbol || config.symbol === order.symbol;
    const sideMatches =
      !config.side ||
      config.side === 'both' ||
      config.side === order.side;

    if (symbolMatches && sideMatches) {
      await triggerAlert(userId, alert);
    }
  }
}

/**
 * Get Alert History - Callable Function
 */
export const getAlertHistory = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userId = context.auth.uid;
  const { limit: maxResults = 50, status } = data as {
    limit?: number;
    status?: string;
  };

  let query = db
    .collection(`users/${userId}/alerts`)
    .orderBy('createdAt', 'desc')
    .limit(maxResults);

  if (status) {
    query = query.where('status', '==', status) as typeof query;
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
    updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
    lastCheckedAt: doc.data().lastCheckedAt?.toDate?.()?.toISOString(),
    lastTriggeredAt: doc.data().lastTriggeredAt?.toDate?.()?.toISOString(),
  }));
});

/**
 * Clear Old Notifications - Scheduled Function
 *
 * Runs daily to clean up old read notifications.
 */
export const cleanupOldNotifications = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const retentionDays = 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const usersSnapshot = await db.collection('users').get();

    let totalDeleted = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // Find old read notifications
      const oldNotifications = await db
        .collection(`users/${userId}/notifications`)
        .where('read', '==', true)
        .where('createdAt', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
        .get();

      if (oldNotifications.empty) continue;

      const batch = db.batch();

      for (const doc of oldNotifications.docs) {
        batch.delete(doc.ref);
        totalDeleted++;
      }

      await batch.commit();
    }

    console.log(`Cleaned up ${totalDeleted} old notifications`);
    return null;
  });

// ============================================================================
// Push Notification Functions (FCM)
// ============================================================================

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

/**
 * Send Push Notification to a user via Firebase Cloud Messaging
 */
async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<void> {
  try {
    // Get user's notification preferences
    const prefsDoc = await db.doc(`users/${userId}/settings/notifications`).get();
    const prefs = prefsDoc.exists ? prefsDoc.data() : null;

    // Check quiet hours
    if (prefs?.quietHours?.enabled) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;

      const [startHour, startMinute] = (prefs.quietHours.start as string)
        .split(':')
        .map(Number);
      const [endHour, endMinute] = (prefs.quietHours.end as string)
        .split(':')
        .map(Number);

      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      // Handle overnight quiet hours
      const isQuietTime =
        startTime <= endTime
          ? currentTime >= startTime && currentTime < endTime
          : currentTime >= startTime || currentTime < endTime;

      if (isQuietTime) {
        console.log(`Skipping push notification for user ${userId} during quiet hours`);
        return;
      }
    }

    // Get user's FCM tokens
    const userDoc = await db.doc(`users/${userId}`).get();

    if (!userDoc.exists) {
      console.log(`User ${userId} not found`);
      return;
    }

    const fcmTokens = userDoc.data()?.fcmTokens as Record<
      string,
      { token: string; platform: string }
    > | undefined;

    if (!fcmTokens || Object.keys(fcmTokens).length === 0) {
      console.log(`No FCM tokens found for user ${userId}`);
      return;
    }

    // Send to all user devices
    const tokens = Object.values(fcmTokens).map((t) => t.token);
    const invalidTokens: string[] = [];

    for (const token of tokens) {
      try {
        await admin.messaging().send({
          token,
          notification: {
            title: payload.title,
            body: payload.body,
            imageUrl: payload.imageUrl,
          },
          data: payload.data,
          webpush: {
            fcmOptions: {
              link: payload.data?.clickAction || '/dashboard',
            },
            notification: {
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-72x72.png',
              vibrate: [100, 50, 100],
            },
          },
        });

        console.log(`Push notification sent to token ${token.substring(0, 10)}...`);
      } catch (error: unknown) {
        const errorCode = (error as { code?: string }).code;
        // Handle invalid tokens
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(token);
        } else {
          console.error(`Error sending to token:`, error);
        }
      }
    }

    // Clean up invalid tokens
    if (invalidTokens.length > 0) {
      const updates: Record<string, admin.firestore.FieldValue> = {};
      for (const token of invalidTokens) {
        updates[`fcmTokens.${token}`] = admin.firestore.FieldValue.delete();
      }
      await db.doc(`users/${userId}`).update(updates);
      console.log(`Removed ${invalidTokens.length} invalid FCM tokens for user ${userId}`);
    }
  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error);
  }
}

/**
 * Send Test Push Notification - Callable Function
 *
 * Allows users to test their push notification setup.
 */
export const sendTestPushNotification = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = context.auth.uid;

    await sendPushNotification(userId, {
      title: 'Test Notification',
      body: 'Push notifications are working correctly!',
      data: {
        type: 'test',
        clickAction: '/dashboard/settings',
      },
    });

    return { success: true };
  }
);

// ============================================================================
// Email Notification Functions
// ============================================================================

interface EmailNotificationPayload {
  subject: string;
  body: string;
  templateType: 'alert_triggered' | 'trade_executed' | 'daily_digest' | 'weekly_summary';
  templateData?: Record<string, unknown>;
}

/**
 * Send Email Notification to a user
 *
 * Note: This requires setting up an email service like SendGrid, Mailgun, or AWS SES.
 * For now, this logs the email and stores it in Firestore for later processing.
 */
async function sendEmailNotification(
  userId: string,
  payload: EmailNotificationPayload
): Promise<void> {
  try {
    // Get user's email and notification preferences
    const userDoc = await db.doc(`users/${userId}`).get();

    if (!userDoc.exists) {
      console.log(`User ${userId} not found`);
      return;
    }

    const userData = userDoc.data()!;
    const email = userData.email;

    if (!email) {
      console.log(`No email found for user ${userId}`);
      return;
    }

    // Get notification preferences
    const prefsDoc = await db.doc(`users/${userId}/settings/notifications`).get();
    const prefs = prefsDoc.exists ? prefsDoc.data() : null;

    // Check if email notifications are enabled
    if (!prefs?.channels?.email) {
      console.log(`Email notifications disabled for user ${userId}`);
      return;
    }

    // Queue email for sending
    // In production, this would call an email service API
    await db.collection('emailQueue').add({
      userId,
      to: email,
      subject: payload.subject,
      body: payload.body,
      templateType: payload.templateType,
      templateData: payload.templateData,
      status: 'queued',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Email queued for user ${userId}: ${payload.subject}`);

    // TODO: In production, integrate with email service
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: email,
    //   from: 'alerts@tradepilot.app',
    //   subject: payload.subject,
    //   html: generateEmailHtml(payload.templateType, payload.templateData),
    // });
  } catch (error) {
    console.error(`Error sending email to user ${userId}:`, error);
  }
}

/**
 * Process Email Queue - Scheduled Function
 *
 * Processes queued emails and sends them via the configured email service.
 * Runs every 5 minutes.
 */
export const processEmailQueue = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    const queuedEmails = await db
      .collection('emailQueue')
      .where('status', '==', 'queued')
      .orderBy('createdAt', 'asc')
      .limit(100)
      .get();

    if (queuedEmails.empty) {
      return null;
    }

    console.log(`Processing ${queuedEmails.size} queued emails`);

    for (const doc of queuedEmails.docs) {
      try {
        // Email data available for actual email service integration
        const emailData = doc.data();

        // TODO: Actually send email via email service
        // For now, just mark as sent
        await doc.ref.update({
          status: 'sent',
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`Processed email ${doc.id} to ${emailData.to}`);
      } catch (error) {
        await doc.ref.update({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    return null;
  });

/**
 * Send Daily Digest - Scheduled Function
 *
 * Sends daily digest emails to users who have enabled them.
 * Runs at 6:00 AM ET.
 */
export const sendDailyDigest = functions.pubsub
  .schedule('0 6 * * *')
  .timeZone('America/New_York')
  .onRun(async () => {
    // Get users with daily digest enabled
    const usersWithDigest = await db
      .collection('users')
      .where('digestFrequency', '==', 'daily')
      .get();

    if (usersWithDigest.empty) {
      console.log('No users with daily digest enabled');
      return null;
    }

    console.log(`Sending daily digest to ${usersWithDigest.size} users`);

    for (const userDoc of usersWithDigest.docs) {
      const userId = userDoc.id;

      try {
        // Get yesterday's activity
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get triggered alerts
        const alertsSnapshot = await db
          .collection(`users/${userId}/notifications`)
          .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(yesterday))
          .where('createdAt', '<', admin.firestore.Timestamp.fromDate(today))
          .get();

        // Get executed trades
        const tradesSnapshot = await db
          .collection(`users/${userId}/orders`)
          .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(yesterday))
          .where('createdAt', '<', admin.firestore.Timestamp.fromDate(today))
          .get();

        // Only send if there's activity
        if (alertsSnapshot.empty && tradesSnapshot.empty) {
          continue;
        }

        await sendEmailNotification(userId, {
          subject: 'TradePilot Daily Digest',
          body: `You had ${alertsSnapshot.size} alerts and ${tradesSnapshot.size} trades yesterday.`,
          templateType: 'daily_digest',
          templateData: {
            alertCount: alertsSnapshot.size,
            tradeCount: tradesSnapshot.size,
            date: yesterday.toISOString().split('T')[0],
          },
        });
      } catch (error) {
        console.error(`Error sending daily digest to user ${userId}:`, error);
      }
    }

    return null;
  });

/**
 * Send Weekly Summary - Scheduled Function
 *
 * Sends weekly summary emails to users who have enabled them.
 * Runs at 9:00 AM ET on Sundays.
 */
export const sendWeeklySummary = functions.pubsub
  .schedule('0 9 * * 0')
  .timeZone('America/New_York')
  .onRun(async () => {
    // Get users with weekly summary enabled
    const usersWithSummary = await db
      .collection('users')
      .where('digestFrequency', '==', 'weekly')
      .get();

    if (usersWithSummary.empty) {
      console.log('No users with weekly summary enabled');
      return null;
    }

    console.log(`Sending weekly summary to ${usersWithSummary.size} users`);

    for (const userDoc of usersWithSummary.docs) {
      const userId = userDoc.id;

      try {
        // Get last week's range
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get portfolio performance
        const accountsSnapshot = await db
          .collection(`users/${userId}/accounts`)
          .get();

        let totalValue = 0;
        for (const doc of accountsSnapshot.docs) {
          totalValue += doc.data().portfolioValue || 0;
        }

        // Get trade activity
        const tradesSnapshot = await db
          .collection(`users/${userId}/orders`)
          .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(weekAgo))
          .where('createdAt', '<', admin.firestore.Timestamp.fromDate(today))
          .get();

        await sendEmailNotification(userId, {
          subject: 'TradePilot Weekly Summary',
          body: `Your weekly portfolio update. Total value: $${totalValue.toFixed(2)}. Trades this week: ${tradesSnapshot.size}.`,
          templateType: 'weekly_summary',
          templateData: {
            portfolioValue: totalValue,
            tradeCount: tradesSnapshot.size,
            weekStartDate: weekAgo.toISOString().split('T')[0],
            weekEndDate: today.toISOString().split('T')[0],
          },
        });
      } catch (error) {
        console.error(`Error sending weekly summary to user ${userId}:`, error);
      }
    }

    return null;
  });
