import React, { useState } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { CalendarDays, ArrowRight, ArrowLeft } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { KanbanTask, ShiftType } from '../../types';

interface PlannerProps {
    tasks: KanbanTask[];
    eventId: string;
}

export const ProductionPlanner: React.FC<PlannerProps> = ({ tasks, eventId }) => {
    const { updateTaskSchedule } = useStore();
    const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

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
                    <div className="p-3 bg-white/5 border-b border-white/5 font-semibold text-slate-300 text-sm">
                        Tareas Sin Asignar ({unassignedTasks.length})
                    </div>
                    <div className="flex-1 p-2 space-y-2 overflow-y-auto bg-black/20">
                        {unassignedTasks.map(task => (
                            <div
                                key={task.id}
                                draggable
                                onDragStart={e => handleDragStart(e, task.id)}
                                className="bg-surface p-3 rounded border border-white/5 hover:border-primary cursor-grab active:cursor-grabbing shadow-sm"
                            >
                                <p className="text-sm font-medium text-white truncate">{task.title}</p>
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
        </div>
    );
};
