import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, updateDoc, onSnapshot, query, where, writeBatch, Timestamp } from 'firebase/firestore';
import { Plus, Users, LogOut } from 'lucide-react';

// --- Mis Componentes ---
import AuthScreen from './components/AuthScreen';
import BoardColumn from './components/BoardColumn';
import Modal from './components/Modal';
import Spinner from './components/Spinner';
import TaskForm from './components/TaskForm';
import LogHoursModal from './components/LogHoursModal';
import UserManagement from './components/UserManagement';

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
    const [currentView, setCurrentView] = useState({ type: 'dashboard', parentId: null });
    const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);
    const [taskToLogHours, setTaskToLogHours] = useState(null);
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, teamCollectionPath, user.uid);
                const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setLoggedInUser({ uid: user.uid, ...docSnap.data() });
                    }
                    setIsLoading(false);
                });
                return () => unsubscribeDoc();
            } else {
                setLoggedInUser(null);
                setIsLoading(false);
            }
        });

        const unsubscribeTeam = onSnapshot(collection(db, teamCollectionPath), (snapshot) => {
            setTeam(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribeAuth();
            unsubscribeTeam();
        };
    }, []);

    useEffect(() => {
        if (!loggedInUser) return;
        const q = query(collection(db, tasksCollectionPath), where('parentId', '==', currentView.parentId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [loggedInUser, currentView]);

    const handleSaveTask = async (taskData) => {
        try {
            if (taskToEdit) {
                const taskRef = doc(db, tasksCollectionPath, taskToEdit.id);
                await updateDoc(taskRef, taskData);
            } else {
                await addDoc(collection(db, tasksCollectionPath), { 
                    ...taskData, 
                    status: 'todo', 
                    createdAt: Timestamp.now(), 
                    assigneeId: null, 
                    actualHours: 0,
                    isLocked: taskData.dependencies?.length > 0 
                });
            }
            closeTaskModal();
        } catch (error) { 
            console.error("Error al guardar tarea: ", error); 
        }
    };

    const handleTakeTask = async (taskId) => await updateDoc(doc(db, tasksCollectionPath, taskId), { status: 'inProgress', assigneeId: loggedInUser.uid, startedAt: Timestamp.now() });
    
    const handleLogHoursAndComplete = async (actualHours) => {
        if (!taskToLogHours) return;
        const taskId = taskToLogHours.id;
        const taskRef = doc(db, tasksCollectionPath, taskId);
        await updateDoc(taskRef, { status: 'done', completedAt: Timestamp.now(), actualHours, startedAt: null });
        setTaskToLogHours(null);
    };
    
    const handleRevertTask = async (taskId, currentStatus) => {
        const taskRef = doc(db, tasksCollectionPath, taskId);
        if (currentStatus === 'inProgress') await updateDoc(taskRef, { status: 'todo', assigneeId: null, startedAt: null });
        else if (currentStatus === 'done') await updateDoc(taskRef, { status: 'inProgress', completedAt: null, startedAt: Timestamp.now(), actualHours: 0 });
    };

    const openTaskModal = (task = null) => {
        setTaskToEdit(task);
        setIsTaskModalOpen(true);
    };

    const closeTaskModal = () => {
        setTaskToEdit(null);
        setIsTaskModalOpen(false);
    };

    const tasksByStatus = useMemo(() => ({
        todo: tasks.filter(t => t.status === 'todo').sort((a,b) => (a.preferredDate?.seconds || Infinity) - (b.preferredDate?.seconds || Infinity)),
        inProgress: tasks.filter(t => t.status === 'inProgress'),
        done: tasks.filter(t => t.status === 'done'),
    }), [tasks]);

    if (isLoading) return <div className="w-full h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900"><Spinner /></div>;
    if (!loggedInUser) return <AuthScreen db={db} auth={auth} teamCollectionPath={teamCollectionPath} />;
    if (loggedInUser.role === 'pending') return (
        <div className="w-full h-screen flex flex-col justify-center items-center bg-gray-100 dark:bg-gray-900 text-center p-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Cuenta Pendiente de Aprobación</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Tu cuenta ha sido registrada. Un administrador necesita asignarte un rol para continuar.</p>
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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {currentView.parentId ? 'Subtareas' : 'Proyectos'}
                    </h1>
                    {(loggedInUser.role === 'admin' || loggedInUser.role === 'superuser') && <button onClick={() => openTaskModal()} className="bg-sky-500 text-white px-4 py-2 rounded-lg shadow hover:bg-sky-600 flex items-center"><Plus className="w-5 h-5 mr-2" /> {currentView.parentId ? 'Nueva Subtarea' : 'Nuevo Proyecto'}</button>}
                </div>
                <div className="flex-grow flex flex-col md:flex-row gap-6 overflow-x-auto pb-4 h-full">
                    <BoardColumn title="Pendiente" tasks={tasksByStatus.todo} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} onEditTicket={openTaskModal} allTasks={tasks} loggedInUser={loggedInUser} team={team} />
                    <BoardColumn title="En Progreso" tasks={tasksByStatus.inProgress} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} onEditTicket={openTaskModal} allTasks={tasks} loggedInUser={loggedInUser} team={team} />
                    <BoardColumn title="Hecho" tasks={tasksByStatus.done} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} onEditTicket={openTaskModal} allTasks={tasks} loggedInUser={loggedInUser} team={team} />
                </div>
            </main>
            {isUserManagementOpen && <Modal onClose={() => setIsUserManagementOpen(false)}><UserManagement db={db} teamCollectionPath={teamCollectionPath} /></Modal>}
            {isTaskModalOpen && <Modal onClose={closeTaskModal}><TaskForm onSave={handleSaveTask} onClose={closeTaskModal} existingTasks={tasks} taskToEdit={taskToEdit} parentId={currentView.parentId} /></Modal>}
            {taskToLogHours && <Modal onClose={() => setTaskToLogHours(null)}><LogHoursModal onSave={handleLogHoursAndComplete} onCancel={() => setTaskToLogHours(null)} task={taskToLogHours} /></Modal>}
        </div>
    );
}
