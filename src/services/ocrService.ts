import { createWorker, type Worker } from 'tesseract.js';
import { SCANNER } from '../constants/scanner';

let ocrWorker: Worker | null = null;

/**
 * Initialize Tesseract OCR worker
 */
async function initializeOCR(): Promise<Worker> {
    if (ocrWorker) return ocrWorker;

    const worker = await createWorker(SCANNER.OCR.LANGUAGE);
    await worker.setParameters({
        tessedit_char_whitelist: '0123456789/-. ',
        tessedit_pageseg_mode: '6', // Assume a single uniform block of text
    });

    ocrWorker = worker;
    return worker;
}

/**
 * Preprocess image for better OCR results
 */
function preprocessImage(imageData: ImageData): ImageData {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return imageData;

    // Scale up image
    canvas.width = imageData.width * SCANNER.OCR.IMAGE_SCALE;
    canvas.height = imageData.height * SCANNER.OCR.IMAGE_SCALE;

    // Create temporary canvas to draw original image
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) return imageData;

    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    tempCtx.putImageData(imageData, 0, 0);

    // Draw scaled image
    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);

    // Convert to grayscale and increase contrast
    const scaledImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = scaledImageData.data;

    for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

        // Increase contrast (simple threshold)
        const threshold = 128;
        const value = gray > threshold ? 255 : 0;

        data[i] = value;     // Red
        data[i + 1] = value; // Green
        data[i + 2] = value; // Blue
    }

    return scaledImageData;
}

/**
 * Parse date from OCR text
 */
function parseDate(text: string): Date | null {
    // Clean up the text
    const cleaned = text.trim().replace(/[^\d\/\-\.\s]/g, '');

    // Try each date pattern
    for (const pattern of SCANNER.OCR.DATE_PATTERNS) {
        const match = cleaned.match(pattern);
        if (match) {
            let day: number, month: number, year: number;

            // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY format
            if (pattern.source.startsWith('(\\d{2})')) {
                day = parseInt(match[1], 10);
                month = parseInt(match[2], 10);
                year = parseInt(match[3], 10);

                // Handle 2-digit year
                if (year < 100) {
                    year += year < 50 ? 2000 : 1900;
                }
            }
            // YYYY/MM/DD format
            else if (pattern.source.startsWith('(\\d{4})')) {
                year = parseInt(match[1], 10);
                month = parseInt(match[2], 10);
                day = parseInt(match[3], 10);
            } else {
                continue;
            }

            // Validate date components
            if (month < 1 || month > 12) continue;
            if (day < 1 || day > 31) continue;
            if (year < 2024 || year > 2050) continue;

            const date = new Date(year, month - 1, day);

            // Validate that date is valid and in the future
            if (isNaN(date.getTime())) continue;
            if (date < new Date()) continue; // Expiry date should be in the future

            return date;
        }
    }

    return null;
}

export interface OCRResult {
    success: boolean;
    text: string;
    confidence: number;
    date: Date | null;
}

/**
 * Scan expiration date from image using OCR
 * @param imageElement - Image element or canvas containing the date
 * @returns OCR result with parsed date
 */
export async function scanExpirationDate(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<OCRResult> {
    try {
        // Get image data
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return {
                success: false,
                text: '',
                confidence: 0,
                date: null,
            };
        }

        canvas.width = imageElement.width;
        canvas.height = imageElement.height;
        ctx.drawImage(imageElement, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Preprocess image
        const processedImageData = preprocessImage(imageData);

        // Put processed image back on canvas
        const processedCanvas = document.createElement('canvas');
        const processedCtx = processedCanvas.getContext('2d');

        if (!processedCtx) {
            return {
                success: false,
                text: '',
                confidence: 0,
                date: null,
            };
        }

        processedCanvas.width = processedImageData.width;
        processedCanvas.height = processedImageData.height;
        processedCtx.putImageData(processedImageData, 0, 0);

        // Initialize OCR worker
        const worker = await initializeOCR();

        // Perform OCR
        const { data } = await worker.recognize(processedCanvas);

        const confidence = data.confidence;
        const text = data.text;

        // Try to parse date
        const date = parseDate(text);

        return {
            success: confidence >= SCANNER.OCR.CONFIDENCE_THRESHOLD && date !== null,
            text: text.trim(),
            confidence,
            date,
        };
    } catch (error) {
        console.error('OCR error:', error);
        return {
            success: false,
            text: '',
            confidence: 0,
            date: null,
        };
    }
}

/**
 * Cleanup OCR worker
 */
export async function cleanupOCR(): Promise<void> {
    if (ocrWorker) {
        await ocrWorker.terminate();
        ocrWorker = null;
    }
}
