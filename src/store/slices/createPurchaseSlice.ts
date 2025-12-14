import type { StateCreator } from 'zustand';
import type { PurchaseOrder, Supplier } from '../../types';
import type { AppState } from '../types';

export interface PurchaseSlice {
    suppliers: Supplier[];
    purchaseOrders: PurchaseOrder[];

    // Supplier actions
    setSuppliers: (suppliers: Supplier[]) => void;
    addSupplier: (supplier: Supplier) => void;
    updateSupplier: (supplier: Supplier) => void;
    deleteSupplier: (id: string) => void;

    // Purchase Order actions
    setPurchaseOrders: (purchaseOrders: PurchaseOrder[]) => void;
    addPurchaseOrder: (order: PurchaseOrder) => void;
    updatePurchaseOrder: (order: PurchaseOrder) => void;
    deletePurchaseOrder: (id: string) => void;
}

export const createPurchaseSlice: StateCreator<
    AppState,
    [],
    [],
    PurchaseSlice
> = (set) => ({
    suppliers: [],
    purchaseOrders: [],

    // Supplier actions
    setSuppliers: (suppliers) => set({ suppliers }),

    addSupplier: (supplier) => set((state) => ({
        suppliers: [...state.suppliers, supplier]
    })),

    updateSupplier: (updatedSupplier) => set((state) => ({
        suppliers: state.suppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s)
    })),

    deleteSupplier: (id) => set((state) => ({
        suppliers: state.suppliers.filter(s => s.id !== id)
    })),

    // Purchase Order actions
    setPurchaseOrders: (purchaseOrders) => set({ purchaseOrders }),

    addPurchaseOrder: (order) => set((state) => ({
        purchaseOrders: [...state.purchaseOrders, order]
    })),

    updatePurchaseOrder: (updatedOrder) => set((state) => ({
        purchaseOrders: state.purchaseOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
    })),

    deletePurchaseOrder: (id) => set((state) => ({
        purchaseOrders: state.purchaseOrders.filter(o => o.id !== id)
    })),
});
