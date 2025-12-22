import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Grid, List, Plus, FileText,
    DollarSign, TrendingUp, Award,
    Loader2, RefreshCw
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { FichasGrid } from '../components/fichas/FichasGrid';
import { FichasList } from '../components/fichas/FichasList';
import { FiltrosFichas, type FilterState } from '../components/fichas/FiltrosFichas';
import { listarFichas, eliminarFichaTecnica, duplicarFicha } from '../services/fichasTecnicasService';
import { calculateGlobalMetrics } from '../services/analyticsService';
import type { FichaTecnica } from '../types/fichasTecnicas';

const KPICard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
}> = ({ title, value, icon, color, bgColor }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${bgColor} ${color}`}>
            {icon}
        </div>
    </div>
);

export const FichasTecnicasDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { activeOutletId, currentUser } = useStore();

    const [fichas, setFichas] = useState<FichaTecnica[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // View & Sort State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState('nombre-asc');
    const [showFilters, setShowFilters] = useState(false);

    // Filters State
    const [filters, setFilters] = useState<FilterState>({
        searchTerm: '',
        categoria: [],
        dificultad: [],
        rangoCoste: [0, 100],
        rangoMargen: [0, 100],
        soloActivas: true
    });

    useEffect(() => {
        loadFichas();
    }, [activeOutletId]);

    const loadFichas = async () => {
        if (!activeOutletId) return;
        try {
            setLoading(true);
            setError(null);
            const data = await listarFichas(activeOutletId);
            setFichas(data);
        } catch (err) {
            console.error('Error loading fichas:', err);
            setError('Error al cargar las fichas técnicas. Por favor intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta ficha técnica?')) {
            try {
                await eliminarFichaTecnica(id);
                setFichas(prev => prev.filter(f => f.id !== id));
            } catch (error) {
                console.error('Error deleting ficha:', error);
                alert('Error al eliminar la ficha técnica');
            }
        }
    };

    const handleDuplicate = async (id: string) => {
        if (!currentUser) return;
        const fichaToDup = fichas.find(f => f.id === id);
        if (!fichaToDup) return;

        const newName = prompt('Nombre para la copia:', `${fichaToDup.nombre} (Copia)`);
        if (newName) {
            try {
                await duplicarFicha(id, newName, currentUser.id);
                loadFichas(); // Reload to see new one
            } catch (error) {
                console.error('Error duplicating ficha:', error);
                alert('Error al duplicar la ficha técnica');
            }
        }
    };

    const handleDownload = (id: string) => {
        // Placeholder for PDF download
        console.log('Download PDF for', id);
        alert('Funcionalidad de PDF en desarrollo');
    };

    // Filter Logic
    const filteredFichas = useMemo(() => {
        return fichas.filter(ficha => {
            // Search
            if (filters.searchTerm) {
                const term = filters.searchTerm.toLowerCase();
                if (!ficha.nombre.toLowerCase().includes(term) && !ficha.descripcion?.toLowerCase().includes(term)) {
                    return false;
                }
            }
            // Categories
            if (filters.categoria.length > 0 && !filters.categoria.includes(ficha.categoria)) return false;

            // Difficulty
            if (filters.dificultad.length > 0 && !filters.dificultad.includes(ficha.dificultad)) return false;

            // Active
            if (filters.soloActivas && !ficha.activa) return false;

            return true;
        });
    }, [fichas, filters]);

    // Sort Logic
    const sortedFichas = useMemo(() => {
        return [...filteredFichas].sort((a, b) => {
            switch (sortBy) {
                case 'nombre-asc': return a.nombre.localeCompare(b.nombre);
                case 'nombre-desc': return b.nombre.localeCompare(a.nombre);
                case 'coste-asc': return (a.costos.porPorcion || 0) - (b.costos.porPorcion || 0);
                case 'coste-desc': return (b.costos.porPorcion || 0) - (a.costos.porPorcion || 0);
                case 'margen-desc': return (b.pricing.margenBruto || 0) - (a.pricing.margenBruto || 0);
                case 'fecha-desc': return (b.ultimaModificacion || '').localeCompare(a.ultimaModificacion || '');
                default: return 0;
            }
        });
    }, [filteredFichas, sortBy]);

    const stats = useMemo(() => calculateGlobalMetrics(fichas), [fichas]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Fichas Técnicas</h1>
                    <p className="text-gray-500 mt-1">Gestiona tus recetas, costos y márgenes</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => navigate('/analytics/rentabilidad')}
                        className="flex-1 md:flex-none justify-center px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium transition-transform active:scale-95"
                    >
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Rentabilidad
                    </button>
                    <button
                        onClick={() => navigate('/fichas-tecnicas/nueva')}
                        className="flex-1 md:flex-none justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm transition-transform active:scale-95 hover:shadow-md"
                    >
                        <Plus className="w-5 h-5" />
                        Nueva Ficha
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <KPICard
                    title="Total Fichas"
                    value={stats.totalFichas}
                    icon={<FileText className="w-6 h-6" />}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                />
                <KPICard
                    title="Costo Promedio"
                    value={`€${stats.costoPromedio.toFixed(2)}`}
                    icon={<DollarSign className="w-6 h-6" />}
                    color="text-green-600"
                    bgColor="bg-green-50"
                />
                <KPICard
                    title="Margen Promedio"
                    value={`${stats.margenPromedio.toFixed(0)}%`}
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="text-purple-600"
                    bgColor="bg-purple-50"
                />
                <KPICard
                    title="Más Rentable"
                    value={stats.masRentable?.nombre || '-'}
                    icon={<Award className="w-6 h-6" />}
                    color="text-yellow-600"
                    bgColor="bg-yellow-50"
                />
            </div>

            {/* Main Control Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6 sticky top-4 z-20">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, ingrediente..."
                            value={filters.searchTerm}
                            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                        >
                            <option value="nombre-asc">Nombre A-Z</option>
                            <option value="nombre-desc">Nombre Z-A</option>
                            <option value="coste-asc">Costo Mayor</option>
                            <option value="coste-desc">Costo Menor</option>
                            <option value="margen-desc">Mayor Margen</option>
                            <option value="fecha-desc">Recientes</option>
                        </select>

                        {/* View Toggles */}
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Grid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <FiltrosFichas
                    filters={filters}
                    onChange={setFilters}
                    isOpen={showFilters}
                    onToggle={() => setShowFilters(!showFilters)}
                />
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
            ) : error ? (
                <div className="text-center py-12 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-red-600 mb-4 font-medium">{error}</p>
                    <button onClick={loadFichas} className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2 mx-auto">
                        <RefreshCw className="w-4 h-4" /> Reintentar
                    </button>
                </div>
            ) : sortedFichas.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">No se encontraron resultados</h3>
                    <p className="text-gray-500 mt-2 mb-6">Prueba ajustando los filtros o tu búsqueda.</p>
                    <button
                        onClick={() => setFilters({
                            searchTerm: '',
                            categoria: [],
                            dificultad: [],
                            rangoCoste: [0, 100],
                            rangoMargen: [0, 100],
                            soloActivas: true
                        })}
                        className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                        Limpiar filtros
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                <FichasGrid
                    fichas={sortedFichas}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onDownload={handleDownload}
                />
            ) : (
                <FichasList
                    fichas={sortedFichas}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onDownload={handleDownload}
                />
            )}
        </div>
    );
};
