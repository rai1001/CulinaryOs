import {
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    doc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    collection,
    getDoc,
    writeBatch
} from "firebase/firestore";
import type {
    CollectionReference,
    DocumentData,
    WithFieldValue,
    UpdateData,
    QueryConstraint
} from "firebase/firestore";
import { db } from "../firebase/config";
import type {
    PurchaseOrder,
    Event,
    PurchaseOrderFilters,
    PageCursor,
    PaginatedResult
} from "../types";
import { COLLECTIONS } from "../firebase/collections";

// Generic CRUD operations

export const getAllDocuments = async <T>(collectionRef: CollectionReference<T>): Promise<T[]> => {
    const querySnapshot = await getDocs(collectionRef);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const getCollection = async <T>(collectionName: string): Promise<T[]> => {
    const colRef = collection(db, collectionName) as CollectionReference<T>;
    return getAllDocuments(colRef);
};

// Helper to strip undefined values (Firestore rejects them)
export const sanitizeData = <T extends object>(data: T): T => {
    const cleanFn = (obj: any): any => {
        if (Array.isArray(obj)) {
            return obj.map(v => cleanFn(v));
        }
        if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
            const newObj: any = {};
            Object.keys(obj).forEach(key => {
                const value = obj[key];
                if (value !== undefined) {
                    newObj[key] = cleanFn(value);
                }
            });
            return newObj;
        }
        return obj;
    };
    return cleanFn(data);
};

// Helper for mock DB
const getMockDB = () => {
    if (typeof localStorage === 'undefined') return null;
    const mock = localStorage.getItem('E2E_MOCK_DB');
    return mock ? JSON.parse(mock) : null;
};

const saveMockDB = (data: any) => {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('E2E_MOCK_DB', JSON.stringify(data));
    }
};

// Helper to dispatch mock update event
const dispatchMockUpdate = (collection: string) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('MOCK_DB_UPDATED', { detail: { collection } }));
    }
};

export const setDocument = async <T extends DocumentData>(collectionName: string, id: string, data: WithFieldValue<T>): Promise<void> => {
    const mockDB = getMockDB();
    if (mockDB) {
        if (!mockDB[collectionName]) mockDB[collectionName] = [];
        const index = mockDB[collectionName].findIndex((d: any) => d.id === id);
        const docData = sanitizeData({ ...data, id }); // Ensure ID is part of data
        if (index >= 0) {
            mockDB[collectionName][index] = { ...mockDB[collectionName][index], ...docData };
        } else {
            mockDB[collectionName].push(docData);
        }
        saveMockDB(mockDB);
        dispatchMockUpdate(collectionName);
        return;
    }
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, sanitizeData(data as any));
};

export const addDocument = async <T extends DocumentData>(collectionRef: CollectionReference<T>, data: WithFieldValue<T>): Promise<string> => {
    const mockDB = getMockDB();
    if (mockDB) {
        // We need collection name. collectionRef doesn't easily give it without parsing path.
        // Assuming path is the collection name for simple refs.
        const collectionName = collectionRef.path;
        if (!mockDB[collectionName]) mockDB[collectionName] = [];
        const id = 'mock-' + Date.now();
        const docData = sanitizeData({ ...data, id });
        mockDB[collectionName].push(docData);
        saveMockDB(mockDB);
        dispatchMockUpdate(collectionName);
        return id;
    }
    const docRef = await addDoc(collectionRef, sanitizeData(data as any));
    return docRef.id;
};

export const updateDocument = async <T>(collectionName: string, id: string, data: UpdateData<T>): Promise<void> => {
    const mockDB = getMockDB();
    if (mockDB) {
        if (!mockDB[collectionName]) return;
        const index = mockDB[collectionName].findIndex((d: any) => d.id === id);
        if (index >= 0) {
            mockDB[collectionName][index] = { ...mockDB[collectionName][index], ...sanitizeData(data as any) };
            saveMockDB(mockDB);
            dispatchMockUpdate(collectionName);
        }
        return;
    }
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, sanitizeData(data as any));
};

export const deleteDocument = async (collectionName: string, id: string): Promise<void> => {
    const mockDB = getMockDB();
    if (mockDB) {
        if (mockDB[collectionName]) {
            mockDB[collectionName] = mockDB[collectionName].filter((d: any) => d.id !== id);
            saveMockDB(mockDB);
            dispatchMockUpdate(collectionName);
        }
        return;
    }
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
};

export const batchSetDocuments = async <T extends DocumentData>(collectionName: string, documents: { id: string, data: T }[]): Promise<void> => {
    const mockDB = getMockDB();
    if (mockDB) {
        if (!mockDB[collectionName]) mockDB[collectionName] = [];
        documents.forEach(({ id, data }) => {
            const index = mockDB[collectionName].findIndex((d: any) => d.id === id);
            const docData = sanitizeData({ ...data, id });
            if (index >= 0) {
                mockDB[collectionName][index] = { ...mockDB[collectionName][index], ...docData };
            } else {
                mockDB[collectionName].push(docData);
            }
        });
        saveMockDB(mockDB);
        dispatchMockUpdate(collectionName);
        return;
    }

    // Firestore batch limit is 500
    const chunkSize = 500;
    for (let i = 0; i < documents.length; i += chunkSize) {
        const chunk = documents.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        chunk.forEach(({ id, data }) => {
            const docRef = doc(db, collectionName, id);
            batch.set(docRef, sanitizeData(data as any));
        });

        await batch.commit();
    }
};

