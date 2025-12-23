import type { StateCreator } from 'zustand';
import type { AppState, ProductionSlice } from '../types';
import type { KanbanTask } from '../../types';

export const createProductionSlice: StateCreator<
    AppState,
    [],
    [],
    ProductionSlice
> = (set) => ({
    selectedProductionEventId: null,
    productionTasks: {}, // { eventId: [task1, task2] }

    setSelectedProductionEventId: (eventId: string | null) => set({ selectedProductionEventId: eventId }),

    replaceAllProductionTasks: (tasksByEvent: Record<string, import('../../types').KanbanTask[]>) => set({ productionTasks: tasksByEvent }),

    generateProductionTasks: (event: import('../../types').Event) => {
        if (!event.menu || !event.menu.recipes) return;

        const { id: eventId, pax } = event;
        // const currentTasks = get().productionTasks[eventId] || [];

        // If tasks already exist, do NOT overwrite them unless manual clear?
        // User behavior: "Generate Tasks" should likely be idempotent or explicit re-gen.
        // For now, if empty, generate. If not empty, maybe alert? 
        // Let's implement safe generation: only if empty or explicitly called (which this is).
        // Actually, to preserve status of existing tasks if re-generated, we need smart merge or just full overwrite (reset).
        // User request says "Generate Tasks (once)", so likely full generation.

        const newTasks: KanbanTask[] = event.menu.recipes.map((recipe, index) => ({
            id: `${eventId}_${recipe.id}_${index}`, // Stable ID if recipes array order doesn't change drastically
            eventId: eventId,
            title: recipe.name,
            description: `Partida: ${recipe.station}`,
            quantity: pax, // Logic: 1 portion per pax? Or total portions
            unit: 'raciones',
            status: 'todo',
            recipeId: recipe.id
        }));

        set((state) => ({
            productionTasks: {
                ...state.productionTasks,
                [eventId]: newTasks
            }
        }));
    },

    updateTaskStatus: (eventId: string, taskId: string, status: import('../../types').KanbanTaskStatus) => {
        set((state) => {
            const eventTasks = state.productionTasks[eventId] || [];
            const updatedTasks = eventTasks.map(t =>
                t.id === taskId ? { ...t, status } : t
            );
            return {
                productionTasks: {
                    ...state.productionTasks,
                    [eventId]: updatedTasks
                }
            };
        });
    },

    clearProductionTasks: (eventId: string) => {
        set((state) => {
            const { [eventId]: removed, ...rest } = state.productionTasks;
            return { productionTasks: rest };
        });
    },

    setProductionTasks: (eventId: string, tasks: import('../../types').KanbanTask[]) => {
        set((state) => ({
            productionTasks: {
                ...state.productionTasks,
                [eventId]: tasks
            }
        }));
    },

    toggleTaskTimer: (eventId, taskId) => {
        set((state) => {
            const tasks = state.productionTasks[eventId] || [];
            const updatedTasks = tasks.map(task => {
                if (task.id !== taskId) return task;

                const isRunning = !!task.timerStart;
                const now = Date.now();

                if (isRunning) {
                    // Pause: Add elapsed time to total
                    const elapsed = Math.floor((now - task.timerStart!) / 1000); // seconds
                    return {
                        ...task,
                        timerStart: undefined, // Stop
                        totalTimeSpent: (task.totalTimeSpent || 0) + elapsed
                    };
                } else {
                    // Start
                    return {
                        ...task,
                        timerStart: now
                    };
                }
            });

            return {
                productionTasks: { ...state.productionTasks, [eventId]: updatedTasks }
            };
        });
    },

    updateTaskSchedule: (eventId, taskId, updates) => {
        set((state) => {
            const tasks = state.productionTasks[eventId] || [];
            const updatedTasks = tasks.map(task =>
                task.id === taskId ? { ...task, ...updates } : task
            );
            return {
                productionTasks: { ...state.productionTasks, [eventId]: updatedTasks }
            };
        });
    },
    addProductionTask: (eventId, task) => {
        set((state) => ({
            productionTasks: {
                ...state.productionTasks,
                [eventId]: [...(state.productionTasks[eventId] || []), task]
            }
        }));
    },
    deleteProductionTask: (eventId, taskId) => {
        set((state) => ({
            productionTasks: {
                ...state.productionTasks,
                [eventId]: (state.productionTasks[eventId] || []).filter(t => t.id !== taskId)
            }
        }));
    }
});
