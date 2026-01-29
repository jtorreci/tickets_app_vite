"""
Gestión de equipo para Synaptic Flow.

Permite invitar miembros, asignar roles y gestionar
el equipo de un proyecto.

@module TeamManagement
@component
"""

import React, { useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Users, XCircle } from 'lucide-react';
import Spinner from './Spinner';

/**
 * Panel de gestión de equipo de un proyecto.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.project - Proyecto a gestionar.
 * @param {Array} props.allUsers - Todos los usuarios del sistema.
 * @param {Object} props.db - Instancia de Firestore.
 * @param {string} props.tasksCollectionPath - Ruta de tareas.
 * @param {Object} props.loggedInUser - Usuario autenticado.
 * @param {Function} props.onClose - Función para cerrar.
 * @returns {JSX.Element} Panel de gestión de equipo.
 */
export default function TeamManagement({ project, allUsers, db, tasksCollectionPath, loggedInUser, onClose }) {
    const [inviteEmail, setInviteEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleInvite = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const q = query(collection(db, "team_members"), where("email", "==", inviteEmail));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                setError("No se ha encontrado ningún usuario con ese email.");
                setIsLoading(false);
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const userId = userDoc.id;

            if (project.memberIds.includes(userId)) {
                 setError("Este usuario ya es miembro del proyecto.");
                 setIsLoading(false);
                 return;
            }

            const projectRef = doc(db, tasksCollectionPath, project.id);
            await updateDoc(projectRef, {
                team: arrayUnion({ userId: userId, role: 'member' }),
                memberIds: arrayUnion(userId)
            });
            setInviteEmail('');

        } catch (err) {
            setError("Error al invitar al usuario.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRemove = async (userId) => {
        const userToRemove = project.team.find(m => m.userId === userId);
        if (!userToRemove) return;

        const projectRef = doc(db, tasksCollectionPath, project.id);
        await updateDoc(projectRef, {
            team: arrayRemove(userToRemove),
            memberIds: arrayRemove(userId)
        });
    };

    const handleRoleChange = async (userId, newRole) => {
        const newTeam = project.team.map(member => 
            member.userId === userId ? { ...member, role: newRole } : member
        );
        const projectRef = doc(db, tasksCollectionPath, project.id);
        await updateDoc(projectRef, { team: newTeam });
    };

    const projectOwnerId = project.team.find(m => m.role === 'admin')?.userId;

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center"><Users className="mr-3"/>Gestionar Equipo de "{project.title}"</h2>
            
            <div className="space-y-3 mb-6">
                {project.team.map(member => {
                    const userProfile = allUsers.find(u => u.id === member.userId);
                    const isOwner = member.userId === projectOwnerId;
                    return (
                        <div key={member.userId} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                            <div>
                                <p className="font-semibold">{userProfile?.username || 'Usuario desconocido'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{userProfile?.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <select 
                                    value={member.role} 
                                    onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                                    className="p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                    disabled={isOwner}
                                >
                                    <option value="member">Miembro</option>
                                    <option value="admin">Admin</option>
                                </select>
                                {!isOwner && (
                                    <button onClick={() => handleRemove(member.userId)} title="Eliminar del equipo" className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-300 rounded-full hover:bg-red-100 dark:hover:bg-gray-600">
                                        <XCircle className="w-4 h-4"/>
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <form onSubmit={handleInvite} className="space-y-4 border-t pt-6 border-gray-300 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Invitar a un miembro</h3>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Email del usuario</label>
                    <div className="flex gap-2">
                        <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition" required />
                        <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-md bg-sky-500 text-white hover:bg-sky-600 disabled:bg-sky-300">
                            {isLoading ? <Spinner /> : "Invitar"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};
