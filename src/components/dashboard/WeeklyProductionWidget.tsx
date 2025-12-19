import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChefHat, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WeeklyProductionWidget: React.FC = () => {
    const { productionTasks, events } = useStore(); // productionTasks is Record<eventId, KanbanTask[]>
    const navigate = useNavigate();
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    const tasks = useMemo(() => {
        const allTasks: any[] = [];

        // Iterate only relevant events (this week's events)
        // Or check all tasks if they have assignedDate?
        // Let's filter events first for performance.
        const weekEvents = events.filter(e => {
            const d = parseISO(e.date);
            return isWithinInterval(d, { start: weekStart, end: weekEnd });
        });

        weekEvents.forEach(event => {
            const eventTasks = productionTasks[event.id] || [];
            eventTasks.forEach(task => {
                if (task.status !== 'done') {
                    allTasks.push({
                        ...task,
                        eventName: event.name,
                        eventDate: event.date
                    });
                }
            });
        });

        // Also check if tasks have assignedDate within this week (even if event is later/earlier?)
        // Currently model ties tasks strongly to events. Let's stick to Event Date logic for simplicity or assignedDate if present.
        // If task has assignedDate, use that.

        return allTasks.sort((a, b) => {
            const dateA = a.assignedDate || a.eventDate;
            const dateB = b.assignedDate || b.eventDate;
            return new Date(dateA).getTime() - new Date(dateB).getTime();
        });
    }, [productionTasks, events, weekStart, weekEnd]);

    return (
        <div className="glass-card p-0 flex flex-col h-full">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-surface/50">
                <h3 className="font-bold flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-indigo-400" />
                    Producción Semanal
                </h3>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full border border-indigo-500/20">
                    {tasks.length} Pendientes
                </span>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar p-2">
                {tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                        <CheckCircle className="w-8 h-8 opacity-20" />
                        <p className="text-sm">Producción al día</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {tasks.map(task => (
                            <div key={task.id} className="p-3 rounded-lg bg-surface border border-white/5 hover:bg-white/5 transition-colors group">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="font-medium text-slate-200 line-clamp-1">{task.title}</div>
                                    <div className="text-[10px] uppercase font-bold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                                        {task.station || 'General'}
                                    </div>
                                </div>

                                <div className="text-xs text-slate-500 flex justify-between items-center">
                                    <span>{task.quantity} {task.unit}</span>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                            {format(parseISO(task.assignedDate || task.eventDate), 'EEE d', { locale: es })}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-[10px] text-slate-600 truncate mt-1">
                                    Evento: {task.eventName}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="p-3 border-t border-white/10 bg-surface/30">
                <button onClick={() => navigate('/production')} className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors">
                    Ver Tablero Kanban →
                </button>
            </div>
        </div>
    );
};
