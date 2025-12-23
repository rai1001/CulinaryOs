import React, { useState, useEffect } from 'react';
import { OccupancyImport } from '../components/occupancy/OccupancyImport';
import { ConsumptionRatios } from '../components/occupancy/ConsumptionRatios';
import { getOccupancyForecast } from '../services/occupancyService';
import { calculateBreakfastNeeds } from '../services/breakfastCalculator';
import type { OccupancyData, IngredientNeed } from '../types/occupancy';
import { Calculator, Users, Clock, Calendar as CalendarIcon } from 'lucide-react';

export const HospitalityDashboard: React.FC = () => {
    const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([]);
    const [needs, setNeeds] = useState<IngredientNeed[]>([]);

    const fetchData = async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 14); // Fetch 2 weeks

            const data = await getOccupancyForecast(today, nextWeek);

            // De-duplicate: Keep only the latest entry for each date + mealType
            const deDuplicated = data.reduce((acc: OccupancyData[], curr) => {
                const dateKey = curr.date.toISOString().split('T')[0];
                const existingIdx = acc.findIndex(item =>
                    item.date.toISOString().split('T')[0] === dateKey &&
                    item.mealType === curr.mealType
                );

                if (existingIdx >= 0) {
                    // Keep the one with the latest updatedAt if available
                    const existing = acc[existingIdx];
                    const existingTime = (existing as any).updatedAt?.toMillis?.() || 0;
                    const currTime = (curr as any).updatedAt?.toMillis?.() || 0;
                    if (currTime >= existingTime) {
                        acc[existingIdx] = curr;
                    }
                } else {
                    acc.push(curr);
                }
                return acc;
            }, []);

            setOccupancyData(deDuplicated);
        } catch (error) {
            console.error("Error fetching occupancy:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCalculate = async () => {
        // Mock ratios for calculation demonstration
        const mockRatios = [
            { ingredientId: '1', ingredientName: 'Huevos', quantityPerPax: 2, unit: 'und', category: 'breakfast' as const },
            { ingredientId: '2', ingredientName: 'Café', quantityPerPax: 0.015, unit: 'kg', category: 'breakfast' as const },
            { ingredientId: '3', ingredientName: 'Pan', quantityPerPax: 1, unit: 'und', category: 'lunch' as const },
            { ingredientId: '4', ingredientName: 'Vino', quantityPerPax: 0.2, unit: 'L', category: 'dinner' as const },
        ];

        const calculated = await calculateBreakfastNeeds(occupancyData, mockRatios);
        setNeeds(calculated);
    };

    // Grouping by date
    const groupedData = occupancyData.reduce((acc, curr) => {
        const dateKey = curr.date.toLocaleDateString();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(curr);
        return acc;
    }, {} as Record<string, OccupancyData[]>);

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-slate-900">Hospitality Smart Manager v4</h1>
                <p className="text-slate-500">Planificación integral basada en ocupación.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <OccupancyImport onSuccess={fetchData} />
                </div>
                <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 h-fit">
                    <h3 className="text-lg font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                        <Users size={20} />
                        Resumen Ocupación
                    </h3>
                    <div className="text-3xl font-bold text-emerald-700 mb-1">
                        {occupancyData
                            .filter(d => {
                                const now = new Date();
                                const diff = d.date.getTime() - now.getTime();
                                return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
                            })
                            .reduce((acc, curr) => acc + curr.estimatedPax, 0)} PAX
                    </div>
                    <p className="text-sm text-emerald-600">Servicios próximos (7 días)</p>
                    <button
                        onClick={fetchData}
                        className="mt-4 text-xs font-semibold text-emerald-700 underline hover:text-emerald-800"
                    >
                        Actualizar vista
                    </button>
                </div>
            </div>

            {/* Daily Breakdown */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <CalendarIcon size={24} className="text-indigo-600" />
                    Desglose por Días
                </h3>

                {Object.keys(groupedData).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(groupedData).map(([date, services]) => (
                            <div key={date} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100 flex justify-between items-center">
                                    <span>{date}</span>
                                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                                        {services.reduce((sum, s) => sum + s.estimatedPax, 0)} Total PAX
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {['breakfast', 'lunch', 'dinner'].map(type => {
                                        const service = services.find(s => s.mealType === type);
                                        return (
                                            <div key={type} className={`flex justify-between items-center p-2 rounded-lg ${service ? 'bg-slate-50' : 'opacity-40'}`}>
                                                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                                    <Clock size={14} />
                                                    {type === 'breakfast' ? 'Desayuno' : type === 'lunch' ? 'Comida' : 'Cena'}
                                                </div>
                                                <div className="font-bold text-slate-900">
                                                    {service ? `${service.estimatedPax} PAX` : '-'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl py-12 text-center text-slate-400">
                        No hay datos de ocupación importados.
                    </div>
                )}
            </div>

            <ConsumptionRatios />

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <Calculator size={20} />
                        Cálculo de Necesidades
                    </h3>
                    <button
                        onClick={handleCalculate}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg hover:shadow-indigo-200"
                    >
                        <Calculator size={18} />
                        Calcular Compras
                    </button>
                </div>

                {needs.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3">Ingrediente</th>
                                    <th className="px-4 py-3 text-right">Cantidad</th>
                                    <th className="px-4 py-3">Unidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {needs.map((need, idx) => (
                                    <tr key={idx} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-600">{need.date.toLocaleDateString()}</td>
                                        <td className="px-4 py-3 font-semibold text-slate-900">{need.ingredientName}</td>
                                        <td className="px-4 py-3 font-bold text-indigo-600 text-right">{need.quantityNeeded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-slate-500 font-medium">{need.unit}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-400">
                        Pulsa "Calcular" para proyecciones de stock basadas en los servicios de arriba.
                    </div>
                )}
            </div>
        </div>
    );
};
