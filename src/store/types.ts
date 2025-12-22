import type {
    Ingredient, IngredientBatch, Event, Employee, DailySchedule,
    Recipe, Menu, Supplier, PurchaseOrder, WasteRecord,
    PCC, HACCPLog, HACCPTask, HACCPTaskCompletion, MenuItemAnalytics,
    KanbanTask, KanbanTaskStatus, BreakfastService, OccupancyData, Integration
} from '../types';
import type { NotificationSlice } from './slices/createNotificationSlice';

export interface BreakfastSlice {
    breakfastServices: BreakfastService[];
    setBreakfastServices: (services: BreakfastService[]) => void;
    updateBreakfastService: (service: BreakfastService) => Promise<void>;
    importOccupancy: (data: OccupancyData[]) => Promise<void>;
    fetchBreakfastServices: () => Promise<void>;
    commitBreakfastConsumption: (serviceId: string) => Promise<void>;
}

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
    eventsLoading: boolean;
    eventsError: string | null;
    eventsRange: { start: string; end: string } | null;
    setEvents: (items: Event[]) => void;
    addEvent: (event: Event) => void;
    updateEvent: (event: Event) => void;
    getFilteredEvents: () => Event[];
    fetchEventsRange: (start: string, end: string) => Promise<void>;
    deleteEvent: (id: string) => Promise<void>;
}

export interface ProductionSlice {
    selectedProductionEventId: string | null;
    productionTasks: Record<string, KanbanTask[]>; // { eventId: [tasks] }
    setSelectedProductionEventId: (id: string | null) => void;
    generateProductionTasks: (event: Event) => void;
    updateTaskStatus: (eventId: string, taskId: string, status: KanbanTaskStatus) => void;
    todayProductionStats?: { total: number; completed: number; pending: number; }; // Computed?
    clearProductionTasks: (eventId: string) => void;
    setProductionTasks: (eventId: string, tasks: KanbanTask[]) => void;
    replaceAllProductionTasks: (tasksByEvent: Record<string, KanbanTask[]>) => void;
    toggleTaskTimer: (eventId: string, taskId: string) => void;
    updateTaskSchedule: (eventId: string, taskId: string, updates: {
        assignedDate?: string;
        shift?: import('../types').ShiftType;
        assignedEmployeeId?: string;
    }) => void;
}

export interface StaffSlice {
    staff: Employee[];
    schedule: Record<string, DailySchedule>;
    setStaff: (items: Employee[]) => void;
    addEmployee: (employee: Employee) => void;
    updateEmployee: (employee: Employee) => void;
    deleteEmployee: (id: string) => void;
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

    // Pagination State
    purchaseOrders: PurchaseOrder[];
    purchaseOrdersLoading: boolean;
    purchaseOrdersError: string | null;
    purchaseOrdersHasMore: boolean;
    purchaseOrdersCursor: import('../types').PageCursor | null;
    purchaseOrdersFilters: import('../types').PurchaseOrderFilters;

    setSuppliers: (suppliers: Supplier[]) => void;
    addSupplier: (supplier: Supplier) => void;
    updateSupplier: (supplier: Supplier) => void;
    deleteSupplier: (id: string) => void;
    clearSuppliers: () => void;

    // Purchase Order Actions
    setPurchaseOrders: (purchaseOrders: PurchaseOrder[]) => void; // Keep for legacy or manual set
    addPurchaseOrder: (order: PurchaseOrder) => void;
    updatePurchaseOrder: (order: PurchaseOrder) => void;
    deletePurchaseOrder: (id: string) => void;
    // Async Actions
    fetchPurchaseOrders: (options?: { reset?: boolean }) => Promise<void>;
    loadMorePurchaseOrders: () => Promise<void>;
    setPurchaseOrderFilters: (filters: import('../types').PurchaseOrderFilters) => void;
    receivePurchaseOrderItems: (orderId: string, receivedItems: Record<string, number>) => Promise<void>;
}

export interface WasteSlice {
    wasteRecords: WasteRecord[];
    setWasteRecords: (records: WasteRecord[]) => void;
    addWasteRecord: (record: WasteRecord) => void;
    deleteWasteRecord: (id: string) => void;
}

export interface HACCPSlice {
    pccs: PCC[];
    haccpLogs: HACCPLog[];
    haccpTasks: HACCPTask[];
    haccpTaskCompletions: HACCPTaskCompletion[];
    setPCCs: (pccs: PCC[]) => void;
    setHACCPLogs: (logs: HACCPLog[]) => void;
    setHACCPTasks: (tasks: HACCPTask[]) => void;
    setHACCPTaskCompletions: (completions: HACCPTaskCompletion[]) => void;
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

export interface IntegrationSlice {
    integrations: Integration[];
    setIntegrations: (integrations: Integration[]) => void;
    connectIntegration: (id: string) => Promise<void>;
    disconnectIntegration: (id: string) => Promise<void>;
}

export interface OutletSlice {
    outlets: import('../types').Outlet[];
    activeOutletId: string | null;
    setOutlets: (outlets: import('../types').Outlet[]) => void;
    addOutlet: (outlet: import('../types').Outlet) => void;
    updateOutlet: (id: string, updates: Partial<import('../types').Outlet>) => void;
    setActiveOutlet: (id: string | null) => void;
    deleteOutlet: (id: string) => void;
    toggleOutletActive: (id: string) => void;
    getOutlet: (id: string) => import('../types').Outlet | undefined;
}
export interface AuthSlice {
    currentUser: import('../types').User | null;
    setCurrentUser: (user: import('../types').User | null) => void;
}

export interface AppState extends
    IngredientSlice,
    EventSlice,
    ProductionSlice,
    StaffSlice,
    RecipeSlice,
    MenuSlice,
    PurchaseSlice,
    WasteSlice,
    HACCPSlice,
    AnalyticsSlice,
    OutletSlice,
    BreakfastSlice,
    NotificationSlice,
    IntegrationSlice,
    AuthSlice {
    // activeOutletId is inherited from OutletSlice
    setActiveOutletId: (id: string | null) => void;
}
