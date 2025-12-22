import { v4 as uuidv4 } from 'uuid';
import { firestoreService } from './firestoreService';
import { COLLECTIONS } from '../firebase/collections';
import type { ReorderNeed } from './necesidadesService';
import type { PurchaseOrder, PurchaseOrderItem, PurchaseStatus } from '../types/purchases';
import { collection, where, arrayUnion } from 'firebase/firestore';
import type { CollectionReference, UpdateData } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Unit } from '../types/inventory';

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
        const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const orderNumber = `PED-${todayStr}-${orderId.slice(0, 4)}`.toUpperCase();

        const items: PurchaseOrderItem[] = needs.map(need => ({
            ingredientId: need.ingredientId,
            quantity: need.orderQuantity,
            unit: need.unit as Unit,
            costPerUnit: need.costPerUnit || 0,
            tempDescription: need.ingredientName
        }));

        const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);

        const order: PurchaseOrder = {
            id: orderId,
            orderNumber,
            supplierId,
            outletId,
            date: new Date().toISOString(),
            status: 'DRAFT',
            items,
            totalCost,
            type: 'AUTOMATIC',
            updatedAt: new Date().toISOString(),
        };

        // Save to Firestore
        await firestoreService.create<PurchaseOrder>(collection(db, COLLECTIONS.PURCHASE_ORDERS) as CollectionReference<PurchaseOrder>, order);

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
        // ... (mock bypass) ...
        // E2E Mock Bypass
        const mockDB = localStorage.getItem('E2E_MOCK_DB');
        if (mockDB) {
            try {
                const db = JSON.parse(mockDB);
                const orders = (db.purchaseOrders || []).filter((o: PurchaseOrder) => o.outletId === outletId);
                return orders;
            } catch (e) {
                console.error("E2E Mock Read Error", e);
            }
        }

        return firestoreService.query<PurchaseOrder>(
            collection(db, COLLECTIONS.PURCHASE_ORDERS) as CollectionReference<PurchaseOrder>,
            where('outletId', '==', outletId)
        );
    },

    getOrdersByStatus: async (outletId: string, statuses: PurchaseStatus[]): Promise<PurchaseOrder[]> => {
        // E2E Mock Bypass
        const mockDB = localStorage.getItem('E2E_MOCK_DB');
        if (mockDB) {
            try {
                const db = JSON.parse(mockDB);
                return (db.purchaseOrders || []).filter((o: PurchaseOrder) =>
                    o.outletId === outletId && statuses.includes(o.status)
                );
            } catch (e) {
                console.error("E2E Mock Read Error", e);
            }
        }

        return firestoreService.query<PurchaseOrder>(
            collection(db, COLLECTIONS.PURCHASE_ORDERS) as CollectionReference<PurchaseOrder>,
            where('outletId', '==', outletId),
            where('status', 'in', statuses)
        );
    },

    updateStatus: async (orderId: string, status: PurchaseStatus, userId?: string, extraData?: Partial<PurchaseOrder>) => {
        // E2E Mock Bypass
        const mockDBStr = localStorage.getItem('E2E_MOCK_DB');
        if (mockDBStr) {
            const db = JSON.parse(mockDBStr);
            const orders = (db.purchaseOrders || []) as PurchaseOrder[];
            const idx = orders.findIndex(o => o.id === orderId);
            if (idx >= 0) {
                // History tracking for mock
                const historyEntry = {
                    date: new Date().toISOString(),
                    status,
                    userId: userId || 'system',
                    notes: extraData?.notes || ''
                };
                // Update Status
                orders[idx].status = status;
                // Merge extra data
                if (extraData) {
                    Object.assign(orders[idx], extraData);
                }

                orders[idx].history = [...(orders[idx].history || []), historyEntry];

                db.purchaseOrders = orders;
                localStorage.setItem('E2E_MOCK_DB', JSON.stringify(db));
                console.log(`[E2E] Order ${orderId} updated to ${status}`);
                return;
            }
        }

        const updateData: UpdateData<PurchaseOrder> = {
            ...extraData,
            status,
            updatedAt: new Date().toISOString(),
            history: arrayUnion({
                date: new Date().toISOString(),
                status,
                userId: userId || 'system',
                notes: extraData?.notes || ''
            })
        };
        if (status === 'ORDERED') {
            updateData.sentAt = new Date().toISOString();
        }
        if (status === 'APPROVED' && userId) {
            updateData.approvedBy = userId;
        }
        await firestoreService.update(COLLECTIONS.PURCHASE_ORDERS, orderId, updateData);
    }
};
