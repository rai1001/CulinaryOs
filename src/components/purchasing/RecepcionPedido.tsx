import React, { useEffect, useState } from 'react';
import { PackageCheck, Calendar, CheckCircle } from 'lucide-react';
import { pedidosService } from '../../services/pedidosService';
import { recepcionService } from '../../services/recepcionService';
import type { PurchaseOrder } from '../../types/purchases';
import { useStore } from '../../store/useStore';

interface RecepcionPedidoProps {
    outletId: string;
}

export const RecepcionPedido: React.FC<RecepcionPedidoProps> = ({ outletId }) => {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const { currentUser } = useStore();

    // Local state for receiving process
    const [receiveData, setReceiveData] = useState<Record<string, { quantity: number, expiryDate: string }>>({});

    const fetchOrders = async () => {
        const allOrders = await pedidosService.getAll(outletId);
        // Show ORDERED and PARTIAL orders
        setOrders(allOrders.filter(o => o.status === 'ORDERED' || o.status === 'PARTIAL'));
    };

    useEffect(() => {
        fetchOrders();
    }, [outletId]);

    const handleSelectOrder = (order: PurchaseOrder) => {
        setSelectedOrder(order);
        // Initialize receive values with ordered quantities
        const initialData: Record<string, any> = {};
        order.items.forEach(item => {
            initialData[item.ingredientId] = {
                quantity: item.quantity,
                expiryDate: ''
            };
        });
        setReceiveData(initialData);
    };

    const handleReceiveSubmit = async () => {
        if (!selectedOrder || !currentUser?.id) return;

        if (!confirm('¿Confirmar recepción de mercancía? Esto aumentará el stock de los ingredientes.')) return;

        const itemsToReceive = Object.entries(receiveData)
            .filter(([_, data]) => data.quantity > 0)
            .map(([ingId, data]) => ({
                ingredientId: ingId,
                quantity: Number(data.quantity),
                expiryDate: data.expiryDate || undefined
            }));

        try {
            await recepcionService.receiveOrder(selectedOrder, itemsToReceive, currentUser.id);
            alert('Pedido recepcionado correctamente');
            fetchOrders();
            setSelectedOrder(null);
        } catch (error) {
            console.error(error);
            alert('Error al recepcionar pedido');
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Recepción de Mercancía</h1>
                <p className="text-gray-500">Verifica y da entrada a los pedidos de proveedores</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List */}
                <div className="lg:col-span-1 space-y-4">
                    {orders.length === 0 && <p className="text-gray-500">No hay pedidos pendientes de recepción.</p>}
                    {orders.map(order => (
                        <div
                            key={order.id}
                            onClick={() => handleSelectOrder(order)}
                            className={`p-4 bg-white rounded-xl shadow-sm cursor-pointer border-l-4 hover:shadow-md ${selectedOrder?.id === order.id ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-blue-500'
                                }`}
                        >
                            <div className="flex justify-between">
                                <span className="font-bold">{order.orderNumber}</span>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{order.status}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{new Date(order.date).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-500 mt-2">{order.items.length} productos</p>
                        </div>
                    ))}
                </div>

                {/* Receive Form */}
                <div className="lg:col-span-2">
                    {selectedOrder ? (
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <PackageCheck className="text-indigo-600" />
                                Recepcionar {selectedOrder.orderNumber}
                            </h2>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Producto</th>
                                            <th className="px-4 py-3">Pedido</th>
                                            <th className="px-4 py-3">Recibido</th>
                                            <th className="px-4 py-3">Caducidad</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {selectedOrder.items.map(item => (
                                            <tr key={item.ingredientId}>
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    {item.tempDescription || 'Ingrediente ' + item.ingredientId}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500">
                                                    {item.quantity} {item.unit}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-indigo-500"
                                                        value={receiveData[item.ingredientId]?.quantity || 0}
                                                        onChange={(e) => setReceiveData({
                                                            ...receiveData,
                                                            [item.ingredientId]: { ...receiveData[item.ingredientId], quantity: Number(e.target.value) }
                                                        })}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="relative">
                                                        <Calendar size={14} className="absolute left-2 top-2 text-gray-400" />
                                                        <input
                                                            type="date"
                                                            className="pl-7 pr-2 py-1 border rounded w-full focus:ring-2 focus:ring-indigo-500"
                                                            value={receiveData[item.ingredientId]?.expiryDate || ''}
                                                            onChange={(e) => setReceiveData({
                                                                ...receiveData,
                                                                [item.ingredientId]: { ...receiveData[item.ingredientId], expiryDate: e.target.value }
                                                            })}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleReceiveSubmit}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
                                >
                                    <CheckCircle size={18} /> Confirmar Entrada
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed rounded-xl">
                            <PackageCheck size={48} className="mb-2 opacity-50" />
                            <p>Selecciona un pedido para dar entrada</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
