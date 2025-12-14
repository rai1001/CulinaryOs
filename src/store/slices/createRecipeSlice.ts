import type { StateCreator } from 'zustand';
import type { Recipe } from '../../types';
import type { AppState } from '../types';

export interface RecipeSlice {
    recipes: Recipe[];
    setRecipes: (recipes: Recipe[]) => void;
    addRecipe: (recipe: Recipe) => void;
    updateRecipe: (recipe: Recipe) => void;
    deleteRecipe: (id: string) => void;
}

export const createRecipeSlice: StateCreator<
    AppState,
    [],
    [],
    RecipeSlice
> = (set) => ({
    recipes: [],

    setRecipes: (recipes) => set({ recipes }),

    addRecipe: (recipe) => set((state) => ({
        recipes: [...state.recipes, recipe]
    })),

    updateRecipe: (updatedRecipe) => set((state) => ({
        recipes: state.recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r)
    })),

    deleteRecipe: (id) => set((state) => ({
        recipes: state.recipes.filter(r => r.id !== id)
    })),
});
