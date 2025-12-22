
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ChefHat, Search, Plus, X, Layers, Sparkles, Loader2, Import } from 'lucide-react';
import { RecipeList } from './lists/RecipeList';
import { RecipeForm } from './RecipeForm';
import { searchRecipes } from '../api/ai';
import { DataImportModal, type ImportType } from './common/DataImportModal';

import { deleteDocument, addDocument } from '../services/firestoreService';
import { COLLECTIONS, collections } from '../firebase/collections';
import { convertirRecetaAFicha } from '../services/fichasTecnicasService';
import type { Recipe } from '../types';

export const RecipesView: React.FC = () => {
    const { recipes, activeOutletId, currentUser } = useStore();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<'all' | 'regular' | 'base'>('all');
    const [importType, setImportType] = useState<ImportType | null>(null);
    const [subCategory, setSubCategory] = useState<string>('all');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
        key: 'name',
        direction: 'asc'
    });

    const RECIPE_CATEGORIES = [
        { id: 'all', label: 'Todos' },
        { id: 'appetizer', label: 'Entrantes' },
        { id: 'main', label: 'Principales' },
        { id: 'dessert', label: 'Postres' },
        { id: 'sauce', label: 'Salsas/Guarn.' },
        { id: 'base', label: 'Bases' },
        { id: 'beverage', label: 'Bebidas' },
        { id: 'other', label: 'Otros' }
    ];

    // AI Search State
    const [isAiSearch, setIsAiSearch] = useState(false);
    const [aiSearching, setAiSearching] = useState(false);
    const [aiResultIds, setAiResultIds] = useState<string[] | null>(null);

    const handleImportComplete = async (data: any) => {
        if (data.recipes && Array.isArray(data.recipes)) {
            // Bulk Import (Excel) -> Save to Firestore
            if (!activeOutletId) {
                alert("Selecciona una cocina activa primero.");
                return;
            }

            let count = 0;
            for (const r of data.recipes) {
                try {
                    // Ensure basic fields
                    const newRecipe: Partial<Recipe> = {
                        ...r,
                        outletId: activeOutletId,
                        updatedAt: new Date().toISOString()
                    };
                    // Remove temporary ID if present to let Firestore generate one, or use it if valid UUID
                    // But easier to let addDocument handle it or use the one we generated in import
                    if (!newRecipe.id) delete newRecipe.id;

                    await addDocument(collections.recipes, newRecipe);
                    count++;
                } catch (e) {
                    console.error("Error saving imported recipe:", e);
                }
            }
            if (count > 0) {
                alert(`Importadas ${count} recetas correctamente.`);
            }
        } else if (data.name) {
            // Single OCR Import
            // Prepare it for the RecipeForm to review/edit
            const newRecipe = {
                ...data,
                id: crypto.randomUUID(), // Ensure it has an ID
                isBase: false, // Default to regular
                totalCost: 0,  // Will be calculated
                station: 'hot', // Default
                outletId: activeOutletId // Ensure outletId is set
            } as Recipe;

            setEditingRecipe(newRecipe);
            setShowAddModal(true);
        }
        setImportType(null);
    };

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

    const handleDelete = useCallback(async (id: string) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta receta?')) {
            try {
                await deleteDocument(COLLECTIONS.RECIPES, id);
            } catch (error) {
                console.error("Error deleting recipe:", error);
                alert("Error al eliminar la receta");
            }
        }
    }, []);

    const handleConvertToFicha = async (recipeId: string) => {
        if (!activeOutletId || !currentUser) {
            alert("No hay sesión activa");
            return;
        }

        if (confirm('¿Quieres generar un Análisis Pro (Ficha Técnica) de esta receta?')) {
            try {
                await convertirRecetaAFicha(recipeId, activeOutletId, currentUser.id);
                if (confirm('Ficha Técnica generada con éxito. ¿Quieres verla ahora?')) {
                    navigate('/fichas-tecnicas');
                }
            } catch (error) {
                console.error("Error converting to ficha:", error);
                alert("Error al generar la ficha técnica");
            }
        }
    };

    const handleEdit = useCallback((recipe: Recipe) => {
        setEditingRecipe(recipe);
        setShowAddModal(true);
    }, []);

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const closeModal = () => {
        setShowAddModal(false);
        setEditingRecipe(undefined);
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
        let result = displayRecipes;

        if (isAiSearch && aiResultIds) {
            result = aiResultIds
                .map(id => result.find(r => r.id === id))
                .filter((r): r is typeof result[0] => !!r);
        } else {
            result = result.filter(r =>
                r.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                (subCategory === 'all' || r.category === subCategory)
            );
        }

        // Apply Sorting
        return [...result].sort((a, b) => {
            let aValue: any = (a as any)[sortConfig.key];
            let bValue: any = (b as any)[sortConfig.key];

            // Special case for calculated fields if not in object
            if (sortConfig.key === 'cost') {
                aValue = a.totalCost || 0;
                bValue = b.totalCost || 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [displayRecipes, searchTerm, isAiSearch, aiResultIds, subCategory, sortConfig]);

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
                        onClick={() => setImportType('recipe')}
                        className="bg-surface hover:bg-white/10 text-slate-300 border border-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mr-2"
                    >
                        <Import className="w-4 h-4" /> Importar
                    </button>
                    <button
                        onClick={() => {
                            setEditingRecipe(undefined);
                            setShowAddModal(true);
                        }}
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

            {/* Sub-Category Pills (only if not searching with AI) */}
            {!isAiSearch && (
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {RECIPE_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSubCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${subCategory === cat.id
                                ? 'bg-primary/20 border-primary text-primary'
                                : 'bg-surface border-white/5 text-slate-500 hover:border-white/10 hover:text-white'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            )}

            <RecipeList
                recipes={filteredRecipes}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onConvertToFicha={handleConvertToFicha}
                sortConfig={sortConfig}
                onSort={handleSort}
            />

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-lg">
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div onClick={e => e.stopPropagation()}>
                            <RecipeForm
                                onClose={closeModal}
                                initialData={editingRecipe}
                            />
                        </div>
                    </div>
                </div>
            )}

            <DataImportModal
                isOpen={!!importType}
                onClose={() => setImportType(null)}
                type={importType || 'recipe'}
                onImportComplete={handleImportComplete}
            />
        </div>
    );
};
