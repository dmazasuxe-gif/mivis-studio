# 🚀 Mivis Studio: Guía de Despliegue a Internet

¡Felicidades! Tu sistema está listo para vivir en la nube. Sigue estos pasos para obtener tu enlace propio (ej. `mivis-studio.vercel.app`) y conectarlo a tu dominio `.com`.

---

## 🌍 OPCIÓN A: Despliegue Rápido (Recomendado)

Usaremos **Vercel**, la plataforma oficial de Next.js. Es gratis, rápida y profesional.

### Paso 1: Crear tu Cuenta
1. Entra a [vercel.com](https://vercel.com/signup).
2. Regístrate con tu cuenta de **GitHub**, GitLab o Bitbucket (es lo más fácil).

### Paso 2: Subir tu Código
*(Si ya tienes el código en GitHub, salta al punto 3. Si no, sigue leyendo)*
1. Descarga este proyecto en tu computadora.
2. Crea un nuevo repositorio en [GitHub.com](https://github.com/new).
3. Sube los archivos de tu proyecto a ese repositorio.

### Paso 3: Conectar Vercel
1. En tu panel de Vercel, dale clic a **"Add New..."** -> **"Project"**.
2. Selecciona tu repositorio de GitHub (`makeup-studio`).
3. Vercel detectará que es Next.js automáticamente.
4. Dale clic a **Deploy**.

¡Espera 1 minuto y listo! Vercel te dará un link público (ej. `makeup-studio-tau.vercel.app`).

---

## 💎 OPCIÓN B: Tu Dominio Propio (.com)

Para tener `mivis_studio.com`:

1. Ve a tu proyecto en Vercel -> **Settings** -> **Domains**.
2. Escribe tu dominio (ej. `mivisstudio.com`).
3. Vercel te dará unos códigos (DNS Records).
4. Ve a donde compraste tu dominio (GoDaddy, Namecheap) y copia esos códigos.
5. ¡En 24h tu dominio estará activo!

---

## ⚠️ NOTA IMPORTANTE: Sincronización de Datos

Actualmente, el sistema usa **Almacenamiento Local (Local Storage)**.
Esto significa que:
- Si entras desde tu PC, ves los datos de tu PC.
- Si entras desde tu Celular, ves los datos de tu Celular (estará vacío al inicio).
- Tus clientes verán su propia "sesión" al reservar.

### ¿Cómo lograr que TODOS vean lo mismo en tiempo real?
Necesitamos conectar una **Base de Datos en la Nube** (como **Supabase**).

**El plan para la Fase 2 (Sincronización Total):**
1. Crear proyecto en [Supabase.com](https://supabase.com).
2. Conectar Mivis Studio a Supabase usando las claves API.
3. ¡Listo! Una reserva hecha en China aparecerá en tu celular al instante.

*Este código ya está preparado estructuralmente para ese cambio.*

---
**Desarrollado con ❤️ por Google AntiGravity**
