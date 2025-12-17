import React from 'react';
import { ChefHat, AlertCircle, CheckCircle } from 'lucide-react';
import type { KanbanTask, KanbanTaskStatus } from '../../types';

interface ColumnProps {
    id: KanbanTaskStatus;
    title: string;
    tasks: KanbanTask[];
    color: string;
    onDrop: (taskId: string, status: KanbanTaskStatus) => void;
}

const KanbanColumn: React.FC<ColumnProps> = ({ id, title, tasks, color, onDrop }) => {
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            onDrop(taskId, id as KanbanTaskStatus);
        }
    };

    return (
        <div
            className="flex flex-col h-full min-w-[300px] w-full bg-slate-800/50 rounded-xl border border-white/5 overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div className={`p-4 border-b border-white/5 flex items-center justify-between ${id === 'todo' ? 'bg-slate-800' :
                id === 'in-progress' ? 'bg-blue-900/20' : 'bg-green-900/20'
                }`}>
                <h3 className={`font-bold text-lg flex items-center gap-2 ${color}`}>
                    {id === 'todo' && <AlertCircle size={20} />}
                    {id === 'in-progress' && <ChefHat size={20} />}
                    {id === 'done' && <CheckCircle size={20} />}
                    {title}
                </h3>
                <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono text-slate-400">
                    {tasks.length}
                </span>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                {tasks.map(task => (
                    <div
                        key={task.id}
                        className="bg-surface p-4 rounded-lg border border-white/5 shadow-sm hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors"
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                    >
                        <h4 className="font-medium text-slate-200">{task.title}</h4>
                        <div className="flex justify-between items-center mt-2 text-sm text-slate-400">
                            <span>{task.description}</span>
                            <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-white">
                                {task.quantity} {task.unit}
                            </span>
                        </div>
                    </div>
                ))}
                {tasks.length === 0 && (
                    <div className="text-center py-8 text-slate-600 text-sm italic">
                        No hay tareas
                    </div>
                )}
            </div>
        </div>
    );
};

interface ProductionKanbanBoardProps {
    tasks: KanbanTask[];
    onTaskStatusChange: (taskId: string, newStatus: KanbanTaskStatus) => void;
}

export const ProductionKanbanBoard: React.FC<ProductionKanbanBoardProps> = ({ tasks, onTaskStatusChange }) => {

    const handleUpdateStatus = (taskId: string, status: KanbanTaskStatus) => {
        onTaskStatusChange(taskId, status);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-none mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">Tablero Kanban</h2>
                    <p className="text-slate-400 text-sm">Gestiona el flujo de trabajo de la cocina</p>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
                <KanbanColumn
                    id="todo"
                    title="Pendiente"
                    tasks={tasks.filter(t => t.status === 'todo')}
                    color="text-slate-300"
                    onDrop={handleUpdateStatus}
                />
                <KanbanColumn
                    id="in-progress"
                    title="En Progreso"
                    tasks={tasks.filter(t => t.status === 'in-progress')}
                    color="text-blue-400"
                    onDrop={handleUpdateStatus}
                />
                <KanbanColumn
                    id="done"
                    title="Completado"
                    tasks={tasks.filter(t => t.status === 'done')}
                    color="text-green-400"
                    onDrop={handleUpdateStatus}
                />
            </div>
        </div>
    );
};
