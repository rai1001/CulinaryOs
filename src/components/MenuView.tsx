
import React, { useState } from 'react';
import {
    addDocument,
    updateDocument,
    deleteDocument
} from '../services/firestoreService';
import { COLLECTIONS, collections } from '../firebase/collections';
import { useStore } from '../store/useStore';
import { BookOpen, Plus, Search, Edit2, Trash2, Save, X, Utensils } from 'lucide-react';
import type { Menu, MenuVariation } from '../types';
import { useToast, ConfirmModal } from './ui';
import { DataImportModal, type ImportType } from './common/DataImportModal';

export const MenuView: React.FC = () => {
    const { menus, recipes, activeOutletId } = useStore();
    const { addToast } = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
    const [isSaving, setIsSaving] = useState(false);
    const [importType, setImportType] = useState<ImportType | null>(null);

    const handleImportComplete = async (data: any) => {
        if (data.menus && Array.isArray(data.menus)) {
            // Bulk Import (Excel)
            if (!activeOutletId) {
                activeOutletId && alert("Selecciona una cocina activa primero."); // Alert only if we have ID but logical check fails? No, if !ID.
                // If !activeOutletId, we can't save.
                if (!activeOutletId) {
                    alert("Selecciona una cocina activa primero.");
                    return;
                }
            }

            let count = 0;
            for (const m of data.menus) {
                try {
                    const newMenu: Partial<Menu> = {
                        ...m,
                        outletId: activeOutletId,
                        updatedAt: new Date().toISOString(),
                        recipeIds: m.recipeIds || [],
                        variations: m.variations || [],
                        sellPrice: Number(m.sellPrice) || 0
                    };
                    if (!newMenu.id) delete newMenu.id;

                    await addDocument(collections.menus, newMenu);
                    count++;
                } catch (e) {
                    console.error("Error saving menu:", e);
                }
            }
            if (count > 0) alert(`Importados ${count} menús correctamente.`);

        } else if (data.name) {
            // OCR Single Import
            let desc = "";
            if (data.sections) {
                desc = data.sections.map((s: any) =>
                    `## ${s.name}\n${s.items.map((i: any) => `- ${i.name} (${i.price || '?'}€)`).join('\n')}`
                ).join('\n\n');
            }

            setFormData({
                name: data.name,
                description: desc,
                recipeIds: [],
                variations: [],
                sellPrice: 0
            });
            setIsEditing(true);
        }
        setImportType(null);
    };

    // Form State
    const [formData, setFormData] = useState<Partial<Menu>>({
        name: '',
        description: '',
        recipeIds: [],
        variations: [],
        sellPrice: 0
    });



    const filteredMenus = menus.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (menu: Menu) => {
        setFormData({ ...menu });
        setIsEditing(true);
    };

    const handleDelete = (id: string) => {
        setDeleteConfirm({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        if (deleteConfirm.id) {
            try {
                await deleteDocument(COLLECTIONS.MENUS, deleteConfirm.id);
                addToast('Menú eliminado', 'success');
            } catch (error) {
                console.error(error);
                addToast('Error al eliminar menú', 'error');
            }
        }
        setDeleteConfirm({ isOpen: false, id: null });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;
        if (!activeOutletId) {
            addToast('Selecciona una cocina primero', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const menuData: Partial<Menu> = {
                name: formData.name,
                description: formData.description || '',
                recipeIds: formData.recipeIds || [],
                variations: formData.variations || [],
                sellPrice: Number(formData.sellPrice) || 0,
                outletId: activeOutletId
                // Note: 'recipes' is hydrated, not saved to DB
            };

            if (formData.id) {
                await updateDocument(COLLECTIONS.MENUS, formData.id, menuData);
                addToast('Menú actualizado', 'success');
            } else {
                await addDocument(collections.menus, menuData);
                addToast('Menú creado', 'success');
            }
            setIsEditing(false);
            setFormData({ name: '', description: '', recipeIds: [], variations: [], sellPrice: 0 });
        } catch (error) {
            console.error(error);
            addToast('Error al guardar menú', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleRecipe = (recipeId: string) => {
        const current = formData.recipeIds || [];
        const updated = current.includes(recipeId)
            ? current.filter(id => id !== recipeId)
            : [...current, recipeId];
        setFormData({ ...formData, recipeIds: updated });
    };

    const addVariation = () => {
        const newVariation: MenuVariation = { dishName: '', alternativeDishName: '' };
        setFormData({
            ...formData,
            variations: [...(formData.variations || []), newVariation]
        });
    };

    const updateVariation = (index: number, field: keyof MenuVariation, value: string) => {
        const newVariations = [...(formData.variations || [])];
        newVariations[index] = { ...newVariations[index], [field]: value };
        setFormData({ ...formData, variations: newVariations });
    };

    const removeVariation = (index: number) => {
        const newVariations = [...(formData.variations || [])];
        newVariations.splice(index, 1);
        setFormData({ ...formData, variations: newVariations });
    };

    if (isEditing) {
        return (
            <div className="p-6 max-w-4xl mx-auto animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        {formData.id ? <Edit2 className="text-primary" /> : <Plus className="text-primary" />}
                        {formData.id ? 'Editar Menú' : 'Nuevo Menú'}
                    </h2>
                    <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-surface border border-white/10 rounded-xl p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Información General</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Nombre del Menú</label>
                                <input
                                    required
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej. Menú Boda Estándar"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Precio de Venta (€)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none"
                                    value={formData.sellPrice}
                                    onChange={e => setFormData({ ...formData, sellPrice: Number(e.target.value) })}
                                />
                            </div>
                            <div className="col-span-full">
                                <label className="block text-sm text-slate-400 mb-1">Descripción</label>
                                <textarea
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none h-20"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descripción corta del menú..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Recipe Selection */}
                    <div className="bg-surface border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex justify-between">
                            <span>Selección de Platos</span>
                            <span className="text-sm bg-primary/20 text-primary px-2 py-1 rounded">
                                {formData.recipeIds?.length || 0} seleccionados
                            </span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                            {recipes.map(recipe => (
                                <div key={recipe.id}
                                    onClick={() => toggleRecipe(recipe.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${formData.recipeIds?.includes(recipe.id)
                                        ? 'bg-primary/20 border-primary text-white'
                                        : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'
                                        }`}
                                >
                                    <span className="truncate">{recipe.name}</span>
                                    {formData.recipeIds?.includes(recipe.id) && <Utensils size={14} />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Variations */}
                    <div className="bg-surface border border-white/10 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-white">Variaciones / Alternativas</h3>
                            <button
                                type="button"
                                onClick={addVariation}
                                className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg hover:bg-emerald-500/30 transition-colors"
                            >
                                + Añadir Variación
                            </button>
                        </div>

                        {(!formData.variations || formData.variations.length === 0) && (
                            <p className="text-sm text-slate-500 italic text-center py-4 bg-black/10 rounded-lg">
                                No hay variaciones definidas (ej. Opción Vegana para Entrante)
                            </p>
                        )}

                        <div className="space-y-3">
                            {formData.variations?.map((visual, idx) => (
                                <div key={idx} className="flex gap-3 items-start bg-black/20 p-3 rounded-lg">
                                    <div className="flex-1 space-y-2">
                                        <input
                                            placeholder="Plato Original (ej. Solomillo)"
                                            className="w-full bg-transparent border-b border-white/10 text-sm text-white px-2 py-1 focus:border-primary outline-none"
                                            value={visual.dishName}
                                            onChange={e => updateVariation(idx, 'dishName', e.target.value)}
                                        />
                                        <input
                                            placeholder="Alternativa (ej. Tofu Marinado)"
                                            className="w-full bg-transparent border-b border-white/10 text-sm text-emerald-400 px-2 py-1 focus:border-emerald-500 outline-none"
                                            value={visual.alternativeDishName}
                                            onChange={e => updateVariation(idx, 'alternativeDishName', e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeVariation(idx)}
                                        className="text-slate-500 hover:text-red-400 p-2"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-6 py-2 text-slate-300 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`px-6 py-2 bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all font-medium flex items-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Menú'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <BookOpen className="text-primary" />
                        Gestión de Menús
                    </h1>
                    <p className="text-slate-400 mt-1">Crea y organiza tus propuestas gastronómicas</p>
                </div>
                <button
                    onClick={() => setImportType('menu')}
                    className="bg-surface hover:bg-white/10 text-slate-300 border border-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mr-2"
                >
                    <Utensils className="w-4 h-4" /> Importar / Escanear Carta
                </button>
                <button
                    onClick={() => {
                        setFormData({ name: '', description: '', recipeIds: [], variations: [], sellPrice: 0 });
                        setIsEditing(true);
                    }}
                    className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-primary/25"
                >
                    <Plus size={20} /> Nuevo Menú
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                    className="w-full bg-surface border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-primary outline-none transition-colors"
                    placeholder="Buscar menús..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-6 custom-scrollbar">
                {filteredMenus.map(menu => (
                    <div key={menu.id} className="bg-surface border border-white/5 rounded-xl hover:border-primary/30 transition-all p-6 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button
                                onClick={() => handleEdit(menu)}
                                className="p-2 bg-black/50 text-white rounded hover:bg-primary transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => handleDelete(menu.id)}
                                className="p-2 bg-black/50 text-white rounded hover:bg-red-500 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-white mb-2">{menu.name}</h3>
                            <p className="text-sm text-slate-400 line-clamp-2 min-h-[2.5rem]">
                                {menu.description || 'Sin descripción'}
                            </p>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-white/5">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Platos</span>
                                <span className="text-white font-medium">{menu.recipeIds.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Variaciones</span>
                                <span className={`font-medium ${menu.variations?.length ? 'text-emerald-400' : 'text-slate-600'}`}>
                                    {menu.variations?.length || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-slate-500 text-sm">Precio Venta</span>
                                <span className="text-lg font-bold text-white">{menu.sellPrice?.toFixed(2)}€</span>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredMenus.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500">
                        No se encontraron menús. ¡Crea uno nuevo!
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Eliminar Menú"
                message="¿Estás seguro? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
            />

            <DataImportModal
                isOpen={!!importType}
                onClose={() => setImportType(null)}
                type={importType || 'menu'}
                onImportComplete={handleImportComplete}
            />
        </div>
    );
};
