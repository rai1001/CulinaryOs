import type { StateCreator } from 'zustand';
import type { IngredientBatch } from '../../types';
import type { AppState, IngredientSlice } from '../types';
import { reorderService } from '../../services/reorderService';

export const createIngredientSlice: StateCreator<
    AppState,
    [],
    [],
    IngredientSlice
> = (set, get) => ({
    ingredients: [],
    setIngredients: (ingredients) => set({ ingredients }),
    addIngredient: (ingredient) => set((state) => {
        const exists = state.ingredients.some(i => i.id === ingredient.id);
        if (exists) {
            return {
                ingredients: state.ingredients.map(i => i.id === ingredient.id ? ingredient : i)
            };
        }
        return { ingredients: [...state.ingredients, ingredient] };
    }),

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
                // Determine unit and outlet from ingredient context
                const batchUnit = ing.unit;
                const batchOutlet = ing.outletId || 'unknown';

                const newBatch: IngredientBatch = {
                    ...batchData,
                    id: crypto.randomUUID(),
                    ingredientId,
                    // Ensure required fields are present if batchData is partial/legacy
                    // @ts-ignore - covering legacy data shape
                    currentQuantity: batchData.currentQuantity ?? batchData.quantity,
                    // @ts-ignore
                    initialQuantity: batchData.initialQuantity ?? batchData.quantity,
                    // @ts-ignore
                    expiresAt: batchData.expiresAt ?? batchData.expiryDate,
                    // @ts-ignore
                    receivedAt: batchData.receivedAt ?? batchData.receivedDate ?? new Date().toISOString(),
                    unit: batchUnit,
                    batchNumber: `LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
                    outletId: batchOutlet,
                    status: 'ACTIVE'
                };

                const currentBatches = ing.batches || (ing.stock ? [{
                    id: crypto.randomUUID(),
                    ingredientId: ing.id,
                    initialQuantity: ing.stock,
                    currentQuantity: ing.stock,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    receivedAt: new Date().toISOString(),
                    costPerUnit: ing.costPerUnit,
                    unit: ing.unit,
                    batchNumber: 'LOT-DEFAULT',
                    outletId: batchOutlet,
                    status: 'ACTIVE'
                }] : []);

                const updatedBatches = [...currentBatches, newBatch];
                return {
                    ...ing,
                    batches: updatedBatches,
                    stock: updatedBatches.reduce((sum, b) => sum + b.currentQuantity, 0)
                };
            }
            return ing;
        });

        // Timeout to ensure state is updated before check
        setTimeout(() => reorderService.checkAndNotify(get(), ingredientId), 0);

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
                const newIngredients = state.ingredients.map(i => i.id === ingredientId ? ingredient : i);
                setTimeout(() => reorderService.checkAndNotify(get(), ingredientId), 0);
                return { ingredients: newIngredients };
            }
            return state;
        }

        const batches = [...ingredient.batches].sort((a, b) =>
            new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
        );
        const newBatches: IngredientBatch[] = [];

        for (const batch of batches) {
            if (remaining <= 0) {
                newBatches.push(batch);
                continue;
            }

            if (batch.currentQuantity > remaining) {
                newBatches.push({ ...batch, currentQuantity: batch.currentQuantity - remaining });
                remaining = 0;
            } else {
                remaining -= batch.currentQuantity;
            }
        }

        ingredient.batches = newBatches;
        ingredient.stock = newBatches.reduce((sum, b) => sum + b.currentQuantity, 0);

        const newIngredients = [...state.ingredients];
        newIngredients[ingredientIndex] = ingredient;

        setTimeout(() => reorderService.checkAndNotify(get(), ingredientId), 0);

        return { ingredients: newIngredients };
    }),
});
