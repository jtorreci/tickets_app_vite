import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Users } from 'lucide-react';
import Spinner from './Spinner';

export default function UserManagement({ db, teamCollectionPath }) {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, teamCollectionPath));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [db, teamCollectionPath]);

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
