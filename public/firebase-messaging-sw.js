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

messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title || 'Mivis Studio 💅';
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: (payload.data && payload.data.bookingId) ? payload.data.bookingId : 'mivis-alert',
        vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40, 450],
        requireInteraction: true,
        data: {
            url: (payload.data && payload.data.url) ? payload.data.url : '/'
        }
    };
    return self.registration.showNotification(notificationTitle, notificationOptions);
});
