/**
 * Position Sync Cloud Functions
 *
 * Sync positions from Alpaca to Firestore securely.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getDecryptedCredentials } from './credentials';

const db = admin.firestore();

interface AlpacaPosition {
  symbol: string;
  qty: string;
  avg_entry_price: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
  asset_id: string;
  asset_class: string;
  exchange: string;
}

/**
 * Sync positions from Alpaca to Firestore
 */
export const syncPositions = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated'
    );
  }

  const userId = context.auth.uid;
  const credentials = await getDecryptedCredentials(userId);

  if (!credentials) {
    return {
      success: false,
      positionsSynced: 0,
      positionsAdded: 0,
      positionsUpdated: 0,
      positionsRemoved: 0,
      error: 'Credentials not found',
    };
  }

  try {
    const baseUrl =
      credentials.environment === 'paper'
        ? 'https://paper-api.alpaca.markets'
        : 'https://api.alpaca.markets';

    // Fetch positions from Alpaca
    const response = await fetch(`${baseUrl}/v2/positions`, {
      headers: {
        'APCA-API-KEY-ID': credentials.apiKey,
        'APCA-API-SECRET-KEY': credentials.apiSecret,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch positions: ${response.status}`);
    }

    const alpacaPositions: AlpacaPosition[] = await response.json();

    // Fetch account for total value
    const accountResponse = await fetch(`${baseUrl}/v2/account`, {
      headers: {
        'APCA-API-KEY-ID': credentials.apiKey,
        'APCA-API-SECRET-KEY': credentials.apiSecret,
      },
    });

    let accountValue: number | undefined;
    if (accountResponse.ok) {
      const accountData = await accountResponse.json();
      accountValue = parseFloat(accountData.portfolio_value);
    }

    // Get existing positions from Firestore
    const existingPositionsSnapshot = await db
      .collection(`users/${userId}/positions`)
      .get();
    const existingSymbols = new Set(
      existingPositionsSnapshot.docs.map((doc) => doc.id)
    );

    const alpacaSymbols = new Set(alpacaPositions.map((p) => p.symbol));

    let positionsAdded = 0;
    let positionsUpdated = 0;
    let positionsRemoved = 0;

    // Update or add positions
    const batch = db.batch();

    for (const pos of alpacaPositions) {
      const posRef = db.doc(`users/${userId}/positions/${pos.symbol}`);
      const positionData = {
        symbol: pos.symbol,
        qty: parseFloat(pos.qty),
        avgEntryPrice: parseFloat(pos.avg_entry_price),
        marketValue: parseFloat(pos.market_value),
        costBasis: parseFloat(pos.cost_basis),
        unrealizedPl: parseFloat(pos.unrealized_pl),
        unrealizedPlPercent: parseFloat(pos.unrealized_plpc) * 100,
        currentPrice: parseFloat(pos.current_price),
        lastdayPrice: parseFloat(pos.lastday_price),
        changeToday: parseFloat(pos.change_today) * 100,
        assetId: pos.asset_id,
        assetClass: pos.asset_class,
        exchange: pos.exchange,
        environment: credentials.environment,
        syncedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (existingSymbols.has(pos.symbol)) {
        positionsUpdated++;
      } else {
        positionsAdded++;
      }

      batch.set(posRef, positionData, { merge: true });
    }

    // Remove positions that no longer exist
    for (const existingDoc of existingPositionsSnapshot.docs) {
      if (!alpacaSymbols.has(existingDoc.id)) {
        batch.delete(existingDoc.ref);
        positionsRemoved++;
      }
    }

    // Commit batch
    await batch.commit();

    // Update sync timestamp
    await db.doc(`users/${userId}/integrations/alpaca`).update({
      lastPositionSync: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info('Positions synced', {
      userId,
      positionsAdded,
      positionsUpdated,
      positionsRemoved,
    });

    return {
      success: true,
      positionsSynced: alpacaPositions.length,
      positionsAdded,
      positionsUpdated,
      positionsRemoved,
      accountValue,
    };
  } catch (error) {
    functions.logger.error('Position sync failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      positionsSynced: 0,
      positionsAdded: 0,
      positionsUpdated: 0,
      positionsRemoved: 0,
      error: error instanceof Error ? error.message : 'Sync failed',
    };
  }
});

/**
 * Scheduled position sync for all users with connected accounts
 *
 * Runs every 5 minutes during market hours (9:30 AM - 4:00 PM ET, Mon-Fri)
 */
export const scheduledPositionSync = functions.pubsub
  .schedule('*/5 9-16 * * 1-5')
  .timeZone('America/New_York')
  .onRun(async () => {
    // Get all users with valid Alpaca connections
    const usersWithAlpaca = await db
      .collectionGroup('integrations')
      .where('isValid', '==', true)
      .get();

    functions.logger.info('Starting scheduled sync', {
      userCount: usersWithAlpaca.size,
    });

    const results = {
      success: 0,
      failed: 0,
    };

    for (const doc of usersWithAlpaca.docs) {
      // Extract userId from path: users/{userId}/integrations/alpaca
      const pathParts = doc.ref.path.split('/');
      const userId = pathParts[1];

      try {
        const credentials = await getDecryptedCredentials(userId);
        if (!credentials) continue;

        const baseUrl =
          credentials.environment === 'paper'
            ? 'https://paper-api.alpaca.markets'
            : 'https://api.alpaca.markets';

        const response = await fetch(`${baseUrl}/v2/positions`, {
          headers: {
            'APCA-API-KEY-ID': credentials.apiKey,
            'APCA-API-SECRET-KEY': credentials.apiSecret,
          },
        });

        if (response.ok) {
          const positions = await response.json();

          const batch = db.batch();
          for (const pos of positions) {
            const posRef = db.doc(`users/${userId}/positions/${pos.symbol}`);
            batch.set(
              posRef,
              {
                symbol: pos.symbol,
                qty: parseFloat(pos.qty),
                currentPrice: parseFloat(pos.current_price),
                marketValue: parseFloat(pos.market_value),
                unrealizedPl: parseFloat(pos.unrealized_pl),
                syncedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
          await batch.commit();
          results.success++;
        } else {
          results.failed++;
        }
      } catch (error) {
        results.failed++;
        functions.logger.error('Scheduled sync failed for user', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown',
        });
      }
    }

    functions.logger.info('Scheduled sync complete', results);
  });
