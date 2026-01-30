/*
Pantalla de autenticación para Synaptic Flow.

Maneja el inicio de sesión y registro de usuarios mediante Firebase Auth.
Los nuevos usuarios se crean con rol 'pending' esperando aprobación.

@module AuthScreen
@component
*/

import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import Spinner from './Spinner';

export default function AuthScreen({ db, auth, teamCollectionPath }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleEmailAuth = async (e) => {
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
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setIsLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            const userDocRef = doc(db, teamCollectionPath, user.uid);
            const docSnap = await getDoc(userDocRef);
            
            if (!docSnap.exists()) {
                await setDoc(userDocRef, {
                    username: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    role: 'pending'
                });
            }
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-screen flex justify-center items-center bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-sm p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
                <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
                    {isLogin ? 'Iniciar Sesión' : 'Registrar Cuenta'}
                </h1>
                
                <button 
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full py-2 px-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 font-semibold flex justify-center items-center mb-4"
                >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continuar con Google
                </button>

                <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">o</span>
                    </div>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
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
