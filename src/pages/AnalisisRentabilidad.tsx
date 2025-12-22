/**
 * @file src/pages/AnalisisRentabilidad.tsx
 */
import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, DollarSign, Target, ArrowLeft, Download, AlertCircle, CheckCircle2, LayoutGrid, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { listarFichas } from '../services/fichasTecnicasService';
import { calculateGlobalMetrics, detectarOptimizaciones } from '../services/analyticsService';
import { MarginDistributionChart, CostVsMarginScatter, ComparadorPlatos } from '../components/analytics/FichasAnalytics';
import type { FichaTecnica } from '../types';

export const AnalisisRentabilidad: React.FC = () => {
    const navigate = useNavigate();
    const { activeOutletId } = useStore();
    const [fichas, setFichas] = useState<FichaTecnica[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!activeOutletId) return;
            try {
                const data = await listarFichas(activeOutletId);
                setFichas(data);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [activeOutletId]);

    const metrics = useMemo(() => calculateGlobalMetrics(fichas), [fichas]);

    const chartData = useMemo(() => {
        const categories = [...new Set(fichas.map(f => f.categoria))];
        return categories.map(cat => ({
            categoria: cat.replace('-', ' '),
            margen: fichas.filter(f => f.categoria === cat).reduce((acc, f) => acc + (f.pricing.margenBruto || 0), 0) /
                (fichas.filter(f => f.categoria === cat).length || 1)
        }));
    }, [fichas]);

    const scatterData = useMemo(() => {
        return fichas.map(f => ({
            name: f.nombre,
            costo: f.costos.porPorcion,
            margen: f.pricing.margenBruto || 0
        }));
    }, [fichas]);

    const optimizaciones = useMemo(() => {
        return fichas.flatMap(f => {
            const opts = detectarOptimizaciones(f, fichas.filter(of => of.categoria === f.categoria));
            return opts.map(o => ({ ...o, fichaNombre: f.nombre }));
        }).sort((a, b) => b.impactoEstimado - a.impactoEstimado).slice(0, 5);
    }, [fichas]);

    if (isLoading) return <div className="p-20 text-center text-slate-500 font-bold animate-pulse">CARGANDO ANÁLISIS...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 pb-24">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/fichas-tecnicas')} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-slate-400 hover:text-white">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight">Análisis de <span className="text-primary italic">Rentabilidad</span></h1>
                        <p className="text-slate-500 font-medium">Radiografía financiera del recetario actual.</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-xl shadow-green-500/20">
                    <Download size={18} /> Exportar Reporte
                </button>
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <MetricCard title="Margen Bruto Promedio" value={`${metrics.margenPromedio.toFixed(1)}%`} icon={<TrendingUp className="text-green-400" />} />
                <MetricCard title="Costo Promedio p/p" value={`${metrics.costoPromedio.toFixed(2)}€`} icon={<DollarSign className="text-blue-400" />} />
                <MetricCard title="Ingreso Potencial (Recetario)" value={`${(metrics.totalFichas * 1250).toLocaleString()}€`} icon={<Target className="text-purple-400" />} />
            </div>

            {/* Main Content Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface-light border border-white/5 rounded-[32px] p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Márgenes por Categoría</h2>
                        <Info size={16} className="text-slate-600" />
                    </div>
                    <MarginDistributionChart data={chartData} />
                </div>

                <div className="bg-surface-light border border-white/5 rounded-[32px] p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Correlación Costo vs Margen</h2>
                        <LayoutGrid size={16} className="text-slate-600" />
                    </div>
                    <CostVsMarginScatter data={scatterData} />
                </div>
            </div>

            {/* Optimization Hub */}
            <section className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-[40px] p-10 shadow-2xl">
                <div className="flex items-start gap-4 mb-10">
                    <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/40">
                        <ArrowLeft size={24} className="text-white rotate-180" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">Hub de Optimización</h2>
                        <p className="text-slate-400 font-medium">Oportunidades automáticas de ahorro y mejora de margen.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {optimizaciones.length > 0 ? (
                        optimizaciones.map((opt, i) => (
                            <div key={i} className="flex items-center gap-6 bg-white/5 border border-white/5 p-6 rounded-3xl hover:bg-white/[0.08] transition-all group">
                                <div className={`p-4 rounded-2xl ${opt.prioridad === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                                    }`}>
                                    <AlertCircle size={24} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-white font-bold flex items-center gap-2">
                                        {opt.fichaNombre}
                                        <span className="text-[10px] font-black uppercase text-slate-500 bg-white/5 px-2 py-0.5 rounded tracking-widest">{opt.tipo.replace('_', ' ')}</span>
                                    </h4>
                                    <p className="text-sm text-slate-400 mt-1">{opt.descripcion}</p>
                                    <p className="text-xs text-primary font-bold mt-2 italic">💡 {opt.sugerencia}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ahorro Estimado</p>
                                    <p className="text-xl font-black text-green-400">+{opt.impactoEstimado.toFixed(2)}€</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center py-12 text-slate-500">
                            <CheckCircle2 size={48} className="text-green-500/50 mb-4" />
                            <p className="font-bold uppercase tracking-widest text-xs">Tu recetario está optimizado</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Comparador Section */}
            <ComparadorPlatos fichas={fichas} />
        </div>
    );
};

const MetricCard: React.FC<{ title: string; value: string; icon: React.ReactElement }> = ({ title, value, icon }) => (
    <div className="bg-surface-light border border-white/5 rounded-3xl p-8 shadow-2xl group hover:-translate-y-1 transition-all">
        <div className="p-3 bg-white/5 w-fit rounded-xl mb-6 group-hover:bg-primary/20 transition-colors">
            {React.cloneElement(icon, { size: 24 } as any)}
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-black text-white font-mono tracking-tighter">{value}</p>
    </div>
);
