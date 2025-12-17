import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { collections } from '../firebase/collections';
import { getAllDocuments } from '../services/firestoreService';
import type {
    Ingredient,
    Recipe,
    Menu,
    Employee,
    DailySchedule,
    Supplier,
    WasteRecord
} from '../types';

// Hook to sync data from Firestore on mount
export const useFirestoreSync = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const syncData = async () => {
            try {
                setLoading(true);
                const store = useStore.getState();

                const [
                    ingredientsData,
                    recipesData,
                    menusData,
                    // eventsData, // Removed: Loaded on demand
                    staffData,
                    scheduleData,
                    suppliersData,
                    // ordersData, // Removed: Loaded on demand
                    wasteData,
                    pccsData,
                    haccpLogsData,
                    haccpTasksData,
                    haccpCompletionsData,
                    outletsData
                ] = await Promise.all([
                    getAllDocuments(collections.ingredients),
                    getAllDocuments(collections.recipes),
                    getAllDocuments(collections.menus),
                    // getAllDocuments(collections.events),
                    getAllDocuments(collections.staff),
                    getAllDocuments(collections.schedule),
                    getAllDocuments(collections.suppliers),
                    // getAllDocuments(collections.purchaseOrders),
                    getAllDocuments(collections.wasteRecords),
                    getAllDocuments(collections.pccs),
                    getAllDocuments(collections.haccpLogs),
                    getAllDocuments(collections.haccpTasks),
                    getAllDocuments(collections.haccpTaskCompletions),
                    getAllDocuments(collections.outlets),
                ]);

                // Batch updates to store
                store.setIngredients(ingredientsData as Ingredient[]);
                store.setRecipes(recipesData as Recipe[]);
                store.setMenus(menusData as Menu[]);
                // store.setEvents(eventsData as Event[]);
                store.setStaff(staffData as Employee[]);
                store.setSuppliers(suppliersData as Supplier[]);
                // store.setPurchaseOrders(ordersData as PurchaseOrder[]);
                store.setWasteRecords(wasteData as WasteRecord[]);

                // HACCP
                store.setPCCs(pccsData as any[]);
                store.setHACCPLogs(haccpLogsData as any[]);
                store.setHACCPTasks(haccpTasksData as any[]);
                store.setHACCPTaskCompletions(haccpCompletionsData as any[]);

                // Outlets
                store.setOutlets(outletsData as any[]);

                // Schedule requires special handling (Month ID -> DailySchedule)
                scheduleData.forEach((doc: any) => {
                    store.updateSchedule(doc.id, doc as DailySchedule);
                });

                console.log("Firestore Sync Complete");

            } catch (error) {
                console.error("Error syncing with Firestore:", error);
            } finally {
                setLoading(false);
            }
        };

        syncData();
    }, []); // Run once on mount

    return { loading };
};
