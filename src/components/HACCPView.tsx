import React, { useState } from 'react';
import { ClipboardList, Settings, Thermometer, ListChecks, History, Bell, Import } from 'lucide-react';
import { DataImportModal } from './common/DataImportModal';
import { useStore } from '../store/useStore';
import { useToast } from './ui';
import type { HACCPLog } from '../types';
import { PCCConfiguration } from './haccp/PCCConfiguration';
import { DailyRegisters } from './haccp/DailyRegisters';
import { TaskManager } from './haccp/TaskManager';
import { HACCPHistory } from './haccp/HACCPHistory';
import { HACCPAlerts } from './haccp/HACCPAlerts';
import { ChecklistView } from './haccp/ChecklistView';

type TabId = 'alerts' | 'checklist' | 'daily' | 'tasks' | 'history' | 'config';

interface TabConfig {
    id: TabId;
    label: string;
    icon: React.ReactNode;
}

const tabs: TabConfig[] = [
    { id: 'alerts', label: 'Alertas', icon: <Bell className="w-4 h-4" /> },
    { id: 'checklist', label: 'Checklist', icon: <ListChecks className="w-4 h-4" /> },
    { id: 'daily', label: 'Registros', icon: <Thermometer className="w-4 h-4" /> },
    { id: 'tasks', label: 'Gestión Tareas', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'history', label: 'Histórico', icon: <History className="w-4 h-4" /> },
    { id: 'config', label: 'Puntos Críticos', icon: <Settings className="w-4 h-4" /> },
];

export const HACCPView: React.FC = () => {
    const { pccs, addHACCPLog } = useStore();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<TabId>('alerts');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const handleImportComplete = (data: any) => {
        const entries = data.entries || [];
        const activePCCs = pccs.filter(p => p.isActive);
        let matchedCount = 0;

        entries.forEach((entry: any) => {
            // Fuzzy match PCC name
            const scannedName = (entry.pccName || '').toLowerCase();
            const match = activePCCs.find(p => {
                const pName = p.name.toLowerCase();
                return pName.includes(scannedName) || scannedName.includes(pName);
            });

            if (match && entry.value) {
                const value = parseFloat(entry.value);

                let status: 'CORRECT' | 'WARNING' | 'CRITICAL' = 'CORRECT';
                if (match.minTemp !== undefined && match.maxTemp !== undefined) {
                    if (value < match.minTemp || value > match.maxTemp) {
                        status = 'CRITICAL';
                    } else if (value === match.minTemp || value === match.maxTemp) {
                        status = 'WARNING';
                    }
                }

                const newLog: HACCPLog = {
                    id: crypto.randomUUID(),
                    pccId: match.id,
                    value,
                    timestamp: entry.date && entry.time ? `${entry.date}T${entry.time}` : new Date().toISOString(),
                    userId: 'current-user', // In a real app, this would be the logged-in user
                    status,
                    notes: entry.status !== 'CORRECT' ? `Scanned: ${entry.status}` : undefined
                };

                addHACCPLog(newLog);
                matchedCount++;
            }
        });

        if (matchedCount > 0) {
            addToast(`Se han importado ${matchedCount} registros correctamente`, 'success');
        } else {
            addToast('No se encontraron coincidencias en los puntos críticos', 'warning');
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'alerts': return <HACCPAlerts />;
            case 'checklist': return <ChecklistView />;
            case 'daily': return <DailyRegisters />;
            case 'tasks': return <TaskManager />;
            case 'history': return <HACCPHistory />;
            case 'config': return <PCCConfiguration />;
            default: return <HACCPAlerts />;
        }
    };

    return (
        <div className="space-y-6 p-6 md:p-8 animate-in fade-in duration-500">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-3">
                        <ClipboardList className="w-8 h-8 text-emerald-400" />
                        HACCP Digital
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Control de Puntos Críticos y Registros de Temperatura
                    </p>
                </div>
                <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/25"
                >
                    <Import className="w-4 h-4" />
                    Importar / Escanear
                </button>
            </header>

            <DataImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                type="haccp"
                onImportComplete={handleImportComplete}
            />

            {/* Navigation Tabs */}
            <div className="flex gap-1 bg-surface p-1 rounded-xl border border-white/5 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${activeTab === tab.id
                            ? 'bg-primary text-white shadow-lg shadow-primary/25'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {renderContent()}
            </div>
        </div>
    );
};
