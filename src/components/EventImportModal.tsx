import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, X, Check, FileSpreadsheet, Loader2, AlertCircle, Camera, FileText } from 'lucide-react';
import { useStore } from '../store/useStore';
import { format, parse, isValid } from 'date-fns';
import type { EventType } from '../types';
import { scanEventOrder } from '../services/geminiService';

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
    const { events, setEvents } = useStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [mode, setMode] = useState<'excel' | 'scan'>('excel');
    const [parsing, setParsing] = useState(false);
    const [parsedData, setParsedData] = useState<ParsedEvent | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            parseExcel(selectedFile);
        }
    };

    const handleScanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];

        setParsing(true);
        setError(null);
        setParsedData(null);

        try {
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = reject;
            });

            const result = await scanEventOrder(base64Data);

            if (result.success && result.data) {
                const d = result.data;
                setParsedData({
                    name: d.eventName || 'Evento Escaneado',
                    date: d.date || format(new Date(), 'yyyy-MM-dd'),
                    pax: Number(d.pax) || 0,
                    menuNotes: (d.menu?.name ? `Menú: ${d.menu.name}\n` : '') +
                        (d.menu?.items?.join(', ') || '') +
                        (d.notes ? `\n\nNotas: ${d.notes}` : ''),
                    type: 'Comida'
                });
            } else {
                throw new Error(result.error || 'No se pudo leer la hoja de evento');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al escanear documento');
        } finally {
            setParsing(false);
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
                if (cell.includes('evento') && !name.includes('Navidad')) {
                    if (row[c + 1]) name = String(row[c + 1]);
                    else if (data[r + 1] && data[r + 1][c]) name = String(data[r + 1][c]);
                }

                // Date / Fecha
                if (cell === ('fecha')) {
                    let dateRaw = row[c + 1];
                    if (!dateRaw && data[r + 1]) dateRaw = data[r + 1][c];

                    if (dateRaw) {
                        if (typeof dateRaw === 'number') {
                            const dateObj = new Date(Math.round((dateRaw - 25569) * 86400 * 1000));
                            if (isValid(dateObj)) date = format(dateObj, 'yyyy-MM-dd');
                        } else {
                            const parsed = parse(String(dateRaw).trim(), 'dd/MM/yyyy', new Date());
                            if (isValid(parsed)) date = format(parsed, 'yyyy-MM-dd');
                        }
                    }
                }

                // PAX / Personas
                if (cell === 'pax' || cell === 'no pax' || cell === 'personas' || cell.includes('nº pax')) {
                    let paxRaw = row[c + 1];
                    if (!paxRaw && data[r + 1]) paxRaw = data[r + 1][c];

                    if (paxRaw && !isNaN(Number(paxRaw))) {
                        pax = Number(paxRaw);
                    }
                }

                // Menu content
                if (cell.includes('alimentos y bebidas')) {
                    let currentRow = r + 1;
                    while (currentRow < data.length) {
                        const nextRow = data[currentRow];
                        const firstCell = String(nextRow[0] || '').toLowerCase();

                        if (firstCell.includes('bodega') || firstCell.includes('observaciones') || firstCell.includes('horarios')) {
                            break;
                        }

                        const line = nextRow.filter(x => x).join(' ');
                        if (line.trim()) {
                            menuNotes += line + '\n';
                        }
                        currentRow++;
                    }
                }
            }
        }

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
            menuId: undefined
        };

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
                        {mode === 'excel' ? <FileSpreadsheet className="text-emerald-400" /> : <Camera className="text-purple-400" />}
                        {mode === 'excel' ? 'Importar Hoja de Servicio' : 'Escanear Orden de Evento (BEO)'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {!parsedData && (
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setMode('excel')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'excel' ? 'bg-white/5 text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'}`}
                        >
                            Excel Import
                        </button>
                        <button
                            onClick={() => setMode('scan')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'scan' ? 'bg-white/5 text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}
                        >
                            Scanner / OCR
                        </button>
                    </div>
                )}

                <div className="p-6 overflow-y-auto flex-1">
                    {!parsedData ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed border-white/10 rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 hover:border-primary/50 transition-all ${parsing ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={mode === 'excel' ? handleFileChange : handleScanUpload}
                                className="hidden"
                                accept={mode === 'excel' ? ".xlsx, .xls" : ".jpg, .jpeg, .png, .webp"}
                            />

                            {parsing ? (
                                <>
                                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                                    <p className="text-lg font-medium text-white">Analizando archivo...</p>
                                    <p className="text-sm text-slate-400 mt-2">
                                        {mode === 'excel' ? 'Buscando fechas, comensales y menús' : 'Extrayendo datos con IA'}
                                    </p>
                                </>
                            ) : error ? (
                                <>
                                    <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
                                    <p className="text-lg font-medium text-red-400">{error}</p>
                                    <p className="text-sm text-slate-400 mt-2">Click para intentar de nuevo</p>
                                </>
                            ) : (
                                <>
                                    {mode === 'excel' ? (
                                        <Upload className="w-10 h-10 text-slate-400 mb-4" />
                                    ) : (
                                        <FileText className="w-10 h-10 text-purple-400 mb-4" />
                                    )}
                                    <p className="text-lg font-medium text-white">
                                        {mode === 'excel' ? 'Click para subir Excel' : 'Click para subir Imagen BEO'}
                                    </p>
                                    <p className="text-sm text-slate-400 mt-2">
                                        {mode === 'excel' ? 'Soporta .xlsx y .xls' : 'Soporta JPG, PNG (las fotos claras funcionan mejor)'}
                                    </p>
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
                                <p className="text-[10px] text-slate-500 text-right">Extraído {mode === 'excel' ? 'de Excel' : 'con IA'}</p>
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
