import { v4 as uuidv4 } from 'uuid';
import { TIME, INVENTORY } from '../constants';
import type { Ingredient, IngredientBatch, Event, Menu, Recipe } from '../types';
import { firestoreService } from './firestoreService';
import { COLLECTIONS } from '../firebase/collections';

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

// Imports needed for deduction logic
// Imports needed for deduction logic (Moved to top)

/**
 * Deducts stock for a completed event based on its menu and PAX.
 * @param eventId - ID of the event
 * @param userId - ID of the user performing the action (for logging, future use)
 */
export const deductStockForEvent = async (eventId: string, _userId?: string): Promise<void> => {
    // 1. Fetch Event
    const event = await firestoreService.getById<Event>(COLLECTIONS.EVENTS, eventId);
    if (!event || !event.menuId) return;

    // 2. Fetch Menu
    const menu = await firestoreService.getById<Menu>(COLLECTIONS.MENUS, event.menuId);
    if (!menu || !menu.recipeIds || menu.recipeIds.length === 0) return;

    // 3. Fetch Recipes
    // Optimization: potentially fetch all recipes in one go if "in" query supported or fetch parallel
    const recipes: Recipe[] = [];
    for (const recipeId of menu.recipeIds) {
        const recipe = await firestoreService.getById<Recipe>(COLLECTIONS.RECIPES, recipeId);
        if (recipe) recipes.push(recipe);
    }

    if (recipes.length === 0) return;

    // 4. Calculate Total Ingredient Needs
    const ingredientNeeds: Record<string, number> = {};

    recipes.forEach(recipe => {
        const yieldPax = recipe.yieldPax || 1;
        const multiplier = event.pax / yieldPax;

        recipe.ingredients.forEach(ri => {
            const current = ingredientNeeds[ri.ingredientId] || 0;
            ingredientNeeds[ri.ingredientId] = current + (ri.quantity * multiplier);
        });
    });

    // 5. Fetch Ingredients and Deduct
    for (const [ingId, qtyNeeded] of Object.entries(ingredientNeeds)) {
        if (qtyNeeded <= 0) continue;

        const ingredient = await firestoreService.getById<Ingredient>(COLLECTIONS.INGREDIENTS, ingId);
        if (!ingredient) continue;

        // Ensure batches exist
        const ingWithBatches = initializeBatches(ingredient);
        const batches = ingWithBatches.batches || [];

        // Consume
        const newBatches = consumeStockFIFO(batches, qtyNeeded);
        const newStock = calculateTotalStock(newBatches);

        // Update Ingredient
        // We only update batches and stock. (Cost might change if we tracked FIFO cost, but keeping simple for now)
        await firestoreService.update(COLLECTIONS.INGREDIENTS, ingId, {
            batches: newBatches,
            stock: newStock
        });
    }
};
