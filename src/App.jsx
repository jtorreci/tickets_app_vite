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
import { getFirestore, collection, doc, addDoc, updateDoc, onSnapshot, query, where, Timestamp, deleteDoc, arrayUnion, arrayRemove, writeBatch, getDoc, setDoc, getDocs } from 'firebase/firestore';
import { Plus, Users, LogOut, Home, ChevronRight, Briefcase, Mail, UserPlus } from 'lucide-react';

// --- Componentes de la aplicación ---
import AuthScreen from './components/AuthScreen';
import BoardColumn from './components/BoardColumn';
import DashboardSplit from './components/DashboardSplit';
import InboxDashboard from './components/InboxDashboard';
import Modal from './components/Modal';
import Spinner from './components/Spinner';
import TaskForm from './components/TaskForm';
import LogHoursModal from './components/LogHoursModal';
import UserManagement from './components/UserManagement';
import ProjectsDashboard from './components/ProjectsDashboard';
import TeamManagement from './components/TeamManagement';
import MyWorkloadDashboard from './components/MyWorkloadDashboard';
import TeamsDashboard from './components/TeamsDashboard';
import TeamView from './components/TeamView';
import CreateTeamModal from './components/CreateTeamModal';
import InviteMemberModal from './components/InviteMemberModal';

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
const teamsCollectionPath = `teams`;
const invitationsCollectionPath = `invitations`;


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
    const [currentView, setCurrentView] = useState('teams');
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, title: 'Proyectos' }]);

    // --- Estado de equipos ---
    const [userTeams, setUserTeams] = useState([]);
    const [pendingInvitations, setPendingInvitations] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [teamToInvite, setTeamToInvite] = useState(null);

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

        // Listener de equipos del usuario
        const qTeams = query(collection(db, teamsCollectionPath), where('memberIds', 'array-contains', loggedInUser.uid));
        const unsubscribeTeams = onSnapshot(qTeams, (snapshot) => {
            setUserTeams(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Listener de invitaciones pendientes
        const qInvitations = query(collection(db, invitationsCollectionPath), where('invitedEmail', '==', loggedInUser.email), where('status', '==', 'pending'));
        const unsubscribeInvitations = onSnapshot(qInvitations, (snapshot) => {
            setPendingInvitations(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => {
            unsubscribeTasks();
            unsubscribeTeam();
            unsubscribeMessages();
            unsubscribeTeams();
            unsubscribeInvitations();
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
        if (selectedTeam) {
            setCurrentView('team-view');
        } else {
            setCurrentView('dashboard');
        }
    }

    const navigateToTeams = () => {
        setSelectedTeam(null);
        setCurrentView('teams');
    };

    const navigateToTeamView = (team) => {
        setSelectedTeam(team);
        setBreadcrumbs([{ id: null, title: 'Proyectos' }]);
        setCurrentView('team-view');
    };

    // --- CRUD de equipos ---

    const handleCreateTeam = async (teamData) => {
        try {
            await addDoc(collection(db, teamsCollectionPath), {
                name: teamData.name,
                description: teamData.description,
                ownerId: loggedInUser.uid,
                members: [{ userId: loggedInUser.uid, role: 'owner' }],
                memberIds: [loggedInUser.uid],
                createdAt: Timestamp.now()
            });
            setIsCreateTeamModalOpen(false);
        } catch (error) { console.error("Error al crear equipo:", error); }
    };

    const handleInviteToTeam = async (email) => {
        const q = query(collection(db, teamCollectionPath), where("email", "==", email));
        const snapshot = await getDocs(q);
        if (snapshot.empty) throw new Error("No se ha encontrado ningún usuario con ese email.");

        const invitedUserId = snapshot.docs[0].id;
        if (teamToInvite.memberIds?.includes(invitedUserId)) throw new Error("Este usuario ya es miembro del equipo.");

        const qExisting = query(collection(db, invitationsCollectionPath), where('teamId', '==', teamToInvite.id), where('invitedEmail', '==', email), where('status', '==', 'pending'));
        const existingSnapshot = await getDocs(qExisting);
        if (!existingSnapshot.empty) throw new Error("Ya existe una invitación pendiente para este usuario.");

        await addDoc(collection(db, invitationsCollectionPath), {
            teamId: teamToInvite.id,
            teamName: teamToInvite.name,
            invitedBy: loggedInUser.uid,
            invitedByName: loggedInUser.username,
            invitedEmail: email,
            status: 'pending',
            createdAt: Timestamp.now()
        });
    };

    const handleAcceptInvitation = async (invitation) => {
        try {
            const batch = writeBatch(db);
            batch.update(doc(db, invitationsCollectionPath, invitation.id), { status: 'accepted' });
            const teamRef = doc(db, teamsCollectionPath, invitation.teamId);
            batch.update(teamRef, {
                members: arrayUnion({ userId: loggedInUser.uid, role: 'member' }),
                memberIds: arrayUnion(loggedInUser.uid)
            });
            const teamProjects = allTasks.filter(t => t.teamId === invitation.teamId && t.isProject && !t.deleted);
            teamProjects.forEach(project => {
                batch.update(doc(db, tasksCollectionPath, project.id), {
                    team: arrayUnion({ userId: loggedInUser.uid, role: 'member' }),
                    memberIds: arrayUnion(loggedInUser.uid)
                });
            });
            await batch.commit();
        } catch (error) { console.error("Error al aceptar invitación:", error); }
    };

    const handleDeclineInvitation = async (invitationId) => {
        try {
            await updateDoc(doc(db, invitationsCollectionPath, invitationId), { status: 'declined' });
        } catch (error) { console.error("Error al rechazar invitación:", error); }
    };

    const handleLeaveTeam = async (teamId) => {
        if (!window.confirm("¿Estás seguro de que quieres abandonar este equipo?")) return;
        try {
            const teamDoc = userTeams.find(t => t.id === teamId);
            if (!teamDoc) return;
            const memberEntry = teamDoc.members.find(m => m.userId === loggedInUser.uid);
            if (!memberEntry) return;

            const batch = writeBatch(db);
            batch.update(doc(db, teamsCollectionPath, teamId), {
                members: arrayRemove(memberEntry),
                memberIds: arrayRemove(loggedInUser.uid)
            });
            const teamProjects = allTasks.filter(t => t.teamId === teamId && t.isProject && !t.deleted);
            teamProjects.forEach(project => {
                const projMember = project.team?.find(m => m.userId === loggedInUser.uid);
                if (projMember) {
                    batch.update(doc(db, tasksCollectionPath, project.id), {
                        team: arrayRemove(projMember),
                        memberIds: arrayRemove(loggedInUser.uid)
                    });
                }
            });
            await batch.commit();
            if (selectedTeam?.id === teamId) navigateToTeams();
        } catch (error) { console.error("Error al abandonar equipo:", error); }
    };

    const handleRemoveFromTeam = async (teamId, userId) => {
        if (!window.confirm("¿Eliminar a este usuario del equipo?")) return;
        try {
            const teamDoc = userTeams.find(t => t.id === teamId);
            if (!teamDoc) return;
            const memberEntry = teamDoc.members.find(m => m.userId === userId);
            if (!memberEntry) return;

            const batch = writeBatch(db);
            batch.update(doc(db, teamsCollectionPath, teamId), {
                members: arrayRemove(memberEntry),
                memberIds: arrayRemove(userId)
            });
            const teamProjects = allTasks.filter(t => t.teamId === teamId && t.isProject && !t.deleted);
            teamProjects.forEach(project => {
                const projMember = project.team?.find(m => m.userId === userId);
                if (projMember) {
                    batch.update(doc(db, tasksCollectionPath, project.id), {
                        team: arrayRemove(projMember),
                        memberIds: arrayRemove(userId)
                    });
                }
            });
            await batch.commit();
        } catch (error) { console.error("Error al eliminar miembro:", error); }
    };

    const handleChangeTeamRole = async (teamId, userId, newRole) => {
        try {
            const teamDoc = userTeams.find(t => t.id === teamId);
            if (!teamDoc) return;
            const newMembers = teamDoc.members.map(m => m.userId === userId ? { ...m, role: newRole } : m);
            await updateDoc(doc(db, teamsCollectionPath, teamId), { members: newMembers });
        } catch (error) { console.error("Error al cambiar rol:", error); }
    };

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
                    if (selectedTeam) {
                        newTask.teamId = selectedTeam.id;
                        newTask.team = selectedTeam.members.map(m => ({ userId: m.userId, role: m.role === 'owner' ? 'admin' : m.role }));
                        newTask.memberIds = selectedTeam.memberIds || [loggedInUser.uid];
                    } else {
                        newTask.team = [{ userId: loggedInUser.uid, role: 'admin' }];
                        newTask.memberIds = [loggedInUser.uid];
                    }
                    const docRef = await addDoc(collection(db, tasksCollectionPath), newTask);
                    await updateDoc(docRef, { projectId: docRef.id });
                } else {
                    newTask.isProject = false;
                    newTask.ownerId = parentTask.ownerId;
                    newTask.team = parentTask.team;
                    newTask.memberIds = parentTask.memberIds;
                    newTask.projectId = parentTask.projectId;
                    newTask.teamId = parentTask.teamId || null;
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
    const handleTakeTask = async (taskId) => {
        const task = allTasks.find(t => t.id === taskId);
        if (!task) return;

        const previousStatus = task.status;
        const previousAssignee = task.assigneeId;

        setAllTasks(prev => prev.map(t =>
            t.id === taskId
                ? { ...t, status: 'inProgress', assigneeId: loggedInUser.uid, startedAt: Timestamp.now() }
                : t
        ));

        try {
            await updateDoc(doc(db, tasksCollectionPath, taskId), {
                status: 'inProgress',
                assigneeId: loggedInUser.uid,
                startedAt: Timestamp.now()
            });
        } catch (error) {
            console.error("Error al tomar la tarea:", error);
            setAllTasks(prev => prev.map(t =>
                t.id === taskId
                    ? { ...t, status: previousStatus, assigneeId: previousAssignee }
                    : t
            ));
        }
    };

    /**
     * Registra horas trabajadas y marca la tarea como completada.
     *
     * @param {number} actualHours - Horas reales dedicadas.
     */
    const handleLogHoursAndComplete = async (actualHours) => {
        if (!taskToLogHours) return;
        const taskId = taskToLogHours.id;
        const previousStatus = taskToLogHours.status;

        setAllTasks(prev => prev.map(t =>
            t.id === taskId
                ? { ...t, status: 'done', completedAt: Timestamp.now(), actualHours, startedAt: null }
                : t
        ));
        setTaskToLogHours(null);

        try {
            await updateDoc(doc(db, tasksCollectionPath, taskId), { status: 'done', completedAt: Timestamp.now(), actualHours, startedAt: null });
        } catch (error) {
            console.error("Error al completar la tarea:", error);
            setAllTasks(prev => prev.map(t =>
                t.id === taskId
                    ? { ...t, status: previousStatus }
                    : t
            ));
        }
    };
    
    /**
     * Revertir estado de una tarea.
     *
     * @param {string} taskId - ID de la tarea.
     * @param {string} currentStatus - Estado actual de la tarea.
     */
    const handleRevertTask = async (taskId, currentStatus) => {
        const task = allTasks.find(t => t.id === taskId);
        if (!task) return;

        let newStatus, newAssigneeId, newStartedAt, newCompletedAt, newActualHours;
        if (currentStatus === 'inProgress') {
            newStatus = 'todo';
            newAssigneeId = null;
            newStartedAt = null;
        } else if (currentStatus === 'done') {
            newStatus = 'inProgress';
            newCompletedAt = null;
            newStartedAt = Timestamp.now();
            newActualHours = 0;
        }

        setAllTasks(prev => prev.map(t =>
            t.id === taskId
                ? { ...t, status: newStatus, assigneeId: newAssigneeId, startedAt: newStartedAt, completedAt: newCompletedAt, actualHours: newActualHours }
                : t
        ));

        try {
            const updates = { status: newStatus };
            if (newAssigneeId !== undefined) updates.assigneeId = newAssigneeId;
            if (newStartedAt !== undefined) updates.startedAt = newStartedAt;
            if (newCompletedAt !== undefined) updates.completedAt = newCompletedAt;
            if (newActualHours !== undefined) updates.actualHours = newActualHours;
            await updateDoc(doc(db, tasksCollectionPath, taskId), updates);
        } catch (error) {
            console.error("Error al revertir la tarea:", error);
            setAllTasks(prev => prev.map(t =>
                t.id === taskId ? task : t
            ));
        }
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
                    <button onClick={navigateToTeams} title="Mis Equipos" className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${currentView === 'teams' ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30' : 'text-gray-500 hover:text-sky-600 dark:hover:text-sky-400'}`}>
                        <Users className="w-5 h-5"/>
                    </button>
                    <button onClick={navigateToDashboard} title="Ver Proyectos" className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${currentView === 'dashboard' ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30' : 'text-gray-500 hover:text-sky-600 dark:hover:text-sky-400'}`}><Home className="w-5 h-5"/></button>
                    <button onClick={() => setCurrentView('inbox')} title="Bandeja de Entrada" className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${currentView === 'inbox' ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30' : 'text-gray-500'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0h-4.5a2 2 0 01-2-2v-2.5M4 13h16M8 21h8" />
                        </svg>
                    </button>
                    <button onClick={() => setCurrentView('my-workload')} title="Mi Carga de Trabajo" className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${currentView === 'my-workload' ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30' : 'text-gray-500'} relative`}>
                        <Briefcase className="w-5 h-5"/>
                        {(messages.length > 0 || pendingInvitations.length > 0) && <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>}
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Hola, <span className="font-bold">{loggedInUser.username}</span>!</span>
                    <button onClick={() => signOut(auth)} title="Cerrar Sesión" className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><LogOut className="w-5 h-5"/></button>
                </div>
            </header>
            <main className="h-[calc(100vh-68px)] p-4 sm:p-6 lg:p-8">
                 <div className="flex justify-between items-center mb-6">
                    <nav className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                        {currentView === 'team-view' && selectedTeam && (
                            <>
                                <button onClick={navigateToTeams} className="hover:text-sky-600 dark:hover:text-sky-400 flex items-center"><Users className="w-4 h-4 mr-1" /> Equipos</button>
                                <ChevronRight className="w-4 h-4 mx-1" />
                                <span className="text-gray-800 dark:text-white font-semibold">{selectedTeam.name}</span>
                            </>
                        )}
                        {currentView === 'kanban' && (
                            <>
                                {selectedTeam && (
                                    <>
                                        <button onClick={navigateToTeams} className="hover:text-sky-600 dark:hover:text-sky-400 flex items-center"><Users className="w-4 h-4 mr-1" /> Equipos</button>
                                        <ChevronRight className="w-4 h-4 mx-1" />
                                        <button onClick={() => navigateToTeamView(selectedTeam)} className="hover:text-sky-600 dark:hover:text-sky-400">{selectedTeam.name}</button>
                                        <ChevronRight className="w-4 h-4 mx-1" />
                                    </>
                                )}
                                {breadcrumbs.map((crumb, index) => (
                                    <React.Fragment key={crumb.id || 'root'}>
                                        {index > 0 && <ChevronRight className="w-4 h-4 mx-1" />}
                                        <button onClick={() => navigateToBreadcrumb(index)} className={`hover:text-sky-600 dark:hover:text-sky-400 ${index === breadcrumbs.length - 1 ? 'text-gray-800 dark:text-white font-semibold' : ''}`}>
                                            {!selectedTeam && index === 0 ? <Home className="w-4 h-4 inline-block mr-1" /> : null} {crumb.title}
                                        </button>
                                    </React.Fragment>
                                ))}
                            </>
                        )}
                        {currentView === 'inbox' && <span className="text-gray-800 dark:text-white font-semibold">Bandeja de Entrada</span>}
                    </nav>
                    <div className="flex items-center space-x-2">
                        {currentView === 'teams' && <button onClick={() => setIsCreateTeamModalOpen(true)} className="bg-sky-500 text-white px-4 py-2 rounded-lg shadow hover:bg-sky-600 flex items-center"><Plus className="w-5 h-5 mr-2" /> Nuevo Equipo</button>}
                        {(currentView === 'team-view' || currentView === 'kanban' || currentView === 'dashboard' || currentView === 'inbox') && (
                            <button onClick={() => openTaskModal()} className="bg-sky-500 text-white px-4 py-2 rounded-lg shadow hover:bg-sky-600 flex items-center">
                                <Plus className="w-5 h-5 mr-2" />
                                {currentView === 'inbox' ? 'Nueva Tarea' : currentParentId ? 'Nueva Subtarea' : 'Nuevo Proyecto'}
                            </button>
                        )}
                    </div>
                </div>
                
                {currentView === 'teams' && <TeamsDashboard userTeams={userTeams} allTasks={activeTasks} loggedInUser={loggedInUser} onOpenTeam={(team) => { if (team) navigateToTeamView(team); else { setSelectedTeam(null); setCurrentView('dashboard'); } }} onInvite={(team) => { setTeamToInvite(team); setIsInviteModalOpen(true); }} onLeaveTeam={handleLeaveTeam} pendingInvitations={pendingInvitations} onAcceptInvitation={handleAcceptInvitation} onDeclineInvitation={handleDeclineInvitation} />}
                {currentView === 'team-view' && selectedTeam && <TeamView team={selectedTeam} allTasks={activeTasks} allUsers={team} loggedInUser={loggedInUser} onNavigateToProject={navigateToTask} onEditProject={openTaskModal} onDeleteProject={handleDeleteTask} onInvite={(t) => { setTeamToInvite(t); setIsInviteModalOpen(true); }} onRemoveMember={handleRemoveFromTeam} onChangeRole={handleChangeTeamRole} />}
                {currentView === 'dashboard' && (
                    <DashboardSplit
                        projects={userProjects}
                        allTasks={allTasks}
                        onNavigate={navigateToTask}
                        onEdit={openTaskModal}
                        onDelete={handleDeleteTask}
                        onRestore={handleRestoreTask}
                        onManageTeam={openTeamModal}
                        onCreateSubtask={(parentId) => { setCurrentParentId(parentId); openTaskModal(); }}
                        loggedInUser={loggedInUser}
                        canManageTeam={canManageTeam}
                        inboxTasks={inboxTasks}
                        onEditTask={openTaskModal}
                        onDeleteTask={handleDeleteTask}
                        onRestoreTask={handleRestoreTask}
                        onTakeTask={handleTakeTask}
                        onCompleteTask={setTaskToLogHours}
                        onRevertTask={handleRevertTask}
                        team={team}
                    />
                )}
                {currentView === 'kanban' && (
                    <div className="flex-grow flex flex-col md:flex-row gap-6 overflow-x-auto pb-4 h-full">
                        <BoardColumn title="Pendiente" tasks={tasksByStatus.todo} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} onEditTicket={openTaskModal} onAssign={handleAssignTask} onDelete={handleDeleteTask} allTasks={activeTasks} loggedInUser={loggedInUser} team={team} onNavigate={navigateToTask} isTaskOwner={isTaskOwner} />
                        <BoardColumn title="En Progreso" tasks={tasksByStatus.inProgress} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} onEditTicket={openTaskModal} onAssign={handleAssignTask} onDelete={handleDeleteTask} allTasks={activeTasks} loggedInUser={loggedInUser} team={team} onNavigate={navigateToTask} isTaskOwner={isTaskOwner} />
                        <BoardColumn title="Hecho" tasks={tasksByStatus.done} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} onEditTicket={openTaskModal} onAssign={handleAssignTask} onDelete={handleDeleteTask} allTasks={activeTasks} loggedInUser={loggedInUser} team={team} onNavigate={navigateToTask} isTaskOwner={isTaskOwner} />
                    </div>
                )}
                {currentView === 'inbox' && <InboxDashboard tasks={inboxTasks} allTasks={allTasks} onNavigate={navigateToTask} onEdit={openTaskModal} onDelete={handleDeleteTask} onRestore={handleRestoreTask} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} loggedInUser={loggedInUser} team={team} />}
                {currentView === 'my-workload' && <MyWorkloadDashboard allTasks={activeTasks} loggedInUser={loggedInUser} getAggregatedHours={getAggregatedHours} onNavigate={navigateToTask} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} onEdit={openTaskModal} team={team} messages={messages} onRestore={handleRestoreTask} onApproveLink={handleApproveLinkingRequest} onDeclineLink={handleDeclineLinkingRequest} userTeams={userTeams} pendingInvitations={pendingInvitations} onAcceptInvitation={handleAcceptInvitation} onDeclineInvitation={handleDeclineInvitation} />}

            </main>
            {isTeamModalOpen && <Modal onClose={closeTeamModal}><TeamManagement project={projectToManage} allUsers={team} db={db} tasksCollectionPath={tasksCollectionPath} loggedInUser={loggedInUser} onClose={closeTeamModal} canManageTeam={canManageTeam} /></Modal>}
            {isTaskModalOpen && <Modal onClose={closeTaskModal}><TaskForm onSave={handleSaveTask} onLinkProject={handleCreateLinkingRequest} onClose={closeTaskModal} allTasks={activeTasks} taskToEdit={taskToEdit} parentId={currentParentId} loggedInUser={loggedInUser} team={team} /></Modal>}
            {taskToLogHours && <Modal onClose={() => setTaskToLogHours(null)}><LogHoursModal onSave={handleLogHoursAndComplete} onCancel={() => setTaskToLogHours(null)} task={taskToLogHours} /></Modal>}
            {isCreateTeamModalOpen && <Modal onClose={() => setIsCreateTeamModalOpen(false)}><CreateTeamModal onSave={handleCreateTeam} onClose={() => setIsCreateTeamModalOpen(false)} /></Modal>}
            {isInviteModalOpen && teamToInvite && <Modal onClose={() => setIsInviteModalOpen(false)}><InviteMemberModal teamName={teamToInvite.name} onInvite={handleInviteToTeam} onClose={() => setIsInviteModalOpen(false)} /></Modal>}
        </div>
    );
}
