import type {
    Ingredient, IngredientBatch, Event, Employee, DailySchedule,
    Recipe, Menu, Supplier, PurchaseOrder, WasteRecord,
    PCC, HACCPLog, HACCPTask, HACCPTaskCompletion, MenuItemAnalytics
} from '../types';

export interface IngredientSlice {
    ingredients: Ingredient[];
    setIngredients: (items: Ingredient[]) => void;
    addIngredient: (ingredient: Ingredient) => void;
    updateIngredient: (ingredient: Ingredient) => void;
    addBatch: (ingredientId: string, batch: Omit<IngredientBatch, 'id' | 'ingredientId'>) => void;
    consumeStock: (ingredientId: string, quantity: number) => void;
}

export interface EventSlice {
    events: Event[];
    setEvents: (items: Event[]) => void;
    addEvent: (event: Event) => void;
    updateEvent: (event: Event) => void;
}

export interface StaffSlice {
    staff: Employee[];
    schedule: Record<string, DailySchedule>;
    setStaff: (items: Employee[]) => void;
    updateEmployee: (employee: Employee) => void;
    updateSchedule: (month: string, schedule: DailySchedule) => void;
    updateShift: (dateStr: string, employeeId: string, type: 'MORNING' | 'AFTERNOON') => void;
    removeShift: (dateStr: string, employeeId: string) => void;
}

export interface RecipeSlice {
    recipes: Recipe[];
    setRecipes: (recipes: Recipe[]) => void;
    addRecipe: (recipe: Recipe) => void;
    updateRecipe: (recipe: Recipe) => void;
    deleteRecipe: (id: string) => void;
}

export interface MenuSlice {
    menus: Menu[];
    setMenus: (menus: Menu[]) => void;
    addMenu: (menu: Menu) => void;
    updateMenu: (menu: Menu) => void;
    deleteMenu: (id: string) => void;
}

export interface PurchaseSlice {
    suppliers: Supplier[];
    purchaseOrders: PurchaseOrder[];
    setSuppliers: (suppliers: Supplier[]) => void;
    addSupplier: (supplier: Supplier) => void;
    updateSupplier: (supplier: Supplier) => void;
    deleteSupplier: (id: string) => void;
    setPurchaseOrders: (purchaseOrders: PurchaseOrder[]) => void;
    addPurchaseOrder: (order: PurchaseOrder) => void;
    updatePurchaseOrder: (order: PurchaseOrder) => void;
    deletePurchaseOrder: (id: string) => void;
}

export interface WasteSlice {
    wasteRecords: WasteRecord[];
    addWasteRecord: (record: WasteRecord) => void;
    deleteWasteRecord: (id: string) => void;
}

export interface HACCPSlice {
    pccs: PCC[];
    haccpLogs: HACCPLog[];
    haccpTasks: HACCPTask[];
    haccpTaskCompletions: HACCPTaskCompletion[];
    addPCC: (pcc: PCC) => void;
    updatePCC: (pcc: PCC) => void;
    deletePCC: (id: string) => void;
    addHACCPLog: (log: HACCPLog) => void;
    addHACCPTask: (task: HACCPTask) => void;
    updateHACCPTask: (task: HACCPTask) => void;
    deleteHACCPTask: (id: string) => void;
    completeHACCPTask: (completion: HACCPTaskCompletion) => void;
}

export interface AnalyticsSlice {
    calculateMenuAnalytics: (startDate: string, endDate: string) => MenuItemAnalytics[];
}

export interface AppState extends
    IngredientSlice,
    EventSlice,
    StaffSlice,
    RecipeSlice,
    MenuSlice,
    PurchaseSlice,
    WasteSlice,
    HACCPSlice,
    AnalyticsSlice {
    // UI State
    currentView: 'dashboard' | 'schedule' | 'production' | 'data' | 'events' | 'recipes' | 'ingredients' | 'suppliers' | 'inventory' | 'purchasing' | 'waste' | 'haccp' | 'analytics';
    setCurrentView: (view: 'dashboard' | 'schedule' | 'production' | 'data' | 'events' | 'recipes' | 'ingredients' | 'suppliers' | 'inventory' | 'purchasing' | 'waste' | 'haccp' | 'analytics') => void;
}
