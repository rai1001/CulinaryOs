import { getAI, getGenerativeModel } from "firebase/ai";
import firebaseApp from "../firebase/config";

// Initialize Vertex AI
// Ensure firebaseApp is initialized. If running locally without full emulator setup, this might fail if not configured.
// But we assume the client setup in firebase/config.ts is correct for 'getAI'.
const vertexAI = getAI(firebaseApp);

// Initialize the generative model with a model that supports multimodal input
const model = getGenerativeModel(vertexAI, { model: "gemini-2.0-flash" });

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

/**
 * Scan an Ingredient Label for allergens and nutrition
 */
export async function scanIngredientLabel(base64Data: string): Promise<AIAnalysisResult> {
    const prompt = `
        Analiza esta etiqueta de producto alimenticio. Extrae en JSON:
        {
            "name": "Nombre del producto",
            "brand": "Marca (si visible)",
            "allergens": ["Lista", "de", "alergenos", "detectados"],
            "nutrition": {
                "calories": 0 (kcal/100g),
                "protein": 0,
                "carbs": 0,
                "fat": 0
            }
        }
    `;
    return analyzeImage(base64Data, prompt);
}

/**
 * Scan a Recipe Card (Handwritten or Printed)
 */
export async function scanRecipeFromImage(base64Data: string): Promise<AIAnalysisResult> {
    const prompt = `
        Analiza esta receta (foto o texto). Extrae en JSON:
        {
            "name": "Nombre Receta",
            "servings": Number (personas),
            "prepTime": Number (minutos),
            "ingredients": [
                { "name": "Ingrediente", "quantity": Number, "unit": "kg/g/l/unit" }
            ],
            "steps": ["Paso 1", "Paso 2"]
        }
        Normaliza las unidades a sistema métrico si es posible.
    `;
    return analyzeImage(base64Data, prompt);
}

/**
 * Scan a Physical Menu to digitalize it
 */
export async function scanMenuImage(base64Data: string): Promise<AIAnalysisResult> {
    const prompt = `
        Digitaliza esta carta/menú. Extrae en JSON:
        {
            "name": "Nombre del Menú (ej. Carta Verano)",
            "sections": [
                {
                    "name": "Entrantes/Principales...",
                    "items": [
                        { "name": "Plato", "description": "Desc", "price": 0.00, "allergens": [] }
                    ]
                }
            ]
        }
    `;
    return analyzeImage(base64Data, prompt);
}

/**
 * Scan an Event Order (BEO)
 */
export async function scanEventOrder(base64Data: string): Promise<AIAnalysisResult> {
    const prompt = `
        Analiza esta Hoja de Orden de Evento (BEO). Extrae en JSON:
        {
            "eventName": "Nombre Evento",
            "date": "YYYY-MM-DD",
            "time": "HH:MM",
            "pax": Number,
            "location": "Salón/Ubicación",
            "menu": {
                "name": "Nombre Menú",
                "items": ["Plato 1", "Plato 2"]
            },
            "schedule": [
                { "time": "HH:MM", "activity": "Cóctel/Cena/Barra Libre" }
            ],
            "notes": "Notas especiales (dietas, montaje...)"
        }
    `;
    return analyzeImage(base64Data, prompt);
}

/**
 * Scan a Handwritten Inventory Count Sheet
 */
export async function scanInventorySheet(base64Data: string): Promise<AIAnalysisResult> {
    const prompt = `
        Analiza esta hoja de recuento de inventario manuscrita. Extrae en JSON:
        {
            "date": "YYYY-MM-DD",
            "items": [
                { "name": "Nombre Producto", "quantity": Number, "unit": "kg/l/u" }
            ]
        }
        Trata de interpretar la caligrafía lo mejor posible.
    `;
    return analyzeImage(base64Data, prompt);
}

/**
 * Scan a Handwritten HACCP Log (Temperatures/Cleaning)
 */
export async function scanHACCPLog(base64Data: string): Promise<AIAnalysisResult> {
    const prompt = `
        Analiza esta hoja de registro de HACCP/Temperaturas. Extrae en JSON:
        {
            "date": "YYYY-MM-DD",
            "entries": [
                {
                    "pccName": "Nombre del equipo/cámara",
                    "value": Number (temperatura),
                    "time": "HH:MM",
                    "status": "CORRECT/WARNING/CRITICAL"
                }
            ]
        }
        Intenta mapear los nombres de equipos a PCCs genéricos si es posible.
    `;
    return analyzeImage(base64Data, prompt);
}
