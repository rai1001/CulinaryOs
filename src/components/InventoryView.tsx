import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { AlertTriangle, Search, Barcode, Plus, ChevronDown, ChevronRight, Calculator, Calendar } from 'lucide-react';
import type { Ingredient } from '../types';

export const InventoryView: React.FC = () => {
    const { ingredients, addBatch } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Barcode Entry State
    const [barcodeInput, setBarcodeInput] = useState('');
    const [scannedIngredient, setScannedIngredient] = useState<Ingredient | null>(null);
    const [showBatchModal, setShowBatchModal] = useState(false);

    // Batch Form State
    const [batchForm, setBatchForm] = useState({
        quantity: '',
        expiryDate: '',
        costPerUnit: ''
    });

    // Determine alerts
    const getDaysUntilExpiry = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    };

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };

    // Handle Barcode Scan (Enter key)
    const handleBarcodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock lookup - In real app, search ingredients by barcode field
        // For now, let's treat the barcode input as a search term if no match, 
        // or if it matches a "defaultBarcode" (to be added to Ing type later properly)
        // For this demo, we'll just search by name or assume a dummy match for testing.

        const match = ingredients.find(ing => ing.defaultBarcode === barcodeInput || ing.name.toLowerCase() === barcodeInput.toLowerCase());

        if (match) {
            setScannedIngredient(match);

            // Pre-fill form
            const defaultExpiry = new Date();
            defaultExpiry.setDate(defaultExpiry.getDate() + 7); // Default 1 week

            setBatchForm({
                quantity: '',
                expiryDate: defaultExpiry.toISOString().slice(0, 10),
                costPerUnit: match.costPerUnit.toString()
            });
            setShowBatchModal(true);
        } else {
            // Suggest creating new or searching
            setSearchTerm(barcodeInput);
            // Optionally show toast "Barcode not found, filtering list..."
        }
        setBarcodeInput('');
    };

    const handleAddBatch = () => {
        if (!scannedIngredient || !batchForm.quantity || !batchForm.expiryDate) return;

        addBatch(scannedIngredient.id, {
            quantity: parseFloat(batchForm.quantity),
            expiryDate: new Date(batchForm.expiryDate).toISOString(),
            receivedDate: new Date().toISOString(),
            costPerUnit: parseFloat(batchForm.costPerUnit) || scannedIngredient.costPerUnit,
            barcode: barcodeInput || undefined
        });

        setShowBatchModal(false);
        setScannedIngredient(null);
    };

    const filteredIngredients = ingredients.filter(ing =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Calculator className="text-primary" /> Inventario Inteligente
                    </h2>
                    <p className="text-gray-600">Gestión por Lotes, Caducidades y Código de Barras</p>
                </div>

                {/* Barcode Scanner Input */}
                <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Barcode className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            className="bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-64 pl-10 p-2.5 shadow-sm"
                            placeholder="Escanear producto..."
                            autoFocus
                        />
                    </div>
                </form>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Filtrar por nombre..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 w-10"></th>
                                <th className="px-6 py-4">Ingrediente</th>
                                <th className="px-6 py-4">Total Stock</th>
                                <th className="px-6 py-4">Valor Total</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredIngredients.map(ing => {
                                const totalStock = ing.stock || 0; // Calculated in store
                                const totalValue = ing.batches?.reduce((acc, b) => acc + (b.quantity * b.costPerUnit), 0) || (totalStock * ing.costPerUnit);
                                const minStock = ing.minStock || 0;
                                const isLowStock = totalStock <= minStock;
                                const nearExpiryBatches = ing.batches?.filter(b => getDaysUntilExpiry(b.expiryDate) <= 3) || [];
                                const isExpanded = expandedIds.has(ing.id);

                                return (
                                    <React.Fragment key={ing.id}>
                                        <tr className={`hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <button onClick={() => toggleExpand(ing.id)} className="text-gray-400 hover:text-primary">
                                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{ing.name}</div>
                                                <div className="text-xs text-gray-500">{ing.unit}</div>
                                            </td>
                                            <td className="px-6 py-4 font-medium">
                                                {totalStock.toFixed(2)} {ing.unit}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {totalValue.toFixed(2)} €
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {isLowStock && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 w-fit">
                                                            <AlertTriangle size={12} /> Bajo Stock
                                                        </span>
                                                    )}
                                                    {nearExpiryBatches.length > 0 && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 w-fit">
                                                            <Calendar size={12} /> {nearExpiryBatches.length} Caducando
                                                        </span>
                                                    )}
                                                    {!isLowStock && nearExpiryBatches.length === 0 && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 w-fit">
                                                            OK
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        setScannedIngredient(ing);
                                                        setBatchForm({
                                                            quantity: '',
                                                            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                                                            costPerUnit: ing.costPerUnit.toString()
                                                        });
                                                        setShowBatchModal(true);
                                                    }}
                                                    className="text-primary hover:text-primary/80 font-medium text-sm flex items-center justify-end gap-1"
                                                >
                                                    <Plus size={16} /> Lote
                                                </button>
                                            </td>
                                        </tr>
                                        {/* Expanded Batch Details */}
                                        {isExpanded && (
                                            <tr className="bg-gray-50/50">
                                                <td colSpan={6} className="px-6 pb-6 pt-2">
                                                    <div className="bg-white rounded border border-gray-200 overflow-hidden">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-gray-100 text-gray-500 text-xs">
                                                                <tr>
                                                                    <th className="px-4 py-2 text-left">Recibido</th>
                                                                    <th className="px-4 py-2 text-left">Caducidad</th>
                                                                    <th className="px-4 py-2 text-left">Cantidad</th>
                                                                    <th className="px-4 py-2 text-left">Coste/Ud</th>
                                                                    <th className="px-4 py-2 text-left">Estado</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {ing.batches?.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()).map(batch => {
                                                                    const daysToExpiry = getDaysUntilExpiry(batch.expiryDate);
                                                                    const isExpired = daysToExpiry < 0;
                                                                    const isNearExpiry = daysToExpiry <= 3;

                                                                    return (
                                                                        <tr key={batch.id} className="border-t border-gray-100">
                                                                            <td className="px-4 py-2 text-gray-600">
                                                                                {new Date(batch.receivedDate).toLocaleDateString()}
                                                                            </td>
                                                                            <td className="px-4 py-2 font-medium">
                                                                                {new Date(batch.expiryDate).toLocaleDateString()}
                                                                                <span className="text-xs text-gray-400 font-normal ml-2">({daysToExpiry} días)</span>
                                                                            </td>
                                                                            <td className="px-4 py-2">{batch.quantity} {ing.unit}</td>
                                                                            <td className="px-4 py-2">{batch.costPerUnit} €</td>
                                                                            <td className="px-4 py-2">
                                                                                {isExpired ? (
                                                                                    <span className="text-red-500 font-bold text-xs">CADUCADO</span>
                                                                                ) : isNearExpiry ? (
                                                                                    <span className="text-orange-500 font-bold text-xs">PRONTO</span>
                                                                                ) : (
                                                                                    <span className="text-green-500 text-xs">OK</span>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                                {(!ing.batches || ing.batches.length === 0) && (
                                                                    <tr>
                                                                        <td colSpan={5} className="px-4 py-3 text-center text-gray-500 italic">
                                                                            Sin lotes registrados (Stock heredado o cero)
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Batch Modal */}
            {showBatchModal && scannedIngredient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Plus className="text-primary" /> Entrada de Stock
                        </h3>

                        <div className="mb-6 bg-primary/5 p-4 rounded-xl border border-primary/10">
                            <div className="text-sm text-gray-500">Producto</div>
                            <div className="text-lg font-bold text-gray-900">{scannedIngredient.name}</div>
                            <div className="text-xs text-gray-500">{scannedIngredient.unit}</div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad ({scannedIngredient.unit})</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-lg font-medium focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                                    value={batchForm.quantity}
                                    onChange={e => setBatchForm({ ...batchForm, quantity: e.target.value })}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Caducidad</label>
                                <input
                                    type="date"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                                    value={batchForm.expiryDate}
                                    onChange={e => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Coste Unitario (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                                    value={batchForm.costPerUnit}
                                    onChange={e => setBatchForm({ ...batchForm, costPerUnit: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowBatchModal(false)}
                                className="flex-1 px-4 py-3 bg-gray-100 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddBatch}
                                disabled={!batchForm.quantity || !batchForm.expiryDate}
                                className="flex-1 px-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
                            >
                                Confirmar Entrada
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
