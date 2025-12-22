import { v4 as uuidv4 } from 'uuid';
import { TIME, INVENTORY } from '../constants';
import type { Ingredient, IngredientBatch } from '../types';

/**
 * Consume stock using FIFO (First In, First Out) method based on expiry dates
 * @param batches - Current ingredient batches
 * @param quantity - Quantity to consume
 * @returns Updated batches after consumption
 */
export const consumeStockFIFO = (
    batches: IngredientBatch[],
    quantity: number
): IngredientBatch[] => {
    let remainingQtyToConsume = quantity;

    // Sort batches by expiry date ASC (FIFO - consume oldest first)
    const sortedBatches = [...batches].sort((a, b) =>
        new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
    );

    const newBatches: IngredientBatch[] = [];

    for (const batch of sortedBatches) {
        if (remainingQtyToConsume <= 0) {
            // No more to consume, keep remaining batches
            newBatches.push(batch);
            continue;
        }

        if (batch.currentQuantity > remainingQtyToConsume) {
            // Partial consumption of this batch
            newBatches.push({
                ...batch,
                currentQuantity: batch.currentQuantity - remainingQtyToConsume
            });
            remainingQtyToConsume = 0;
        } else {
            // Fully consume this batch (don't push to newBatches)
            remainingQtyToConsume -= batch.currentQuantity;
        }
    }

    return newBatches;
};

/**
 * Create a default batch from legacy stock data (migration helper)
 * @param ingredient - Ingredient with legacy stock
 * @returns New ingredient batch
 */
export const createDefaultBatch = (ingredient: Ingredient): IngredientBatch => {
    return {
        id: uuidv4(),
        ingredientId: ingredient.id,
        initialQuantity: ingredient.stock || 0,
        currentQuantity: ingredient.stock || 0,
        unit: ingredient.unit,
        batchNumber: `LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
        expiresAt: new Date(Date.now() + INVENTORY.DEFAULT_EXPIRY_DAYS * TIME.MS_PER_DAY).toISOString(),
        receivedAt: new Date().toISOString(),
        costPerUnit: ingredient.costPerUnit,
        outletId: ingredient.outletId || 'unknown',
        status: 'ACTIVE'
    };
};

/**
 * Initialize batches for an ingredient if they don't exist (migration)
 * @param ingredient - Ingredient to initialize
 * @returns Ingredient with initialized batches
 */
export const initializeBatches = (ingredient: Ingredient): Ingredient => {
    if (ingredient.batches && ingredient.batches.length > 0) {
        return ingredient;
    }

    // Create default batch from current stock
    const batches = ingredient.stock && ingredient.stock > 0
        ? [createDefaultBatch(ingredient)]
        : [];

    return {
        ...ingredient,
        batches,
        stock: batches.reduce((sum, b) => sum + b.currentQuantity, 0)
    };
};

/**
 * Calculate total stock from batches
 * @param batches - Ingredient batches
 * @returns Total stock quantity
 */
export const calculateTotalStock = (batches: IngredientBatch[]): number => {
    return batches.reduce((sum, batch) => sum + batch.currentQuantity, 0);
};

/**
 * Get batches expiring within specified days
 * @param batches - Ingredient batches
 * @param days - Number of days to check
 * @returns Batches expiring within the specified period
 */
export const getBatchesExpiringSoon = (
    batches: IngredientBatch[],
    days: number = INVENTORY.EXPIRING_SOON_DAYS
): IngredientBatch[] => {
    const cutoffDate = new Date(Date.now() + days * TIME.MS_PER_DAY);

    return batches.filter(batch =>
        new Date(batch.expiresAt) <= cutoffDate
    ).sort((a, b) =>
        new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
    );
};
