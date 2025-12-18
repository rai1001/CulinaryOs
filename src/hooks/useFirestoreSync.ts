import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { collections } from '../firebase/collections';
import { getAllDocuments, addDocument } from '../services/firestoreService';
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

                // 1. Fetch & Setup Outlets First (Critical)
                try {
                    console.log("Fetching outlets...");
                    let outletsData = await getAllDocuments(collections.outlets);

                    if (outletsData.length === 0) {
                        console.log("No outlets found. Seeding default 'Atlantico'...");
                        const defaultOutlet = {
                            name: 'Atlantico',
                            type: 'main_kitchen',
                            isActive: true
                        };
                        try {
                            const newId = await addDocument(collections.outlets, defaultOutlet);
                            outletsData = [{ ...defaultOutlet, id: newId }];
                        } catch (err) {
                            console.error("Failed to seed default outlet:", err);
                            // Fallback to local-only so UI works even if write fails
                            outletsData = [{ ...defaultOutlet, id: 'temp-default' }];
                        }
                    }
                    store.setOutlets(outletsData as any[]);

                    if (outletsData.length > 0 && !store.activeOutletId) {
                        store.setActiveOutletId(outletsData[0].id);
                    }
                } catch (error: any) {
                    console.error("Error fetching outlets:", error);
                    alert("Error cargando cocinas: " + error.message);
                }

                // 2. Fetch Rest of Data
                const [
                    ingredientsData,
                    recipesData,
                    menusData,
                    // eventsData,
                    staffData,
                    scheduleData,
                    suppliersData,
                    // ordersData,
                    wasteData,
                    pccsData,
                    haccpLogsData,
                    haccpTasksData,
                    haccpCompletionsData,
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
                ]);

                // Batch updates to store (if successful)
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

                // Outlets handled separately above

                // Schedule requires special handling (Month ID -> DailySchedule)
                scheduleData.forEach((doc: any) => {
                    store.updateSchedule(doc.id, doc as DailySchedule);
                });

                console.log("Firestore Sync Complete");

            } catch (error: any) {
                console.error("Error syncing with Firestore:", error);
                alert("Error de sincronización: " + error.message);
            } finally {
                setLoading(false);
            }
        };

        syncData();
    }, [useStore((state) => state.activeOutletId)]); // Re-sync when outlet changes

    return { loading };
};
