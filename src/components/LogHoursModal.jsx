/*
Modal de registro de horas para Synaptic Flow.

Permite registrar las horas reales dedicadas al completar una tarea.

@module LogHoursModal
@component
*/

import React, { useState } from 'react';
import { Check } from 'lucide-react';

/**
 * Modal para registrar horas al completar una tarea.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {Function} props.onSave - Función para guardar horas.
 * @param {Function} props.onCancel - Función para cancelar.
 * @param {Object} props.task - Tarea a completar.
 * @returns {JSX.Element} Modal de registro de horas.
 */
export default function LogHoursModal({ onSave, onCancel, task }) {
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
