import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { VertexAI } from "@google-cloud/vertexai";
import { generateEmbedding } from "../utils/ai";

export const chatWithCopilot = functions.https.onCall(async (data, context) => {
    const { message, history } = data;

    if (!message) {
        throw new functions.https.HttpsError("invalid-argument", "Message is required.");
    }

    const projectId = process.env.GCLOUD_PROJECT;
    if (!projectId) {
        throw new functions.https.HttpsError("internal", "GCLOUD_PROJECT not set.");
    }

    const vertexAI = new VertexAI({ project: projectId, location: "europe-west1" });
    const model = vertexAI.getGenerativeModel({ model: "gemini-pro" });

    // 1. Generate embedding for the user query
    const embedding = await generateEmbedding(message);

    let contextData = "";

    // 2. Vector Search (RAG) if we have an embedding
    if (embedding) {
        try {
            const db = admin.firestore();
            const collection = db.collection("recipes");

            // Find relevant recipes
            const vectorQuery = collection.findNearest({
                vectorField: "_embedding",
                queryVector: embedding,
                limit: 3, // Top 3 relevant recipes
                distanceMeasure: "COSINE"
            });

            const snapshot = await vectorQuery.get();
            const recipes = snapshot.docs.map(doc => {
                const data = doc.data();
                return `Recipe: ${data.name}. Station: ${data.station}. Ingredients: ${data.ingredients?.length || 0}.`;
            });

            if (recipes.length > 0) {
                contextData = `
Here is some relevant context from the kitchen database:
${recipes.join('\n')}
                `;
            }
        } catch (error) {
            console.warn("RAG Search failed, proceeding without context.", error);
        }
    }

    // 3. Construct System Prompt
    const systemPrompt = `
You are the Kitchen Copilot, an AI assistant for a professional kitchen.
You are helpful, concise, and focused on culinary operations (recipes, inventory, safety).
Use the provided context to answer questions if relevant.
If the context doesn't answer the question, use your general knowledge but mention that it's a general suggestion.

Context:
${contextData}

Current Conversation:
`;

    // 4. Build chat history for Gemini
    // Type definitions for Vertex AI SDK's Content object are slightly complex, simplified here
    const chatHistory = history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
        history: chatHistory,
        generationConfig: {
            maxOutputTokens: 500,
        },
    });

    try {
        const result = await chat.sendMessage(`${systemPrompt}\nUser: ${message}`);
        const response = result.response.candidates?.[0].content.parts[0].text;

        return { response };
    } catch (error) {
        console.error("Chat Error:", error);
        throw new functions.https.HttpsError("internal", "Failed to generate response.", error);
    }
});
