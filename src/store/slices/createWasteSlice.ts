import type { StateCreator } from 'zustand';
import type { WasteRecord, Ingredient } from '../../types';
import { consumeStockFIFO, createMigrationBatch } from '../../utils/inventory';
import type { AppState, WasteSlice } from '../types';

export const createWasteSlice: StateCreator<
    AppState,
    [],
    [],
    WasteSlice
> = (set) => ({
    wasteRecords: [],

    setWasteRecords: (records: WasteRecord[]) => set({ wasteRecords: records }),

    addWasteRecord: (record) => set((state: AppState) => {
        const { ingredients } = state;
        const ingredientIndex = ingredients.findIndex((i: Ingredient) => i.id === record.ingredientId);

        if (ingredientIndex === -1) return state;

        const ingredient = { ...ingredients[ingredientIndex] };

        // Ensure ingredient has batches (migrate if needed)
        if (!ingredient.batches || ingredient.batches.length === 0) {
            ingredient.batches = [createMigrationBatch(
                ingredient.id,
                ingredient.stock || 0,
                ingredient.costPerUnit
            )];
        }

        // Use centralized FIFO consumption
        const { newBatches } = consumeStockFIFO(ingredient.batches, record.quantity);

        ingredient.batches = newBatches;
        ingredient.stock = newBatches.reduce((sum, b) => sum + b.currentQuantity, 0);

        const newIngredients = [...ingredients];
        newIngredients[ingredientIndex] = ingredient;

        return {
            wasteRecords: [...state.wasteRecords, record],
            ingredients: newIngredients
        };
    }),

    deleteWasteRecord: (id) => set((state: AppState) => ({
        wasteRecords: state.wasteRecords.filter(w => w.id !== id)
    })),
});
