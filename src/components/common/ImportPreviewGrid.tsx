import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import type { IngestionItem } from '../../utils/excelImport';
import {
    Check,
    Trash2,
    Link,
    Plus,
    Search,
    Box
} from 'lucide-react';
import Fuse from 'fuse.js';

interface ImportPreviewGridProps {
    items: IngestionItem[];
    onConfirm: (finalItems: IngestionItem[]) => void;
    onCancel: () => void;
}

export const ImportPreviewGrid: React.FC<ImportPreviewGridProps> = ({
    items: initialItems,
    onConfirm,
    onCancel
}) => {
    const { ingredients: existingIngredients } = useStore();
    const [items, setItems] = useState<IngestionItem[]>(initialItems);
    const [searchTerm, setSearchTerm] = useState('');

    // Fuse.js for fuzzy matching
    const fuse = useMemo(() => new Fuse(existingIngredients, {
        keys: ['name'],
        threshold: 0.3
    }), [existingIngredients]);

    const handleUpdateItem = (index: number, newData: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], data: { ...newItems[index].data, ...newData } };
        setItems(newItems);
    };

    const handleDeleteItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const filteredItems = items.filter(item =>
        (item.data.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.type || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full max-h-[70vh] space-y-4">
            {/* Header & Search */}
            <div className="flex justify-between items-center gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="BUSCAR EN EXTRACCIÓN..."
                        className="w-full bg-black/20 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-all font-mono"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-slate-500">
                    <Box size={14} className="text-primary" />
                    <span>{items.length} detectados</span>
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-auto rounded-2xl border border-white/5 bg-black/40 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-black/80 backdrop-blur-md z-10">
                        <tr>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Tipo</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Nombre</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-center">IA</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Match / Status</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredItems.map((item, idx) => {
                            const match = item.type === 'ingredient' ? fuse.search(item.data.name)[0] : null;
                            const isLowConfidence = item.confidence < 75;

                            return (
                                <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-4 py-3">
                                        <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded-md ${item.type === 'recipe' ? 'bg-purple-500/20 text-purple-400' :
                                            item.type === 'ingredient' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-slate-500/20 text-slate-400'
                                            }`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="text"
                                            className={`bg-transparent border-none focus:ring-0 text-sm font-bold w-full ${isLowConfidence ? 'text-amber-400' : 'text-slate-200'}`}
                                            value={item.data.name || ''}
                                            onChange={(e) => handleUpdateItem(idx, { name: e.target.value })}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className={`text-[10px] font-mono font-bold ${item.confidence >= 90 ? 'text-emerald-400' :
                                            item.confidence >= 75 ? 'text-blue-400' : 'text-amber-500'
                                            }`}>
                                            {item.confidence}%
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {match ? (
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                <Link size={12} className="text-primary" />
                                                <span className="font-mono truncate max-w-[150px] italic">
                                                    Match: {match.item.name}
                                                </span>
                                            </div>
                                        ) : item.type === 'ingredient' ? (
                                            <div className="flex items-center gap-2 text-[10px] text-emerald-500/80 font-black uppercase tracking-widest">
                                                <Plus size={12} />
                                                <span>Nuevo Ingrediente</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-slate-600 font-mono italic">
                                                Automatic linking...
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleDeleteItem(idx)}
                                            className="p-1.5 hover:bg-red-500/20 text-slate-600 hover:text-red-400 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                    onClick={onCancel}
                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                >
                    Cancelar
                </button>
                <button
                    onClick={() => onConfirm(items)}
                    className="flex-[2] px-6 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <Check size={16} />
                    Confirmar e Importar {items.length} Items
                </button>
            </div>
        </div>
    );
};
