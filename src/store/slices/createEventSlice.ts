import type { StateCreator } from 'zustand';

import type { AppState, EventSlice } from '../types';
import { setDocument, getEventsRange } from '../../services/firestoreService';

export const createEventSlice: StateCreator<
    AppState,
    [],
    [],
    EventSlice
> = (set, get) => ({
    events: [],
    eventsLoading: false,
    eventsError: null,
    eventsRange: null,

    setEvents: (events) => set({ events }),

    addEvent: async (event) => {
        try {
            await setDocument("events", event.id, event);
            // Reload current range if active
            const { eventsRange } = get();
            if (eventsRange) {
                get().fetchEventsRange(eventsRange.start, eventsRange.end);
            }
        } catch (error) {
            console.error("Failed to add event", error);
        }
    },

    updateEvent: async (updatedEvent) => {
        try {
            await setDocument("events", updatedEvent.id, updatedEvent);
            const { eventsRange } = get();
            if (eventsRange) {
                get().fetchEventsRange(eventsRange.start, eventsRange.end);
            }
        } catch (error) {
            console.error("Failed to update event", error);
        }
    },

    getFilteredEvents: () => {
        // Events are now already filtered by range and outlet in the fetch
        return get().events;
    },

    fetchEventsRange: async (start, end) => {
        const { activeOutletId } = get();
        if (!activeOutletId) return;

        set({ eventsLoading: true, eventsError: null, eventsRange: { start, end } });

        try {
            const events = await getEventsRange({
                outletId: activeOutletId,
                startDate: start,
                endDate: end
            });
            set({ events, eventsLoading: false });
        } catch (error: any) {
            console.error("Failed to fetch events range", error);
            set({ eventsLoading: false, eventsError: error.message });
        }
    }
});

