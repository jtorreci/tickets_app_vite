import React, { useState, useEffect, useMemo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Edit, Plus, XCircle, Link } from 'lucide-react';

export default function TaskForm({ onSave, onLinkProject, onClose, allTasks, taskToEdit, parentId = null, loggedInUser }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [plannedStartDate, setPlannedStartDate] = useState('');
    const [expirationDate, setExpirationDate] = useState('');
    const [dependencies, setDependencies] = useState([]);
    const [expectedHours, setExpectedHours] = useState('');

    const getAncestors = (taskId, tasksMap) => {
        let ancestors = new Set();
        if (!taskId) return ancestors;
        let current = tasksMap.get(taskId);
        while (current && current.parentId) {
            ancestors.add(current.parentId);
            current = tasksMap.get(current.parentId);
        }
        return ancestors;
    };

    const getDescendants = (taskId, tasks) => {
        let descendants = new Set();
        if (!taskId) return descendants;
        const children = tasks.filter(t => t.parentId === taskId);
        for (const child of children) {
            descendants.add(child.id);
            const childDescendants = getDescendants(child.id, tasks);
            descendants = new Set([...descendants, ...childDescendants]);
        }
        return descendants;
    };
    
    const getSuccessors = (taskId, tasks) => {
        let successors = new Set();
        if (!taskId) return successors;
        const directSuccessors = tasks.filter(t => t.dependencies?.includes(taskId));
        for (const successor of directSuccessors) {
            successors.add(successor.id);
            const indirectSuccessors = getSuccessors(successor.id, tasks);
            successors = new Set([...successors, ...indirectSuccessors]);
        }
        return successors;
    };

    const availableDependencies = useMemo(() => {
        if (!allTasks) return [];
        const tasksMap = new Map(allTasks.map(t => [t.id, t]));
        let invalidIds = new Set();

        if (taskToEdit) {
            const ancestors = getAncestors(taskToEdit.id, tasksMap);
            const descendants = getDescendants(taskToEdit.id, allTasks);
            const successors = getSuccessors(taskToEdit.id, allTasks);
            invalidIds = new Set([taskToEdit.id, ...ancestors, ...descendants, ...successors]);
        }
        
        return allTasks.filter(t => !invalidIds.has(t.id));
    }, [allTasks, taskToEdit]);
    
    const linkableProjects = useMemo(() => {
        return allTasks.filter(t => t.parentId === null && !t.memberIds.includes(loggedInUser.uid));
    }, [allTasks, loggedInUser.uid]);

    const getProjectName = (taskId) => {
        const tasksMap = new Map(allTasks.map(t => [t.id, t]));
        let current = tasksMap.get(taskId);
        if (!current) return 'Proyecto Desconocido';
        while (current.parentId) {
            const parent = tasksMap.get(current.parentId);
            if (!parent) break;
            current = parent;
        }
        return current.title;
    };


    useEffect(() => {
        if (taskToEdit) {
            setTitle(taskToEdit.title);
            setDescription(taskToEdit.description || '');
            setPlannedStartDate(taskToEdit.plannedStartDate ? new Date(taskToEdit.plannedStartDate.seconds * 1000).toISOString().split('T')[0] : '');
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
            plannedStartDate: plannedStartDate ? Timestamp.fromDate(new Date(plannedStartDate)) : null, 
            expirationDate: expirationDate ? Timestamp.fromDate(new Date(expirationDate)) : null, 
            dependencies,
            expectedHours: Number(expectedHours) || 0,
            parentId
        });
    };

    const handleAddDependency = (e) => {
        const depId = e.target.value;
        if (depId && !dependencies.includes(depId)) {
            setDependencies([...dependencies, depId]);
        }
        e.target.value = "";
    };

    const handleRemoveDependency = (depId) => {
        setDependencies(dependencies.filter(id => id !== depId));
    };

    const handleLinkProjectSelect = (e) => {
        const projectIdToLink = e.target.value;
        if (projectIdToLink) {
            onLinkProject({ projectIdToLink, parentId });
        }
    };

    const inputStyle = "w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                <Edit className="w-6 h-6 mr-3 text-sky-500"/>
                {taskToEdit ? 'Editar Tarea' : (parentId ? 'Nueva Subtarea' : 'Nuevo Proyecto')}
            </h2>
            
            {!taskToEdit && (
                <>
                <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Título</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputStyle} required /></div>
                <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Descripción</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputStyle} rows="3"></textarea></div>
                <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Horas Estimadas</label><input type="number" value={expectedHours} onChange={(e) => setExpectedHours(e.target.value)} className={inputStyle} placeholder="Ej: 8" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Fecha de Inicio Prevista</label><input type="date" value={plannedStartDate} onChange={(e) => setPlannedStartDate(e.target.value)} className={inputStyle} /></div>
                    <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Fecha Límite</label><input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className={inputStyle} /></div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-sky-500 text-white hover:bg-sky-600 flex items-center"><Plus className="w-4 h-4 mr-2" />Crear Tarea</button>
                </div>
                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-300 dark:border-gray-600"></span></div>
                    <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-gray-800 text-gray-500">O</span></div>
                </div>
                </>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                    {taskToEdit ? 'Dependencias' : 'Vincular un proyecto existente como subtarea'}
                </label>
                {taskToEdit && (
                    <>
                    <div className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 min-h-[6rem]">
                        {dependencies.length === 0 ? <span className="text-sm text-gray-400">Ninguna dependencia añadida.</span> : (
                            <div className="flex flex-wrap gap-2">
                                {dependencies.map(depId => {
                                    const depTask = allTasks.find(t => t.id === depId);
                                    if (!depTask) return null;
                                    const isCritical = depTask.slack <= 0;
                                    return (
                                        <span key={depId} className={`flex items-center gap-2 px-2 py-1 text-xs rounded-full ${isCritical ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200'}`}>
                                            <span className="font-semibold">[{getProjectName(depId)}]</span>
                                            {depTask.title}
                                            <button type="button" onClick={() => handleRemoveDependency(depId)} className="hover:text-red-500"><XCircle className="w-4 h-4" /></button>
                                        </span>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                    <select onChange={handleAddDependency} value="" className={`${inputStyle} mt-2`}>
                        <option value="" disabled>Añadir una dependencia...</option>
                        {availableDependencies.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}
                    </select>
                    </>
                )}
                {!taskToEdit && (
                     <select onChange={handleLinkProjectSelect} value="" className={`${inputStyle}`}>
                        <option value="" disabled>Seleccionar un proyecto para vincular...</option>
                        {linkableProjects.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}
                    </select>
                )}
            </div>
            {taskToEdit && (
                 <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-sky-500 text-white hover:bg-sky-600 flex items-center"><Plus className="w-4 h-4 mr-2" />Guardar Cambios</button>
                </div>
            )}
        </form>
    );
};
