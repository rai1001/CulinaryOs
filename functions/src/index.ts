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
export { generateMonthlyHACCPReport } from "./scheduled/haccpScheduler";

// New KPI Triggers
export { onInventoryUpdate } from "./triggers/inventoryTriggers";
export { onPurchaseOrderUpdate } from "./triggers/orderTriggers";
export { onWasteRecordCreate } from "./triggers/wasteTriggers";
