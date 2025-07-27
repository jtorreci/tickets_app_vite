import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, updateDoc, onSnapshot, query, where, Timestamp, deleteDoc, arrayUnion } from 'firebase/firestore';
import { Plus, Users, LogOut, Home, ChevronRight, Briefcase } from 'lucide-react';

// --- Mis Componentes ---
import AuthScreen from './components/AuthScreen';
import BoardColumn from './components/BoardColumn';
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

// --- Rutas de Firestore ---
const tasksCollectionPath = `tasks`;
const teamCollectionPath = `team_members`;

export default function App() {
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [team, setTeam] = useState([]);
    const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);
    const [taskToLogHours, setTaskToLogHours] = useState(null);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [projectToManage, setProjectToManage] = useState(null);
    
    const [allTasks, setAllTasks] = useState([]);
    const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'kanban', 'my-workload'
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, title: 'Proyectos' }]);

    const currentParentId = breadcrumbs[breadcrumbs.length - 1].id;
    
    const activeTasks = useMemo(() => allTasks.filter(task => !task.deleted), [allTasks]);
    const currentTasks = useMemo(() => activeTasks.filter(task => task.parentId === currentParentId), [activeTasks, currentParentId]);
    const userProjects = useMemo(() => activeTasks.filter(task => task.parentId === null), [activeTasks]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                const userDocRef = doc(db, teamCollectionPath, user.uid);
                onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) setLoggedInUser({ uid: user.uid, ...docSnap.data() });
                    setIsLoading(false);
                });
            } else {
                setLoggedInUser(null);
                setIsLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);
    
    useEffect(() => {
        if (!loggedInUser) {
            setAllTasks([]);
            return;
        };

        const q = query(collection(db, tasksCollectionPath), where('memberIds', 'array-contains', loggedInUser.uid));
        const unsubscribeTasks = onSnapshot(q, (snapshot) => {
            setAllTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubscribeTeam = onSnapshot(collection(db, teamCollectionPath), (snapshot) => {
            setTeam(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribeTasks();
            unsubscribeTeam();
        };
    }, [loggedInUser]);

    const getAggregatedHours = useCallback((taskId, tasks) => {
        const tasksMap = new Map(tasks.map(t => [t.id, t]));
        const children = tasks.filter(t => t.parentId === taskId);
        const selfHours = tasksMap.get(taskId)?.expectedHours || 0;
        
        const childrenHours = children.reduce((sum, child) => {
            return sum + getAggregatedHours(child.id, tasks);
        }, 0);

        return selfHours + childrenHours;
    }, []);

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

    const navigateToTask = (task) => {
        const newBreadcrumbs = findTaskBreadcrumbs(task.id, allTasks);
        setBreadcrumbs(newBreadcrumbs);
        setCurrentView('kanban');
    };

    const navigateToBreadcrumb = (index) => {
        setBreadcrumbs(prev => prev.slice(0, index + 1));
        if (index === 0) {
            setCurrentView('dashboard');
        }
    };
    
    const navigateToDashboard = () => {
        setBreadcrumbs([{ id: null, title: 'Proyectos' }]);
        setCurrentView('dashboard');
    }

    const handleSaveTask = async (taskData) => {
        try {
            if (taskToEdit) {
                await updateDoc(doc(db, tasksCollectionPath, taskToEdit.id), taskData);
            } else {
                const newTask = { 
                    ...taskData, 
                    status: 'todo', 
                    createdAt: Timestamp.now(), 
                    assigneeId: null, 
                    actualHours: 0,
                    isLocked: taskData.dependencies?.length > 0,
                    deleted: false,
                    taskType: 'standard'
                };
                if (taskData.parentId === null) {
                    newTask.team = [{ userId: loggedInUser.uid, role: 'admin' }];
                    newTask.memberIds = [loggedInUser.uid];
                } else {
                    const parentTask = allTasks.find(t => t.id === taskData.parentId);
                    if(parentTask) {
                        newTask.team = parentTask.team;
                        newTask.memberIds = parentTask.memberIds;
                    }
                }
                await addDoc(collection(db, tasksCollectionPath), newTask);
            }
            closeTaskModal();
        } catch (error) { console.error("Error al guardar tarea: ", error); }
    };

    const handleCreateLinkingRequest = async ({projectIdToLink, parentId}) => {
        const projectToLink = allTasks.find(t => t.id === projectIdToLink);
        if (!projectToLink) return;

        const adminOfProjectToLink = projectToLink.team.find(m => m.role === 'admin');
        if (!adminOfProjectToLink) return;

        const requestTask = {
            title: `Solicitud para vincular: "${projectToLink.title}"`,
            description: `El administrador de "${breadcrumbs[breadcrumbs.length-1].title}" quiere vincular este proyecto como una subtarea. Al completar esta tarea, le darás acceso.`,
            parentId: parentId,
            status: 'todo',
            assigneeId: adminOfProjectToLink.userId,
            createdAt: Timestamp.now(),
            deleted: false,
            taskType: 'linkingRequest',
            linkingData: {
                projectIdToLink: projectIdToLink,
                requesterId: loggedInUser.uid,
                originalParentId: parentId
            }
        };
        await addDoc(collection(db, tasksCollectionPath), requestTask);
        closeTaskModal();
    };

    const handleTakeTask = async (taskId) => await updateDoc(doc(db, tasksCollectionPath, taskId), { status: 'inProgress', assigneeId: loggedInUser.uid, startedAt: Timestamp.now() });
    
    const handleLogHoursAndComplete = async (actualHours) => {
        if (!taskToLogHours) return;
        const taskRef = doc(db, tasksCollectionPath, taskToLogHours.id);

        // Check if it's a linking request
        if (taskToLogHours.taskType === 'linkingRequest') {
            const { projectIdToLink, requesterId, originalParentId } = taskToLogHours.linkingData;
            const projectToLinkRef = doc(db, tasksCollectionPath, projectIdToLink);
            
            // Add requester to the team of the linked project
            await updateDoc(projectToLinkRef, {
                team: arrayUnion({ userId: requesterId, role: 'member' }),
                memberIds: arrayUnion(requesterId)
            });

            // Replace the request task with the actual linked task
            await updateDoc(taskRef, {
                title: `VINCULADO: ${taskToLogHours.title.replace('Solicitud para vincular: ', '')}`,
                description: `Este es un enlace al proyecto. Haz clic en 'Abrir Tablero' para ver sus detalles.`,
                taskType: 'linkedProject',
                status: 'done',
                linkedProjectId: projectIdToLink
            });

        } else {
            await updateDoc(taskRef, { status: 'done', completedAt: Timestamp.now(), actualHours, startedAt: null });
        }
        setTaskToLogHours(null);
    };
    
    const handleRevertTask = async (taskId, currentStatus) => {
        const taskRef = doc(db, tasksCollectionPath, taskId);
        if (currentStatus === 'inProgress') await updateDoc(taskRef, { status: 'todo', assigneeId: null, startedAt: null });
        else if (currentStatus === 'done') await updateDoc(taskRef, { status: 'inProgress', completedAt: null, startedAt: Timestamp.now(), actualHours: 0 });
    };

    const handleDeleteTask = async (taskId) => {
        if (allTasks.some(t => t.parentId === taskId && !t.deleted)) {
            alert("No se puede borrar una tarea con subtareas activas.");
            return;
        }
        if (window.confirm("¿Estás seguro de que quieres borrar esta tarea?")) {
            await updateDoc(doc(db, tasksCollectionPath, taskId), { deleted: true });
        }
    };

    const handleAssignTask = async (taskId, userId) => await updateDoc(doc(db, tasksCollectionPath, taskId), { assigneeId: userId });
    
    const openTaskModal = (task = null) => { setTaskToEdit(task); setIsTaskModalOpen(true); };
    const closeTaskModal = () => { setTaskToEdit(null); setIsTaskModalOpen(false); };
    
    const openTeamModal = (project) => { setProjectToManage(project); setIsTeamModalOpen(true); };
    const closeTeamModal = () => { setProjectToManage(null); setIsTeamModalOpen(false); };

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
                    <button onClick={() => setCurrentView('my-workload')} title="Mi Carga de Trabajo" className="p-2 text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Briefcase className="w-5 h-5"/></button>
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
                    </nav>
                    {currentView !== 'my-workload' && <button onClick={() => openTaskModal()} className="bg-sky-500 text-white px-4 py-2 rounded-lg shadow hover:bg-sky-600 flex items-center"><Plus className="w-5 h-5 mr-2" /> {currentParentId ? 'Nueva Subtarea' : 'Nuevo Proyecto'}</button>}
                </div>
                
                {currentView === 'dashboard' && <ProjectsDashboard projects={userProjects} allTasks={allTasks} onNavigate={navigateToTask} onEdit={openTaskModal} onDelete={handleDeleteTask} onManageTeam={openTeamModal} loggedInUser={loggedInUser} />}
                {currentView === 'kanban' && (
                    <div className="flex-grow flex flex-col md:flex-row gap-6 overflow-x-auto pb-4 h-full">
                        <BoardColumn title="Pendiente" tasks={tasksByStatus.todo} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} onEditTicket={openTaskModal} onAssign={handleAssignTask} onDelete={handleDeleteTask} allTasks={activeTasks} loggedInUser={loggedInUser} team={team} onNavigate={navigateToTask} />
                        <BoardColumn title="En Progreso" tasks={tasksByStatus.inProgress} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} onEditTicket={openTaskModal} onAssign={handleAssignTask} onDelete={handleDeleteTask} allTasks={activeTasks} loggedInUser={loggedInUser} team={team} onNavigate={navigateToTask} />
                        <BoardColumn title="Hecho" tasks={tasksByStatus.done} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} onEditTicket={openTaskModal} onAssign={handleAssignTask} onDelete={handleDeleteTask} allTasks={activeTasks} loggedInUser={loggedInUser} team={team} onNavigate={navigateToTask} />
                    </div>
                )}
                {currentView === 'my-workload' && <MyWorkloadDashboard allTasks={activeTasks} loggedInUser={loggedInUser} getAggregatedHours={getAggregatedHours} onNavigate={navigateToTask} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} onEdit={openTaskModal} team={team} />}

            </main>
            {isTeamModalOpen && <Modal onClose={closeTeamModal}><TeamManagement project={projectToManage} allUsers={team} db={db} tasksCollectionPath={tasksCollectionPath} loggedInUser={loggedInUser} onClose={closeTeamModal} /></Modal>}
            {isTaskModalOpen && <Modal onClose={closeTaskModal}><TaskForm onSave={handleSaveTask} onLinkProject={handleCreateLinkingRequest} onClose={closeTaskModal} allTasks={activeTasks} taskToEdit={taskToEdit} parentId={currentParentId} loggedInUser={loggedInUser} /></Modal>}
            {taskToLogHours && <Modal onClose={() => setTaskToLogHours(null)}><LogHoursModal onSave={handleLogHoursAndComplete} onCancel={() => setTaskToLogHours(null)} task={taskToLogHours} /></Modal>}
        </div>
    );
}
