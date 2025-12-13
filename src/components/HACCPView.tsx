import React, { useState } from 'react';
import { ClipboardList, Settings, Thermometer, ListChecks, History, Bell } from 'lucide-react';
import { PCCConfiguration } from './haccp/PCCConfiguration';
import { DailyRegisters } from './haccp/DailyRegisters';
import { TaskManager } from './haccp/TaskManager';
import { HACCPHistory } from './haccp/HACCPHistory';
import { HACCPAlerts } from './haccp/HACCPAlerts';

type TabId = 'alerts' | 'daily' | 'tasks' | 'history' | 'config';

interface TabConfig {
    id: TabId;
    label: string;
    icon: React.ReactNode;
}

const tabs: TabConfig[] = [
    { id: 'alerts', label: 'Alertas', icon: <Bell className="w-4 h-4" /> },
    { id: 'daily', label: 'Registros', icon: <Thermometer className="w-4 h-4" /> },
    { id: 'tasks', label: 'Tareas', icon: <ListChecks className="w-4 h-4" /> },
    { id: 'history', label: 'Histórico', icon: <History className="w-4 h-4" /> },
    { id: 'config', label: 'Configuración', icon: <Settings className="w-4 h-4" /> },
];

export const HACCPView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabId>('alerts');

    const renderContent = () => {
        switch (activeTab) {
            case 'alerts': return <HACCPAlerts />;
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
            </header>

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
