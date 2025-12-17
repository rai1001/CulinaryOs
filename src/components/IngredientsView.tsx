
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Package, Search, Plus, X } from 'lucide-react';
import { IngredientList } from './lists/IngredientList';
import { IngredientForm } from './IngredientForm';

export const IngredientsView: React.FC = () => {
    const { ingredients } = useStore();
    // const { getFilteredIngredients } = useStore(); // TODO: Check if this selector exists in store
    // const ingredients = getFilteredIngredients(); // For now fallback to simple list until slice is verified
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    const filteredIngredients = ingredients.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6 text-slate-200">
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3">
                        <Package className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold text-white">Ingredientes</h1>
                    </div>
                    <p className="text-slate-400 mt-1">Base de datos de productos y precios.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                            className="bg-surface border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:border-primary focus:outline-none w-64 transition-all"
                            placeholder="Buscar ingrediente..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/25"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Ingrediente
                    </button>
                </div>
            </header>

            <IngredientList ingredients={filteredIngredients} />

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-lg">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div onClick={e => e.stopPropagation()}>
                            <IngredientForm onClose={() => setShowAddModal(false)} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
