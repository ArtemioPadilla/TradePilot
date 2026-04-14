/**
 * TradePilot Cloud Functions
 *
 * Secure server-side functions for trading operations.
 * All trading-related actions that involve credentials
 * should go through these functions.
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export all functions
export * from './credentials';
export * from './orders';
export * from './health';
export * from './positions';
export * from './social/updateLeaderboard';
