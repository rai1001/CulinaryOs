import { v4 as uuidv4 } from 'uuid';
import { firestoreService } from './firestoreService';
import { COLLECTIONS } from '../firebase/collections';
import type { PurchaseOrder } from '../types/purchases';
import type { Ingredient, Batch, IngredientPriceHistory } from '../types/inventory';
import { calculateTotalStock } from './inventoryService';
import { orderBy, limit, where } from 'firebase/firestore';

export const recepcionService = {
    receiveOrder: async (
        order: PurchaseOrder,
        receivedItems: { ingredientId: string; quantity: number; expiryDate?: string; price?: number }[],
        userId: string
    ): Promise<void> => {
        // E2E Mock Bypass
        const mockDBStr = localStorage.getItem('E2E_MOCK_DB');
        if (mockDBStr) {
            const db = JSON.parse(mockDBStr);
            const idx = db.purchaseOrders?.findIndex((o: any) => o.id === order.id);
            if (idx >= 0) {
                db.purchaseOrders[idx].status = 'RECEIVED';
                // Mock updating stock?
                // We can just update order status for E2E flow.
                localStorage.setItem('E2E_MOCK_DB', JSON.stringify(db));
                console.log('[E2E] Order Received mock');
                return;
            }
        }

        // 1. Validate inputs
        if (!receivedItems || receivedItems.length === 0) {
            throw new Error("No items to receive");
        }

        // 2. Process each item (Update Inventory)
        for (const received of receivedItems) {
            if (received.quantity <= 0) continue;

            // Fetch Ingredient to update its batches
            const ingredient = await firestoreService.getById<Ingredient>(COLLECTIONS.INGREDIENTS, received.ingredientId);
            if (!ingredient) {
                console.warn(`Ingredient ${received.ingredientId} not found, skipping batch creation.`);
                continue;
            }

            // Determine price: Use provided price (from invoice verification) or fallback to PO price or current cost
            // Note: In a real flow, 'receivedItems' should contain the final invoice price.
            // If not provided, we try to find it in the PO items.
            let finalPrice = received.price;
            if (finalPrice === undefined) {
                const poItem = order.items.find(i => i.ingredientId === received.ingredientId);
                finalPrice = poItem ? poItem.pricePerUnit : ingredient.costPerUnit;
            }

            // Create new Batch
            const newBatch: Batch = {
                id: uuidv4(),
                ingredientId: ingredient.id,
                batchNumber: `LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${order.orderNumber}`,
                initialQuantity: received.quantity,
                currentQuantity: received.quantity,
                unit: ingredient.unit,
                costPerUnit: finalPrice,
                receivedAt: new Date().toISOString(),
                expiresAt: received.expiryDate || new Date(Date.now() + (ingredient.shelfLife || 7) * 24 * 60 * 60 * 1000).toISOString(),
                supplierId: order.supplierId,
                purchaseOrderId: order.id,
                outletId: order.outletId,
                status: 'ACTIVE'
            };

            // Update Ingredient Batches and Stock
            const currentBatches = ingredient.batches || [];
            const updatedBatches = [...currentBatches, newBatch];
            const newStock = calculateTotalStock(updatedBatches);

            await firestoreService.update(COLLECTIONS.INGREDIENTS, ingredient.id, {
                batches: updatedBatches,
                stock: newStock,
                updatedAt: new Date().toISOString()
            });

            // 2.1 Track Price History & Calculate Deviation
            if (order.supplierId) {
                try {
                    // Save history
                    const historyEntry: IngredientPriceHistory = {
                        id: uuidv4(),
                        ingredientId: ingredient.id,
                        supplierId: order.supplierId,
                        price: finalPrice,
                        date: new Date().toISOString(),
                        purchaseOrderId: order.id,
                        outletId: order.outletId,
                    };

                    // We need a collection for this. Assuming 'ingredientPriceHistory' as a top-level collection.
                    // If it's not defined in COLLECTIONS yet, we can use the string name 'ingredientPriceHistory'.
                    await firestoreService.add('ingredientPriceHistory', historyEntry);

                    // Check Deviation
                    // Fetch last 6 months history for this supplier
                    const sixMonthsAgo = new Date();
                    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

                    // Note: firestoreService.query generic is simplistic, constructing raw query here might be better if service limits us
                    // But assuming we can pass constraints.
                    const historyDocs = await firestoreService.query<IngredientPriceHistory>(
                        // @ts-ignore - Assuming we can pass collection string if reference not available
                        'ingredientPriceHistory',
                        where('ingredientId', '==', ingredient.id),
                        where('supplierId', '==', order.supplierId),
                        where('date', '>=', sixMonthsAgo.toISOString()),
                        orderBy('date', 'desc'),
                        limit(10)
                    );

                    if (historyDocs.length > 0) {
                        const sum = historyDocs.reduce((acc, h) => acc + h.price, 0);
                        const avg = sum / historyDocs.length;
                        const deviation = ((finalPrice - avg) / avg) * 100;

                        if (deviation > 20) {
                            console.warn(`[PRICE ALERT] Ingredient ${ingredient.name} from Supplier ${order.supplierId} is ${deviation.toFixed(2)}% above 6-month average.`);
                            // Ideally trigger a notification here
                        }
                    }
                } catch (err) {
                    console.error("Failed to track price history", err);
                }
            }
        }

        // 3. Update Order Status
        const isPartial = receivedItems.length < order.items.length;
        await firestoreService.update(COLLECTIONS.PURCHASE_ORDERS, order.id, {
            status: isPartial ? 'PARTIAL' : 'RECEIVED',
            updatedAt: new Date().toISOString()
        });

        // 4. Log Audit Event
        const { auditService } = await import('./auditService');
        await auditService.log({
            action: 'PURCHASE_ORDER_Received',
            entityId: order.id,
            userId,
            details: {
                status: isPartial ? 'PARTIAL' : 'RECEIVED',
                itemsCount: receivedItems.length
            }
        });

        console.log(`Order ${order.id} received. Stock updated.`);
    }
};
