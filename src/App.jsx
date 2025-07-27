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
import { Plus, Clock, Calendar, Lock, Unlock, ArrowRight, Check, User, Folder, RotateCcw, Undo2, Edit, ExternalLink, LogOut, KeyRound, Eye, EyeOff, ShieldCheck, Users } from 'lucide-react';

// --- PASO 1: Pega aquí tu configuración de Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyDSgxBTfANOhUKyBDJVuPrxxGZvHyZqcWE",
  authDomain: "gestor-investigacion-app.firebaseapp.com",
  projectId: "gestor-investigacion-app",
  storageBucket: "gestor-investigacion-app.firebasestorage.app",
  messagingSenderId: "303130285560",
  appId: "1:303130285560:web:6167e3be7b1deae9dd720d",
  measurementId: "G-85QXTBFR1E"
};

// --- Inicialización de servicios ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Rutas de Firestore ---
const projectsCollectionPath = `projects`;
const ticketsCollectionPath = `tickets`;
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

const TicketForm = ({ onSave, onClose, existingTickets, ticketToEdit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [preferredDate, setPreferredDate] = useState('');
    const [expirationDate, setExpirationDate] = useState('');
    const [dependencies, setDependencies] = useState([]);

    useEffect(() => {
        if (ticketToEdit) {
            setTitle(ticketToEdit.title);
            setDescription(ticketToEdit.description || '');
            setPreferredDate(ticketToEdit.preferredDate ? new Date(ticketToEdit.preferredDate.seconds * 1000).toISOString().split('T')[0] : '');
            setExpirationDate(ticketToEdit.expirationDate ? new Date(ticketToEdit.expirationDate.seconds * 1000).toISOString().split('T')[0] : '');
            setDependencies(ticketToEdit.dependencies || []);
        }
    }, [ticketToEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ title, description, preferredDate: preferredDate ? Timestamp.fromDate(new Date(preferredDate)) : null, expirationDate: expirationDate ? Timestamp.fromDate(new Date(expirationDate)) : null, dependencies });
    };
    
    const availableDependencies = existingTickets.filter(t => !ticketToEdit || t.id !== ticketToEdit.id);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center"><Edit className="w-6 h-6 mr-3 text-sky-500"/>{ticketToEdit ? 'Editar Ticket' : 'Nuevo Ticket de Tarea'}</h2>
            <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Título</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required /></div>
            <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Descripción</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows="3"></textarea></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Fecha Preferente</label><input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
                <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Fecha de Expiración</label><input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Dependencias</label>
                <select multiple value={dependencies} onChange={(e) => setDependencies(Array.from(e.target.selectedOptions, option => option.value))} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white h-32">
                    {availableDependencies.map(ticket => <option key={ticket.id} value={ticket.id}>{ticket.title}</option>)}
                </select>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-md bg-sky-500 text-white hover:bg-sky-600 flex items-center"><Plus className="w-4 h-4 mr-2" />{ticketToEdit ? 'Guardar Cambios' : 'Crear Ticket'}</button>
            </div>
        </form>
    );
};

