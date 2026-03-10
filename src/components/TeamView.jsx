/*
Vista de un equipo individual en Synaptic Flow.

@module TeamView
@component
*/

import React, { useMemo, useState } from 'react';
import { Users, UserPlus, XCircle, Crown, Shield, ExternalLink, Edit, Trash2, Clock, TrendingUp, TrendingDown } from 'lucide-react';

export default function TeamView({ team, allTasks, allUsers, loggedInUser, onNavigateToProject, onEditProject, onDeleteProject, onInvite, onRemoveMember, onChangeRole }) {
    const [showMembers, setShowMembers] = useState(false);

    const userRole = useMemo(() => {
        const member = team.members?.find(m => m.userId === loggedInUser.uid);
        return member?.role || 'member';
    }, [team, loggedInUser.uid]);

    const isAdminOrOwner = userRole === 'owner' || userRole === 'admin';
    const isGlobalAdmin = loggedInUser.role === 'admin' || loggedInUser.role === 'superuser';
    const canManage = isAdminOrOwner || isGlobalAdmin;

    const projects = useMemo(() => {
        const activeTasks = allTasks.filter(t => !t.deleted);
        const teamProjects = activeTasks.filter(t => t.teamId === team.id && t.isProject);

        return teamProjects.map(project => {
            const children = activeTasks.filter(t => t.parentId === project.id);
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
                if (doneChildren.length === children.length) status = 'finished';
                else if (doneChildren.length > 0 || inProgressChildren.length > 0) status = 'inProgress';
            } else {
                if (project.status === 'done') { status = 'finished'; completedCount = 1; }
                if (project.status === 'inProgress') status = 'inProgress';
            }

            const deviation = totalActual - totalExpected;
            const hasChildren = children.length > 0;
            const progress = (children.length + 1) > 1 ? (completedCount / (children.length + (project.status === 'done' ? 0 : 1))) * 100 : (project.status === 'done' ? 100 : 0);
            return { ...project, status, totalExpected, totalActual, deviation, hasChildren, progress };
        });
    }, [allTasks, team.id]);

    const statusStyles = {
        planned: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600',
        inProgress: 'bg-sky-50 dark:bg-sky-900/50 border-sky-300 dark:border-sky-700',
        finished: 'bg-green-50 dark:bg-green-900/50 border-green-300 dark:border-green-700',
    };

    const formatDate = (timestamp) => timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString() : 'N/A';

    const getRoleIcon = (role) => {
        if (role === 'owner') return <Crown className="w-3 h-3 text-yellow-500" />;
        if (role === 'admin') return <Shield className="w-3 h-3 text-sky-500" />;
        return null;
    };

    const ownerId = team.members?.find(m => m.role === 'owner')?.userId;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Users className="w-6 h-6 mr-2 text-sky-500" />
                        {team.name}
                    </h2>
                    {team.description && <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{team.description}</p>}
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setShowMembers(!showMembers)} className="px-3 py-1.5 rounded-md text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center">
                        <Users className="w-4 h-4 mr-1" /> {team.memberIds?.length || 0} miembros
                    </button>
                    {isAdminOrOwner && (
                        <button onClick={() => onInvite(team)} className="px-3 py-1.5 rounded-md text-sm bg-sky-500 text-white hover:bg-sky-600 flex items-center">
                            <UserPlus className="w-4 h-4 mr-1" /> Invitar
                        </button>
                    )}
                </div>
            </div>

            {showMembers && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Miembros del equipo</h3>
                    <div className="space-y-2">
                        {team.members?.map(member => {
                            const userProfile = allUsers.find(u => u.id === member.userId);
                            const isOwner = member.userId === ownerId;
                            return (
                                <div key={member.userId} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                    <div className="flex items-center gap-2">
                                        {getRoleIcon(member.role)}
                                        <span className="font-medium text-gray-900 dark:text-white">{userProfile?.username || 'Desconocido'}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{userProfile?.email}</span>
                                    </div>
                                    {canManage && !isOwner && (
                                        <div className="flex items-center gap-2">
                                            <select value={member.role} onChange={(e) => onChangeRole(team.id, member.userId, e.target.value)} className="p-1 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs">
                                                <option value="member">Miembro</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <button onClick={() => onRemoveMember(team.id, member.userId)} title="Eliminar del equipo" className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-300 rounded-full hover:bg-red-100 dark:hover:bg-gray-600">
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.length === 0 && (
                    <div className="col-span-full text-center py-16 text-gray-500 dark:text-gray-400">
                        <p>No hay proyectos en este equipo.</p>
                        <p>Usa el botón "+ Nuevo Proyecto" para crear uno.</p>
                    </div>
                )}
                {projects.map(project => (
                    <div key={project.id} className={`p-4 rounded-lg shadow-md border ${statusStyles[project.status]} flex flex-col`}>
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white">{project.title}</h3>
                            <div className="flex items-center space-x-2">
                                {canManage && (
                                    <>
                                    <button onClick={() => onEditProject(project)} className="p-2 text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => onDeleteProject(project.id)} disabled={project.hasChildren} title={project.hasChildren ? "No se puede borrar, tiene subtareas" : "Borrar proyecto"} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    </>
                                )}
                                <button onClick={() => onNavigateToProject(project)} className="bg-sky-100 dark:bg-sky-800 text-sky-700 dark:text-sky-200 px-3 py-1 rounded-md text-sm hover:bg-sky-200 dark:hover:bg-sky-700 flex items-center">
                                    Abrir <ExternalLink className="w-4 h-4 ml-2" />
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
                                    {project.deviation > 0 ? <TrendingUp className="w-4 h-4 mr-2" /> : <TrendingDown className="w-4 h-4 mr-2" />}
                                    {project.deviation.toFixed(1)}h
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
