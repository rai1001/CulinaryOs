import { describe, it, expect } from 'vitest';
import { calculateStockNeeds, calculateOrderQuantity } from '../services/purchasingService';
import type { Ingredient } from '../types';

describe('Purchasing Service Logic', () => {

    describe('calculateOrderQuantity', () => {
        it('should return exact need if no minOrder', () => {
            expect(calculateOrderQuantity(5.5)).toBe(5.5);
        });

        it('should return minOrder if need is lower', () => {
            expect(calculateOrderQuantity(2, 10)).toBe(10);
        });

        it('should return need if higher than minOrder', () => {
            expect(calculateOrderQuantity(15, 10)).toBe(15);
        });

        it('should handle decimals correctly', () => {
            expect(calculateOrderQuantity(3.333)).toBe(3.34);
        });
    });

    describe('calculateStockNeeds', () => {
        it('should identify items below reorder point', () => {
            const ingredients: Partial<Ingredient>[] = [
                { id: '1', name: 'Low Stock', stock: 2, optimalStock: 10, reorderPoint: 3 },
                { id: '2', name: 'Ok Stock', stock: 8, optimalStock: 10, reorderPoint: 3 },
            ];

            const result = calculateStockNeeds(ingredients as Ingredient[]);
            expect(result).toHaveLength(1);
            expect(result[0].ingredient.id).toBe('1');
            expect(result[0].deficit).toBe(8); // 10 - 2
        });

        it('should use default reorder point (20%) if not set', () => {
            const ingredients: Partial<Ingredient>[] = [
                { id: '1', name: 'Default Reorder', stock: 1, optimalStock: 10 }, // 1 < 2 (20% of 10)
            ];
            const result = calculateStockNeeds(ingredients as Ingredient[]);
            expect(result).toHaveLength(1);
        });

        it('should ignore items with 0 optimal stock', () => {
            const ingredients: Partial<Ingredient>[] = [
                { id: '1', name: 'No Optimal', stock: 0, optimalStock: 0 },
            ];
            const result = calculateStockNeeds(ingredients as Ingredient[]);
            expect(result).toHaveLength(0);
        });
    });
});
