import * as functions from "firebase-functions";
import { VertexAI } from "@google-cloud/vertexai";

interface DemandPredictionData {
    events: any[]; // Ideally typed with your Event interface
    currentStock: any[];
}

export const predictDemand = functions.https.onCall(async (data: DemandPredictionData, context: functions.https.CallableContext) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Must be authenticated.");
    }

    const projectId = process.env.GCLOUD_PROJECT;
    if (!projectId) {
        throw new functions.https.HttpsError("failed-precondition", "Missing PROJECT_ID.");
    }

    const vertexAI = new VertexAI({ project: projectId, location: "europe-west1" });
    const model = vertexAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
    Analyze the following upcoming events and current stock levels.
    Predict which ingredients will run out and suggest a purchase order.
    
    Upcoming Events:
    ${JSON.stringify(data.events)}
    
    Current Stock:
    ${JSON.stringify(data.currentStock)}
    
    Return a valid JSON object with a list of suggested items to buy, including reason.
    Format: { "suggestions": [{ "ingredientName": string, "quantity": number, "unit": string, "reason": string }] }
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.candidates?.[0].content.parts[0].text;

        if (!text) throw new Error("No response from AI");

        // Clean markdown code blocks if present
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("Vertex AI Error:", error);
        throw new functions.https.HttpsError("internal", "Prediction failed", error);
    }
});
