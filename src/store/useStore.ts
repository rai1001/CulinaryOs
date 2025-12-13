import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Ingredient, Recipe, Menu, Event, Employee, DailySchedule, Supplier, PurchaseOrder, WasteRecord, PCC, HACCPLog, HACCPTask, HACCPTaskCompletion, IngredientBatch } from '../types';

interface AppState {
    // Data
    ingredients: Ingredient[];
    recipes: Recipe[];
    menus: Menu[];
    events: Event[];
    staff: Employee[];
    suppliers: Supplier[];
    purchaseOrders: PurchaseOrder[];
    wasteRecords: WasteRecord[];
    // Changed Map to Record for easier JSON persistence
    schedule: Record<string, DailySchedule>; // Key: YYYY-MM
    // HACCP Data
    pccs: PCC[];
    haccpLogs: HACCPLog[];
    haccpTasks: HACCPTask[];
    haccpTaskCompletions: HACCPTaskCompletion[];

    // Actions
    setIngredients: (items: Ingredient[]) => void;
    addIngredient: (ingredient: Ingredient) => void;
    updateIngredient: (ingredient: Ingredient) => void;
    setRecipes: (items: Recipe[]) => void;
    addRecipe: (recipe: Recipe) => void;
    setMenus: (items: Menu[]) => void;
    addMenu: (menu: Menu) => void;
    setEvents: (items: Event[]) => void;
    addEvent: (event: Event) => void;
    setStaff: (items: Employee[]) => void;
    setSuppliers: (items: Supplier[]) => void;
    addSupplier: (supplier: Supplier) => void;
    setPurchaseOrders: (items: PurchaseOrder[]) => void;
    addPurchaseOrder: (order: PurchaseOrder) => void;
    updatePurchaseOrder: (order: PurchaseOrder) => void;
    deletePurchaseOrder: (id: string) => void;
    addWasteRecord: (record: WasteRecord) => void;

    // Batch Actions
    addBatch: (ingredientId: string, batch: Omit<IngredientBatch, 'id' | 'ingredientId'>) => void;
    // Internal helper or exposed action to reduce stock FIFO
    consumeStock: (ingredientId: string, quantity: number) => void;

