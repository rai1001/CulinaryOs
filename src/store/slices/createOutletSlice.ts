import type { StateCreator } from 'zustand';
import type { AppState, OutletSlice } from '../types';


export const createOutletSlice: StateCreator<AppState, [], [], OutletSlice> = (set, get) => ({
    outlets: [],
    activeOutletId: null,

    setOutlets: (outlets) => set({ outlets }),

    addOutlet: (outlet) => set((state) => ({ outlets: [...state.outlets, outlet] })),

    updateOutlet: (id, updates) => set((state) => ({
        outlets: state.outlets.map((o) => (o.id === id ? { ...o, ...updates } : o))
    })),

    setActiveOutlet: (id) => set({ activeOutletId: id }),

    deleteOutlet: (id) => set((state) => ({
        outlets: state.outlets.filter((o) => o.id !== id),
        activeOutletId: state.activeOutletId === id ? null : state.activeOutletId
    })),

    toggleOutletActive: (id) => set((state) => ({
        outlets: state.outlets.map((o) => (o.id === id ? { ...o, isActive: !o.isActive } : o))
    })),

    getOutlet: (id) => get().outlets.find((o) => o.id === id)
});
