import type { StateCreator } from 'zustand';

import type { AppState, EventSlice } from '../types';

export const createEventSlice: StateCreator<
    AppState,
    [],
    [],
    EventSlice
> = (set) => ({
    events: [],
    selectedProductionEventId: null,
    productionTasks: {},
    setEvents: (events) => set({ events }),
    addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
    updateEvent: (updatedEvent) => set((state) => ({
        events: state.events.map(e => e.id === updatedEvent.id ? updatedEvent : e)
    })),
    setSelectedProductionEventId: (id) => set({ selectedProductionEventId: id }),
    setProductionTasks: (eventId, tasks) => set((state) => ({
        productionTasks: { ...state.productionTasks, [eventId]: tasks }
    })),
    updateProductionTaskStatus: (eventId, taskId, status) => set((state) => {
        const tasks = state.productionTasks[eventId];
        if (!tasks) return state;
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status } : t);
        return {
            productionTasks: { ...state.productionTasks, [eventId]: updatedTasks }
        };
    }),
});
