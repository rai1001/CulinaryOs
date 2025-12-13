import React, { useState, useMemo } from 'react';
import { Save, AlertTriangle, CheckCircle, Thermometer, Plus } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useToast } from '../ui';
import type { HACCPLog, PCC } from '../../types';

export const DailyRegisters: React.FC = () => {
    const { pccs, haccpLogs, addHACCPLog } = useStore();
    const { addToast } = useToast();
    const [inputs, setInputs] = useState<Record<string, string>>({});
    const [notes, setNotes] = useState<Record<string, string>>({});

    const activePCCs = useMemo(() => pccs.filter(p => p.isActive), [pccs]);

    const getTodayLogs = (pccId: string) => {
        const today = new Date().toISOString().slice(0, 10);
        return haccpLogs
            .filter(log => log.pccId === pccId && log.timestamp.startsWith(today))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    };

    const handleInputChange = (pccId: string, value: string) => {
        setInputs(prev => ({ ...prev, [pccId]: value }));
    };

    const handleNotesChange = (pccId: string, value: string) => {
        setNotes(prev => ({ ...prev, [pccId]: value }));
    };

    const handleSave = (pcc: PCC) => {
        const rawValue = inputs[pcc.id];
        if (!rawValue) return;

        const value = parseFloat(rawValue);

        let status: 'CORRECT' | 'WARNING' | 'CRITICAL' = 'CORRECT';
        if (pcc.minTemp !== undefined && pcc.maxTemp !== undefined) {
            if (value < pcc.minTemp || value > pcc.maxTemp) {
                status = 'CRITICAL';
            } else if (value === pcc.minTemp || value === pcc.maxTemp) {
                status = 'WARNING';
            }
        }

        const newLog: HACCPLog = {
            id: crypto.randomUUID(),
            pccId: pcc.id,
            value,
            timestamp: new Date().toISOString(),
            userId: 'current-user',
            status,
            notes: notes[pcc.id] || undefined
        };

        addHACCPLog(newLog);

        // Show toast
        if (status === 'CRITICAL') {
            addToast(`⚠️ Temperatura CRÍTICA registrada: ${value}°C`, 'error');
        } else if (status === 'WARNING') {
            addToast(`Advertencia: temperatura en límite (${value}°C)`, 'warning');
        } else {
            addToast(`Temperatura registrada: ${value}°C ✓`, 'success');
        }

        // Clear inputs
        setInputs(prev => ({ ...prev, [pcc.id]: '' }));
        setNotes(prev => ({ ...prev, [pcc.id]: '' }));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CORRECT': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
            case 'WARNING': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
            case 'CRITICAL': return 'text-red-400 bg-red-500/10 border-red-500/30';
            default: return 'text-slate-400 bg-slate-500/10';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-primary" />
                    Entrada Rápida
                </h3>

                {activePCCs.map(pcc => (
                    <div key={pcc.id} className="bg-surface border border-white/5 p-5 rounded-xl">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-medium text-white">{pcc.name}</h4>
                                <span className="text-xs text-slate-500">
                                    Rango: {pcc.minTemp}°C - {pcc.maxTemp}°C
                                </span>
                            </div>
                            {getTodayLogs(pcc.id).length > 0 && (
                                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                                    {getTodayLogs(pcc.id).length} hoy
                                </span>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Temperatura"
                                        value={inputs[pcc.id] || ''}
                                        onChange={(e) => handleInputChange(pcc.id, e.target.value)}
                                        className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">°C</span>
                                </div>
                                <button
                                    onClick={() => handleSave(pcc)}
                                    disabled={!inputs[pcc.id]}
                                    className="bg-primary hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 rounded-lg flex items-center justify-center transition-colors"
                                >
                                    <Save className="w-5 h-5" />
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="Notas (opcional)"
                                value={notes[pcc.id] || ''}
                                onChange={(e) => handleNotesChange(pcc.id, e.target.value)}
                                className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>
                ))}

                {activePCCs.length === 0 && (
                    <div className="p-8 text-center bg-surface border border-dashed border-white/10 rounded-xl">
                        <Plus className="w-8 h-8 mx-auto mb-3 text-slate-500" />
                        <p className="text-slate-400">No hay puntos críticos configurados.</p>
                        <p className="text-xs text-slate-500 mt-1">Ve a Configuración para añadir PCCs.</p>
                    </div>
                )}
            </div>

            {/* Today's Logs */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">
                    Registros de Hoy
                </h3>

                <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
                    {activePCCs.map(pcc => {
                        const logs = getTodayLogs(pcc.id);
                        if (logs.length === 0) return null;

                        return (
                            <div key={pcc.id} className="p-4 border-b border-white/5 last:border-0">
                                <h5 className="text-sm font-medium text-slate-400 mb-3">{pcc.name}</h5>
                                <div className="space-y-2">
                                    {logs.map(log => (
                                        <div key={log.id} className="flex justify-between items-center bg-black/20 p-3 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-xs text-slate-500">
                                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="font-bold text-white">
                                                    {log.value}°C
                                                </span>
                                                {log.notes && (
                                                    <span className="text-xs text-slate-500 italic truncate max-w-[100px]">
                                                        {log.notes}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getStatusColor(log.status)}`}>
                                                {log.status === 'CORRECT' ? (
                                                    <span className="flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" /> OK
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3" /> {log.status}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {activePCCs.every(pcc => getTodayLogs(pcc.id).length === 0) && (
                        <div className="p-8 text-center text-slate-500">
                            No hay registros hoy. Comienza registrando temperaturas.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
