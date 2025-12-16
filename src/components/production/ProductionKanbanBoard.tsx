import React from 'react';
import { ChefHat, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { ProductionTask } from '../../types';

interface ColumnProps {
    id: string;
    title: string;
    tasks: ProductionTask[];
    color: string;
    onDrop: (taskId: string, status: 'todo' | 'in-progress' | 'done') => void;
}

const KanbanColumn: React.FC<ColumnProps> = ({ id, title, tasks, color, onDrop }) => {
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            onDrop(taskId, id as 'todo' | 'in-progress' | 'done');
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

export const ProductionKanbanBoard: React.FC = () => {
    const {
        selectedProductionEventId,
        productionTasks,
        setProductionTasks,
        updateProductionTaskStatus,
        events
    } = useStore();

    const selectedEvent = events.find(e => e.id === selectedProductionEventId);
    const tasks = selectedProductionEventId ? (productionTasks[selectedProductionEventId] || []) : [];

    const handleGenerateTasks = () => {
        if (!selectedEvent || !selectedEvent.menu || !selectedProductionEventId) return;

        // Generate tasks from menu recipes
        const newTasks: ProductionTask[] = (selectedEvent.menu.recipes || []).map((recipe) => ({
            id: crypto.randomUUID(),
            title: recipe.name,
            quantity: selectedEvent.pax, // Simple assumption: quantity refers to servings or similar
            unit: 'raciones',
            description: recipe.station ? `Partida: ${recipe.station}` : 'General',
            status: 'todo',
            recipeId: recipe.id,
            station: recipe.station
        }));

        setProductionTasks(selectedProductionEventId, newTasks);
    };

    const handleUpdateStatus = (taskId: string, status: 'todo' | 'in-progress' | 'done') => {
        if (selectedProductionEventId) {
            updateProductionTaskStatus(selectedProductionEventId, taskId, status);
        }
    };

    if (!selectedProductionEventId) {
        return <div className="text-center text-slate-500 mt-10">Selecciona un evento para ver el tablero.</div>;
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex-none mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">Tablero Kanban</h2>
                    <p className="text-slate-400 text-sm">Gestiona el flujo de trabajo de la cocina</p>
                </div>
                {tasks.length === 0 && (
                    <button
                        onClick={handleGenerateTasks}
                        className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Plus size={16} /> Generar Tareas del Menú
                    </button>
                )}
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
