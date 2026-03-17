/* global self */
// Firebase Messaging service worker for background push notifications.
// This file must live in /public so it’s served from the site root.

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// NOTE: These values must match your Firebase web app config.
firebase.initializeApp({
  apiKey: "AIzaSyBgYxUIvbNp5v2cwQlqA2Us5zMQrEH43cM",
  authDomain: "the-bethel-ams.firebaseapp.com",
  projectId: "the-bethel-ams",
  storageBucket: "the-bethel-ams.firebasestorage.app",
  messagingSenderId: "776104711238",
  appId: "1:776104711238:web:4e44e917db1171460d2647"
});

const messaging = firebase.messaging();

// Show notification when a push arrives while app is in background.
messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || payload?.data?.title || 'Bethel AMS';
  const body = payload?.notification?.body || payload?.data?.body || '';

  const notificationOptions = {
    body,
    icon: '/image.svg',
    badge: '/image.svg',
    data: {
      url: payload?.data?.url || '/',
      ...payload?.data
    }
  };

  self.registration.showNotification(title, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
      return undefined;
    })
  );
});

