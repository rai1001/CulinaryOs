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
}

export type PurchaseStatus = 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderItem {
    ingredientId: string;
    quantity: number;
    unit: Unit;
    costPerUnit: number;
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
    totalCost?: number; // Calculated
    nutritionalInfo?: NutritionalInfo; // Calculated
}

export interface Menu {
    id: string;
    name: string;
    recipeIds: string[];
    recipes?: Recipe[]; // Hydrated
    sellPrice?: number;
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
}

// Staff & Scheduling Types

export type Role = 'HEAD_CHEF' | 'COOK_MORNING' | 'COOK_ROTATING';

export interface Employee {
    id: string;
    name: string;
    role: Role;
    // Stats for algorithm
    consecutiveWorkDays: number;
    daysOffInLast28Days: number;
    // Vacation Tracking
    vacationDaysTotal: number; // Annual allowance, default 30
    vacationDates: string[]; // ISO Dates (YYYY-MM-DD)
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
