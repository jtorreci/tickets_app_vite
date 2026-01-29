/*
Columna del tablero Kanban para Synaptic Flow.

Representa una columna de estado (Pendiente, En Progreso, Hecho)
y renderiza las tareas correspondientes.

@module BoardColumn
@component
/*

import React, { useMemo } from 'react';
import TaskCard from './TaskCard';

/**
 * Columna del tablero Kanban.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {string} props.title - Título de la columna.
 * @param {Array} props.tasks - Tareas a mostrar en la columna.
 * @param {Function} props.onTake - Función para tomar una tarea.
 * @param {Function} props.onComplete - Función para completar una tarea.
 * @param {Function} props.onRevert - Función para revertir estado.
 * @param {Function} props.onEditTicket - Función para editar tarea.
 * @param {Function} props.onAssign - Función para asignar tarea.
 * @param {Function} props.onDelete - Función para borrar tarea.
 * @param {Array} props.allTasks - Lista de todas las tareas.
 * @param {Object} props.loggedInUser - Usuario autenticado.
 * @param {Array} props.team - Lista de miembros del equipo.
 * @param {Function} props.onNavigate - Función de navegación.
 * @returns {JSX.Element} Columna Kanban.
 */
export default function BoardColumn({ title, tasks, onTake, onComplete, onRevert, onEditTicket, onAssign, onDelete, allTasks, loggedInUser, team, onNavigate }) {
    const taskStatusMap = useMemo(() => {
        const map = new Map();
        allTasks.forEach(t => map.set(t.id, t.status));
        return map;
    }, [allTasks]);

    const isTaskLocked = (task) => {
        if (!task.dependencies || task.dependencies.length === 0) {
            return false;
        }
        return task.dependencies.some(depId => taskStatusMap.get(depId) !== 'done');
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4 w-full md:w-1/3 flex-shrink-0">
            <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-4">{title}</h3>
            <div className="space-y-4 h-full overflow-y-auto">
                {tasks.map(task => (
                    <TaskCard 
                        key={task.id} 
                        task={task} 
                        onTake={onTake} 
                        onComplete={onComplete} 
                        onRevert={onRevert} 
                        onEdit={onEditTicket} 
                        onAssign={onAssign}
                        onDelete={onDelete}
                        onNavigate={onNavigate}
                        isLocked={title === 'Pendiente' && isTaskLocked(task)} 
                        loggedInUser={loggedInUser} 
                        team={team} 
                        allTasks={allTasks}
                    />
                ))}
            </div>
        </div>
    );
};
