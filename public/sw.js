/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDZue-YNNb1s4YH4oqTkozsBb3UxGNGAuc",
    authDomain: "mivis-studio.firebaseapp.com",
    projectId: "mivis-studio",
    storageBucket: "mivis-studio.firebasestorage.app",
    messagingSenderId: "48321228883",
    appId: "1:48321228883:web:503d0a7c53beedc55256a6",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title || 'Mivis Studio 💅';
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: (payload.data && payload.data.bookingId) ? payload.data.bookingId : 'mivis-alert',
        renotify: true,
        vibrate: [500, 110, 500],
        requireInteraction: true,
        data: {
            url: (payload.data && payload.data.url) ? payload.data.url : '/'
        }
    };
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Standard SW events
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('push', function(event) {
    if (event.data) {
        let data = { title: 'Mivis Studio', body: 'Nueva actualización' };
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
            data.title = 'Mivis Studio 💅';
        }
        
        // Skip manual push if it's already handled by Firebase Messaging SDK (onBackgroundMessage)
        if (data.from || data.priority || data.notification) return;

        const options = {
            body: data.body,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: data.bookingId || 'mivis-general',
            vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450],
            requireInteraction: true,
            data: {
                url: data.url || '/'
            }
        };
        event.waitUntil(
            self.registration.showNotification(data.title || 'Mivis Studio 💅', options)
        );
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow(event.notification.data.url || '/');
        })
    );
});
