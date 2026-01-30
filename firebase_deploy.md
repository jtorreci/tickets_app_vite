# Deploy Automatizado a Firebase Hosting con GitHub Actions

Guía paso a paso para configurar deployment continuo desde GitHub a Firebase Hosting.

## 📋 Índice

1. [Requisitos Previos](#requisitos-previos)
2. [Paso 1: Preparar el Proyecto](#paso-1-preparar-el-proyecto)
3. [Paso 2: Crear Workflow de GitHub](#paso-2-crear-workflow-de-github)
4. [Paso 3: Obtener Credenciales de Firebase](#paso-3-obtener-credenciales-de-firebase)
5. [Paso 4: Configurar Secrets en GitHub](#paso-4-configurar-secrets-en-github)
6. [Paso 5: Subir a GitHub](#paso-5-subir-a-github)
7. [Paso 6: Probar el Deployment](#paso-6-probar-el-deployment)
8. [Solución de Problemas](#solución-de-problemas)

---

## 📋 Requisitos Previos

- Cuenta en [Firebase Console](https://console.firebase.google.com)
- Cuenta en [GitHub](https://github.com)
- Proyecto Firebase ya creado
- Node.js 20+ instalado localmente

---

## Paso 1: Preparar el Proyecto

### 1.1. Inicializar Firebase Hosting

```bash
cd tickets_app_vite

# Inicializar Firebase Hosting (si no está configurado)
firebase init hosting
```

**Respuestas recomendadas:**
```
? What do you want to use as your public directory? dist
? Configure as a single-page app (rewrite all urls to /index.html)? No
? Set up automatic builds and deployments with GitHub? Yes
? For which GitHub repository would you like to set up a GitHub workflow? usuario/repo
? What is the name of your GitHub workflow file? firebase-hosting.yml
```

### 1.2. Verificar firebase.json

Asegúrate de que `firebase.json` tenga:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

## Paso 2: Crear Workflow de GitHub

Crea el archivo `.github/workflows/firebase-hosting.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    name: Build and Deploy
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: ${{ secrets.FIREBASE_PROJECT_ID }}
          channelId: live
```

---

## Paso 3: Obtener Credenciales de Firebase

### 3.1. Generar Service Account Key

```bash
# En la terminal, dentro del proyecto
firebase use tu-proyecto-id
firebase admin:serviceaccount:get > service-account.json
```

**Importante:** Este archivo contiene credenciales sensibles. No lo compartas.

### 3.2. Obtener Configuración del Proyecto

Ve a Firebase Console → Tu Proyecto → Configuración (⚙️) → General

Copia los valores de:
- API Key
- Auth Domain
- Project ID
- Storage Bucket
- Messaging Sender ID
- App ID

---

## Paso 4: Configurar Secrets en GitHub

### 4.1. Acceder a Secrets del Repositorio

1. Ve a tu repositorio en GitHub
2. Click en **Settings**
3.左侧菜单: **Secrets and variables** → **Actions**
4. Click en **New repository secret**

### 4.2. Añadir Secrets

Añade los siguientes secrets:

| Secret Name | Valor |
|-------------|-------|
| `VITE_FIREBASE_API_KEY` | Tu API key de Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | `tu-proyecto.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `tu-proyecto-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `tu-proyecto.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Tu sender ID (número) |
| `VITE_FIREBASE_APP_ID` | Tu app ID |
| `FIREBASE_SERVICE_ACCOUNT` | **Contenido completo** del archivo `service-account.json` |
| `FIREBASE_PROJECT_ID` | `tu-proyecto-id` |

### 4.3. Ejemplo del Secret FIREBASE_SERVICE_ACCOUNT

Abre `service-account.json` y copia TODO su contenido:

```json
{
  "type": "service_account",
  "project_id": "tu-proyecto-id",
  "private_key_id": "abcdef123456...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk@tu-proyecto.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

---

## Paso 5: Subir a GitHub

### 5.1. Crear .gitignore

Crea o actualiza `.gitignore`:

```
# Dependencies
node_modules/

# Build output
dist/

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Firebase
firebase-debug.log
```

### 5.2. Inicializar Git

```bash
cd tickets_app_vite

# Inicializar repositorio
git init

# Añadir archivos
git add .

# Commit inicial
git commit -m "Initial commit: Synaptic Flow con deploy automático"
```

### 5.3. Crear Repositorio en GitHub

```bash
# Opción A: Usar GitHub CLI (recomendado)
gh repo create synaptic-flow --public --source=. --push

# Opción B: Manual
# 1. Ve a https://github.com/new
# 2. Crea un repositorio público
# 3. Ejecuta:
git remote add origin https://github.com/tu-usuario/synaptic-flow.git
git branch -M main
git push -u origin main
```

---

## Paso 6: Probar el Deployment

### 6.1. Hacer un cambio de prueba

```bash
# Edita algo pequeño en el código
echo "<!-- Test deployment -->" >> src/App.jsx

# Commit y push
git add .
git commit -m "Test: verificar deployment automático"
git push origin main
```

### 6.2. Verificar en GitHub Actions

1. Ve a tu repositorio en GitHub
2. Click en **Actions** tab
3. Verás el workflow "Deploy to Firebase Hosting" corriendo
4. Espera a que termine (verde ✓)

### 6.3. Verificar en Firebase

Una vez completado, visita:
- **Producción:** `https://tu-proyecto.web.app`

---

## 🔧 Solución de Problemas

### Error: "not found hardcoded，你的密钥"

**Problema:** Las variables de entorno no se cargan correctamente.

**Solución:** Verifica que todos los secrets estén correctamente configurados en GitHub.

### Error: "firebaseServiceAccount is not valid JSON"

**Problema:** El secret FIREBASE_SERVICE_ACCOUNT tiene problemas de formato.

**Solución:** Asegúrate de copiar TODO el JSON sin cortar y con los saltos de línea preservados.

### Error: "Build failed"

**Problema:** Error en el build de npm.

**Solución:**
```bash
# Prueba el build localmente
npm run build
```

### Error: "Permission denied"

**Problema:** La cuenta de servicio no tiene permisos.

**Solución:** En Firebase Console → IAM & Admin → IAM, verifica que la cuenta tenga rol "Firebase Admin".

### Error: "Project not found"

**Problema:** El projectId no coincide.

**Solución:** Verifica que `FIREBASE_PROJECT_ID` sea exactamente el ID del proyecto (no el nombre para mostrar).

---

## 📖 Flujo de Trabajo Futuro

```
1. Haz cambios en tu código local
2. git add .
3. git commit -m "Descripción del cambio"
4. git push origin main
5. ✅ GitHub Actions construye y despliega automáticamente
6. ✅ Tu app está actualizada en https://tu-proyecto.web.app
```

---

## 📚 Recursos Adicionales

- [Documentación de Firebase Hosting](https://firebase.google.com/docs/hosting)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Firebase Hosting GitHub Action](https://github.com/FirebaseExtended/action-hosting-deploy)

---

## ❓ ¿Tienes Problemas?

Si encuentras algún error:

1. Revisa la sección [Solución de Problemas](#solución-de-problemas)
2. Mira los logs en GitHub → Actions
3. Consulta la consola de Firebase para errores de deployment
4. Contacta indicando:
   - El error exacto
   - Captura de pantalla del log
   - Paso donde falló
