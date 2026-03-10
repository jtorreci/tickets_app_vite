/*
Dashboard de equipos para Synaptic Flow.

@module TeamsDashboard
@component
*/

import React, { useMemo } from 'react';
import { Users, ExternalLink, UserPlus, LogOut, Crown, Shield } from 'lucide-react';
import InvitationsPanel from './InvitationsPanel';

export default function TeamsDashboard({ userTeams, allTasks, loggedInUser, onOpenTeam, onInvite, onLeaveTeam, pendingInvitations, onAcceptInvitation, onDeclineInvitation }) {

    const teamsWithStats = useMemo(() => {
        const activeTasks = allTasks.filter(t => !t.deleted);
        return userTeams.map(team => {
            const teamProjects = activeTasks.filter(t => t.teamId === team.id && t.isProject);
            const teamTasks = activeTasks.filter(t => t.teamId === team.id && !t.isProject);
            const doneTasks = teamTasks.filter(t => t.status === 'done');
            return { ...team, projectCount: teamProjects.length, taskCount: teamTasks.length, doneCount: doneTasks.length };
        });
    }, [userTeams, allTasks]);

    const personalProjects = useMemo(() => {
        return allTasks.filter(t => !t.deleted && t.isProject && !t.teamId);
    }, [allTasks]);

    const getRoleIcon = (role) => {
        if (role === 'owner') return <Crown className="w-3 h-3 text-yellow-500" />;
        if (role === 'admin') return <Shield className="w-3 h-3 text-sky-500" />;
        return null;
    };

    const getUserRole = (team) => {
        const member = team.members?.find(m => m.userId === loggedInUser.uid);
        return member?.role || 'member';
    };

    return (
        <div className="max-w-6xl mx-auto">
            <InvitationsPanel invitations={pendingInvitations} onAccept={onAcceptInvitation} onDecline={onDeclineInvitation} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamsWithStats.map(team => {
                    const userRole = getUserRole(team);
                    const isOwner = userRole === 'owner';
                    const isAdminOrOwner = userRole === 'owner' || userRole === 'admin';
                    return (
                        <div key={team.id} className="p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center">
                                    <Users className="w-6 h-6 text-sky-500 mr-2 flex-shrink-0" />
                                    <h3 className="font-bold text-xl text-gray-900 dark:text-white">{team.name}</h3>
                                </div>
                                <div className="flex items-center space-x-1">
                                    {getRoleIcon(userRole)}
                                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{userRole}</span>
                                </div>
                            </div>
                            {team.description && <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm flex-grow">{team.description}</p>}

                            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-2">
                                    <p className="font-bold text-lg text-gray-900 dark:text-white">{team.memberIds?.length || 0}</p>
                                    <p className="text-gray-500 dark:text-gray-400">Miembros</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-2">
                                    <p className="font-bold text-lg text-gray-900 dark:text-white">{team.projectCount}</p>
                                    <p className="text-gray-500 dark:text-gray-400">Proyectos</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-2">
                                    <p className="font-bold text-lg text-gray-900 dark:text-white">{team.doneCount}/{team.taskCount}</p>
                                    <p className="text-gray-500 dark:text-gray-400">Hechas</p>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                    {isAdminOrOwner && (
                                        <button onClick={() => onInvite(team)} title="Invitar miembro" className="p-2 text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <UserPlus className="w-4 h-4" />
                                        </button>
                                    )}
                                    {!isOwner && (
                                        <button onClick={() => onLeaveTeam(team.id)} title="Abandonar equipo" className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <LogOut className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <button onClick={() => onOpenTeam(team)} className="bg-sky-100 dark:bg-sky-800 text-sky-700 dark:text-sky-200 px-3 py-1 rounded-md text-sm hover:bg-sky-200 dark:hover:bg-sky-700 flex items-center">
                                    Abrir <ExternalLink className="w-4 h-4 ml-2" />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {personalProjects.length > 0 && (
                    <div className="p-4 rounded-lg shadow-md border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 flex flex-col">
                        <div className="flex items-center">
                            <Users className="w-6 h-6 text-gray-400 mr-2 flex-shrink-0" />
                            <h3 className="font-bold text-xl text-gray-500 dark:text-gray-400">Proyectos Personales</h3>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm flex-grow">Proyectos sin equipo asignado</p>
                        <div className="mt-4 text-center text-xs">
                            <div className="bg-white dark:bg-gray-700/50 rounded-md p-2">
                                <p className="font-bold text-lg text-gray-900 dark:text-white">{personalProjects.length}</p>
                                <p className="text-gray-500 dark:text-gray-400">Proyectos</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                            <button onClick={() => onOpenTeam(null)} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center">
                                Abrir <ExternalLink className="w-4 h-4 ml-2" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {teamsWithStats.length === 0 && personalProjects.length === 0 && pendingInvitations.length === 0 && (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">No perteneces a ningún equipo.</p>
                    <p>Crea uno con el botón "+ Nuevo Equipo" o espera una invitación.</p>
                </div>
            )}
        </div>
    );
}
