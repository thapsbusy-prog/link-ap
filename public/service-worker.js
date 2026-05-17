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

const firebaseMessaging = firebase.messaging();

firebaseMessaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'New message';
  const body = payload.notification?.body || payload.data?.body || '';
  const options = {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: payload.data?.url || '/?tab=messages' },
  };
  return self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/?tab=messages';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

const CACHE_NAME = 'link-ap-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first (important for Firebase real-time to keep working)
self.addEventListener('fetch', event => {
  // Skip non-GET and cross-origin requests (e.g. Firebase, Firestore)
  if (
    event.request.method !== 'GET' ||
    !event.request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache a copy of successful responses
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // Offline fallback: serve from cache
        return caches.match(event.request).then(
          cached => cached || caches.match('/index.html')
        );
      })
  );
});