    updateSchedule: (month: string, schedule: DailySchedule) => void;
    updateShift: (dateStr: string, employeeId: string, type: 'MORNING' | 'AFTERNOON') => void;
    removeShift: (dateStr: string, employeeId: string) => void;
    updateEmployee: (employee: Employee) => void;

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
        (set) => ({
            ingredients: [],
            recipes: [],
            menus: [],
            events: [],
            suppliers: [],
            purchaseOrders: [],
            wasteRecords: [],
            staff: [
                { id: '1', name: 'Israel', role: 'HEAD_CHEF', consecutiveWorkDays: 0, daysOffInLast28Days: 0, vacationDaysTotal: 30, vacationDates: [] },
                { id: '2', name: 'Ramón', role: 'COOK_MORNING', consecutiveWorkDays: 0, daysOffInLast28Days: 0, vacationDaysTotal: 30, vacationDates: [] },
                { id: '3', name: 'Cristina', role: 'COOK_ROTATING', consecutiveWorkDays: 0, daysOffInLast28Days: 0, vacationDaysTotal: 30, vacationDates: [] },
                { id: '4', name: 'Yago', role: 'COOK_ROTATING', consecutiveWorkDays: 0, daysOffInLast28Days: 0, vacationDaysTotal: 30, vacationDates: [] },
                { id: '5', name: 'Iván', role: 'COOK_ROTATING', consecutiveWorkDays: 0, daysOffInLast28Days: 0, vacationDaysTotal: 30, vacationDates: [] },
            ],
            schedule: {}, // Empty object instead of Map

            pccs: [],
            haccpLogs: [],
            haccpTasks: [
                { id: 'task-1', name: 'Control Temperaturas Neveras', description: 'Registrar temperatura de todas las cámaras', frequency: 'DAILY', isActive: true },
                { id: 'task-2', name: 'Limpieza Cámaras Frigoríficas', description: 'Limpieza profunda de neveras', frequency: 'WEEKLY', isActive: true },
                { id: 'task-3', name: 'Revisión Calibración Termómetros', description: 'Verificar calibración de termómetros', frequency: 'MONTHLY', isActive: true },
            ],
            haccpTaskCompletions: [],

            currentView: 'dashboard',

            setIngredients: (ingredients) => set({ ingredients }),
            addIngredient: (ingredient) => set((state) => ({ ingredients: [...state.ingredients, ingredient] })),
            updateIngredient: (updatedIngredient) => set((state) => {
                const current = state.ingredients.find(i => i.id === updatedIngredient.id);
                let newHistory = updatedIngredient.priceHistory || [];

                if (current && current.costPerUnit !== updatedIngredient.costPerUnit) {
                    // Price changed, record history
                    // Helper: If `updatedIngredient.priceHistory` is missing, use `current.priceHistory`.
                    newHistory = current.priceHistory ? [...current.priceHistory] : [];
                    newHistory.push({
                        date: new Date().toISOString(),
                        price: updatedIngredient.costPerUnit,
                        changeReason: 'Updated via App'
                    });
                }

                // Merge history into updated object to be safe
                const finalIngredient = { ...updatedIngredient, priceHistory: newHistory };

                return {
                    ingredients: state.ingredients.map(i => i.id === updatedIngredient.id ? finalIngredient : i)
                };
            }),
            setRecipes: (recipes) => set({ recipes }),
            addRecipe: (recipe) => set((state) => ({ recipes: [...state.recipes, recipe] })),
            setMenus: (menus) => set({ menus }),
            addMenu: (menu) => set((state) => ({ menus: [...state.menus, menu] })),
            setEvents: (events) => set({ events }),
            addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
            setStaff: (staff) => set({ staff }),
            setSuppliers: (suppliers) => set({ suppliers }),
            addSupplier: (supplier) => set((state) => ({ suppliers: [...state.suppliers, supplier] })),
            setPurchaseOrders: (purchaseOrders) => set({ purchaseOrders }),
            addPurchaseOrder: (order) => set((state) => ({ purchaseOrders: [...state.purchaseOrders, order] })),
            updatePurchaseOrder: (updatedOrder) => set((state) => ({
                purchaseOrders: state.purchaseOrders.map(Order => Order.id === updatedOrder.id ? updatedOrder : Order)
            })),
            deletePurchaseOrder: (id) => set((state) => ({
                purchaseOrders: state.purchaseOrders.filter(o => o.id !== id)
            })),

            addWasteRecord: (record) => set((state) => {
                const { ingredients } = state;
                const ingredientIndex = ingredients.findIndex(i => i.id === record.ingredientId);

                if (ingredientIndex === -1) return state;

                const ingredient = { ...ingredients[ingredientIndex] };
                let remainingQtyToConsume = record.quantity;

                // Initialize batches if they don't exist (Migration)
                if (!ingredient.batches) {
                    ingredient.batches = [{
                        id: crypto.randomUUID(),
                        ingredientId: ingredient.id,
                        quantity: ingredient.stock || 0,
                        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Dummy +30 days
                        receivedDate: new Date().toISOString(),
                        costPerUnit: ingredient.costPerUnit
                    }];
                }

                // Sort batches by expiry ASC (FIFO)
                const batches = [...ingredient.batches].sort((a, b) =>
                    new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
                );

                const newBatches: IngredientBatch[] = [];

                // Consume logic
                for (const batch of batches) {
                    if (remainingQtyToConsume <= 0) {
                        newBatches.push(batch);
                        continue;
                    }

                    if (batch.quantity > remainingQtyToConsume) {
                        // Partial consumption of this batch
                        newBatches.push({
                            ...batch,
                            quantity: batch.quantity - remainingQtyToConsume
                        });
                        remainingQtyToConsume = 0;
                    } else {
                        // Fully consume this batch
                        remainingQtyToConsume -= batch.quantity;
                        // specific batch is removed (not pushed to newBatches)
                    }
                }

                ingredient.batches = newBatches;
                // Update total stock to match batches
                ingredient.stock = newBatches.reduce((sum, b) => sum + b.quantity, 0);

                const newIngredients = [...ingredients];
                newIngredients[ingredientIndex] = ingredient;

                return {
                    wasteRecords: [...state.wasteRecords, record],
                    ingredients: newIngredients
                };
            }),

            addBatch: (ingredientId, batchData) => set((state) => {
                const newIngredients = state.ingredients.map(ing => {
                    if (ing.id === ingredientId) {
                        const newBatch: IngredientBatch = {
                            ...batchData,
                            id: crypto.randomUUID(),
                            ingredientId
                        };
                        const currentBatches = ing.batches || (ing.stock ? [{
                            id: crypto.randomUUID(),
                            ingredientId: ing.id,
                            quantity: ing.stock,
                            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                            receivedDate: new Date().toISOString(),
                            costPerUnit: ing.costPerUnit
                        }] : []);

                        const updatedBatches = [...currentBatches, newBatch];
                        return {
                            ...ing,
                            batches: updatedBatches,
                            stock: updatedBatches.reduce((sum, b) => sum + b.quantity, 0)
                        };
                    }
                    return ing;
                });
                return { ingredients: newIngredients };
            }),

            consumeStock: (ingredientId, quantity) => set((state) => {
                // Reuse logic similar to addWasteRecord but generic
                // For now, let's keep it simple and just do it here
                const ingredientIndex = state.ingredients.findIndex(i => i.id === ingredientId);
                if (ingredientIndex === -1) return state;

                const ingredient = { ...state.ingredients[ingredientIndex] };
                let remaining = quantity;

                if (!ingredient.batches) {
                    // Migration fallback for old stock if any
                    if ((ingredient.stock || 0) >= quantity) {
                        ingredient.stock = (ingredient.stock || 0) - quantity;
                        return { ingredients: state.ingredients.map(i => i.id === ingredientId ? ingredient : i) };
                    }
                    return state;
                }

                // Standard FIFO
                const batches = [...ingredient.batches].sort((a, b) =>
                    new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
                );
                const newBatches: IngredientBatch[] = [];

                for (const batch of batches) {
                    if (remaining <= 0) {
                        newBatches.push(batch);
                        continue;
                    }

                    if (batch.quantity > remaining) {
                        newBatches.push({ ...batch, quantity: batch.quantity - remaining });
                        remaining = 0;
                    } else {
                        remaining -= batch.quantity;
                    }
                }

                ingredient.batches = newBatches;
                ingredient.stock = newBatches.reduce((sum, b) => sum + b.quantity, 0);

                const newIngredients = [...state.ingredients];
                newIngredients[ingredientIndex] = ingredient;
                return { ingredients: newIngredients };
            }),

            updateSchedule: (month, data) => set((state) => ({
                schedule: {
                    ...state.schedule,
                    [month]: data
                }
            })),

            updateShift: (dateStr, employeeId, type) => set((state) => {
                const date = new Date(dateStr);
                const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
                const currentMonthSchedule = state.schedule[monthKey];

                if (!currentMonthSchedule) return state; // Can't update if month doesn't exist

                const newShifts = currentMonthSchedule.shifts.filter(s => !(s.date === dateStr && s.employeeId === employeeId));
                newShifts.push({
                    date: dateStr,
                    employeeId,
                    type
                });

                return {
                    schedule: {
                        ...state.schedule,
                        [monthKey]: {
                            ...currentMonthSchedule,
                            shifts: newShifts
                        }
                    }
                };
            }),

            updateEmployee: (employee) => set((state) => ({
                staff: state.staff.map(e => e.id === employee.id ? employee : e)
            })),

            removeShift: (dateStr, employeeId) => set((state) => {
                const date = new Date(dateStr);
                const monthKey = date.toISOString().slice(0, 7);
                const currentMonthSchedule = state.schedule[monthKey];

                if (!currentMonthSchedule) return state;

                return {
                    schedule: {
                        ...state.schedule,
                        [monthKey]: {
                            ...currentMonthSchedule,
                            shifts: currentMonthSchedule.shifts.filter(s => !(s.date === dateStr && s.employeeId === employeeId))
                        }
                    }
                };
            }),

            addPCC: (pcc) => set((state) => ({ pccs: [...state.pccs, pcc] })),

            updatePCC: (pcc) => set((state) => ({
                pccs: state.pccs.map(p => p.id === pcc.id ? pcc : p)
            })),

            deletePCC: (id) => set((state) => ({
                pccs: state.pccs.filter(p => p.id !== id)
            })),

            addHACCPLog: (log) => set((state) => ({ haccpLogs: [...state.haccpLogs, log] })),

            addHACCPTask: (task) => set((state) => ({ haccpTasks: [...state.haccpTasks, task] })),

            updateHACCPTask: (task) => set((state) => ({
                haccpTasks: state.haccpTasks.map(t => t.id === task.id ? task : t)
            })),

            deleteHACCPTask: (id) => set((state) => ({
                haccpTasks: state.haccpTasks.filter(t => t.id !== id)
            })),

            completeHACCPTask: (completion) => set((state) => ({
                haccpTaskCompletions: [...state.haccpTaskCompletions, completion]
            })),

            setCurrentView: (view) => set({ currentView: view }),
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
