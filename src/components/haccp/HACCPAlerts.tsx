import React, { useMemo } from 'react';
import { AlertTriangle, Bell, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { format, subHours } from 'date-fns';
import { es } from 'date-fns/locale';

interface Alert {
    id: string;
    type: 'critical' | 'warning' | 'overdue' | 'info';
    title: string;
    description: string;
    timestamp: Date;
    pccId?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export const HACCPAlerts: React.FC = () => {
    const { pccs, haccpLogs, haccpTasks, haccpTaskCompletions, notifications } = useStore();

    // Generate alerts based on current data
    const alerts = useMemo(() => {
        const alertList: Alert[] = [];
        const now = new Date();
        const today = format(now, 'yyyy-MM-dd');

        // 1. Check for critical temperature readings in last 4 hours
        const recentLogs = haccpLogs.filter(log =>
            new Date(log.timestamp) > subHours(now, 4)
        );

        recentLogs.forEach(log => {
            if (log.status === 'CRITICAL') {
                const pcc = pccs.find(p => p.id === log.pccId);
                alertList.push({
                    id: `critical-${log.id}`,
                    type: 'critical',
                    title: `Temperatura Crítica: ${pcc?.name}`,
                    description: `Registrada ${log.value}°C a las ${format(new Date(log.timestamp), 'HH:mm')}. Rango permitido: ${pcc?.minTemp}°C - ${pcc?.maxTemp}°C`,
                    timestamp: new Date(log.timestamp),
                    pccId: log.pccId
                });
            } else if (log.status === 'WARNING') {
                const pcc = pccs.find(p => p.id === log.pccId);
                alertList.push({
                    id: `warning-${log.id}`,
                    type: 'warning',
                    title: `Advertencia: ${pcc?.name}`,
                    description: `Temperatura en límite (${log.value}°C) registrada a las ${format(new Date(log.timestamp), 'HH:mm')}`,
                    timestamp: new Date(log.timestamp),
                    pccId: log.pccId
                });
            }
        });

        // 2. Check for overdue tasks
        const activeTasks = haccpTasks.filter(t => t.isActive);
        activeTasks.forEach(task => {
            const completionsToday = haccpTaskCompletions.filter(
                c => c.taskId === task.id && c.completedAt.startsWith(today)
            );

            if (task.frequency === 'DAILY' && completionsToday.length === 0) {
                alertList.push({
                    id: `overdue-${task.id}`,
                    type: 'overdue',
                    title: `Tarea pendiente: ${task.name}`,
                    description: task.description || 'Esta tarea diaria aún no se ha completado hoy.',
                    timestamp: now
                });
            }
        });

        // 3. Check for PCCs without readings today
        pccs.filter(p => p.isActive).forEach(pcc => {
            const todayLogs = haccpLogs.filter(
                log => log.pccId === pcc.id && log.timestamp.startsWith(today)
            );

            if (todayLogs.length === 0) {
                alertList.push({
                    id: `no-reading-${pcc.id}`,
                    type: 'info',
                    title: `Sin registros: ${pcc.name}`,
                    description: 'No hay lecturas de temperatura registradas hoy para este punto de control.',
                    timestamp: now,
                    pccId: pcc.id
                });
            }
        });

        // 4. Add Backend/AI Notifications
        notifications.filter(n => !n.read && n.type === 'HACCP_ALERT').forEach(n => {
            alertList.push({
                id: n.id,
                type: 'critical', // Treat AI alerts as critical/warning based on message? defaulting to critical/warning style usually
                title: 'Alerta IA: Anomalía Detectada',
                description: n.message,
                timestamp: new Date(n.timestamp?.toDate ? n.timestamp.toDate() : n.timestamp), // Handle Firestore Timestamp
                pccId: n.pccId
            });
        });

        // Sort by type priority and timestamp
        return alertList.sort((a, b) => {
            const priority = { critical: 0, warning: 1, overdue: 2, info: 3 };
            if (priority[a.type] !== priority[b.type]) {
                return priority[a.type] - priority[b.type];
            }
            return b.timestamp.getTime() - a.timestamp.getTime();
        });
    }, [pccs, haccpLogs, haccpTasks, haccpTaskCompletions, notifications]);

    const getAlertStyle = (type: Alert['type']) => {
        switch (type) {
            case 'critical':
                return {
                    bg: 'bg-red-500/10 border-red-500/30',
                    icon: <XCircle className="w-5 h-5 text-red-400" />,
                    badge: 'bg-red-500 text-white'
                };
            case 'warning':
                return {
                    bg: 'bg-amber-500/10 border-amber-500/30',
                    icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
                    badge: 'bg-amber-500 text-white'
                };
            case 'overdue':
                return {
                    bg: 'bg-orange-500/10 border-orange-500/30',
                    icon: <Clock className="w-5 h-5 text-orange-400" />,
                    badge: 'bg-orange-500 text-white'
                };
            case 'info':
                return {
                    bg: 'bg-blue-500/10 border-blue-500/30',
                    icon: <Bell className="w-5 h-5 text-blue-400" />,
                    badge: 'bg-blue-500 text-white'
                };
        }
    };

    const criticalCount = alerts.filter(a => a.type === 'critical').length;
    const warningCount = alerts.filter(a => a.type === 'warning' || a.type === 'overdue').length;

    return (
        <div className="space-y-6">
            {/* Summary Banner */}
            <div className={`flex items-center justify-between p-4 rounded-xl border ${criticalCount > 0
                ? 'bg-red-500/10 border-red-500/30'
                : warningCount > 0
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-emerald-500/10 border-emerald-500/30'
                }`}>
                <div className="flex items-center gap-3">
                    {criticalCount > 0 ? (
                        <XCircle className="w-6 h-6 text-red-400" />
                    ) : warningCount > 0 ? (
                        <AlertTriangle className="w-6 h-6 text-amber-400" />
                    ) : (
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                    )}
                    <div>
                        <h3 className={`font-bold ${criticalCount > 0 ? 'text-red-400' : warningCount > 0 ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                            {criticalCount > 0
                                ? `${criticalCount} alerta(s) crítica(s)`
                                : warningCount > 0
                                    ? `${warningCount} advertencia(s) pendiente(s)`
                                    : 'Todos los controles correctos'}
                        </h3>
                        <p className="text-sm text-slate-400">
                            Última actualización: {format(new Date(), 'HH:mm', { locale: es })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Alerts List */}
            <div className="space-y-3">
                {alerts.map(alert => {
                    const style = getAlertStyle(alert.type);
                    return (
                        <div
                            key={alert.id}
                            className={`flex items-start gap-4 p-4 rounded-xl border ${style.bg}`}
                        >
                            {style.icon}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-white">{alert.title}</h4>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${style.badge}`}>
                                        {alert.type}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400">{alert.description}</p>
                            </div>
                            <span className="text-xs text-slate-500 whitespace-nowrap">
                                {format(alert.timestamp, 'HH:mm')}
                            </span>
                        </div>
                    );
                })}

                {alerts.length === 0 && (
                    <div className="text-center py-12">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-400 opacity-50" />
                        <h3 className="font-medium text-white mb-2">Sin alertas activas</h3>
                        <p className="text-sm text-slate-500">Todos los controles HACCP están en orden.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
