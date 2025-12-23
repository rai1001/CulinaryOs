import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Camera, Loader2, Trash2 } from 'lucide-react';
import type { Supplier } from '../types/suppliers';
import { proveedoresService } from '../services/proveedoresService';
import { firestoreService } from '../services/firestoreService';
import { COLLECTIONS } from '../firebase/collections';

import { ExcelImporter } from './common/ExcelImporter';
import { ProveedoresList } from './proveedores/ProveedoresList';
import { ProveedorForm } from './proveedores/ProveedorForm';
// Ingredient Modal Logic remains or can be refactored too. keeping it simple for now, 
// using the existing logic but maybe moving it later.
// Actually, Ingredients Modal logic is intertwined. I will keep it here for now or extract if complex.
// The list component has 'onViewIngredients'.
import { ChevronDown, ChevronUp } from 'lucide-react';

export const SupplierView: React.FC = () => {
    const { suppliers, addSupplier, updateSupplier, deleteSupplier, ingredients, activeOutletId } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    const handleClearData = async () => {
        if (!window.confirm('¿ESTÁS SEGURO? Esto borrará TODOS los proveedores permanentemente.')) return;
        setIsDeletingAll(true);
        try {
            await firestoreService.deleteAll(COLLECTIONS.SUPPLIERS);
            // Clear local store
            useStore.setState({ suppliers: [] });
            // Note: Since we are inside the component, we can't easily set state via store generic setter unless exposed. 
            // store.useStore.setState is a direct way if imported, but useStore hook returns selectors.
            // Let's check updateSupplier/deleteSupplier action. 
            // Usually we might need a 'setSuppliers' action. 
            // For now, I'll attempt to use a direct reload or assume the user accepts a refresh, 
            // BUT better: iterate and delete locally OR expose setSuppliers.
            // Looking at the useStore definitions, usually there is a setSuppliers or similar.
            // Returning to simplicity: just reload or use deleteSupplier in a loop if internal logic forbids wipe.
            // Actually, I can just reload window or assume firestore listener updates it?
            // "suppliers" from useStore is likely synced if there is a listener.
            // Use window.location.reload() as fallback if sync keeps it.
            // Ideally:
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert('Error al borrar datos');
        } finally {
            setIsDeletingAll(false);
        }
    };

    // Ingredient View State
    const [viewingIngredientsSupplier, setViewingIngredientsSupplier] = useState<Supplier | null>(null);
    const [expandedIngredientId, setExpandedIngredientId] = useState<string | null>(null);

    // Initial Form Data for Scan or New
    const [initialFormData, setInitialFormData] = useState<Partial<Supplier> | null>(null);

    const handleImport = async (data: any[]) => {
        if (!activeOutletId) {
            alert("No hay cocina activa seleccionada.");
            return;
        }

        if (!confirm(`Se importarán ${data.length} proveedores. ¿Continuar?`)) return;

        let successCount = 0;
        for (const row of data) {
            try {
                // Map common headers + Custom User Template
                const name = row['Nombre'] || row['Name'] || row['nombre'] || row['Proveedor'] || row['PROVEEDOR'];
                if (!name) continue;

                const supplierData = {
                    name: String(name),
                    contactName: row['Contacto'] || row['Contact'] || row['contactName'] || row['CONTACTO SEGURA'] || '',
                    email: row['Email'] || row['Correo'] || row['CONTACTO INCIDENCIAS'] || '',
                    phone: String(row['Telefono'] || row['Phone'] || row['phone'] || row['TELEFONO'] || ''),
                    leadTime: 1, // Default
                    orderDays: [],
                    minimumOrderValue: Number(row['Minimo'] || row['PEDIDO MINIMO'] || 0),
                    outletId: activeOutletId
                };

                const normalizedName = String(name).toLowerCase();
                const existing = suppliers.find(s => s.name.toLowerCase() === normalizedName);
                if (existing) {
                    console.log(`Skipping duplicate supplier: ${name}`);
                    continue;
                }

                const newId = await proveedoresService.create(supplierData);
                addSupplier({ id: newId, ...supplierData } as Supplier);
                successCount++;
            } catch (error) {
                console.error("Error importing supplier row", row, error);
            }
        }
        alert(`Importación completada: ${successCount} proveedores añadidos.`);
    };

    const handleOpenModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setInitialFormData(supplier);
        } else {
            setEditingSupplier(null);
            setInitialFormData(null);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSupplier(null);
        setInitialFormData(null);
        setIsSubmitting(false);
    };

    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleScanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        setIsScanning(true);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                try {
                    const base64 = (reader.result as string).split(',')[1];
                    const { analyzeImage } = await import('../services/geminiService');

                    const prompt = `
                        Analiza esta tarjeta de visita o cabecera de factura. Extrae datos del PROVEEDOR:
                        {
                            "name": "Nombre Empresa",
                            "contactName": "Persona de contacto",
                            "phone": "Teléfono",
                            "email": "Email",
                            "address": "Dirección"
                        }
                     `;

                    const result = await analyzeImage(base64, prompt);
                    if (result.success && result.data) {
                        const s = result.data;
                        const scannedData = {
                            name: s.name || '',
                            contactName: s.contactName || '',
                            email: s.email || '',
                            phone: s.phone || '',
                            address: s.address || '',
                            leadTime: 1,
                            minimumOrderValue: 0,
                            orderDays: []
                        } as Partial<Supplier>;

                        setEditingSupplier(null);
                        setInitialFormData(scannedData);
                        setIsModalOpen(true);
                    }
                } catch (err) {
                    console.error(err);
                    alert('Error al analizar imagen');
                } finally {
                    setIsScanning(false);
                }
            };
        } catch (err) {
            console.error(err);
            setIsScanning(false);
        }
    };


    const handleFormSubmit = async (data: Omit<Supplier, 'id'>) => {
        if (!activeOutletId) {
            alert("Por favor, selecciona una cocina activa.");
            return;
        }

        setIsSubmitting(true);
        try {
            const supplierData = {
                ...data,
                outletId: activeOutletId
            };

            if (editingSupplier) {
                await proveedoresService.update(editingSupplier.id, supplierData);
                updateSupplier({ ...editingSupplier, ...supplierData } as Supplier);
            } else {
                const newId = await proveedoresService.create(supplierData);
                addSupplier({ id: newId, ...supplierData } as Supplier);
            }
            handleCloseModal();
        } catch (error) {
            console.error("Error saving supplier:", error);
            alert("Error al guardar el proveedor. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Estás seguro de eliminar a ${name}?`)) return;

        try {
            await proveedoresService.delete(id);
            deleteSupplier(id);
        } catch (error) {
            console.error("Error deleting supplier:", error);
            alert("Error al eliminar el proveedor.");
        }
    };

    // Ingredients Modal Logic helpers
    const handleViewIngredients = (supplier: Supplier) => {
        setViewingIngredientsSupplier(supplier);
        setExpandedIngredientId(null);
    };

    const closeIngredientsModal = () => {
        setViewingIngredientsSupplier(null);
    };

    const toggleIngredientHistory = (ingId: string) => {
        setExpandedIngredientId(prev => prev === ingId ? null : ingId);
    };

    // Derived state for modal
    const supplierIngredients = viewingIngredientsSupplier
        ? ingredients.filter(i => i.supplierId === viewingIngredientsSupplier.id)
        : [];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Proveedores</h2>
                    <p className="text-gray-600">Gestión de proveedores y contactos</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 bg-purple-500/20 text-purple-400 border border-purple-500/50 px-4 py-2 rounded-lg hover:bg-purple-500/30 transition-colors"
                        >
                            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                            <span>{isScanning ? 'Analizando...' : 'Escanear Tarjeta'}</span>
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleScanUpload}
                            className="hidden"
                            accept="image/*"
                        />

                        <ExcelImporter onImport={handleImport} />
                        <button
                            onClick={handleClearData}
                            disabled={isDeletingAll}
                            className="flex items-center gap-2 bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>{isDeletingAll ? 'Borrando...' : 'Borrar Todo'}</span>
                        </button>
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nuevo Proveedor</span>
                        </button>
                    </div>
                </div>
            </div>

            <ProveedoresList
                suppliers={suppliers}
                onEdit={handleOpenModal}
                onDelete={handleDelete}
                onViewIngredients={handleViewIngredients}
            />

            {/* Modal: Edit/Create Supplier */}
            {isModalOpen && (
                <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">
                            {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                        </h3>
                        <ProveedorForm
                            initialData={initialFormData}
                            onSubmit={handleFormSubmit}
                            onCancel={handleCloseModal}
                            isSubmitting={isSubmitting}
                        />
                    </div>
                </div>
            )}

            {/* Modal: View Ingredients & History (Ideally move to separate component too) */}
            {viewingIngredientsSupplier && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">
                                    Productos Suministrados
                                </h3>
                                <p className="text-gray-600">{viewingIngredientsSupplier.name}</p>
                            </div>
                            <button onClick={closeIngredientsModal} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        {supplierIngredients.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">Este proveedor no tiene productos asignados actualmente.</p>
                        ) : (
                            <div className="space-y-4">
                                {supplierIngredients.map(ingredient => (
                                    <div key={ingredient.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div
                                            className="flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                                            onClick={() => toggleIngredientHistory(ingredient.id)}
                                        >
                                            <div>
                                                <h4 className="font-semibold text-gray-800">{ingredient.name}</h4>
                                                <p className="text-sm text-gray-500">
                                                    Actual: {ingredient.costPerUnit}€ / {ingredient.unit}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <span className="text-xs font-medium">Historial</span>
                                                {expandedIngredientId === ingredient.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </div>
                                        </div>

                                        {expandedIngredientId === ingredient.id && (
                                            <div className="p-4 bg-white border-t border-gray-200">
                                                {(!ingredient.priceHistory || ingredient.priceHistory.length === 0) ? (
                                                    <p className="text-sm text-gray-500 italic">No hay historial de precios registrado.</p>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm text-left">
                                                            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                                                <tr>
                                                                    <th className="px-3 py-2">Fecha</th>
                                                                    <th className="px-3 py-2">Precio</th>
                                                                    <th className="px-3 py-2">Cambio</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {[...ingredient.priceHistory].reverse().map((entry, idx) => (
                                                                    <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                                                                        <td className="px-3 py-2 text-gray-600">
                                                                            {new Date(entry.date).toLocaleDateString()}
                                                                        </td>
                                                                        <td className="px-3 py-2 font-medium text-gray-800">
                                                                            {entry.price}€
                                                                        </td>
                                                                        <td className="px-3 py-2 text-gray-500">
                                                                            {entry.changeReason || '-'}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={closeIngredientsModal}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
