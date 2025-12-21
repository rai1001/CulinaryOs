import React from 'react';
import type { Ingredient } from '../../types';
import { Printer, Edit2, Trash2, Swords, TrendingDown, TrendingUp } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { printLabel, formatLabelData } from '../printing/PrintService';

interface IngredientListProps {
    ingredients: Ingredient[];
    onEdit: (ingredient: Ingredient) => void;
    onDelete: (id: string) => void;
}

export const IngredientList: React.FC<IngredientListProps> = ({ ingredients, onEdit, onDelete }) => {
    const { suppliers, ingredients: allIngredients } = useStore();

    const getPriceComparison = (ing: Ingredient) => {
        const matches = allIngredients.filter(i =>
            i.name.toLowerCase() === ing.name.toLowerCase() &&
            i.id !== ing.id
        );
        if (matches.length === 0) return null;

        const prices = [ing, ...matches].map(i => ({
            price: i.costPerUnit,
            supplier: suppliers.find(s => s.id === i.supplierId)?.name || 'Desconocido',
            isLowest: false
        }));

        const minPrice = Math.min(...prices.map(p => p.price));
        prices.forEach(p => p.isLowest = p.price === minPrice);

        return prices;
    };
    return (
        <div className="bg-surface border border-white/5 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-black/20 text-slate-500 uppercase font-medium">
                    <tr>
                        <th className="p-4">Nombre</th>
                        <th className="p-4">Unidad</th>
                        <th className="p-4 text-right">Stock</th>
                        <th className="p-4 text-right">Mínimo</th>
                        <th className="p-4 text-right">Coste/Ud.</th>
                        <th className="p-4 text-right">Rendimiento</th>
                        <th className="p-4 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {ingredients.map(ing => (
                        <tr key={ing.id} className="hover:bg-white/[0.02]">
                            <td className="p-4 font-medium text-white">{ing.name}</td>
                            <td className="p-4 opacity-70">{ing.unit}</td>
                            <td className={`p-4 text-right font-medium ${(ing.stock || 0) < (ing.minStock || 0) ? 'text-red-400' : 'text-slate-300'}`}>
                                {ing.stock || 0}
                            </td>
                            <td className="p-4 text-right opacity-50">{ing.minStock || 0}</td>
                            <td className="p-4 text-right font-mono text-emerald-400">
                                <div className="flex items-center justify-end gap-2 group/price relative">
                                    {ing.costPerUnit}€
                                    {getPriceComparison(ing) && (
                                        <div className="relative cursor-help">
                                            <Swords size={14} className="text-amber-400 animate-pulse" />
                                            <div className="absolute right-0 bottom-full mb-2 hidden group-hover/price:block z-50">
                                                <div className="glass-card p-3 border-amber-500/30 min-w-[200px] text-left shadow-xl shadow-amber-900/20">
                                                    <p className="text-[10px] font-bold text-amber-400 mb-2 uppercase tracking-widest">Guerra de Precios</p>
                                                    <div className="space-y-1.5">
                                                        {[ing, ...allIngredients.filter(i => i.name.toLowerCase() === ing.name.toLowerCase() && i.id !== ing.id)].map(match => {
                                                            const supplierName = suppliers.find(s => s.id === match.supplierId)?.name || 'Desconocido';
                                                            const isThis = match.id === ing.id;
                                                            return (
                                                                <div key={match.id} className={`flex justify-between items-center text-[11px] p-1 rounded ${isThis ? 'bg-primary/20 border border-primary/20' : ''}`}>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-white truncate max-w-[100px]">{supplierName}</span>
                                                                        {isThis && <span className="text-[8px] text-primary-light uppercase">Este item</span>}
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <span className={`font-mono ${match.costPerUnit <= ing.costPerUnit ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                            {match.costPerUnit.toFixed(2)}€
                                                                        </span>
                                                                        {match.costPerUnit < ing.costPerUnit ? <TrendingDown size={10} className="text-emerald-400" /> : match.costPerUnit > ing.costPerUnit ? <TrendingUp size={10} className="text-red-400" /> : null}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="p-4 text-right opacity-70">{(ing.yield * 100).toFixed(0)}%</td>
                            <td className="p-4 text-center">
                                <div className="flex justify-center gap-1">
                                    <button
                                        onClick={() => onEdit(ing)}
                                        className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => printLabel(formatLabelData(ing, 'INGREDIENT'))}
                                        className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                        title="Imprimir Etiqueta"
                                    >
                                        <Printer size={18} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(ing.id)}
                                        className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {ingredients.length === 0 && (
                        <tr><td colSpan={7} className="p-8 text-center opacity-50">No hay ingredientes.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
