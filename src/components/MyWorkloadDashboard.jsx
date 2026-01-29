/*
Dashboard de carga de trabajo personal para Synaptic Flow.

Muestra las tareas asignadas al usuario con sus horas
estimadas y permite gestión rápida.

@module MyWorkloadDashboard
@component
/*

import React, { useMemo, useState } from 'react';
import { Clock, AlertCircle, ChevronRight, Edit, Check, ArrowRight, Undo2, RotateCcw, ChevronDown } from 'lucide-react';

/**
 * Item de tarea en el dashboard de carga de trabajo.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.task - Tarea a mostrar.
 * @param {Array} props.allTasks - Todas las tareas.
 * @param {Function} props.getAggregatedHours - Función para calcular horas.
 * @param {number} props.level - Nivel de anidamiento.
 * @param {Function} props.onNavigate - Función de navegación.
 * @param {Function} props.onTake - Función para tomar tarea.
 * @param {Function} props.onComplete - Función para completar.
 * @param {Function} props.onRevert - Función para revertir.
 * @param {Function} props.onEdit - Función para editar.
 * @param {Object} props.loggedInUser - Usuario autenticado.
 * @param {Array} props.team - Lista de miembros.
 * @returns {JSX.Element} Item de tarea.
 */
const WorkloadTaskItem = ({ task, allTasks, getAggregatedHours, level = 0, onNavigate, onTake, onComplete, onRevert, onEdit, loggedInUser, team }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const children = useMemo(() => allTasks.filter(t => t.parentId === task.id && t.assigneeId === loggedInUser.uid), [allTasks, task.id, loggedInUser.uid]);
    const aggregatedHours = useMemo(() => getAggregatedHours(task.id, allTasks), [task.id, allTasks, getAggregatedHours]);
    const hasChildren = children.length > 0;
    
    const formatDate = (timestamp) => timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString() : 'N/A';
    const isAdmin = loggedInUser.role === 'admin' || loggedInUser.role === 'superuser';

    const findTaskBreadcrumbs = (taskId, tasks) => {
        const tasksMap = new Map(tasks.map(t => [t.id, t]));
        let crumbs = [];
        let current = tasksMap.get(taskId);
        while (current) {
            crumbs.unshift(current);
            current = tasksMap.get(current.parentId);
        }
        return crumbs;
    };

    const breadcrumbs = useMemo(() => findTaskBreadcrumbs(task.id, allTasks), [task.id, allTasks]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700" style={{ marginLeft: `${level * 1}rem` }}>
            <div className="p-3 flex items-center">
                <div className="flex-grow">
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2 flex-wrap">
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={crumb.id}>
                                {index > 0 && <ChevronRight className="w-4 h-4 mx-1 flex-shrink-0" />}
                                <button onClick={() => onNavigate(crumb)} className="hover:underline hover:text-sky-500 text-left">
                                    {crumb.title}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">{task.title}</p>
                    <div className="mt-2 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                        <span className={`px-2 py-1 rounded-full text-white ${task.status === 'inProgress' ? 'bg-sky-500' : 'bg-gray-400'}`}>
                            {task.status === 'inProgress' ? 'En Progreso' : 'Pendiente'}
                        </span>
                        <div className="flex gap-4">
                            <span className="flex items-center" title="Horas totales (incluye subtareas)"><Clock className="w-4 h-4 mr-1"/> {aggregatedHours.toFixed(1)}h</span>
                            <span className="flex items-center"><AlertCircle className="w-4 h-4 mr-1 text-red-500"/> Límite: {formatDate(task.expirationDate)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-2 pl-4">
                    <button onClick={() => onEdit(task)} title="Editar Tarea" className="p-2 text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Edit className="w-4 h-4" /></button>
                    {isAdmin && task.status === 'inProgress' && <button onClick={() => onRevert(task.id, 'inProgress')} title="Devolver a Pendiente" className="p-2 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200 rounded-full hover:bg-yellow-100 dark:hover:bg-gray-700"><Undo2 className="w-4 h-4" /></button>}
                    {isAdmin && task.status === 'done' && <button onClick={() => onRevert(task.id, 'done')} title="Reabrir Tarea" className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 rounded-full hover:bg-red-100 dark:hover:bg-gray-700"><RotateCcw className="w-4 h-4" /></button>}
                    {task.status === 'todo' && <button onClick={() => onTake(task.id)} title="Coger Tarea" className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 rounded-full hover:bg-green-100 dark:hover:bg-gray-700"><ArrowRight className="w-4 h-4" /></button>}
                    {task.status === 'inProgress' && <button onClick={() => onComplete(task)} title="Completar Tarea" className="p-2 text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-200 rounded-full hover:bg-sky-100 dark:hover:bg-gray-700"><Check className="w-4 h-4" /></button>}
                </div>
            </div>
            {hasChildren && (
                <div>
                    <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-xs text-gray-500 dark:text-gray-400 py-1 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center rounded-b-lg">
                        <ChevronDown className={`w-4 h-4 mr-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        {isExpanded ? 'Ocultar' : 'Mostrar'} {children.length} subtarea(s)
                    </button>
                    {isExpanded && (
                        <div className="p-2 space-y-2">
                            {children.map(child => (
                                <WorkloadTaskItem 
                                    key={child.id} task={child} allTasks={allTasks} getAggregatedHours={getAggregatedHours}
                                    level={0} onNavigate={onNavigate} onTake={onTake} onComplete={onComplete}
                                    onRevert={onRevert} onEdit={onEdit} loggedInUser={loggedInUser} team={team}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


/**
 * Dashboard de carga de trabajo personal.
 * Muestra todas las tareas asignadas al usuario con horas acumuladas.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {Array} props.allTasks - Todas las tareas del sistema.
 * @param {Object} props.loggedInUser - Usuario autenticado.
 * @param {Function} props.getAggregatedHours - Función para calcular horas.
 * @param {Function} props.onNavigate - Función de navegación.
 * @param {Function} props.onTake - Función para tomar tarea.
 * @param {Function} props.onComplete - Función para completar.
 * @param {Function} props.onRevert - Función para revertir.
 * @param {Function} props.onEdit - Función para editar.
 * @param {Array} props.team - Lista de miembros.
 * @returns {JSX.Element} Dashboard de carga de trabajo.
 */
export default function MyWorkloadDashboard({ allTasks, loggedInUser, getAggregatedHours, onNavigate, onTake, onComplete, onRevert, onEdit, team }) {
    
    const myTasks = useMemo(() => {
        return allTasks.filter(task => task.assigneeId === loggedInUser.uid && task.status !== 'done');
    }, [allTasks, loggedInUser.uid]);

    const rootMyTasks = useMemo(() => {
        const myTaskIds = new Set(myTasks.map(t => t.id));
        return myTasks.filter(task => !task.parentId || !myTaskIds.has(task.parentId));
    }, [myTasks]);

    const totalHours = useMemo(() => {
        return rootMyTasks.reduce((sum, task) => sum + getAggregatedHours(task.id, allTasks), 0);
    }, [rootMyTasks, allTasks, getAggregatedHours]);
    
    return (
        <div className="max-w-5xl mx-auto">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Carga de Trabajo</h2>
                <p className="text-gray-600 dark:text-gray-400">Total de horas estimadas (pendientes y en progreso): <span className="font-bold text-sky-600 dark:text-sky-400 text-lg">{totalHours.toFixed(1)}h</span></p>
            </div>

            <div className="space-y-2">
                {rootMyTasks.length === 0 && (
                    <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                        <p>No tienes tareas asignadas.</p>
                    </div>
                )}
                {rootMyTasks.map(task => (
                    <WorkloadTaskItem 
                        key={task.id} task={task} allTasks={allTasks} getAggregatedHours={getAggregatedHours}
                        onNavigate={onNavigate} onTake={onTake} onComplete={onComplete} onRevert={onRevert}
                        onEdit={onEdit} loggedInUser={loggedInUser} team={team}
                    />
                ))}
            </div>
        </div>
    );
}
