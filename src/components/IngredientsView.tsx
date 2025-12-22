import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useOutletScoping } from '../hooks/useOutletScoping';
import { Package, Search, Plus, X, Import, Store } from 'lucide-react';
import { IngredientList } from './lists/IngredientList';
import { IngredientForm } from './IngredientForm';
import { deleteDocument, addDocument } from '../services/firestoreService';
import { DataImportModal, type ImportType } from './common/DataImportModal';
import { COLLECTIONS, collections } from '../firebase/collections';
import type { Ingredient, Unit } from '../types';

export const IngredientsView: React.FC = () => {
    const { ingredients } = useStore();
    const { activeOutletId, isValidOutlet } = useOutletScoping();
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | undefined>(undefined);
    const [importType, setImportType] = useState<ImportType | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Ingredient | 'stock'; direction: 'asc' | 'desc' }>({
        key: 'name',
        direction: 'asc'
    });

    const CATEGORIES = [
        { id: 'all', label: 'Todos', icon: Package },
        { id: 'meat', label: 'Carne' },
        { id: 'fish', label: 'Pescado' },
        { id: 'produce', label: 'Vegetales' },
        { id: 'dairy', label: 'Lácteos' },
        { id: 'dry', label: 'Secos' },
        { id: 'frozen', label: 'Congelados' },
        { id: 'other', label: 'Otros' }
    ];

    const handleImportComplete = async (data: any) => {
        if (data.ingredients && Array.isArray(data.ingredients)) {
            // Excel Bulk Import
            await handleImport(data.ingredients);
        } else if (data.name) {
            // OCR Single Import
            // Pre-fill form
            setEditingIngredient({
                ...data,
                id: crypto.randomUUID(),
                // Ensure unit/cost exist
                unit: data.unit || 'kg',
                costPerUnit: data.costPerUnit || 0,
                outletId: activeOutletId
            } as Ingredient);
            setShowAddModal(true);
        }
        setImportType(null);
    };

    const handleSort = (key: keyof Ingredient | 'stock') => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredIngredients = React.useMemo(() => {
        let result = ingredients.filter(i =>
            i.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (activeCategory === 'all' || i.category === activeCategory) &&
            (isValidOutlet ? i.outletId === activeOutletId : true) // If invalid outlet, showing global/mixed is risky. Better to show nothing? Or just filter if valid.
        );

        // Stricter: If no valid outlet, show empty to force selection (safer for multi-tenant feel)
        if (!isValidOutlet) return [];

        return [...result].sort((a, b) => {
            const aValue = a[sortConfig.key as keyof Ingredient] ?? 0;
            const bValue = b[sortConfig.key as keyof Ingredient] ?? 0;

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [ingredients, searchTerm, activeCategory, sortConfig]);

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
                    <button
                        onClick={() => setImportType('ingredient')}
                        className="bg-surface hover:bg-white/10 text-slate-300 border border-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Import className="w-4 h-4" /> Importar / Escanear
                    </button>
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

            {/* Category Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${activeCategory === cat.id
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-surface border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>


            {
        !isValidOutlet ? (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                <Store className="w-12 h-12 text-slate-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Selecciona una Cocina</h3>
                <p className="text-slate-400 text-center max-w-md">
                    Para gestionar el inventario, primero debes seleccionar una cocina o punto de venta activo desde el menú lateral.
                </p>
            </div>
        ) : (
            <IngredientList
                ingredients={filteredIngredients}
                onEdit={handleEdit}
                onDelete={handleDelete}
                sortConfig={sortConfig}
                onSort={handleSort}
            />
        )
    }

    {
        showAddModal && (
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
        )
    }

    <DataImportModal
        isOpen={!!importType}
        onClose={() => setImportType(null)}
        type={importType || 'ingredient'}
        onImportComplete={handleImportComplete}
    />
        </div >
    );
};
