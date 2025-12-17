import type {
    Event, Menu, Recipe, Ingredient,
    MenuItemAnalytics, DishClassification
} from '../types';

/**
 * Helper function to classify dishes using Boston Matrix
 */
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
    if (isPopular && !isProfitable) return 'puzzle';
    if (!isPopular && isProfitable) return 'cash-cow';
    return 'dog';
}

/**
 * Optimized calculation of menu analytics using Maps for O(1) lookups
 */
export const calculateIngredientUsage = (
    events: Event[],
    menus: Menu[],
    recipes: Recipe[],
    ingredients: Ingredient[],
    startDate: string,
    endDate: string
): MenuItemAnalytics[] => {
    // 1. Pre-index data for O(1) access
    const ingredientMap = new Map(ingredients.map(i => [i.id, i]));
    const recipeMap = new Map(recipes.map(r => [r.id, r]));
    const menuMap = new Map(menus.map(m => [m.id, m]));

    // 2. Filter events
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    const filteredEvents = events.filter(event => {
        const eventTime = new Date(event.date).getTime();
        return eventTime >= start && eventTime <= end;
    });

    if (filteredEvents.length === 0) {
        return [];
    }

    // 3. Calculate stats
    const recipeStats = new Map<string, {
        totalOrders: number;
        totalRevenue: number;
        totalCost: number;
        lastOrdered: string;
        recipeName: string;
    }>();

    filteredEvents.forEach(event => {
        if (!event.menuId) return;

        const menu = menuMap.get(event.menuId);
        if (!menu || !menu.recipeIds || menu.recipeIds.length === 0) return;

        // Revenue per serving (menu price divided by number of recipes in menu)
        const revenuePerServing = (menu.sellPrice || 0) / menu.recipeIds.length;

        menu.recipeIds.forEach(recipeId => {
            const recipe = recipeMap.get(recipeId);
            if (!recipe) return;

            // Calculate recipe cost efficiently
            let recipeCost = 0;
            recipe.ingredients.forEach(ri => {
                const ing = ingredientMap.get(ri.ingredientId);
                if (ing) {
                    const netQuantity = ri.quantity * ing.yield;
                    recipeCost += netQuantity * ing.costPerUnit;
                }
            });

            const existing = recipeStats.get(recipeId) || {
                totalOrders: 0,
                totalRevenue: 0,
                totalCost: 0,
                lastOrdered: event.date,
                recipeName: recipe.name
            };

            recipeStats.set(recipeId, {
                totalOrders: existing.totalOrders + event.pax,
                totalRevenue: existing.totalRevenue + (revenuePerServing * event.pax),
                totalCost: existing.totalCost + (recipeCost * event.pax),
                lastOrdered: event.date > existing.lastOrdered ? event.date : existing.lastOrdered,
                recipeName: recipe.name
            });
        });
    });

    // 4. Totals for scoring
    let totalOrdersAll = 0;
    for (const stat of recipeStats.values()) {
        totalOrdersAll += stat.totalOrders;
    }

    // 5. Transform to Analytics array
    const analytics: MenuItemAnalytics[] = [];
    for (const [recipeId, stats] of recipeStats.entries()) {
        const totalProfit = stats.totalRevenue - stats.totalCost;
        const avgProfitPerServing = stats.totalOrders > 0
            ? totalProfit / stats.totalOrders
            : 0;

        const popularityScore = totalOrdersAll > 0 ? stats.totalOrders / totalOrdersAll : 0;
        const profitabilityScore = stats.totalRevenue > 0
            ? (totalProfit / stats.totalRevenue)
            : 0;

        analytics.push({
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
        });
    }

    return analytics.sort((a, b) => b.totalRevenue - a.totalRevenue);
};
