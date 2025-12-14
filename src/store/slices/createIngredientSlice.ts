import type { StateCreator } from 'zustand';
import type { IngredientBatch } from '../../types';
import type { AppState, IngredientSlice } from '../types';

export const createIngredientSlice: StateCreator<
    AppState,
    [],
    [],
    IngredientSlice
> = (set) => ({
    ingredients: [],
    setIngredients: (ingredients) => set({ ingredients }),
    addIngredient: (ingredient) => set((state) => ({ ingredients: [...state.ingredients, ingredient] })),

    updateIngredient: (updatedIngredient) => set((state) => {
        const current = state.ingredients.find(i => i.id === updatedIngredient.id);
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
        return {
            ingredients: state.ingredients.map(i => i.id === updatedIngredient.id ? finalIngredient : i)
        };
    }),

    addBatch: (ingredientId, batchData) => set((state) => {
        const newIngredients = state.ingredients.map(ing => {
            if (ing.id === ingredientId) {
                const newBatch: IngredientBatch = {
                    ...batchData,
                    id: crypto.randomUUID(),
                    ingredientId
                };
                const currentBatches = ing.batches || (ing.stock ? [{
                    id: crypto.randomUUID(),
                    ingredientId: ing.id,
                    quantity: ing.stock,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    receivedDate: new Date().toISOString(),
                    costPerUnit: ing.costPerUnit
                }] : []);

                const updatedBatches = [...currentBatches, newBatch];
                return {
                    ...ing,
                    batches: updatedBatches,
                    stock: updatedBatches.reduce((sum, b) => sum + b.quantity, 0)
                };
            }
            return ing;
        });
        return { ingredients: newIngredients };
    }),

    consumeStock: (ingredientId, quantity) => set((state) => {
        const ingredientIndex = state.ingredients.findIndex(i => i.id === ingredientId);
        if (ingredientIndex === -1) return state;

        const ingredient = { ...state.ingredients[ingredientIndex] };
        let remaining = quantity;

        if (!ingredient.batches) {
            if ((ingredient.stock || 0) >= quantity) {
                ingredient.stock = (ingredient.stock || 0) - quantity;
                return { ingredients: state.ingredients.map(i => i.id === ingredientId ? ingredient : i) };
            }
            return state;
        }

        const batches = [...ingredient.batches].sort((a, b) =>
            new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        );
        const newBatches: IngredientBatch[] = [];

        for (const batch of batches) {
            if (remaining <= 0) {
                newBatches.push(batch);
                continue;
            }

            if (batch.quantity > remaining) {
                newBatches.push({ ...batch, quantity: batch.quantity - remaining });
                remaining = 0;
            } else {
                remaining -= batch.quantity;
            }
        }

        ingredient.batches = newBatches;
        ingredient.stock = newBatches.reduce((sum, b) => sum + b.quantity, 0);

        const newIngredients = [...state.ingredients];
        newIngredients[ingredientIndex] = ingredient;
        return { ingredients: newIngredients };
    }),
});
