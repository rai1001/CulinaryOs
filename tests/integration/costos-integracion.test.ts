
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { calcularCostosFicha, recalcularFicha } from '../../src/services/costosService';
import type { Ingredient, CreateFichaDTO, IngredienteFicha, FichaTecnica } from '../../src/types';

describe('Integración Fichas - Costos', () => {

    beforeEach(() => {
        // Setup E2E Mock DB in localStorage
        const mockDB = {
            ingredients: [
                {
                    id: 'ing-1',
                    name: 'Harina',
                    costPerUnit: 1.50, // 1.50 per kg
                    unit: 'kg',
                    yield: 1, // 100% yield
                    outletId: 'test-outlet'
                },
                {
                    id: 'ing-2',
                    name: 'Tomate',
                    costPerUnit: 2.00, // 2.00 per kg
                    unit: 'kg',
                    yield: 0.9, // 90% yield (merma)
                    outletId: 'test-outlet'
                }
            ],
            purchaseOrders: [],
            fichasTecnicas: []
        };
        localStorage.setItem('E2E_MOCK_DB', JSON.stringify(mockDB));
    });

    afterEach(() => {
        localStorage.removeItem('E2E_MOCK_DB');
    });

    it('debería calcular el costo inicial de una ficha correctamente', async () => {
        const ingredientesFicha: IngredienteFicha[] = [
            {
                ingredienteId: 'ing-1', // Harina
                nombre: 'Harina',
                cantidad: 0.5, // 0.5 kg
                unidad: 'kg',
                esOpcional: false,
                costoUnitario: 0,
                costoTotal: 0
            },
            {
                ingredienteId: 'ing-2', // Tomate
                nombre: 'Tomate',
                cantidad: 1, // 1 kg
                unidad: 'kg',
                esOpcional: false,
                costoUnitario: 0,
                costoTotal: 0
            }
        ];

        const fichaDTO: Partial<CreateFichaDTO> = {
            nombre: 'Salsa Base',
            porciones: 4,
            ingredientes: ingredientesFicha,
            costos: { manoObra: 5, energia: 2, ingredientes: 0, total: 0, porPorcion: 0 }
        };

        const costos = await calcularCostosFicha(fichaDTO);

        expect(costos.ingredientes).toBeCloseTo(2.97, 2);
        expect(costos.total).toBeCloseTo(9.97, 2);
        expect(costos.porPorcion).toBeCloseTo(2.49, 2);
    });

    it('debería recalcular el costo cuando cambia el precio del ingrediente', async () => {
        // 1. Create initial Ficha
        const costosIniciales = { ingredientes: 2.97, manoObra: 7, energia: 0, total: 9.97, porPorcion: 2.49 };
        const ficha: FichaTecnica = {
            id: 'ficha-1',
            nombre: 'Salsa Base',
            version: 1,
            activa: true,
            creadoPor: 'user',
            fechaCreacion: '',
            ultimaModificacion: '',
            outletId: 'test-outlet',
            categoria: 'comida',
            porciones: 4,
            ingredientes: [
                {
                    ingredienteId: 'ing-1',
                    nombre: 'Harina',
                    cantidad: 0.5,
                    unidad: 'kg',
                    esOpcional: false,
                    costoUnitario: 1.50,
                    costoTotal: 0.75
                }
            ],
            costos: { ...costosIniciales },
            pricing: { margenObjetivo: 70 } // Fixed lint error
        };

        // 2. Update Ingredient Price in Mock DB
        const mockDB = JSON.parse(localStorage.getItem('E2E_MOCK_DB')!);
        mockDB.ingredients[0].costPerUnit = 3.00; // Double the price of Harina
        localStorage.setItem('E2E_MOCK_DB', JSON.stringify(mockDB));

        // 3. Recalculate
        const fichaActualizada = await recalcularFicha(ficha);

        // Verify
        // Harina: 0.5kg * 3.00 = 1.50
        // Fixed costs: 7.00
        // Total: 8.50
        expect(fichaActualizada.costos.ingredientes).toBeCloseTo(1.50, 2);
        expect(fichaActualizada.costos.total).toBeCloseTo(8.50, 2);
    });
});
