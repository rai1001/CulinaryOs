import React, { useMemo, useCallback } from 'react';
import type { Recipe } from '../../types';
import { useStore } from '../../store/useStore';
import { Printer } from 'lucide-react';
import { printLabel, formatLabelData } from '../printing/PrintService';

interface RecipeListProps {
    recipes: Recipe[];
}

export const RecipeList: React.FC<RecipeListProps> = ({ recipes }) => {
    const { ingredients } = useStore();

    // Optimization: Create a map for O(1) ingredient lookup
    // This reduces complexity from O(N*M*K) to O(N*M) where N=recipes, M=ingredients per recipe, K=total ingredients
    const ingredientMap = useMemo(() => {
        return new Map(ingredients.map(i => [i.id, i]));
    }, [ingredients]);

    const calculateStats = useCallback((recipe: Recipe) => {
        let totalCost = 0;
        let totalKcal = 0;

        recipe.ingredients.forEach(ri => {
            const ing = ingredientMap.get(ri.ingredientId);
            if (!ing) return;

            // Cost Calculation
            totalCost += ri.quantity * ing.costPerUnit;

            // Kcal Calculation
            if (ing.nutritionalInfo) {
                let multiplier = 0;
                // Standardize to 100g units
                if (ing.unit === 'kg' || ing.unit === 'L') {
                    multiplier = ri.quantity * 10; // 1kg = 10 * 100g
                } else if (ing.unit === 'g' || ing.unit === 'ml') {
                    multiplier = ri.quantity / 100;
                }
                // 'un' and 'manojo' are ignored for now as we don't know weight

                totalKcal += multiplier * ing.nutritionalInfo.calories;
            }
        });

        return { totalCost, totalKcal };
    }, [ingredientMap]);

    // Cache recipe stats to avoid recalculating on every render
    const recipeStats = useMemo(() => {
        return recipes.map(recipe => ({
            recipe,
            stats: calculateStats(recipe)
        }));
    }, [recipes, calculateStats]);

    return (
        <div className="bg-surface border border-white/5 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-black/20 text-slate-500 uppercase font-medium">
                    <tr>
                        <th className="p-4">Nombre</th>
                        <th className="p-4">Partida</th>
                        <th className="p-4">Ingredientes</th>
                        <th className="p-4 text-right">Kcal (Total)</th>
                        <th className="p-4 text-right">Coste</th>
                        <th className="p-4 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {recipeStats.map(({ recipe, stats }) => {
                        return (
                            <tr key={recipe.id} className="hover:bg-white/[0.02]">
                                <td className="p-4 font-medium text-white">
                                    <div className="flex items-center gap-2">
                                        {recipe.name}
                                        {recipe.isBase && (
                                            <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                BASE
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs ${recipe.station === 'hot' ? 'bg-red-500/20 text-red-300' :
                                        recipe.station === 'cold' ? 'bg-blue-500/20 text-blue-300' :
                                            'bg-pink-500/20 text-pink-300'
                                        }`}>
                                        {recipe.station === 'hot' ? 'CALIENTE' : recipe.station === 'cold' ? 'FRÍA' : 'POSTRES'}
                                    </span>
                                </td>
                                <td className="p-4 opacity-70">{recipe.ingredients.length} items</td>
                                <td className="p-4 text-right font-mono text-orange-400">
                                    {stats.totalKcal > 0 ? Math.round(stats.totalKcal).toLocaleString() : '-'}
                                </td>
                                <td className="p-4 text-right font-mono text-emerald-400">
                                    {stats.totalCost.toFixed(2)}€
                                </td>
                                <td className="p-4 text-center">
                                    <button
                                        onClick={() => printLabel(formatLabelData(recipe, 'PREP'))}
                                        className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                        title="Imprimir Etiqueta"
                                    >
                                        <Printer size={18} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {recipes.length === 0 && (
                        <tr><td colSpan={6} className="p-8 text-center opacity-50">No hay recetas.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
