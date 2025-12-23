import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import Barcode from 'react-barcode';
import { X, Printer, Snowflake, Leaf, ThermometerSnowflake, Package } from 'lucide-react';
import type { Ingredient, IngredientBatch, Batch } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { firestoreService } from '../services/firestoreService';
import { COLLECTIONS } from '../firebase/collections';
import { collection } from 'firebase/firestore';
import { db } from '../firebase/config';

interface LabelPrinterModalProps {
    ingredient?: Ingredient;
    batch?: IngredientBatch; // Optional: if not provided, print generic item label or new batch
    onClose: () => void;
}

type LabelType = 'congelado' | 'fresco' | 'pasteurizado' | 'elaborado' | 'abatido';

export const LabelPrinterModal: React.FC<LabelPrinterModalProps> = ({ ingredient, batch, onClose }) => {
    const { activeOutletId, addIngredient } = useStore();
    const [selectedTypes, setSelectedTypes] = useState<LabelType[]>(['congelado']);
    const [expiryDate, setExpiryDate] = useState(
        batch?.expiresAt ? new Date(batch.expiresAt).toISOString().split('T')[0] :
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [customName, setCustomName] = useState('');
    const [quantity, setQuantity] = useState(batch?.currentQuantity?.toString() || '1');
    const printRef = useRef<HTMLDivElement>(null);

    const calculateExpiryDays = (types: LabelType[]): number => {
        if (types.includes('congelado')) return 90; // 3 months
        if (types.includes('pasteurizado')) return 21; // 21 days
        if (types.includes('abatido')) return 5; // 5 days
        return 3; // Default 3 days for fresh/elaborado
    };

    const toggleType = (type: LabelType) => {
        let newTypes = [];
        if (selectedTypes.includes(type)) {
            newTypes = selectedTypes.filter(t => t !== type);
        } else {
            newTypes = [...selectedTypes, type];
        }
        setSelectedTypes(newTypes);

        // Auto-calculate expiry based on the new selection
        const days = calculateExpiryDays(newTypes);
        const newDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        setExpiryDate(newDate.toISOString().split('T')[0]);
    };

    const getDominantColorClass = () => {
        if (selectedTypes.includes('congelado')) return { text: 'text-blue-600', border: 'border-blue-600', bg: 'bg-blue-500/20' };
        if (selectedTypes.includes('abatido')) return { text: 'text-cyan-600', border: 'border-cyan-500', bg: 'bg-cyan-500/20' };
        if (selectedTypes.includes('pasteurizado')) return { text: 'text-amber-500', border: 'border-amber-500', bg: 'bg-amber-500/20' };
        if (selectedTypes.includes('fresco')) return { text: 'text-emerald-600', border: 'border-emerald-600', bg: 'bg-emerald-500/20' };
        return { text: 'text-indigo-600', border: 'border-indigo-600', bg: 'bg-indigo-500/20' };
    };

    const getCombinedLabel = () => {
        if (selectedTypes.length === 0) return 'ETIQUETA';
        return selectedTypes.map(t => {
            switch (t) {
                case 'congelado': return 'CONGELADO';
                case 'fresco': return 'FRESCO';
                case 'pasteurizado': return 'PASTEURIZADO';
                case 'elaborado': return 'ELABORADO';
                case 'abatido': return 'ABATIDO';
                default: return '';
            }
        }).join(' + ');
    };

    // Use batch barcode or ingredient default or generate one
    const barcodeValue = batch?.barcode || ingredient?.defaultBarcode || `GEN-${Date.now().toString().slice(-8)}`;
    const colors = getDominantColorClass();

    const handlePrint = async () => {
        // Auto-create in inventory if simplified/ad-hoc mode
        if (!ingredient && customName && Number(quantity) > 0) {
            try {
                const newIngredientId = uuidv4();
                const newBatchId = uuidv4();
                const now = new Date().toISOString();

                // 1. Create the Batch Object
                const newBatch: Batch = {
                    id: newBatchId,
                    ingredientId: newIngredientId,
                    batchNumber: batch?.batchNumber || `LOT-${Date.now().toString().slice(-6)}`,
                    initialQuantity: Number(quantity),
                    currentQuantity: Number(quantity),
                    unit: 'un',
                    costPerUnit: 0,
                    receivedAt: now,
                    expiresAt: new Date(expiryDate).toISOString(),
                    outletId: activeOutletId || 'default',
                    status: 'ACTIVE',
                    barcode: barcodeValue
                };

                // 2. Create the Ingredient Object
                const newIngredient: Ingredient = {
                    id: newIngredientId,
                    name: customName,
                    unit: 'un',
                    costPerUnit: 0,
                    yield: 1,
                    allergens: [],
                    category: 'preparation',
                    stock: Number(quantity),
                    batches: [newBatch],
                    createdAt: now,
                    updatedAt: now,
                    outletId: activeOutletId || 'default'
                };

                // 3. Save to Firestore
                await firestoreService.create(collection(db, COLLECTIONS.INGREDIENTS), newIngredient);

                // 4. Update Local Store
                addIngredient(newIngredient);

                console.log('Created new preparation inventory item:', customName);
            } catch (error) {
                console.error("Error creating inventory item:", error);
            }
        }

        // Create a hidden iframe for printing
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const content = printRef.current?.innerHTML;
        if (!content || !iframe.contentWindow) return;

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
                <html>
                <head>
                <style>
                    @page {
                        size: 75mm 50mm;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 2mm;
                        font-family: sans-serif;
                    }
                    .label-container {
                        width: 75mm;
                        height: 50mm;
                        display: flex;
                        flex-direction: column;
                        box-sizing: border-box;
                        overflow: hidden;
                        border: 1px active border-black;
                        position: relative;
                    }
                    .header {
                        text-align: center;
                        font-weight: 900;
                        font-size: 10px;
                        text-transform: uppercase;
                        padding: 2px 0;
                        border-bottom: 2px solid black;
                        margin-bottom: 2px;
                        white-space: nowrap;
                    }
                    .header.congelado { border-color: #0088FE; color: #0088FE; }
                    .header.fresco { border-color: #00C49F; color: #00C49F; }
                    .header.pasteurizado { border-color: #FFBB28; color: #FFBB28; }
                    .header.elaborado { border-color: #8884d8; color: #8884d8; }
                    .header.abatido { border-color: #06b6d4; color: #06b6d4; }

                    .product-name {
                        font-size: 14px;
                        font-weight: 900;
                        margin-bottom: 2px;
                        line-height: 1.1;
                        max-height: 32px;
                        overflow: hidden;
                        text-transform: uppercase;
                    }

                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 2px;
                        font-size: 8px;
                        margin-bottom: 2px;
                    }
                    
                    .date-box {
                        display: flex;
                        justify-content: space-between;
                        border: 1px solid #ccc;
                        padding: 1px 3px;
                        border-radius: 2px;
                    }
                    
                    .meta-label { font-weight: bold; color: #444; }
                    .meta-val { font-weight: bold; }

                    .barcode-container {
                        display: flex;
                        justify-content: center;
                        margin-top: auto;
                        height: 25px;
                        overflow: hidden;
                    }
                    /* Force barcode scaling */
                    .barcode-container svg {
                        height: 100% !important;
                        width: auto !important;
                        max-width: 100%;
                    }
                </style>
            </head>
            <body>
                 <div class="label-container">
                    <div class="header ${colors.text.replace('text-', '')}">
                        ${getCombinedLabel()}
                    </div>
                    <div class="product-name">
                        ${ingredient ? ingredient.name : (customName || 'NOMBRE PRODUCTO')}
                    </div>
                    
                    <div class="info-grid">
                        <div class="date-box">
                            <span class="meta-label">ELAB:</span>
                            <span class="meta-val">${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                        </div>
                         <div class="date-box">
                            <span class="meta-label">EXP:</span>
                            <span class="meta-val">${new Date(expiryDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                        </div>
                    </div>
                    
                    <div class="info-grid" style="margin-bottom: 1px;">
                         <div class="date-box" style="border:none; padding:0;">
                            <span class="meta-label">LOTE:</span>
                            <span class="meta-val" style="font-family:monospace">${batch?.batchNumber?.slice(-6) || 'MANUAL'}</span>
                        </div>
                        <div class="date-box" style="border:none; padding:0; justify-content:flex-end;">
                            <span class="meta-label">CANT:</span>
                            <span class="meta-val">${quantity} ${ingredient?.unit || 'un'}</span>
                        </div>
                    </div>

                    <div class="barcode-container">
                        ${printRef.current?.querySelector('svg')?.outerHTML || ''}
                    </div>
                 </div>
            </body>
            </html>
        `);
        doc.close();

        // Wait for images/barcodes to load
        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 500);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-surface rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col md:flex-row overflow-hidden border border-white/10 shadow-2xl">

                {/* Controls Section - Left/Top */}
                <div className="w-full md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-white/10 flex flex-col gap-6 overflow-y-auto bg-background/50">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Printer size={24} className="text-primary" />
                            Imprimir Etiqueta
                        </h2>
                        <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Tipo de Etiqueta</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => toggleType('congelado')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedTypes.includes('congelado') ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'}`}
                            >
                                <Snowflake size={24} />
                                <span className="text-xs font-bold">Congelado</span>
                            </button>
                            <button
                                onClick={() => toggleType('fresco')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedTypes.includes('fresco') ? 'border-emerald-500 bg-emerald-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'}`}
                            >
                                <Leaf size={24} />
                                <span className="text-xs font-bold">Fresco</span>
                            </button>
                            <button
                                onClick={() => toggleType('pasteurizado')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedTypes.includes('pasteurizado') ? 'border-amber-500 bg-amber-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'}`}
                            >
                                <ThermometerSnowflake size={24} />
                                <span className="text-xs font-bold">Past.</span>
                            </button>
                            <button
                                onClick={() => toggleType('elaborado')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedTypes.includes('elaborado') ? 'border-indigo-500 bg-indigo-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'}`}
                            >
                                <Package size={24} />
                                <span className="text-xs font-bold">Elaborado</span>
                            </button>
                            <button
                                onClick={() => toggleType('abatido')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedTypes.includes('abatido') ? 'border-cyan-500 bg-cyan-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'}`}
                            >
                                <Snowflake size={24} className="text-cyan-400" />
                                <span className="text-xs font-bold">Abatido</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {!ingredient && (
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Nombre del Producto</label>
                                <input
                                    type="text"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    placeholder="Ej: Salsa Trufa Evento"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Fecha Caducidad</label>
                            <input
                                type="date"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Cantidad ({ingredient?.unit || 'un'})</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <div className="mt-auto pt-6 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-slate-300 font-bold hover:bg-white/10 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                        >
                            <Printer size={20} />
                            Imprimir
                        </button>
                    </div>
                </div>

                {/* Preview Section - Right/Bottom */}
                <div className="flex-1 bg-black/50 p-8 flex items-center justify-center relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-center text-slate-400 mb-4 text-sm font-bold uppercase tracking-wider">Vista Previa (75x50mm)</p>

                        {/* PREVIEW CONTAINER - Scaled to look realistic on screen but matching print ratios */}
                        <div
                            ref={printRef}
                            className="bg-white text-black p-2 shadow-xl flex flex-col relative"
                            style={{
                                width: '375px', // 5x scale of 75mm
                                height: '250px', // 5x scale of 50mm
                                boxSizing: 'border-box'
                            }}
                        >
                            {/* Header */}
                            <div className={`text-center font-black text-xs uppercase py-1 border-b-2 mb-2 whitespace-nowrap overflow-hidden text-ellipsis ${colors.border} ${colors.text}`}>
                                {getCombinedLabel()}
                            </div>

                            {/* Name */}
                            <div className="font-black text-2xl mb-2 leading-none uppercase overflow-hidden max-h-[60px]">
                                {ingredient ? ingredient.name : (customName || 'NOMBRE PRODUCTO')}
                            </div>

                            {/* Grid Dates */}
                            <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                                <div className="border border-gray-300 rounded px-1 flex justify-between">
                                    <span className="font-bold text-gray-500">ELAB</span>
                                    <span className="font-bold">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                                </div>
                                <div className="border border-gray-300 rounded px-1 flex justify-between">
                                    <span className="font-bold text-gray-500">EXP</span>
                                    <span className="font-bold">{new Date(expiryDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                                </div>
                            </div>

                            {/* Batch Info */}
                            <div className="flex justify-between text-xs font-mono mb-auto">
                                <span>LOT: {batch?.batchNumber?.slice(-6) || '-----'}</span>
                                <span className="font-sans font-bold">{quantity} {ingredient?.unit || 'un'}</span>
                            </div>

                            {/* Barcode */}
                            <div className="mt-auto flex justify-center h-[40px] overflow-hidden">
                                <Barcode
                                    value={barcodeValue}
                                    width={1.2}
                                    height={30}
                                    fontSize={10}
                                    displayValue={false} // Hide value text to save space, redundant with generic LOT text maybe?
                                    margin={0}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
