import * as admin from "firebase-admin";

admin.initializeApp();

export { scanInvoice } from "./scanners/invoiceScanner";
export { searchRecipes } from "./search/recipeSearcher";
export { chatWithCopilot } from "./chat/kitchenCopilot";
export { predictDemand } from "./predictors/demandPredictor";
export { generateMenu } from "./generators/menuGenerator";
export { enrichIngredient } from "./triggers/ingredientEnricher";
export { enrichIngredientCallable } from "./enrichers/ingredientEnricher";
export { embedRecipe } from "./triggers/recipeEmbedder";
export { monitorHACCP } from "./triggers/haccpMonitor";

