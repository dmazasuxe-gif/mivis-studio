// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 🔥 AQUÍ VAS A PEGAR TUS CLAVES DE FIREBASE 🔥
// 1. Ve a console.firebase.google.com
// 2. Crea un proyecto nuevo (ej. "Mivis Studio")
// 3. Ve a Configuración del Proyecto (rueda dentada) -> General
// 4. Baja hasta "Tus apps" -> Selecciona el icono </> (Web)
// 5. Copia el objeto "const firebaseConfig = { ... }" y pégalo aquí abajo:

const firebaseConfig = {
    apiKey: "AIzaSyDZue-YNNb1s4YH4oqTkozsBb3UxGNGAuc",
    authDomain: "mivis-studio.firebaseapp.com",
    projectId: "mivis-studio",
    storageBucket: "mivis-studio.firebasestorage.app",
    messagingSenderId: "48321228883",
    appId: "1:48321228883:web:503d0a7c53beedc55256a6",
    measurementId: "G-EK0M3YDXK2"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
