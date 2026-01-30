# 🎫 Synaptic Flow - Sistema de Gestión de Proyectos y Tickets

Una aplicación web moderna para la gestión de proyectos de investigación con sistema de tickets tipo Kanban, desarrollada con React, Vite y Firebase.

## 📋 Tabla de Contenidos

1. [Características](#-características)
2. [Tecnologías](#-tecnologías)
3. [Instalación](#-instalación-y-configuración)
4. [Estructura del Proyecto](#-estructura-del-proyecto)
5. [Estructura de Datos](#-estructura-de-datos)
6. [Documentación](#-documentación)
7. [Despliegue](#-despliegue)

---

## ✨ Características

### 🔐 Autenticación y Autorización
- **Sistema de usuarios completo** con registro e inicio de sesión
- **Roles diferenciados**: `pending`, `member`, `admin`, `superuser`
- **Gestión de usuarios** (solo para superusuarios)
- **Protección de rutas** según permisos

### 📊 Gestión de Proyectos
- **Dashboard de proyectos** con vista de tarjetas
- **Creación y edición** de proyectos (Admin/Superusuario)
- **Sistema de equipos** con miembros asignados por proyecto
- **Organización jerárquica** con subtareas anidadas
- **Vinculación de proyectos** externos como subtareas

### 🎯 Sistema de Tickets Kanban
- **Tablero Kanban** con 3 columnas: Pendiente, En Progreso, Hecho
- **Gestión de dependencias** entre tickets
- **Asignación manual** de tickets a usuarios
- **Cálculo de holgura** y fechas críticas (Early Start, Late Finish)
- **Bloqueo automático** por dependencias no completadas
- **Reversión de estados** (Hecho → En Progreso → Pendiente)

### ⏱️ Control de Tiempo
- **Horas estimadas** por tarea y proyecto
- **Horas reales** registradas al completar
- **Desviación** automática entre estimado y real
- **Agregación de horas** para proyectos con subtareas

### 🎨 Interfaz de Usuario
- **Diseño responsivo** con Tailwind CSS v4
- **Modo oscuro automático** según preferencias del sistema
- **Iconos** con Lucide React
- **Breadcrumbs** de navegación jerárquica
- **Dashboard personal** de carga de trabajo

---

## 🛠️ Tecnologías

### Frontend
| Tecnología | Propósito |
|------------|-----------|
| React 19 | Biblioteca de interfaz de usuario |
| Vite 7 | Bundler y dev server ultrarrápido |
| Tailwind CSS 4 | Framework de CSS utility-first |
| Lucide React | Iconos SVG optimizados |

### Backend & Base de Datos
| Servicio | Propósito |
|----------|-----------|
| Firebase Authentication | Autenticación de usuarios |
| Cloud Firestore | Base de datos NoSQL en tiempo real |
| Firebase Hosting | Hosting estático |

### Herramientas de Desarrollo
| Herramienta | Propósito |
|-------------|-----------|
| ESLint | Linter para JavaScript/React |
| PostCSS | Procesador de CSS |

---

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Cuenta de Firebase

### 1. Instalar dependencias
```bash
cd tickets_app_vite
npm install
```

### 2. Configurar Variables de Entorno
Crear un archivo `.env` en la raíz del proyecto:

```env
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
VITE_FIREBASE_APP_ID=tu-app-id
```

### 3. Configurar Firebase Console
1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilitar **Authentication** (Email/Password)
3. Crear base de datos **Firestore** en modo producción
4. Copiar las credenciales al archivo `.env`

### 4. Ejecutar en Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`

---

## 🏗️ Estructura del Proyecto

```
tickets_app_vite/
├── src/
│   ├── components/
│   │   ├── AuthScreen.jsx           # Pantalla de login/registro
│   │   ├── BoardColumn.jsx          # Columna del tablero Kanban
│   │   ├── LogHoursModal.jsx        # Modal de registro de horas
│   │   ├── Modal.jsx                # Componente modal genérico
│   │   ├── MyWorkloadDashboard.jsx  # Dashboard personal
│   │   ├── ProjectsDashboard.jsx    # Grid de proyectos
│   │   ├── Spinner.jsx              # Indicador de carga
│   │   ├── TaskCard.jsx             # Tarjeta de tarea
│   │   ├── TaskForm.jsx             # Formulario de tareas
│   │   ├── TeamManagement.jsx       # Gestión de equipo
│   │   └── UserManagement.jsx       # Gestión de usuarios
│   ├── App.jsx                      # Componente principal
│   ├── main.jsx                     # Punto de entrada
│   ├── index.css                    # Estilos globales
│   └── App.css                      # Estilos del componente
├── public/
├── package.json
├── vite.config.js
├── tailwind.config.cjs
└── README.md
```

---

## 🗃️ Estructura de Datos (Firestore)

### Colección: `tasks`
Almacena tanto proyectos como tareas/subtareas.

```javascript
{
  // Identificación
  id: string,                    // ID del documento
  title: string,                 // Título de la tarea/proyecto
  description: string,           // Descripción detallada

  // Jerarquía
  parentId: string | null,       // ID del padre (null para proyectos)
  projectId: string | null,      // ID del proyecto raíz
  isProject: boolean,            // true si es un proyecto raíz

  // Estado y flujo
  status: 'todo' | 'inProgress' | 'done',
  assigneeId: string | null,     // ID del usuario asignado
  taskType: 'standard' | 'linkedProject',

  // Dependencias
  dependencies: string[],        // IDs de tareas dependientes
  isLocked: boolean,             // Bloqueado por dependencias

  // Fechas y tiempo
  plannedStartDate: Timestamp,   // Fecha de inicio prevista
  expirationDate: Timestamp,     // Fecha límite
  preferredDate: Timestamp,      // Fecha preferida
  expectedHours: number,         // Horas estimadas
  actualHours: number,           // Horas reales (al completar)
  startedAt: Timestamp,          // Cuándo empezó
  completedAt: Timestamp,        // Cuándo se completó

  // Métricas calculadas
  earliestStartDate: Timestamp,  // Inicio temprano (CPM)
  latestFinishDate: Timestamp,   // Fin tardío (CPM)
  slack: number,                 // Holgura en días

  // Equipo
  team: Array<{                  // Miembros del proyecto
    userId: string,
    role: 'admin' | 'member'
  }>,
  memberIds: string[],           // IDs de miembros

  // Sistema
  createdAt: Timestamp,          // Fecha de creación
  deleted: boolean               // Soft delete
}
```

### Colección: `team_members`
Usuarios registrados en el sistema.

```javascript
{
  id: string,                    // ID del documento (uid de Auth)
  username: string,              // Nombre de usuario
  email: string,                 // Email
  role: 'pending' | 'member' | 'admin' | 'superuser'
}
```

### Colección: `messages`
Solicitudes y notificaciones entre usuarios.

```javascript
{
  type: 'linkingRequest',        // Tipo de mensaje
  senderId: string,              // ID del remitente
  senderName: string,            // Nombre del remitente
  recipientId: string,           // ID del destinatario
  data: {                        // Datos específicos del mensaje
    projectToLinkId: string,
    projectToLinkName: string,
    parentProjectId: string,
    parentProjectName: string
  },
  createdAt: Timestamp
}
```

---

## 📖 Documentación

### Para Desarrolladores
- **README.md**: Este archivo - instalación y arquitectura
- **Docstrings**: Comentarios Sphinx en cada componente
- **USER_GUIDE.md**: Guía para usuarios finales (generar con Sphinx)

### Generar Documentación Sphinx
```bash
pip install sphinx
sphinx-quickstart docs
# Configurar para usar src/ como origen
make html
```

---

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Vista previa de build
npm run preview

# Linting
npm run lint
```

---

## 🚀 Despliegue

### Firebase Hosting
```bash
# Build del proyecto
npm run build

# Instalar Firebase CLI
npm install -g firebase-tools

# Login y configurar
firebase login
firebase init hosting

# Desplegar
firebase deploy
```

### Alternativa: Vercel
```bash
npm i -g vercel
vercel
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

## 👨‍💻 Desarrollado por

Desarrollo - [Universidad]

