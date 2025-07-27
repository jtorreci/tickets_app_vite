import React, { useMemo } from 'react';
import TaskCard from './TaskCard';

export default function BoardColumn({ title, tasks, onTake, onComplete, onRevert, onEditTicket, allTasks, loggedInUser, team }) {
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
                        isLocked={title === 'Pendiente' && isTaskLocked(task)} 
                        loggedInUser={loggedInUser} 
                        team={team} 
                    />
                ))}
            </div>
        </div>
    );
};
