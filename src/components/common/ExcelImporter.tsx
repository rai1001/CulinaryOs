import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Loader2, FileSpreadsheet } from 'lucide-react';

interface ExcelImporterProps {
    onImport: (data: any[]) => Promise<void>;
    buttonLabel?: string;
    template?: { [key: string]: string }; // Optional: Show expected columns
    className?: string;
}

export const ExcelImporter: React.FC<ExcelImporterProps> = ({
    onImport,
    buttonLabel = "Importar Excel",
    template,
    className
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const data = await parseExcel(file);
            await onImport(data);
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            console.error("Import failed:", error);
            alert("Error importing file. Please check the format.");
        } finally {
            setIsLoading(false);
        }
    };

    const parseExcel = (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet);
                    resolve(jsonData);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = (err) => reject(err);
            reader.readAsBinaryString(file);
        });
    };

    return (
        <div className={className}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                className="hidden"
            />
            <button
                onClick={handleButtonClick}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                title={template ? `Columnas esperadas: ${Object.values(template).join(', ')}` : "Importar datos desde Excel"}
            >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <FileSpreadsheet size={20} />}
                <span>{isLoading ? "Importando..." : buttonLabel}</span>
            </button>
        </div>
    );
};
