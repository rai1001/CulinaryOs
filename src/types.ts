// Domain Types

export type Unit = 'kg' | 'g' | 'L' | 'ml' | 'un' | 'manojo';

export interface Supplier {
    id: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    leadTime?: number; // Days to deliver
    orderDays?: number[]; // Days of week (0-6) they accept/deliver orders
    minimumOrderValue?: number; // Minimum monetary value for an order
    outletId?: string;
}

export interface IngredientBatch {
    id: string;
    ingredientId: string;
    barcode?: string;
    quantity: number;
    expiryDate: string; // ISO Date
    receivedDate: string; // ISO Date
    costPerUnit: number;
}

export interface NutritionalInfo {
    calories: number; // kcal per 100g/ml
    protein: number; // g per 100g/ml
    carbs: number; // g per 100g/ml
    fat: number; // g per 100g/ml
}

export interface PriceHistoryEntry {
    date: string; // ISO Date
    price: number;
    changeReason?: string;
}

// Inventory Categories
export type InventoryCategory = 'meat' | 'fish' | 'produce' | 'dairy' | 'dry' | 'frozen' | 'canned' | 'cocktail' | 'sports_menu' | 'corporate_menu' | 'coffee_break' | 'restaurant' | 'other';

export interface Ingredient {
    id: string;
    name: string;
    unit: Unit;
    costPerUnit: number; // Price per unit (e.g., /kg)
    yield: number; // Merma (0-1), e.g., 0.9 means 10% loss
    allergens: string[];
    nutritionalInfo?: NutritionalInfo;
    stock?: number; // Calculated total
    batches?: IngredientBatch[]; // New source of truth
    minStock?: number; // Safety stock level
    supplierId?: string;
    priceHistory?: PriceHistoryEntry[];
    defaultBarcode?: string;
    category?: InventoryCategory;
    outletId?: string;
}

export type PurchaseStatus = 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'PARTIAL' | 'CANCELLED';

export interface PurchaseOrderItem {
    ingredientId: string;
    quantity: number;
    unit: Unit;
    costPerUnit: number;
    receivedQuantity?: number; // For partial/full reception
}

export interface PurchaseOrder {
    id: string;
    supplierId: string;
    date: string; // Creation date
    deliveryDate?: string;
    orderDeadline?: string; // Latest date to order by to meet lead time
    status: PurchaseStatus;
    items: PurchaseOrderItem[];
    totalCost: number;
    outletId?: string;
    eventId?: string; // Link to an event
}

export interface RecipeIngredient {
    ingredientId: string;
    quantity: number; // Gross quantity needed
    ingredient?: Ingredient; // Hydrated
}

export interface Recipe {
    id: string;
    name: string;
    station: 'hot' | 'cold' | 'dessert';
    ingredients: RecipeIngredient[];
    isBase?: boolean; // True if this is a base recipe (e.g., from "Bases" sheet)
    totalCost?: number; // Calculated
    nutritionalInfo?: NutritionalInfo; // Calculated
    outletId?: string;
}

export interface MenuVariation {
    dishName: string; // The original dish name
    alternativeDishName: string; // The variaton (e.g., "Hamburguesa Vegana")
    notes?: string;
}

export interface Menu {
    id: string;
    name: string;
    description?: string; // Added description
    recipeIds: string[];
    recipes?: Recipe[]; // Hydrated
    variations?: MenuVariation[]; // New field for variations
    sellPrice?: number;
    outletId?: string;
}

export type EventType = 'Comida' | 'Cena' | 'Empresa' | 'Coctel' | 'Mediodia' | 'Noche' | 'Equipo Deportivo' | 'Coffee Break' | 'Boda' | 'Otros';

export interface Event {
    id: string;
    name: string;
    date: string; // ISO Date
    pax: number;
    type: EventType;
    menuId?: string;
    menu?: Menu;
    notes?: string;
    outletId?: string;
}

export type KanbanTaskStatus = 'todo' | 'in-progress' | 'done';

export interface KanbanTask {
    id: string;
    title: string;
    quantity: number;
    unit: string;
    description: string;
    status: KanbanTaskStatus;
    recipeId?: string;
    station?: 'hot' | 'cold' | 'dessert';
    eventId?: string; // Added field referenced in slice

    // Timer & Scheduling
    estimatedTime?: number; // In minutes
    timerStart?: number; // Timestamp (Date.now()) or null
    totalTimeSpent?: number; // In seconds
    shift?: ShiftType;
    assignedDate?: string; // YYYY-MM-DD
}

// Staff & Scheduling Types

// Auth Types
export interface User {
    id: string;
    email: string;
    role: Role;
    name: string;
    allowedOutlets?: string[]; // IDs of outlets this user can access
}

export type Role = 'HEAD_CHEF' | 'COOK_MORNING' | 'COOK_ROTATING';

export interface Employee {
    id: string;
    name: string;
    role: Role;
    // Stats for algorithm
    consecutiveWorkDays: number;
    daysOffInLast28Days: number;
    // Tracking
    vacationDaysTotal: number; // Annual allowance, default 30
    vacationDates: string[]; // ISO Dates (YYYY-MM-DD)
    outletId?: string;
}