const TicketCard = ({ ticket, onTake, onComplete, onRevert, onEdit, isLocked, loggedInUser, team }) => {
    const assignee = ticket.assigneeId ? team.find(m => m.id === ticket.assigneeId) : null;
    const assigneeName = assignee ? assignee.username : 'Sin asignar';

    const formatDate = (timestamp) => timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString() : null;

    return (
        <div onClick={() => onEdit(ticket)} className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 ${isLocked ? 'border-red-500 opacity-60' : 'border-sky-500'} transition-shadow hover:shadow-lg cursor-pointer`}>
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-lg text-gray-900 dark:text-white">{ticket.title}</h4>
                {isLocked ? <Lock className="w-5 h-5 text-red-500" /> : ticket.status === 'todo' && <Unlock className="w-5 h-5 text-green-500" />}
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">{ticket.description}</p>
            <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
                {ticket.preferredDate && <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> Preferente: {formatDate(ticket.preferredDate)}</div>}
                {ticket.expirationDate && <div className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-red-500" /> Expira: {formatDate(ticket.expirationDate)}</div>}
                {ticket.totalHours > 0 && <div className="flex items-center"><Clock className="w-4 h-4 mr-2" /> Horas: {ticket.totalHours.toFixed(2)}</div>}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center text-sm"><User className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" /><span className="text-gray-700 dark:text-gray-300">{assigneeName}</span></div>
                <div className="flex items-center space-x-2">
                    {(loggedInUser.role === 'admin' || loggedInUser.role === 'superuser') && ticket.status === 'inProgress' && <button onClick={() => onRevert(ticket.id, 'inProgress')} title="Devolver a Pendiente" className="p-2 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200 rounded-full hover:bg-yellow-100 dark:hover:bg-gray-700"><Undo2 className="w-4 h-4" /></button>}
                    {(loggedInUser.role === 'admin' || loggedInUser.role === 'superuser') && ticket.status === 'done' && <button onClick={() => onRevert(ticket.id, 'done')} title="Reabrir Tarea" className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 rounded-full hover:bg-red-100 dark:hover:bg-gray-700"><RotateCcw className="w-4 h-4" /></button>}
                    {ticket.status === 'todo' && !isLocked && <button onClick={() => onTake(ticket.id)} className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center">Coger <ArrowRight className="w-4 h-4 ml-1" /></button>}
                    {ticket.status === 'inProgress' && ticket.assigneeId === loggedInUser.uid && <button onClick={() => onComplete(ticket.id)} className="px-3 py-1 text-sm bg-sky-500 text-white rounded-md hover:bg-sky-600 flex items-center">Completar <Check className="w-4 h-4 ml-1" /></button>}
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
                {tickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} onTake={onTake} onComplete={onComplete} onRevert={onRevert} onEdit={onEditTicket} isLocked={title === 'Pendiente' && isTicketLocked(ticket)} loggedInUser={loggedInUser} team={team} />)}
            </div>
        </div>
    );
};

const ProjectView = ({ project, loggedInUser, onBack, db, team }) => {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
    const [ticketToEdit, setTicketToEdit] = useState(null);

    useEffect(() => {
        const q = query(collection(db, ticketsCollectionPath), where('projectId', '==', project.id));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        }, (error) => console.error("Error al cargar tickets: ", error));
        return () => unsubscribe();
    }, [db, project.id]);

    const handleSaveTicket = async (ticketData) => {
        try {
            if (ticketToEdit) {
                await updateDoc(doc(db, ticketsCollectionPath, ticketToEdit.id), ticketData);
                setTicketToEdit(null);
            } else {
                await addDoc(collection(db, ticketsCollectionPath), { ...ticketData, projectId: project.id, status: 'todo', createdAt: Timestamp.now(), assigneeId: null, totalHours: 0, isLocked: ticketData.dependencies?.length > 0 });
                setIsNewTicketModalOpen(false);
            }
        } catch (error) { console.error("Error al guardar ticket: ", error); }
    };

    const handleTakeTicket = async (ticketId) => await updateDoc(doc(db, ticketsCollectionPath, ticketId), { status: 'inProgress', assigneeId: loggedInUser.uid, startedAt: Timestamp.now() });

    const handleCompleteTicket = async (ticketId) => {
        const batch = writeBatch(db);
        const ticketRef = doc(db, ticketsCollectionPath, ticketId);
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket || ticket.status !== 'inProgress' || !ticket.startedAt) return;
        const completedAt = Timestamp.now();
        const hours = (completedAt.toMillis() - ticket.startedAt.toMillis()) / (1000 * 60 * 60);
        batch.update(ticketRef, { status: 'done', completedAt, totalHours: (ticket.totalHours || 0) + hours, startedAt: null });
        const dependentQuery = query(collection(db, ticketsCollectionPath), where('dependencies', 'array-contains', ticketId));
        const dependentSnapshot = await getDocs(dependentQuery);
        for (const dependentDoc of dependentSnapshot.docs) {
            const dependentTicket = { id: dependentDoc.id, ...dependentDoc.data() };
            const allDepsQuery = query(collection(db, ticketsCollectionPath), where('__name__', 'in', dependentTicket.dependencies));
            const allDepsSnapshot = await getDocs(allDepsQuery);
            const allDeps = allDepsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            const justCompleted = allDeps.find(d => d.id === ticketId);
            if (justCompleted) justCompleted.status = 'done';
            if (allDeps.every(dep => dep.status === 'done')) {
                batch.update(doc(db, ticketsCollectionPath, dependentTicket.id), { isLocked: false });
            }
        }
        await batch.commit();
    };
    
    const handleRevertTicket = async (ticketId, currentStatus) => {
        const ticketRef = doc(db, ticketsCollectionPath, ticketId);
        if (currentStatus === 'inProgress') await updateDoc(ticketRef, { status: 'todo', assigneeId: null, startedAt: null });
        else if (currentStatus === 'done') await updateDoc(ticketRef, { status: 'inProgress', completedAt: null, startedAt: Timestamp.now() });
    };

    const ticketsByStatus = {
        todo: tickets.filter(t => t.status === 'todo').sort((a,b) => (a.preferredDate?.seconds || Infinity) - (b.preferredDate?.seconds || Infinity)),
        inProgress: tickets.filter(t => t.status === 'inProgress'),
        done: tickets.filter(t => t.status === 'done'),
    };

    const isModalOpen = isNewTicketModalOpen || !!ticketToEdit;
    const closeModal = () => { setIsNewTicketModalOpen(false); setTicketToEdit(null); };

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div><button onClick={onBack} className="text-sky-500 hover:text-sky-700 mb-2">&larr; Volver a Proyectos</button><h2 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h2><p className="text-gray-600 dark:text-gray-400">{project.description}</p></div>
                {(loggedInUser.role === 'admin' || loggedInUser.role === 'superuser') && <button onClick={() => setIsNewTicketModalOpen(true)} className="bg-sky-500 text-white px-4 py-2 rounded-lg shadow hover:bg-sky-600 flex items-center"><Plus className="w-5 h-5 mr-2" /> Nuevo Ticket</button>}
            </div>
            {isLoading ? <div className="flex-grow flex justify-center items-center"><Spinner /></div> : <div className="flex-grow flex flex-col md:flex-row gap-6 overflow-x-auto pb-4"><BoardColumn title="Pendiente" tickets={ticketsByStatus.todo} onTake={handleTakeTicket} onComplete={handleCompleteTicket} onRevert={handleRevertTicket} onEditTicket={setTicketToEdit} allTickets={tickets} loggedInUser={loggedInUser} team={team} /><BoardColumn title="En Progreso" tickets={ticketsByStatus.inProgress} onTake={handleTakeTicket} onComplete={handleCompleteTicket} onRevert={handleRevertTicket} onEditTicket={setTicketToEdit} allTickets={tickets} loggedInUser={loggedInUser} team={team} /><BoardColumn title="Hecho" tickets={ticketsByStatus.done} onTake={handleTakeTicket} onComplete={handleCompleteTicket} onRevert={handleRevertTicket} onEditTicket={setTicketToEdit} allTickets={tickets} loggedInUser={loggedInUser} team={team} /></div>}
            {isModalOpen && <Modal onClose={closeModal}><TicketForm onSave={handleSaveTicket} onClose={closeModal} existingTickets={tickets} ticketToEdit={ticketToEdit} /></Modal>}
        </div>
    );
};

const ProjectForm = ({ onSave, onClose, projectToEdit }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    useEffect(() => { if (projectToEdit) { setName(projectToEdit.name); setDescription(projectToEdit.description); } }, [projectToEdit]);
    const handleSubmit = (e) => { e.preventDefault(); onSave({ name, description }); };
    return (
        <form onSubmit={handleSubmit} className="space-y-4"><h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center"><Edit className="w-6 h-6 mr-3 text-sky-500"/>{projectToEdit ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}</h2><div><label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Nombre del Proyecto</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required /></div><div><label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Descripción Corta</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows="3"></textarea></div><div className="flex justify-end space-x-3 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button><button type="submit" className="px-4 py-2 rounded-md bg-sky-500 text-white hover:bg-sky-600">{projectToEdit ? 'Guardar Cambios' : 'Crear Proyecto'}</button></div></form>
    );
};

const Dashboard = ({ loggedInUser, db, onSelectProject }) => {
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState(null);

    useEffect(() => {
        if (!db || !loggedInUser) return;
        const q = query(collection(db, projectsCollectionPath));
        const unsubscribe = onSnapshot(q, snapshot => {
            setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        }, error => console.error("Error al cargar proyectos:", error));
        return () => unsubscribe();
    }, [db, loggedInUser]);

    const handleSaveProject = async (projectData) => {
        try {
            if (projectToEdit) {
                await updateDoc(doc(db, projectsCollectionPath, projectToEdit.id), projectData);
            } else {
                await addDoc(collection(db, projectsCollectionPath), { ...projectData, ownerId: loggedInUser.uid, teamMembers: [loggedInUser.uid], createdAt: Timestamp.now() });
            }
            closeModal();
        } catch (error) { console.error("Error al guardar proyecto: ", error); }
    };

    const openModalToCreate = () => { setProjectToEdit(null); setIsProjectModalOpen(true); };
    const openModalToEdit = (project) => { setProjectToEdit(project); setIsProjectModalOpen(true); };
    const closeModal = () => { setIsProjectModalOpen(false); setProjectToEdit(null); };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis Proyectos</h1>
                {(loggedInUser.role === 'admin' || loggedInUser.role === 'superuser') && <button onClick={openModalToCreate} className="bg-sky-500 text-white px-4 py-2 rounded-lg shadow hover:bg-sky-600 flex items-center"><Plus className="w-5 h-5 mr-2" /> Nuevo Proyecto</button>}
            </div>
            {isLoading ? <div className="flex justify-center items-center"><Spinner /></div> : projects.length === 0 ? <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><Folder className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay proyectos</h3><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Crea el primer proyecto de investigación.</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{projects.map(project => <div key={project.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col justify-between"><div><h3 className="font-bold text-xl text-sky-600 dark:text-sky-400">{project.name}</h3><p className="text-gray-600 dark:text-gray-300 mt-2">{project.description}</p></div><div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center"><span className="text-xs text-gray-500 dark:text-gray-400">{project.teamMembers?.length || 1} miembro(s)</span><div className="space-x-2 flex items-center">{(loggedInUser.role === 'admin' || loggedInUser.role === 'superuser') && <button onClick={(e) => { e.stopPropagation(); openModalToEdit(project); }} className="p-2 text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Edit className="w-4 h-4"/></button>}<button onClick={() => onSelectProject(project)} className="bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 px-3 py-1 rounded-md text-sm hover:bg-sky-200 dark:hover:bg-sky-800 flex items-center">Abrir Tablero <ExternalLink className="w-4 h-4 ml-2"/></button></div></div></div>)}</div>}
            {isProjectModalOpen && <Modal onClose={closeModal}><ProjectForm onSave={handleSaveProject} onClose={closeModal} projectToEdit={projectToEdit} /></Modal>}
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
    const [selectedProject, setSelectedProject] = useState(null);
    const [team, setTeam] = useState([]);
    const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

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

    if (isLoading) {
        return <div className="w-full h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900"><Spinner /></div>;
    }

    if (!loggedInUser) {
        return <AuthScreen />;
    }
    
    if (loggedInUser.role === 'pending') {
        return (
             <div className="w-full h-screen flex flex-col justify-center items-center bg-gray-100 dark:bg-gray-900 text-center p-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Cuenta Pendiente de Aprobación</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Tu cuenta ha sido registrada. Un administrador necesita asignarte un rol para continuar.</p>
                <button onClick={() => signOut(auth)} className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">Cerrar Sesión</button>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen font-sans">
            <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center">
                <div className="font-bold text-xl text-sky-600 dark:text-sky-400">Gestor de Investigación</div>
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Hola, <span className="font-bold">{loggedInUser.username}</span>!</span>
                    {loggedInUser.role === 'superuser' && (
                        <button onClick={() => setIsUserManagementOpen(true)} title="Gestionar Usuarios" className="p-2 text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Users className="w-5 h-5"/></button>
                    )}
                    <button onClick={() => signOut(auth)} title="Cerrar Sesión" className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><LogOut className="w-5 h-5"/></button>
                </div>
            </header>
            <main className="h-[calc(100vh-68px)]">
                {selectedProject ? <ProjectView project={selectedProject} loggedInUser={loggedInUser} onBack={() => setSelectedProject(null)} db={db} team={team} /> : <Dashboard loggedInUser={loggedInUser} db={db} onSelectProject={setSelectedProject} />}
            </main>
            {isUserManagementOpen && <Modal onClose={() => setIsUserManagementOpen(false)}><UserManagement onClose={() => setIsUserManagementOpen(false)} /></Modal>}
        </div>
    );
}
