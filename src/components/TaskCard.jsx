"""
Tarjeta de tarea para Synaptic Flow.

Muestra información detallada de una tarea incluyendo:
- Título y descripción
- Fechas y horas estimadas/reales
- Estado de bloqueo por dependencias
- Asignatario y acciones disponibles

@module TaskCard
@component
"""

import React, { useMemo } from 'react';
import { Clock, Calendar, Lock, Unlock, ArrowRight, Check, User, RotateCcw, Undo2, AlertCircle, TrendingUp, TrendingDown, ExternalLink, Trash2, Hourglass, Link } from 'lucide-react';

/**
 * Tarjeta de tarea para el tablero Kanban.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.task - Objeto tarea a mostrar.
 * @param {Function} props.onTake - Función para tomar la tarea.
 * @param {Function} props.onComplete - Función para completar.
 * @param {Function} props.onRevert - Función para revertir.
 * @param {Function} props.onEdit - Función para editar.
 * @param {Function} props.onNavigate - Función para navegar a subtareas.
 * @param {Function} props.onAssign - Función para asignar.
 * @param {Function} props.onDelete - Función para borrar.
 * @param {boolean} props.isLocked - Si la tarea está bloqueada.
 * @param {Object} props.loggedInUser - Usuario autenticado.
 * @param {Array} props.team - Lista de miembros.
 * @param {Array} props.allTasks - Todas las tareas.
 * @returns {JSX.Element} Tarjeta de tarea.
 */
export default function TaskCard({ task, onTake, onComplete, onRevert, onEdit, onNavigate, onAssign, onDelete, isLocked, loggedInUser, team, allTasks }) {
    const assignee = task.assigneeId ? team.find(m => m.id === task.assigneeId) : null;
    const assigneeName = assignee ? assignee.username : 'Sin asignar';
    const deviation = task.status === 'done' ? (task.actualHours || 0) - (task.expectedHours || 0) : null;
    const hasChildren = useMemo(() => allTasks.some(t => t.parentId === task.id), [allTasks, task.id]);

    const formatDate = (timestamp) => timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString() : 'N/A';

    const handleAssign = (e) => {
        const userId = e.target.value;
        if (userId) onAssign(task.id, userId);
    };

    const isAdmin = loggedInUser.role === 'admin' || loggedInUser.role === 'superuser';
    
    const cardBorderColor = () => {
        if (task.taskType === 'linkingRequest') return 'border-purple-500';
        if (isLocked) return 'border-red-500 opacity-60';
        if (task.slack <= 0 && task.status !== 'done') return 'border-orange-500';
        return 'border-sky-500';
    };

    return (
        <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 ${cardBorderColor()} transition-shadow hover:shadow-lg`}>
            <div onClick={() => onEdit(task)} className="cursor-pointer">
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white flex items-center">
                        {task.taskType === 'linkingRequest' && <Link className="w-4 h-4 mr-2 text-purple-500"/>}
                        {task.taskType === 'linkedProject' && <Link className="w-4 h-4 mr-2 text-gray-500"/>}
                        {task.title}
                    </h4>
                    {isLocked ? <Lock className="w-5 h-5 text-red-500" /> : task.status === 'todo' && <Unlock className="w-5 h-5 text-green-500" />}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">{task.description}</p>
                
                {task.taskType !== 'linkedProject' && (
                    <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className="grid grid-cols-2 gap-2">
                            <span><strong>Inicio Temprano:</strong> {formatDate(task.earliestStartDate)}</span>
                            <span><strong>Fin Tardío:</strong> {formatDate(task.latestFinishDate)}</span>
                        </div>
                        {task.slack !== undefined && (
                            <div className={`flex items-center font-semibold ${task.slack <= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                <Hourglass className="w-4 h-4 mr-2"/>
                                Holgura: {task.slack} día(s)
                            </div>
                        )}
                        <div className="flex items-center pt-2 border-t border-gray-200 dark:border-gray-700"><Clock className="w-4 h-4 mr-2" /> 
                            Estimadas: {task.expectedHours || 0}h
                            {task.status === 'done' && `, Reales: ${task.actualHours || 0}h`}
                        </div>
                        {deviation !== null && (
                            <div className={`flex items-center font-semibold ${deviation > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {deviation > 0 ? <TrendingUp className="w-4 h-4 mr-2"/> : <TrendingDown className="w-4 h-4 mr-2"/>}
                                Desviación: {deviation.toFixed(1)}h
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center text-sm">
                    <User className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                    {!task.assigneeId && task.status === 'todo' && isAdmin ? (
                        <select onChange={handleAssign} defaultValue="" className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md text-xs p-1">
                            <option value="" disabled>Asignar a...</option>
                            {team.map(member => <option key={member.id} value={member.id}>{member.username}</option>)}
                        </select>
                    ) : (
                        <span className="text-gray-700 dark:text-gray-300">{assigneeName}</span>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => onNavigate(task)} title="Abrir tablero de subtareas" className="p-2 text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <ExternalLink className="w-4 h-4" />
                    </button>
                    {isAdmin && <button onClick={() => onDelete(task.id)} disabled={hasChildren} title={hasChildren ? "No se puede borrar, tiene subtareas" : "Borrar tarea"} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"><Trash2 className="w-4 h-4" /></button>}
                    {isAdmin && task.status === 'inProgress' && <button onClick={() => onRevert(task.id, 'inProgress')} title="Devolver a Pendiente" className="p-2 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200 rounded-full hover:bg-yellow-100 dark:hover:bg-gray-700"><Undo2 className="w-4 h-4" /></button>}
                    {isAdmin && task.status === 'done' && task.taskType !== 'linkedProject' && <button onClick={() => onRevert(task.id, 'done')} title="Reabrir Tarea" className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 rounded-full hover:bg-red-100 dark:hover:bg-gray-700"><RotateCcw className="w-4 h-4" /></button>}
                    {task.status === 'todo' && !isLocked && <button onClick={() => onTake(task.id)} className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center">Coger <ArrowRight className="w-4 h-4 ml-1" /></button>}
                    {task.status === 'inProgress' && task.assigneeId === loggedInUser.uid && <button onClick={() => onComplete(task)} className="px-3 py-1 text-sm bg-sky-500 text-white rounded-md hover:bg-sky-600 flex items-center">Completar <Check className="w-4 h-4 ml-1" /></button>}
                </div>
            </div>
        </div>
    );
};
