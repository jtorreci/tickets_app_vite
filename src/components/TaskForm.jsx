import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Edit, Plus } from 'lucide-react';

export default function TaskForm({ onSave, onClose, existingTasks, taskToEdit, parentId = null }) {
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
