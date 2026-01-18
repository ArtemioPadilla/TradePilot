/**
 * Offline Sync Service
 *
 * Manages offline data synchronization using IndexedDB and Background Sync API.
 * Queues failed write operations and replays them when connectivity is restored.
 */

// Database configuration
const DB_NAME = 'tradepilot-sync';
const DB_VERSION = 1;
const QUEUE_STORE = 'sync-queue';
const PENDING_STORE = 'pending-data';

// Operation types
export type SyncOperationType = 'create' | 'update' | 'delete';

export interface SyncOperation {
  id?: number;
  type: SyncOperationType;
  collection: string;
  documentId?: string;
  data?: Record<string, unknown>;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'failed';
  error?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  isSyncing: boolean;
}

// Event types
type SyncEventHandler = (status: SyncStatus) => void;
type OperationEventHandler = (operation: SyncOperation, success: boolean) => void;

class OfflineSyncService {
  private db: IDBDatabase | null = null;
  private statusListeners: Set<SyncEventHandler> = new Set();
  private operationListeners: Set<OperationEventHandler> = new Set();
  private isSyncing = false;
  private lastSyncTime: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initDatabase();
      this.setupEventListeners();
    }
  }

  /**
   * Initialize IndexedDB database
   */
  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[OfflineSync] Database error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[OfflineSync] Database initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create sync queue store
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          const queueStore = db.createObjectStore(QUEUE_STORE, {
            keyPath: 'id',
            autoIncrement: true,
          });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create pending data store
        if (!db.objectStoreNames.contains(PENDING_STORE)) {
          const pendingStore = db.createObjectStore(PENDING_STORE, {
            keyPath: 'key',
          });
          pendingStore.createIndex('collection', 'collection', { unique: false });
        }
      };
    });
  }

  /**
   * Set up online/offline event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      console.log('[OfflineSync] Online - starting sync');
      this.processQueue();
      this.notifyStatusChange();
    });

    window.addEventListener('offline', () => {
      console.log('[OfflineSync] Offline - operations will be queued');
      this.notifyStatusChange();
    });

    // Listen for service worker sync completion
    navigator.serviceWorker?.addEventListener('message', (event) => {
      const { type, operationId } = event.data || {};
      if (type === 'SYNC_COMPLETED') {
        this.handleSyncCompletion(operationId);
      }
    });
  }

  /**
   * Queue a write operation for later sync
   */
  async queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<number> {
    await this.ensureDb();

    const fullOperation: Omit<SyncOperation, 'id'> = {
      ...operation,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: operation.maxRetries || 3,
      status: 'pending',
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      const request = store.add(fullOperation);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const id = request.result as number;
        console.log('[OfflineSync] Operation queued:', id);
        this.notifyStatusChange();

        // Request background sync if available
        this.requestBackgroundSync();

        resolve(id);
      };
    });
  }

  /**
   * Request background sync from service worker
   */
  private async requestBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('tradepilot-sync-queue');
        console.log('[OfflineSync] Background sync requested');
      } catch (error) {
        console.log('[OfflineSync] Background sync not available:', error);
      }
    }
  }

  /**
   * Process the sync queue (called when online)
   */
  async processQueue(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) {
      return;
    }

    this.isSyncing = true;
    this.notifyStatusChange();

    try {
      await this.ensureDb();

      const operations = await this.getPendingOperations();
      console.log('[OfflineSync] Processing', operations.length, 'queued operations');

      for (const operation of operations) {
        try {
          await this.processOperation(operation);
        } catch (error) {
          console.error('[OfflineSync] Operation failed:', operation.id, error);
          await this.handleOperationFailure(operation, error);
        }
      }

      this.lastSyncTime = Date.now();
    } finally {
      this.isSyncing = false;
      this.notifyStatusChange();
    }
  }

  /**
   * Get all pending operations from the queue
   */
  private async getPendingOperations(): Promise<SyncOperation[]> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(QUEUE_STORE, 'readonly');
      const store = tx.objectStore(QUEUE_STORE);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Process a single operation
   */
  private async processOperation(operation: SyncOperation): Promise<void> {
    // Update status to processing
    await this.updateOperationStatus(operation.id!, 'processing');

    if (operation.url) {
      // HTTP request operation
      const response = await fetch(operation.url, {
        method: operation.method || 'POST',
        headers: operation.headers,
        body: operation.body,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    // Remove successful operation
    await this.removeOperation(operation.id!);
    this.notifyOperationComplete(operation, true);
    console.log('[OfflineSync] Operation completed:', operation.id);
  }

  /**
   * Handle operation failure
   */
  private async handleOperationFailure(operation: SyncOperation, error: unknown): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (operation.retryCount < operation.maxRetries) {
      // Increment retry count and set back to pending
      await this.updateOperation(operation.id!, {
        retryCount: operation.retryCount + 1,
        status: 'pending',
        error: errorMessage,
      });
    } else {
      // Max retries exceeded, mark as failed
      await this.updateOperationStatus(operation.id!, 'failed', errorMessage);
      this.notifyOperationComplete(operation, false);
    }
  }

  /**
   * Update operation status
   */
  private async updateOperationStatus(id: number, status: SyncOperation['status'], error?: string): Promise<void> {
    await this.updateOperation(id, { status, error });
  }

  /**
   * Update operation fields
   */
  private async updateOperation(id: number, updates: Partial<SyncOperation>): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation) {
          const updated = { ...operation, ...updates };
          const putRequest = store.put(updated);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Remove operation from queue
   */
  private async removeOperation(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Handle sync completion from service worker
   */
  private async handleSyncCompletion(operationId: number): Promise<void> {
    try {
      await this.removeOperation(operationId);
      this.notifyStatusChange();
    } catch (error) {
      console.error('[OfflineSync] Error handling sync completion:', error);
    }
  }

  /**
   * Get current sync status
   */
  async getStatus(): Promise<SyncStatus> {
    await this.ensureDb();

    const pendingCount = await this.getPendingCount();

    return {
      isOnline: navigator.onLine,
      pendingCount,
      lastSyncTime: this.lastSyncTime,
      isSyncing: this.isSyncing,
    };
  }

  /**
   * Get count of pending operations
   */
  private async getPendingCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(QUEUE_STORE, 'readonly');
      const store = tx.objectStore(QUEUE_STORE);
      const index = store.index('status');
      const request = index.count('pending');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Clear all failed operations
   */
  async clearFailedOperations(): Promise<void> {
    await this.ensureDb();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      const index = store.index('status');
      const request = index.openCursor('failed');

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          this.notifyStatusChange();
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retry all failed operations
   */
  async retryFailedOperations(): Promise<void> {
    await this.ensureDb();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      const index = store.index('status');
      const request = index.openCursor('failed');

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const operation = cursor.value;
          operation.status = 'pending';
          operation.retryCount = 0;
          operation.error = undefined;
          cursor.update(operation);
          cursor.continue();
        } else {
          this.notifyStatusChange();
          // Process queue after updating all failed operations
          this.processQueue();
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(handler: SyncEventHandler): () => void {
    this.statusListeners.add(handler);
    return () => this.statusListeners.delete(handler);
  }

  /**
   * Subscribe to operation completion events
   */
  onOperationComplete(handler: OperationEventHandler): () => void {
    this.operationListeners.add(handler);
    return () => this.operationListeners.delete(handler);
  }

  /**
   * Notify all status listeners
   */
  private async notifyStatusChange(): Promise<void> {
    try {
      const status = await this.getStatus();
      this.statusListeners.forEach((handler) => handler(status));
    } catch (error) {
      console.error('[OfflineSync] Error notifying status change:', error);
    }
  }

  /**
   * Notify operation completion
   */
  private notifyOperationComplete(operation: SyncOperation, success: boolean): void {
    this.operationListeners.forEach((handler) => handler(operation, success));
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDb(): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
  }

  /**
   * Store data locally for offline access
   */
  async cacheData(key: string, collection: string, data: unknown): Promise<void> {
    await this.ensureDb();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(PENDING_STORE, 'readwrite');
      const store = tx.objectStore(PENDING_STORE);
      const request = store.put({
        key,
        collection,
        data,
        timestamp: Date.now(),
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get cached data
   */
  async getCachedData<T>(key: string): Promise<T | null> {
    await this.ensureDb();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(PENDING_STORE, 'readonly');
      const store = tx.objectStore(PENDING_STORE);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
    });
  }
}

// Export singleton instance
export const offlineSync = new OfflineSyncService();

// Export hook for React components
export function useOfflineSync() {
  return offlineSync;
}
