import React from 'react';
import { Plus, Clock, Calendar, Lock, Unlock, ArrowRight, Check, User, RotateCcw, Undo2, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

export default function TaskCard({ task, onTake, onComplete, onRevert, onEdit, isLocked, loggedInUser, team }) {
    const assignee = task.assigneeId ? team.find(m => m.id === task.assigneeId) : null;
    const assigneeName = assignee ? assignee.username : 'Sin asignar';
    const deviation = task.status === 'done' ? (task.actualHours || 0) - (task.expectedHours || 0) : null;

    const formatDate = (timestamp) => timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString() : null;

    return (
        <div onClick={() => onEdit(task)} className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 ${isLocked ? 'border-red-500 opacity-60' : 'border-sky-500'} transition-shadow hover:shadow-lg cursor-pointer`}>
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-lg text-gray-900 dark:text-white">{task.title}</h4>
                {isLocked ? <Lock className="w-5 h-5 text-red-500" /> : task.status === 'todo' && <Unlock className="w-5 h-5 text-green-500" />}
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">{task.description}</p>
            
            <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
                {task.preferredDate && <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> Preferente: {formatDate(task.preferredDate)}</div>}
                {task.expirationDate && <div className="flex items-center"><AlertCircle className="w-4 h-4 mr-2 text-red-500" /> Expira: {formatDate(task.expirationDate)}</div>}
                
                <div className="flex items-center"><Clock className="w-4 h-4 mr-2" /> 
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

            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center text-sm"><User className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" /><span className="text-gray-700 dark:text-gray-300">{assigneeName}</span></div>
                <div className="flex items-center space-x-2">
                    {(loggedInUser.role === 'admin' || loggedInUser.role === 'superuser') && task.status === 'inProgress' && <button onClick={() => onRevert(task.id, 'inProgress')} title="Devolver a Pendiente" className="p-2 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200 rounded-full hover:bg-yellow-100 dark:hover:bg-gray-700"><Undo2 className="w-4 h-4" /></button>}
                    {(loggedInUser.role === 'admin' || loggedInUser.role === 'superuser') && task.status === 'done' && <button onClick={() => onRevert(task.id, 'done')} title="Reabrir Tarea" className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 rounded-full hover:bg-red-100 dark:hover:bg-gray-700"><RotateCcw className="w-4 h-4" /></button>}
                    {task.status === 'todo' && !isLocked && <button onClick={() => onTake(task.id)} className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center">Coger <ArrowRight className="w-4 h-4 ml-1" /></button>}
                    {task.status === 'inProgress' && task.assigneeId === loggedInUser.uid && <button onClick={() => onComplete(task)} className="px-3 py-1 text-sm bg-sky-500 text-white rounded-md hover:bg-sky-600 flex items-center">Completar <Check className="w-4 h-4 ml-1" /></button>}
                </div>
            </div>
        </div>
    );
};
