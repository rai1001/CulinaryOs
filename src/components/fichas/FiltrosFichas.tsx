import React from 'react';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import type { FichaCategoria, FichaDificultad } from '../../types/fichasTecnicas';

export interface FilterState {
    searchTerm: string;
    categoria: FichaCategoria[];
    dificultad: FichaDificultad[];
    rangoCoste: [number, number];
    rangoMargen: [number, number];
    soloActivas: boolean;
}

interface FiltrosFichasProps {
    filters: FilterState;
    onChange: (filters: FilterState) => void;
    isOpen: boolean;
    onToggle: () => void;
}

export const FiltrosFichas: React.FC<FiltrosFichasProps> = ({ filters, onChange, isOpen, onToggle }) => {
    const toggleCategoria = (cat: FichaCategoria) => {
        const newCats = filters.categoria.includes(cat)
            ? filters.categoria.filter(c => c !== cat)
            : [...filters.categoria, cat];
        onChange({ ...filters, categoria: newCats });
    };

    const toggleDificultad = (dif: FichaDificultad) => {
        const newDifs = filters.dificultad.includes(dif)
            ? filters.dificultad.filter(d => d !== dif)
            : [...filters.dificultad, dif];
        onChange({ ...filters, dificultad: newDifs });
    };

    const clearFilters = () => {
        onChange({
            ...filters,
            categoria: [],
            dificultad: [],
            rangoCoste: [0, 100],
            rangoMargen: [0, 100],
            soloActivas: true
        });
    };

    return (
        <div className="mt-4">
            <button
                onClick={onToggle}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
                <SlidersHorizontal className="w-4 h-4" />
                {isOpen ? 'Ocultar Filtros' : 'Filtros Avanzados'}
                {(filters.categoria.length > 0 || filters.dificultad.length > 0) && (
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                        Activos
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg animate-fade-in-down">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Configurar Filtros</h4>
                        <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                            <X className="w-3 h-3" /> Limpiar Todo
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Categorías */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-2 block">Categoría</label>
                            <div className="space-y-2">
                                {['comida', 'bebida', 'postre', 'ingrediente-preparado'].map((cat) => (
                                    <label key={cat} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.categoria.includes(cat as FichaCategoria)}
                                            onChange={() => toggleCategoria(cat as FichaCategoria)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700 capitalize">{cat.replace('-', ' ')}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Dificultad */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-2 block">Dificultad</label>
                            <div className="space-y-2">
                                {['baja', 'media', 'alta'].map((dif) => (
                                    <label key={dif} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.dificultad.includes(dif as FichaDificultad)}
                                            onChange={() => toggleDificultad(dif as FichaDificultad)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700 capitalize">{dif}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Estado */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-2 block">Estado</label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filters.soloActivas}
                                        onChange={(e) => onChange({ ...filters, soloActivas: e.target.checked })}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Solo Fichas Activas</span>
                                </label>
                            </div>
                        </div>

                        {/* Note: Sliders for cost and margin omitted for MVP speed, using basic checkbox filters first */}
                    </div>
                </div>
            )}
        </div>
    );
};
