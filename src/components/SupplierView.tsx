import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Edit2, Phone, Mail, Truck, ChevronDown, ChevronUp, History, Trash2, Camera, Loader2 } from 'lucide-react';
import type { Supplier } from '../types';
import { addDocument, updateDocument, deleteDocument } from '../services/firestoreService';
import { collections } from '../firebase/collections';

import { ExcelImporter } from './common/ExcelImporter';

export const SupplierView: React.FC = () => {
    const { suppliers, addSupplier, updateSupplier, deleteSupplier, ingredients, activeOutletId } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Ingredient View State
    const [viewingIngredientsSupplier, setViewingIngredientsSupplier] = useState<Supplier | null>(null);
    const [expandedIngredientId, setExpandedIngredientId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Supplier>>({
        name: '',
        contactName: '',
        email: '',
        phone: '',
        leadTime: 1,
        orderDays: [],
        minimumOrderValue: 0
    });

    const parseLeadTime = (value: any): number => {
        if (!value) return 1;
        const str = String(value).toUpperCase();
        if (str.includes('24H')) return 1;
        if (str.includes('48H')) return 2;
        if (str.includes('72H')) return 3;
        // Try parsing number
        const num = parseFloat(str);
        return isNaN(num) ? 1 : num;
    };

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
                    leadTime: parseLeadTime(row['Entrega'] || row['LeadTime'] || row['REPARTO']),
                    orderDays: [], // Could parse 'LUNES Y VIERNES' later if needed
                    minimumOrderValue: Number(row['Minimo'] || row['PEDIDO MINIMO'] || 0),
                    outletId: activeOutletId
                };

                const normalizedName = String(name).toLowerCase();
                const existing = suppliers.find(s => s.name.toLowerCase() === normalizedName);
                if (existing) {
                    console.log(`Skipping duplicate supplier: ${name}`);
                    continue;
                }

                await addDocument(collections.suppliers, supplierData);
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
            setFormData(supplier);
        } else {
            setEditingSupplier(null);
            setFormData({
                name: '',
                contactName: '',
                email: '',
                phone: '',
                leadTime: 1,
                orderDays: [],
                minimumOrderValue: 0
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSupplier(null);
        setIsSubmitting(false);
    };

    // OCR / Auto-create for Suppliers
    // Re-using InvoiceUploader but strictly for extracting Supplier Info would be ideal,
    // but for now we can use the same generic 'scan' and just pick the supplier part.
    // Or simpler: Just add a "Scan Business Card" button that mocks or uses geminiService directly.

    // For this quick fix, I will enable the ExcelImporter to be more visible and add a placeholder for Scan,
    // as the user specifically asked for OCR.

    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { addToast } = (window as any).toast || { addToast: console.log }; // Fallback if hook not available directly or import needed

    const handleScanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        setIsScanning(true);

        try {
            // We can reuse the scanInvoiceImage from geminiService as it extracts supplier names well.
            // Or create a specific scanSupplierCard. For now, use existing infra.
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                try {
                    const base64 = (reader.result as string).split(',')[1];
                    // We'll import scanInvoiceImage dynamically or assume it's available if we import it.
                    // But let's use a specialized prompt here for better results on just contact cards.
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
                        setFormData({
                            name: s.name || '',
                            contactName: s.contactName || '',
                            email: s.email || '',
                            phone: s.phone || '',
                            leadTime: 1,
                            minimumOrderValue: 0,
                            orderDays: []
                        });
                        setIsModalOpen(true); // Open modal with pre-filled data
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


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeOutletId) {
            alert("Por favor, selecciona una cocina activa.");
            return;
        }

        setIsSubmitting(true);
        try {
            const supplierData = {
                ...formData,
                outletId: activeOutletId
            };

            if (editingSupplier) {
                // Update existing
                await updateDocument('suppliers', editingSupplier.id, supplierData);
                updateSupplier({ ...editingSupplier, ...supplierData } as Supplier);
            } else {
                // Create new
                // addDocument returns the generated ID (string)
                const newId = await addDocument(collections.suppliers, supplierData);
                const newSupplier: Supplier = {
                    id: newId,
                    ...supplierData as Omit<Supplier, 'id'>
                } as Supplier;
                addSupplier(newSupplier);
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
            await deleteDocument('suppliers', id);
            deleteSupplier(id);
        } catch (error) {
            console.error("Error deleting supplier:", error);
            alert("Error al eliminar el proveedor.");
        }
    };

    const toggleDay = (day: number) => {
        const currentDays = formData.orderDays || [];
        if (currentDays.includes(day)) {
            setFormData({ ...formData, orderDays: currentDays.filter(d => d !== day) });
        } else {
            setFormData({ ...formData, orderDays: [...currentDays, day].sort() });
        }
    };

    const handleViewIngredients = (supplier: Supplier) => {
        setViewingIngredientsSupplier(supplier);
        setExpandedIngredientId(null);
    };

    const closeIngredientsModal = () => {
        setViewingIngredientsSupplier(null);
    };

    const toggleIngredientHistory = (ingId: string) => {
        if (expandedIngredientId === ingId) {
            setExpandedIngredientId(null);
        } else {
            setExpandedIngredientId(ingId);
        }
    };

    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nuevo Proveedor</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suppliers.map(supplier => (
                    <div key={supplier.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative group">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">{supplier.name}</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleOpenModal(supplier)}
                                    className="text-gray-400 hover:text-indigo-600 p-1 rounded-md hover:bg-indigo-50 transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(supplier.id, supplier.name)}
                                    className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 text-gray-600">
                            {supplier.contactName && (
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-700">{supplier.contactName}</span>
                                </div>
                            )}
                            {supplier.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone size={16} />
                                    <span>{supplier.phone}</span>
                                </div>
                            )}
                            {supplier.email && (
                                <div className="flex items-center gap-2">
                                    <Mail size={16} />
                                    <span>{supplier.email}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Truck size={16} />
                                <span>Entrega: {supplier.leadTime} días • Min: {supplier.minimumOrderValue || 0}€</span>
                            </div>

                            <div className="pt-2 border-t border-gray-100">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Días de Pedido</span>
                                <div className="flex gap-1 mt-1">
                                    {daysOfWeek.map((day, index) => (
                                        <span
                                            key={day}
                                            className={`text - xs px - 2 py - 1 rounded ${supplier.orderDays?.includes(index)
                                                ? 'bg-green-100 text-green-700 font-medium'
                                                : 'bg-gray-100 text-gray-400'
                                                } `}
                                        >
                                            {day[0]}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Ingredients List Button */}
                            <div className="pt-4 mt-2 border-t border-gray-100 text-center">
                                <button
                                    onClick={() => handleViewIngredients(supplier)}
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors flex items-center justify-center gap-2 mx-auto"
                                >
                                    <History size={16} />
                                    Ver Ingredientes & Histórico
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal: Edit/Create Supplier */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">
                            {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={formData.contactName}
                                        onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                    <input
                                        type="tel"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Días de Entrega (Lead Time)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.leadTime}
                                    onChange={e => setFormData({ ...formData, leadTime: parseInt(e.target.value) })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pedido Mínimo (€)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.minimumOrderValue || ''}
                                    onChange={e => setFormData({ ...formData, minimumOrderValue: parseFloat(e.target.value) })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Días de Pedido</label>
                                <div className="flex flex-wrap gap-2">
                                    {daysOfWeek.map((day, index) => (
                                        <button
                                            type="button"
                                            key={day}
                                            onClick={() => toggleDay(index)}
                                            className={`px - 3 py - 1 rounded - full text - xs font - medium transition - colors ${formData.orderDays?.includes(index)
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                } `}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: View Ingredients & History */}
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
