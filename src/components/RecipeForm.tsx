import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, X } from 'lucide-react';

export const RecipeForm: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const { ingredients, addRecipe } = useStore();
    const [formData, setFormData] = useState({
        name: '',
        station: 'hot',
        isBase: false,
        ingredients: [] as { ingredientId: string; quantity: number }[]
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Hydrate ingredients for the store (optional, but good for consistency if needed immediately)
        const recipeIngredients = formData.ingredients.map(item => ({
            ...item,
            ingredient: ingredients.find(i => i.id === item.ingredientId)
        }));

        addRecipe({
            id: crypto.randomUUID(),
            name: formData.name,
            station: formData.station as 'hot' | 'cold' | 'dessert',
            isBase: formData.isBase,
            ingredients: recipeIngredients
        });

        if (onClose) onClose();
    };

    const addIngredientRow = () => {
        setFormData({
            ...formData,
            ingredients: [...formData.ingredients, { ingredientId: '', quantity: 0 }]
        });
    };

    const updateIngredientRow = (index: number, field: 'ingredientId' | 'quantity', value: string | number) => {
        const newIngredients = [...formData.ingredients];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        setFormData({ ...formData, ingredients: newIngredients });
    };

    const removeIngredientRow = (index: number) => {
        const newIngredients = formData.ingredients.filter((_, i) => i !== index);
        setFormData({ ...formData, ingredients: newIngredients });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-surface p-6 rounded-xl border border-white/5">
            <h3 className="text-xl font-bold text-white mb-4">Añadir Receta</h3>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm text-slate-400">Nombre</label>
                    <input
                        required
                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm text-slate-400">Partida</label>
                    <select
                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white"
                        value={formData.station}
                        onChange={e => setFormData({ ...formData, station: e.target.value })}
                    >
                        <option value="hot">Caliente</option>
                        <option value="cold">Fría</option>
                        <option value="dessert">Postres</option>
                    </select>
                </div>
            </div>

            {/* Checkbox for isBase */}
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="isBase"
                    checked={formData.isBase}
                    onChange={e => setFormData({ ...formData, isBase: e.target.checked })}
                    className="w-4 h-4 rounded border-white/10 bg-black/20 text-primary focus:ring-primary focus:ring-offset-0"
                />
                <label htmlFor="isBase" className="text-sm text-slate-400 cursor-pointer">
                    Esta es una receta base (usada como ingrediente en otras recetas)
                </label>
            </div>

            <div className="space-y-2">
                <label className="text-sm text-slate-400">Ingredientes</label>
                {formData.ingredients.map((item, index) => (
                    <div key={index} className="flex gap-2">
                        <select
                            required
                            className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-white"
                            value={item.ingredientId}
                            onChange={e => updateIngredientRow(index, 'ingredientId', e.target.value)}
                        >
                            <option value="">Seleccionar Ingrediente...</option>
                            {ingredients.map(ing => (
                                <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            placeholder="Cant."
                            className="w-24 bg-black/20 border border-white/10 rounded px-3 py-2 text-white"
                            value={item.quantity}
                            onChange={e => updateIngredientRow(index, 'quantity', Number(e.target.value))}
                        />
                        <button
                            type="button"
                            onClick={() => removeIngredientRow(index)}
                            className="p-2 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addIngredientRow}
                    className="text-sm text-primary hover:text-blue-400 flex items-center gap-1"
                >
                    <Plus className="w-3 h-3" /> Añadir Ingrediente
                </button>
            </div>

            <button
                type="submit"
                className="w-full bg-primary hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors"
            >
                Guardar Receta
            </button>
        </form>
    );
};
