/*
Formulario de creación y edición de tareas para Synaptic Flow.

Permite crear proyectos, subtareas, establecer dependencias
y vincular proyectos existentes.

@module TaskForm
@component
*/

import React, { useState, useEffect, useMemo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Edit, Plus, XCircle, User, Save, Link, Trash2, ExternalLink } from 'lucide-react';

/**
 * Formulario para crear o editar tareas/proyectos.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {Function} props.onSave - Función para guardar la tarea.
 * @param {Function} props.onLinkProject - Función para vincular proyecto.
 * @param {Function} props.onClose - Función para cerrar el modal.
 * @param {Array} props.allTasks - Lista de todas las tareas.
 * @param {Object} props.taskToEdit - Tarea a editar (null para nueva).
 * @param {string} props.parentId - ID del padre (para subtareas, 'inbox' para bandeja de entrada).
 * @param {Object} props.loggedInUser - Usuario autenticado.
 * @param {Array} props.team - Lista de todos los usuarios.
 * @returns {JSX.Element} Formulario de tarea.
 */
export default function TaskForm({ onSave, onLinkProject, onClose, allTasks, taskToEdit, parentId = null, loggedInUser, team }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');
    const [links, setLinks] = useState([]);
    const [newLink, setNewLink] = useState({ title: '', url: '' });
    const [plannedStartDate, setPlannedStartDate] = useState('');
    const [expirationDate, setExpirationDate] = useState('');
    const [dependencies, setDependencies] = useState([]);
    const [expectedHours, setExpectedHours] = useState('');
    const [isProject, setIsProject] = useState(true);
    const [linkedProjectId, setLinkedProjectId] = useState('');
    const [assigneeId, setAssigneeId] = useState('');

    const isEditing = !!taskToEdit;
    const isNewProject = !isEditing && !parentId && parentId !== 'inbox';
    const isInbox = !isEditing && parentId === 'inbox';

    const parentTask = useMemo(() => {
        if (!parentId || parentId === 'inbox') return null;
        return allTasks.find(t => t.id === parentId);
    }, [parentId, allTasks]);

    const availableCollaborators = useMemo(() => {
        if (!parentTask) return [];
        return parentTask.memberIds?.map(userId => {
            const user = team?.find(u => u.id === userId);
            return { id: userId, username: user?.username || 'Usuario desconocido', email: user?.email };
        }) || [];
    }, [parentTask, team]);

    const availableTeamMembers = useMemo(() => {
        return team?.map(user => ({
            id: user.id,
            username: user.username || 'Usuario desconocido',
            email: user.email
        })) || [];
    }, [team]);

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
    
    const getSuccessors = (taskId, tasks, visited = new Set()) => {
        if (!taskId || visited.has(taskId)) return new Set();
        visited.add(taskId);

        let successors = new Set();
        const directSuccessors = tasks.filter(t => t.dependencies?.includes(taskId));
        for (const successor of directSuccessors) {
            successors.add(successor.id);
            const indirectSuccessors = getSuccessors(successor.id, tasks, visited);
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
        } else {
             const ancestors = getAncestors(parentId, tasksMap);
             invalidIds = new Set([...ancestors]);
        }
        
        return allTasks.filter(t => !invalidIds.has(t.id));
    }, [allTasks, taskToEdit, parentId]);
    
    const linkableProjects = useMemo(() => {
        return allTasks.filter(t => t.isProject);
    }, [allTasks]);

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
            setTitle(taskToEdit.title || '');
            setDescription(taskToEdit.description || '');
            setNotes(taskToEdit.notes || '');
            setLinks(taskToEdit.links || []);
            setPlannedStartDate(taskToEdit.plannedStartDate ? new Date(taskToEdit.plannedStartDate.seconds * 1000).toISOString().split('T')[0] : '');
            setExpirationDate(taskToEdit.expirationDate ? new Date(taskToEdit.expirationDate.seconds * 1000).toISOString().split('T')[0] : '');
            setDependencies(taskToEdit.dependencies || []);
            setExpectedHours(taskToEdit.expectedHours ? String(taskToEdit.expectedHours) : '');
            setIsProject(taskToEdit.isProject || false);
            setAssigneeId(taskToEdit.assigneeId || '');
        }
    }, [taskToEdit]);

    const handleAddLink = () => {
        if (newLink.title && newLink.url) {
            setLinks([...links, { ...newLink, id: Date.now().toString() }]);
            setNewLink({ title: '', url: '' });
        }
    };

    const handleRemoveLink = (linkId) => {
        setLinks(links.filter(l => l.id !== linkId));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ 
            title, 
            description, 
            notes,
            links,
            plannedDate: plannedStartDate ? Timestamp.fromDate(new Date(plannedStartDate)) : null, 
            expirationDate: expirationDate ? Timestamp.fromDate(new Date(expirationDate)) : null, 
            dependencies,
            expectedHours: Number(expectedHours) || 0,
            parentId: parentId === 'inbox' ? null : parentId,
            isProject: isInbox ? false : (parentId === null ? isProject : false),
            assigneeId: assigneeId || null
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
        setLinkedProjectId(projectIdToLink);
        if (projectIdToLink) {
            onLinkProject({ projectIdToLink, parentId });
        }
    };

    const inputStyle = "w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition";

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center sticky top-0 bg-white dark:bg-gray-800 pb-4 border-b border-gray-200 dark:border-gray-700 z-10">
                <Edit className="w-6 h-6 mr-3 text-sky-500"/>
                {isEditing ? 'Editar Tarea/Proyecto' : (isInbox ? 'Nueva Tarea' : parentId ? 'Nueva Subtarea' : 'Nuevo Proyecto')}
            </h2>
            
            {/* Campos principales - visibles siempre */}
            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Título</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputStyle} required />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputStyle} rows="2"></textarea>
            </div>

            {/* Campo de Notas */}
            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 flex items-center">
                    <Edit className="w-4 h-4 mr-2" />
                    Notas
                </label>
                <textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    className={inputStyle} 
                    rows="4" 
                    placeholder="Añade notas, observaciones, o información adicional..."
                ></textarea>
            </div>

            {/* Campo de Enlaces */}
            <div className="border-t pt-4 border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center">
                    <Link className="w-4 h-4 mr-2" />
                    Enlaces y Recursos
                </label>
                
                {/* Lista de enlaces */}
                {links.length > 0 && (
                    <div className="space-y-2 mb-4">
                        {links.map(link => (
                            <div key={link.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-sky-600 dark:text-sky-400 flex items-center">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    {link.title}
                                </a>
                                <button onClick={() => handleRemoveLink(link.id)} className="text-gray-400 hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Añadir nuevo enlace */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input 
                        type="text" 
                        value={newLink.title} 
                        onChange={(e) => setNewLink({ ...newLink, title: e.target.value })} 
                        className={inputStyle} 
                        placeholder="Título del enlace"
                    />
                    <div className="flex gap-2">
                        <input 
                            type="url" 
                            value={newLink.url} 
                            onChange={(e) => setNewLink({ ...newLink, url: e.target.value })} 
                            className={inputStyle} 
                            placeholder="https://..."
                        />
                        <button 
                            type="button" 
                            onClick={handleAddLink}
                            disabled={!newLink.title || !newLink.url}
                            className="px-3 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Solo para nuevos proyectos (no subtareas ni inbox) */}
            {!isEditing && !parentId && (
                <div className="flex items-center">
                    <input id="isProject" type="checkbox" checked={isProject} onChange={(e) => setIsProject(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                    <label htmlFor="isProject" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Marcar como Proyecto</label>
                </div>
            )}
            
            {/* Selector de asignatario - visible siempre */}
            {availableTeamMembers.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Asignar a usuario
                    </label>
                    <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={inputStyle}>
                        <option value="">Sin asignar</option>
                        {availableTeamMembers.map(user => (
                            <option key={user.id} value={user.id}>{user.username} ({user.email})</option>
                        ))}
                    </select>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Horas Estimadas</label>
                <input type="number" value={expectedHours} onChange={(e) => setExpectedHours(e.target.value)} className={inputStyle} placeholder="Ej: 8" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Fecha de Inicio Prevista</label>
                    <input type="date" value={plannedStartDate} onChange={(e) => setPlannedStartDate(e.target.value)} className={inputStyle} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Fecha Límite</label>
                    <input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className={inputStyle} />
                </div>
            </div>

            {/* Sección de dependencias - visible siempre */}
            <div className="border-t pt-4 border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                    {isEditing ? 'Dependencias' : 'Vincular un proyecto existente como subtarea'}
                </label>
                
                <div className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 min-h-[6rem] mb-2">
                    {dependencies.length === 0 ? (
                        <span className="text-sm text-gray-400">Ninguna dependencia añadida.</span>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {dependencies.map(depId => {
                                const depTask = allTasks.find(t => t.id === depId);
                                if (!depTask) return null;
                                const isCritical = depTask.slack <= 0;
                                return (
                                    <span key={depId} className={`flex items-center gap-2 px-2 py-1 text-xs rounded-full ${isCritical ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200'}`}>
                                        <span className="font-semibold">[{getProjectName(depId)}]</span>
                                        {depTask.title}
                                        {isEditing && <button type="button" onClick={() => handleRemoveDependency(depId)} className="hover:text-red-500"><XCircle className="w-4 h-4" /></button>}
                                    </span>
                                )
                            })}
                        </div>
                    )}
                </div>

                {isEditing ? (
                    <select onChange={handleAddDependency} value="" className={inputStyle}>
                        <option value="" disabled>Añadir una dependencia...</option>
                        {availableDependencies.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}
                    </select>
                ) : (
                    <select onChange={handleLinkProjectSelect} value={linkedProjectId} className={inputStyle}>
                        <option value="" disabled>Seleccionar un proyecto para vincular...</option>
                        {linkableProjects.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}
                    </select>
                )}
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-md bg-sky-500 text-white hover:bg-sky-600 flex items-center">
                    {isEditing ? <><Save className="w-4 h-4 mr-2" />Guardar Cambios</> : <><Plus className="w-4 h-4 mr-2" />Crear</>}
                </button>
            </div>
        </form>
    );
};
