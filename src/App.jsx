import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc,
    getDoc,
    updateDoc, 
    onSnapshot, 
    query, 
    where, 
    writeBatch,
    getDocs,
    Timestamp,
    setDoc
} from 'firebase/firestore';
import { Plus, Clock, Calendar, Lock, Unlock, ArrowRight, Check, User, Folder, RotateCcw, Undo2, Edit, ExternalLink, LogOut, KeyRound, Eye, EyeOff, ShieldCheck, Users, GitBranch, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

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

// --- Componentes ---

const Spinner = () => <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>;

const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                {children}
            </div>
        </div>
    </div>
);

const TaskForm = ({ onSave, onClose, existingTasks, taskToEdit, parentId = null }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [preferredDate, setPreferredDate] = useState('');
    const [expirationDate, setExpirationDate] = useState('');
    const [dependencies, setDependencies] = useState([]);
    const [expectedHours, setExpectedHours] = useState('');

    useEffect(() => {
        if (taskToEdit) {
            setTitle(taskToEdit.title);
            setDescription(taskToEdit.description || '');
            setPreferredDate(taskToEdit.preferredDate ? new Date(taskToEdit.preferredDate.seconds * 1000).toISOString().split('T')[0] : '');
            setExpirationDate(taskToEdit.expirationDate ? new Date(taskToEdit.expirationDate.seconds * 1000).toISOString().split('T')[0] : '');
            setDependencies(taskToEdit.dependencies || []);
            setExpectedHours(taskToEdit.expectedHours || '');
        }
    }, [taskToEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ 
            title, 
            description, 
            preferredDate: preferredDate ? Timestamp.fromDate(new Date(preferredDate)) : null, 
            expirationDate: expirationDate ? Timestamp.fromDate(new Date(expirationDate)) : null, 
            dependencies,
            expectedHours: Number(expectedHours) || 0,
            parentId
        });
    };
    
    const availableDependencies = existingTasks.filter(t => !taskToEdit || t.id !== taskToEdit.id);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                <Edit className="w-6 h-6 mr-3 text-sky-500"/>
                {taskToEdit ? 'Editar Tarea' : (parentId ? 'Nueva Subtarea' : 'Nuevo Proyecto')}
            </h2>
            <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Título</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required /></div>
            <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Descripción</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows="3"></textarea></div>
            <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Horas Estimadas</label><input type="number" value={expectedHours} onChange={(e) => setExpectedHours(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Ej: 8" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Fecha Preferente</label><input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
                <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Fecha de Expiración</label><input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Dependencias (tareas que deben completarse antes)</label>
                <select multiple value={dependencies} onChange={(e) => setDependencies(Array.from(e.target.selectedOptions, option => option.value))} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white h-32">
                    {availableDependencies.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}
                </select>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-md bg-sky-500 text-white hover:bg-sky-600 flex items-center"><Plus className="w-4 h-4 mr-2" />{taskToEdit ? 'Guardar Cambios' : 'Crear Tarea'}</button>
            </div>
        </form>
    );
};

const LogHoursModal = ({ onSave, onCancel, task }) => {
    const [actualHours, setActualHours] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (actualHours && !isNaN(actualHours)) {
            onSave(Number(actualHours));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Completar Tarea: {task.title}</h2>
            <p className="text-gray-600 dark:text-gray-300">Horas estimadas para esta tarea: <strong>{task.expectedHours || 0}h</strong>.</p>
            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">¿Cuántas horas reales has dedicado?</label>
                <input 
                    type="number" 
                    value={actualHours} 
                    onChange={(e) => setActualHours(e.target.value)} 
                    className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                    placeholder="Ej: 7.5"
                    required 
                    autoFocus
                />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 flex items-center"><Check className="w-4 h-4 mr-2" /> Registrar y Completar</button>
            </div>
        </form>
    );
};


