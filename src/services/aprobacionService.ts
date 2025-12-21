import { firestoreService } from './firestoreService';
import { COLLECTIONS } from '../firebase/collections';
import { pedidosService } from './pedidosService';
import { auditService } from './auditService';

export const aprobacionService = {
    approveOrder: async (orderId: string, userId: string): Promise<void> => {
        // Mock Bypass delegated to pedidosService.updateStatus
        await pedidosService.updateStatus(orderId, 'APPROVED', userId);

        const mockDB = localStorage.getItem('E2E_MOCK_DB');
        if (!mockDB) {
            await auditService.log({
                action: 'PURCHASE_ORDER_Approved',
                entityId: orderId,
                userId,
                details: { status: 'APPROVED' }
            });
        }
        console.log(`Order ${orderId} approved by ${userId}`);
    },

    rejectOrder: async (orderId: string, userId: string, reason: string): Promise<void> => {
        // E2E Mock Bypass
        const mockDBStr = localStorage.getItem('E2E_MOCK_DB');
        if (mockDBStr) {
            const db = JSON.parse(mockDBStr);
            const idx = db.purchaseOrders?.findIndex((o: any) => o.id === orderId);
            if (idx >= 0) {
                db.purchaseOrders[idx].status = 'REJECTED';
                db.purchaseOrders[idx].rejectedBy = userId;
                db.purchaseOrders[idx].notes = reason;
                localStorage.setItem('E2E_MOCK_DB', JSON.stringify(db));
                return;
            }
        }

        await firestoreService.update(COLLECTIONS.PURCHASE_ORDERS, orderId, {
            status: 'REJECTED',
            rejectedBy: userId,
            notes: reason,
            updatedAt: new Date().toISOString()
        });

        await auditService.log({
            action: 'PURCHASE_ORDER_Rejected',
            entityId: orderId,
            userId,
            details: { reason }
        });
        console.log(`Order ${orderId} rejected by ${userId}: ${reason}`);
    },

    sendOrder: async (orderId: string, userId: string): Promise<void> => {
        await pedidosService.updateStatus(orderId, 'ORDERED', userId);

        const mockDB = localStorage.getItem('E2E_MOCK_DB');
        if (!mockDB) {
            await auditService.log({
                action: 'PURCHASE_ORDER_Sent',
                entityId: orderId,
                userId,
                details: { status: 'ORDERED' }
            });
        }
        console.log(`Order ${orderId} sent to supplier`);
    }
};
