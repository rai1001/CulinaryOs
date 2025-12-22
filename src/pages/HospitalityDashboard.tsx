import React, { useState, useEffect } from 'react';
import { OccupancyImport } from '../components/occupancy/OccupancyImport';
import { ConsumptionRatios } from '../components/occupancy/ConsumptionRatios';
import { getOccupancyForecast } from '../services/occupancyService';
import { calculateBreakfastNeeds } from '../services/breakfastCalculator';
import { OccupancyData, IngredientNeed } from '../types/occupancy';
import { Calculator, Calendar, Users } from 'lucide-react';

export const HospitalityDashboard: React.FC = () => {
    const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([]);
    const [needs, setNeeds] = useState<IngredientNeed[]>([]);

    // Dummy forecast load
    useEffect(() => {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        getOccupancyForecast(today, nextWeek).then(setOccupancyData);
    }, []);

    const handleCalculate = async () => {
        // Mock ratios for calculation demonstration
        // In real app, we'd fetch these from DB
        const mockRatios = [
            { ingredientId: '1', ingredientName: 'Huevos', quantityPerPax: 2, unit: 'und', category: 'breakfast' as const },
            { ingredientId: '2', ingredientName: 'Café', quantityPerPax: 0.015, unit: 'kg', category: 'breakfast' as const },
        ];

        const calculated = await calculateBreakfastNeeds(occupancyData, mockRatios);
        setNeeds(calculated);
    };

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-slate-900">Hospitality Logistics</h1>
                <p className="text-slate-500">Planificación de desayunos basada en ocupación.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <OccupancyImport />
                <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                    <h3 className="text-lg font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                        <Users size={20} />
                        Resumen Ocupación (7 días)
                    </h3>
                    <div className="text-3xl font-bold text-emerald-700 mb-1">
                        {occupancyData.reduce((acc, curr) => acc + curr.estimatedPax, 0)} PAX
                    </div>
                    <p className="text-sm text-emerald-600">Estimados totales para la semana</p>
                </div>
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
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
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
                                    <th className="px-4 py-3">Cantidad Necesaria</th>
                                    <th className="px-4 py-3">Unidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {needs.map((need, idx) => (
                                    <tr key={idx} className="border-b">
                                        <td className="px-4 py-3">{need.date.toLocaleDateString()}</td>
                                        <td className="px-4 py-3 font-medium">{need.ingredientName}</td>
                                        <td className="px-4 py-3 font-bold text-indigo-600">{need.quantityNeeded.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-slate-500">{need.unit}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-400">
                        Pulsa "Calcular" para proyecciones de stock.
                    </div>
                )}
            </div>
        </div>
    );
};