const TaskCard = ({ task, onTake, onComplete, onRevert, onEdit, isLocked, loggedInUser, team }) => {
    const assignee = task.assigneeId ? team.find(m => m.id === task.assigneeId) : null;
    const assigneeName = assignee ? assignee.username : 'Sin asignar';
    const deviation = task.status === 'done' ? (task.actualHours || 0) - (task.expectedHours || 0) : null;

    const formatDate = (timestamp) => timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString() : null;

    return (
        <div onClick={() => onEdit(task)} className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 ${isLocked ? 'border-red-500 opacity-60' : 'border-sky-500'} transition-shadow hover:shadow-lg cursor-pointer`}>
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-lg text-gray-900 dark:text-white">{task.title}</h4>
                {isLocked ? <Lock className="w-5 h-5 text-red-500" /> : task.status === 'todo' && <Unlock className="w-5 h-5 text-green-500" />}
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">{task.description}</p>
            
            <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
                {task.preferredDate && <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> Preferente: {formatDate(task.preferredDate)}</div>}
                {task.expirationDate && <div className="flex items-center"><AlertCircle className="w-4 h-4 mr-2 text-red-500" /> Expira: {formatDate(task.expirationDate)}</div>}
                
                <div className="flex items-center"><Clock className="w-4 h-4 mr-2" /> 
                    Estimadas: {task.expectedHours || 0}h
                    {task.status === 'done' && `, Reales: ${task.actualHours || 0}h`}
                </div>

                {deviation !== null && (
                    <div className={`flex items-center font-semibold ${deviation > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {deviation > 0 ? <TrendingUp className="w-4 h-4 mr-2"/> : <TrendingDown className="w-4 h-4 mr-2"/>}
                        Desviación: {deviation.toFixed(1)}h
                    </div>
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center text-sm"><User className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" /><span className="text-gray-700 dark:text-gray-300">{assigneeName}</span></div>
                <div className="flex items-center space-x-2">
                    {(loggedInUser.role === 'admin' || loggedInUser.role === 'superuser') && task.status === 'inProgress' && <button onClick={() => onRevert(task.id, 'inProgress')} title="Devolver a Pendiente" className="p-2 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200 rounded-full hover:bg-yellow-100 dark:hover:bg-gray-700"><Undo2 className="w-4 h-4" /></button>}
                    {(loggedInUser.role === 'admin' || loggedInUser.role === 'superuser') && task.status === 'done' && <button onClick={() => onRevert(task.id, 'done')} title="Reabrir Tarea" className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 rounded-full hover:bg-red-100 dark:hover:bg-gray-700"><RotateCcw className="w-4 h-4" /></button>}
                    {task.status === 'todo' && !isLocked && <button onClick={() => onTake(task.id)} className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center">Coger <ArrowRight className="w-4 h-4 ml-1" /></button>}
                    {task.status === 'inProgress' && task.assigneeId === loggedInUser.uid && <button onClick={() => onComplete(task)} className="px-3 py-1 text-sm bg-sky-500 text-white rounded-md hover:bg-sky-600 flex items-center">Completar <Check className="w-4 h-4 ml-1" /></button>}
                </div>
            </div>
        </div>
    );
};

const BoardColumn = ({ title, tickets, onTake, onComplete, onRevert, onEditTicket, allTickets, loggedInUser, team }) => {
    const ticketStatusMap = useMemo(() => {
        const map = new Map();
        allTickets.forEach(t => map.set(t.id, t.status));
        return map;
    }, [allTickets]);

    const isTicketLocked = (ticket) => ticket.dependencies?.some(depId => ticketStatusMap.get(depId) !== 'done');

    return (
        <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4 w-full md:w-1/3 flex-shrink-0">
            <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-4">{title}</h3>
            <div className="space-y-4 h-full overflow-y-auto">
                {tickets.map(task => <TaskCard key={task.id} task={task} onTake={onTake} onComplete={onComplete} onRevert={onRevert} onEdit={onEditTicket} isLocked={title === 'Pendiente' && isTicketLocked(task)} loggedInUser={loggedInUser} team={team} />)}
            </div>
        </div>
    );
};

const AuthScreen = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                if (!username) {
                    setError('El nombre de usuario es obligatorio para registrarse.');
                    setIsLoading(false);
                    return;
                }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, teamCollectionPath, userCredential.user.uid), {
                    username: username,
                    email: email,
                    role: 'pending'
                });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-screen flex justify-center items-center bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-sm p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
                <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
                    {isLogin ? 'Iniciar Sesión' : 'Registrar Cuenta'}
                </h1>
                <form onSubmit={handleAuth} className="space-y-4">
                    {!isLogin && (
                         <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Nombre de Usuario</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Ej: pablo_g"/></div>
                    )}
                    <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="tu@email.com"/></div>
                    <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Contraseña</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="••••••••"/></div>
                    {error && <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900/50 p-2 rounded-md">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full py-2 px-4 bg-sky-500 text-white rounded-md hover:bg-sky-600 font-semibold disabled:bg-sky-300 flex justify-center items-center">
                        {isLoading ? <Spinner/> : (isLogin ? 'Entrar' : 'Registrarse')}
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-sky-500 hover:underline">
                        {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const UserManagement = ({ onClose }) => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, teamCollectionPath));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        const userRef = doc(db, teamCollectionPath, userId);
        await updateDoc(userRef, { role: newRole });
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center"><Users className="mr-3"/>Gestionar Usuarios</h2>
            {isLoading ? <Spinner/> : (
                <div className="space-y-3">
                    {users.map(user => (
                        <div key={user.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                            <div>
                                <p className="font-semibold">{user.username}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                            </div>
                            <div>
                                <select 
                                    value={user.role} 
                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                    className="p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    disabled={user.role === 'superuser'}
                                >
                                    <option value="pending">Pendiente</option>
                                    <option value="member">Miembro</option>
                                    <option value="admin">Admin</option>
                                    {user.role === 'superuser' && <option value="superuser">Superusuario</option>}
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

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
                await updateDoc(doc(db, tasksCollectionPath, taskToEdit.id), taskData);
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
        } catch (error) { console.error("Error al guardar tarea: ", error); }
    };

    const handleTakeTask = async (taskId) => await updateDoc(doc(db, tasksCollectionPath, taskId), { status: 'inProgress', assigneeId: loggedInUser.uid, startedAt: Timestamp.now() });
    
    const handleLogHoursAndComplete = async (actualHours) => {
        if (!taskToLogHours) return;
        const taskId = taskToLogHours.id;
        const batch = writeBatch(db);
        const taskRef = doc(db, tasksCollectionPath, taskId);
        batch.update(taskRef, { status: 'done', completedAt: Timestamp.now(), actualHours, startedAt: null });
        await batch.commit();
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

    const tasksByStatus = {
        todo: tasks.filter(t => t.status === 'todo').sort((a,b) => (a.preferredDate?.seconds || Infinity) - (b.preferredDate?.seconds || Infinity)),
        inProgress: tasks.filter(t => t.status === 'inProgress'),
        done: tasks.filter(t => t.status === 'done'),
    };

    if (isLoading) return <div className="w-full h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900"><Spinner /></div>;
    if (!loggedInUser) return <AuthScreen />;
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
                    <BoardColumn title="Pendiente" tickets={tasksByStatus.todo} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} onEditTicket={openTaskModal} allTickets={tasks} loggedInUser={loggedInUser} team={team} />
                    <BoardColumn title="En Progreso" tickets={tasksByStatus.inProgress} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} onEditTicket={openTaskModal} allTickets={tasks} loggedInUser={loggedInUser} team={team} />
                    <BoardColumn title="Hecho" tickets={tasksByStatus.done} onTake={handleTakeTask} onComplete={setTaskToLogHours} onRevert={handleRevertTask} onEditTicket={openTaskModal} allTickets={tasks} loggedInUser={loggedInUser} team={team} />
                </div>
            </main>
            {isUserManagementOpen && <Modal onClose={() => setIsUserManagementOpen(false)}><UserManagement onClose={() => setIsUserManagementOpen(false)} /></Modal>}
            {isTaskModalOpen && <Modal onClose={closeTaskModal}><TaskForm onSave={handleSaveTask} onClose={closeTaskModal} existingTasks={tasks} taskToEdit={taskToEdit} parentId={currentView.parentId} /></Modal>}
            {taskToLogHours && <Modal onClose={() => setTaskToLogHours(null)}><LogHoursModal onSave={handleLogHoursAndComplete} onCancel={() => setTaskToLogHours(null)} task={taskToLogHours} /></Modal>}
        </div>
    );
}
