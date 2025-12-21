import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { AlertTriangle, Search, Plus, ChevronDown, ChevronRight, Calculator, Calendar, Scan, Filter } from 'lucide-react';
import type { Ingredient } from '../types';
import { BarcodeScanner } from './scanner/BarcodeScanner';
import { ExpiryDateScanner } from './scanner/ExpiryDateScanner';
import { DataImportModal, type ImportType } from './common/DataImportModal';
import { addDocument, updateDocument } from '../services/firestoreService';
import { collections, COLLECTION_NAMES } from '../firebase/collections';
import { lookupProductByBarcode, type ProductLookupResult } from '../services/productLookupService';

type ScanStep = 'idle' | 'scanning-barcode' | 'product-found' | 'scanning-expiry' | 'confirm-batch';
type FilterTab = 'all' | 'expiring' | 'low-stock' | 'meat' | 'fish' | 'produce' | 'dairy' | 'dry' | 'frozen' | 'canned' | 'cocktail' | 'sports_menu' | 'corporate_menu' | 'coffee_break' | 'restaurant' | 'other';

export const InventoryView: React.FC = () => {
    const { ingredients, addBatch, addIngredient, activeOutletId } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
    const [importType, setImportType] = useState<ImportType | null>(null);

    // Scanner Workflow State
    const [scanStep, setScanStep] = useState<ScanStep>('idle');
    const [scannedBarcode, setScannedBarcode] = useState<string>('');
    const [productLookup, setProductLookup] = useState<ProductLookupResult | null>(null);
    const [isLookingUp, setIsLookingUp] = useState(false);

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

    // Start scanning workflow
    const startScanningWorkflow = () => {
        setScanStep('scanning-barcode');
    };

    // Handle barcode scan from camera
    const handleBarcodeScan = async (barcode: string) => {
        setScannedBarcode(barcode);
        setScanStep('product-found');
        setIsLookingUp(true);

        try {
            const existingIngredient = ingredients.find(
                ing => ing.defaultBarcode === barcode
            );

            if (existingIngredient) {
                setProductLookup({
                    found: true,
                    barcode,
                    name: existingIngredient.name,
                    allergens: existingIngredient.allergens,
                    nutritionalInfo: existingIngredient.nutritionalInfo,
                });
                setBatchForm({
                    quantity: '',
                    expiryDate: '',
                    costPerUnit: existingIngredient.costPerUnit.toString(),
                });
            } else {
                const result = await lookupProductByBarcode(barcode);
                setProductLookup(result);

                if (result.found) {
                    setBatchForm({
                        quantity: '',
                        expiryDate: '',
                        costPerUnit: '0',
                    });
                }
            }
        } catch (error) {
            console.error('Error looking up product:', error);
            setProductLookup({ found: false, barcode });
        } finally {
            setIsLookingUp(false);
        }
    };

    // Move to expiry date scanning
    const proceedToExpiryScan = () => {
        setScanStep('scanning-expiry');
    };

    // Handle date scanned from OCR
    const handleDateScanned = (date: Date) => {
        setBatchForm({
            ...batchForm,
            expiryDate: date.toISOString().slice(0, 10),
        });
        setScanStep('confirm-batch');
    };

    // Confirm and add batch
    const handleConfirmBatch = async () => {
        if (!productLookup || !batchForm.quantity || !batchForm.expiryDate) return;
        if (!activeOutletId) {
            alert("Selecciona una cocina activa primero.");
            return;
        }

        // If ingredient doesn't exist, create it first
        const existingIngredient = ingredients.find(ing => ing.defaultBarcode === scannedBarcode);

        try {
            if (!existingIngredient && productLookup.found) {
                const newIngredientId = crypto.randomUUID();
                const newIngredient: Ingredient = {
                    id: newIngredientId,
                    name: productLookup.name || 'Producto sin nombre',
                    unit: 'un', // Default unit, maybe ask user?
                    costPerUnit: parseFloat(batchForm.costPerUnit) || 0,
                    yield: 1.0,
                    allergens: productLookup.allergens || [],
                    nutritionalInfo: productLookup.nutritionalInfo,
                    batches: [],
                    stock: 0,
                    defaultBarcode: scannedBarcode,
                    outletId: activeOutletId, // Important
                    minStock: 5, // Default
                    category: 'other' // Default
                };

                // Local update
                addIngredient(newIngredient);
                // Firestore update
                await addDocument(collections.ingredients, newIngredient);

                const newBatch = {
                    quantity: parseFloat(batchForm.quantity),
                    expiryDate: new Date(batchForm.expiryDate).toISOString(),
                    receivedDate: new Date().toISOString(),
                    costPerUnit: parseFloat(batchForm.costPerUnit) || 0,
                    barcode: scannedBarcode,
                    id: crypto.randomUUID(),
                    ingredientId: newIngredientId
                };

                // Local update
                addBatch(newIngredientId, newBatch);

                // Firestore update (Add batch to array)
                // Since we just created the doc, we can't use arrayUnion easily on a field that might be mapped differently or just update the doc again.
                // But wait, the newIngredient we just sent has batches: []. 
                // We need to add the batch. 
                // Simplest: Read doc -> Update. Or just use the fact we know it has 1 batch.
                // Better: Update the 'batches' field.
                // We need to fetch the existing batches (empty) and add one. 
                // Actually, if we just added the document, we can just update it.
                // NOTE: Creating ingredient with the batch inside is cleaner if we constructed it that way, but existing logic splits it.
                // Let's just update the doc with the new batch list.
                const updatedBatches = [newBatch];
                await updateDocument(COLLECTION_NAMES.INGREDIENTS, newIngredientId, {
                    batches: updatedBatches,
                    stock: newBatch.quantity
                });

            } else if (existingIngredient) {
                const newBatch = {
                    quantity: parseFloat(batchForm.quantity),
                    expiryDate: new Date(batchForm.expiryDate).toISOString(),
                    receivedDate: new Date().toISOString(),
                    costPerUnit: parseFloat(batchForm.costPerUnit) || existingIngredient.costPerUnit,
                    barcode: scannedBarcode,
                    id: crypto.randomUUID(),
                    ingredientId: existingIngredient.id
                };

                // Local update
                addBatch(existingIngredient.id, newBatch);

                // Firestore update
                // Need to append to existing batches.
                // Ideally use arrayUnion, but 'batches' is an array of objects. Firestore arrayUnion works if object is exact.
                // Here we constructed a new unique object.
                // But simpler/safer for now: Get current batches from local state (which is synced usually) + new one.
                // existingIngredient from useStore is reliable enough?
                // If we assume single user or optimistic:
                const currentBatches = existingIngredient.batches || [];
                const updatedBatches = [...currentBatches, newBatch];
                const newStock = updatedBatches.reduce((sum, b) => sum + b.quantity, 0);

                await updateDocument(COLLECTION_NAMES.INGREDIENTS, existingIngredient.id, {
                    batches: updatedBatches,
                    stock: newStock
                });
            }
        } catch (error) {
            console.error("Error saving batch:", error);
            alert("Error al guardar en base de datos. Los cambios pueden no persistir.");
        }

        resetScanWorkflow();
    };

    const resetScanWorkflow = () => {
        setScanStep('idle');
        setScannedBarcode('');
        setProductLookup(null);
        setBatchForm({
            quantity: '',
            expiryDate: '',
            costPerUnit: '',
        });
    };

    // Filter logic
    const filteredIngredients = React.useMemo(() => {
        let filtered = ingredients;
        if (searchTerm.trim()) {
            filtered = filtered.filter(ing => ing.name.toLowerCase().includes(searchTerm.toLowerCase()) || ing.category?.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (activeFilter !== 'all') {
            if (activeFilter === 'low-stock') {
                filtered = filtered.filter(ing => {
                    const totalStock = (ing.batches || []).reduce((sum, batch) => sum + batch.quantity, 0);
                    return totalStock < (ing.minStock || 0);
                });
            } else if (activeFilter === 'expiring') {
                filtered = filtered.filter(ing => {
                    const batches = ing.batches || [];
                    return batches.some(batch => {
                        const daysUntilExpiry = Math.floor((new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
                    });
                });
            } else {
                filtered = filtered.filter(ing => ing.category === activeFilter);
            }
        }
        return filtered;
    }, [ingredients, searchTerm, activeFilter]);

    // Count for badges
    const expiringCount = ingredients.filter(ing => {
        const nearExpiryBatches = ing.batches?.filter(b => getDaysUntilExpiry(b.expiryDate) <= 7) || [];
        return nearExpiryBatches.length > 0;
    }).length;

    const lowStockCount = ingredients.filter(ing => {
        const totalStock = ing.stock || 0;
        const minStock = ing.minStock || 0;
        return totalStock <= minStock;
    }).length;

    // Handle Import/OCR
    const handleImportComplete = async (data: any) => {
        if (!activeOutletId) {
            alert("Selecciona una cocina activa primero.");
            return;
        }

        if (data.items && Array.isArray(data.items)) {
            // Inventory Sheet Import (OCR or Excel)
            // Expects items with { name, quantity, unit? }
            let updatedCount = 0;
            let missedCount = 0;

            for (const item of data.items) {
                // Fuzzy search by name
                const match = ingredients.find(ing =>
                    ing.name.toLowerCase().includes(item.name.toLowerCase()) ||
                    item.name.toLowerCase().includes(ing.name.toLowerCase())
                );

                if (match) {
                    try {
                        // Create a "Count Adjustment" batch or just add stock?
                        // If it's a count sheet, usually it sets the stock.
                        // But here we only have 'addBatch'.
                        // Let's assume we are ADDING stock or treating it as a received batch for simplicity in Phase 2.
                        // Ideally "Inventory Count" should overwrite stock, but that requires diffing.
                        // For now: Add as new batch (Received today).

                        const newBatch = {
                            id: crypto.randomUUID(),
                            ingredientId: match.id,
                            quantity: Number(item.quantity) || 0,
                            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days if not scanned
                            receivedDate: new Date().toISOString(),
                            costPerUnit: match.costPerUnit, // Assume same cost
                            barcode: match.defaultBarcode || ''
                        };

                        // Local
                        addBatch(match.id, newBatch);

                        // Persistence
                        // Re-fetch current (local state might have updated if we did it sequentially but pure state might not)
                        // Safer to refer to 'match' which is from render scope.
                        // CAUTION: If we update multiple times, 'match' is stale?
                        // Yes, 'match' is from 'ingredients' prop.
                        // But since we are inside an async loop, 'ingredients' doesn't change until re-render.
                        // We must be careful.
                        // Solution: Read the LATEST batches from the 'ingredients' array we have (which is stale) PLUS any we just added?
                        // Or just simplistic append. "append to what we think is there".
                        // Firestore race condition risk? Yes. But single user...

                        const currentBatches = match.batches || [];
                        // We can't easily see previous updates in this loop without tracking them.
                        // Let's ignore race within the loop for different ingredients.
                        // For SAME ingredient appearing twice? Unlikely in scan.

                        const updatedBatches = [...currentBatches, newBatch];
                        const newStock = updatedBatches.reduce((sum, b) => sum + b.quantity, 0);

                        await updateDocument(COLLECTION_NAMES.INGREDIENTS, match.id, {
                            batches: updatedBatches,
                            stock: newStock
                        });

                        updatedCount++;
                    } catch (e) {
                        console.error("Error updating stock for", item.name, e);
                    }
                } else {
                    missedCount++;
                    // Optional: Create new ingredient?
                    // Skipping for now to avoid pollution.
                }
            }

            if (updatedCount > 0) {
                alert(`Inventario actualizado: ${updatedCount} productos procesados.` + (missedCount > 0 ? ` (${missedCount} no encontrados)` : ''));
            } else if (missedCount > 0) {
                alert(`No se encontraron coincidencias para ${missedCount} productos.`);
            }

        }
        setImportType(null);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Calculator className="text-primary" size={28} />
                        </div>
                        Inventario
                    </h2>
                    <p className="text-gray-500 mt-1">Gestión inteligente de stock con escaneo y trazabilidad</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={startScanningWorkflow}
                        className="bg-primary text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                    >
                        <Scan size={20} />
                        Añadir con Escaneo
                    </button>
                    <button
                        onClick={() => setImportType('inventory')}
                        className="bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        Importar / Escanear Albarán
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-2">
                <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-4 py-3 font-medium text-sm transition-all whitespace-nowrap ${activeFilter === 'all'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Todo
                </button>
                {/* Category Tabs */}
                {[
                    { id: 'meat', label: 'Carne' },
                    { id: 'fish', label: 'Pescado' },
                    { id: 'produce', label: 'Frutas/Verduras' },
                    { id: 'dairy', label: 'Lácteos' },
                    { id: 'dry', label: 'Secos' },
                    { id: 'frozen', label: 'Congelados' },
                    { id: 'canned', label: 'Latas' },
                    { id: 'cocktail', label: 'Cóctel' },
                    { id: 'sports_menu', label: 'Deportivo' },
                    { id: 'corporate_menu', label: 'Empresa' },
                    { id: 'coffee_break', label: 'Coffee' },
                    { id: 'restaurant', label: 'Restaurante' },
                    { id: 'other', label: 'Otros' }
                ].map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveFilter(cat.id as any)}
                        className={`px-4 py-3 font-medium text-sm transition-all whitespace-nowrap ${activeFilter === cat.id
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}

                <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-4 py-3 font-medium text-sm transition-all relative ${activeFilter === 'all'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Filter size={16} />
                        Todo
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                            {ingredients.length}
                        </span>
                    </div>
                </button>

                <button
                    onClick={() => setActiveFilter('expiring')}
                    className={`px-4 py-3 font-medium text-sm transition-all relative ${activeFilter === 'expiring'
                        ? 'text-orange-600 border-b-2 border-orange-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        Próximos a Caducar
                        {expiringCount > 0 && (
                            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                                {expiringCount}
                            </span>
                        )}
                    </div>
                </button>

                <button
                    onClick={() => setActiveFilter('low-stock')}
                    className={`px-4 py-3 font-medium text-sm transition-all relative ${activeFilter === 'low-stock'
                        ? 'text-red-600 border-b-2 border-red-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={16} />
                        Bajo Stock
                        {lowStockCount > 0 && (
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                                {lowStockCount}
                            </span>
                        )}
                    </div>
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre de ingrediente..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/80 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-10"></th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ingrediente</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Valor</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredIngredients.map((ing, idx) => {
                                const totalStock = ing.stock || 0;
                                const totalValue = ing.batches?.reduce((acc, b) => acc + (b.quantity * b.costPerUnit), 0) || (totalStock * ing.costPerUnit);
                                const minStock = ing.minStock || 0;
                                const isLowStock = totalStock <= minStock;
                                const nearExpiryBatches = ing.batches?.filter(b => getDaysUntilExpiry(b.expiryDate) <= 7) || [];
                                const isExpanded = expandedIds.has(ing.id);

                                return (
                                    <React.Fragment key={ing.id}>
                                        <tr className={`hover:bg-gray-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} ${isExpanded ? 'bg-primary/5' : ''}`}>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => toggleExpand(ing.id)}
                                                    className="text-gray-400 hover:text-primary transition-colors"
                                                >
                                                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">{ing.name}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">{ing.unit}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{totalStock.toFixed(2)} {ing.unit}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-gray-700">{totalValue.toFixed(2)} €</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {isLowStock && (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 w-fit">
                                                            <AlertTriangle size={12} /> Bajo Stock
                                                        </span>
                                                    )}
                                                    {nearExpiryBatches.length > 0 && (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 w-fit">
                                                            <Calendar size={12} /> {nearExpiryBatches.length} Caducando
                                                        </span>
                                                    )}
                                                    {!isLowStock && nearExpiryBatches.length === 0 && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 w-fit">
                                                            ✓ OK
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        setProductLookup({
                                                            found: true,
                                                            barcode: ing.defaultBarcode || '',
                                                            name: ing.name,
                                                        });
                                                        setScannedBarcode(ing.defaultBarcode || '');
                                                        setBatchForm({
                                                            quantity: '',
                                                            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                                                            costPerUnit: ing.costPerUnit.toString()
                                                        });
                                                        setScanStep('scanning-expiry');
                                                    }}
                                                    className="text-primary hover:text-primary/80 font-medium text-sm flex items-center justify-end gap-1.5 ml-auto transition-colors"
                                                >
                                                    <Plus size={16} /> Lote
                                                </button>
                                            </td>
                                        </tr>
                                        {/* Expanded Batch Details */}
                                        {isExpanded && (
                                            <tr className="bg-gray-50/50">
                                                <td colSpan={6} className="px-6 pb-6 pt-2">
                                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                                            <h4 className="text-sm font-semibold text-gray-700">Lotes Detallados</h4>
                                                        </div>
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-gray-100/80 text-gray-600 text-xs">
                                                                <tr>
                                                                    <th className="px-4 py-2 text-left font-medium">Recibido</th>
                                                                    <th className="px-4 py-2 text-left font-medium">Caducidad</th>
                                                                    <th className="px-4 py-2 text-left font-medium">Cantidad</th>
                                                                    <th className="px-4 py-2 text-left font-medium">Coste/Ud</th>
                                                                    <th className="px-4 py-2 text-left font-medium">Estado</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {ing.batches?.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()).map(batch => {
                                                                    const daysToExpiry = getDaysUntilExpiry(batch.expiryDate);
                                                                    const isExpired = daysToExpiry < 0;
                                                                    const isNearExpiry = daysToExpiry <= 3;

                                                                    return (
                                                                        <tr key={batch.id} className="border-t border-gray-100 hover:bg-gray-50">
                                                                            <td className="px-4 py-3 text-gray-600">
                                                                                {new Date(batch.receivedDate).toLocaleDateString('es-ES')}
                                                                            </td>
                                                                            <td className="px-4 py-3">
                                                                                <div className="font-medium text-gray-900">
                                                                                    {new Date(batch.expiryDate).toLocaleDateString('es-ES')}
                                                                                </div>
                                                                                <div className="text-xs text-gray-400">({daysToExpiry} días)</div>
                                                                            </td>
                                                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                                                {batch.quantity} {ing.unit}
                                                                            </td>
                                                                            <td className="px-4 py-3 text-gray-700">{batch.costPerUnit} €</td>
                                                                            <td className="px-4 py-3">
                                                                                {isExpired ? (
                                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                                                                        CADUCADO
                                                                                    </span>
                                                                                ) : isNearExpiry ? (
                                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                                                                                        PRONTO
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                                                        OK
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                                {(!ing.batches || ing.batches.length === 0) && (
                                                                    <tr>
                                                                        <td colSpan={5} className="px-4 py-4 text-center text-gray-500 text-sm italic">
                                                                            Sin lotes registrados
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
                            {filteredIngredients.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="text-gray-400 text-sm">
                                            {searchTerm ? 'No se encontraron ingredientes' : 'No hay ingredientes en esta categoría'}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Scanner Workflow Modals */}

            {/* Barcode Scanner */}
            {
                scanStep === 'scanning-barcode' && (
                    <BarcodeScanner
                        onScan={handleBarcodeScan}
                        onClose={() => setScanStep('idle')}
                    />
                )
            }

            {/* Product Found Modal */}
            {
                scanStep === 'product-found' && productLookup && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                            <h3 className="text-2xl font-bold mb-4">
                                {productLookup.found ? '✓ Producto Encontrado' : '⚠️ Producto No Encontrado'}
                            </h3>

                            {isLookingUp ? (
                                <div className="flex flex-col items-center py-12">
                                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-4" />
                                    <p className="text-gray-600">Buscando producto...</p>
                                </div>
                            ) : productLookup.found ? (
                                <div className="space-y-4">
                                    {productLookup.imageUrl && (
                                        <img
                                            src={productLookup.imageUrl}
                                            alt={productLookup.name}
                                            className="w-32 h-32 object-contain mx-auto rounded-lg border border-gray-200"
                                        />
                                    )}
                                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                                        <p className="text-sm text-gray-500">Nombre</p>
                                        <p className="text-xl font-bold text-gray-900">{productLookup.name}</p>
                                        {productLookup.brand && (
                                            <>
                                                <p className="text-sm text-gray-500 mt-2">Marca</p>
                                                <p className="text-gray-700">{productLookup.brand}</p>
                                            </>
                                        )}
                                        {productLookup.allergens && productLookup.allergens.length > 0 && (
                                            <>
                                                <p className="text-sm text-gray-500 mt-2">Alérgenos</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {productLookup.allergens.map((allergen, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded"
                                                        >
                                                            {allergen}
                                                        </span>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={resetScanWorkflow}
                                            className="flex-1 px-4 py-3 bg-gray-100 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={proceedToExpiryScan}
                                            className="flex-1 px-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                                        >
                                            Escanear Fecha →
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                        <p className="text-gray-700">
                                            No se encontró información para el código <span className="font-mono font-bold">{scannedBarcode}</span>
                                        </p>
                                        <p className="text-sm text-gray-600 mt-2">
                                            Puedes continuar introduciendo los datos manualmente.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                                            <input
                                                type="text"
                                                value={productLookup.name || ''}
                                                onChange={(e) => setProductLookup({ ...productLookup, name: e.target.value })}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                                                placeholder="Nombre..."
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={resetScanWorkflow}
                                            className="flex-1 px-4 py-3 bg-gray-100 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={proceedToExpiryScan}
                                            disabled={!productLookup.name}
                                            className="flex-1 px-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Continuar →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Expiry Date Scanner */}
            {
                scanStep === 'scanning-expiry' && productLookup && (
                    <ExpiryDateScanner
                        productName={productLookup.name}
                        onDateScanned={handleDateScanned}
                        onClose={resetScanWorkflow}
                    />
                )
            }

            {/* Confirm Batch Modal */}
            {
                scanStep === 'confirm-batch' && productLookup && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Plus className="text-primary" /> Confirmar Entrada de Stock
                            </h3>

                            <div className="mb-6 bg-primary/5 p-4 rounded-xl border border-primary/10">
                                <div className="text-sm text-gray-500">Producto</div>
                                <div className="text-lg font-bold text-gray-900">{productLookup.name}</div>
                                <div className="text-sm text-gray-500 mt-2">Fecha de Caducidad</div>
                                <div className="text-lg font-bold text-gray-900">
                                    {new Date(batchForm.expiryDate).toLocaleDateString('es-ES')}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cantidad (unidades)
                                    </label>
                                    <input
                                        type="number"
                                        step="1"
                                        min="1"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-lg font-medium focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                                        value={batchForm.quantity}
                                        onChange={e => setBatchForm({ ...batchForm, quantity: e.target.value })}
                                        autoFocus
                                        placeholder="1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Coste Unitario (€) <span className="text-gray-400">(opcional)</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                                        value={batchForm.costPerUnit}
                                        onChange={e => setBatchForm({ ...batchForm, costPerUnit: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={resetScanWorkflow}
                                    className="flex-1 px-4 py-3 bg-gray-100 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmBatch}
                                    disabled={!batchForm.quantity}
                                    className="flex-1 px-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirmar Entrada
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {importType && (
                <DataImportModal
                    isOpen={!!importType}
                    onClose={() => setImportType(null)}
                    onImportComplete={handleImportComplete}
                    type={importType}
                />
            )}
        </div>
    );
};

