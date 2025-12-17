import { getAI, getGenerativeModel } from "firebase/ai";
import firebaseApp from "../firebase/config";

// Initialize Vertex AI
const vertexAI = getAI(firebaseApp);

// Initialize the generative model with a model that supports multimodal input
const model = getGenerativeModel(vertexAI, { model: "gemini-1.5-flash" });

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
        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: "image/jpeg" // Assuming JPEG, but could be dynamic
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
