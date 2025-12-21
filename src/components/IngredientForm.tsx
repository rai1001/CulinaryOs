import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Unit, Ingredient } from '../types';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import { enrichIngredientCallable } from '../api/ai';
import type { IngredientEnrichment } from '../types';
import { addDocument, updateDocument } from '../services/firestoreService';
import { COLLECTIONS, collections } from '../firebase/collections';

export const IngredientForm: React.FC<{ initialData?: Ingredient; onClose?: () => void }> = ({ initialData, onClose }) => {
    const { activeOutletId, suppliers } = useStore();

    const [formData, setFormData] = useState<Partial<Ingredient>>(
        initialData || {
            name: '',
            unit: 'kg' as Unit,
            costPerUnit: 0,
            yield: 1,
            shelfLife: 0,
            allergens: [] as string[],
            stock: 0,
            minStock: 0,
            supplierId: '',
            category: 'other',
            nutritionalInfo: {
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0
            }
        }
    );
    const [enriching, setEnriching] = useState(false);

    const handleEnrich = async () => {
        if (!formData.name) return;
        setEnriching(true);
        try {
            const result = await enrichIngredientCallable({ name: formData.name });
            const data = result.data as IngredientEnrichment;
            if (data) {
                setFormData(prev => ({
                    ...prev,
                    nutritionalInfo: data.nutritionalInfo,
                    allergens: data.allergens
                }));
            }
        } catch (error) {
            console.error("Enrichment failed", error);
        } finally {
            setEnriching(false);
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!activeOutletId) {
            console.error("No active outlet");
            alert("Por favor selecciona una cocina activa.");
            return;
        }

        setIsSubmitting(true);
        try {
            if (initialData) {
                // Update
                const updateData = { ...formData, outletId: activeOutletId };
                await updateDocument(COLLECTIONS.INGREDIENTS, initialData.id, updateData);
                if (onClose) onClose();
            } else {
                // Create
                const newData = {
                    ...formData,
                    outletId: activeOutletId,
                    // Ensure defaults
                    category: formData.category || 'other'
                };
                await addDocument(collections.ingredients, newData);

                // Reset form - simplified
                if (onClose) onClose();
            }
        } catch (error) {
            console.error("Error saving ingredient:", error);
            alert("Error al guardar el ingrediente");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-surface p-6 rounded-xl border border-white/5">
            <h3 className="text-xl font-bold text-white mb-4">{initialData ? 'Editar Ingrediente' : 'Añadir Ingrediente'}</h3>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm text-slate-400">Nombre</label>
                    <div className="flex gap-2">
                        <input
                            required
                            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white focus:border-primary"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                        <button
                            type="button"
                            onClick={handleEnrich}
                            disabled={enriching || !formData.name}
                            className="p-2 bg-purple-500/20 text-purple-400 border border-purple-500/50 rounded hover:bg-purple-500/30 disabled:opacity-50 transition-colors"
                            title="Auto-completar con IA"
                        >
                            {enriching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm text-slate-400">Categoría</label>
                    <select
                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white outline-none"
                        value={formData.category || 'other'}
                        onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    >
                        <option value="meat">Carne</option>
                        <option value="fish">Pescado</option>
                        <option value="produce">Frutas y Verduras</option>
                        <option value="dairy">Lácteos</option>
                        <option value="dry">Secos</option>
                        <option value="frozen">Congelados</option>
                        <option value="canned">Latas</option>
                        <option value="cocktail">Cóctel</option>
                        <option value="sports_menu">Menú Deportivo</option>
                        <option value="corporate_menu">Menú Empresa</option>
                        <option value="coffee_break">Coffee Break</option>
                        <option value="restaurant">Restaurante</option>
                        <option value="other">Otros</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-sm text-slate-400">Unidad (Receta)</label>
                    <select
                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white outline-none"
                        value={formData.unit}
                        onChange={e => setFormData({ ...formData, unit: e.target.value as Unit })}
                    >
                        {['kg', 'g', 'L', 'ml', 'un', 'manojo'].map(u => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-sm text-slate-400">Coste por Unidad ($)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white"
                        value={formData.costPerUnit}
                        onChange={e => setFormData({ ...formData, costPerUnit: Number(e.target.value) })}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm text-slate-400">Rendimiento (0-1)</label>
                    <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white"
                        value={formData.yield}
                        onChange={e => setFormData({ ...formData, yield: Number(e.target.value) })}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm text-slate-400">Vida útil (días)</label>
                    <input
                        type="number"
                        min="0"
                        step="1"
                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white"
                        value={formData.shelfLife || ''}
                        onChange={e => setFormData({ ...formData, shelfLife: Number(e.target.value) })}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm text-slate-400">Proveedor</label>
                    <select
                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white outline-none"
                        value={formData.supplierId || ''}
                        onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                    >
                        <option value="">Seleccionar Proveedor</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                <div className="col-span-2 border-t border-white/10 pt-4 mt-2">
                    <h4 className="text-md font-semibold text-white mb-3">Información Nutricional (por 100g/ml)</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Calorías (kcal)</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white"
                                value={formData.nutritionalInfo?.calories}
                                onChange={e => setFormData({
                                    ...formData,
                                    nutritionalInfo: { ...formData.nutritionalInfo!, calories: Number(e.target.value) }
                                })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Proteínas (g)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.1"
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white"
                                value={formData.nutritionalInfo?.protein}
                                onChange={e => setFormData({
                                    ...formData,
                                    nutritionalInfo: { ...formData.nutritionalInfo!, protein: Number(e.target.value) }
                                })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Carbohidratos (g)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.1"
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white"
                                value={formData.nutritionalInfo?.carbs}
                                onChange={e => setFormData({
                                    ...formData,
                                    nutritionalInfo: { ...formData.nutritionalInfo!, carbs: Number(e.target.value) }
                                })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Grasas (g)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.1"
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white"
                                value={formData.nutritionalInfo?.fat}
                                onChange={e => setFormData({
                                    ...formData,
                                    nutritionalInfo: { ...formData.nutritionalInfo!, fat: Number(e.target.value) }
                                })}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm text-slate-400">Stock Actual</label>
                    <input
                        type="number"
                        min="0"
                        step="any"
                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white"
                        value={formData.stock}
                        onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm text-slate-400">Stock Mínimo</label>
                    <input
                        type="number"
                        min="0"
                        step="any"
                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white"
                        value={formData.minStock}
                        onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                    </>
                ) : (
                    <>
                        <Plus className="w-4 h-4" /> {initialData ? 'Guardar Cambios' : 'Añadir Ingrediente'}
                    </>
                )}
            </button>
        </form>
    );
};
