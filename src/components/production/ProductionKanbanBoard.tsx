import React, { useState } from 'react';
import { ChefHat, AlertCircle, CheckCircle } from 'lucide-react'; // CheckCircle isn't exported from lucide-react by default sometimes, wait. The implementation used a custom icon component previously.

// Simplified Kanban for the MVP using just layout, not full sortable for now to reduce complexity

// Simplified Kanban for the MVP using just layout, not full sortable for now to reduce complexity
// We'll track state locally for this demo as the store doesn't have "task status" field yet for production items specifically
// In a full app, this would update the store.

interface Task {
    id: string;
    title: string;
    quantity: number;
    unit: string;
    description: string;
    status: 'todo' | 'in-progress' | 'done';
}

interface ColumnProps {
    id: string;
    title: string;
    tasks: Task[];
    color: string;
}

const KanbanColumn: React.FC<ColumnProps> = ({ id, title, tasks, color }) => {
    return (
        <div className="flex flex-col h-full min-w-[300px] w-full bg-slate-800/50 rounded-xl border border-white/5 overflow-hidden">
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
                        draggable // Native drag for simplicity in MVP if dnd-kit is complex to setup in one go
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



export const ProductionKanbanBoard: React.FC = () => {
    // Generate some mock tasks based on store data or just static for the UI demo
    // The user wants the UI component first.
    const [tasks, setTasks] = useState<Task[]>([
        { id: '1', title: 'Salsa de Tomate', quantity: 5, unit: 'L', description: 'Base para pizzas', status: 'todo' },
        { id: '2', title: 'Cortar Cebolla', quantity: 10, unit: 'kg', description: 'Juliana fina', status: 'in-progress' },
        { id: '3', title: 'Marinar Pollo', quantity: 20, unit: 'kg', description: 'Limón y hierbas', status: 'todo' },
        { id: '4', title: 'Caldo de Ave', quantity: 15, unit: 'L', description: 'Reducción lenta', status: 'done' },
        { id: '5', title: 'Pelar Patatas', quantity: 25, unit: 'kg', description: 'Para guarnición', status: 'todo' },
    ]);

    const handleDrop = (e: React.DragEvent, status: 'todo' | 'in-progress' | 'done') => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            setTasks(prev => prev.map(t =>
                t.id === taskId ? { ...t, status } : t
            ));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-none mb-6">
                <h2 className="text-xl font-bold text-white">Tablero Kanban</h2>
                <p className="text-slate-400 text-sm">Gestiona el flujo de trabajo de la cocina</p>
            </div>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
                <div
                    className="flex-1 min-w-[300px]"
                    onDrop={(e) => handleDrop(e, 'todo')}
                    onDragOver={handleDragOver}
                >
                    <KanbanColumn
                        id="todo"
                        title="Pendiente"
                        tasks={tasks.filter(t => t.status === 'todo')}
                        color="text-slate-300"
                    />
                </div>

                <div
                    className="flex-1 min-w-[300px]"
                    onDrop={(e) => handleDrop(e, 'in-progress')}
                    onDragOver={handleDragOver}
                >
                    <KanbanColumn
                        id="in-progress"
                        title="En Progreso"
                        tasks={tasks.filter(t => t.status === 'in-progress')}
                        color="text-blue-400"
                    />
                </div>

                <div
                    className="flex-1 min-w-[300px]"
                    onDrop={(e) => handleDrop(e, 'done')}
                    onDragOver={handleDragOver}
                >
                    <KanbanColumn
                        id="done"
                        title="Completado"
                        tasks={tasks.filter(t => t.status === 'done')}
                        color="text-green-400"
                    />
                </div>
            </div>
        </div>
    );
};
