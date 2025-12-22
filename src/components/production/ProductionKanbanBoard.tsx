import React, { useState, useEffect } from 'react';
import { ChefHat, AlertCircle, CheckCircle, Play, Pause, Clock } from 'lucide-react';
import type { KanbanTask, KanbanTaskStatus } from '../../types';
import { useStore } from '../../store/useStore';

interface ColumnProps {
    id: KanbanTaskStatus;
    title: string;
    tasks: KanbanTask[];
    color: string;
    onDrop: (taskId: string, status: KanbanTaskStatus) => void;
    onToggleTimer: (taskId: string) => void;
    staff: any[];
    onAssignEmployee: (taskId: string, employeeId: string) => void;
}

const KanbanColumn: React.FC<ColumnProps> = ({ id, title, tasks, color, onDrop, onToggleTimer, staff, onAssignEmployee }) => {
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
                    <TaskCard
                        key={task.id}
                        task={task}
                        onToggleTimer={onToggleTimer}
                        staff={staff}
                        onAssignEmployee={onAssignEmployee}
                    />
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

const TaskCard = ({
    task,
    onToggleTimer,
    staff,
    onAssignEmployee
}: {
    task: KanbanTask,
    onToggleTimer: (id: string) => void,
    staff: any[],
    onAssignEmployee: (taskId: string, employeeId: string) => void
}) => {
    // Local state for ticking timer
    const [elapsed, setElapsed] = useState(task.totalTimeSpent || 0);

    useEffect(() => {
        setElapsed(task.totalTimeSpent || 0);
    }, [task.totalTimeSpent]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (task.timerStart) {
            interval = setInterval(() => {
                const currentSession = Math.floor((Date.now() - task.timerStart!) / 1000);
                setElapsed((task.totalTimeSpent || 0) + currentSession);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [task.timerStart, task.totalTimeSpent]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div
            className={`bg-surface p-4 rounded-lg border shadow-sm hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors ${task.timerStart ? 'border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'border-white/5'
                }`}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
        >
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-slate-200">{task.title}</h4>
                <div className="flex items-center gap-1">
                    <select
                        value={task.assignedEmployeeId || ''}
                        onChange={(e) => onAssignEmployee(task.id, e.target.value)}
                        className="bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[10px] text-slate-400 hover:text-white transition-colors max-w-[80px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="">Asignar...</option>
                        {staff.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                    </select>
                    {task.shift && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${task.shift === 'MORNING' ? 'bg-orange-500/20 text-orange-300' : 'bg-indigo-500/20 text-indigo-300'
                            }`}>
                            {task.shift === 'MORNING' ? 'M' : 'T'}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center text-sm text-slate-400 mb-3">
                <span>{task.description}</span>
                <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-white">
                    {task.quantity} {task.unit}
                </span>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className={`flex items-center gap-2 font-mono text-sm ${task.timerStart ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <Clock size={14} />
                    {formatTime(elapsed)}
                </div>
                {task.status !== 'done' && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleTimer(task.id); }}
                        className={`p-1.5 rounded-full transition-colors ${task.timerStart
                            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            }`}
                    >
                        {task.timerStart ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                    </button>
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
    const { toggleTaskTimer, selectedProductionEventId, staff, updateTaskSchedule } = useStore();

    const handleUpdateStatus = (taskId: string, status: KanbanTaskStatus) => {
        onTaskStatusChange(taskId, status);
    };

    const handleToggleTimer = (taskId: string) => {
        if (selectedProductionEventId) {
            toggleTaskTimer(selectedProductionEventId, taskId);
        }
    };

    const handleAssignEmployee = (taskId: string, employeeId: string) => {
        if (selectedProductionEventId) {
            updateTaskSchedule(selectedProductionEventId, taskId, { assignedEmployeeId: employeeId });
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-none mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">Tablero Kanban</h2>
                    <p className="text-slate-400 text-sm">Gestiona el flujo de trabajo de la cocina</p>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
                <KanbanColumn
                    id="todo"
                    title="Pendiente"
                    tasks={tasks.filter(t => t.status === 'todo')}
                    color="text-slate-300"
                    onDrop={handleUpdateStatus}
                    onToggleTimer={handleToggleTimer}
                    staff={staff}
                    onAssignEmployee={handleAssignEmployee}
                />
                <KanbanColumn
                    id="in-progress"
                    title="En Progreso"
                    tasks={tasks.filter(t => t.status === 'in-progress')}
                    color="text-blue-400"
                    onDrop={handleUpdateStatus}
                    onToggleTimer={handleToggleTimer}
                    staff={staff}
                    onAssignEmployee={handleAssignEmployee}
                />
                <KanbanColumn
                    id="done"
                    title="Completado"
                    tasks={tasks.filter(t => t.status === 'done')}
                    color="text-green-400"
                    onDrop={handleUpdateStatus}
                    onToggleTimer={handleToggleTimer}
                    staff={staff}
                    onAssignEmployee={handleAssignEmployee}
                />
            </div>
        </div>
    );
};

