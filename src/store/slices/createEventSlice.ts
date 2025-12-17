import type { StateCreator } from 'zustand';

import type { AppState, EventSlice } from '../types';

export const createEventSlice: StateCreator<
    AppState,
    [],
    [],
    EventSlice
> = (set) => ({
    events: [],
    setEvents: (events) => set({ events }),
    addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
    updateEvent: (updatedEvent) => set((state) => ({
        events: state.events.map(e => e.id === updatedEvent.id ? updatedEvent : e)
    })),
});
