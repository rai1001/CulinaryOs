import type { StateCreator } from 'zustand';
import type { AppState, AuthSlice } from '../types';

export const createAuthSlice: StateCreator<
    AppState,
    [],
    [],
    AuthSlice
> = (set) => ({
    currentUser: null,
    // In prod, this would default to null.

    setCurrentUser: (user) => set({ currentUser: user }),
});
