import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Recipe, Menu, Supplier, PurchaseOrder, WasteRecord, PCC, HACCPLog, HACCPTask, HACCPTaskCompletion } from '../types';

import { createIngredientSlice, IngredientSlice } from './slices/createIngredientSlice';
import { createEventSlice, EventSlice } from './slices/createEventSlice';
import { createStaffSlice, StaffSlice } from './slices/createStaffSlice';

export interface AppState extends IngredientSlice, EventSlice, StaffSlice {
    // Other Data
    recipes: Recipe[];
    menus: Menu[];
    suppliers: Supplier[];
    purchaseOrders: PurchaseOrder[];
    wasteRecords: WasteRecord[];

    // HACCP Data
    pccs: PCC[];
    haccpLogs: HACCPLog[];
    haccpTasks: HACCPTask[];
    haccpTaskCompletions: HACCPTaskCompletion[];

    // Other Actions
    setRecipes: (items: Recipe[]) => void;
    addRecipe: (recipe: Recipe) => void;
    setMenus: (items: Menu[]) => void;
    addMenu: (menu: Menu) => void;
    setSuppliers: (items: Supplier[]) => void;
    addSupplier: (supplier: Supplier) => void;
    setPurchaseOrders: (items: PurchaseOrder[]) => void;
    addPurchaseOrder: (order: PurchaseOrder) => void;
    updatePurchaseOrder: (order: PurchaseOrder) => void;
    deletePurchaseOrder: (id: string) => void;
    addWasteRecord: (record: WasteRecord) => void;

    // HACCP Actions
    addPCC: (pcc: PCC) => void;
    updatePCC: (pcc: PCC) => void;
    deletePCC: (id: string) => void;
    addHACCPLog: (log: HACCPLog) => void;

    // HACCP Task Actions
    addHACCPTask: (task: HACCPTask) => void;
    updateHACCPTask: (task: HACCPTask) => void;
    deleteHACCPTask: (id: string) => void;
    completeHACCPTask: (completion: HACCPTaskCompletion) => void;

    // UI State
    currentView: 'dashboard' | 'schedule' | 'production' | 'data' | 'events' | 'recipes' | 'ingredients' | 'suppliers' | 'inventory' | 'purchasing' | 'waste' | 'haccp';
    setCurrentView: (view: 'dashboard' | 'schedule' | 'production' | 'data' | 'events' | 'recipes' | 'ingredients' | 'suppliers' | 'inventory' | 'purchasing' | 'waste' | 'haccp') => void;
}

