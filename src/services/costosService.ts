/**
 * @file src/services/costosService.ts
 * @description Service for automatic cost calculation of Fichas Técnicas.
 */

import { firestoreService } from './firestoreService';
import { COLLECTIONS } from '../firebase/collections';
import { convertUnit } from '../utils/unitConverter';
import { calcularCostoIngrediente, calcularSugerenciaPrecio } from '../utils/precioCalculator';
import type {
    CreateFichaDTO,
    FichaTecnica,
    Ingredient,
    Unit
} from '../types';

export type EstrategiaCosto = 'ultima_compra' | 'costo_actual' | 'costo_estandar';

/**
 * Gets the unit cost of an ingredient from the inventory.
 */
export async function obtenerCostoIndividual(
    ingredienteId: string,
    _estrategia: EstrategiaCosto = 'costo_actual'
): Promise<{ costo: number; unidad: Unit; yield: number; nombre: string }> {
    const ingredient = await firestoreService.getById<Ingredient>(COLLECTIONS.INGREDIENTS, ingredienteId);

    if (!ingredient) {
        throw new Error(`Ingredient not found: ${ingredienteId}`);
    }

    // For now, we use the costPerUnit from the ingredient record which should be updated by purchasing/reception
    return {
        costo: ingredient.costPerUnit || 0,
        unidad: ingredient.unit,
        yield: ingredient.yield || 1,
        nombre: ingredient.name
    };
}

/**
 * Calculates all costs for a Ficha Técnica DTO.
 */
export async function calcularCostosFicha(
    data: Partial<CreateFichaDTO>
): Promise<FichaTecnica['costos']> {
    let costoIngredientes = 0;

    if (data.ingredientes) {
        for (const item of data.ingredientes) {
            try {
                const info = await obtenerCostoIndividual(item.ingredienteId);

                // Convert recipe unit to inventory unit if they differ
                const cantidadEnUnidadBase = convertUnit(item.cantidad, item.unidad, info.unidad);

                // Calculate cost accounting for yield
                const costoItem = calcularCostoIngrediente(
                    cantidadEnUnidadBase,
                    info.costo,
                    info.yield
                );

                // Update item with denormalized cost info for history/UI
                item.costoUnitario = info.costo;
                item.costoTotal = Number(costoItem.toFixed(4));
                item.nombre = info.nombre; // Ensure name is up to date

                costoIngredientes += costoItem;
            } catch (error) {
                console.error(`Error calculating cost for ingredient ${item.ingredienteId}:`, error);
                // We continue with other ingredients but maybe mark as error?
            }
        }
    }

    const porciones = data.porciones || 1;
    const manoObra = data.costos?.manoObra || 0;
    const energia = data.costos?.energia || 0;
    const total = costoIngredientes + manoObra + energia;

    return {
        ingredientes: Number(costoIngredientes.toFixed(2)),
        manoObra,
        energia,
        total: Number(total.toFixed(2)),
        porPorcion: Number((total / porciones).toFixed(2))
    };
}

/**
 * Recalculates costs for an existing Ficha.
 * Useful when ingredient prices change.
 */
export async function recalcularFicha(ficha: FichaTecnica): Promise<FichaTecnica> {
    const nuevosCostos = await calcularCostosFicha(ficha);

    // Optionally update pricing suggestion if auto-pricing is enabled
    const pricing = ficha.pricing.margenBruto
        ? { ...ficha.pricing, ...calcularSugerenciaPrecio(nuevosCostos.porPorcion, (ficha.pricing.margenBruto / (ficha.pricing.precioVentaSugerido || 1)) * 100) }
        : ficha.pricing;

    return {
        ...ficha,
        costos: nuevosCostos,
        pricing
    };
}
