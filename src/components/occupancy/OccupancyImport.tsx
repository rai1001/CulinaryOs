import React, { useState } from 'react';
import { ExcelImporter } from '../common/ExcelImporter';

import { parseOccupancyImport, saveOccupancyData } from '../../services/occupancyService';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface OccupancyImportProps {
    onSuccess?: () => void;
}

export const OccupancyImport: React.FC<OccupancyImportProps> = ({ onSuccess }) => {
    const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [importedCount, setImportedCount] = useState(0);

    const handleImport = async (data: any[]) => {
        try {
            const parsed = parseOccupancyImport(data);
            if (parsed.length === 0) {
                throw new Error('No valid occupancy data found');
            }
            await saveOccupancyData(parsed);
            setImportedCount(parsed.length);
            setImportStatus('success');
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error(err);
            setImportStatus('error');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Importar Ocupación</h3>

            <div className="space-y-4">
                <p className="text-sm text-slate-600">
                    Sube un archivo Excel con las columnas: Fecha, Desayunos, Comidas, Cenas (o columna PAX genérica).
                </p>

                <ExcelImporter
                    onImport={handleImport}
                    buttonLabel="Subir Excel Ocupación"
                    template={{ date: 'Fecha', breakfast: 'Desayunos', lunch: 'Comidas', dinner: 'Cenas' }}
                />

                {importStatus === 'success' && (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-lg">
                        <CheckCircle size={20} />
                        <span>Se importaron {importedCount} registros correctamente.</span>
                    </div>
                )}

                {importStatus === 'error' && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                        <AlertCircle size={20} />
                        <span>Error al importar. Verifica el formato del archivo.</span>
                    </div>
                )}
            </div>
        </div>
    );
};
