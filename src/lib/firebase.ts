import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDZue-YNNb1s4YH4oqTkozsBb3UxGNGAuc",
    authDomain: "mivis-studio.firebaseapp.com",
    projectId: "mivis-studio",
    storageBucket: "mivis-studio.firebasestorage.app",
    messagingSenderId: "48321228883",
    appId: "1:48321228883:web:503d0a7c53beedc55256a6",
    measurementId: "G-EK0M3YDXK2"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
