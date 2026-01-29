# Instrucciones para Configurar Secrets en GitHub - Sección 4.2

## ✅ Datos ya identificados:

**App ID:** `1:599491772663:web:98559bc6509112d0e013f2`
**Project ID:** `tickets-app-2206`
**Project Number:** `599491772663`

## 🔧 Pasos para completar la configuración:

### 1. Obtener el Service Account completo:

Ve a Firebase Console:
1. https://console.firebase.google.com/
2. Selecciona tu proyecto: **tickets-app-2206**
3. Ve a **Configuración** (⚙️) → **Cuentas de servicio**
4. Click en **"Generar nueva clave privada"**
5. Selecciona **JSON** como formato
6. Click en **"Generar clave"**
7. Se descargará un archivo JSON - este es tu service-account.json completo

### 2. Configurar Secrets en GitHub:

Ve a tu repositorio en GitHub:
1. **Settings** → **Secrets and variables** → **Actions**
2. Click en **New repository secret** para cada uno:

| Secret Name | Valor exacto |
|-------------|-------------|
| `VITE_FIREBASE_API_KEY` | Obtén de Firebase Console → Configuración → General |
| `VITE_FIREBASE_AUTH_DOMAIN` | `tickets-app-2206.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `tickets-app-2206` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `tickets-app-2206.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `599491772663` |
| `VITE_FIREBASE_APP_ID` | `1:599491772663:web:98559bc6509112d0e013f2` |
| `FIREBASE_SERVICE_ACCOUNT` | **Contenido completo del JSON descargado** |
| `FIREBASE_PROJECT_ID` | `tickets-app-2206` |

### 3. Cómo copiar el FIREBASE_SERVICE_ACCOUNT:

1. Abre el archivo JSON que descargaste de Firebase
2. Copia TODO el contenido (desde `{` hasta `}`)
3. Pégalo como valor del secret `FIREBASE_SERVICE_ACCOUNT`
4. Asegúrate de mantener los saltos de línea y formato exacto

### 4. Obtener API Key faltante:

Si necesitas la API Key:
1. Ve a Firebase Console → **tickets-app-2206**
2. **Configuración** (⚙️) → **General**
3. En la sección "Tus apps", busca tu app web
4. Verás un fragmento de código con todas las credenciales incluyendo la API Key

## 📋 Resumen de tu App ID:

Tu App ID es: **1:599491772663:web:98559bc6509112d0e013f2**

Este es el valor exacto que debes poner en el secret `VITE_FIREBASE_APP_ID`.

## ✅ Una vez configurados todos los secrets:

1. Haz un commit y push a tu rama main
2. GitHub Actions se ejecutará automáticamente
3. Tu app se desplegará en: https://tickets-app-2206.web.app