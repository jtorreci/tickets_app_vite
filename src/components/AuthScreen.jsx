import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import Spinner from './Spinner';

export default function AuthScreen({ db, auth, teamCollectionPath }) {
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
