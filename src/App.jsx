import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, updateDoc, onSnapshot, query, where, Timestamp, deleteDoc } from 'firebase/firestore';
import { Plus, Users, LogOut, Home, ChevronRight } from 'lucide-react';

// --- Mis Componentes ---
import AuthScreen from './components/AuthScreen';
import BoardColumn from './components/BoardColumn';
import Modal from './components/Modal';
import Spinner from './components/Spinner';
import TaskForm from './components/TaskForm';
import LogHoursModal from './components/LogHoursModal';
import UserManagement from './components/UserManagement';
import ProjectsDashboard from './components/ProjectsDashboard';

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

// --- Lógica de Cálculo de Fechas ---
const calculateDates = (tasks) => {
    if (!tasks || tasks.length === 0) return [];

    const tasksMap = new Map(tasks.map(t => [t.id, { ...t }]));

    // Forward Pass: Calculate Earliest Start Date (ESD)
    tasks.forEach(task => {
        if (!task.dependencies || task.dependencies.length === 0) {
            tasksMap.get(task.id).earliestStartDate = task.plannedStartDate;
        } else {
            const depDates = task.dependencies
                .map(depId => tasksMap.get(depId)?.expirationDate)
                .filter(Boolean);
            
            if (depDates.length > 0) {
                const maxDepDate = new Date(Math.max.apply(null, depDates.map(d => d.toDate())));
                tasksMap.get(task.id).earliestStartDate = Timestamp.fromDate(maxDepDate);
            } else {
                tasksMap.get(task.id).earliestStartDate = task.plannedStartDate;
            }
        }
    });

    // Backward Pass: Calculate Latest Finish Date (LFD)
    const successors = new Map();
    tasks.forEach(task => {
        if (task.dependencies) {
            task.dependencies.forEach(depId => {
                if (!successors.has(depId)) successors.set(depId, []);
                successors.get(depId).push(task.id);
            });
        }
    });

    tasks.slice().reverse().forEach(task => {
        const taskSuccessors = successors.get(task.id);
        if (!taskSuccessors || taskSuccessors.length === 0) {
            tasksMap.get(task.id).latestFinishDate = task.expirationDate;
        } else {
            const succDates = taskSuccessors
                .map(succId => tasksMap.get(succId)?.earliestStartDate)
                .filter(Boolean);
            
            if (succDates.length > 0) {
                const minSuccDate = new Date(Math.min.apply(null, succDates.map(d => d.toDate())));
                tasksMap.get(task.id).latestFinishDate = Timestamp.fromDate(minSuccDate);
            } else {
                 tasksMap.get(task.id).latestFinishDate = task.expirationDate;
            }
        }
    });

    // Calculate Slack
    tasksMap.forEach(task => {
        if (task.earliestStartDate && task.latestFinishDate) {
            const esd = task.earliestStartDate.toDate();
            const lfd = task.latestFinishDate.toDate();
            const duration = (task.expectedHours || 0) / 8; // Assuming 8 hours per day
            const efd = new Date(esd);
            efd.setDate(efd.getDate() + duration);

            const slack = (lfd - efd) / (1000 * 60 * 60 * 24); // Slack in days
            task.slack = Math.floor(slack);
        }
    });

    return Array.from(tasksMap.values());
};


