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

    // Supplier actions
    setSuppliers: (suppliers: import('../../types').Supplier[]) => set({ suppliers }),

    addSupplier: (supplier: import('../../types').Supplier) => set((state: AppState) => ({
        suppliers: [...state.suppliers, supplier]
    })),

    updateSupplier: (updatedSupplier: import('../../types').Supplier) => set((state: AppState) => ({
        suppliers: state.suppliers.map((s: import('../../types').Supplier) => s.id === updatedSupplier.id ? updatedSupplier : s)
    })),

    deleteSupplier: (id: string) => set((state: AppState) => ({
        suppliers: state.suppliers.filter((s: import('../../types').Supplier) => s.id !== id)
    })),

    // Purchase Order actions
    setPurchaseOrders: (purchaseOrders: import('../../types').PurchaseOrder[]) => set({ purchaseOrders }),

    addPurchaseOrder: async (order: import('../../types').PurchaseOrder) => {
        // No optimistic update for now, as requested.
        // We set document then refresh the list.
        try {
            await setDocument("purchaseOrders", order.id, order); // Assuming ID is pre-generated
            // If ID is not pre-generated, we should use addDocument, but existing code passed ID.
            // Refresh list
            get().fetchPurchaseOrders({ reset: true });
        } catch (error) {
            console.error("Failed to add purchase order", error);
        }
    },

    updatePurchaseOrder: async (updatedOrder: import('../../types').PurchaseOrder) => {
        try {
            // Update in Firestore
            // Note: Since we are using setDocument (overwrite) for everything in this codebase so far:
            await setDocument("purchaseOrders", updatedOrder.id, updatedOrder);
            // Refresh list
            get().fetchPurchaseOrders({ reset: true });
        } catch (error) {
            console.error("Failed to update purchase order", error);
        }
    },

    deletePurchaseOrder: async (id: string) => {
        try {
            await deleteDocument("purchaseOrders", id);
            // Refresh list
            get().fetchPurchaseOrders({ reset: true });
        } catch (error) {
            console.error("Failed to delete purchase order", error);
        }
    },

    // Async Actions
    fetchPurchaseOrders: async (options: { reset?: boolean } = {}) => {
        const { reset = false } = options;
        const { purchaseOrdersFilters, purchaseOrdersCursor, activeOutletId, purchaseOrdersLoading } = get();

        // Prevent valid Outlet check? 
        // If no outlet selected, maybe clear list
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

    clearSuppliers: () => set({ suppliers: [] })
});

