import { StateCreator } from 'zustand';
import { Event } from '../../types';
import { AppState } from '../useStore';

export interface EventSlice {
    events: Event[];
    setEvents: (items: Event[]) => void;
    addEvent: (event: Event) => void;
    updateEvent: (event: Event) => void;
}

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
