import type { StateCreator } from 'zustand';
import type { AppState, RecipeSlice } from '../types';
import { setDocument, deleteDocument } from '../../services/firestoreService';

export const createRecipeSlice: StateCreator<
    AppState,
    [],
    [],
    RecipeSlice
> = (set) => ({
    recipes: [],

    setRecipes: (recipes) => set({ recipes }),

    addRecipe: async (recipe) => {
        set((state) => ({
            recipes: [...state.recipes, recipe]
        }));
        try {
            await setDocument('recipes', recipe.id, recipe);
        } catch (error) {
            console.error("Failed to persist recipe", error);
        }
    },

    updateRecipe: async (updatedRecipe) => {
        set((state) => ({
            recipes: state.recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r)
        }));
        try {
            await setDocument('recipes', updatedRecipe.id, updatedRecipe);
        } catch (error) {
            console.error("Failed to update recipe", error);
        }
    },

    deleteRecipe: async (id) => {
        set((state) => ({
            recipes: state.recipes.filter(r => r.id !== id)
        }));
        try {
            await deleteDocument('recipes', id);
        } catch (error) {
            console.error("Failed to delete recipe", error);
        }
    },
});
