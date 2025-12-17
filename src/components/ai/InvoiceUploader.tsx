
import React, { useState } from 'react';
import { scanInvoice } from '../../api/ai';
import type { ProcessedInvoice } from '../../types';
import { Upload, Loader2 } from 'lucide-react';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
// No specific app import needed if default app is initialized in main, but good practice to be explicit if issues arise.
// We'll rely on global default app for now as getStorage() finds it.


export const InvoiceUploader: React.FC = () => {
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<ProcessedInvoice | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        setUploading(true);
        setError(null);

        try {
            // 1. Upload to Firebase Storage
            const storage = getStorage();
            const storageRef = ref(storage, `invoices / ${Date.now()}_${file.name} `);
            const snapshot = await uploadBytes(storageRef, file);
            // Document AI usually needs gs:// URI, but for client-side upload & trigger, 
            // we often pass the gs:// path or trigger via bucket event. 
            // For this callable function, we need the gs:// URI or accessible public URL if configured.
            // Assuming the function accepts a GS URI like `gs://bucket/path`

            // Construct GS URI manually or get it from snapshot if available (snapshot.metadata.fullPath is relative)
            // A common pattern for callable is passing the path.
            const gcsUri = `gs://${snapshot.metadata.bucket}/${snapshot.metadata.fullPath}`;

            setUploading(false);
            setProcessing(true);

            // 2. Call Cloud Function
            const response = await scanInvoice({ gcsUri, fileType: file.type });
            const data = response.data as ProcessedInvoice;

            setResult(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error uploading/processing invoice');
        } finally {
            setUploading(false);
            setProcessing(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Escáner de Facturas (IA)</h2>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:bg-gray-50 transition-colors relative">
                <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,image/jpeg,image/png"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading || processing}
                />

                {processing ? (
                    <div className="animate-pulse flex flex-col items-center">
                        <Loader2 className="w-10 h-10 text-indigo-500 mb-2 animate-spin" />
                        <span className="text-indigo-600 font-medium">Analizando con Inteligencia Artificial...</span>
                    </div>
                ) : (
                    <>
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <span className="text-gray-500">Arrastra tu factura o haz clic para subir</span>
                        <span className="text-xs text-gray-400 mt-1">PDF, JPG, PNG soportados</span>
                    </>
                )}
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {result && (
                <div className="mt-6 border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium text-gray-900">Resultados del Análisis</h3>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Procesado</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div className="bg-gray-50 p-3 rounded">
                            <span className="block text-gray-500 text-xs">Proveedor</span>
                            <span className="font-medium text-gray-900">{result.supplierName}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                            <span className="block text-gray-500 text-xs">Fecha</span>
                            <span className="font-medium text-gray-900">{new Date(result.date).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-500 border-b">
                                <th className="pb-2 font-normal">Descripción</th>
                                <th className="pb-2 font-normal text-right">Cant.</th>
                                <th className="pb-2 font-normal text-right">Precio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {result.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="py-2 text-gray-800">{item.description}</td>
                                    <td className="py-2 text-right text-gray-600">{item.quantity}</td>
                                    <td className="py-2 text-right text-gray-600">{item.unitPrice.toFixed(2)}€</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-semibold text-gray-900 border-t">
                                <td className="pt-3">Total</td>
                                <td colSpan={2} className="pt-3 text-right">{result.totalCost.toFixed(2)}€</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            className="btn btn-secondary text-sm"
                            onClick={() => setResult(null)}
                        >
                            Descartar
                        </button>
                        <button
                            className="btn btn-primary text-sm"
                            onClick={() => alert("Función para crear pedido pendiente de implementar")}
                        >
                            Guardar como Pedido
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
