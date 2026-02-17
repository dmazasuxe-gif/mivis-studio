# 🌐 Cómo Conectar tu Dominio .com a Vercel

Sigue estos pasos para que tu dominio (ej. `mivisstudio.com`) muestre tu sistema Mivis Studio.

---

## 🚀 PASO 1: Configurar en Vercel

1. Entra a tu proyecto en **[vercel.com](https://vercel.com/dashboard)**.
2. Ve a la pestaña **Settings** (Configuración) -> **Domains** (Dominios).
3. Escribe tu dominio (ej. `mivisstudio.com`) en el campo de texto y dale a **Add**.
4. Vercel te mostrará una tabla con unos valores "Mágicos" (DNS Records).
   - **Type:** A
   - **Value:** `76.76.21.21` (Este es el número de Vercel)
   - **Type:** CNAME
   - **Value:** `cname.vercel-dns.com`

**¡No cierres esta pestaña!** Necesitarás copiar esos números.

---

## 🛠️ PASO 2: Configurar donde compraste el Dominio

Entra a la página donde compraste el dominio (GoDaddy, Namecheap, etc.) y busca la opción **"DNS Management"** o **"Administrar DNS"**.

### Opción A: Método Fácil (Nameservers)
Si te deja cambiar los "Nameservers" (Servidores de Nombres), selecciona **"Custom"** (Personalizados) y pon estos dos:
1. `ns1.vercel-dns.com`
2. `ns2.vercel-dns.com`

*Este método tarda unas horas pero es el más limpio.*

### Opción B: Método Rápido (Registros A y CNAME)
Si prefieres editar los registros manualmente (o el método A no funciona):

1. **Borra** cualquier registro "A" o "CNAME" antiguo que veas (que apunte a "Parking" o cosas raras).
2. **Agrega un Nuevo Registro:**
   - **Tipo:** A
   - **Nombre:** @
   - **Valor:** `76.76.21.21`
   - **TTL:** 1 Hora (o lo que salga por defecto)
3. **Agrega Otro Registro:**
   - **Tipo:** CNAME
   - **Nombre:** www
   - **Valor:** `cname.vercel-dns.com`
   - **TTL:** 1 Hora

---

## ✅ PASO 3: ¡Listo!

Vuelve a Vercel.
- Al principio verás un icono ⚠️ o "Invalid Configuration".
- Espera unos minutos (a veces hasta 24h, pero suele ser rápido).
- Cuando veas el icono ✅ verde, ¡tu dominio ya funciona!

¡Felicidades! Ahora eres dueño de tu propio rincón en internet. 🌍✨
