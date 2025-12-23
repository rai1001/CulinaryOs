import type { StateCreator } from 'zustand';
import type { AppState, PurchaseSlice } from '../types';
import { setDocument, deleteDocument, getPurchaseOrdersPage } from '../../services/firestoreService';

export const createPurchaseSlice: StateCreator<
    AppState,
    [],
    [],
    PurchaseSlice
> = (set: any, get: any) => ({
    suppliers: [],

    // Pagination State
    purchaseOrders: [],
    purchaseOrdersLoading: false,
    purchaseOrdersError: null,
    purchaseOrdersHasMore: true,
    purchaseOrdersCursor: null,
    purchaseOrdersFilters: { status: 'ALL', supplierId: 'ALL' },
    purchasingNotes: '',

    // Supplier actions
    setSuppliers: (suppliers: import('../../types').Supplier[]) => set({ suppliers }),

    addSupplier: async (supplier: import('../../types').Supplier) => {
        set((state: AppState) => ({
            suppliers: [...state.suppliers, supplier]
        }));
        try {
            await setDocument("suppliers", supplier.id, supplier);
        } catch (error) {
            console.error("Failed to add supplier", error);
        }
    },

    updateSupplier: async (updatedSupplier: import('../../types').Supplier) => {
        set((state: AppState) => ({
            suppliers: state.suppliers.map((s: import('../../types').Supplier) => s.id === updatedSupplier.id ? updatedSupplier : s)
        }));
        try {
            await setDocument("suppliers", updatedSupplier.id, updatedSupplier);
        } catch (error) {
            console.error("Failed to update supplier", error);
        }
    },

    deleteSupplier: async (id: string) => {
        set((state: AppState) => ({
            suppliers: state.suppliers.filter((s: import('../../types').Supplier) => s.id !== id)
        }));
        try {
            await deleteDocument("suppliers", id);
        } catch (error) {
            console.error("Failed to delete supplier", error);
        }
    },

    // Purchase Order actions
    setPurchaseOrders: (purchaseOrders: import('../../types').PurchaseOrder[]) => set({ purchaseOrders }),

    addPurchaseOrder: async (order: import('../../types').PurchaseOrder) => {
        try {
            await setDocument("purchaseOrders", order.id, order);
            get().fetchPurchaseOrders({ reset: true });
        } catch (error) {
            console.error("Failed to add purchase order", error);
        }
    },

    updatePurchaseOrder: async (updatedOrder: import('../../types').PurchaseOrder) => {
        try {
            await setDocument("purchaseOrders", updatedOrder.id, updatedOrder);
            get().fetchPurchaseOrders({ reset: true });
        } catch (error) {
            console.error("Failed to update purchase order", error);
        }
    },

    deletePurchaseOrder: async (id: string) => {
        try {
            await deleteDocument("purchaseOrders", id);
            get().fetchPurchaseOrders({ reset: true });
        } catch (error) {
            console.error("Failed to delete purchase order", error);
        }
    },

    // Async Actions
    fetchPurchaseOrders: async (options: { reset?: boolean } = {}) => {
        const { reset = false } = options;
        const { purchaseOrdersFilters, purchaseOrdersCursor, activeOutletId, purchaseOrdersLoading } = get();

        if (!activeOutletId) {
            set({ purchaseOrders: [], purchaseOrdersHasMore: false });
            return;
        }

        if (purchaseOrdersLoading) return;

        set({ purchaseOrdersLoading: true, purchaseOrdersError: null });

        try {
            const cursor = reset ? null : purchaseOrdersCursor;
            const pageSize = 20;

            const result = await getPurchaseOrdersPage({
                outletId: activeOutletId,
                filters: purchaseOrdersFilters,
                pageSize,
                cursor
            });

            set((state: AppState) => ({
                purchaseOrders: reset ? result.items : [...state.purchaseOrders, ...result.items],
                purchaseOrdersCursor: result.nextCursor,
                purchaseOrdersHasMore: result.hasMore,
                purchaseOrdersLoading: false
            }));

        } catch (error: any) {
            console.error("Error fetching purchase orders", error);
            set({
                purchaseOrdersLoading: false,
                purchaseOrdersError: error.message || "Failed to fetch orders"
            });
        }
    },

    loadMorePurchaseOrders: async () => {
        const { purchaseOrdersHasMore, purchaseOrdersLoading } = get();
        if (purchaseOrdersHasMore && !purchaseOrdersLoading) {
            await get().fetchPurchaseOrders({ reset: false });
        }
    },

    setPurchaseOrderFilters: (filters: import('../../types').PurchaseOrderFilters) => {
        set({ purchaseOrdersFilters: filters });
        get().fetchPurchaseOrders({ reset: true });
    },

    receivePurchaseOrderItems: async (orderId: string, receivedItems: Record<string, number>) => {
        const state = get();
        const order = state.purchaseOrders.find((o: import('../../types').PurchaseOrder) => o.id === orderId);
        if (!order) return;

        // 1. Update Order Items
        const updatedItems = order.items.map((item: import('../../types').PurchaseOrderItem) => {
            const receivedNow = receivedItems[item.ingredientId] || 0;
            return {
                ...item,
                receivedQuantity: (item.receivedQuantity || 0) + receivedNow
            };
        });

        // 2. Determine Status
        const allReceived = updatedItems.every((i: import('../../types').PurchaseOrderItem) => (i.receivedQuantity || 0) >= i.quantity);
        const anyReceived = updatedItems.some((i: import('../../types').PurchaseOrderItem) => (i.receivedQuantity || 0) > 0);
        const newStatus = allReceived ? 'RECEIVED' : (anyReceived ? 'PARTIAL' : order.status);
        const actualDeliveryDate = allReceived ? new Date().toISOString() : order.actualDeliveryDate;

        const updatedOrder = { ...order, items: updatedItems, status: newStatus, actualDeliveryDate };

        try {
            // Save Order
            await setDocument("purchaseOrders", orderId, updatedOrder);

            // 3. Update Inventory (Batches)
            for (const [ingId, qty] of Object.entries(receivedItems)) {
                if (qty <= 0) continue;
                const item = updatedItems.find((i: import('../../types').PurchaseOrderItem) => i.ingredientId === ingId);
                const cost = item?.costPerUnit || 0;

                // Call addBatch which handles both local state and Firestore persistence to the 'inventory' collection
                await get().addBatch(ingId, {
                    initialQuantity: qty,
                    currentQuantity: qty,
                    costPerUnit: cost,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    unit: item?.unit || 'un'
                });
            }

            get().fetchPurchaseOrders({ reset: true });

        } catch (error) {
            console.error("Failed to receive items", error);
        }
    },

    clearSuppliers: () => set({ suppliers: [] }),

    updatePurchasingNotes: async (notes: string) => {
        const { activeOutletId } = get();
        if (!activeOutletId) return;

        set({ purchasingNotes: notes });
        try {
            await setDocument("system_config", `purchasing_notes_${activeOutletId}`, { notes });
        } catch (error) {
            console.error("Failed to save purchasing notes", error);
        }
    }
});
