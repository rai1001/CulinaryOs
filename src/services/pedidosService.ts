import { v4 as uuidv4 } from 'uuid';
import { firestoreService } from './firestoreService';
import { COLLECTIONS } from '../firebase/collections';
import type { ReorderNeed } from './necesidadesService';
import type { PurchaseOrder, PurchaseOrderItem, PurchaseStatus } from '../types/purchases';
import { collection } from 'firebase/firestore';
import { db } from '../firebase/config';

export const pedidosService = {
    groupNeedsBySupplier: (needs: ReorderNeed[]): Map<string, ReorderNeed[]> => {
        const grouped = new Map<string, ReorderNeed[]>();

        for (const need of needs) {
            const supplierId = need.supplierId || 'UNKNOWN_SUPPLIER';
            const list = grouped.get(supplierId) || [];
            list.push(need);
            grouped.set(supplierId, list);
        }

        return grouped;
    },

    createDraftOrderFromNeeds: async (
        supplierId: string,
        needs: ReorderNeed[],
        outletId: string
    ): Promise<PurchaseOrder> => {
        const orderId = uuidv4();
        const orderNumber = `PED-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${orderId.slice(0, 4)}`.toUpperCase();

        const items: PurchaseOrderItem[] = needs.map(need => ({
            id: uuidv4(),
            ingredientId: need.ingredientId,
            quantity: need.orderQuantity,
            unit: need.unit as any,
            costPerUnit: 0,
            tempDescription: need.ingredientName,
            name: need.ingredientName // Ensure name property exists
        }));

        const order: PurchaseOrder = {
            id: orderId,
            orderNumber,
            supplierId,
            outletId,
            date: new Date().toISOString(),
            status: 'DRAFT',
            items,
            totalCost: 0,
            type: 'AUTOMATIC',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            supplierName: 'Unknown' // Should fetch supplier name
        };

        // Save to Firestore (Fixed create call)
        await firestoreService.create(collection(db, COLLECTIONS.PURCHASE_ORDERS), order);

        return order;
    },

    generateOrdersFromNeeds: async (allNeeds: ReorderNeed[], outletId: string): Promise<PurchaseOrder[]> => {
        const grouped = pedidosService.groupNeedsBySupplier(allNeeds);
        const orders: PurchaseOrder[] = [];

        for (const [supplierId, needs] of grouped.entries()) {
            if (supplierId === 'UNKNOWN_SUPPLIER') {
                console.warn('Items with no supplier found:', needs);
                continue;
            }

            const order = await pedidosService.createDraftOrderFromNeeds(supplierId, needs, outletId);
            orders.push(order);
        }

        return orders;
    },

    getAll: async (outletId: string): Promise<PurchaseOrder[]> => {
        // E2E Mock Bypass
        const mockDB = localStorage.getItem('E2E_MOCK_DB');
        if (mockDB) {
            try {
                const db = JSON.parse(mockDB);
                const orders = (db.purchaseOrders || []).filter((o: any) => o.outletId === outletId);
                return orders;
            } catch (e) {
                console.error("E2E Mock Read Error", e);
            }
        }
        return firestoreService.getAll<PurchaseOrder>(COLLECTIONS.PURCHASE_ORDERS, {
            field: 'outletId',
            operator: '==',
            value: outletId
        });
    },

    updateStatus: async (orderId: string, status: PurchaseStatus, userId?: string) => {
        // E2E Mock Bypass
        const mockDBStr = localStorage.getItem('E2E_MOCK_DB');
        if (mockDBStr) {
            const db = JSON.parse(mockDBStr);
            const orders = (db.purchaseOrders || []) as PurchaseOrder[];
            const idx = orders.findIndex(o => o.id === orderId);
            if (idx >= 0) {
                orders[idx].status = status;
                orders[idx].updatedAt = new Date().toISOString();
                if (status === 'ORDERED') orders[idx].sentAt = new Date().toISOString();
                if (status === 'APPROVED' && userId) orders[idx].approvedBy = userId;

                db.purchaseOrders = orders;
                localStorage.setItem('E2E_MOCK_DB', JSON.stringify(db));
                console.log(`[E2E] Order ${orderId} updated to ${status}`);
                return;
            }
        }

        const updateData: Partial<PurchaseOrder> = { status, updatedAt: new Date().toISOString() };
        if (status === 'ORDERED') {
            updateData.sentAt = new Date().toISOString();
        }
        if (status === 'APPROVED' && userId) {
            updateData.approvedBy = userId;
        }
        await firestoreService.update(COLLECTIONS.PURCHASE_ORDERS, orderId, updateData);
    }
};
