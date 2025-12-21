import { db } from "../firebase/config";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { addDocument } from "./firestoreService";
import { COLLECTIONS } from "../firebase/collections";
import type {
    Ingredient,
    Supplier,
    PurchaseOrder,
    PurchaseOrderItem,
    StockMovement,
    Unit
} from "../types";

// Helper to determine order quantity based on needs and supplier constraints
export const calculateOrderQuantity = (
    need: number,
    minOrder?: number,
    // packSize? // Future: optimization for pack sizes
): number => {
    let quantity = need;
    if (minOrder && quantity < minOrder) {
        quantity = minOrder;
    }
    return Math.ceil(quantity * 100) / 100; // Round to 2 decimals
};

export const generateDraftOrder = async (
    supplierId: string,
    outletId: string,
    items: { ingredient: Ingredient, quantity: number }[]
): Promise<string> => {

    // Calculate totals
    const orderItems: PurchaseOrderItem[] = items.map(({ ingredient, quantity }) => ({
        ingredientId: ingredient.id,
        quantity,
        unit: ingredient.unit,
        costPerUnit: ingredient.costPerUnit,
    }));

    const totalCost = orderItems.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);

    const orderData: Omit<PurchaseOrder, 'id'> = {
        supplierId,
        outletId,
        status: 'DRAFT',
        date: new Date().toISOString(),
        items: orderItems,
        totalCost,
        type: 'MANUAL', // Default to MANUAL, can be overridden if called from auto-job
        notes: 'Generado automáticamente'
    };

    return await addDocument(collection(db, COLLECTIONS.PURCHASE_ORDERS), orderData);
};

// Logic to analyze stock vs optimal levels
export const calculateStockNeeds = (ingredients: Ingredient[]): { ingredient: Ingredient, deficit: number }[] => {
    return ingredients
        .filter(ing => {
            // Only consider ingredients with optimalStock defined and tracked
            const currentStock = ing.stock || 0;
            const optimal = ing.optimalStock || 0;
            const reorderPoint = ing.reorderPoint || (optimal * 0.2); // Default to 20% if not set

            return optimal > 0 && currentStock <= reorderPoint;
        })
        .map(ing => ({
            ingredient: ing,
            deficit: (ing.optimalStock || 0) - (ing.stock || 0)
        }));
};

/**
 * Main function to run the "Restock" algorithm for a specific supplier
 * or all suppliers if supplierId is not provided.
 */
export const runAutorestock = async (outletId: string, supplierId?: string): Promise<string[]> => {
    // 1. Fetch all ingredients for the outlet
    // In a real app with thousands of items, we would query only those below reorderPoint
    // For now, we fetch all to handle logic in memory as per current scale.
    const q = query(collection(db, COLLECTIONS.INGREDIENTS), where("outletId", "==", outletId));
    const snapshot = await getDocs(q);
    const allIngredients = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ingredient));

    // 2. Calculate needs
    const needs = calculateStockNeeds(allIngredients);
    if (needs.length === 0) return [];

    // 3. Group by Supplier
    const bySupplier: Record<string, { ingredient: Ingredient, quantity: number }[]> = {};

    needs.forEach(need => {
        const supId = need.ingredient.supplierId || 'UNKNOWN';
        if (supplierId && supId !== supplierId) return; // Filter if specific supplier requested

        if (!bySupplier[supId]) bySupplier[supId] = [];
        bySupplier[supId].push({
            ingredient: need.ingredient,
            quantity: need.deficit
        });
    });

    // 4. Create Draft Orders
    const createdOrderIds: string[] = [];

    for (const [supId, items] of Object.entries(bySupplier)) {
        if (supId === 'UNKNOWN') continue; // Skip items without supplier

        // Check Minimum Order Value logic could go here by fetching Supplier details first
        // const supplier = await getDocument('suppliers', supId); 
        // if (total < supplier.minOrder) ...

        const orderId = await generateDraftOrder(supId, outletId, items);
        createdOrderIds.push(orderId);
    }

    return createdOrderIds;
};
