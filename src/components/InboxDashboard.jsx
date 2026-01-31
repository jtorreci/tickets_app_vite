/*
Bandeja de Entrada GTD para Synaptic Flow.

Muestra tareas no vinculadas a proyectos (tareas sueltas)
asignadas al usuario o creadas por el usuario.

@module InboxDashboard
@component
*/

import React, { useMemo, useState } from 'react';
import { Clock, Calendar, AlertCircle, ExternalLink, Edit, Trash2, ArrowRight, Check, User, ChevronRight } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';

/**
 * Item de tarea en la bandeja de entrada.
 */
const InboxTaskItem = ({ task, allTasks, onNavigate, onEdit, onDelete, onTake, onComplete, onRevert, loggedInUser, team }) => {
    const isAssignedToMe = task.assigneeId === loggedInUser.uid;
    const isOwner = task.ownerId === loggedInUser.uid;
    const isOverdue = useMemo(() => {
        if (!task?.expirationDate || task.status !== 'todo') return false;
        return new Date(task.expirationDate.seconds * 1000) < new Date();
    }, [task]);

    const assignee = task.assigneeId ? team.find(m => m.id === task.assigneeId) : null;
    const assigneeName = assignee ? assignee.username : 'Sin asignar';

    const formatDate = (timestamp) => timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString() : 'N/A';
    const isAdmin = loggedInUser.role === 'admin' || loggedInUser.role === 'superuser';

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${isOverdue ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'} p-4 hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start">
                <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-white text-xs ${task.status === 'inProgress' ? 'bg-sky-500' : task.status === 'done' ? 'bg-green-500' : 'bg-gray-400'}`}>
                            {task.status === 'inProgress' ? 'En Progreso' : task.status === 'done' ? 'Completada' : 'Pendiente'}
                        </span>
                        {isAssignedToMe && (
                            <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                                Para ti
                            </span>
                        )}
                        {isOwner && !isAssignedToMe && (
                            <span className="px-2 py-1 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200 text-xs">
                                Creada por ti
                            </span>
                        )}
                        {isOverdue && (
                            <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Vencida
                            </span>
                        )}
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{task.title}</h3>
                    {task.description && (
                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center"><User className="w-4 h-4 mr-1" /> {assigneeName}</span>
                        {task.expectedHours > 0 && (
                            <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {task.expectedHours}h</span>
                        )}
                        {task.expirationDate && (
                            <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> Límite: {formatDate(task.expirationDate)}</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                    {task.status === 'todo' && (isAssignedToMe || isOwner || isOverdue) && (
                        <button onClick={() => onTake(task.id)} title="Coger Tarea" className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 rounded-full hover:bg-green-100 dark:hover:bg-gray-700">
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    )}
                    {task.status === 'inProgress' && isAssignedToMe && (
                        <button onClick={() => onComplete(task)} title="Completar" className="p-2 text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-200 rounded-full hover:bg-sky-100 dark:hover:bg-gray-700">
                            <Check className="w-5 h-5" />
                        </button>
                    )}
                    {(isAssignedToMe || isOwner || isAdmin) && (
                        <button onClick={() => onEdit(task)} title="Editar" className="p-2 text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Edit className="w-5 h-5" />
                        </button>
                    )}
                    {isOwner && (
                        <button onClick={() => onDelete(task.id)} title="Borrar" className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Dashboard de la bandeja de entrada.
 */
export default function InboxDashboard({ tasks, allTasks, onNavigate, onEdit, onDelete, onTake, onComplete, onRevert, loggedInUser, team }) {
    const pendingTasks = useMemo(() => tasks.filter(t => t.status === 'todo'), [tasks]);
    const inProgressTasks = useMemo(() => tasks.filter(t => t.status === 'inProgress'), [tasks]);
    const doneTasks = useMemo(() => tasks.filter(t => t.status === 'done'), [tasks]);

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">📥 Bandeja de Entrada</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Tareas no vinculadas a proyectos. Cualquier usuario puede asignarte tareas aquí.
                </p>
            </div>

            {/* Pendientes */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                    <span className="w-3 h-3 rounded-full bg-gray-400 mr-2"></span>
                    Pendientes ({pendingTasks.length})
                </h3>
                <div className="space-y-3">
                    {pendingTasks.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 italic">No hay tareas pendientes</p>
                    ) : (
                        pendingTasks.map(task => (
                            <InboxTaskItem 
                                key={task.id} 
                                task={task} 
                                allTasks={allTasks}
                                onNavigate={onNavigate}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onTake={onTake}
                                onComplete={onComplete}
                                onRevert={onRevert}
                                loggedInUser={loggedInUser}
                                team={team}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* En Progreso */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                    <span className="w-3 h-3 rounded-full bg-sky-500 mr-2"></span>
                    En Progreso ({inProgressTasks.length})
                </h3>
                <div className="space-y-3">
                    {inProgressTasks.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 italic">No hay tareas en progreso</p>
                    ) : (
                        inProgressTasks.map(task => (
                            <InboxTaskItem 
                                key={task.id} 
                                task={task} 
                                allTasks={allTasks}
                                onNavigate={onNavigate}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onTake={onTake}
                                onComplete={onComplete}
                                onRevert={onRevert}
                                loggedInUser={loggedInUser}
                                team={team}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Terminadas */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                    <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                    Terminadas ({doneTasks.length})
                </h3>
                <div className="space-y-3">
                    {doneTasks.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 italic">No hay tareas terminadas</p>
                    ) : (
                        doneTasks.map(task => (
                            <InboxTaskItem 
                                key={task.id} 
                                task={task} 
                                allTasks={allTasks}
                                onNavigate={onNavigate}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onTake={onTake}
                                onComplete={onComplete}
                                onRevert={onRevert}
                                loggedInUser={loggedInUser}
                                team={team}
                            />
                        ))
                    )}
                </div>
            </div>

            {tasks.length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">Tu bandeja de entrada está vacía</p>
                    <p className="text-gray-400 dark:text-gray-500 mt-2">Las tareas que otros te asignen aparecerán aquí</p>
                </div>
            )}
        </div>
    );
}
