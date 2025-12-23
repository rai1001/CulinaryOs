import type { StateCreator } from 'zustand';
import type { AppState, HospitalitySlice } from '../types';
import { setDocument } from '../../services/firestoreService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import type { HospitalityService, OccupancyData, MealType } from '../../types';

export const createHospitalitySlice: StateCreator<
    AppState,
    [],
    [],
    HospitalitySlice
> = (set, get) => ({
    hospitalityServices: [],

    setHospitalityServices: (services) => set({ hospitalityServices: services }),

    updateHospitalityService: async (service) => {
        // Optimistic update
        set((state) => {
            const index = state.hospitalityServices.findIndex(s => s.id === service.id);
            if (index >= 0) {
                const updated = [...state.hospitalityServices];
                updated[index] = service;
                return { hospitalityServices: updated };
            } else {
                return { hospitalityServices: [...state.hospitalityServices, service] };
            }
        });

        // Persist
        try {
            const activeOutletId = get().activeOutletId;
            const docData = {
                ...service,
                outletId: service.outletId || activeOutletId
            };
            await setDocument('hospitalityServices', service.id, docData);
        } catch (error) {
            console.error("Failed to persist hospitality service", error);
        }
    },

    importOccupancy: async (data: OccupancyData[]) => {
        const state = get();
        const updates: Promise<void>[] = [];
        const newServices = [...state.hospitalityServices];

        for (const item of data) {
            const mealType: MealType = item.mealType || 'breakfast';
            const id = `${item.date}_${mealType}`;
            const existing = newServices.find(s => s.id === id);

            const updatedService: HospitalityService = existing
                ? { ...existing, forecastPax: item.pax }
                : {
                    id,
                    date: item.date,
                    mealType,
                    forecastPax: item.pax,
                    realPax: 0,
                    consumption: {},
                    outletId: state.activeOutletId || undefined
                };

            // Update local array
            const index = newServices.findIndex(s => s.id === id);
            if (index >= 0) newServices[index] = updatedService;
            else newServices.push(updatedService);

            updates.push(setDocument('hospitalityServices', id, updatedService));
        }

        set({ hospitalityServices: newServices });

        try {
            await Promise.all(updates);
        } catch (error) {
            console.error("Failed to import occupancy", error);
        }
    },

    fetchHospitalityServices: async (date) => {
        const activeOutletId = get().activeOutletId;
        if (!activeOutletId) {
            set({ hospitalityServices: [] });
            return;
        }

        try {
            const colRef = collection(db, 'hospitalityServices');
            let q = query(colRef, where('outletId', '==', activeOutletId));

            if (date) {
                q = query(q, where('date', '==', date));
            }

            const snapshot = await getDocs(q);
            const items = snapshot.docs.map(doc => ({ ...doc.data() as object, id: doc.id } as HospitalityService));

            set({ hospitalityServices: items });
        } catch (error) {
            console.error("Failed to fetch hospitality services", error);
        }
    },

    commitHospitalityConsumption: async (serviceId) => {
        const state = get();
        const service = state.hospitalityServices.find(s => s.id === serviceId);
        if (!service || service.isCommitted) return;

        // 1. Deduct stock for each item in consumption
        Object.entries(service.consumption).forEach(([ingredientId, quantity]) => {
            state.consumeStock(ingredientId, quantity);
        });

        // 2. Mark as committed and persist
        const updatedService = { ...service, isCommitted: true };
        await get().updateHospitalityService(updatedService);
    }
});
