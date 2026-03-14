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
    // Note: Manual notification disabled to avoid duplicates with automatic FCM behavior.
});
