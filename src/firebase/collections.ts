import { collection } from 'firebase/firestore';
import { db } from './config';

// Collection Names
export const COLLECTION_NAMES = {
    INGREDIENTS: 'ingredients',
    RECIPES: 'recipes',
    MENUS: 'menus',
    EVENTS: 'events',
    STAFF: 'staff',
    SUPPLIERS: 'suppliers',
    PURCHASE_ORDERS: 'purchaseOrders',
    WASTE_RECORDS: 'wasteRecords',
    SCHEDULE: 'schedule',
    PCCS: 'pccs',
    HACCP_LOGS: 'haccpLogs',
    HACCP_TASKS: 'haccpTasks',
    HACCP_TASK_COMPLETIONS: 'haccpTaskCompletions',
    PRODUCTION_TASKS: 'productionTasks',
    OUTLETS: 'outlets',
    BATCHES: 'batches',
    FICHAS_TECNICAS: 'fichasTecnicas',
    VERSIONES_FICHAS: 'versionesFichas',
    INVENTORY: 'inventory'
} as const;

// Collection References
export const collections = {
    ingredients: collection(db, COLLECTION_NAMES.INGREDIENTS),
    recipes: collection(db, COLLECTION_NAMES.RECIPES),
    menus: collection(db, COLLECTION_NAMES.MENUS),
    events: collection(db, COLLECTION_NAMES.EVENTS),
    staff: collection(db, COLLECTION_NAMES.STAFF),
    suppliers: collection(db, COLLECTION_NAMES.SUPPLIERS),
    purchaseOrders: collection(db, COLLECTION_NAMES.PURCHASE_ORDERS),
    wasteRecords: collection(db, COLLECTION_NAMES.WASTE_RECORDS),
    schedule: collection(db, COLLECTION_NAMES.SCHEDULE),
    pccs: collection(db, COLLECTION_NAMES.PCCS),
    haccpLogs: collection(db, COLLECTION_NAMES.HACCP_LOGS),
    haccpTasks: collection(db, COLLECTION_NAMES.HACCP_TASKS),
    haccpTaskCompletions: collection(db, COLLECTION_NAMES.HACCP_TASK_COMPLETIONS),
    productionTasks: collection(db, COLLECTION_NAMES.PRODUCTION_TASKS),
    outlets: collection(db, COLLECTION_NAMES.OUTLETS),
    batches: collection(db, COLLECTION_NAMES.BATCHES),
    fichasTecnicas: collection(db, COLLECTION_NAMES.FICHAS_TECNICAS),
    versionesFichas: collection(db, COLLECTION_NAMES.VERSIONES_FICHAS),
    inventory: collection(db, COLLECTION_NAMES.INVENTORY)
};

// Alias for compatibility if needed, but try to use collections (refs) or COLLECTION_NAMES (strings)
export const COLLECTIONS = COLLECTION_NAMES;
