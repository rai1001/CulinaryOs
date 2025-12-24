import * as admin from "firebase-admin";

admin.initializeApp();

export { scanInvoice } from "./scanners/invoiceScanner";
export { searchRecipes } from "./search/recipeSearcher";
export { chatWithCopilot } from "./chat/kitchenCopilot";
export { predictDemand } from "./predictors/demandPredictor";
export { generateMenu } from "./generators/menuGenerator";
export { generatePurchaseOrder } from "./generators/orderGenerator";
export { enrichIngredient } from "./triggers/ingredientEnricher";
export { enrichIngredientCallable } from "./enrichers/ingredientEnricher";
export { embedRecipe } from "./triggers/recipeEmbedder";
export { monitorHACCP } from "./triggers/haccpMonitor";
export { calculateMenuEngineering } from "./scheduled/analyticsScheduler";
export { autoPurchaseScheduler } from "./scheduled/autoPurchaseScheduler";
export { sendPurchaseOrderEmail } from "./triggers/sendPurchaseOrderEmail";
export { createOrderNotification } from "./triggers/createOrderNotification";

// HACCP Reporting
import * as functions from "firebase-functions";
import { generateHACCPReport } from "./generators/haccpReportGenerator";

export const generateHACCPReportCallable = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { outletId, month, year } = data;
    return await generateHACCPReport(outletId, month, year, context.auth.uid);
});

export const scheduledHACCPReport = functions.pubsub.schedule("0 0 1 * *").onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();
    // Previous month
    let month = now.getMonth() - 1;
    let year = now.getFullYear();
    if (month < 0) {
        month = 11;
        year -= 1;
    }

    // Iterate all active outlets
    const outletsSnapshot = await db.collection('outlets').where('isActive', '==', true).get();
    for (const doc of outletsSnapshot.docs) {
        try {
            await generateHACCPReport(doc.id, month, year, 'system');
            console.log(`Generated HACCP Report for outlet ${doc.id}`);
        } catch (error) {
            console.error(`Failed to generate HACCP Report for outlet ${doc.id}`, error);
        }
    }
});
