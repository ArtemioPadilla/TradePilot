/**
 * Health Check Cloud Functions
 *
 * Provides health monitoring endpoints for the application.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    firestore: ServiceHealth;
    alpacaApi: ServiceHealth;
  };
  version: string;
}

interface ServiceHealth {
  status: 'up' | 'down' | 'unknown';
  latencyMs?: number;
  error?: string;
}

/**
 * Health check endpoint
 *
 * Checks connectivity to dependent services and returns overall health status.
 */
export const health = functions.https.onRequest(async (req, res) => {
  const startTime = Date.now();

  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      firestore: { status: 'unknown' },
      alpacaApi: { status: 'unknown' },
    },
    version: process.env.K_REVISION || 'unknown',
  };

  // Check Firestore
  try {
    const firestoreStart = Date.now();
    await db.collection('_health').doc('check').set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    healthStatus.services.firestore = {
      status: 'up',
      latencyMs: Date.now() - firestoreStart,
    };
  } catch (error) {
    healthStatus.services.firestore = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check Alpaca API (paper endpoint)
  try {
    const alpacaStart = Date.now();
    const response = await fetch('https://paper-api.alpaca.markets/v2/clock', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Note: This will return 401 without auth, but that's okay
    // We just want to verify the API is reachable
    if (response.status === 401 || response.ok) {
      healthStatus.services.alpacaApi = {
        status: 'up',
        latencyMs: Date.now() - alpacaStart,
      };
    } else {
      healthStatus.services.alpacaApi = {
        status: 'down',
        error: `Unexpected status: ${response.status}`,
      };
    }
  } catch (error) {
    healthStatus.services.alpacaApi = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Determine overall status
  const serviceStatuses = Object.values(healthStatus.services);
  const downCount = serviceStatuses.filter((s) => s.status === 'down').length;

  if (downCount === 0) {
    healthStatus.status = 'healthy';
  } else if (downCount === serviceStatuses.length) {
    healthStatus.status = 'unhealthy';
  } else {
    healthStatus.status = 'degraded';
  }

  // Set appropriate HTTP status code
  const httpStatus =
    healthStatus.status === 'healthy'
      ? 200
      : healthStatus.status === 'degraded'
      ? 207
      : 503;

  res.status(httpStatus).json(healthStatus);
});

/**
 * Readiness probe for Kubernetes/Cloud Run
 */
export const ready = functions.https.onRequest(async (req, res) => {
  try {
    // Quick Firestore check
    await db.collection('_health').doc('ready').get();
    res.status(200).send('OK');
  } catch (error) {
    res.status(503).send('Not Ready');
  }
});

/**
 * Liveness probe for Kubernetes/Cloud Run
 */
export const live = functions.https.onRequest((req, res) => {
  res.status(200).send('OK');
});

/**
 * Market status check
 *
 * Returns current market status from Alpaca.
 */
export const marketStatus = functions.https.onCall(async (data, context) => {
  try {
    // Public endpoint - no auth required for market status
    const response = await fetch('https://paper-api.alpaca.markets/v2/clock');

    if (!response.ok) {
      throw new Error(`Failed to get market status: ${response.status}`);
    }

    const clockData = await response.json();

    return {
      isOpen: clockData.is_open,
      nextOpen: clockData.next_open,
      nextClose: clockData.next_close,
      timestamp: clockData.timestamp,
    };
  } catch (error) {
    functions.logger.error('Market status check failed', {
      error: error instanceof Error ? error.message : 'Unknown',
    });

    throw new functions.https.HttpsError(
      'unavailable',
      'Failed to get market status'
    );
  }
});
