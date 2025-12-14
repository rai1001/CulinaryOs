import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import type { MenuItemAnalytics, DishClassification } from '../../types';

export interface AnalyticsSlice {
    calculateMenuAnalytics: (startDate: string, endDate: string) => MenuItemAnalytics[];
}

export const createAnalyticsSlice: StateCreator<
    AppState,
    [],
    [],
    AnalyticsSlice
> = (_set, get) => ({
    calculateMenuAnalytics: (startDate: string, endDate: string) => {
        const { events, recipes, menus, ingredients } = get();

        // Filter events by date range
        const filteredEvents = events.filter(event => {
            const eventDate = new Date(event.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return eventDate >= start && eventDate <= end;
        });

        if (filteredEvents.length === 0) {
            return [];
        }

        // Calculate recipe usage and revenue
        const recipeStats = new Map<string, {
            totalOrders: number;
            totalRevenue: number;
            totalCost: number;
            lastOrdered: string;
            recipeName: string;
        }>();

        filteredEvents.forEach(event => {
            if (!event.menuId) return;

            const menu = menus.find(m => m.id === event.menuId);
            if (!menu || !menu.recipeIds || menu.recipeIds.length === 0) return;

            menu.recipeIds.forEach(recipeId => {
                const recipe = recipes.find(r => r.id === recipeId);
                if (!recipe) return;

                // Calculate recipe cost
                let recipeCost = 0;
                recipe.ingredients.forEach(recipeIng => {
                    const ingredient = ingredients.find(i => i.id === recipeIng.ingredientId);
                    if (ingredient) {
                        const netQuantity = recipeIng.quantity * ingredient.yield;
                        recipeCost += netQuantity * ingredient.costPerUnit;
                    }
                });

                const existing = recipeStats.get(recipeId) || {
                    totalOrders: 0,
                    totalRevenue: 0,
                    totalCost: 0,
                    lastOrdered: event.date,
                    recipeName: recipe.name
                };

                // Revenue per serving (menu price divided by number of recipes in menu)
                const revenuePerServing = (menu.sellPrice || 0) / menu.recipeIds.length;

                recipeStats.set(recipeId, {
                    totalOrders: existing.totalOrders + event.pax,
                    totalRevenue: existing.totalRevenue + (revenuePerServing * event.pax),
                    totalCost: existing.totalCost + (recipeCost * event.pax),
                    lastOrdered: event.date > existing.lastOrdered ? event.date : existing.lastOrdered,
                    recipeName: recipe.name
                });
            });
        });

        // Calculate total orders for popularity calculation
        const totalOrders = Array.from(recipeStats.values()).reduce(
            (sum, stats) => sum + stats.totalOrders,
            0
        );

        // Convert to MenuItemAnalytics and classify
        const analytics: MenuItemAnalytics[] = Array.from(recipeStats.entries()).map(
            ([recipeId, stats]) => {
                const avgProfitPerServing = stats.totalOrders > 0
                    ? (stats.totalRevenue - stats.totalCost) / stats.totalOrders
                    : 0;

                const totalProfit = stats.totalRevenue - stats.totalCost;
                const popularityScore = totalOrders > 0 ? stats.totalOrders / totalOrders : 0;
                const profitabilityScore = stats.totalRevenue > 0
                    ? (totalProfit / stats.totalRevenue)
                    : 0;

                return {
                    recipeId,
                    recipeName: stats.recipeName,
                    totalRevenue: stats.totalRevenue,
                    totalOrders: stats.totalOrders,
                    avgProfitPerServing,
                    totalProfit,
                    popularityScore,
                    profitabilityScore,
                    classification: classifyDish(popularityScore, profitabilityScore),
                    lastOrdered: stats.lastOrdered
                };
            }
        );

        return analytics.sort((a, b) => b.totalRevenue - a.totalRevenue);
    }
});

// Helper function to classify dishes using Boston Matrix
function classifyDish(
    popularityScore: number,
    profitabilityScore: number
): DishClassification {
    // Thresholds: >50% for "high"
    const POPULARITY_THRESHOLD = 0.15; // 15% of total orders
    const PROFITABILITY_THRESHOLD = 0.40; // 40% profit margin

    const isPopular = popularityScore >= POPULARITY_THRESHOLD;
    const isProfitable = profitabilityScore >= PROFITABILITY_THRESHOLD;

    if (isPopular && isProfitable) return 'star';
    if (isPopular && !isProfitable) return 'cash-cow';
    if (!isPopular && isProfitable) return 'puzzle';
    return 'dog';
}
