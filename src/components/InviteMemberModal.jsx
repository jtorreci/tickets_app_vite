/*
Modal para invitar miembros a un equipo en Synaptic Flow.

@module InviteMemberModal
@component
*/

import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import Spinner from './Spinner';

export default function InviteMemberModal({ teamName, onInvite, onClose }) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState({ type: null, message: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: null, message: '' });
        setIsLoading(true);
        try {
            await onInvite(email);
            setStatus({ type: 'success', message: 'Invitación enviada correctamente.' });
            setEmail('');
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle = "w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                <Mail className="w-6 h-6 mr-3 text-sky-500" />
                Invitar a "{teamName}"
            </h2>
            {status.message && (
                <p className={`text-sm ${status.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>{status.message}</p>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Email del usuario</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyle} placeholder="usuario@ejemplo.com" required />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">El usuario debe estar registrado en Synaptic Flow. Recibirá una invitación que podrá aceptar o rechazar.</p>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-md bg-sky-500 text-white hover:bg-sky-600 disabled:bg-sky-300 flex items-center">
                    {isLoading ? <Spinner /> : <><Mail className="w-4 h-4 mr-2" />Enviar Invitación</>}
                </button>
            </div>
        </form>
    );
}
