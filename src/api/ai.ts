import { getFunctions, httpsCallable } from "firebase/functions";
import { firebaseApp } from "../firebase/config";

const functions = getFunctions(firebaseApp, "europe-west1"); // Matching backend region

export const scanInvoice = httpsCallable(functions, 'scanInvoice');
export const predictDemand = httpsCallable(functions, 'predictDemand');
export const generateMenu = httpsCallable(functions, 'generateMenu');
export const enrichIngredientCallable = httpsCallable(functions, 'enrichIngredientCallable');
export const searchRecipes = httpsCallable(functions, 'searchRecipes');
export const chatWithCopilot = httpsCallable(functions, 'chatWithCopilot');

// Note: enrichIngredient, embedRecipe, monitorHACCP are background triggers, not callable directly from frontend.
