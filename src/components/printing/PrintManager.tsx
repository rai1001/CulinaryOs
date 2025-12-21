import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LabelData } from './PrintService';
import { PRINT_EVENT } from './PrintService';
import { LabelTemplate } from './LabelTemplate';

export const PrintManager: React.FC = () => {
    const [printJob, setPrintJob] = useState<LabelData | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        const handlePrint = (e: Event) => {
            const customEvent = e as CustomEvent<LabelData>;
            setPrintJob(customEvent.detail);
            setIsPrinting(true);
        };

        window.addEventListener(PRINT_EVENT, handlePrint);
        return () => window.removeEventListener(PRINT_EVENT, handlePrint);
    }, []);

    useEffect(() => {
        if (isPrinting && printJob) {
            // Small timeout to ensure render
            setTimeout(() => {
                window.print();
                // Reset after print dialog closes (or reasonably assumes so)
                // Note: window.print() is blocking in many browsers, but not all.
                // We'll reset immediately after the call returns.
                setIsPrinting(false);
                setPrintJob(null);
            }, 100);
        }
    }, [isPrinting, printJob]);

    if (!isPrinting || !printJob) return null;

    return createPortal(
        <div className="print-portal fixed inset-0 z-[9999] bg-white flex items-center justify-center print:block print:static print:h-auto print:w-auto">
            <div className="screen-preview p-4 bg-gray-100 border rounded shadow-lg m-4 print:hidden">
                <p className="mb-2 font-bold">Generating Label...</p>
                <div className="border border-black bg-white" style={{ width: '50mm', height: '30mm' }}>
                    <LabelTemplate data={printJob} />
                </div>
            </div>

            {/* This part is what gets printed */}
            <div className="hidden print:block">
                <LabelTemplate data={printJob} />
            </div>
        </div>,
        document.body
    );
};
