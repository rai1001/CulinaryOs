import type { StateCreator } from 'zustand';
import type { AppState, IntegrationSlice } from '../types';

export const createIntegrationSlice: StateCreator<
    AppState,
    [],
    [],
    IntegrationSlice
> = (set) => ({
    integrations: [
        {
            id: 'google-workspace',
            name: 'Google Workspace',
            provider: 'google',
            status: 'disconnected',
            description: 'Conecta tu cuenta de Google para sincronizar eventos con Calendar y escanear correos de Gmail.',
            features: ['Google Calendar Sync', 'Gmail Event Scan', 'Drive Access'],
        },
        {
            id: 'outlook-365',
            name: 'Microsoft Outlook',
            provider: 'microsoft',
            status: 'disconnected',
            description: 'Conecta tu cuenta de Outlook para escanear correos en busca de eventos de catering.',
            features: ['Outlook Email Scan', 'Outlook Calendar Sync'],
        }
    ],

    setIntegrations: (integrations) => set({ integrations }),

    connectIntegration: async (id) => {
        // Simulation of OAuth flow
        set((state) => ({
            integrations: state.integrations.map(int =>
                int.id === id ? { ...int, status: 'connected', connectedAt: new Date().toISOString() } : int
            )
        }));
    },

    disconnectIntegration: async (id) => {
        set((state) => ({
            integrations: state.integrations.map(int =>
                int.id === id ? { ...int, status: 'disconnected', connectedAt: undefined } : int
            )
        }));
    }
});
