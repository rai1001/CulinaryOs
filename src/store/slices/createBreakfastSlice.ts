import type { StateCreator } from 'zustand';
import type { AppState, BreakfastSlice } from '../types';
import { setDocument, getCollection } from '../../services/firestoreService';
import type { BreakfastService, OccupancyData } from '../../types';

export const createBreakfastSlice: StateCreator<
    AppState,
    [],
    [],
    BreakfastSlice
> = (set, get) => ({
    breakfastServices: [],

    setBreakfastServices: (services) => set({ breakfastServices: services }),

    updateBreakfastService: async (service) => {
        // Optimistic update
        set((state) => {
            const index = state.breakfastServices.findIndex(s => s.id === service.id);
            if (index >= 0) {
                const updated = [...state.breakfastServices];
                updated[index] = service;
                return { breakfastServices: updated };
            } else {
                return { breakfastServices: [...state.breakfastServices, service] };
            }
        });

        // Persist
        try {
            await setDocument('breakfastServices', service.id, service);
        } catch (error) {
            console.error("Failed to persist breakfast service", error);
            // Revert? For now, we assume success or user sees error if refresh.
        }
    },

    importOccupancy: async (data: OccupancyData[]) => {
        // Bulk update or sequential
        const state = get();
        const updates: Promise<void>[] = [];
        const newServices = [...state.breakfastServices];

        for (const item of data) {
            // ID is date string YYYY-MM-DD
            const id = item.date;
            const existing = newServices.find(s => s.id === id);

            const updatedService: BreakfastService = existing
                ? { ...existing, forecastPax: item.pax }
                : {
                    id,
                    date: item.date,
                    forecastPax: item.pax,
                    realPax: 0,
                    consumption: {}
                };

            // Update local array
            const index = newServices.findIndex(s => s.id === id);
            if (index >= 0) newServices[index] = updatedService;
            else newServices.push(updatedService);

            updates.push(setDocument('breakfastServices', id, updatedService));
        }

        set({ breakfastServices: newServices });

        try {
            await Promise.all(updates);
        } catch (error) {
            console.error("Failed to import occupancy", error);
        }
    },

    fetchBreakfastServices: async () => {
        try {
            // Fetch all or range? For now, simple fetch all
            const services = await getCollection<BreakfastService>('breakfastServices');
            set({ breakfastServices: services });
        } catch (error) {
            console.error("Failed to fetch breakfast services", error);
        }
    },

    commitBreakfastConsumption: async (serviceId) => {
        const state = get();
        const service = state.breakfastServices.find(s => s.id === serviceId);
        if (!service || service.isCommitted) return;

        // 1. Deduct stock for each item in consumption
        Object.entries(service.consumption).forEach(([ingredientId, quantity]) => {
            state.consumeStock(ingredientId, quantity);
        });

        // 2. Mark as committed and persist
        const updatedService = { ...service, isCommitted: true };
        await get().updateBreakfastService(updatedService);
    }
});
