import type { StateCreator } from 'zustand';
import type { AppState, HACCPSlice } from '../types';

export const createHACCPSlice: StateCreator<
    AppState,
    [],
    [],
    HACCPSlice
> = (set) => ({
    pccs: [],
    haccpLogs: [],
    haccpTasks: [
        { id: 'task-1', name: 'Control Temperaturas Neveras', description: 'Registrar temperatura de todas las cámaras', frequency: 'DAILY', isActive: true },
        { id: 'task-2', name: 'Limpieza Cámaras Frigoríficas', description: 'Limpieza profunda de neveras', frequency: 'WEEKLY', isActive: true },
        { id: 'task-3', name: 'Revisión Calibración Termómetros', description: 'Verificar calibración de termómetros', frequency: 'MONTHLY', isActive: true },
    ],
    haccpTaskCompletions: [],
    haccpTimers: [],

    // Setters for Sync
    setPCCs: (pccs) => set({ pccs }),
    setHACCPLogs: (logs) => set({ haccpLogs: logs }),
    setHACCPTasks: (tasks) => set({ haccpTasks: tasks }),
    setHACCPTaskCompletions: (completions) => set({ haccpTaskCompletions: completions }),
    setHACCPTimers: (timers) => set({ haccpTimers: timers }),

    // PCC actions
    addPCC: (pcc) => set((state) => ({
        pccs: [...state.pccs, pcc]
    })),

    updatePCC: (updatedPCC) => set((state) => ({
        pccs: state.pccs.map(p => p.id === updatedPCC.id ? updatedPCC : p)
    })),

    deletePCC: (id) => set((state) => ({
        pccs: state.pccs.filter(p => p.id !== id)
    })),

    // HACCP Log actions
    addHACCPLog: (log) => set((state) => ({
        haccpLogs: [...state.haccpLogs, log]
    })),

    // HACCP Task actions
    addHACCPTask: (task) => set((state) => ({
        haccpTasks: [...state.haccpTasks, task]
    })),

    updateHACCPTask: (updatedTask) => set((state) => ({
        haccpTasks: state.haccpTasks.map(t => t.id === updatedTask.id ? updatedTask : t)
    })),

    deleteHACCPTask: (id) => set((state) => ({
        haccpTasks: state.haccpTasks.filter(t => t.id !== id)
    })),

    // HACCP Task Completion actions
    completeHACCPTask: (completion) => set((state) => ({
        haccpTaskCompletions: [...state.haccpTaskCompletions, completion]
    })),

    // HACCP Timer actions
    addHACCPTimer: (timer) => set((state) => ({
        haccpTimers: [...state.haccpTimers, timer]
    })),

    updateHACCPTimer: (updatedTimer) => set((state) => ({
        haccpTimers: state.haccpTimers.map(t => t.id === updatedTimer.id ? updatedTimer : t)
    })),

    deleteHACCPTimer: (id) => set((state) => ({
        haccpTimers: state.haccpTimers.filter(t => t.id !== id)
    })),
});
