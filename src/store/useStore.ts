import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createIngredientSlice } from './slices/createIngredientSlice';
import { createEventSlice } from './slices/createEventSlice';
import { createProductionSlice } from './slices/createProductionSlice';
import { createStaffSlice } from './slices/createStaffSlice';
import { createRecipeSlice } from './slices/createRecipeSlice';
import { createMenuSlice } from './slices/createMenuSlice';
import { createPurchaseSlice } from './slices/createPurchaseSlice';
import { createWasteSlice } from './slices/createWasteSlice';
import { createHACCPSlice } from './slices/createHACCPSlice';
import { createAnalyticsSlice } from './slices/createAnalyticsSlice';
import type { AppState } from './types';

// Re-export AppState for consumers
export type { AppState };

export const useStore = create<AppState>()(
    persist(
        (...a) => ({
            ...createIngredientSlice(...a),
            ...createEventSlice(...a),
            ...createProductionSlice(...a),
            ...createStaffSlice(...a),
            ...createRecipeSlice(...a),
            ...createMenuSlice(...a),
            ...createPurchaseSlice(...a),
            ...createWasteSlice(...a),
            ...createHACCPSlice(...a),
            ...createAnalyticsSlice(...a),

            // UI State
            currentView: 'dashboard',
            setCurrentView: (view) => a[0]({ currentView: view }),
            activeOutletId: null,
            setActiveOutletId: (id) => a[0]({ activeOutletId: id }),
        }),
        {
            name: 'kitchen-manager-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                ingredients: state.ingredients,
                recipes: state.recipes,
                menus: state.menus,
                events: state.events,
                staff: state.staff,
                suppliers: state.suppliers,
                purchaseOrders: state.purchaseOrders,
                wasteRecords: state.wasteRecords,
                schedule: state.schedule,
                pccs: state.pccs,
                haccpLogs: state.haccpLogs,
                haccpTasks: state.haccpTasks,
                haccpTaskCompletions: state.haccpTaskCompletions,
                productionTasks: state.productionTasks,
                selectedProductionEventId: state.selectedProductionEventId
            }),
        }
    )
);
