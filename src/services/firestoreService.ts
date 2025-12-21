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
    getDoc
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

export const setDocument = async <T extends DocumentData>(collectionName: string, id: string, data: WithFieldValue<T>): Promise<void> => {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, sanitizeData(data as any));
};

export const addDocument = async <T extends DocumentData>(collectionRef: CollectionReference<T>, data: WithFieldValue<T>): Promise<string> => {
    const docRef = await addDoc(collectionRef, sanitizeData(data as any));
    return docRef.id;
};

export const updateDocument = async <T>(collectionName: string, id: string, data: UpdateData<T>): Promise<void> => {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, sanitizeData(data as any));
};

export const deleteDocument = async (collectionName: string, id: string): Promise<void> => {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
};

export const queryDocuments = async <T>(collectionRef: CollectionReference<T>, ...constraints: QueryConstraint[]): Promise<T[]> => {
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
    const d = await getDoc(doc(db, collectionName, id));
    return d.exists() ? { id: d.id, ...d.data() } as any : undefined;
};

// Unified Service Export
export const firestoreService = {
    getAll: getAllDocuments,
    getById: getDocumentById,
    update: updateDocument,
    create: addDocument,
    delete: deleteDocument,
    query: queryDocuments
};
