// Basic Units & Categories
export type Unit = 'kg' | 'g' | 'L' | 'ml' | 'un' | 'manojo';

export type InventoryCategory = 'meat' | 'fish' | 'produce' | 'dairy' | 'dry' | 'frozen' | 'canned' | 'cocktail' | 'sports_menu' | 'corporate_menu' | 'coffee_break' | 'restaurant' | 'other';

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

export interface Batch {
    id: string;
    ingredientId: string;
    batchNumber: string; // "LOT-20231222-001"
    initialQuantity: number;
    currentQuantity: number;
    unit: Unit;
    costPerUnit: number;
    receivedAt: string; // ISO Date
    expiresAt: string; // ISO Date
    supplierId?: string;
    purchaseOrderId?: string;
    outletId: string;
    status: 'ACTIVE' | 'DEPLETED' | 'EXPIRED';
}

// Legacy alias if needed, or update consumers
export type IngredientBatch = Batch;

export interface Ingredient {
    id: string;
    name: string;
    unit: Unit;
    costPerUnit: number; // Price per unit (e.g., /kg)
    yield: number; // Merma (0-1), e.g., 0.9 means 10% loss
    allergens: string[];
    nutritionalInfo?: NutritionalInfo;
    stock?: number; // Calculated total
    batches?: Batch[]; // New source of truth
    minStock?: number; // Safety stock level
    supplierId?: string;
    priceHistory?: PriceHistoryEntry[];
    defaultBarcode?: string;
    category?: InventoryCategory;
    shelfLife?: number; // Days
    outletId?: string;
    createdAt?: string;
    updatedAt?: string;

    // Automatic Purchasing Fields
    optimalStock?: number; // Desired max stock level
    reorderPoint?: number; // Point at which to reorder (similar to minStock, but explicit trigger)
}

// Stock Movements
export type StockMovementType = 'PURCHASE_RECEIVE' | 'PRODUCTION' | 'WASTE' | 'ADJUSTMENT' | 'INITIAL' | 'TRANSFER_IN' | 'TRANSFER_OUT';

export interface StockMovement {
    id: string;
    ingredientId: string;
    type: StockMovementType;
    quantity: number; // Positive for add, negative for remove
    costPerUnit: number; // Snapshot of cost at time of movement
    date: string; // ISO Date

    referenceId?: string; // ID of PO, WasteRecord, Recipe (Production), etc.
    batchId?: string; // Specific batch affected
    userId: string; // User who performed/authorized action
    outletId?: string;
    notes?: string;
}

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
