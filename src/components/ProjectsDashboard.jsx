"""
Dashboard de proyectos para Synaptic Flow.

Muestra tarjetas de todos los proyectos con métricas
de progreso, horas y estado.

@module ProjectsDashboard
@component
"""

import React, { useMemo } from 'react';
import { Edit, ExternalLink, Clock, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';

/**
 * Dashboard que muestra tarjetas de proyectos.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {Array} props.allTasks - Lista de todas las tareas.
 * @param {Function} props.onNavigate - Función de navegación.
 * @param {Function} props.onEdit - Función para editar proyecto.
 * @param {Function} props.onDelete - Función para borrar proyecto.
 * @param {Object} props.loggedInUser - Usuario autenticado.
 * @returns {JSX.Element} Grid de proyectos.
 */
export default function ProjectsDashboard({ allTasks, onNavigate, onEdit, onDelete, loggedInUser }) {
    
    const projects = useMemo(() => {
        const activeTasks = allTasks.filter(task => !task.deleted);
        const rootTasks = activeTasks.filter(task => task.parentId === null);
        
        return rootTasks.map(project => {
            const children = activeTasks.filter(task => task.parentId === project.id);
            let status = 'planned';
            let totalExpected = project.expectedHours || 0;
            let totalActual = project.actualHours || 0;
            let completedCount = 0;

            if (children.length > 0) {
                const doneChildren = children.filter(c => c.status === 'done');
                const inProgressChildren = children.filter(c => c.status === 'inProgress');
                
                completedCount = doneChildren.length;
                totalExpected += children.reduce((sum, child) => sum + (child.expectedHours || 0), 0);
                totalActual += children.reduce((sum, child) => sum + (child.actualHours || 0), 0);

                if (doneChildren.length === children.length && children.length > 0) {
                    status = 'finished';
                } else if (doneChildren.length > 0 || inProgressChildren.length > 0) {
                    status = 'inProgress';
                }
            } else {
                 if (project.status === 'done') {
                    status = 'finished';
                    completedCount = 1;
                 }
                 if (project.status === 'inProgress') status = 'inProgress';
            }

            const deviation = totalActual - totalExpected;
            const hasChildren = children.length > 0;
            const progress = (children.length + 1) > 1 ? (completedCount / (children.length + (project.status === 'done' ? 0 : 1))) * 100 : (project.status === 'done' ? 100 : 0);


            return { ...project, status, totalExpected, totalActual, deviation, hasChildren, progress };
        });

    }, [allTasks]);

    const statusStyles = {
        planned: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600',
        inProgress: 'bg-sky-50 dark:bg-sky-900/50 border-sky-300 dark:border-sky-700',
        finished: 'bg-green-50 dark:bg-green-900/50 border-green-300 dark:border-green-700',
    };
    
    const isAdmin = loggedInUser.role === 'admin' || loggedInUser.role === 'superuser';
    const formatDate = (timestamp) => timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString() : 'N/A';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.length === 0 && (
                <div className="col-span-full text-center py-16 text-gray-500 dark:text-gray-400">
                    <p>No hay proyectos creados.</p>
                    <p>Usa el botón "+ Nuevo Proyecto" para empezar.</p>
                </div>
            )}
            {projects.map(project => (
                <div key={project.id} className={`p-4 rounded-lg shadow-md border ${statusStyles[project.status]} flex flex-col`}>
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white">{project.title}</h3>
                        <div className="flex items-center space-x-2">
                            {isAdmin && (
                                <>
                                <button onClick={() => onEdit(project)} className="p-2 text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                    <Edit className="w-4 h-4"/>
                                </button>
                                <button onClick={() => onDelete(project.id)} disabled={project.hasChildren} title={project.hasChildren ? "No se puede borrar, tiene subtareas" : "Borrar proyecto"} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                                </>
                            )}
                            <button onClick={() => onNavigate(project)} className="bg-sky-100 dark:bg-sky-800 text-sky-700 dark:text-sky-200 px-3 py-1 rounded-md text-sm hover:bg-sky-200 dark:hover:bg-sky-700 flex items-center">
                                Abrir <ExternalLink className="w-4 h-4 ml-2"/>
                            </button>
                        </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm flex-grow">{project.description}</p>
                    
                    <div className="mt-4 space-y-3">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div className="bg-sky-600 h-2.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Inicio: {formatDate(project.plannedStartDate)}</span>
                            <span>Límite: {formatDate(project.expirationDate)}</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-300 dark:border-gray-600 flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center"><Clock className="w-4 h-4 mr-2" /> {project.totalActual.toFixed(1)}h / {project.totalExpected.toFixed(1)}h</div>
                        {project.status === 'finished' && (
                             <div className={`flex items-center font-semibold ${project.deviation > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {project.deviation > 0 ? <TrendingUp className="w-4 h-4 mr-2"/> : <TrendingDown className="w-4 h-4 mr-2"/>}
                                {project.deviation.toFixed(1)}h
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
