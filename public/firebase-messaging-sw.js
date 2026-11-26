/* Aigameria v1.02 - FCM web push service worker.
   Loaded from the site root so the scope covers the whole app.
   Firebase compat SDK is self-hosted (some networks block gstatic). */
importScripts('/firebase/firebase-app-compat.js');
importScripts('/firebase/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDrOD3VILHkYG9NYGK9pHKF-iJs7cGpKz4',
  authDomain: 'aigameria-476ab.firebaseapp.com',
  projectId: 'aigameria-476ab',
  storageBucket: 'aigameria-476ab.firebasestorage.app',
  messagingSenderId: '351322992462',
  appId: '1:351322992462:web:4080090dbf5b5c184bf81f',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || 'AIGAMERIA';
  const body = payload?.notification?.body || '';
  const url = (payload?.data && payload.data.url) || '/';
  self.registration.showNotification(title, {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: payload?.data?.tag || undefined,
    data: { url },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const client of list) {
      if ('focus' in client) { client.navigate(target); return client.focus(); }
    }
    return clients.openWindow(target);
  }));
});
