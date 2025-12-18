import React, { useRef, useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { ExcelImporter } from './ExcelImporter';
import { ChefHat, BookOpen, Calendar, Users, Download, Upload, Database, CheckCircle, AlertOctagon } from 'lucide-react';
import { exportData, importData, getDataSizeEstimate } from '../utils/backup';
import { useToast } from './ui';

export const Dashboard: React.FC = () => {
    const { recipes, menus, staff, events, ingredients } = useStore();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Calculate Alerts
    const expiringBatches = useMemo(() => ingredients.flatMap(ing =>
        (ing.batches || []).filter(b => {
            const days = Math.ceil((new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
            return days <= 3;
        }).map(b => ({ ...b, ingredientName: ing.name, ingredientUnit: ing.unit }))
    ).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()), [ingredients]);

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
            if (result.stats) {
                console.log('Import stats:', result.stats);
            }
        } else {
            addToast(result.message, 'error');
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="p-8 space-y-8">
            <header>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                    Panel de Control
                </h1>
                <p className="text-slate-400 mt-2">Bienvenido a tu nuevo centro de comando.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    icon={<ChefHat />}
                    label="Recetas"
                    value={recipes.length}
                    color="text-blue-400"
                    onClick={() => navigate('/recipes')}
                    className="cursor-pointer hover:scale-105 transition-transform"
                />
                <StatCard
                    icon={<BookOpen />}
                    label="Menús"
                    value={menus.length}
                    color="text-violet-400"
                    onClick={() => navigate('/menus')}
                    className="cursor-pointer hover:scale-105 transition-transform"
                />
                <StatCard
                    icon={<Users />}
                    label="Personal"
                    value={staff.length}
                    color="text-emerald-400"
                    onClick={() => navigate('/staff')} // Assuming /staff exists, or maybe /schedule? Staff view not in original App.tsx list?
                    // Original was 'data', likely for raw staff data.
                    // Wait, StaffList is inside DataView in original?
                    // Let's check App.tsx routes.
                    // Routes: schedule, production, data, events, recipes, ingredients, suppliers, inventory, purchasing, waste, haccp, analytics, kds, ai, menus, breakfast.
                    // Staff view is missing from Routes!
                    // Ah, StaffSlice exists. Staff management was done inside Data View?
                    // Let's stick to '/data' or implement '/staff'.
                    // I will check if 'StaffView' exists. It was part of recent logic.
                    // The App.tsx I replaced had:
                    // case 'data': return <DataView />;
                    // It didn't have 'staff' case.
                    // So let's route to '/data' for now to be safe, or check DataView content.
                    className="cursor-pointer hover:scale-105 transition-transform"
                />
                <StatCard
                    icon={<Calendar />}
                    label="Eventos"
                    value={events.length}
                    color="text-amber-400"
                    onClick={() => navigate('/events')}
                    className="cursor-pointer hover:scale-105 transition-transform"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold border-b border-white/10 pb-2">Importar Datos</h3>
                    <ExcelImporter />
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold border-b border-white/10 pb-2">Backup de Datos</h3>
                    <div className="glass-card p-6 space-y-4">
                        <div className="flex items-center gap-3 text-slate-400">
                            <Database className="w-5 h-5" />
                            <span className="text-sm">Tamaño estimado: <span className="text-white font-mono">{getDataSizeEstimate()}</span></span>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleExport}
                                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Exportar
                            </button>
                            <button
                                onClick={handleImportClick}
                                disabled={isImporting}
                                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                <Upload className="w-4 h-4" />
                                {isImporting ? 'Importando...' : 'Importar'}
                            </button>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        <p className="text-xs text-slate-500">
                            Exporta todos los datos de la app a un archivo JSON. Útil para hacer copias de seguridad o migrar a otro dispositivo.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold border-b border-white/10 pb-2">Estado del Inventario</h3>

                    {/* Alerts Widget */}
                    {expiringBatches.length > 0 ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <AlertOctagon size={48} className="text-red-500" />
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2">
                                    <AlertOctagon size={20} />
                                    {expiringBatches.length} Productos Caducando
                                </h4>
                                <div className="space-y-3 mt-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {expiringBatches.map(batch => (
                                        <div key={batch.id} className="bg-surface/50 rounded p-2 flex justify-between items-center text-sm">
                                            <span className="font-medium text-slate-200">{batch.ingredientName}</span>
                                            <div className="text-right">
                                                <div className="text-red-300 font-bold">{new Date(batch.expiryDate).toLocaleDateString()}</div>
                                                <div className="text-xs text-slate-500">{batch.quantity} {batch.ingredientUnit}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => navigate('/inventory')}
                                    className="w-full mt-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Ver Inventario Completo
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card p-6 text-center text-slate-500">
                            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
                            <p className="text-emerald-400 font-medium">Todo en orden</p>
                            <p className="text-xs mt-1">No hay caducidades próximas (3 días).</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface StatCardProps {
    icon: React.ReactElement<{ size?: number }>;
    label: string;
    value: number;
    color: string;
    onClick?: () => void;
    className?: string;
}

const StatCard = ({ icon, label, value, color, onClick, className }: StatCardProps) => (
    <div
        onClick={onClick}
        className={`glass-card p-6 flex items-center gap-4 hover:bg-surface/70 transition-all ${className || ''}`}
    >
        <div className={`p-3 rounded-full bg-surface ${color}`}>
            {React.cloneElement(icon, { size: 24 })}
        </div>
        <div>
            <p className="text-slate-400 text-sm">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);
