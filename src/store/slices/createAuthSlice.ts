import type { StateCreator } from 'zustand';
import type { AppState, AuthSlice } from '../types';

export const createAuthSlice: StateCreator<
    AppState,
    [],
    [],
    AuthSlice
> = (set) => ({
    currentUser: {
        id: 'chef-123',
        email: 'israel@example.com',
        role: 'HEAD_CHEF',
        name: 'Israel',
        // other fields implicit in User type
    } as any, // Mock default user for seamless dev experience per request
    // In prod, this would default to null.

    setCurrentUser: (user) => set({ currentUser: user }),
});