export default function App() {
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [team, setTeam] = useState([]);
    const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);
    const [taskToLogHours, setTaskToLogHours] = useState(null);
    
    const [allTasks, setAllTasks] = useState([]);
    const [processedTasks, setProcessedTasks] = useState([]);
    const [currentView, setCurrentView] = useState('dashboard');
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, title: 'Proyectos' }]);

    const currentParentId = breadcrumbs[breadcrumbs.length - 1].id;
    
    const activeTasks = useMemo(() => processedTasks.filter(task => !task.deleted), [processedTasks]);
    const currentTasks = useMemo(() => activeTasks.filter(task => task.parentId === currentParentId), [activeTasks, currentParentId]);

    useEffect(() => {
        // ... Auth and Team listeners
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
        const unsubscribeTeam = onSnapshot(collection(db, teamCollectionPath), (snapshot) => setTeam(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        const unsubscribeTasks = onSnapshot(collection(db, tasksCollectionPath), (snapshot) => setAllTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

        return () => { unsubscribeAuth(); unsubscribeTeam(); unsubscribeTasks(); };
    }, []);

    useEffect(() => {
        // Recalculate dates whenever tasks change
        const calculated = calculateDates(allTasks);
        setProcessedTasks(calculated);
    }, [allTasks]);


    const navigateToTask = (task) => {
        setBreadcrumbs(prev => [...prev, { id: task.id, title: task.title }]);
        setCurrentView('kanban');
    };

    const navigateToBreadcrumb = (index) => {
        setBreadcrumbs(prev => prev.slice(0, index + 1));
        if (index === 0) setCurrentView('dashboard');
    };

    const handleSaveTask = async (taskData) => {
        try {
            if (taskToEdit) {
                await updateDoc(doc(db, tasksCollectionPath, taskToEdit.id), taskData);
            } else {
                await addDoc(collection(db, tasksCollectionPath), { ...taskData, status: 'todo', createdAt: Timestamp.now(), assigneeId: null, actualHours: 0, isLocked: taskData.dependencies?.length > 0, deleted: false });
            }
            closeTaskModal();
        } catch (error) { console.error("Error al guardar tarea: ", error); }
    };

    const handleTakeTask = async (taskId) => await updateDoc(doc(db, tasksCollectionPath, taskId), { status: 'inProgress', assigneeId: loggedInUser.uid, startedAt: Timestamp.now() });
    
    const handleLogHoursAndComplete = async (actualHours) => {
        if (!taskToLogHours) return;
        await updateDoc(doc(db, tasksCollectionPath, taskToLogHours.id), { status: 'done', completedAt: Timestamp.now(), actualHours, startedAt: null });
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
        if (window.confirm("¿Estás seguro de que quieres borrar esta tarea? Podrás recuperarla más tarde.")) {
            await updateDoc(doc(db, tasksCollectionPath, taskId), { deleted: true });
        }
    };

    const handleRestoreTask = async (taskId) => await updateDoc(doc(db, tasksCollectionPath, taskId), { deleted: false });
    const handleAssignTask = async (taskId, userId) => await updateDoc(doc(db, tasksCollectionPath, taskId), { assigneeId: userId });

    const openTaskModal = (task = null) => { setTaskToEdit(task); setIsTaskModalOpen(true); };
    const closeTaskModal = () => { setTaskToEdit(null); setIsTaskModalOpen(false); };

    const tasksByStatus = useMemo(() => ({
        todo: currentTasks.filter(t => t.status === 'todo').sort((a,b) => (a.preferredDate?.seconds || Infinity) - (b.preferredDate?.seconds || Infinity)),
        inProgress: currentTasks.filter(t => t.status === 'inProgress'),
        done: currentTasks.filter(t => t.status === 'done'),
    }), [currentTasks]);

    if (isLoading) return <div className="w-full h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900"><Spinner /></div>;
    if (!loggedInUser) return <AuthScreen db={db} auth={auth} teamCollectionPath={teamCollectionPath} />;
    if (loggedInUser.role === 'pending') return (
        <div className="w-full h-screen flex flex-col justify-center items-center bg-gray-100 dark:bg-gray-900 text-center p-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Cuenta Pendiente de Aprobación</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Un administrador necesita asignarte un rol para continuar.</p>
            <button onClick={() => signOut(auth)} className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">Cerrar Sesión</button>
        </div>
    );
    
    return (
        <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen font-sans">
            <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center">
                <div className="font-bold text-xl text-sky-600 dark:text-sky-400">Gestor de Investigación</div>
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Hola, <span className="font-bold">{loggedInUser.username}</span>!</span>
                    {loggedInUser.role === 'superuser' && <button onClick={() => setIsUserManagementOpen(true)} title="Gestionar Usuarios" className="p-2 text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Users className="w-5 h-5"/></button>}
                    <button onClick={() => signOut(auth)} title="Cerrar Sesión" className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><LogOut className="w-5 h-5"/></button>
                </div>
            </header>
            <main className="h-[calc(100vh-68px)] p-4 sm:p-6 lg:p-8">
                 <div className="flex justify-between items-center mb-6">
                    <nav className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={crumb.id || 'root'}>
                                {index > 0 && <ChevronRight className="w-4 h-4 mx-1" />}
                                <button onClick={() => navigateToBreadcrumb(index)} className={`hover:text-sky-600 dark:hover:text-sky-400 ${index === breadcrumbs.length - 1 ? 'text-gray-800 dark:text-white font-semibold' : ''}`}>
                                    {index === 0 ? <Home className="w-4 h-4 inline-block mr-1" /> : null} {crumb.title}
                                </button>
                            </React.Fragment>
                        ))}
                    </nav>
                    {(loggedInUser.role === 'admin' || loggedInUser.role === 'superuser') && <button onClick={() => openTaskModal()} className="bg-sky-500 text-white px-4 py-2 rounded-lg shadow hover:bg-sky-600 flex items-center"><Plus className="w-5 h-5 mr-2" /> {currentParentId ? 'Nueva Subtarea' : 'Nuevo Proyecto'}</button>}
                </div>
                
                {currentView === 'dashboard' ? (
                    <ProjectsDashboard allTasks={activeTasks} onNavigate={navigateToTask} onEdit={openTaskModal} onDelete={handleDeleteTask} loggedInUser={loggedInUser} />
                ) : (
                    <div className="flex-grow flex flex-col md:flex-row gap-6 overflow-x-auto pb-4 h-full">
                        <BoardColumn title="Pendiente" tasks={tasksByStatus.todo} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} onEditTicket={openTaskModal} onAssign={handleAssignTask} onDelete={handleDeleteTask} allTasks={activeTasks} loggedInUser={loggedInUser} team={team} onNavigate={navigateToTask} />
                        <BoardColumn title="En Progreso" tasks={tasksByStatus.inProgress} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} onEditTicket={openTaskModal} onAssign={handleAssignTask} onDelete={handleDeleteTask} allTasks={activeTasks} loggedInUser={loggedInUser} team={team} onNavigate={navigateToTask} />
                        <BoardColumn title="Hecho" tasks={tasksByStatus.done} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} onEditTicket={openTaskModal} onAssign={handleAssignTask} onDelete={handleDeleteTask} allTasks={activeTasks} loggedInUser={loggedInUser} team={team} onNavigate={navigateToTask} />
                    </div>
                )}
            </main>
            {isUserManagementOpen && <Modal onClose={() => setIsUserManagementOpen(false)}><UserManagement db={db} allTasks={allTasks} onRestoreTask={handleRestoreTask} teamCollectionPath={teamCollectionPath} /></Modal>}
            {isTaskModalOpen && <Modal onClose={closeTaskModal}><TaskForm onSave={handleSaveTask} onClose={closeTaskModal} allTasks={activeTasks} taskToEdit={taskToEdit} parentId={currentParentId} /></Modal>}
            {taskToLogHours && <Modal onClose={() => setTaskToLogHours(null)}><LogHoursModal onSave={handleLogHoursAndComplete} onCancel={() => setTaskToLogHours(null)} task={taskToLogHours} /></Modal>}
        </div>
    );
}
