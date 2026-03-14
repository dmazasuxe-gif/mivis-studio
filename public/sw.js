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
    console.log('[sw.js] Mensaje recibido en segundo plano: ', payload);
    // Note: We don't call showNotification manually here because the 
    // FCM payload already includes a 'notification' object which the 
    // browser handles automatically in the background.
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
        }
        
        // Skip if it's an FCM message already handled by onBackgroundMessage
        if (data.from || data.priority) return;

        const options = {
            body: data.body,
            icon: '/logo.png',
            badge: '/logo.png',
            vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40, 450],
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
            return clients.openWindow(event.notification.data.url);
        })
    );
});
