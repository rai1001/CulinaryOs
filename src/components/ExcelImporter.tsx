import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { parseWorkbook } from '../utils/excelImport';
import type { ParseResult } from '../utils/excelImport';
import { getSampleData } from '../utils/sampleData';
import { Upload, AlertCircle, CheckCircle, FileSpreadsheet, Database, Save } from 'lucide-react';

export const ExcelImporter: React.FC = () => {
    const { setRecipes, setIngredients, setMenus, setEvents } = useStore();

    // Steps: 'upload' -> 'review' -> 'success'
    const [step, setStep] = useState<'upload' | 'review' | 'success'>('upload');
    const [loading, setLoading] = useState(false);
    const [parseResult, setParseResult] = useState<ParseResult | null>(null);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setStatus(null);

        try {
            const result = await parseWorkbook(file);
            setParseResult(result);

            if (result.summary.ingredientsFound === 0 && result.summary.recipesFound === 0 && result.summary.menusFound === 0) {
                setStatus({
                    type: 'error',
                    message: 'No se encontraron datos reconocibles. Comprueba que el archivo tenga hojas válidas.'
                });
                setStep('upload');
            } else {
                setStep('review');
            }

        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'Error al importar el archivo.' });
            setStep('upload');
        } finally {
            setLoading(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleConfirmImport = () => {
        if (!parseResult) return;

        try {
            // Apply updates
            if (parseResult.ingredients.length > 0) setIngredients(parseResult.ingredients);
            if (parseResult.recipes.length > 0) setRecipes(parseResult.recipes);
            if (parseResult.menus.length > 0) setMenus(parseResult.menus);

            setStep('success');
            setStatus({
                type: 'success',
                message: `Importación completada: ${parseResult.summary.ingredientsFound} ingredientes, ${parseResult.summary.recipesFound} recetas.`
            });
        } catch (err) {
            setStatus({ type: 'error', message: 'Error guardando los datos.' });
        }
    };

    const loadSampleData = () => {
        const { ingredients: sampleIngredients, recipes: sampleRecipes, menus: sampleMenus, events: sampleEvents } = getSampleData();
        setIngredients(sampleIngredients);
        setRecipes(sampleRecipes);
        setMenus(sampleMenus);
        setEvents(sampleEvents);
        setStatus({
            type: 'success',
            message: 'Datos de ejemplo cargados (Ingredientes, Recetas, Menús, Eventos).'
        });
        setStep('success');
    };

    const reset = () => {
        setStep('upload');
        setParseResult(null);
        setStatus(null);
    };

    return (
        <div className="p-6 glass-card w-full max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-4">
                <FileSpreadsheet className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold text-white">Importación Inteligente</h2>
            </div>
            <p className="text-slate-400 text-sm mb-6">
                Sube tu plantilla Excel (.xlsx, .xlsm). El sistema detectará automáticamente ingredientes, recetas y menús.
            </p>

            {step === 'upload' && (
                <div className="relative border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-primary/50 transition-colors bg-surface/30">
                    <input
                        type="file"
                        accept=".xlsx, .xls, .xlsm"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={loading}
                    />
                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                        <Upload className={`w-8 h-8 ${loading ? 'animate-bounce text-primary' : 'text-slate-400'}`} />
                        <p className="text-slate-300 font-medium">
                            {loading ? 'Analizando archivo...' : 'Haz clic para subir Plantilla (.xlsx, .xlsm)'}
                        </p>
                        <p className="text-xs text-slate-500">Soporta múltiples pestañas</p>
                    </div>
                </div>
            )}

            {step === 'review' && parseResult && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-surface/50 p-4 rounded-lg border border-white/10 space-y-3">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-400" /> Resumen del Análisis
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-black/20 p-3 rounded">
                                <span className="block text-slate-400">Ingredientes</span>
                                <span className="text-xl font-bold text-white">{parseResult.summary.ingredientsFound}</span>
                            </div>
                            <div className="bg-black/20 p-3 rounded">
                                <span className="block text-slate-400">Recetas</span>
                                <span className="text-xl font-bold text-white">{parseResult.summary.recipesFound}</span>
                            </div>
                            <div className="bg-black/20 p-3 rounded">
                                <span className="block text-slate-400">Menús</span>
                                <span className="text-xl font-bold text-white">{parseResult.summary.menusFound}</span>
                            </div>
                            <div className="bg-black/20 p-3 rounded">
                                <span className="block text-slate-400">Pestañas</span>
                                <span className="text-xl font-bold text-white">{parseResult.summary.sheetsScaned}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleConfirmImport}
                        className="w-full bg-primary hover:bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all"
                    >
                        <Save className="w-5 h-5" /> Confirmar e Importar
                    </button>
                    <button
                        onClick={reset}
                        className="w-full text-slate-400 hover:text-white py-2 text-sm transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            )}

            {status && step !== 'review' && (
                <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${status.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                    {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                    <div className="flex-1">
                        <p className="text-sm font-medium">{status.message}</p>
                        {step === 'success' && (
                            <button onClick={reset} className="mt-2 text-xs underline hover:text-white">
                                Importar otro archivo
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-700 flex justify-center">
                <button
                    onClick={loadSampleData}
                    className="text-slate-400 hover:text-white text-sm flex items-center gap-2 transition-colors"
                >
                    <Database className="w-4 h-4" />
                    Cargar Datos de Ejemplo
                </button>
            </div>
        </div>
    );
};
