import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

interface AutoPurchaseSettings {
    enabled: boolean;
    runFrequency: 'DAILY' | 'WEEKLY';
    runDay?: number; // 0=Sunday, 1=Monday...
    runTime?: string; // "HH:MM" 24h format
    generateDraftsOnly: boolean;
}

interface Ingredient {
    id: string;
    stock?: number;
    optimalStock?: number;
    reorderPoint?: number;
    supplierId?: string;
    unit: string;
    costPerUnit: number;
    name: string;
}

// Helper to check if we should run now
const shouldRunNow = (settings: AutoPurchaseSettings): boolean => {
    if (!settings.enabled) return false;

    const now = new Date();
    // Adjust to outlet timezone? For now assume UTC or server time, ideally store timezone in outlet settings
    // This is a simplified check. In production, we'd check if "current time" matches "runTime" within the hour.

    // Check Day
    if (settings.runFrequency === 'WEEKLY') {
        const currentDay = now.getDay(); // 0-6
        if (settings.runDay !== undefined && settings.runDay !== currentDay) {
            return false;
        }
    }

    // Check Time (Hourly granularity)
    if (settings.runTime) {
        const [targetHour] = settings.runTime.split(':').map(Number);
        const currentHour = now.getHours();
        if (currentHour !== targetHour) return false;
    }

    return true;
};

export const autoPurchaseScheduler = onSchedule("every 1 hours", async (event) => {
    const db = admin.firestore();
    console.log("Starting Auto Purchase Scheduler...");

    try {
        const outletsSnap = await db.collection('outlets').get();

        for (const outletDoc of outletsSnap.docs) {
            const outletId = outletDoc.id;
            const outletData = outletDoc.data();
            const settings = outletData.autoPurchaseSettings as AutoPurchaseSettings | undefined;

            if (!settings || !shouldRunNow(settings)) {
                continue;
            }

            console.log(`Processing Auto Purchase for Outlet: ${outletId}`);

            // 1. Fetch Ingredients
            const itemsSnap = await db.collection('ingredients')
                .where('outletId', '==', outletId)
                .get();

            const ingredients = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Ingredient));

            // 2. Identify Needs (Reorder Point Logic)
            const needs = ingredients.filter(ing => {
                const current = ing.stock || 0;
                // If reorderPoint not set, default to 20% of optimal, or 0 if optimal not set
                const optimal = ing.optimalStock || 0;
                const reorder = ing.reorderPoint ?? (optimal * 0.2);

                return optimal > 0 && current <= reorder;
            }).map(ing => ({
                ingredient: ing,
                quantity: (ing.optimalStock || 0) - (ing.stock || 0)
            }));

            if (needs.length === 0) continue;

            // 3. Group by Supplier
            const bySupplier: Record<string, typeof needs> = {};
            needs.forEach(item => {
                const supId = item.ingredient.supplierId || 'SIN_ASIGNAR';
                if (!bySupplier[supId]) bySupplier[supId] = [];
                bySupplier[supId].push(item);
            });

            // 4. Create Purchase Orders
            const batch = db.batch();
            let ordersCreated = 0;

            for (const [supplierId, items] of Object.entries(bySupplier)) {
                if (supplierId === 'SIN_ASIGNAR') continue; // Skip items without supplier for automation

                const ref = db.collection('purchaseOrders').doc();
                const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.ingredient.costPerUnit), 0);

                batch.set(ref, {
                    id: ref.id,
                    supplierId,
                    outletId,
                    date: new Date().toISOString(),
                    status: 'DRAFT', // Always DRAFT for now
                    type: 'AUTOMATIC',
                    generatedAt: new Date().toISOString(),
                    items: items.map(i => ({
                        ingredientId: i.ingredient.id,
                        quantity: i.quantity,
                        unit: i.ingredient.unit,
                        costPerUnit: i.ingredient.costPerUnit,
                        name: i.ingredient.name
                    })),
                    totalCost,
                    notes: 'Generado automáticamente por planificador'
                });
                ordersCreated++;
            }

            if (ordersCreated > 0) {
                await batch.commit();
                console.log(`Generated ${ordersCreated} orders for outlet ${outletId}`);
            }
        }

    } catch (error) {
        console.error("Error in Auto Purchase Scheduler:", error);
    }
});
