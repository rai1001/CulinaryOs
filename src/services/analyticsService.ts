/**
 * @file src/services/analyticsService.ts
 * @description Service for analyzing Ficha Técnica profitability and calculating metrics.
 */

import type { FichaTecnica, Event, Menu, Recipe, Ingredient, MenuItemAnalytics, DishClassification } from '../types';

export interface Optimizacion {
    tipo: 'ingrediente_caro' | 'margen_bajo' | 'porcion_grande' | 'desperdicio_alto';
    descripcion: string;
    impactoEstimado: number;
    sugerencia: string;
    prioridad: 'high' | 'medium' | 'low';
}

export interface AnalisisPlato {
    fichaId: string;
    nombre: string;
    costoIngredientes: number;
    costoPorcentajeIngredientes: number;
    ingredienteMasCaro: {
        nombre: string;
        costo: number;
        porcentaje: number;
    };
    costoPromedioCategoria: number;
    posicionEnCategoria: number;
    totalEnCategoria: number;
    margen: number;
    margenVsPromedio: number;
    optimizaciones: Optimizacion[];
}

export interface GlobalMetrics {
    totalFichas: number;
    costoPromedio: number;
    margenPromedio: number;
    masRentable: FichaTecnica | null;
}

/**
 * Calculates global metrics for a list of technical sheets.
 */
export function calculateGlobalMetrics(fichas: FichaTecnica[]): GlobalMetrics {
    if (fichas.length === 0) {
        return { totalFichas: 0, costoPromedio: 0, margenPromedio: 0, masRentable: null };
    }

    const total = fichas.length;
    const avgCost = fichas.reduce((acc, f) => acc + f.costos.porPorcion, 0) / total;
    const avgMargin = fichas.reduce((acc, f) => acc + (f.pricing.margenBruto || 0), 0) / total;

    const masRentable = [...fichas].sort((a, b) =>
        (b.pricing.margenBruto || 0) - (a.pricing.margenBruto || 0)
    )[0];

    return {
        totalFichas: total,
        costoPromedio: avgCost,
        margenPromedio: avgMargin,
        masRentable
    };
}

/**
 * Detects potential optimizations for a given recipe.
 */
export function detectarOptimizaciones(
    ficha: FichaTecnica,
    fichasCategoria: FichaTecnica[]
): Optimizacion[] {
    const optimizaciones: Optimizacion[] = [];

    // 1. Ingrediente muy caro (>60% of cost)
    const ingredienteMasCaro = ficha.ingredientes.reduce((max, ing) =>
        ing.costoTotal > max.costoTotal ? ing : max
        , ficha.ingredientes[0]);

    if (ingredienteMasCaro && (ingredienteMasCaro.costoTotal / ficha.costos.ingredientes > 0.6)) {
        optimizaciones.push({
            tipo: 'ingrediente_caro',
            descripcion: `${ingredienteMasCaro.nombre} representa ${((ingredienteMasCaro.costoTotal / ficha.costos.ingredientes) * 100).toFixed(0)}% del costo total`,
            impactoEstimado: ingredienteMasCaro.costoTotal * 0.2,
            sugerencia: `Considera reducir la cantidad de ${ingredienteMasCaro.nombre} o buscar alternativa más económica`,
            prioridad: 'high'
        });
    }

    // 2. Margen bajo comparado con categoría
    const margenPromedio = fichasCategoria.length > 0
        ? fichasCategoria.reduce((acc, f) => acc + (f.pricing.margenBruto || 0), 0) / fichasCategoria.length
        : 0;

    if ((ficha.pricing.margenBruto || 0) < margenPromedio - 10) {
        optimizaciones.push({
            tipo: 'margen_bajo',
            descripcion: `Margen ${ficha.pricing.margenBruto}% está ${(margenPromedio - (ficha.pricing.margenBruto || 0)).toFixed(0)}% por debajo del promedio de la categoría`,
            impactoEstimado: (margenPromedio - (ficha.pricing.margenBruto || 0)) * (ficha.pricing.precioVentaSugerido || 0) / 100,
            sugerencia: `Considera aumentar precio de venta o reducir costos`,
            prioridad: 'medium'
        });
    }

    return optimizaciones;
}

/**
 * Detailed analytics for a single sheet.
 */
