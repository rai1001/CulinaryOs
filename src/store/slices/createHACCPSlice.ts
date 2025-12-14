import type { StateCreator } from 'zustand';
import type { PCC, HACCPLog, HACCPTask, HACCPTaskCompletion } from '../../types';
import type { AppState } from '../types';

export interface HACCPSlice {
    pccs: PCC[];
    haccpLogs: HACCPLog[];
    haccpTasks: HACCPTask[];
    haccpTaskCompletions: HACCPTaskCompletion[];

    // PCC actions
    addPCC: (pcc: PCC) => void;
    updatePCC: (pcc: PCC) => void;
    deletePCC: (id: string) => void;

    // HACCP Log actions
    addHACCPLog: (log: HACCPLog) => void;

    // HACCP Task actions
    addHACCPTask: (task: HACCPTask) => void;
    updateHACCPTask: (task: HACCPTask) => void;
    deleteHACCPTask: (id: string) => void;

    // HACCP Task Completion actions
    completeHACCPTask: (completion: HACCPTaskCompletion) => void;
}

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
});
