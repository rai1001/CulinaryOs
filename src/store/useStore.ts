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
import { createOutletSlice } from './slices/createOutletSlice';
import { createNotificationSlice } from './slices/createNotificationSlice';
import { createBreakfastSlice } from './slices/createBreakfastSlice';
import { createAuthSlice } from './slices/createAuthSlice';
import { createIntegrationSlice } from './slices/createIntegrationSlice';
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
            ...createOutletSlice(...a),
            ...createNotificationSlice(...a),
            ...createNotificationSlice(...a),
            ...createBreakfastSlice(...a),
            ...createAuthSlice(...a),
            ...createIntegrationSlice(...a),

            // UI State
            activeOutletId: null,
            setActiveOutletId: (id) => a[0]({
                activeOutletId: id,
                // Clear data on switch to prevent leakage
                ingredients: [],
                recipes: [],
                menus: [],
                events: [],
                staff: [],
                suppliers: [],
                purchaseOrders: [],
                wasteRecords: [],
                productionTasks: {},
                pccs: [],
                haccpLogs: [],
                haccpTasks: [],
                haccpTaskCompletions: []
            }),
        }),
        {
            name: 'kitchen-manager-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                activeOutletId: state.activeOutletId,
            }),
        }
    )
);
