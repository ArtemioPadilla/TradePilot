/**
 * TradePilot Service Worker
 *
 * Provides offline support with intelligent caching strategies:
 * - Cache-first: static assets (JS, CSS, icons, fonts)
 * - Network-first: API calls with offline fallback
 * - Stale-while-revalidate: HTML pages
 */

const CACHE_VERSION = 'v1.1.0';
const STATIC_CACHE = `tradepilot-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `tradepilot-dynamic-${CACHE_VERSION}`;
const DATA_CACHE = `tradepilot-data-${CACHE_VERSION}`;
const PRICE_CACHE = `tradepilot-prices-${CACHE_VERSION}`;

// Static assets to precache (app shell)
const BASE_PATH = '/TradePilot/';
const PRECACHE_ASSETS = [
  BASE_PATH,
  BASE_PATH + 'offline.html',
  BASE_PATH + 'favicon.svg',
  BASE_PATH + 'favicon.png',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'icons/icon-192x192.png',
  BASE_PATH + 'icons/icon-512x512.png',
];

// Cache duration for different resource types (in seconds)
const CACHE_DURATIONS = {
  static: 60 * 60 * 24 * 30, // 30 days
  page: 60 * 60 * 24, // 1 day
  api: 60 * 5, // 5 minutes
};

// Patterns to identify request types
const PATTERNS = {
  static: /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/,
  api: /\/api\//,
  price: /\/api\/prices|\/api\/quotes|\/api\/market-data|query\.yahooapis|finance\.yahoo/,
  firebase: /firestore\.googleapis\.com|firebase/,
  page: /^https?:\/\/[^/]+\/[^.]*$/,
};

// Background sync queue name
const SYNC_QUEUE = 'tradepilot-sync-queue';

/**
 * Install Event - Precache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching app shell');
        return cache.addAll(PRECACHE_ASSETS.map((url) => new Request(url, { cache: 'reload' })));
      })
      .then(() => {
        console.log('[SW] Precache complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Precache failed:', error);
      })
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete old cache versions
              return (
                name.startsWith('tradepilot-') &&
                name !== STATIC_CACHE &&
                name !== DYNAMIC_CACHE &&
                name !== DATA_CACHE &&
                name !== PRICE_CACHE
              );
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch Event - Implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extensions and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip auth pages - they need fresh content for OAuth redirect handling
  // Caching auth pages can cause issues with OAuth state and redirects
  if (url.pathname.startsWith(BASE_PATH + 'auth/')) {
    return;
  }

  // Determine caching strategy based on request type
  if (PATTERNS.static.test(url.pathname)) {
    // Static assets: Cache-first
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (PATTERNS.price.test(url.pathname) || PATTERNS.price.test(url.href)) {
    // Price/market data: Stale-while-revalidate (show cached prices fast, refresh in background)
    event.respondWith(staleWhileRevalidate(request, PRICE_CACHE));
  } else if (PATTERNS.api.test(url.pathname) || PATTERNS.firebase.test(url.href)) {
    // API calls: Network-first with cache fallback
    event.respondWith(networkFirst(request, DATA_CACHE));
  } else if (url.origin === self.location.origin) {
    // Same-origin pages: Stale-while-revalidate
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

/**
 * Cache-First Strategy
 * Best for static assets that rarely change
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed:', request.url);
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Network-First Strategy
 * Best for API calls where fresh data is preferred
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, trying cache:', request.url);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return a meaningful offline response for API calls
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'You are offline. Data may be stale.',
        cached: false,
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Stale-While-Revalidate Strategy
 * Best for pages where showing stale content quickly is acceptable
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Fetch from network in the background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(async () => {
      // If network fails and no cache, return offline page
      const offlineResponse = await cache.match(BASE_PATH + 'offline.html');
      return offlineResponse || new Response('Offline', { status: 503 });
    });

  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

/**
 * Background Sync - Handle failed write operations
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === SYNC_QUEUE) {
    event.waitUntil(processSyncQueue());
  }
});

/**
 * Process queued sync operations
 */
async function processSyncQueue() {
  try {
    // Open IndexedDB to get queued operations
    const db = await openSyncDB();
    const tx = db.transaction('sync-queue', 'readonly');
    const store = tx.objectStore('sync-queue');
    const operations = await getAllFromStore(store);

    console.log('[SW] Processing', operations.length, 'queued operations');

    for (const op of operations) {
      try {
        const response = await fetch(op.url, {
          method: op.method,
          headers: op.headers,
          body: op.body,
        });

        if (response.ok) {
          // Remove from queue on success
          await removeFromSyncQueue(db, op.id);
          console.log('[SW] Synced operation:', op.id);

          // Notify clients of successful sync
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: 'SYNC_COMPLETED',
              operationId: op.id,
            });
          });
        }
      } catch (error) {
        console.error('[SW] Failed to sync operation:', op.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Error processing sync queue:', error);
  }
}

/**
 * IndexedDB helpers for sync queue
 */
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('tradepilot-sync', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('sync-queue')) {
        db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function removeFromSyncQueue(db, id) {
  const tx = db.transaction('sync-queue', 'readwrite');
  const store = tx.objectStore('sync-queue');
  store.delete(id);
  return new Promise((resolve) => {
    tx.oncomplete = resolve;
  });
}

/**
 * Push Notification Handler
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const defaultOptions = {
    icon: BASE_PATH + 'icons/icon-192x192.png',
    badge: BASE_PATH + 'icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
    },
  };

  try {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'TradePilot';
    const options = { ...defaultOptions, ...data.options };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error('[SW] Push notification error:', error);
  }
});

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || (BASE_PATH + 'dashboard');

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }

      // Open new window if no existing window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

/**
 * Message Handler - Communicate with main thread
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_CACHE_STATUS':
      getCacheStatus().then((status) => {
        event.ports[0].postMessage(status);
      });
      break;

    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;

    case 'QUEUE_SYNC':
      queueSyncOperation(payload).then((id) => {
        event.ports[0].postMessage({ success: true, id });
      });
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

/**
 * Get cache status for debugging
 */
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    status[name] = keys.length;
  }

  return status;
}

/**
 * Clear all caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

/**
 * Queue a sync operation for later
 */
async function queueSyncOperation(operation) {
  const db = await openSyncDB();
  const tx = db.transaction('sync-queue', 'readwrite');
  const store = tx.objectStore('sync-queue');

  return new Promise((resolve, reject) => {
    const request = store.add({
      ...operation,
      timestamp: Date.now(),
    });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      // Request background sync
      if ('sync' in self.registration) {
        self.registration.sync.register(SYNC_QUEUE);
      }
      resolve(request.result);
    };
  });
}

console.log('[SW] Service worker loaded');
