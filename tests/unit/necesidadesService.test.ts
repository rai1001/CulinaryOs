import { describe, it, expect } from 'vitest';
import { necesidadesService } from '../../src/services/necesidadesService';
import type { Recipe, Ingredient } from '../../src/types';

describe('necesidadesService', () => {
    // Mock Data
    const mockRecipe: Recipe = {
        id: 'r1',
        name: 'Test Recipe',
        station: 'hot',
        yieldPax: 10,
        ingredients: [
            { ingredientId: 'i1', quantity: 100 }, // 10g per pax
            { ingredientId: 'i2', quantity: 50 }   // 5g per pax
        ]
    };

    const mockIngredients: Ingredient[] = [
        {
            id: 'i1',
            name: 'Ingrediente 1',
            unit: 'kg',
            costPerUnit: 10,
            yield: 1,
            allergens: [],
            stock: 0,
            batches: [
                { id: 'b1', ingredientId: 'i1', quantity: 15, currentQuantity: 15, batchNumber: '1', unit: 'kg', costPerUnit: 1, receivedAt: '', expiresAt: '', outletId: 'o1', status: 'ACTIVE' as const }
            ],
            reorderPoint: 20,
            optimalStock: 50
        },
        {
            id: 'i2',
            name: 'Ingrediente 2',
            unit: 'kg',
            costPerUnit: 5,
            yield: 1,
            allergens: [],
            stock: 0,
            batches: [], // 0 stock
            reorderPoint: 10,
            optimalStock: 20
        },
        {
            id: 'i3',
            name: 'Ingrediente 3',
            unit: 'kg',
            costPerUnit: 2,
            yield: 1,
            allergens: [],
            stock: 100, // Legacy stock check
            reorderPoint: 10,
            optimalStock: 20
        }
    ];

    it('scales recipe correctly', () => {
        const scaled = necesidadesService.scaleRecipe(mockRecipe, 20); // Double

        const i1 = scaled.find(i => i.ingredientId === 'i1');
        const i2 = scaled.find(i => i.ingredientId === 'i2');

        expect(i1?.quantity).toBe(200);
        expect(i2?.quantity).toBe(100);
    });

    it('aggregates production requirements', () => {
        const plans = [
            { recipe: mockRecipe, targetPax: 5 }, // 0.5x -> i1: 50, i2: 25
            { recipe: mockRecipe, targetPax: 10 } // 1.0x -> i1: 100, i2: 50
        ];

        const totals = necesidadesService.aggregateProductionRequirements(plans);

        expect(totals.get('i1')).toBe(150);
        expect(totals.get('i2')).toBe(75);
    });

    it('calculates reorder needs based on batches', () => {
        // i1: stock 15, reorder 20 -> Needs ordering (50 - 15 = 35)
        // i2: stock 0, reorder 10 -> Needs ordering (20 - 0 = 20)
        // i3: stock 100, reorder 10 -> No need

        const needs = necesidadesService.calculateReorderNeeds(mockIngredients);

        expect(needs).toHaveLength(2);

        const n1 = needs.find(n => n.ingredientId === 'i1');
        expect(n1).toBeDefined();
        expect(n1?.currentStock).toBe(15);
        expect(n1?.orderQuantity).toBe(35);

        const n2 = needs.find(n => n.ingredientId === 'i2');
        expect(n2).toBeDefined();
        expect(n2?.currentStock).toBe(0);
        expect(n2?.orderQuantity).toBe(20);
    });

    it('checks available stock for production', () => {
        const requirements = new Map<string, number>();
        requirements.set('i1', 20); // Need 20, have 15 -> Missing 5
        requirements.set('i3', 50); // Need 50, have 100 -> OK

        const results = necesidadesService.checkProductionAvailability(requirements, mockIngredients);

        expect(results).toHaveLength(1);
        expect(results[0].ingredientId).toBe('i1');
        expect(results[0].missingQuantity).toBe(5);
    });
});
