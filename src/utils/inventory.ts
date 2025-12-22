import type { IngredientBatch } from '../types';

/**
 * Consumes stock from batches using FIFO (First In, First Out) algorithm
 * Prioritizes batches with earliest expiry dates
 * @param batches - Array of ingredient batches to consume from
 * @param quantityToConsume - Amount to consume
 * @returns New batches array after consumption and amount actually consumed
 */
export const consumeStockFIFO = (
    batches: IngredientBatch[],
    quantityToConsume: number
): { newBatches: IngredientBatch[]; consumed: number } => {
    if (!batches || batches.length === 0) {
        return { newBatches: [], consumed: 0 };
    }

    // Sort by expiry date (FIFO)
    const sortedBatches = [...batches].sort((a, b) =>
        new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
    );

    const newBatches: IngredientBatch[] = [];
    let remainingQtyToConsume = quantityToConsume;
    let totalConsumed = 0;

    for (const batch of sortedBatches) {
        if (remainingQtyToConsume <= 0) {
            // No more to consume, keep remaining batches as-is
            newBatches.push(batch);
            continue;
        }

        if (batch.currentQuantity > remainingQtyToConsume) {
            // Partial consumption of this batch
            newBatches.push({
                ...batch,
                currentQuantity: batch.currentQuantity - remainingQtyToConsume
            });
            totalConsumed += remainingQtyToConsume;
            remainingQtyToConsume = 0;
        } else {
            // Complete consumption of this batch (batch is depleted)
            totalConsumed += batch.currentQuantity;
            remainingQtyToConsume -= batch.currentQuantity;
            // Don't add to newBatches (batch is empty)
        }
    }

    return { newBatches, consumed: totalConsumed };
};

/**
 * Calculates total stock quantity from batches
 */
export const calculateTotalStock = (batches?: IngredientBatch[]): number => {
    if (!batches) return 0;
    return batches.reduce((sum, batch) => sum + batch.currentQuantity, 0);
};

/**
 * Creates a migration batch for ingredients without batch tracking
 * Used when converting from simple stock to batch-based inventory
 */
export const createMigrationBatch = (
    ingredientId: string,
    currentStock: number,
    costPerUnit: number
): IngredientBatch => {
    return {
        id: crypto.randomUUID(),
        ingredientId,
        initialQuantity: currentStock,
        currentQuantity: currentStock,
        unit: 'un', // Default unit, should be passed if available
        batchNumber: `LOT-MIG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days default
        receivedAt: new Date().toISOString(),
        costPerUnit: costPerUnit,
        outletId: 'unknown',
        status: 'ACTIVE'
    };
};