export const useStore = create<AppState>()(
    persist(
        (...a) => ({
            ...createIngredientSlice(...a),
            ...createEventSlice(...a),
            ...createStaffSlice(...a),

            recipes: [],
            menus: [],
            suppliers: [],
            purchaseOrders: [],
            wasteRecords: [],

            pccs: [],
            haccpLogs: [],
            haccpTasks: [
                { id: 'task-1', name: 'Control Temperaturas Neveras', description: 'Registrar temperatura de todas las cámaras', frequency: 'DAILY', isActive: true },
                { id: 'task-2', name: 'Limpieza Cámaras Frigoríficas', description: 'Limpieza profunda de neveras', frequency: 'WEEKLY', isActive: true },
                { id: 'task-3', name: 'Revisión Calibración Termómetros', description: 'Verificar calibración de termómetros', frequency: 'MONTHLY', isActive: true },
            ],
            haccpTaskCompletions: [],

            currentView: 'dashboard',

            setRecipes: (recipes) => a[0]({ recipes }),
            addRecipe: (recipe) => a[0]((state) => ({ recipes: [...state.recipes, recipe] })),
            setMenus: (menus) => a[0]({ menus }),
            addMenu: (menu) => a[0]((state) => ({ menus: [...state.menus, menu] })),
            setSuppliers: (suppliers) => a[0]({ suppliers }),
            addSupplier: (supplier) => a[0]((state) => ({ suppliers: [...state.suppliers, supplier] })),
            setPurchaseOrders: (purchaseOrders) => a[0]({ purchaseOrders }),
            addPurchaseOrder: (order) => a[0]((state) => ({ purchaseOrders: [...state.purchaseOrders, order] })),
            updatePurchaseOrder: (updatedOrder) => a[0]((state) => ({
                purchaseOrders: state.purchaseOrders.map(Order => Order.id === updatedOrder.id ? updatedOrder : Order)
            })),
            deletePurchaseOrder: (id) => a[0]((state) => ({
                purchaseOrders: state.purchaseOrders.filter(o => o.id !== id)
            })),

            addWasteRecord: (record) => a[0]((state) => {
                // To maintain the complex logic of waste + stock consumption, 
                // we can call the slice action or duplicate logic. 
                // Ideally, waste record creation should call 'consumeStock' from the slice.
                // For now, I'll refactor this to use the slice's logic if possible, 
                // OR simpler: just update the waste record and rely on consumeStock being called separately 
                // currently the app calls addWasteRecord which does BOTH.
                // Let's reimplement it to strictly use the store state as before for safety, 
                // but calling the slice logic would be cleaner. 
                // Given the arguments limitation in `...a`, we access state directly.

                const { ingredients } = state;
                const ingredientIndex = ingredients.findIndex((i: { id: string; }) => i.id === record.ingredientId);

                if (ingredientIndex === -1) return state;

                // We can't easily invoke the slice method `consumeStock` inside this reducer 
                // without a more complex middleware or thunk pattern in Zustand vanilla.
                // For this refactor, I will keep the logic here to ensure stability, 
                // but ideally we'd move this to a `createWasteSlice`.

                // ... (Logic copied to separate WasteSlice eventually)
                // For now, let's keep it inline but utilizing the new structure.

                // COPY OF LOGIC FROM ORIGINAL useStore.ts
                const ingredient = { ...ingredients[ingredientIndex] };
                let remainingQtyToConsume = record.quantity;

                if (!ingredient.batches) {
                    ingredient.batches = [{
                        id: crypto.randomUUID(),
                        ingredientId: ingredient.id,
                        quantity: ingredient.stock || 0,
                        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        receivedDate: new Date().toISOString(),
                        costPerUnit: ingredient.costPerUnit
                    }];
                }

                const batches = [...ingredient.batches].sort((a, b) =>
                    new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
                );

                const newBatches: any[] = []; // Explicit type or import

                for (const batch of batches) {
                    if (remainingQtyToConsume <= 0) {
                        newBatches.push(batch);
                        continue;
                    }

                    if (batch.quantity > remainingQtyToConsume) {
                        newBatches.push({
                            ...batch,
                            quantity: batch.quantity - remainingQtyToConsume
                        });
                        remainingQtyToConsume = 0;
                    } else {
                        remainingQtyToConsume -= batch.quantity;
                    }
                }

                ingredient.batches = newBatches;
                ingredient.stock = newBatches.reduce((sum, b) => sum + b.quantity, 0);

                const newIngredients = [...ingredients];
                newIngredients[ingredientIndex] = ingredient;

                return {
                    wasteRecords: [...state.wasteRecords, record],
                    ingredients: newIngredients
                };
            }),

            addPCC: (pcc) => a[0]((state) => ({ pccs: [...state.pccs, pcc] })),
            updatePCC: (pcc) => a[0]((state) => ({
                pccs: state.pccs.map(p => p.id === pcc.id ? pcc : p)
            })),
            deletePCC: (id) => a[0]((state) => ({
                pccs: state.pccs.filter(p => p.id !== id)
            })),
            addHACCPLog: (log) => a[0]((state) => ({ haccpLogs: [...state.haccpLogs, log] })),
            addHACCPTask: (task) => a[0]((state) => ({ haccpTasks: [...state.haccpTasks, task] })),
            updateHACCPTask: (task) => a[0]((state) => ({
                haccpTasks: state.haccpTasks.map(t => t.id === task.id ? task : t)
            })),
            deleteHACCPTask: (id) => a[0]((state) => ({
                haccpTasks: state.haccpTasks.filter(t => t.id !== id)
            })),
            completeHACCPTask: (completion) => a[0]((state) => ({
                haccpTaskCompletions: [...state.haccpTaskCompletions, completion]
            })),

            setCurrentView: (view) => a[0]({ currentView: view }),
        }),
        {
            name: 'kitchen-manager-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                ingredients: state.ingredients,
                recipes: state.recipes,
                menus: state.menus,
                events: state.events,
                staff: state.staff,
                suppliers: state.suppliers,
                purchaseOrders: state.purchaseOrders,
                wasteRecords: state.wasteRecords,
                schedule: state.schedule,
                pccs: state.pccs,
                haccpLogs: state.haccpLogs,
                haccpTasks: state.haccpTasks,
                haccpTaskCompletions: state.haccpTaskCompletions
            }),
        }
    )
);
