/**
 * Service Worker Registration
 *
 * Registers the service worker, handles updates, and manages errors.
 * Import this module from layout scripts to enable SW support.
 */

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] New version available');
            window.dispatchEvent(
              new CustomEvent('sw-update-available', { detail: { registration } })
            );
          }
        });
      });

      console.log('[SW] Service worker registered');
    } catch (error) {
      console.error('[SW] Registration failed:', error);
    }
  });
}

/** Tell the waiting service worker to activate immediately */
export function skipWaiting(registration: ServiceWorkerRegistration): void {
  registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
}

// Auto-register on import
registerServiceWorker();
