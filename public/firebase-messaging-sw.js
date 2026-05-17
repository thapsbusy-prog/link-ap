/**
 * CRITICAL — DO NOT RENAME OR MOVE THIS FILE
 *
 * Firebase Cloud Messaging requires a service worker at
 * exactly this path: /firebase-messaging-sw.js
 *
 * Mobile browsers (Android Chrome, iOS Safari PWA) look
 * for this exact filename to handle background push
 * notifications. If this file is renamed, moved, or
 * deleted, background push notifications will silently
 * stop working on ALL mobile devices.
 *
 * This file must:
 * - Stay at public/firebase-messaging-sw.js
 * - Use importScripts (not ES module imports)
 * - Use Firebase compat SDK (not modular SDK)
 * - Keep the same Firebase config as src/firebase.js
 * - Keep onBackgroundMessage returning the
 *   showNotification promise
 * - Keep notificationclick opening /?tab=messages
 *
 * If you update the Firebase SDK version in package.json,
 * update the importScripts version numbers here too.
 * Current version: 10.12.0
 *
 * VAPID key is stored in Vercel as REACT_APP_VAPID_KEY
 * It must be the Web Push certificate Key Pair from:
 * Firebase Console > Project Settings > Cloud Messaging
 * > Web Push certificates > Key pair
 * Do NOT use a URL, Stripe key, or any other value.
 */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA4kG7r9eAsg0fONVB9-p4A3prvcGb4nOo",
  authDomain: "link-ap.firebaseapp.com",
  projectId: "link-ap",
  storageBucket: "link-ap.firebasestorage.app",
  messagingSenderId: "480905186078",
  appId: "1:480905186078:web:16bae391fc4c6361db570f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'New message';
  const body = payload.notification?.body || payload.data?.body || '';
  return self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: payload.data?.url || '/?tab=messages' },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/?tab=messages';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});
