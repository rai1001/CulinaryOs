import type { StateCreator } from 'zustand';
import type { AppState, IngredientSlice } from '../types';
import { setDocument, updateDocument } from '../../services/firestoreService';

export const createIngredientSlice: StateCreator<
    AppState,
    [],
    [],
    IngredientSlice
> = (set, get) => ({
    ingredients: [],
    setIngredients: (ingredients) => set({ ingredients }),

    addIngredient: async (ingredient) => {
        set((state) => {
            const exists = state.ingredients.some(i => i.id === ingredient.id);
            if (exists) {
                return {
                    ingredients: state.ingredients.map(i => i.id === ingredient.id ? ingredient : i)
                };
            }
            return { ingredients: [...state.ingredients, ingredient] };
        });

        try {
            await setDocument('ingredients', ingredient.id, ingredient);
        } catch (error) {
            console.error("Failed to persist ingredient", error);
        }
    },

    updateIngredient: async (updatedIngredient) => {
        const current = get().ingredients.find(i => i.id === updatedIngredient.id);
        let newHistory = updatedIngredient.priceHistory || [];

        if (current && current.costPerUnit !== updatedIngredient.costPerUnit) {
            // Price changed, record history
            newHistory = current.priceHistory ? [...current.priceHistory] : [];
            newHistory.push({
                date: new Date().toISOString(),
                price: updatedIngredient.costPerUnit,
                changeReason: 'Updated via App'
            });
        }

        const finalIngredient = { ...updatedIngredient, priceHistory: newHistory };

        set((state) => ({
            ingredients: state.ingredients.map(i => i.id === updatedIngredient.id ? finalIngredient : i)
        }));

        try {
            await updateDocument('ingredients', finalIngredient.id, finalIngredient);
        } catch (error) {
            console.error("Failed to update ingredient", error);
        }
    },
});
