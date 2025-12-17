import * as functions from "firebase-functions";
import { DocumentProcessorServiceClient } from "@google-cloud/documentai";

const client = new DocumentProcessorServiceClient();

interface InvoiceScannerData {
    gcsUri: string;
    fileType?: string;
}

interface DocumentEntity {
    type: string;
    mentionText?: string;
    normalizedValue?: {
        text?: string;
    };
    properties?: DocumentEntity[];
}

export const scanInvoice = functions.https.onCall(async (data: InvoiceScannerData, context: functions.https.CallableContext) => {
    // 1. Validation
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }

    const { gcsUri, fileType } = data;
    if (!gcsUri) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "The function must be called with a 'gcsUri' argument."
        );
    }

    // 2. Configuration (Environment Variables)
    const projectId = process.env.GCLOUD_PROJECT;
    const location = "eu"; // or us
    const processorId = process.env.DOCUMENT_AI_PROCESSOR_ID; // Must be set in config

    if (!projectId || !processorId) {
        throw new functions.https.HttpsError(
            "failed-precondition",
            "Server configuration missing PROJECT_ID or DOCUMENT_AI_PROCESSOR_ID."
        );
    }

    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

    // 3. Process Document
    const request = {
        name,
        gcsDocument: {
            gcsUri,
            mimeType: fileType || "application/pdf",
        },
    };

    try {
        const [result] = await client.processDocument(request);
        const { document } = result;

        // 4. Parse Entities
        const entities = (document?.entities || []) as DocumentEntity[];
        const items = entities.filter((e: DocumentEntity) => e.type === "line_item");

        const parsedItems = items.map((item: DocumentEntity) => {
            const description = item.properties?.find((p: DocumentEntity) => p.type === "line_item/description")?.mentionText || "";
            const quantity = item.properties?.find((p: DocumentEntity) => p.type === "line_item/quantity")?.mentionText || "1";
            const unitPrice = item.properties?.find((p: DocumentEntity) => p.type === "line_item/unit_price")?.mentionText || "0";

            return {
                description,
                quantity: parseFloat(quantity),
                unitPrice: parseFloat(unitPrice.replace(/[^\d.-]/g, ''))
            };
        });

        const totalAmount = entities.find((e: DocumentEntity) => e.type === "total_amount")?.mentionText || "0";
        const supplierName = entities.find((e: DocumentEntity) => e.type === "supplier_name")?.mentionText || "Unknown Supplier";
        const invoiceDate = entities.find((e: DocumentEntity) => e.type === "invoice_date")?.normalizedValue?.text || new Date().toISOString();

        return {
            supplierName,
            date: invoiceDate,
            totalCost: parseFloat(totalAmount.replace(/[^\d.-]/g, '')),
            items: parsedItems
        };

    } catch (error) {
        console.error("Document AI Error:", error);
        throw new functions.https.HttpsError(
            "internal",
            "Failed to process document.",
            error
        );
    }
});
