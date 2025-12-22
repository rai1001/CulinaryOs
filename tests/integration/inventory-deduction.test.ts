
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { deductStockForEvent } from '../../src/services/inventoryService';
import { firestoreService } from '../../src/services/firestoreService';
import { COLLECTIONS } from '../../src/firebase/collections';
import type { Event, Menu, Recipe, Ingredient } from '../../src/types';

describe('Integración Inventario - Deducciones', () => {

    beforeEach(() => {
        // Setup E2E Mock DB in localStorage
        const today = new Date().toISOString();
        const mockDB = {
            ingredients: [
                {
                    id: 'ing-1',
                    name: 'Carne',
                    costPerUnit: 10,
                    unit: 'kg',
                    outletId: 'test-outlet',
                    stock: 10,
                    batches: [
                        {
                            id: 'batch-1',
                            ingredientId: 'ing-1',
                            initialQuantity: 10,
                            currentQuantity: 10,
                            expiresAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                            receivedAt: today,
                            costPerUnit: 10,
                            outletId: 'test-outlet'
                        }
                    ]
                }
            ],
            recipes: [
                {
                    id: 'recipe-1',
                    name: 'Hamburguesa',
                    outletId: 'test-outlet',
                    yieldPax: 1, // 1 pax per recipe unit (serving)
                    ingredients: [
                        {
                            ingredientId: 'ing-1',
                            quantity: 0.2 // 0.2 kg meat per burger
                        }
                    ]
                }
            ],
            menus: [
                {
                    id: 'menu-1',
                    name: 'Menu Evento',
                    outletId: 'test-outlet',
                    recipeIds: ['recipe-1']
                }
            ],
            events: [
                {
                    id: 'event-1',
                    name: 'Boda Test',
                    outletId: 'test-outlet',
                    date: today,
                    pax: 50,
                    menuId: 'menu-1',
                    type: 'Boda'
                }
            ]
        };
        localStorage.setItem('E2E_MOCK_DB', JSON.stringify(mockDB));
    });

    afterEach(() => {
        localStorage.removeItem('E2E_MOCK_DB');
    });

    it('debería deducir stock basado en evento y menú', async () => {
        // 1. Execute Deduction
        await deductStockForEvent('event-1');

        // 2. Verify Result using Mock DB state
        // Needed: 50 pax * 0.2 kg = 10 kg.
        // Batch has 10 kg. So it should be fully consumed.

        const mockDB = JSON.parse(localStorage.getItem('E2E_MOCK_DB')!);
        const ingredient = mockDB.ingredients.find((i: any) => i.id === 'ing-1');

        expect(ingredient.stock).toBe(0);
        expect(ingredient.batches).toHaveLength(0);
    });

    it('debería deducir stock parcialmente si hay múltiples lotes', async () => {
        // Update Mock to have 2 batches
        const mockDB = JSON.parse(localStorage.getItem('E2E_MOCK_DB')!);
        mockDB.ingredients[0].batches = [
            {
                id: 'batch-1',
                currentQuantity: 5,
                expiresAt: new Date(Date.now()).toISOString(), // Expires today (First out)
            },
            {
                id: 'batch-2',
                currentQuantity: 10,
                expiresAt: new Date(Date.now() + 86400000).toISOString(), // Expires tomorrow
            }
        ];
        mockDB.ingredients[0].stock = 15;
        localStorage.setItem('E2E_MOCK_DB', JSON.stringify(mockDB));

        // Deduct 10kg
        await deductStockForEvent('event-1');

        // Verify
        const db = JSON.parse(localStorage.getItem('E2E_MOCK_DB')!);
        const ing = db.ingredients[0];

        // Batch 1 (5kg) -> fully consumed
        // Batch 2 (10kg) -> 5kg consumed, 5kg remaining
        // Total Stock: 5

        expect(ing.stock).toBe(5);
        // Note: consumeStockFIFO returns NEW batches array. 
        // Logic: if batch consumed fully, it MIGHT be removed or quantity 0.
        // My implementation in consumeStockFIFO: "Fully consume this batch (don't push to newBatches)".
        // So batch-1 should be gone.

        expect(ing.batches).toHaveLength(1);
        expect(ing.batches[0].id).toBe('batch-2');
        expect(ing.batches[0].currentQuantity).toBe(5);
    });
});
