import React from 'react';
import type { Ingredient } from '../../types';
import { Printer } from 'lucide-react';
import { printLabel, formatLabelData } from '../printing/PrintService';

interface IngredientListProps {
    ingredients: Ingredient[];
}

export const IngredientList: React.FC<IngredientListProps> = ({ ingredients }) => {
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
                            <td className="p-4 text-right font-mono text-emerald-400">{ing.costPerUnit}€</td>
                            <td className="p-4 text-right opacity-70">{(ing.yield * 100).toFixed(0)}%</td>
                            <td className="p-4 text-center">
                                <button
                                    onClick={() => printLabel(formatLabelData(ing, 'INGREDIENT'))}
                                    className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                    title="Imprimir Etiqueta"
                                >
                                    <Printer size={18} />
                                </button>
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
