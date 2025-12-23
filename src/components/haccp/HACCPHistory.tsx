import React, { useState, useMemo } from 'react';
import { History, Download, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';

type DateRange = '7d' | '30d' | '90d' | 'custom';
type StatusFilter = 'all' | 'CORRECT' | 'WARNING' | 'CRITICAL';

export const HACCPHistory: React.FC = () => {
    const { pccs, haccpLogs } = useStore();
    const [dateRange, setDateRange] = useState<DateRange>('7d');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [selectedPCC, setSelectedPCC] = useState<string>('all');

    // Calculate date filter
    const dateFilter = useMemo(() => {
        const now = new Date();
        switch (dateRange) {
            case '7d': return subDays(now, 7);
            case '30d': return subDays(now, 30);
            case '90d': return subDays(now, 90);
            default: return subDays(now, 7);
        }
    }, [dateRange]);

    // Filter logs
    const filteredLogs = useMemo(() => {
        return haccpLogs
            .filter((log: import('../../types').HACCPLog) => {
                const logDate = new Date(log.timestamp);
                if (logDate < dateFilter) return false;
                if (statusFilter !== 'all' && log.status !== statusFilter) return false;
                if (selectedPCC !== 'all' && log.pccId !== selectedPCC) return false;
                return true;
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [haccpLogs, dateFilter, statusFilter, selectedPCC]);

    // Stats
    const stats = useMemo(() => {
        const total = filteredLogs.length;
        const correct = filteredLogs.filter(l => l.status === 'CORRECT').length;
        const warnings = filteredLogs.filter(l => l.status === 'WARNING').length;
        const critical = filteredLogs.filter(l => l.status === 'CRITICAL').length;
        const complianceRate = total > 0 ? ((correct / total) * 100).toFixed(1) : '0';

        return { total, correct, warnings, critical, complianceRate };
    }, [filteredLogs]);

    // Get PCC name by ID
    const getPCCName = (pccId: string) => {
        return pccs.find(p => p.id === pccId)?.name || 'Desconocido';
    };

    // Export to Excel
    const handleExport = () => {
        const data = filteredLogs.map(log => ({
            'Fecha': format(new Date(log.timestamp), 'dd/MM/yyyy', { locale: es }),
            'Hora': format(new Date(log.timestamp), 'HH:mm', { locale: es }),
            'Punto Control': getPCCName(log.pccId),
            'Valor': log.value,
            'Estado': log.status === 'CORRECT' ? 'Correcto' : log.status === 'WARNING' ? 'Advertencia' : 'Crítico',
            'Notas': log.notes || ''
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Registros HACCP');
        XLSX.writeFile(wb, `haccp-registros-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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
        <div className="space-y-6">
            {/* Header with Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Historial de Registros
                </h3>

                <div className="flex flex-wrap gap-3">
                    {/* Date Range */}
                    <div className="flex bg-surface rounded-lg p-1">
                        {(['7d', '30d', '90d'] as DateRange[]).map(range => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${dateRange === range ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                {range === '7d' ? '7 días' : range === '30d' ? '30 días' : '90 días'}
                            </button>
                        ))}
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                        className="bg-surface border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-primary"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="CORRECT">Solo Correctos</option>
                        <option value="WARNING">Advertencias</option>
                        <option value="CRITICAL">Críticos</option>
                    </select>

                    {/* PCC Filter */}
                    <select
                        value={selectedPCC}
                        onChange={(e) => setSelectedPCC(e.target.value)}
                        className="bg-surface border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-primary"
                    >
                        <option value="all">Todos los PCC</option>
                        {pccs.map(pcc => (
                            <option key={pcc.id} value={pcc.id}>{pcc.name}</option>
                        ))}
                    </select>

                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Exportar
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-surface border border-white/5 rounded-xl p-4">
                    <p className="text-slate-400 text-xs mb-1">Total Registros</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="bg-surface border border-white/5 rounded-xl p-4">
                    <p className="text-slate-400 text-xs mb-1">Correctos</p>
                    <p className="text-2xl font-bold text-emerald-400">{stats.correct}</p>
                </div>
                <div className="bg-surface border border-white/5 rounded-xl p-4">
                    <p className="text-slate-400 text-xs mb-1">Advertencias</p>
                    <p className="text-2xl font-bold text-amber-400">{stats.warnings}</p>
                </div>
                <div className="bg-surface border border-white/5 rounded-xl p-4">
                    <p className="text-slate-400 text-xs mb-1">Críticos</p>
                    <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
                </div>
                <div className="bg-surface border border-white/5 rounded-xl p-4">
                    <p className="text-slate-400 text-xs mb-1">Cumplimiento</p>
                    <p className="text-2xl font-bold text-primary">{stats.complianceRate}%</p>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-black/20 text-slate-400 text-xs uppercase">
                            <tr>
                                <th className="px-4 py-3 text-left">Fecha/Hora</th>
                                <th className="px-4 py-3 text-left">Punto Control</th>
                                <th className="px-4 py-3 text-center">Valor</th>
                                <th className="px-4 py-3 text-center">Estado</th>
                                <th className="px-4 py-3 text-left">Notas</th>
                                <th className="px-4 py-3 text-center">Docs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-white/[0.02]">
                                    <td className="px-4 py-3">
                                        <div className="font-mono text-slate-300">
                                            {format(new Date(log.timestamp), 'dd/MM', { locale: es })}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {format(new Date(log.timestamp), 'HH:mm', { locale: es })}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-white font-medium">
                                        {getPCCName(log.pccId)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="font-mono font-bold text-white">{log.value}°C</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(log.status)}`}>
                                            {log.status === 'CORRECT' ? (
                                                <><CheckCircle className="w-3 h-3" /> OK</>
                                            ) : (
                                                <><AlertTriangle className="w-3 h-3" /> {log.status}</>
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-400 text-xs max-w-[200px] truncate">
                                        {log.notes || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {log.pdfUrl ? (
                                            <a
                                                href={log.pdfUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:text-blue-400 transition-colors inline-block"
                                                title="Ver PDF"
                                            >
                                                <FileText size={16} />
                                            </a>
                                        ) : '—'}
                                    </td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                        No hay registros para los filtros seleccionados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