export const queryDocuments = async <T>(collectionRef: CollectionReference<T>, ...constraints: QueryConstraint[]): Promise<T[]> => {
    const mockDB = getMockDB();
    if (mockDB) {
        const collectionName = collectionRef.path;
        const items = mockDB[collectionName] || [];
        // Filtering in mocks is hard to genericize perfectly without a query engine.
        // For now, return ALL and let client filter if possible, OR generic simple filters.
        // Ideally, we implement basic filtering if needed. 
        // For E2E simple flows, often we just need the data.
        return items as T[];
    }
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

/**
 * Paginates purchase orders with compound filters.
 * Sorts by date DESC, then ID DESC for deterministic ordering.
 */
export const getPurchaseOrdersPage = async ({
    outletId,
    filters,
    pageSize,
    cursor
}: {
    outletId: string;
    filters: PurchaseOrderFilters;
    pageSize: number;
    cursor: PageCursor | null;
}): Promise<PaginatedResult<PurchaseOrder>> => {
    const mockDB = getMockDB();
    if (mockDB) {
        let items = mockDB['purchaseOrders'] || [];

        // Filter by Outlet
        items = items.filter((i: any) => i.outletId === outletId);

        // Filter by Status
        if (filters.status && filters.status !== 'ALL') {
            items = items.filter((i: any) => i.status === filters.status);
        }

        // Filter by Supplier
        if (filters.supplierId && filters.supplierId !== 'ALL') {
            if (filters.supplierId === 'SIN_ASIGNAR') {
                items = items.filter((i: any) => !i.supplierId);
            } else {
                items = items.filter((i: any) => i.supplierId === filters.supplierId);
            }
        }

        // Sort
        items.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Pagination (Simple slice for mock)
        // Ignoring cursor for simplicity in E2E unless strictly needed
        const pagedItems = items.slice(0, pageSize);

        return {
            items: pagedItems,
            nextCursor: null,
            hasMore: items.length > pageSize
        };
    }

    const constraints: QueryConstraint[] = [
        where("outletId", "==", outletId)
    ];

    // Apply filters
    if (filters.status && filters.status !== 'ALL') {
        constraints.push(where("status", "==", filters.status));
    }

    if (filters.supplierId !== undefined && filters.supplierId !== 'ALL') {
        if (filters.supplierId === null || filters.supplierId === 'SIN_ASIGNAR') {
            constraints.push(where("supplierId", "==", null));
        } else {
            constraints.push(where("supplierId", "==", filters.supplierId));
        }
    }

    // Sort order: date DESC, __name__ DESC (id)
    constraints.push(orderBy("date", "desc"));
    constraints.push(orderBy("__name__", "desc"));

    // Cursor
    if (cursor) {
        constraints.push(startAfter(cursor.lastDate, cursor.lastId));
    }

    // Limit
    constraints.push(limit(pageSize));

    const q = query(collection(db, COLLECTIONS.PURCHASE_ORDERS), ...constraints);
    const snapshot = await getDocs(q);

    // Process results
    const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PurchaseOrder));

    let nextCursor: PageCursor | null = null;
    const hasMore = items.length === pageSize;

    if (hasMore) {
        const lastItem = items[items.length - 1];
        nextCursor = {
            lastDate: lastItem.date,
            lastId: lastItem.id
        };
    }

    return { items, nextCursor, hasMore };
};

/**
 * Fetches events within a date range for a specific outlet.
 */
export const getEventsRange = async ({
    outletId,
    startDate,
    endDate
}: {
    outletId: string;
    startDate: string;
    endDate: string;
}): Promise<Event[]> => {
    const mockDB = getMockDB();
    if (mockDB) {
        const events = mockDB['events'] || [];
        return events.filter((e: any) =>
            e.outletId === outletId &&
            e.date >= startDate &&
            e.date <= endDate
        ).sort((a: any, b: any) => a.date.localeCompare(b.date));
    }

    const constraints: QueryConstraint[] = [
        where("outletId", "==", outletId),
        where("date", ">=", startDate),
        where("date", "<=", endDate),
        orderBy("date", "asc")
    ];

    const q = query(collection(db, COLLECTIONS.EVENTS), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Event));
};

// Helper for getById
export const getDocumentById = async <T>(collectionName: string, id: string): Promise<T | undefined> => {
    const mockDB = getMockDB();
    if (mockDB) {
        return mockDB[collectionName]?.find((d: any) => d.id === id);
    }
    const d = await getDoc(doc(db, collectionName, id));
    return d.exists() ? { id: d.id, ...d.data() } as any : undefined;
};

// Batch delete helper
export const deleteAllDocuments = async (collectionName: string): Promise<void> => {
    const mockDB = getMockDB();
    if (mockDB) {
        if (mockDB[collectionName]) {
            mockDB[collectionName] = [];
            saveMockDB(mockDB);
            dispatchMockUpdate(collectionName);
        }
        return;
    }

    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();
};

export const batchDeleteDocuments = async (collectionName: string, ids: string[]): Promise<void> => {
    const mockDB = getMockDB();
    if (mockDB) {
        if (mockDB[collectionName]) {
            mockDB[collectionName] = mockDB[collectionName].filter((d: any) => !ids.includes(d.id));
            saveMockDB(mockDB);
            dispatchMockUpdate(collectionName);
        }
        return;
    }

    // Firestore batch limit is 500
    const chunkSize = 500;
    for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        chunk.forEach(id => {
            const docRef = doc(db, collectionName, id);
            batch.delete(docRef);
        });

        await batch.commit();
    }
};

// Unified Service Export
export const firestoreService = {
    getAll: getAllDocuments,
    getById: getDocumentById,
    update: updateDocument,
    create: addDocument,
    delete: deleteDocument,
    deleteAll: deleteAllDocuments,
    batchDelete: batchDeleteDocuments,
    query: queryDocuments
};
