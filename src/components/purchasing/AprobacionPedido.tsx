import React, { useEffect, useState } from 'react';
import { Check, X, Send, FileText } from 'lucide-react';
import { pedidosService } from '../../services/pedidosService';
import { aprobacionService } from '../../services/aprobacionService';
import type { PurchaseOrder } from '../../types/purchases';
import { useStore } from '../../store/useStore'; // Assuming we have auth in store

interface AprobacionPedidoProps {
    outletId: string;
}

export const AprobacionPedido: React.FC<AprobacionPedidoProps> = ({ outletId }) => {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useStore();
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

    // Filter states
    const [filterStatus, setFilterStatus] = useState<string>('DRAFT');

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const allOrders = await pedidosService.getAll(outletId);
            // Client-side filtering for now, can be moved to query
            const filtered = allOrders.filter(o => {
                if (filterStatus === 'ALL') return true;
                return o.status === filterStatus;
            }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setOrders(filtered);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [outletId, filterStatus]);

    const handleApprove = async (order: PurchaseOrder) => {
        if (!currentUser?.id) return alert("Usuario no identificado");
        if (confirm(`¿Aprobar pedido ${order.orderNumber}?`)) {
            await aprobacionService.approveOrder(order.id, currentUser.id);
            fetchOrders();
            setSelectedOrder(null);
        }
    };

    const handleReject = async (order: PurchaseOrder) => {
        if (!currentUser?.id) return alert("Usuario no identificado");
        const reason = prompt("Motivo del rechazo:");
        if (reason) {
            await aprobacionService.rejectOrder(order.id, currentUser.id, reason);
            fetchOrders();
            setSelectedOrder(null);
        }
    };

    const handleSend = async (order: PurchaseOrder) => {
        if (!currentUser?.id) return alert("Usuario no identificado");
        if (confirm(`¿Enviar pedido ${order.orderNumber} al proveedor?`)) {
            await aprobacionService.sendOrder(order.id, currentUser.id);
            fetchOrders();
            setSelectedOrder(null);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Aprobación de Pedidos</h1>
                    <p className="text-gray-500">Gestiona y autoriza los pedidos de compra</p>
                </div>
                <div className="flex gap-2">
                    {['DRAFT', 'APPROVED', 'ORDERED', 'REJECTED', 'ALL'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${filterStatus === status
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {status === 'ALL' ? 'Todos' : status}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order List */}
                <div className="lg:col-span-1 space-y-4">
                    {loading ? (
                        <p>Cargando pedidos...</p>
                    ) : orders.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No hay pedidos en este estado.</p>
                    ) : (
                        orders.map(order => (
                            <div
                                key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className={`p-4 bg-white rounded-xl shadow-sm cursor-pointer border-l-4 transition-all hover:shadow-md ${selectedOrder?.id === order.id ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-transparent'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-gray-900">{order.orderNumber}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                                        order.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                            order.status === 'ORDERED' ? 'bg-blue-100 text-blue-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 truncate">{order.supplierId} {/* Would need name map */}</p>
                                <div className="mt-2 flex justify-between text-xs text-gray-500">
                                    <span>{new Date(order.date).toLocaleDateString()}</span>
                                    <span>{order.items.length} items</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Order Details Panel */}
                <div className="lg:col-span-2">
                    {selectedOrder ? (
                        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                            <div className="flex justify-between items-start mb-6 border-b pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedOrder.orderNumber}</h2>
                                    <p className="text-gray-500 text-sm">ID: {selectedOrder.id}</p>
                                </div>
                                <div className="flex gap-2">
                                    {selectedOrder.status === 'DRAFT' && (
                                        <>
                                            <button
                                                onClick={() => handleReject(selectedOrder)}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                                            >
                                                <X size={18} /> Rechazar
                                            </button>
                                            <button
                                                onClick={() => handleApprove(selectedOrder)}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"
                                            >
                                                <Check size={18} /> Aprobar
                                            </button>
                                        </>
                                    )}
                                    {selectedOrder.status === 'APPROVED' && (
                                        <button
                                            onClick={() => handleSend(selectedOrder)}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                                        >
                                            <Send size={18} /> Enviar a Proveedor
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Proveedor ID</p>
                                        <p className="font-medium">{selectedOrder.supplierId}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Fecha Creación</p>
                                        <p className="font-medium">{new Date(selectedOrder.date).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Total Estimado</p>
                                        <p className="font-medium text-lg">{selectedOrder.totalCost || '—'} €</p>
                                    </div>
                                    {selectedOrder.notes && (
                                        <div className="col-span-2">
                                            <p className="text-gray-500">Notas</p>
                                            <p className="bg-yellow-50 p-2 rounded text-yellow-800">{selectedOrder.notes}</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <FileText size={18} className="text-gray-400" /> Items ({selectedOrder.items.length})
                                    </h3>
                                    <div className="overflow-hidden border rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingrediente</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {selectedOrder.items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-3 text-sm text-gray-900">
                                                            {item.tempDescription || item.ingredientId}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                            {item.quantity}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-500">
                                                            {item.unit}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl p-12">
                            <FileText size={48} className="mb-4 opacity-20" />
                            <p>Selecciona un pedido para ver los detalles</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
