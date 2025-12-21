import { getAI, getGenerativeModel } from "firebase/ai";
import firebaseApp from "../firebase/config";

// Initialize Vertex AI
// Ensure firebaseApp is initialized. If running locally without full emulator setup, this might fail if not configured.
// But we assume the client setup in firebase/config.ts is correct for 'getAI'.
const vertexAI = getAI(firebaseApp);

// Initialize the generative model with a model that supports multimodal input
const model = getGenerativeModel(vertexAI, { model: "gemini-1.5-flash-002" });

export interface AIAnalysisResult {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * Analyze an image using Gemini Flash Multimodal
 * @param imageBase64 Base64 string of the image (without data:image/jpeg;base64, prefix if possible, but SDK handles it)
 * @param prompt Text prompt for the AI
 * @returns Parsed JSON result or error
 */
export async function analyzeImage(imageBase64: string, prompt: string): Promise<AIAnalysisResult> {
    try {
        // Convert base64 to Part object
        // Note: The SDK expects the base64 string directly.
        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: "image/jpeg" // Assuming JPEG for simplicity
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Try to parse JSON from the response
        try {
            // Find JSON block if wrapped in markdown
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
            const data = JSON.parse(jsonStr);
            return { success: true, data };
        } catch (parseError) {
            console.warn("AI Response was not valid JSON:", text);
            return { success: true, data: { rawText: text } }; // Return raw text if JSON parse fails
        }

    } catch (error: any) {
        console.error("Gemini Analysis Error:", error);
        return { success: false, error: error.message || "Unknown error during AI analysis" };
    }
}

export async function generateContent(prompt: string): Promise<string> {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error("Gemini Generation Error:", error);
        throw error;
    }
}

// --- Specialized AI Functions (Client-Side) ---

/**
 * Generate a menu based on criteria
 */
export async function generateMenuFromCriteria(criteria: {
    eventType: string;
    pax: number;
    season: string;
    restrictions: string[];
}): Promise<AIAnalysisResult> {
    const prompt = `
        Act as a professional Chef. Design a menu for a "${criteria.eventType}" event for ${criteria.pax} people.
        Season: ${criteria.season}.
        Dietary Restrictions: ${criteria.restrictions.join(', ') || 'None'}.

        Return ONLY a JSON object with this structure:
        {
            "name": "Creative Menu Name",
            "description": "Brief description of the concept",
            "dishes": [
                {
                    "category": "Starter/Main/Dessert",
                    "name": "Dish Name",
                    "description": "Appetizing description",
                    "allergens": ["Gluten", "Dairy", etc]
                }
            ],
            "estimatedCost": 0.00,
            "sellPrice": 0.00
        }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
        const data = JSON.parse(jsonStr);
        return { success: true, data };
    } catch (error: any) {
        console.error("Menu Generation Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Analyze an invoice image calling analyzeImage with a specific prompt
 */
export async function scanInvoiceImage(base64Data: string): Promise<AIAnalysisResult> {
    const prompt = `
        Analiza esta factura de restaurante/proveedor. Extrae los datos en JSON:
        {
            "supplierName": "String",
            "date": "YYYY-MM-DD",
            "totalCost": Number,
            "items": [
                { "description": "String", "quantity": Number, "unitPrice": Number, "total": Number }
            ]
        }
        Si no es legible, devuelve null en los campos.
    `;
    return analyzeImage(base64Data, prompt);
}
