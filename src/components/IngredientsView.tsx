import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Package, Search, Plus, X } from 'lucide-react';
import { IngredientList } from './lists/IngredientList';
import { IngredientForm } from './IngredientForm';
import { deleteDocument, addDocument } from '../services/firestoreService';
import { ExcelImporter } from './common/ExcelImporter';
import { COLLECTIONS, collections } from '../firebase/collections';
import type { Ingredient, Unit } from '../types';

export const IngredientsView: React.FC = () => {
    const { ingredients, activeOutletId } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | undefined>(undefined);

    const filteredIngredients = ingredients.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de que quieres eliminar este ingrediente?')) {
            try {
                await deleteDocument(COLLECTIONS.INGREDIENTS, id);
            } catch (error) {
                console.error("Error deleting ingredient:", error);
                alert("Error al eliminar");
            }
        }
    };

    const handleImport = async (data: any[]) => {
        if (!activeOutletId) {
            alert("No hay cocina activa seleccionada.");
            return;
        }

        const count = data.length;
        if (!confirm(`Se importarán ${count} ingredientes. ¿Continuar?`)) return;

        let successCount = 0;
        for (const row of data) {
            try {
                // Map columns - try to be flexible with case
                const name = row['Nombre'] || row['Name'] || row['nombre'] || row['name'];
                const unitRaw = row['Unidad'] || row['Unit'] || row['unidad'] || row['unit'];
                const cost = row['Coste'] || row['Cost'] || row['coste'] || row['cost'] || row['Precio'] || 0;

                if (!name) continue;

                const newIngredient: Partial<Ingredient> = {
                    name: String(name),
                    unit: (unitRaw as Unit) || 'kg',
                    costPerUnit: Number(cost) || 0,
                    yield: 1, // Default yield
                    allergens: [],
                    outletId: activeOutletId
                };

                await addDocument(collections.ingredients, newIngredient);
                successCount++;
            } catch (e) {
                console.error("Error importing row", row, e);
            }
        }
        alert(`Importación completada: ${successCount}/${count} ingredientes añadidos.`);
    };

    const handleEdit = (ingredient: Ingredient) => {
        setEditingIngredient(ingredient);
        setShowAddModal(true);
    };

    const closeModal = () => {
        setShowAddModal(false);
        setEditingIngredient(undefined);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6 text-slate-200">
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3">
                        <Package className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold text-white">Ingredientes</h1>
                    </div>
                    <p className="text-slate-400 mt-1">Base de datos de productos y precios.</p>
                </div>
                <div className="flex gap-3 items-center">
                    <ExcelImporter
                        onImport={handleImport}
                        buttonLabel="Importar CSV/XLSX"
                        template={{ col1: "Nombre", col2: "Unidad", col3: "Coste" }}
                    />
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                            className="bg-surface border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:border-primary focus:outline-none w-64 transition-all"
                            placeholder="Buscar ingrediente..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingIngredient(undefined);
                            setShowAddModal(true);
                        }}
                        className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/25"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Ingrediente
                    </button>
                </div>
            </header>

            <IngredientList
                ingredients={filteredIngredients}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-lg">
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div onClick={e => e.stopPropagation()}>
                            <IngredientForm
                                onClose={closeModal}
                                initialData={editingIngredient}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
