/*
Panel de invitaciones pendientes para Synaptic Flow.

@module InvitationsPanel
@component
*/

import React from 'react';
import { Check, X, Mail } from 'lucide-react';

export default function InvitationsPanel({ invitations, onAccept, onDecline }) {
    if (invitations.length === 0) return null;

    const formatDate = (timestamp) => timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString() : '';

    return (
        <div className="mb-6 p-4 bg-sky-50 dark:bg-sky-900/30 rounded-lg border border-sky-200 dark:border-sky-800">
            <h3 className="text-lg font-semibold text-sky-700 dark:text-sky-300 flex items-center mb-3">
                <Mail className="w-5 h-5 mr-2" />
                Invitaciones pendientes ({invitations.length})
            </h3>
            <div className="space-y-2">
                {invitations.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{inv.teamName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Invitado por {inv.invitedByName} · {formatDate(inv.createdAt)}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => onAccept(inv)} title="Aceptar" className="p-2 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-900">
                                <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => onDecline(inv.id)} title="Rechazar" className="p-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-900">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
