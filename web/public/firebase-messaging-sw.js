/**
 * Firebase Messaging Service Worker
 *
 * Handles push notifications when the app is in the background or closed.
 * This file must be at the root of the public folder.
 */

// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase with your config
// Note: These values should match your Firebase project configuration
firebase.initializeApp({
  apiKey: 'AIzaSyD-placeholder',
  authDomain: 'tradepilot-placeholder.firebaseapp.com',
  projectId: 'tradepilot-placeholder',
  storageBucket: 'tradepilot-placeholder.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abc123',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'TradePilot Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: payload.data?.tag || 'tradepilot-notification',
    data: payload.data,
    actions: getNotificationActions(payload.data?.type),
    vibrate: [100, 50, 100],
    requireInteraction: payload.data?.requireInteraction === 'true',
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);

  event.notification.close();

  const clickAction = event.notification.data?.clickAction || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already an open window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            payload: event.notification.data,
          });
          return client.navigate(clickAction);
        }
      }

      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});

// Handle notification action button clicks
self.addEventListener('notificationclick', (event) => {
  if (event.action === 'view') {
    const url = event.notification.data?.url || '/dashboard';
    event.waitUntil(clients.openWindow(url));
  } else if (event.action === 'dismiss') {
    event.notification.close();
  }
});

// Get notification actions based on notification type
function getNotificationActions(type) {
  switch (type) {
    case 'alert_triggered':
      return [
        { action: 'view', title: 'View Alert' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    case 'trade_executed':
      return [
        { action: 'view', title: 'View Trade' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    case 'portfolio_update':
      return [
        { action: 'view', title: 'View Portfolio' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    default:
      return [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
  }
}
