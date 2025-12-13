import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, X, Check, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { format, parse, isValid } from 'date-fns';
import type { EventType } from '../types';

interface ParsedEvent {
    name: string;
    date: string;
    pax: number;
    menuNotes: string;
    type: EventType;
}

interface EventImportModalProps {
    onClose: () => void;
    onSave: () => void;
}

export const EventImportModal: React.FC<EventImportModalProps> = ({ onClose, onSave }) => {
    const { events, setEvents } = useStore(); // Fallback if addEvent doesn't exist yet
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [parsing, setParsing] = useState(false);
    const [parsedData, setParsedData] = useState<ParsedEvent | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            parseExcel(selectedFile);
        }
    };

    const parseExcel = async (file: File) => {
        setParsing(true);
        setError(null);
        setParsedData(null);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Convert to 2D array for easier searching
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

            const extracted = extractData(jsonData, file.name);
            setParsedData(extracted);
        } catch (err) {
            console.error(err);
            setError('Error al leer el archivo. Asegúrate de que es un Excel válido.');
        } finally {
            setParsing(false);
        }
    };

    const extractData = (data: any[][], filename: string): ParsedEvent => {
        let name = filename.replace(/\.xlsx?$/, '');
        let date = format(new Date(), 'yyyy-MM-dd');
        let pax = 0;
        let menuNotes = '';
        let type: EventType = 'Comida'; // Default

        // Heuristics
        for (let r = 0; r < data.length; r++) {
            const row = data[r];
            for (let c = 0; c < row.length; c++) {
                const cell = String(row[c]).toLowerCase().trim();

                // Name / Evento
                if (cell.includes('evento') && !name.includes('Navidad')) { // Prioritize internal name if found
                    // Often the cell to the right or below has the value
                    if (row[c + 1]) name = String(row[c + 1]);
                    else if (data[r + 1] && data[r + 1][c]) name = String(data[r + 1][c]);
                }

                // Date / Fecha
                if (cell === ('fecha')) {
                    // Try right
                    let dateRaw = row[c + 1];
                    // Try below if right is empty
                    if (!dateRaw && data[r + 1]) dateRaw = data[r + 1][c];

                    if (dateRaw) {
                        // Excel serial date?
                        if (typeof dateRaw === 'number') {
                            const dateObj = new Date(Math.round((dateRaw - 25569) * 86400 * 1000));
                            if (isValid(dateObj)) date = format(dateObj, 'yyyy-MM-dd');
                        } else {
                            // String DD/MM/YYYY
                            const parsed = parse(String(dateRaw).trim(), 'dd/MM/yyyy', new Date());
                            if (isValid(parsed)) date = format(parsed, 'yyyy-MM-dd');
                        }
                    }
                }

                // PAX / Personas
                if (cell === 'pax' || cell === 'no pax' || cell === 'personas' || cell.includes('nº pax')) {
                    let paxRaw = row[c + 1]; // Right
                    if (!paxRaw && data[r + 1]) paxRaw = data[r + 1][c]; // Below

                    if (paxRaw && !isNaN(Number(paxRaw))) {
                        pax = Number(paxRaw);
                    }
                }

                // Menu content
                // Strategy: Look for "Alimentos y bebidas" header, then read until "Bodega" or "Observaciones"
                if (cell.includes('alimentos y bebidas')) {
                    let currentRow = r + 1;
                    while (currentRow < data.length) {
                        const nextRow = data[currentRow];
                        const firstCell = String(nextRow[0] || '').toLowerCase();

                        // Stop conditions
                        if (firstCell.includes('bodega') || firstCell.includes('observaciones') || firstCell.includes('horarios')) {
                            break;
                        }

                        // Append non-empty cells
                        const line = nextRow.filter(x => x).join(' ');
                        if (line.trim()) {
                            menuNotes += line + '\n';
                        }
                        currentRow++;
                    }
                }
            }
        }

        // Determine type based on keywords
        const lowerName = name.toLowerCase();
        if (lowerName.includes('boda')) type = 'Boda';
        else if (lowerName.includes('comida')) type = 'Comida';
        else if (lowerName.includes('cena')) type = 'Cena';
        else if (lowerName.includes('coctel') || lowerName.includes('cóctel')) type = 'Coctel';
        else if (lowerName.includes('desayuno') || lowerName.includes('coffee')) type = 'Coffee Break';

        return { name, date, pax, menuNotes, type };
    };

    const handleSave = () => {
        if (!parsedData) return;

        const newEvent = {
            id: crypto.randomUUID(),
            name: parsedData.name,
            date: parsedData.date,
            pax: parsedData.pax,
            type: parsedData.type,
            notes: parsedData.menuNotes,
            status: 'confirmed',
            menuId: undefined // Imported events don't link to structural menus yet
        };

        // Handle verify addEvent exists in store, else manually append
        // Using direct array manipulation for safety if addEvent missing in viewed files
        const newEvents = [...events, newEvent];
        setEvents(newEvents);

        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-surface border border-white/10 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileSpreadsheet className="text-emerald-400" />
                        Importar Hoja de Servicio
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {!parsedData ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed border-white/10 rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 hover:border-primary/50 transition-all ${parsing ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept=".xlsx, .xls"
                            />

                            {parsing ? (
                                <>
                                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                                    <p className="text-lg font-medium text-white">Analizando archivo...</p>
                                    <p className="text-sm text-slate-400 mt-2">Buscando fechas, comensales y menús</p>
                                </>
                            ) : error ? (
                                <>
                                    <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
                                    <p className="text-lg font-medium text-red-400">{error}</p>
                                    <p className="text-sm text-slate-400 mt-2">Click para intentar de nuevo</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-10 h-10 text-slate-400 mb-4" />
                                    <p className="text-lg font-medium text-white">Click para subir Excel</p>
                                    <p className="text-sm text-slate-400 mt-2">Soporta .xlsx y .xls (Hojas de Servicio)</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 p-3 rounded-lg border border-emerald-400/20 text-sm">
                                <Check className="w-4 h-4" />
                                <span>Datos extraídos correctamente. Por favor verifica antes de guardar.</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 uppercase font-bold">Nombre del Evento</label>
                                    <input
                                        type="text"
                                        value={parsedData.name}
                                        onChange={e => setParsedData({ ...parsedData, name: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white focus:border-primary"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 uppercase font-bold">Tipo</label>
                                    <select
                                        value={parsedData.type}
                                        onChange={e => setParsedData({ ...parsedData, type: e.target.value as EventType })}
                                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white focus:border-primary"
                                    >
                                        <option value="Comida">Comida</option>
                                        <option value="Cena">Cena</option>
                                        <option value="Boda">Boda</option>
                                        <option value="Coctel">Coctel</option>
                                        <option value="Coffee Break">Coffee Break</option>
                                        <option value="Empresa">Empresa</option>
                                        <option value="Otros">Otros</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 uppercase font-bold">Fecha</label>
                                    <input
                                        type="date"
                                        value={parsedData.date}
                                        onChange={e => setParsedData({ ...parsedData, date: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white focus:border-primary"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 uppercase font-bold">Nº PAX</label>
                                    <input
                                        type="number"
                                        value={parsedData.pax}
                                        onChange={e => setParsedData({ ...parsedData, pax: Number(e.target.value) })}
                                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold">Menú / Observaciones</label>
                                <textarea
                                    rows={8}
                                    value={parsedData.menuNotes}
                                    onChange={e => setParsedData({ ...parsedData, menuNotes: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white focus:border-primary font-mono text-xs leading-relaxed"
                                />
                                <p className="text-[10px] text-slate-500 text-right">Extraído de sección "Alimentos y bebidas"</p>
                            </div>
                        </div>
                    )}
                </div>

                {parsedData && (
                    <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                        <button
                            onClick={() => setParsedData(null)}
                            className="px-4 py-2 hover:bg-white/10 rounded text-slate-300 transition-colors"
                        >
                            Atrás
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-primary hover:bg-blue-600 rounded text-white font-medium shadow-lg shadow-primary/25 transition-all"
                        >
                            Confirmar e Importar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