export function analizarFicha(
    ficha: FichaTecnica,
    fichasCategoria: FichaTecnica[]
): AnalisisPlato {
    const ingredienteMasCaro = ficha.ingredientes.reduce((max, ing) =>
        ing.costoTotal > max.costoTotal ? ing : max
        , ficha.ingredientes[0]);

    const costoPromedioCategoria = fichasCategoria.length > 0
        ? fichasCategoria.reduce((acc, f) => acc + f.costos.porPorcion, 0) / fichasCategoria.length
        : 0;

    const fichasOrdenadas = [...fichasCategoria].sort((a, b) => a.costos.porPorcion - b.costos.porPorcion);
    const posicion = fichasOrdenadas.findIndex(f => f.id === ficha.id) + 1;

    return {
        fichaId: ficha.id,
        nombre: ficha.nombre,
        costoIngredientes: ficha.costos.ingredientes,
        costoPorcentajeIngredientes: (ficha.costos.ingredientes / (ficha.costos.total || 1)) * 100,
        ingredienteMasCaro: {
            nombre: ingredienteMasCaro?.nombre || 'N/A',
            costo: ingredienteMasCaro?.costoTotal || 0,
            porcentaje: ingredienteMasCaro ? (ingredienteMasCaro.costoTotal / (ficha.costos.ingredientes || 1)) * 100 : 0
        },
        costoPromedioCategoria,
        posicionEnCategoria: posicion,
        totalEnCategoria: fichasCategoria.length,
        margen: ficha.pricing.margenBruto || 0,
        margenVsPromedio: (ficha.pricing.margenBruto || 0) - (fichasCategoria.reduce((acc, f) => acc + (f.pricing.margenBruto || 0), 0) / (fichasCategoria.length || 1)),
        optimizaciones: detectarOptimizaciones(ficha, fichasCategoria)
    };
}

/**
 * Calculates menu engineering analytics based on events and dishes.
 */
export function calculateIngredientUsage(
    events: Event[],
    menus: Menu[],
    recipes: Recipe[],
    _ingredients: Ingredient[],
    startDate: string,
    endDate: string
): MenuItemAnalytics[] {
    const rangeEvents = events.filter(e => e.date >= startDate && e.date <= endDate);
    const statsMap = new Map<string, { totalOrders: number; totalRevenue: number; totalProfit: number; lastOrdered: string }>();

    rangeEvents.forEach(event => {
        const menu = menus.find(m => m.id === event.menuId);
        if (!menu) return;

        const recipesInMenu = recipes.filter(r => menu.recipeIds.includes(r.id));
        const pricePerDish = (menu.sellPrice || 0) / (recipesInMenu.length || 1);

        recipesInMenu.forEach(recipe => {
            const current = statsMap.get(recipe.id) || { totalOrders: 0, totalRevenue: 0, totalProfit: 0, lastOrdered: event.date };
            const costPerServing = recipe.totalCost || 0;
            const profitPerServing = pricePerDish - costPerServing;

            statsMap.set(recipe.id, {
                totalOrders: current.totalOrders + event.pax,
                totalRevenue: current.totalRevenue + (pricePerDish * event.pax),
                totalProfit: current.totalProfit + (profitPerServing * event.pax),
                lastOrdered: event.date > current.lastOrdered ? event.date : current.lastOrdered
            });
        });
    });

    const results: MenuItemAnalytics[] = Array.from(statsMap.entries()).map(([recipeId, stats]) => {
        const recipe = recipes.find(r => r.id === recipeId);
        const avgProfit = stats.totalOrders > 0 ? stats.totalProfit / stats.totalOrders : 0;

        return {
            recipeId,
            recipeName: recipe?.name || 'Receta Desconocida',
            totalRevenue: stats.totalRevenue,
            totalOrders: stats.totalOrders,
            avgProfitPerServing: avgProfit,
            totalProfit: stats.totalProfit,
            popularityScore: 0, // Calculated below
            profitabilityScore: 0, // Calculated below
            classification: 'dog' as DishClassification, // Calculated below
            lastOrdered: stats.lastOrdered
        };
    });

    if (results.length === 0) return [];

    // Calculate Scores and Classification
    const maxOrders = Math.max(...results.map(r => r.totalOrders));
    const avgProfit = results.reduce((acc, r) => acc + r.avgProfitPerServing, 0) / results.length;

    return results.map(r => {
        const popularity = r.totalOrders / (maxOrders || 1);
        const profitability = r.avgProfitPerServing >= avgProfit ? 1 : 0.4; // Binary high/low for simplicity base

        let classification: DishClassification = 'dog';
        if (popularity >= 0.7 && profitability === 1) classification = 'star';
        else if (popularity >= 0.7 && profitability < 1) classification = 'cash-cow';
        else if (popularity < 0.7 && profitability === 1) classification = 'puzzle';

        return {
            ...r,
            popularityScore: popularity,
            profitabilityScore: profitability,
            classification
        };
    });
}
