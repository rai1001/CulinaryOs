import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import type { MenuItemAnalytics } from '../../types';
import { calculateIngredientUsage } from '../../services/analyticsService';

export interface AnalyticsSlice {
    calculateMenuAnalytics: (startDate: string, endDate: string) => Promise<MenuItemAnalytics[]>;
}

export const createAnalyticsSlice: StateCreator<
    AppState,
    [],
    [],
    AnalyticsSlice
> = (_set, get) => ({
    calculateMenuAnalytics: async (startDate: string, endDate: string) => {
        const { events, recipes, menus, ingredients, activeOutletId } = get();
        return await calculateIngredientUsage(events, menus, recipes, ingredients, startDate, endDate, activeOutletId || undefined);
    }
});

