/*
Dashboard Split para Synaptic Flow.

Organiza la pantalla en dos columnas:
- Izquierda: Navegador jerárquico de proyectos (árbol)
- Derecha: Bandeja de entrada (Inbox)

@module DashboardSplit
@component
*/

import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, ExternalLink, Edit, Users, Trash2, Inbox } from 'lucide-react';
import InboxDashboard from './InboxDashboard';

const ProjectTreeItem = ({ project, allTasks, level, onNavigate, onEdit, onManageTeam, onDelete, onCreateSubtask, canManageTeam, loggedInUser }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const children = allTasks.filter(t => t.parentId === project.id && !t.deleted);
    const hasChildren = children.length > 0;

    const canEdit = canManageTeam ? canManageTeam(project) : (project.ownerId === loggedInUser?.uid || project.team?.find(m => m.userId === loggedInUser?.uid)?.role === 'admin');

    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${level === 0 ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700' : ''}`}
                style={{ paddingLeft: `${level * 16 + 12}px` }}
            >
                <button
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500"
                >
                    {hasChildren ? (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : <div className="w-4 h-4" />}
                </button>
                <button onClick={() => onNavigate(project)} className="flex items-center gap-2 flex-grow text-left hover:text-sky-600 dark:hover:text-sky-400">
                    {isExpanded ? <FolderOpen className="w-5 h-5 text-sky-500" /> : <Folder className="w-5 h-5 text-gray-400" />}
                    <span className="font-medium text-gray-900 dark:text-white">{project.title}</span>
                </button>
                <div className="flex items-center gap-1">
                    {canEdit && (
                        <>
                            <button onClick={() => onCreateSubtask(project.id)} title="Nueva Subtarea" className="p-1.5 text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                                <Plus className="w-4 h-4" />
                            </button>
                            <button onClick={() => onManageTeam(project)} title="Gestionar equipo" className="p-1.5 text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                                <Users className="w-4 h-4" />
                            </button>
                            <button onClick={() => onEdit(project)} title="Editar" className="p-1.5 text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                                <Edit className="w-4 h-4" />
                            </button>
                        </>
                    )}
                    <button onClick={() => onNavigate(project)} title="Abrir" className="p-1.5 text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                        <ExternalLink className="w-4 h-4" />
                    </button>
                </div>
            </div>
            {isExpanded && hasChildren && (
                <div className="mt-1 space-y-1">
                    {children.map(child => (
                        <ProjectTreeItem
                            key={child.id}
                            project={child}
                            allTasks={allTasks}
                            level={level + 1}
                            onNavigate={onNavigate}
                            onEdit={onEdit}
                            onManageTeam={onManageTeam}
                            onDelete={onDelete}
                            onCreateSubtask={onCreateSubtask}
                            canManageTeam={canManageTeam}
                            loggedInUser={loggedInUser}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function DashboardSplit({ projects, allTasks, onNavigate, onEdit, onDelete, onRestore, onManageTeam, onCreateSubtask, loggedInUser, canManageTeam, inboxTasks, onEditTask, onDeleteTask, onRestoreTask, onTakeTask, onCompleteTask, onRevertTask, team }) {
    const rootProjects = useMemo(() => {
        return projects.filter(p => !p.deleted && p.parentId === null);
    }, [projects]);

    const hasInboxTasks = inboxTasks && inboxTasks.length > 0;

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full">
            <div className="lg:w-1/2 flex flex-col min-h-0">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Folder className="w-6 h-6 mr-3 text-sky-500" />
                        Proyectos
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Navega por tus proyectos y subtareas
                    </p>
                </div>
                <div className="flex-grow overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    {rootProjects.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <Folder className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No hay proyectos creados.</p>
                            <p className="text-sm mt-1">Usa el botón "+ Nuevo Proyecto" para empezar.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {rootProjects.map(project => (
                                <ProjectTreeItem
                                    key={project.id}
                                    project={project}
                                    allTasks={allTasks}
                                    level={0}
                                    onNavigate={onNavigate}
                                    onEdit={onEdit}
                                    onManageTeam={onManageTeam}
                                    onDelete={onDelete}
                                    onCreateSubtask={onCreateSubtask}
                                    canManageTeam={canManageTeam}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="lg:w-1/2 flex flex-col min-h-0">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Inbox className="w-6 h-6 mr-3 text-amber-500" />
                        Bandeja de Entrada
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Tareas asignadas o pendientes de procesar
                    </p>
                </div>
                <div className="flex-grow overflow-y-auto">
                    <InboxDashboard
                        tasks={inboxTasks}
                        allTasks={allTasks}
                        onNavigate={onNavigate}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                        onRestore={onRestoreTask}
                        onTake={onTakeTask}
                        onComplete={onCompleteTask}
                        onRevert={onRevertTask}
                        loggedInUser={loggedInUser}
                        team={team}
                    />
                </div>
            </div>
        </div>
    );
}
