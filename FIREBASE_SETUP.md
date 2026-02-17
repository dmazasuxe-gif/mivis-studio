# 🔥 Guía Paso a Paso: Crear tu Base de Datos en Firebase

Sigue estos pasos para que Mivis Studio pueda guardar datos en la nube de forma segura y permanente.

---

## 1. Crear el Proyecto en Firebase

1. Ve a **[console.firebase.google.com](https://console.firebase.google.com)** e inicia sesión con tu cuenta de Google.
2. Haz clic en **"Add project"** (Agregar proyecto).
3. Ponle un nombre, por ejemplo: **`mivis-studio-app`**.
4. (Opcional) Desactiva Google Analytics (no lo necesitamos por ahora) y dale a **Create project**.
5. Espera unos segundos y dale a **Continue**.

---

## 2. Activar la Base de Datos (Firestore)

1. En el menú de la izquierda, busca **Build** y luego haz clic en **Firestore Database**.
2. Haz clic en el botón **"Create database"**.
3. **Ubicación:** Elige la que diga `nam5 (us-central)` o la que salga por defecto. Dale a **Next**.
4. **Reglas de seguridad:** Elige la opción **"Start in production mode"** (Modo producción).
5. Dale a **Create**.

---

## 3. Configurar las Reglas de Acceso (Importante 🔓)

Una vez creada la base de datos, verás unas pestañas arriba (Data, Rules, Indexes...).

1. Haz clic en la pestaña **Rules** (Reglas).
2. Borra todo el código que hay y pega este (que permite guardar datos siempre):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Dale al botón **Publish** (Publicar).

---

## 4. Obtener tus Llaves Secretas (API Keys) 🔑

1. Haz clic en el engranaje ⚙️ (al lado de Project Overview arriba a la izquierda) y elige **Project settings**.
2. Baja hasta el final donde dice **Your apps**.
3. Haz clic en el icono **</>** (Web).
4. Ponle un apodo a la app (ej. `Mivis Web`) y dale a **Register app**.
5. Te aparecerá un bloque de código con algo como `const firebaseConfig = { ... }`.
   - **NO CIERRES ESTA PANTALLA AÚN.**

---

## 5. Conectar Mivis Studio con Firebase

Ahora vuelve a tu editor de código (aquí en tu computadora).

1. Abre el archivo: `src/lib/firebase.ts`.
2. Verás que hay unos valores que dicen `"TU_API_KEY"`, `"TU_AUTH_DOMAIN"`, etc.
3. Reemplaza esos valores con los que te dio Firebase en el paso anterior.

Ejemplo de cómo debe quedar (pero con tus propios códigos):
```typescript
const firebaseConfig = {
  apiKey: "AIzaSyD-Ejemplo...",
  authDomain: "mivis-studio-app.firebaseapp.com",
  projectId: "mivis-studio-app",
  storageBucket: "mivis-studio-app.appspot.com",
  messagingSenderId: "123456...",
  appId: "1:123456:web:..."
};
```

---

¡Y LISTO! 🚀
Ahora Mivis Studio guardará todo en tu propia nube privada. Los datos nunca se perderán, incluso si formateas tu computadora.
