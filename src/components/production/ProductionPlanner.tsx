import React, { useState } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { CalendarDays, ArrowRight, ArrowLeft, Plus, X, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { KanbanTask, ShiftType } from '../../types';

interface PlannerProps {
    tasks: KanbanTask[];
    eventId: string;
}

export const ProductionPlanner: React.FC<PlannerProps> = ({ tasks, eventId }) => {
    const { updateTaskSchedule, addProductionTask, deleteProductionTask } = useStore();
    const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const handlePreviousWeek = () => setWeekStart(prev => addDays(prev, -7));
    const handleNextWeek = () => setWeekStart(prev => addDays(prev, 7));

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
    };

    const handleDrop = (e: React.DragEvent, date: string, shift: ShiftType) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            updateTaskSchedule(eventId, taskId, { assignedDate: date, shift });
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        const newTask: import('../../types').KanbanTask = {
            id: crypto.randomUUID(),
            title: newTaskTitle,
            quantity: 1,
            unit: 'serv',
            description: 'Tarea manual',
            status: 'todo',
            eventId
        };

        addProductionTask(eventId, newTask);
        setNewTaskTitle('');
        setIsNewTaskModalOpen(false);
    };

    const getTasksForSlot = (date: string, shift: ShiftType) => {
        return tasks.filter(t => t.assignedDate === date && t.shift === shift);
    };

    const unassignedTasks = tasks.filter(t => !t.assignedDate || !t.shift);

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center bg-surface border border-white/5 p-4 rounded-xl">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CalendarDays className="text-primary" /> Planificación Semanal
                </h3>
                <div className="flex items-center gap-4">
                    <button onClick={handlePreviousWeek} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <span className="text-slate-300 font-medium">
                        Semana {format(weekStart, 'dd MMM')} - {format(addDays(weekStart, 6), 'dd MMM')}
                    </span>
                    <button onClick={handleNextWeek} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 h-auto md:h-[600px]">
                {/* Unassigned Tasks (Sidebar) */}
                <div className="w-full md:w-64 flex flex-col bg-surface border border-white/5 rounded-xl overflow-hidden shadow-lg flex-none h-64 md:h-auto">
                    <div className="p-3 bg-white/5 border-b border-white/5 font-semibold text-slate-300 text-sm flex justify-between items-center">
                        <span>Tareas Disponibles ({unassignedTasks.length})</span>
                        <button
                            onClick={() => setIsNewTaskModalOpen(true)}
                            className="p-1 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                            title="Nueva Tarea Manual"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="flex-1 p-2 space-y-2 overflow-y-auto bg-black/20">
                        {unassignedTasks.map(task => (
                            <div
                                key={task.id}
                                draggable
                                onDragStart={e => handleDragStart(e, task.id)}
                                className="bg-surface p-3 rounded border border-white/5 hover:border-primary cursor-grab active:cursor-grabbing shadow-sm"
                            >
                                <div className="flex justify-between items-start">
                                    <p className="text-sm font-medium text-white truncate flex-1">{task.title}</p>
                                    <button
                                        onClick={() => deleteProductionTask(eventId, task.id)}
                                        className="text-slate-600 hover:text-red-400 p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500">{task.quantity} {task.unit}</p>
                            </div>
                        ))}
                        {unassignedTasks.length === 0 && (
                            <p className="text-center text-xs text-slate-500 py-4">No hay tareas sin asignar</p>
                        )}
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 overflow-x-auto rounded-xl border border-white/10">
                    <div className="grid grid-cols-7 gap-px bg-white/10 min-w-[1000px]">
                        {weekDays.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

                            return (
                                <div key={dateStr} className={`flex flex-col bg-surface/95 ${isToday ? 'bg-primary/5' : ''} min-h-[300px]`}>
                                    <div className={`p-2 text-center text-sm font-medium border-b border-white/5 ${isToday ? 'text-primary' : 'text-slate-400'}`}>
                                        {format(day, 'EEE dd')}
                                    </div>

                                    {/* Morning Shift */}
                                    <div
                                        className="flex-1 border-b border-white/5 p-1 min-h-[140px]"
                                        onDragOver={handleDragOver}
                                        onDrop={e => handleDrop(e, dateStr, 'MORNING')}
                                    >
                                        <div className="text-[10px] text-orange-400/70 font-bold uppercase mb-1 px-1">Mañana</div>
                                        <div className="space-y-1">
                                            {getTasksForSlot(dateStr, 'MORNING').map(task => (
                                                <div key={task.id}
                                                    draggable
                                                    onDragStart={e => handleDragStart(e, task.id)}
                                                    className="bg-orange-500/10 border border-orange-500/20 rounded px-1.5 py-1 text-xs text-slate-200 cursor-pointer hover:bg-orange-500/20 truncate"
                                                    title={task.title}
                                                >
                                                    {task.title}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Afternoon Shift */}
                                    <div
                                        className="flex-1 p-1 min-h-[140px]"
                                        onDragOver={handleDragOver}
                                        onDrop={e => handleDrop(e, dateStr, 'AFTERNOON')}
                                    >
                                        <div className="text-[10px] text-indigo-400/70 font-bold uppercase mb-1 px-1">Tarde</div>
                                        <div className="space-y-1">
                                            {getTasksForSlot(dateStr, 'AFTERNOON').map(task => (
                                                <div key={task.id}
                                                    draggable
                                                    onDragStart={e => handleDragStart(e, task.id)}
                                                    className="bg-indigo-500/10 border border-indigo-500/20 rounded px-1.5 py-1 text-xs text-slate-200 cursor-pointer hover:bg-indigo-500/20 truncate"
                                                    title={task.title}
                                                >
                                                    {task.title}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* New Task Modal */}
            {isNewTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-surface border border-white/10 rounded-xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-bold text-white">Nueva Tarea</h4>
                            <button onClick={() => setIsNewTaskModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Título de la tarea</label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="Ej: Limpieza de campana..."
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!newTaskTitle.trim()}
                                className="w-full bg-primary hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition-colors"
                            >
                                Crear Tarea
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
