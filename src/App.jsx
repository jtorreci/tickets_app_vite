/**
 * Synaptic Flow - Sistema de Gestión de Proyectos y Tickets
 * 
 * Aplicación web para gestión de proyectos de investigación con sistema
 * de tickets tipo Kanban, desarrollada con React, Vite y Firebase.
 * 
 * @author: Desarrollo
 * @version: 1.0.0
 * @license: MIT
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, updateDoc, onSnapshot, query, where, Timestamp, deleteDoc, arrayUnion, writeBatch, getDoc, setDoc } from 'firebase/firestore';
import { Plus, Users, LogOut, Home, ChevronRight, Briefcase } from 'lucide-react';

// --- Componentes de la aplicación ---
import AuthScreen from './components/AuthScreen';
import BoardColumn from './components/BoardColumn';
import InboxDashboard from './components/InboxDashboard';
import Modal from './components/Modal';
import Spinner from './components/Spinner';
import TaskForm from './components/TaskForm';
import LogHoursModal from './components/LogHoursModal';
import UserManagement from './components/UserManagement';
import ProjectsDashboard from './components/ProjectsDashboard';
import TeamManagement from './components/TeamManagement';
import MyWorkloadDashboard from './components/MyWorkloadDashboard';

// --- Lee la configuración de Firebase desde las variables de entorno ---
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// --- Inicialización de servicios ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Rutas de colecciones en Firestore ---
const tasksCollectionPath = `tasks`;
const teamCollectionPath = `team_members`;
const messagesCollectionPath = `messages`;


export default function App() {
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [team, setTeam] = useState([]);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);
    const [taskToLogHours, setTaskToLogHours] = useState(null);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [projectToManage, setProjectToManage] = useState(null);
    const [messages, setMessages] = useState([]);
    
    const [allTasks, setAllTasks] = useState([]);
    const [currentView, setCurrentView] = useState('dashboard');
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, title: 'Proyectos' }]);

    const currentParentId = breadcrumbs[breadcrumbs.length - 1].id;
    
    const activeTasks = useMemo(() => allTasks.filter(task => !task.deleted), [allTasks]);
    const currentTasks = useMemo(() => activeTasks.filter(task => task.parentId === currentParentId), [activeTasks, currentParentId]);
    const userProjects = useMemo(() => {
        if (!loggedInUser) return [];
        return activeTasks.filter(task => 
            task.isProject && 
            (task.ownerId === loggedInUser.uid || task.memberIds?.includes(loggedInUser.uid))
        );
    }, [activeTasks, loggedInUser]);
    
    const inboxTasks = useMemo(() => {
        if (!loggedInUser) return [];
        return activeTasks.filter(task => 
            !task.isProject && 
            !task.parentId &&
            (task.ownerId === loggedInUser.uid || task.assigneeId === loggedInUser.uid)
        );
    }, [activeTasks, loggedInUser]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, teamCollectionPath, user.uid);
                try {
                    const docSnap = await getDoc(userDocRef);
                    if (docSnap.exists()) {
                        setLoggedInUser({ uid: user.uid, ...docSnap.data() });
                    } else {
                        await setDoc(userDocRef, {
                            username: user.email?.split('@')[0] || 'user',
                            email: user.email,
                            role: 'pending'
                        });
                        setLoggedInUser({ uid: user.uid, username: user.email?.split('@')[0] || 'user', email: user.email, role: 'pending' });
                    }
                } catch (error) {
                    console.error("Error checking user doc:", error);
                }
            } else {
                setLoggedInUser(null);
            }
            setIsLoading(false);
        });
        return () => unsubscribeAuth();
    }, []);
    
    useEffect(() => {
        if (!loggedInUser) {
            setAllTasks([]);
            setMessages([]);
            return;
        };

        const qTasks = query(collection(db, tasksCollectionPath), where('deleted', '==', false));
        const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
            const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const visibleTasks = tasks.filter(task => {
                const isOwner = task.ownerId === loggedInUser.uid;
                const isCollaborator = task.memberIds?.includes(loggedInUser.uid);
                const isAssignee = task.assigneeId === loggedInUser.uid;
                
                if (isOwner || isCollaborator) return true;
                if (isAssignee) {
                    return true;
                }
                return false;
            });
            setAllTasks(visibleTasks);
        });

        const qMessages = query(collection(db, messagesCollectionPath), where('recipientId', '==', loggedInUser.uid));
        const unsubscribeMessages = onSnapshot(qMessages, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubscribeTeam = onSnapshot(collection(db, teamCollectionPath), (snapshot) => {
            setTeam(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribeTasks();
            unsubscribeTeam();
            unsubscribeMessages();
        };
    }, [loggedInUser]);

    /**
     * Calcula las horas agregadas de una tarea incluyendo todas sus subtareas.
     * Utiliza recursión para sumar horas de toda la jerarquía.
     *
     * @param {string} taskId - ID de la tarea padre.
     * @param {Array} tasks - Lista completa de tareas.
     * @returns {number} Total de horas estimadas.
     */
    const getAggregatedHours = useCallback((taskId, tasks) => {
        const tasksMap = new Map(tasks.map(t => [t.id, t]));
        const children = tasks.filter(t => t.parentId === taskId);
        const selfHours = tasksMap.get(taskId)?.expectedHours || 0;

        const childrenHours = children.reduce((sum, child) => sum + getAggregatedHours(child.id, tasks), 0);
        return selfHours + childrenHours;
    }, []);

    /**
     * Genera la ruta de navegación (breadcrumbs) desde Proyectos hasta la tarea.
     *
     * @param {string} taskId - ID de la tarea destino.
     * @param {Array} tasks - Lista completa de tareas.
     * @returns {Array} Lista de objetos {id, title}.
     */
    const findTaskBreadcrumbs = (taskId, tasks) => {
        const tasksMap = new Map(tasks.map(t => [t.id, t]));
        let crumbs = [];
        let current = tasksMap.get(taskId);
        while (current) {
            crumbs.unshift({ id: current.id, title: current.title });
            current = tasksMap.get(current.parentId);
        }
        return [{ id: null, title: 'Proyectos' }, ...crumbs];
    };

    /**
     * Navega a una tarea específica actualizando breadcrumbs y vista.
     *
     * @param {Object} task - Objeto tarea a navegar.
     */
    const navigateToTask = (task) => {
        const newBreadcrumbs = findTaskBreadcrumbs(task.id, allTasks);
        setBreadcrumbs(newBreadcrumbs);
        setCurrentView('kanban');
    };

    /**
     * Navega a un nivel específico del breadcrumb.
     *
     * @param {number} index - Índice del breadcrumb a navegar.
     */
    const navigateToBreadcrumb = (index) => {
        setBreadcrumbs(prev => prev.slice(0, index + 1));
        if (index === 0) setCurrentView('dashboard');
    };

    /**
     * Navega de vuelta al dashboard de proyectos.
     */
    const navigateToDashboard = () => {
        setBreadcrumbs([{ id: null, title: 'Proyectos' }]);
        setCurrentView('dashboard');
    }

    /**
     * Verifica si el usuario es owner del proyecto/tarea
     */
    const isOwner = (task) => task?.ownerId === loggedInUser?.uid;

    /**
     * Verifica si el usuario es admin del proyecto/tarea
     */
    const isAdmin = (task) => {
        if (!task?.team || !loggedInUser) return false;
        const member = task.team.find(m => m.userId === loggedInUser.uid);
        return member?.role === 'admin';
    };

    /**
     * Verifica si el usuario puede editar el proyecto/tarea
     */
    const canEdit = (task) => isOwner(task) || isAdmin(task);

    /**
     * Verifica si el usuario puede añadir colaboradores
     */
    const canManageTeam = (task) => isOwner(task) || isAdmin(task);

    /**
     * Verifica si el usuario puede crear subtareas
     */
    const canCreateSubtask = (task) => {
        if (!task) return true;
        return isOwner(task) || isAdmin(task) || task.memberIds?.includes(loggedInUser.uid);
    };

    /**
     * Guarda una nueva tarea o actualiza una existente.
     *
     * @param {Object} taskData - Datos de la tarea a guardar.
     */
    const handleSaveTask = async (taskData) => {
        try {
            if (taskToEdit) {
                await updateDoc(doc(db, tasksCollectionPath, taskToEdit.id), taskData);
            } else {
                const parentTask = allTasks.find(t => t.id === taskData.parentId);
                const projectId = parentTask ? parentTask.projectId : null;

                const newTask = { ...taskData, status: 'todo', createdAt: Timestamp.now(), assigneeId: null, actualHours: 0, isLocked: taskData.dependencies?.length > 0, deleted: false, taskType: 'standard' };
                
                if (taskData.parentId === null) {
                    newTask.ownerId = loggedInUser.uid;
                    newTask.team = [{ userId: loggedInUser.uid, role: 'admin' }];
                    newTask.memberIds = [loggedInUser.uid];
                    const docRef = await addDoc(collection(db, tasksCollectionPath), newTask);
                    await updateDoc(docRef, { projectId: docRef.id });
                } else {
                    newTask.isProject = false;
                    newTask.ownerId = parentTask.ownerId;
                    newTask.team = parentTask.team;
                    newTask.memberIds = parentTask.memberIds;
                    newTask.projectId = parentTask.projectId;
                    await addDoc(collection(db, tasksCollectionPath), newTask);
                }
            }
            closeTaskModal();
        } catch (error) { console.error("Error al guardar tarea: ", error); }
    };

    /**
     * Crea una solicitud para vincular un proyecto existente como subtarea.
     * Envía un mensaje al admin del proyecto a vincular.
     *
     * @param {Object} params - Parámetros de la solicitud.
     * @param {string} params.projectIdToLink - ID del proyecto a vincular.
     * @param {string} params.parentId - ID del proyecto padre.
     */
    const handleCreateLinkingRequest = async ({projectIdToLink, parentId}) => {
        try {
            const projectToLink = allTasks.find(t => t.id === projectIdToLink);
            const parentProject = allTasks.find(t => t.id === parentId);
            if (!projectToLink || !parentProject) {
                alert("Error: No se pudo encontrar el proyecto."); return;
            }
            const adminOfProjectToLink = projectToLink.team.find(m => m.role === 'admin');
            if (!adminOfProjectToLink) {
                alert(`Error: El proyecto "${projectToLink.title}" no tiene un administrador.`); return;
            }
            const requestMessage = {
                type: 'linkingRequest',
                senderId: loggedInUser.uid,
                senderName: loggedInUser.username,
                recipientId: adminOfProjectToLink.userId,
                data: {
                    projectToLinkName: projectToLink.title,
                    projectToLinkId: projectToLink.id,
                    parentProjectName: parentProject.title,
                    parentProjectId: parentProject.id,
                },
                createdAt: Timestamp.now()
            };
            await addDoc(collection(db, messagesCollectionPath), requestMessage);
            closeTaskModal();
        } catch (error) { console.error("Error creating linking request:", error); }
    };

    /**
     * Aprueba una solicitud de vinculación de proyecto.
     * Añade al solicitante como miembro y crea un enlace en el proyecto padre.
     *
     * @param {Object} message - Mensaje de solicitud de vinculación.
     */
    const handleApproveLinkingRequest = async (message) => {
        const { projectToLinkId, parentProjectId, senderId } = message.data;
        const projectToLinkRef = doc(db, tasksCollectionPath, projectToLinkId);
        const parentProject = allTasks.find(t => t.id === parentProjectId);
        const projectToLink = allTasks.find(t => t.id === projectToLinkId);

        if (!parentProject || !projectToLink) {
            alert("Error: Uno de los proyectos ya no existe.");
            await deleteDoc(doc(db, messagesCollectionPath, message.id));
            return;
        }

        await updateDoc(projectToLinkRef, {
            team: arrayUnion({ userId: senderId, role: 'member' }),
            memberIds: arrayUnion(senderId)
        });

        await addDoc(collection(db, tasksCollectionPath), {
            title: `VINCULADO: ${projectToLink.title}`,
            description: `Este es un enlace al proyecto. Haz clic en 'Abrir Tablero' para ver sus detalles.`,
            parentId: parentProjectId,
            projectId: parentProject.projectId,
            status: 'done',
            taskType: 'linkedProject',
            linkedProjectId: projectToLinkId,
            createdAt: Timestamp.now(),
            deleted: false,
            team: parentProject.team,
            memberIds: parentProject.memberIds
        });

        await deleteDoc(doc(db, messagesCollectionPath, message.id));
    };

    /**
     * Rechaza una solicitud de vinculación eliminando el mensaje.
     *
     * @param {string} messageId - ID del mensaje a rechazar.
     */
    const handleDeclineLinkingRequest = async (messageId) => {
        await deleteDoc(doc(db, messagesCollectionPath, messageId));
    };

    /**
     * Asigna una tarea al usuario actual y cambia estado a 'En Progreso'.
     *
     * @param {string} taskId - ID de la tarea a tomar.
     */
    const handleTakeTask = async (taskId) => await updateDoc(doc(db, tasksCollectionPath, taskId), { status: 'inProgress', assigneeId: loggedInUser.uid, startedAt: Timestamp.now() });

    /**
     * Registra horas trabajadas y marca la tarea como completada.
     *
     * @param {number} actualHours - Horas reales dedicadas.
     */
    const handleLogHoursAndComplete = async (actualHours) => {
        if (!taskToLogHours) return;
        try {
            await updateDoc(doc(db, tasksCollectionPath, taskToLogHours.id), { status: 'done', completedAt: Timestamp.now(), actualHours, startedAt: null });
        } catch (error) {
            console.error("Error al completar la tarea:", error);
        } finally {
            setTaskToLogHours(null);
        }
    };
    
    /**
     * Revertir estado de una tarea.
     *
     * @param {string} taskId - ID de la tarea.
     * @param {string} currentStatus - Estado actual de la tarea.
     */
    const handleRevertTask = async (taskId, currentStatus) => {
        const taskRef = doc(db, tasksCollectionPath, taskId);
        if (currentStatus === 'inProgress') await updateDoc(taskRef, { status: 'todo', assigneeId: null, startedAt: null });
        else if (currentStatus === 'done') await updateDoc(taskRef, { status: 'inProgress', completedAt: null, startedAt: Timestamp.now(), actualHours: 0 });
    };

    /**
     * Borra una tarea y todas sus subtareas en cascada (soft delete).
     * Solo el propietario puede borrar.
     *
     * @param {string} taskId - ID de la tarea a borrar.
     */
    const handleDeleteTask = async (taskId) => {
        const task = allTasks.find(t => t.id === taskId);
        if (!task) return;
        
        if (task.ownerId !== loggedInUser.uid) {
            alert("Solo el propietario puede borrar esta tarea.");
            return;
        }
        
        if (window.confirm("¿Estás seguro de que quieres borrar esta tarea y todas sus subtareas?")) {
            const tasksToDelete = getAllDescendants(taskId, allTasks);
            const batch = writeBatch(db);
            
            tasksToDelete.forEach(t => {
                const taskRef = doc(db, tasksCollectionPath, t.id);
                batch.update(taskRef, { deleted: true });
            });
            
            await batch.commit();
        }
    };

    /**
     * Recupera una tarea y todas sus subtareas en cascada (soft restore).
     * Solo el owner o admin pueden recuperar.
     *
     * @param {string} taskId - ID de la tarea a recuperar.
     */
    const handleRestoreTask = async (taskId) => {
        const task = allTasks.find(t => t.id === taskId);
        if (!task) return;
        
        const isOwner = task.ownerId === loggedInUser.uid;
        const isAdminUser = loggedInUser.role === 'admin' || loggedInUser.role === 'superuser';
        
        if (!isOwner && !isAdminUser) {
            alert("Solo el propietario o un administrador pueden recuperar esta tarea.");
            return;
        }
        
        if (window.confirm("¿Estás seguro de que quieres recuperar esta tarea y todas sus subtareas?")) {
            const tasksToRestore = getAllDescendants(taskId, allTasks);
            const batch = writeBatch(db);
            
            tasksToRestore.forEach(t => {
                const taskRef = doc(db, tasksCollectionPath, t.id);
                batch.update(taskRef, { deleted: false });
            });
            
            await batch.commit();
        }
    };

    /**
     * Obtiene todas las subtareas en cascada (incluyendo subtareas de subtareas).
     *
     * @param {string} taskId - ID de la tarea padre.
     * @param {Array} tasks - Lista de todas las tareas.
     * @returns {Array} Lista de tareas descendientes.
     */
    const getAllDescendants = (taskId, tasks) => {
        const result = [];
        const children = tasks.filter(t => t.parentId === taskId);
        
        children.forEach(child => {
            result.push(child);
            const grandchildren = getAllDescendants(child.id, tasks);
            result.push(...grandchildren);
        });
        
        return result;
    };

    /**
     * Verifica si el usuario es owner de la tarea
     */
    const isTaskOwner = (task) => task?.ownerId === loggedInUser?.uid;
    
    /**
     * Asigna una tarea a un usuario específico.
     *
     * @param {string} taskId - ID de la tarea.
     * @param {string} userId - ID del usuario asignado.
     */
    const handleAssignTask = async (taskId, userId) => await updateDoc(doc(db, tasksCollectionPath, taskId), { assigneeId: userId });

    /**
     * Abre el modal para crear/editar una tarea.
     *
     * @param {Object} task - Tarea a editar (null para nueva).
     */
    const openTaskModal = (task = null) => { setTaskToEdit(task); setIsTaskModalOpen(true); };

    /** Cierra el modal de tareas. */
    const closeTaskModal = () => { setTaskToEdit(null); setIsTaskModalOpen(false); };

    /**
     * Abre el modal de gestión de equipo.
     *
     * @param {Object} project - Proyecto a gestionar.
     */
    const openTeamModal = (project) => { setProjectToManage(project); setIsTeamModalOpen(true); };

    /** Cierra el modal de equipo. */
    const closeTeamModal = () => { setProjectToManage(null); setIsTeamModalOpen(false); };

    /**
     * Filtra las tareas por estado para las columnas Kanban.
     *
     * @type {Object}
     */
    const tasksByStatus = useMemo(() => ({
        todo: currentTasks.filter(t => t.status === 'todo').sort((a,b) => (a.preferredDate?.seconds || Infinity) - (b.preferredDate?.seconds || Infinity)),
        inProgress: currentTasks.filter(t => t.status === 'inProgress'),
        done: currentTasks.filter(t => t.status === 'done'),
    }), [currentTasks]);

    if (isLoading) return <div className="w-full h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900"><Spinner /></div>;
    if (!loggedInUser) return <AuthScreen db={db} auth={auth} teamCollectionPath={teamCollectionPath} />;
    
    return (
        <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen font-sans">
            <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center">
                <div className="font-bold text-xl text-sky-600 dark:text-sky-400">Synaptic Flow</div>
                <div className="flex items-center space-x-4">
                    <button onClick={navigateToDashboard} title="Ver Proyectos" className="p-2 text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Home className="w-5 h-5"/></button>
                    <button onClick={() => setCurrentView('inbox')} title="Bandeja de Entrada" className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${currentView === 'inbox' ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30' : 'text-gray-500'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0h-4.5a2 2 0 01-2-2v-2.5M4 13h16M8 21h8" />
                        </svg>
                    </button>
                    <button onClick={() => setCurrentView('my-workload')} title="Mi Carga de Trabajo" className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${currentView === 'my-workload' ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30' : 'text-gray-500'} relative`}>
                        <Briefcase className="w-5 h-5"/>
                        {messages.length > 0 && <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>}
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Hola, <span className="font-bold">{loggedInUser.username}</span>!</span>
                    <button onClick={() => signOut(auth)} title="Cerrar Sesión" className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><LogOut className="w-5 h-5"/></button>
                </div>
            </header>
            <main className="h-[calc(100vh-68px)] p-4 sm:p-6 lg:p-8">
                 <div className="flex justify-between items-center mb-6">
                    <nav className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                        {currentView === 'kanban' && breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={crumb.id || 'root'}>
                                {index > 0 && <ChevronRight className="w-4 h-4 mx-1" />}
                                <button onClick={() => navigateToBreadcrumb(index)} className={`hover:text-sky-600 dark:hover:text-sky-400 ${index === breadcrumbs.length - 1 ? 'text-gray-800 dark:text-white font-semibold' : ''}`}>
                                    {index === 0 ? <Home className="w-4 h-4 inline-block mr-1" /> : null} {crumb.title}
                                </button>
                            </React.Fragment>
                        ))}
                        {currentView === 'inbox' && <span className="text-gray-800 dark:text-white font-semibold">📥 Bandeja de Entrada</span>}
                    </nav>
                    {currentView !== 'my-workload' && (
                        <button onClick={() => openTaskModal()} className="bg-sky-500 text-white px-4 py-2 rounded-lg shadow hover:bg-sky-600 flex items-center">
                            <Plus className="w-5 h-5 mr-2" /> 
                            {currentView === 'inbox' ? 'Nueva Tarea' : currentParentId ? 'Nueva Subtarea' : 'Nuevo Proyecto'}
                        </button>
                    )}
                </div>
                
                {currentView === 'dashboard' && <ProjectsDashboard projects={userProjects} allTasks={allTasks} onNavigate={navigateToTask} onEdit={openTaskModal} onDelete={handleDeleteTask} onRestore={handleRestoreTask} onManageTeam={openTeamModal} loggedInUser={loggedInUser} canManageTeam={canManageTeam} isTaskOwner={isTaskOwner} />}
                {currentView === 'kanban' && (
                    <div className="flex-grow flex flex-col md:flex-row gap-6 overflow-x-auto pb-4 h-full">
                        <BoardColumn title="Pendiente" tasks={tasksByStatus.todo} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} onEditTicket={openTaskModal} onAssign={handleAssignTask} onDelete={handleDeleteTask} allTasks={activeTasks} loggedInUser={loggedInUser} team={team} onNavigate={navigateToTask} isTaskOwner={isTaskOwner} />
                        <BoardColumn title="En Progreso" tasks={tasksByStatus.inProgress} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} onEditTicket={openTaskModal} onAssign={handleAssignTask} onDelete={handleDeleteTask} allTasks={activeTasks} loggedInUser={loggedInUser} team={team} onNavigate={navigateToTask} isTaskOwner={isTaskOwner} />
                        <BoardColumn title="Hecho" tasks={tasksByStatus.done} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} onEditTicket={openTaskModal} onAssign={handleAssignTask} onDelete={handleDeleteTask} allTasks={activeTasks} loggedInUser={loggedInUser} team={team} onNavigate={navigateToTask} isTaskOwner={isTaskOwner} />
                    </div>
                )}
                {currentView === 'inbox' && <InboxDashboard tasks={inboxTasks} allTasks={allTasks} onNavigate={navigateToTask} onEdit={openTaskModal} onDelete={handleDeleteTask} onRestore={handleRestoreTask} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} loggedInUser={loggedInUser} team={team} />}
                {currentView === 'my-workload' && <MyWorkloadDashboard allTasks={activeTasks} loggedInUser={loggedInUser} getAggregatedHours={getAggregatedHours} onNavigate={navigateToTask} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} onEdit={openTaskModal} team={team} messages={messages} onRestore={handleRestoreTask} onApproveLink={handleApproveLinkingRequest} onDeclineLink={handleDeclineLinkingRequest} />}

            </main>
            {isTeamModalOpen && <Modal onClose={closeTeamModal}><TeamManagement project={projectToManage} allUsers={team} db={db} tasksCollectionPath={tasksCollectionPath} loggedInUser={loggedInUser} onClose={closeTeamModal} canManageTeam={canManageTeam} /></Modal>}
            {isTaskModalOpen && <Modal onClose={closeTaskModal}><TaskForm onSave={handleSaveTask} onLinkProject={handleCreateLinkingRequest} onClose={closeTaskModal} allTasks={activeTasks} taskToEdit={taskToEdit} parentId={currentParentId} loggedInUser={loggedInUser} team={team} /></Modal>}
            {taskToLogHours && <Modal onClose={() => setTaskToLogHours(null)}><LogHoursModal onSave={handleLogHoursAndComplete} onCancel={() => setTaskToLogHours(null)} task={taskToLogHours} /></Modal>}
        </div>
    );
}
