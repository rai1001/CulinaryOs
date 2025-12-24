import jsPDF from 'jspdf';
import QRCode from 'qrcode'; // Requires 'npm install qrcode @types/qrcode'
import { format } from 'date-fns';

export interface LabelData {
    title: string;
    type: string;
    productionDate: string; // YYYY-MM-DD
    expiryDate: string; // YYYY-MM-DD
    batchNumber: string;
    quantity: string;
    user: string; // Chef/User name
    allergens?: string[];
}

export const generateLabelPDF = async (data: LabelData): Promise<Blob> => {
    // 1. Setup Document (50x30mm Standard Thermal Label)
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [50, 30]
    });

    // Typography
    doc.setFont("helvetica", "bold");

    // --- Header (Type) --- 
    // Colors mapped to types (though thermal is usually B&W)
    let typeColor = [0, 0, 0]; // Default Black
    /*
    if (data.type === 'congelado') typeColor = [0, 136, 254]; // Blue
    if (data.type === 'fresco') typeColor = [0, 196, 159]; // Green
    if (data.type === 'pasteurizado') typeColor = [255, 187, 40]; // Amber
    if (data.type === 'elaborado') typeColor = [136, 132, 216]; // Purple
    if (data.type === 'abatido') typeColor = [6, 182, 212]; // Cyan
    */
    // For thermal printers, use distinct styles or black. Let's assume B&W for robustness.

    // Header Box
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(0, 5, 50, 5); // Divider

    doc.setFontSize(8);
    doc.text(data.type.toUpperCase(), 25, 3.5, { align: 'center' });

    // --- Product Name ---
    doc.setFontSize(10);
    const titleLines = doc.splitTextToSize(data.title.toUpperCase(), 48);
    // Limit to 2 lines
    const safeTitle = titleLines.length > 2 ? [titleLines[0], titleLines[1].replace(/.$/, '...')] : titleLines;
    doc.text(safeTitle, 25, 9, { align: 'center', baseline: 'top' });

    // --- Grid Dates ---
    doc.setFontSize(6);

    // Prep Date
    doc.text("ELAB:", 2, 19);
    doc.text(format(new Date(data.productionDate), 'dd/MM/yy'), 12, 19);

    // Exp Date (Highlight)
    doc.text("EXP:", 2, 22.5);
    doc.setFont("helvetica", "bold");
    doc.text(format(new Date(data.expiryDate), 'dd/MM/yy'), 12, 22.5);

    // --- Meta Info ---
    doc.setFontSize(5);
    doc.text(`LOTE: ${data.batchNumber.slice(-6)}`, 2, 26);
    doc.text(`CANT: ${data.quantity}`, 2, 28.5);

    // --- QR Code ---
    // Generate QR Data URL
    const qrData = JSON.stringify({
        id: data.batchNumber,
        n: data.title,
        e: data.expiryDate
    });

    try {
        const qrUrl = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'L',
            margin: 0,
            width: 50
        });

        // Add QR to PDF (Right side)
        // x=32, y=17, w=16, h=16
        doc.addImage(qrUrl, 'PNG', 32, 16, 12, 12);

    } catch (err) {
        console.error("QR Gen Error", err);
        doc.text("[QR ERROR]", 35, 20);
    }

    // --- Footer ---
    doc.setFontSize(4);
    doc.text(`CHEF: ${data.user.slice(0, 10).toUpperCase()}`, 25, 29, { align: 'center' });

    return doc.output('blob');
};

export const printBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = url;
    document.body.appendChild(iframe);

    iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
        }, 1000);
    };
};
