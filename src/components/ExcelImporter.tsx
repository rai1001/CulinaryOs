import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { parseRecipesFromExcel, parseMenusFromExcel, parseIngredientsFromExcel } from '../utils/excelImport';
import { getSampleData } from '../utils/sampleData';
import { logger } from '../utils/logger';
import { Upload, AlertCircle, CheckCircle, FileSpreadsheet, Database } from 'lucide-react';

export const ExcelImporter: React.FC = () => {
    const { setRecipes, setIngredients, recipes, setMenus, setEvents } = useStore();
    const [importType, setImportType] = useState<'recipes' | 'menus' | 'ingredients'>('ingredients');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setStatus(null);

        try {
            if (importType === 'ingredients') {
                const { ingredients: newIngredients, errors } = await parseIngredientsFromExcel(file);

                if (newIngredients.length === 0) {
                    if (errors.length > 0) throw new Error(errors[0]);
                    throw new Error('No valid ingredients found.');
                }

                setIngredients(newIngredients);
                setStatus({
                    type: 'success',
                    message: `Successfully imported ${newIngredients.length} ingredients.`
                });
            } else if (importType === 'recipes') {
                const { recipes: newRecipes, ingredients: newIngredients, errors } = await parseRecipesFromExcel(file);

                if (newRecipes.length === 0) {
                    // If we have specific errors, throw them
                    if (errors.length > 0) {
                        throw new Error(errors[0]);
                    }
                    throw new Error('No valid recipes found. Check column headers.');
                }

                setIngredients(newIngredients);
                setRecipes(newRecipes);
                setStatus({
                    type: 'success',
                    message: `Successfully imported ${newRecipes.length} recipes and ${newIngredients.length} ingredients.`
                });
            } else {
                // Menus
                if (recipes.length === 0) {
                    throw new Error('Please import recipes first to link them to menus.');
                }
                const { menus: newMenus, errors } = await parseMenusFromExcel(file, recipes);

                if (newMenus.length === 0) {
                    throw new Error('No valid menus found.');
                }

                setMenus(newMenus);
                setStatus({
                    type: 'success',
                    message: `Successfully imported ${newMenus.length} menus. ${errors.length > 0 ? `(${errors.length} warnings)` : ''}`
                });

                if (errors.length > 0) {
                    logger.warn('Menu import warnings:', errors);
                }
            }
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'Failed to import file.' });
        } finally {
            setLoading(false);
            // Reset file input
            e.target.value = '';
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
            message: 'Loaded sample data (Ingredients, Recipes, Menus, Events).'
        });
    };

    return (
        <div className="p-6 glass-card w-full max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-4">
                <FileSpreadsheet className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold text-white">Data Import</h2>
            </div>

            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setImportType('ingredients')}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors ${importType === 'ingredients'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-surface hover:bg-slate-700 text-slate-300'
                        }`}
                >
                    Ingredients
                </button>
                <button
                    onClick={() => setImportType('recipes')}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors ${importType === 'recipes'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-surface hover:bg-slate-700 text-slate-300'
                        }`}
                >
                    Recipes
                </button>
                <button
                    onClick={() => setImportType('menus')}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors ${importType === 'menus'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-surface hover:bg-slate-700 text-slate-300'
                        }`}
                >
                    Menus
                </button>
            </div>

            <div className="relative border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-primary/50 transition-colors bg-surface/30">
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={loading}
                />
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <Upload className={`w-8 h-8 ${loading ? 'animate-bounce text-primary' : 'text-slate-400'}`} />
                    <p className="text-slate-300 font-medium">
                        {loading ? 'Parsing...' : `Click to upload ${importType} (.xlsx)`}
                    </p>
                    <p className="text-xs text-slate-500">Supported formats: .xlsx</p>
                </div>
            </div>

            {status && (
                <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${status.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                    {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                    <p className="text-sm">{status.message}</p>
                </div>
            )}

            <div className="mt-6 pt-6 border-t border-slate-700 flex justify-center">
                <button
                    onClick={loadSampleData}
                    className="text-slate-400 hover:text-white text-sm flex items-center gap-2 transition-colors"
                >
                    <Database className="w-4 h-4" />
                    Load Sample Data
                </button>
            </div>
        </div>
    );
};
