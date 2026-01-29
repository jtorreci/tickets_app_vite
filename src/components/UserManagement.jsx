/*
Gestión de usuarios para Synaptic Flow.

Panel de administración para gestionar roles de usuarios
y restaurar tareas eliminadas.

@module UserManagement
@component
/*

import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { Users, Trash2, RotateCcw } from 'lucide-react';
import Spinner from './Spinner';

/**
 * Panel de administración de usuarios.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.db - Instancia de Firestore.
 * @param {string} props.teamCollectionPath - Ruta de miembros.
 * @param {string} props.tasksCollectionPath - Ruta de tareas.
 * @param {Function} props.onRestoreTask - Función para restaurar tarea.
 * @returns {JSX.Element} Panel de gestión de usuarios.
 */
export default function UserManagement({ db, teamCollectionPath, tasksCollectionPath, onRestoreTask }) {
    const [users, setUsers] = useState([]);
    const [deletedTasks, setDeletedTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const qUsers = query(collection(db, teamCollectionPath));
        const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        });

        const qTasks = query(collection(db, tasksCollectionPath), where("deleted", "==", true));
        const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
            setDeletedTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribeUsers();
            unsubscribeTasks();
        };
    }, [db, teamCollectionPath, tasksCollectionPath]);

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
            <div className="mt-8 border-t pt-6 border-gray-300 dark:border-gray-600">
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center"><Trash2 className="mr-3"/>Papelera de Tareas</h2>
                 {deletedTasks.length === 0 ? (
                     <p className="text-gray-500 dark:text-gray-400">No hay tareas borradas.</p>
                 ) : (
                     <div className="space-y-3">
                         {deletedTasks.map(task => (
                             <div key={task.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                 <p className="font-semibold">{task.title}</p>
                                 <button onClick={() => onRestoreTask(task.id)} title="Restaurar Tarea" className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 rounded-full hover:bg-green-100 dark:hover:bg-gray-700">
                                     <RotateCcw className="w-4 h-4" />
                                 </button>
                             </div>
                         ))}
                     </div>
                 )}
            </div>
        </div>
    );
};
