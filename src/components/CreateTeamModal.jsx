/*
Modal para crear un nuevo equipo en Synaptic Flow.

@module CreateTeamModal
@component
*/

import React, { useState } from 'react';
import { Users, Plus } from 'lucide-react';

export default function CreateTeamModal({ onSave, onClose }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ name, description });
    };

    const inputStyle = "w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                <Users className="w-6 h-6 mr-3 text-sky-500" />
                Nuevo Equipo
            </h2>
            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Nombre del equipo</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputStyle} placeholder="Ej: Despacho, Laboratorio..." required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputStyle} rows="3" placeholder="Describe el propósito de este equipo..."></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-md bg-sky-500 text-white hover:bg-sky-600 flex items-center"><Plus className="w-4 h-4 mr-2" />Crear Equipo</button>
            </div>
        </form>
    );
}
