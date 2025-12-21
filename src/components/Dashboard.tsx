import React from 'react';
import { useStore } from '../store/useStore';


import { Download, Upload, Database } from 'lucide-react';
import { exportData, importData, getDataSizeEstimate } from '../utils/backup';
import { useToast } from './ui';

// Widgets
import { WeeklyRosterWidget } from './dashboard/WeeklyRosterWidget';
import { MonthlyEventsWidget } from './dashboard/MonthlyEventsWidget';
import { WeeklyProductionWidget } from './dashboard/WeeklyProductionWidget';
import { OrdersWidget } from './dashboard/OrdersWidget';
import { HACCPWidget } from './dashboard/HACCPWidget';

export const Dashboard: React.FC = () => {
    const { currentUser } = useStore();
    const { addToast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = React.useState(false);

    const handleExport = () => {
        try {
            exportData();
            addToast('Backup exportado correctamente', 'success');
        } catch (error) {
            addToast('Error al exportar backup', 'error');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const result = await importData(file, 'replace');
        setIsImporting(false);

        if (result.success) {
            addToast(result.message, 'success');
        } else {
            addToast(result.message, 'error');
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="p-6 h-full flex flex-col gap-6 overflow-hidden">
            <header className="flex justify-between items-end shrink-0">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Centro de Mando
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Hola, <span className="text-white font-medium">{currentUser?.name || 'Chef'}</span>. Aquí tienes el resumen operativo.
                    </p>
                </div>

                {/* Quick Actions / System Status */}
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="bg-surface hover:bg-white/10 text-slate-400 hover:text-white p-2.5 rounded-lg border border-white/5 transition-colors"
                        title="Exportar Backup"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                    {/* Could add more quick actions here */}
                </div>
            </header>

            {/* HACCP Alert Row */}
            <div className="shrink-0">
                <HACCPWidget />
            </div>

            {/* Main Grid Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-0 overflow-y-auto lg:overflow-visible">

                {/* Column 1: Roster (Wide) */}
                <div className="lg:col-span-2 xl:col-span-2 h-[400px] lg:h-full min-h-[400px]">
                    <WeeklyRosterWidget />
                </div>

                {/* Column 2: Events & Production */}
                <div className="flex flex-col gap-6 h-[800px] lg:h-full lg:col-span-1">
                    <div className="flex-1 min-h-[300px]">
                        <MonthlyEventsWidget />
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <WeeklyProductionWidget />
                    </div>
                </div>

                {/* Column 3: Orders & Backup/Tools */}
                <div className="flex flex-col gap-6 h-[800px] lg:h-full lg:col-span-1">
                    <div className="flex-1 min-h-[300px]">
                        <OrdersWidget />
                    </div>

                    {/* Backup & System Info Widget */}
                    <div className="glass-card p-4 space-y-4 shrink-0">
                        <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-white/10 pb-2">
                            <Database className="w-4 h-4 text-primary" />
                            Sistema
                        </div>
                        <div className="text-xs text-slate-400 space-y-2">
                            <div className="flex justify-between">
                                <span>Backup Size:</span>
                                <span className="text-white font-mono">{getDataSizeEstimate()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Versión:</span>
                                <span className="text-white font-mono">2.0.1</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <button
                                onClick={handleImportClick}
                                disabled={isImporting}
                                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 py-2 rounded text-xs transition-colors"
                            >
                                <Upload className="w-3 h-3" />
                                Importar
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
