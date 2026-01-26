/**
 * Credential Management Cloud Functions
 *
 * Handles secure storage and retrieval of API credentials.
 * Uses encryption for sensitive data at rest.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

const db = admin.firestore();

// Encryption configuration
// In production, use Cloud KMS for key management
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || functions.config().encryption?.key;

/**
 * Encrypt sensitive data
 */
function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  if (!ENCRYPTION_KEY) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Encryption key not configured'
    );
  }

  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: (cipher as crypto.CipherGCM).getAuthTag().toString('hex'),
  };
}

/**
 * Decrypt sensitive data
 */
function decrypt(encrypted: string, iv: string, tag: string): string {
  if (!ENCRYPTION_KEY) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Encryption key not configured'
    );
  }

  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    key,
    Buffer.from(iv, 'hex')
  );
  (decipher as crypto.DecipherGCM).setAuthTag(Buffer.from(tag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Store Alpaca credentials securely
 *
 * Encrypts the API secret before storing in Firestore.
 */
export const storeCredentials = functions.https.onCall(
  async (data, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be authenticated to store credentials'
      );
    }

    const { apiKey, apiSecret, environment } = data;

    // Validate inputs
    if (!apiKey || typeof apiKey !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'API key is required'
      );
    }

    if (!apiSecret || typeof apiSecret !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'API secret is required'
      );
    }

    if (!environment || !['paper', 'live'].includes(environment)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Environment must be "paper" or "live"'
      );
    }

    const userId = context.auth.uid;

    try {
      // Encrypt the API secret
      const encryptedSecret = encrypt(apiSecret);

      // Store in Firestore with encrypted secret
      await db.doc(`users/${userId}/integrations/alpaca`).set({
        apiKey,
        apiSecretEncrypted: encryptedSecret.encrypted,
        apiSecretIv: encryptedSecret.iv,
        apiSecretTag: encryptedSecret.tag,
        environment,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Log credential storage (without sensitive data)
      functions.logger.info('Credentials stored', {
        userId,
        environment,
        action: 'store_credentials',
      });

      return { success: true };
    } catch (error) {
      functions.logger.error('Failed to store credentials', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new functions.https.HttpsError(
        'internal',
        'Failed to store credentials'
      );
    }
  }
);

/**
 * Get decrypted credentials (internal use only)
 *
 * This function is not exported as an HTTP callable function.
 * It's used internally by other Cloud Functions.
 */
export async function getDecryptedCredentials(
  userId: string
): Promise<{
  apiKey: string;
  apiSecret: string;
  environment: 'paper' | 'live';
} | null> {
  const doc = await db.doc(`users/${userId}/integrations/alpaca`).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  if (!data) {
    return null;
  }

  try {
    const apiSecret = decrypt(
      data.apiSecretEncrypted,
      data.apiSecretIv,
      data.apiSecretTag
    );

    return {
      apiKey: data.apiKey,
      apiSecret,
      environment: data.environment,
    };
  } catch (error) {
    functions.logger.error('Failed to decrypt credentials', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Verify credentials are valid by testing connection
 */
export const verifyCredentials = functions.https.onCall(
  async (data, context) => {
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
        valid: false,
        error: 'No credentials found',
      };
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

      if (response.ok) {
        // Update verification status
        await db.doc(`users/${userId}/integrations/alpaca`).update({
          isValid: true,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { valid: true };
      } else {
        const error = await response.json().catch(() => ({}));

        await db.doc(`users/${userId}/integrations/alpaca`).update({
          isValid: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
          valid: false,
          error: error.message || `Verification failed: ${response.status}`,
        };
      }
    } catch (error) {
      functions.logger.error('Credential verification failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        valid: false,
        error: 'Connection failed',
      };
    }
  }
);

/**
 * Delete credentials
 */
export const deleteCredentials = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be authenticated'
      );
    }

    const userId = context.auth.uid;

    try {
      await db.doc(`users/${userId}/integrations/alpaca`).delete();

      functions.logger.info('Credentials deleted', {
        userId,
        action: 'delete_credentials',
      });

      return { success: true };
    } catch (error) {
      throw new functions.https.HttpsError(
        'internal',
        'Failed to delete credentials'
      );
    }
  }
);
