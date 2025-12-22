import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { CheckCircle2, Circle, Clock, Calendar, CheckSquare, ListTodo } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../ui';
import type { HACCPTaskCompletion } from '../../types';

export const ChecklistView: React.FC = () => {
    const { haccpTasks, haccpTaskCompletions, completeHACCPTask, currentUser } = useStore();
    const { addToast } = useToast();

    const today = format(new Date(), 'yyyy-MM-dd');

    const tasksWithStatus = useMemo(() => {
        const activeTasks = haccpTasks.filter(t => t.isActive);

        return activeTasks.map(task => {
            const completionsToday = haccpTaskCompletions.filter(
                c => c.taskId === task.id && c.completedAt.startsWith(today)
            );

            return {
                ...task,
                isCompletedToday: completionsToday.length > 0,
                lastCompletion: haccpTaskCompletions
                    .filter(c => c.taskId === task.id)
                    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]
            };
        });
    }, [haccpTasks, haccpTaskCompletions, today]);

    const handleToggleComplete = (taskId: string, currentStatus: boolean) => {
        if (currentStatus) {
            addToast('Esta tarea ya ha sido completada hoy', 'info');
            return;
        }

        const completion: HACCPTaskCompletion = {
            id: crypto.randomUUID(),
            taskId,
            completedAt: new Date().toISOString(),
            completedBy: currentUser?.name || 'Usuario',
            notes: 'Completado desde el panel de control'
        };

        completeHACCPTask(completion);
        addToast('Tarea completada correctamente', 'success');
    };

    const groupedTasks = {
        DAILY: tasksWithStatus.filter(t => t.frequency === 'DAILY'),
        WEEKLY: tasksWithStatus.filter(t => t.frequency === 'WEEKLY'),
        MONTHLY: tasksWithStatus.filter(t => t.frequency === 'MONTHLY'),
    };

    const stats = {
        total: tasksWithStatus.length,
        completed: tasksWithStatus.filter(t => t.isCompletedToday).length,
        pending: tasksWithStatus.filter(t => !t.isCompletedToday).length
    };

    const progressPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Progress Header */}
            <div className="bg-surface border border-white/5 rounded-2xl p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16 rounded-full" />

                <div className="relative flex flex-col md:flex-row items-center gap-6">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                            <circle
                                cx="48" cy="48" r="40"
                                className="fill-none stroke-white/5"
                                strokeWidth="8"
                            />
                            <circle
                                cx="48" cy="48" r="40"
                                className="fill-none stroke-primary transition-all duration-1000 ease-out"
                                strokeWidth="8"
                                strokeDasharray={2 * Math.PI * 40}
                                strokeDashoffset={2 * Math.PI * 40 * (1 - progressPercentage / 100)}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-bold text-white">{Math.round(progressPercentage)}%</span>
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-bold text-white mb-1">Progreso Diario HACCP</h3>
                        <p className="text-slate-400 text-sm">
                            {stats.completed} de {stats.total} tareas completadas hoy.
                            {stats.pending > 0 ? ` Faltan ${stats.pending} tareas por realizar.` : ' ¡Excelente trabajo! Todo al día.'}
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-black/20 border border-white/5 px-4 py-2 rounded-xl">
                            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Pendientes</div>
                            <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
                        </div>
                        <div className="bg-black/20 border border-white/5 px-4 py-2 rounded-xl">
                            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Completadas</div>
                            <div className="text-2xl font-bold text-emerald-400">{stats.completed}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Lists */}
            <div className="grid grid-cols-1 gap-8">
                {['DAILY', 'WEEKLY', 'MONTHLY'].map((freq) => {
                    const tasks = groupedTasks[freq as keyof typeof groupedTasks];
                    if (tasks.length === 0) return null;

                    return (
                        <div key={freq} className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                {freq === 'DAILY' ? <Clock className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                                <h4 className="text-sm font-bold uppercase tracking-widest">
                                    {freq === 'DAILY' ? 'Tareas Diarias' : freq === 'WEEKLY' ? 'Tareas Semanales' : 'Tareas Mensuales'}
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {tasks.map(task => (
                                    <button
                                        key={task.id}
                                        onClick={() => handleToggleComplete(task.id, task.isCompletedToday)}
                                        className={`group relative flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 ${task.isCompletedToday
                                                ? 'bg-emerald-500/5 border-emerald-500/20 opacity-75'
                                                : 'bg-surface border-white/5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5'
                                            }`}
                                    >
                                        <div className={`flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${task.isCompletedToday ? 'text-emerald-500' : 'text-slate-600'
                                            }`}>
                                            {task.isCompletedToday ? (
                                                <CheckCircle2 className="w-8 h-8" />
                                            ) : (
                                                <Circle className="w-8 h-8" />
                                            )}
                                        </div>

                                        <div className="flex-1 text-left min-w-0">
                                            <h5 className={`font-bold transition-colors ${task.isCompletedToday ? 'text-emerald-300 line-through decoration-emerald-500/50' : 'text-white'
                                                }`}>
                                                {task.name}
                                            </h5>
                                            <p className="text-sm text-slate-500 truncate">
                                                {task.description || 'Sin descripción'}
                                            </p>
                                            {task.lastCompletion && (
                                                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
                                                    <CheckSquare className="w-3 h-3" />
                                                    Último: {format(new Date(task.lastCompletion.completedAt), 'HH:mm (dd/MM)')} por {task.lastCompletion.completedBy}
                                                </div>
                                            )}
                                        </div>

                                        {!task.isCompletedToday && (
                                            <div className="absolute top-4 right-4 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                MARCAR
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {stats.total === 0 && (
                <div className="text-center py-20 bg-surface border border-dashed border-white/10 rounded-2xl">
                    <ListTodo className="w-16 h-16 mx-auto mb-4 text-slate-600 opacity-20" />
                    <h3 className="text-xl font-bold text-white mb-2">No hay tareas programadas</h3>
                    <p className="text-slate-500 max-w-xs mx-auto">
                        Parece que no tienes tareas HACCP configuradas hoy. Ve a la pestaña de Tareas para añadir algunas.
                    </p>
                </div>
            )}
        </div>
    );
};
