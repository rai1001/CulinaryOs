import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calcularCostosFicha, obtenerCostoIndividual } from '../../src/services/costosService';
import { firestoreService } from '../../src/services/firestoreService';
import type { Ingredient } from '../../src/types';

// Mock firestoreService
vi.mock('../../src/services/firestoreService', () => ({
    firestoreService: {
        getById: vi.fn()
    }
}));

describe('costosService', () => {
    const mockIngredients: Record<string, Ingredient> = {
        'i1': {
            id: 'i1',
            name: 'Tomate',
            unit: 'kg',
            costPerUnit: 2, // 2€/kg
            yield: 0.9, // 10% loss
            allergens: [],
            stock: 10
        } as Ingredient,
        'i2': {
            id: 'i2',
            name: 'Sal',
            unit: 'g',
            costPerUnit: 0.01, // 0.01€/g (10€/kg)
            yield: 1,
            allergens: [],
            stock: 1000
        } as Ingredient
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (firestoreService.getById as any).mockImplementation((_coll: string, id: string) => {
            return Promise.resolve(mockIngredients[id]);
        });
    });

    describe('obtenerCostoIndividual', () => {
        it('should return correct cost data for an ingredient', async () => {
            const info = await obtenerCostoIndividual('i1');
            expect(info.costo).toBe(2);
            expect(info.yield).toBe(0.9);
            expect(info.unidad).toBe('kg');
        });

        it('should throw error if ingredient not found', async () => {
            (firestoreService.getById as any).mockResolvedValue(null);
            await expect(obtenerCostoIndividual('non-existent')).rejects.toThrow('Ingredient not found');
        });
    });

    describe('calcularCostosFicha', () => {
        it('should calculate total cost correctly with yield and unit conversion', async () => {
            const fichaDTO = {
                nombre: 'Salsa',
                porciones: 4,
                ingredientes: [
                    {
                        ingredienteId: 'i1',
                        nombre: '',
                        cantidad: 500, // 500g of Tomato
                        unidad: 'g' as any,
                        costoUnitario: 0,
                        costoTotal: 0,
                        esOpcional: false
                    },
                    {
                        ingredienteId: 'i2',
                        nombre: '',
                        cantidad: 10, // 10g of Salt
                        unidad: 'g' as any,
                        costoUnitario: 0,
                        costoTotal: 0,
                        esOpcional: false
                    }
                ],
                pasos: [],
                costos: {
                    manoObra: 1,
                    energia: 0.5,
                    ingredientes: 0,
                    total: 0,
                    porPorcion: 0
                }
            };

            const costos = await calcularCostosFicha(fichaDTO as any);

            /**
             * Expected Calculation:
             * i1 (Tomato): 500g = 0.5kg
             * Cost = (0.5kg * 2€/kg) / 0.9 yield = 1€ / 0.9 = 1.1111€
             * 
             * i2 (Salt): 10g
             * Cost = (10g * 0.01€/g) / 1 yield = 0.1€
             * 
             * Total Ingredientes = 1.1111 + 0.1 = 1.2111 -> Rounded to 1.21
             * Total = 1.21 + 1 (MO) + 0.5 (Energy) = 2.71
             * Por Porcion = 2.71 / 4 = 0.6775 -> Rounded to 0.68
             */

            expect(costos.ingredientes).toBe(1.21);
            expect(costos.total).toBe(2.71);
            expect(costos.porPorcion).toBe(0.68);
        });

        it('should handle zero ingredients', async () => {
            const costos = await calcularCostosFicha({ porciones: 1 });
            expect(costos.ingredientes).toBe(0);
            expect(costos.total).toBe(0);
        });
    });
});
