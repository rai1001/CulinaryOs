
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { ChefHat, Search, Plus, X, Layers, Sparkles, Loader2 } from 'lucide-react';
import { RecipeList } from './lists/RecipeList';
import { RecipeForm } from './RecipeForm';
import { searchRecipes } from '../api/ai';

export const RecipesView: React.FC = () => {
    const { recipes } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'regular' | 'base'>('all');

    // AI Search State
    const [isAiSearch, setIsAiSearch] = useState(false);
    const [aiSearching, setAiSearching] = useState(false);
    const [aiResultIds, setAiResultIds] = useState<string[] | null>(null);

    const handleAiSearch = async () => {
        if (!searchTerm.trim()) return;
        setAiSearching(true);
        try {
            const result = await searchRecipes({ query: searchTerm });
            const data = result.data as { recipes: { id: string }[] };
            setAiResultIds(data.recipes.map(r => r.id));
        } catch (error) {
            console.error("AI Search failed", error);
        } finally {
            setAiSearching(false);
        }
    };

    // Separate base recipes from regular recipes
    const baseRecipes = recipes.filter(r => r.isBase);
    const regularRecipes = recipes.filter(r => !r.isBase);

    // Filter based on active tab and search
    let displayRecipes = recipes;
    if (activeTab === 'base') {
        displayRecipes = baseRecipes;
    } else if (activeTab === 'regular') {
        displayRecipes = regularRecipes;
    }

    const filteredRecipes = useMemo(() => {
        if (isAiSearch && aiResultIds) {
            // Filter store recipes that match the AI result IDs
            // We maintain the order returned by AI (relevance)
            const matches = aiResultIds
                .map(id => displayRecipes.find(r => r.id === id))
                .filter((r): r is typeof displayRecipes[0] => !!r);
            return matches;
        }

        // Standard filter
        return displayRecipes.filter(r =>
            r.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [displayRecipes, searchTerm, isAiSearch, aiResultIds]);

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6 text-slate-200">
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3">
                        <ChefHat className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold text-white">Recetas</h1>
                    </div>
                    <p className="text-slate-400 mt-1">Gestiona tu biblioteca de recetas y escandallos.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className={`absolute left-3 top-2.5 w-4 h-4 ${isAiSearch ? 'text-purple-400' : 'text-slate-500'}`} />
                        <input
                            className={`bg-surface border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none w-64 transition-all ${isAiSearch
                                ? 'border-purple-500/50 focus:border-purple-500 text-purple-100 placeholder:text-purple-500/50'
                                : 'border-white/10 focus:border-primary text-slate-200'
                                }`}
                            placeholder={isAiSearch ? "Describe tu receta (ej: postre chocolate)..." : "Buscar receta..."}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && isAiSearch) {
                                    handleAiSearch();
                                }
                            }}
                        />
                        {isAiSearch && (
                            <div className="absolute right-2 top-2">
                                {aiSearching ? <Loader2 className="w-5 h-5 animate-spin text-purple-400" /> : null}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            const newState = !isAiSearch;
                            setIsAiSearch(newState);
                            if (!newState) {
                                setAiResultIds(null); // Clear AI results when disabling
                            }
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border ${isAiSearch
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30'
                            : 'bg-surface text-slate-400 border-white/10 hover:text-white hover:bg-white/5'
                            }`}
                        title="Búsqueda Semántica con IA"
                    >
                        <Sparkles className="w-4 h-4" />
                        {isAiSearch ? 'IA Activa' : 'IA'}
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/25"
                    >
                        <Plus className="w-4 h-4" /> Nueva Receta
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'all'
                        ? 'border-primary text-white'
                        : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                >
                    Todas ({recipes.length})
                </button>
                <button
                    onClick={() => setActiveTab('regular')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'regular'
                        ? 'border-primary text-white'
                        : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                >
                    <ChefHat className="w-4 h-4" />
                    Recetas ({regularRecipes.length})
                </button>
                <button
                    onClick={() => setActiveTab('base')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'base'
                        ? 'border-primary text-white'
                        : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                >
                    <Layers className="w-4 h-4" />
                    Bases ({baseRecipes.length})
                </button>
            </div>

            <RecipeList recipes={filteredRecipes} />

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
                            <RecipeForm onClose={() => setShowAddModal(false)} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
