import { v4 as uuidv4 } from 'uuid';
import { firestoreService } from './firestoreService';
import { COLLECTIONS } from '../firebase/collections';
import type { PurchaseOrder } from '../types/purchases';
import type { Ingredient, Batch } from '../types/inventory';
import { calculateTotalStock } from './inventoryService';

export const recepcionService = {
    receiveOrder: async (
        order: PurchaseOrder,
        receivedItems: { ingredientId: string; quantity: number; expiryDate?: string }[],
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

            // Create new Batch
            const newBatch: Batch = {
                id: uuidv4(),
                ingredientId: ingredient.id,
                batchNumber: `LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${order.orderNumber}`,
                initialQuantity: received.quantity,
                currentQuantity: received.quantity,
                unit: ingredient.unit,
                costPerUnit: ingredient.costPerUnit,
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
