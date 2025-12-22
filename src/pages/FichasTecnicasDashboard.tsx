/**
 * @file src/pages/FichasTecnicasDashboard.tsx
 * @description Main dashboard for the Fichas Técnicas module including KPIs and advanced filtering.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { FileText, DollarSign, TrendingUp, Award, Grid, List as ListIcon, Plus, Info, FileStack } from 'lucide-react';
import { useStore } from '../store/useStore';
import { listarFichas, eliminarFichaTecnica, duplicarFicha } from '../services/fichasTecnicasService';
import { calculateGlobalMetrics } from '../services/analyticsService';
import { KPICard, FiltrosFichas } from '../components/fichas/DashboardAtoms';
import type { FilterState } from '../components/fichas/DashboardAtoms';
import { FichasGrid, FichasList } from '../components/fichas/DisplayComponents';
import { FichaTecnicaForm } from '../components/fichas/FichaTecnicaForm';
import { useNavigate } from 'react-router-dom';
import type { FichaTecnica } from '../types';

export const FichasTecnicasDashboard: React.FC = () => {
    const { activeOutletId, currentUser } = useStore();
    const navigate = useNavigate();

    // State
    const [fichas, setFichas] = useState<FichaTecnica[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showForm, setShowForm] = useState(false);
    const [editingFicha, setEditingFicha] = useState<FichaTecnica | undefined>(undefined);

    const [filters, setFilters] = useState<FilterState>({
        searchTerm: '',
        categoria: [],
        dificultad: [],
        rangoCoste: [0, 100],
        rangoMargen: [0, 100],
        soloActivas: true
    });

    // Data Loading
    const loadFichas = async () => {
        if (!activeOutletId) return;
        setIsLoading(true);
        try {
            const data = await listarFichas(activeOutletId);
            setFichas(data);
        } catch (error) {
            console.error('Error loading fichas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFichas();
    }, [activeOutletId]);

    // Filtering & Metrics
    const filteredFichas = useMemo(() => {
        return fichas.filter(f => {
            const matchSearch = f.nombre.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                f.categoria.toLowerCase().includes(filters.searchTerm.toLowerCase());
            const matchCat = filters.categoria.length === 0 || filters.categoria.includes(f.categoria);
            const matchDif = filters.dificultad.length === 0 || filters.dificultad.includes(f.dificultad);
            const matchCoste = f.costos.porPorcion <= filters.rangoCoste[1];
            const matchMargen = (f.pricing.margenBruto || 0) >= filters.rangoMargen[0];

            const result = matchSearch && matchCat && matchDif && matchCoste && matchMargen;
            return result;
        });
    }, [fichas, filters]);

    const metrics = useMemo(() => calculateGlobalMetrics(fichas), [fichas]);

    // Actions
    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de que deseas eliminar esta ficha técnica? El registro se marcará como inactivo.')) {
            await eliminarFichaTecnica(id);
            loadFichas();
        }
    };

    const handleDuplicate = async (ficha: FichaTecnica) => {
        if (!currentUser) return;
        const nombre = prompt('Ingresa el nombre para la nueva copia:', `${ficha.nombre} (Copia)`);
        if (nombre) {
            await duplicarFicha(ficha.id, nombre, currentUser.id);
            loadFichas();
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 text-slate-200 min-h-screen">
            {/* Header section with KPIs */}
            <header className="space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/30">
                                <FileStack className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-4xl font-black text-white tracking-tight">Fichas Técnicas</h1>
                        </div>
                        <p className="text-slate-400 mt-2 font-medium">Control avanzado de costos, recetas y márgenes operativos.</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingFicha(undefined);
                            setShowForm(true);
                        }}
                        className="bg-primary hover:bg-blue-600 text-white px-8 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-3 shadow-2xl shadow-primary/40 hover:-translate-y-1 active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Nueva Ficha
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <KPICard title="Total Fichas" value={metrics.totalFichas} icon={<FileText size={20} />} color="blue" />
                    <KPICard title="Costo Promedio p/p" value={`${metrics.costoPromedio.toFixed(2)}€`} icon={<DollarSign size={20} />} color="green" />
                    <KPICard title="Margen Promedio" value={`${metrics.margenPromedio.toFixed(0)}%`} icon={<TrendingUp size={20} />} color="purple" />
                    <KPICard title="Más Rentable" value={metrics.masRentable?.nombre || '-'} icon={<Award size={20} />} color="yellow" />
                </div>
            </header>

            {/* Filters Section */}
            <section className="bg-surface-light border border-white/5 rounded-3xl p-6 shadow-2xl">
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                    <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <FileText className="w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Busca por nombre o categoría..."
                            className="w-full bg-surface border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:border-primary focus:outline-none transition-all shadow-inner"
                            value={filters.searchTerm}
                            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                        />
                    </div>

                    <div className="flex bg-surface p-1.5 rounded-2xl border border-white/5 shadow-inner self-start">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-4 py-2 rounded-xl transition-all font-bold text-xs flex items-center gap-2 ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <Grid size={16} /> Grid
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 rounded-xl transition-all font-bold text-xs flex items-center gap-2 ${viewMode === 'list' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <ListIcon size={16} /> Lista
                        </button>
                    </div>

                    <button
                        onClick={() => navigate('/analytics/fichas')}
                        className="bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-2xl font-bold text-sm border border-white/10 transition-all flex items-center gap-2"
                    >
                        <TrendingUp size={18} className="text-primary" /> Ver Análisis Pro
                    </button>
                </div>

                <FiltrosFichas filters={filters} onChange={setFilters} />
            </section>

            {/* Display Area */}
            <main data-testid="fichas-results" className="pb-12">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-2xl shadow-primary/50"></div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando Recetario...</p>
                    </div>
                ) : filteredFichas.length > 0 ? (
                    viewMode === 'grid' ? (
                        <FichasGrid
                            fichas={filteredFichas}
                            onEdit={(f) => { setEditingFicha(f); setShowForm(true); }}
                            onDelete={handleDelete}
                            onDuplicate={handleDuplicate}
                            onViewHistory={(f) => { setEditingFicha(f); setShowForm(true); /* Logic to switch to history tab will be handled inside form */ }}
                        />
                    ) : (
                        <FichasList
                            fichas={filteredFichas}
                            onEdit={(f) => { setEditingFicha(f); setShowForm(true); }}
                            onDelete={handleDelete}
                        />
                    )
                ) : (
                    <div className="text-center py-24 bg-surface/30 rounded-[40px] border-2 border-dashed border-white/5">
                        <Info className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-slate-400">No se encontraron fichas</h2>
                        <p className="text-slate-600 mt-2 max-w-md mx-auto">Ajusta los filtros de búsqueda o comienza a documentar una nueva receta maestra.</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-8 text-primary font-bold hover:underline"
                        >
                            Crear mi primera ficha técnica
                        </button>
                    </div>
                )}
            </main>

            {/* Form Modal Overlay */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="w-full max-w-6xl shadow-2xl" onClick={e => e.stopPropagation()}>
                        <FichaTecnicaForm
                            initialData={(editingFicha || { outletId: activeOutletId || undefined }) as any}
                            userId={currentUser?.id || ''}
                            onClose={() => setShowForm(false)}
                            onSaved={() => {
                                setShowForm(false);
                                loadFichas();
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
