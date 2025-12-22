import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { listarFichas } from '../services/fichasTecnicasService';
import { RentabilidadChart } from '../components/analytics/RentabilidadChart';
import { SimuladorEscenarios } from '../components/analytics/SimuladorEscenarios';
import { ComparadorPlatos } from '../components/analytics/ComparadorPlatos';
import type { FichaTecnica } from '../types/fichasTecnicas';
import { ArrowLeft, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AnalisisRentabilidad: React.FC = () => {
    const navigate = useNavigate();
    const { activeOutletId } = useStore();
    const [fichas, setFichas] = useState<FichaTecnica[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedForSim, setSelectedForSim] = useState<string | null>(null);
    const [compareList, setCompareList] = useState<string[]>([]);

    useEffect(() => {
        const load = async () => {
            if (activeOutletId) {
                const data = await listarFichas(activeOutletId);
                setFichas(data);
                if (data.length > 0) setSelectedForSim(data[0].id);
                setLoading(false);
            }
        };
        load();
    }, [activeOutletId]);

    const activeFicha = fichas.find(f => f.id === selectedForSim);

    const toggleCompare = (id: string) => {
        if (compareList.includes(id)) {
            setCompareList(prev => prev.filter(i => i !== id));
        } else {
            if (compareList.length < 3) setCompareList(prev => [...prev, id]);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando análisis...</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <button
                onClick={() => navigate('/fichas-tecnicas')}
                className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Volver a Dashboard
            </button>

            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                    <BarChart2 className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Análisis de Rentabilidad</h1>
                    <p className="text-gray-500">Visualiza el rendimiento de tu carta</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Chart Section */}
                <div>
                    <RentabilidadChart fichas={fichas} />
                </div>

                {/* Recommendations / Insights Summary */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Insights Rápidos</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                            <h4 className="font-bold text-green-700 text-sm">Top Rentabilidad</h4>
                            <p className="text-green-600 text-xs mt-1">
                                {fichas.sort((a, b) => (b.pricing.margenBruto || 0) - (a.pricing.margenBruto || 0))[0]?.nombre} lidera con un {(fichas.sort((a, b) => (b.pricing.margenBruto || 0) - (a.pricing.margenBruto || 0))[0]?.pricing.margenBruto || 0).toFixed(0)}% de margen.
                            </p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                            <h4 className="font-bold text-red-700 text-sm">Requiere Atención</h4>
                            <p className="text-red-600 text-xs mt-1">
                                {fichas.filter(f => (f.pricing.margenBruto || 0) < 40).length} platos tienen un margen inferior al 40%.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Simulator Section */}
            <div className="mb-12">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Simulador</h2>
                    <select
                        value={selectedForSim || ''}
                        onChange={(e) => setSelectedForSim(e.target.value)}
                        className="border-gray-300 rounded-lg text-sm"
                    >
                        {fichas.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                    </select>
                </div>
                {activeFicha && <SimuladorEscenarios ficha={activeFicha} />}
            </div>

            {/* Comparator Section */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Comparativa Directa</h2>
                <ComparadorPlatos
                    fichas={fichas}
                    seleccionadas={compareList}
                    onSelect={toggleCompare}
                />
            </div>
        </div>
    );
};
