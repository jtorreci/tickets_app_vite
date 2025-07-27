# 🎫 Gestor de Investigación - Tickets App

Una aplicación web moderna para la gestión de proyectos de investigación con sistema de tickets tipo Kanban, desarrollada con React, Vite y Firebase.

## ✨ Características

### 🔐 Autenticación y Autorización
- **Sistema de usuarios completo** con registro e inicio de sesión
- **Roles diferenciados**: Superusuario, Admin, Miembro y Pendiente
- **Gestión de usuarios** (solo para superusuarios)
- **Protección de rutas** según permisos

### 📊 Gestión de Proyectos
- **Dashboard de proyectos** con vista de tarjetas
- **Creación y edición** de proyectos (Admin/Superusuario)
- **Sistema de equipos** con miembros asignados
- **Organización visual** de todos los proyectos

### 🎯 Sistema de Tickets Kanban
- **Tablero Kanban** con 3 estados: Pendiente, En Progreso, Hecho
- **Gestión de dependencias** entre tickets
- **Asignación automática** de tickets a usuarios
- **Fechas preferidas** para organización temporal
- **Bloqueo automático** por dependencias no completadas
- **Reversión de estados** (Hecho → En Progreso → Pendiente)

### 🎨 Interfaz de Usuario
- **Diseño responsivo** con Tailwind CSS v4
- **Modo oscuro automático** según preferencias del sistema
- **Iconos elegantes** con Lucide React
- **Componentes modales** para formularios
- **Indicadores visuales** de estado y progreso

## 🛠️ Tecnologías

### Frontend
- **React 19** - Biblioteca de interfaz de usuario
- **Vite 7** - Bundler y dev server ultrarrápido
- **Tailwind CSS 4** - Framework de CSS utility-first
- **Lucide React** - Iconos SVG optimizados

### Backend & Base de Datos
- **Firebase Authentication** - Autenticación de usuarios
- **Cloud Firestore** - Base de datos NoSQL en tiempo real
- **Firebase Hosting** - Hosting estático

### Herramientas de Desarrollo
- **ESLint** - Linter para JavaScript/React
- **PostCSS** - Procesador de CSS
- **TypeScript** - Tipado estático (configuración incluida)

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta de Firebase

### 1. Clonar el repositorio
```bash
git clone [url-del-repositorio]
cd tickets_app_vite
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Firebase
1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilitar Authentication (Email/Password)
3. Crear base de datos Firestore
4. Copiar la configuración de Firebase
5. Reemplazar la configuración en `src/App.jsx` (líneas 27-34)

```javascript
const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "tu-sender-id",
  appId: "tu-app-id"
};
```

### 4. Ejecutar en desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📖 Uso

### Primera configuración
1. **Registrar el primer usuario** - Se creará con rol "pending"
2. **Promover a superusuario** - Manualmente en Firebase Console cambiar el campo `role` a `"superuser"`
3. **Gestionar usuarios** - El superusuario puede asignar roles desde la aplicación

### Flujo de trabajo
1. **Crear proyectos** (Admin/Superusuario)
2. **Agregar tickets** al proyecto
3. **Asignar dependencias** entre tickets
4. **Los miembros toman tickets** disponibles
5. **Completar tickets** siguiendo el flujo Kanban

## 🏗️ Estructura del Proyecto

```
src/
├── App.jsx          # Componente principal con toda la lógica
├── App.css          # Estilos del componente principal
├── main.jsx         # Punto de entrada de React
├── index.css        # Estilos globales y Tailwind
└── assets/          # Recursos estáticos
```

## 🗃️ Estructura de Datos (Firestore)

### Colecciones

#### `projects`
```javascript
{
  name: string,
  description: string,
  ownerId: string,
  teamMembers: string[],
  createdAt: Timestamp
}
```

#### `tickets`
```javascript
{
  title: string,
  description: string,
  status: 'todo' | 'inProgress' | 'done',
  projectId: string,
  assigneeId: string | null,
  dependencies: string[],
  isLocked: boolean,
  preferredDate: Timestamp | null,
  createdAt: Timestamp,
  startedAt: Timestamp | null,
  completedAt: Timestamp | null
}
```

#### `team_members`
```javascript
{
  username: string,
  email: string,
  role: 'pending' | 'member' | 'admin' | 'superuser'
}
```

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

## 🤝 Contribución

1. Fork del proyecto
2. Crear branch para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Desarrollado por

[Tu nombre] - [Tu email]

---

⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub!
