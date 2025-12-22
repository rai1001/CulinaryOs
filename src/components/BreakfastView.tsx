import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useOutletScoping } from '../hooks/useOutletScoping';
import { Calendar, Users, Coffee, Upload, Trash2, Search, CheckCircle, Store } from 'lucide-react';
import { read, utils } from 'xlsx';
import { useToast } from './ui';

import { normalizeDate } from '../utils/date';

export const BreakfastView: React.FC = () => {
    const {
        breakfastServices, updateBreakfastService, importOccupancy,
        ingredients, fetchBreakfastServices, commitBreakfastConsumption
    } = useStore();
    const { isValidOutlet } = useOutletScoping();
    const { addToast } = useToast();

    // State
    const [selectedDate, setSelectedDate] = useState<string>(normalizeDate(new Date()));
    const [searchQuery, setSearchQuery] = useState('');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Derived State
    const currentService = breakfastServices.find(s => s.date === selectedDate) || {
        id: selectedDate,
        date: selectedDate,
        forecastPax: 0,
        realPax: 0,
        consumption: {}
    };

    const consumedIngredients = Object.entries(currentService.consumption || {}).map(([id, qty]) => {
        const ing = ingredients.find(i => i.id === id);
        return { id, qty, name: ing?.name || 'Unknown', unit: ing?.unit || 'units' };
    });

    // Effect to load data
    useEffect(() => {
        fetchBreakfastServices(); // Should probably check if loaded?
    }, [fetchBreakfastServices]);

    // Handlers
    const handlePaxChange = async (field: 'forecastPax' | 'realPax', value: number) => {
        await updateBreakfastService({
            ...currentService,
            [field]: value
        });
    };

    const handleAddConsumption = async (ingredientId: string) => {
        const currentQty = currentService.consumption?.[ingredientId] || 0;
        await updateBreakfastService({
            ...currentService,
            consumption: {
                ...currentService.consumption,
                [ingredientId]: currentQty + 1 // Default increment, user can edit
            }
        });
    };

    const handleUpdateConsumptionQty = async (ingredientId: string, qty: number) => {
        if (qty <= 0) {
            // Remove
            const newConsumption = { ...currentService.consumption };
            delete newConsumption[ingredientId];
            await updateBreakfastService({ ...currentService, consumption: newConsumption });
        } else {
            // Update
            await updateBreakfastService({
                ...currentService,
                consumption: {
                    ...currentService.consumption,
                    [ingredientId]: qty
                }
            });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            const workbook = read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = utils.sheet_to_json<unknown[][]>(worksheet, { header: 1 });

            // Expected format: Date (YYYY-MM-DD), Pax
            // Skip header if present (heuristic)
            const occupancyData = [];
            for (const row of jsonData) {
                const rowAny = row as unknown[];
                // Simple validation: row[0] looks like date?
                const dateRaw = rowAny[0];
                const paxRaw = rowAny[1];
                if (dateRaw && paxRaw) {
                    // Normalize date
                    let dateStr = dateRaw;
                    if (typeof dateRaw === 'number') {
                        // Serial date
                        const dateObj = new Date(Math.round((dateRaw - 25569) * 86400 * 1000));
                        dateStr = dateObj.toISOString().split('T')[0];
                    }
                    occupancyData.push({ date: String(dateStr), pax: Number(paxRaw) });
                }
            }

            if (occupancyData.length > 0) {
                await importOccupancy(occupancyData);
                addToast(`Importados ${occupancyData.length} registros`, 'success');
                setIsImportModalOpen(false);
            } else {
                addToast('No se encontraron datos válidos', 'error');
            }

        } catch (error) {
            console.error(error);
            addToast('Error al leer el archivo', 'error');
        }
    };

    // Filter ingredients for search
    const filteredIngredients = ingredients.filter(i =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !currentService.consumption?.[i.id]
    ).slice(0, 10);

    if (!isValidOutlet) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-2">
                    <Store className="w-8 h-8 text-slate-500" />
                </div>
                <h2 className="text-2xl font-bold text-white">Selecciona una Cocina</h2>
                <p className="text-slate-400 max-w-md">
                    Para gestionar los desayunos y consumos, primero debes seleccionar una cocina activa desde el menú lateral.
                </p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent flex items-center gap-3">
                        <Coffee className="text-orange-400" size={28} />
                        Servicio de Desayunos
                    </h2>
                    <p className="text-slate-400 mt-1">Gestión de ocupación y control de consumos</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 bg-surface hover:bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg transition-all"
                    >
                        <Upload size={20} />
                        Importar Ocupación
                    </button>
                    <div className="flex items-center gap-2 bg-surface border border-white/10 rounded-lg px-3 py-2">
                        <Calendar size={18} className="text-slate-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-white outline-none font-medium"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Occupancy Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-surface border border-white/5 p-6 rounded-xl">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Users size={20} className="text-indigo-400" />
                            Ocupación
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Previsión PAX</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        value={currentService.forecastPax}
                                        onChange={(e) => handlePaxChange('forecastPax', Number(e.target.value))}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg py-3 px-4 text-2xl font-bold text-indigo-400 focus:border-indigo-500 outline-none transition-colors"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">pers.</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Real PAX</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        value={currentService.realPax}
                                        onChange={(e) => handlePaxChange('realPax', Number(e.target.value))}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg py-3 px-4 text-2xl font-bold text-emerald-400 focus:border-emerald-500 outline-none transition-colors"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">pers.</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Desviación</span>
                                    <span className={`font-bold ${currentService.realPax > currentService.forecastPax ? 'text-orange-400' : 'text-slate-200'
                                        }`}>
                                        {currentService.realPax - currentService.forecastPax > 0 ? '+' : ''}
                                        {currentService.realPax - currentService.forecastPax}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Consumption Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface border border-white/5 p-6 rounded-xl min-h-[500px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Coffee size={20} className="text-orange-400" />
                                Diario de Consumos
                                {currentService.isCommitted && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/20 ml-2">
                                        <CheckCircle size={10} />
                                        Stock Descontado
                                    </span>
                                )}
                            </h3>
                            <div className="flex items-center gap-3">
                                {!currentService.isCommitted && consumedIngredients.length > 0 && (
                                    <button
                                        onClick={async () => {
                                            if (confirm('¿Confirmas el descuento de stock para estos consumos? Esta acción no se puede deshacer.')) {
                                                await commitBreakfastConsumption(currentService.id);
                                                addToast('Stock descontado correctamente', 'success');
                                            }
                                        }}
                                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
                                    >
                                        <CheckCircle size={14} />
                                        Confirmar Stock
                                    </button>
                                )}
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar ingrediente..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-orange-500 outline-none"
                                    />
                                    {searchQuery && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/10 rounded-lg shadow-xl overflow-hidden z-10">
                                            {filteredIngredients.map(ing => (
                                                <button
                                                    key={ing.id}
                                                    onClick={() => {
                                                        handleAddConsumption(ing.id);
                                                        setSearchQuery('');
                                                    }}
                                                    className="w-full text-left px-4 py-2 hover:bg-white/5 text-slate-300 text-sm flex justify-between group"
                                                >
                                                    <span>{ing.name}</span>
                                                    <span className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">Añadir</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1">
                            <table className="w-full text-left">
                                <thead className="text-xs uppercase bg-white/5 text-slate-400">
                                    <tr>
                                        <th className="p-3 rounded-l-lg">Ingrediente</th>
                                        <th className="p-3 text-right">Consumo</th>
                                        <th className="p-3 text-right rounded-r-lg">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-white">
                                    {consumedIngredients.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="p-8 text-center text-slate-500 italic">
                                                No hay consumos registrados hoy.
                                            </td>
                                        </tr>
                                    ) : (
                                        consumedIngredients.map(({ id, name, qty, unit }) => (
                                            <tr key={id} className="group hover:bg-white/5 transition-colors">
                                                <td className="p-3 font-medium">{name}</td>
                                                <td className="p-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.1"
                                                            value={qty}
                                                            onChange={(e) => handleUpdateConsumptionQty(id, Number(e.target.value))}
                                                            className="w-20 bg-black/20 border border-white/10 rounded px-2 py-1 text-right text-emerald-400 font-mono focus:border-emerald-500 outline-none"
                                                        />
                                                        <span className="text-slate-500 text-sm w-8">{unit}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <button
                                                        onClick={() => handleUpdateConsumptionQty(id, 0)}
                                                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-surface border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Importar Ocupación</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            Sube un archivo Excel (.xlsx) o CSV con las columnas: <br />
                            <code className="bg-black/30 px-1 rounded">Fecha (YYYY-MM-DD), PAX</code>
                        </p>

                        <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept=".xlsx,.csv"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Upload className="mx-auto text-slate-400 mb-4" size={32} />
                            <p className="text-slate-300 font-medium">Haz click o arrastra un archivo</p>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsImportModalOpen(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
