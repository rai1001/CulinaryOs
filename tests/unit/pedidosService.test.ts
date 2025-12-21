import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pedidosService } from '../../src/services/pedidosService';
import type { ReorderNeed } from '../../src/services/necesidadesService';
import { firestoreService } from '../../src/services/firestoreService';
import { COLLECTIONS } from '../../src/firebase/collections';

// Mock Firestore
vi.mock('../../src/services/firestoreService', () => ({
    firestoreService: {
        create: vi.fn(),
        getAll: vi.fn(),
        update: vi.fn()
    }
}));

describe('pedidosService', () => {
    const mockNeeds: ReorderNeed[] = [
        { ingredientId: '1', ingredientName: 'Ing 1', currentStock: 0, reorderPoint: 10, optimalStock: 20, orderQuantity: 20, unit: 'kg', supplierId: 'sup1' },
        { ingredientId: '2', ingredientName: 'Ing 2', currentStock: 5, reorderPoint: 15, optimalStock: 30, orderQuantity: 25, unit: 'kg', supplierId: 'sup1' },
        { ingredientId: '3', ingredientName: 'Ing 3', currentStock: 0, reorderPoint: 5, optimalStock: 10, orderQuantity: 10, unit: 'kg', supplierId: 'sup2' },
        { ingredientId: '4', ingredientName: 'Ing 4', currentStock: 0, reorderPoint: 5, optimalStock: 10, orderQuantity: 10, unit: 'kg', supplierId: undefined } // No supplier
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('groups needs by supplier correctly', () => {
        const grouped = pedidosService.groupNeedsBySupplier(mockNeeds);

        expect(grouped.size).toBe(3); // sup1, sup2, UNKNOWN_SUPPLIER
        expect(grouped.get('sup1')).toHaveLength(2);
        expect(grouped.get('sup2')).toHaveLength(1);
        expect(grouped.get('UNKNOWN_SUPPLIER')).toHaveLength(1);
    });

    it('creates a draft order for a supplier', async () => {
        const needsForSup1 = mockNeeds.filter(n => n.supplierId === 'sup1');
        const order = await pedidosService.createDraftOrderFromNeeds('sup1', needsForSup1, 'outlet1');

        expect(order).toBeDefined();
        expect(order.items).toHaveLength(2);
        expect(order.supplierId).toBe('sup1');
        expect(order.status).toBe('DRAFT');
        expect(order.orderNumber).toContain('PED-');

        expect(firestoreService.create).toHaveBeenCalledWith(COLLECTIONS.PURCHASE_ORDERS, expect.objectContaining({
            supplierId: 'sup1',
            status: 'DRAFT',
            items: expect.arrayContaining([
                expect.objectContaining({ ingredientId: '1', quantity: 20 }),
                expect.objectContaining({ ingredientId: '2', quantity: 25 })
            ])
        }));
    });

    it('generates multiple orders from needs', async () => {
        const orders = await pedidosService.generateOrdersFromNeeds(mockNeeds, 'outlet1');

        // Should create 2 orders (sup1, sup2) and skip UNKNOWN_SUPPLIER (creates warning but no order in current logic)
        expect(orders).toHaveLength(2);
        expect(firestoreService.create).toHaveBeenCalledTimes(2);
    });

    it('updates order status', async () => {
        await pedidosService.updateStatus('order1', 'APPROVED', 'user1');

        expect(firestoreService.update).toHaveBeenCalledWith(COLLECTIONS.PURCHASE_ORDERS, 'order1', expect.objectContaining({
            status: 'APPROVED',
            approvedBy: 'user1'
        }));
    });
});