export type ShiftType = 'MORNING' | 'AFTERNOON' | 'OFF';

export interface Shift {
    date: string; // YYYY-MM-DD
    employeeId: string;
    type: ShiftType;
}

export interface DailySchedule {
    date: string; // YYYY-MM-DD
    shifts: Shift[];
    validationErrors?: string[];
    staffingStatus: 'OK' | 'UNDERSTAFFED' | 'OVERSTAFFED';
}

// Waste Control Types

export type WasteReason = 'CADUCIDAD' | 'ELABORACION' | 'DETERIORO' | 'EXCESO_PRODUCCION' | 'OTROS';

export interface WasteRecord {
    id: string;
    date: string; // ISO Date
    ingredientId: string;
    quantity: number;
    unit: Unit; // Inherited from Ingredient
    costAtTime: number; // Snapshot of costPerUnit when waste happened
    reason: WasteReason;
    notes?: string;
}

// HACCP Types

export type PCCType = 'FRIDGE' | 'FREEZER' | 'HOT_HOLDING' | 'COOLING' | 'OTHER';

export interface PCC {
    id: string;
    name: string;
    description?: string;
    type: PCCType;
    minTemp?: number;
    maxTemp?: number;
    isActive: boolean;
}

export interface HACCPLog {
    id: string;
    pccId: string;
    value: number;
    timestamp: string; // ISO Date
    userId: string; // Ideally linked to Employee
    status: 'CORRECT' | 'WARNING' | 'CRITICAL';
    notes?: string;
}

export type HACCPTaskFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface HACCPTask {
    id: string;
    name: string;
    description?: string;
    frequency: HACCPTaskFrequency;
    isActive: boolean;
}

export interface HACCPTaskCompletion {
    id: string;
    taskId: string;
    completedAt: string; // ISO Date
    completedBy: string; // User ID
    notes?: string;
}

// Menu Engineering (Boston Matrix) Types

export type DishClassification = 'star' | 'dog' | 'cash-cow' | 'puzzle';

export interface MenuItemAnalytics {
    recipeId: string;
    recipeName: string;
    totalRevenue: number; // Total revenue from this dish
    totalOrders: number; // Number of times ordered (sum of PAX across events)
    avgProfitPerServing: number; // Average profit per serving
    totalProfit: number; // Total profit across all orders
    popularityScore: number; // Percentage of total orders (0-1)
    profitabilityScore: number; // Profit margin percentage (0-1)
    classification: DishClassification;
    lastOrdered?: string; // ISO Date
}

// Breakfast Module Types
export interface BreakfastService {
    id: string; // YYYY-MM-DD
    date: string; // YYYY-MM-DD
    forecastPax: number;
    realPax: number;
    consumption: Record<string, number>; // ingredientId -> quantity
    notes?: string;
    outletId?: string;
}

export interface OccupancyData {
    date: string;
    pax: number;
}

// Multi-Kitchen / Outlet Management Types

export type OutletType = 'main_kitchen' | 'bar' | 'banquet' | 'room_service' | 'pizzeria' | 'other';

export interface Outlet {
    id: string;
    name: string;
    type: OutletType;
    isActive: boolean;
    address?: string;
    phone?: string;
}

// Extended types with Outlet context
export interface MenuWithOutlet extends Menu {
    outletId?: string;
}

export interface EventWithOutlet extends Event {
    outletId?: string;
}

export interface PurchaseOrderFilters {
    status?: string;
    supplierId?: string | null; // null means "SIN_ASIGNAR"
}

export interface PageCursor {
    lastDate: string; // Using string (ISO) to match types.ts
    lastId: string;
}

export interface PaginatedResult<T> {
    items: T[];
    nextCursor: PageCursor | null;
    hasMore: boolean;
}


// AI Integration Types

export interface ProcessedInvoice {
    supplierName: string;
    date: string;
    totalCost: number;
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        total?: number;
    }[];
}

export interface GeneratedMenu {
    name: string;
    description: string;
    dishes: {
        name: string;
        description: string;
        category: string;
        allergens: string[];
    }[];
    estimatedCost?: number;
    sellPrice?: number;
}

export interface IngredientEnrichment {
    nutritionalInfo: NutritionalInfo;
    allergens: string[];
}

export interface DemandPrediction {
    suggestions: {
        ingredientName: string;
        quantity: number;
        unit: string;
        reason: string;
    }[];
}

export type ViewType = 'dashboard' | 'schedule' | 'production' | 'data' | 'events' | 'recipes' | 'ingredients' | 'suppliers' | 'inventory' | 'purchasing' | 'waste' | 'haccp' | 'analytics' | 'kds' | 'ai-scanner' | 'ai-search' | 'ai-menu' | 'ai-ingredients' | 'outlets' | 'menus' | 'breakfast';

export interface Notification {
    id: string;
    type: 'HACCP_ALERT' | 'SYSTEM';
    message: string;
    pccId?: string;
    read: boolean;
    timestamp: any; // Firestore Timestamp or Date
}
