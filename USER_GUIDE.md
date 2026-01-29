# 📖 Guía de Usuario - Synaptic Flow

Sistema de gestión de proyectos y tickets para equipos de investigación.

---

## 📋 Tabla de Contenidos

1. [Introducción](#-introducción)
2. [Primeros Pasos](#-primeros-pasos)
3. [Conceptos Básicos](#-conceptos-básicos)
4. [Gestión de Proyectos](#-gestión-de-proyectos)
5. [Sistema Kanban](#-sistema-kanban)
6. [Gestión de Equipo](#-gestión-de-equipo)
7. [Control de Tiempo](#-control-de-tiempo)
8. [Dashboard Personal](#-dashboard-personal)
9. [Roles y Permisos](#-roles-y-permisos)
10. [Preguntas Frecuentes](#-preguntas-frecuentes)

---

## 🏠 Introducción

Synaptic Flow es una herramienta de gestión de proyectos diseñada para equipos de investigación. Permite:

- **Organizar proyectos** con estructura jerárquica (proyectos → subtareas)
- **Gestionar tareas** con método Kanban visual
- **Asignar trabajo** a miembros del equipo
- **Controlar tiempo** estimado vs. real
- **Vincular proyectos** relacionados
- **Colaborar** mediante solicitudes de vinculación

---

## 🚀 Primeros Pasos

### 1. Crear una Cuenta

1. Accede a la aplicación
2. Haz clic en **"¿No tienes cuenta? Regístrate"**
3. Completa:
   - **Nombre de usuario** (ej: "maria_garcia")
   - **Email** institucional
   - **Contraseña** (mínimo 6 caracteres)
4. Haz clic en **"Registrarse"**

> ⚠️ Tu cuenta tendrá rol **"Pendiente"** hasta que un superusuario la apruebe.

### 2. Iniciar Sesión

1. Introduce tu **email** y **contraseña**
2. Haz clic en **"Entrar"**
3. ¡Listo! Accederás al dashboard

### 3. Explorar la Interfaz

```
┌─────────────────────────────────────────────────────────────┐
│  Synaptic Flow           [🏠]  [💼]  Hola, María!  [🚪]     │
├─────────────────────────────────────────────────────────────┤
│  Proyectos  >  Mi Proyecto                                    │
│                                                             │
│  [+ Nuevo Proyecto]                                          │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ PROYECTO A  │  │ PROYECTO B  │  │ PROYECTO C  │          │
│  │  ████░░ 45% │  │  ██░░░░ 20% │  │  ██████ 90% │          │
│  │  12h / 24h  │  │  8h / 40h   │  │  45h / 50h  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 Conceptos Básicos

### Proyectos
Un **proyecto** es el contenedor principal de trabajo. Puede contener:
- Subtareas
- Equipos de trabajo
- Fechas límite
- Estimaciones de tiempo

### Tareas
Las **tareas** representan unidades de trabajo. Pueden:
- Ser independientes o tener subtareas
- Depender de otras tareas
- Estar asignadas a un miembro
- Bloquear otras tareas si no se completan

### Estados Kanban
| Estado | Descripción |
|--------|-------------|
| 📋 **Pendiente** | Tarea creada, nadie la ha cogido |
| 🔄 **En Progreso** | Alguien está trabajando en ella |
| ✅ **Hecho** | Tarea completada con horas registradas |

### Dependencias
Las **dependencias** crean relaciones de "necesita antes":
- Una tarea con dependencias está **bloqueada**
- Solo se puede trabajar cuando las dependencias están "Hechas"
- El sistema calcula fechas críticas automáticamente (CPM)

---

## 📁 Gestión de Proyectos

### Crear un Proyecto

1. Haz clic en **[+ Nuevo Proyecto]**
2. Completa el formulario:
   ```
   Título:        Análisis de Datos Q1
   Descripción:   Procesamiento de datos del experimento X
   Horas Est.:    40
   Inicio Prev:   [Fecha]
   Límite:        [Fecha]
   ```
3. Haz clic en **"Crear Tarea"**

### Editar un Proyecto

1. Pasa el ratón sobre la tarjeta del proyecto
2. Haz clic en el **lápiz** ✏️
3. Modifica los campos necesarios
4. Haz clic en **"Guardar Cambios"**

### Abrir un Proyecto

1. Haz clic en el botón **"Abrir"** del proyecto
2. Accederás al **tablero Kanban** de ese proyecto

### Eliminar un Proyecto

1. Pasa el ratón sobre la tarjeta del proyecto
2. Haz clic en la **papelera** 🗑️
3. Confirma con **"Aceptar"**

> ⚠️ No puedes eliminar proyectos con subtareas activas.

---

## 📋 Sistema Kanban

### El Tablero

```
┌─────────────────────────────────────────────────────────────────┐
│  Proyectos  >  Análisis de Datos Q1                             │
│  [+ Nueva Subtarea]                                             │
├───────────────────┬───────────────────┬─────────────────────────┤
│  PENDIENTE        │  EN PROGRESO      │  HECHO                  │
├───────────────────┼───────────────────┼─────────────────────────┤
│  ┌─────────────┐  │  ┌─────────────┐  │  ┌─────────────┐        │
│  │📌 Tarea A   │  │  │📌 Tarea C   │  │  │📌 Tarea B   │        │
│  │ 🔒 Bloqueada│  │  │ 👤 Juan     │  │  │ ✅ 8h / 8h  │        │
│  └─────────────┘  │  └─────────────┘  │  └─────────────┘        │
│  ┌─────────────┐  │                   │                        │
│  │📌 Tarea D   │  │                   │                        │
│  │ ⏱️ 5d holgura│  │                   │                        │
│  └─────────────┘  │                   │                        │
└───────────────────┴───────────────────┴─────────────────────────┘
```

### Estados de las Tarjetas

| Icono | Significado |
|-------|-------------|
| 🔒 | Bloqueada por dependencias |
| ⏱️ | Holgura crítica (menos de 0 días) |
| 👤 | Asignada a un miembro |
| 🔗 | Vinculada a otro proyecto |

### Tomar una Tarea

1. Busca una tarea en **"Pendiente"**
2. Haz clic en **"Coger"** ▶️
3. La tarea pasa a **"En Progreso"**
4. ¡Empieza a trabajar!

### Completar una Tarea

1. Cuando termines, haz clic en **"Completar"** ✅
2. Se abrirá un modal para registrar horas:
   ```
   Horas estimadas:  8h
   Horas reales:     [ 7.5 ]
   ```
3. Haz clic en **"Registrar y Completar"**
4. La tarea pasa a **"Hecho"**

### Revertir una Tarea

Si necesitas reopen una tarea:
1. Haz clic en la **flecha atrás** ↩️
2. La tarea vuelve al estado anterior

### Gestionar Dependencias

1. Edita una tarea (lápiz ✏️)
2. En "Dependencias", selecciona tareas que deben completarse primero
3. Guarda los cambios
4. La tarea se **bloquea** 🔒 hasta que las dependencias terminen

---

## 👥 Gestión de Equipo

### Invitar Miembros

1. Abre un proyecto
2. Haz clic en el **icono de usuarios** 👥
3. Introduce el **email** del usuario
4. Haz clic en **"Invitar"**

### Asignar Roles

En la gestión de equipo:

| Rol | Permisos |
|-----|----------|
| **Admin** | Editar proyecto, gestionar equipo, eliminar |
| **Member** | Crear/editar tareas propias |

### Asignar Tareas

Como admin, puedes asignar tareas directamente:

1. Edita una tarea
2. Selecciona un miembro del dropdown
3. Guarda

> 💡 Los miembros también pueden asignarse tareas ellos mismos.

---

## ⏱️ Control de Tiempo

### Estimación de Horas

Al crear una tarea, indica las **horas estimadas**:
- Número entero o decimal (ej: 8, 4.5)
- Se suma automáticamente al total del proyecto

### Registro de Horas

Al completar una tarea:
1. Introduce las **horas reales** dedicadas
2. El sistema calcula la **desviación**:
   - Positiva (rojo): Te has pasado del estimado
   - Negativa (verde): Has terminado antes

### Dashboard de Carga de Trabajo

Accede desde el icono 💼 en el header:

```
┌─────────────────────────────────────────────────────────────┐
│  💼 Mi Carga de Trabajo                                      │
│  Total estimado: 45.5h                                      │
├─────────────────────────────────────────────────────────────┤
│  📌 Tarea 1      [Pendiente]  ⏱️ Límite: 15/02/2026         │
│  📌 Tarea 2      [En Progreso] ⏱️ Límite: 20/02/2026         │
│  📌 Subtarea 1a  [Pendiente]  ⏱️ Límite: 18/02/2026         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 Vinculación de Proyectos

Puedes **vincular** un proyecto existente como subtarea de otro:

1. Crea una subtarea
2. Abajo, selecciona **"Vincular un proyecto existente"**
3. Elige el proyecto a vincular
4. Se envía una **solicitud** al admin del otro proyecto
5. Cuando la apruebe, aparecerá como enlace en tu tablero

> 📌 Los proyectos vinculados aparecen marcados con 🔗

---

## 🎭 Roles y Permisos

| Rol | Proyectos | Tareas | Usuarios | Sistema |
|-----|-----------|--------|----------|---------|
| **Superuser** | ✅ Todo | ✅ Todo | ✅ Todo | ✅ Todo |
| **Admin** | ✅ Propios | ✅ Propios | Ver | - |
| **Member** | Ver | ✅ Propias | Ver | - |
| **Pendiente** | ❌ Ninguno | ❌ Ninguno | ❌ | - |

### Cambiar Rol de Usuario

Solo los **superusuarios** pueden cambiar roles:

1. Accede a gestión de usuarios (si eres superuser)
2. Cambia el rol del dropdown
3. Se guarda automáticamente

---

## ❓ Preguntas Frecuentes

### ¿Puedo tener subtareas de subtareas?
¡Sí! El sistema soporta **niveles infinitos** de anidamiento.

### ¿Qué significa "holgura"?
La **holgura** (slack) es el tiempo libre antes de que una tarea se retrase. Calculada con el método CPM (Critical Path Method).

### ¿Cómo veo el progreso del proyecto?
- En el **Dashboard**, cada tarjeta muestra una barra de progreso
- Los colores indican estado (gris=planeado, azul=en progreso, verde=terminado)

### ¿Puedo recuperar una tarea borrada?
Sí, contacta con un **superusuario** para restaurarla desde la papelera.

### ¿Qué pasa si elimino un proyecto con subtareas?
El sistema **no lo permite** hasta eliminar primero las subtareas.

### ¿Cómo funciona el modo oscuro?
Se adapta automáticamente a las preferencias de tu sistema operativo.

---

## 📞 Soporte

¿Tienes problemas o sugerencias?

1. Consulta esta guía primero
2. Contacta con el administrador de tu equipo
3. Para problemas técnicos, abre un issue en el repositorio

---

## 🔑 Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `N` | Nuevo proyecto/tarea |
| `E` | Editar selección |
| `ESC` | Cerrar modal |
| `Enter` | Guardar formulario |

---

¡Gracias por usar Synaptic Flow! 🎉
