import React, { useEffect, useState, useCallback } from 'react';
import { Check, X, Send, FileText, ShoppingCart } from 'lucide-react';
import { pedidosService } from '../../services/pedidosService';
import { aprobacionService } from '../../services/aprobacionService';
import type { PurchaseOrder } from '../../types/purchases';
import { useStore } from '../../store/useStore';

interface AprobacionPedidoProps {
    outletId: string;
}

export const AprobacionPedido: React.FC<AprobacionPedidoProps> = ({ outletId }) => {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useStore();
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [deliveryDate, setDeliveryDate] = useState('');
    const [deliveryNotes, setDeliveryNotes] = useState('');

    useEffect(() => {
        if (selectedOrder) {
            setDeliveryDate(selectedOrder.deliveryDate || '');
            setDeliveryNotes(selectedOrder.deliveryNotes || '');
        }
    }, [selectedOrder]);

    // Filter states
    const [filterStatus, setFilterStatus] = useState<string>('DRAFT');

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const allOrders = await pedidosService.getAll(outletId);
            const filtered = filterStatus === 'ALL'
                ? allOrders
                : allOrders.filter(o => o.status === filterStatus);
            setOrders(filtered);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    }, [outletId, filterStatus]);

    useEffect(() => {
        if (outletId) {
            fetchOrders();
        }
    }, [outletId, filterStatus, fetchOrders]);

    const handleApprove = async (order: PurchaseOrder) => {
        if (!currentUser) return;
        if (!confirm(`¿Aprobar pedido ${order.orderNumber}?`)) return;

        try {
            await aprobacionService.approveOrder(order.id, currentUser.id, {
                deliveryDate,
                deliveryNotes
            });
            await fetchOrders();
            setSelectedOrder(null);
        } catch (error) {
            console.error('Error approving order:', error);
        }
    };

    const handleReject = async (order: PurchaseOrder) => {
        if (!currentUser?.id) return alert("Usuario no identificado");
        const reason = prompt("Motivo del rechazo:");
        if (reason) {
            try {
                await aprobacionService.rejectOrder(order.id, currentUser.id, reason);
                await fetchOrders();
                setSelectedOrder(null);
            } catch (error) {
                console.error('Error rejecting order:', error);
            }
        }
    };

    const handleSend = async (order: PurchaseOrder) => {
        if (!currentUser) return;
        if (!confirm(`¿Enviar pedido ${order.orderNumber} al proveedor?`)) return;

        try {
            await aprobacionService.sendOrder(order.id, currentUser.id, {
                deliveryDate,
                deliveryNotes
            });
            await fetchOrders();
            setSelectedOrder(null);
        } catch (error) {
            console.error('Error sending order:', error);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Check size={24} className="text-indigo-400" />
                        Validación de Compras
                    </h2>
                    <p className="text-slate-400 text-sm">Gestiona y autoriza los pedidos sugeridos</p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 self-start md:self-center">
                    {['DRAFT', 'APPROVED', 'ORDERED', 'ALL'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${filterStatus === status
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {status === 'DRAFT' ? 'Borradores' :
                                status === 'APPROVED' ? 'Aprobados' :
                                    status === 'ORDERED' ? 'Enviados' : 'Todos'}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Order List */}
                <div className="lg:col-span-4 space-y-3">
                    {loading ? (
                        <div className="flex flex-col gap-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-surface/50 border border-white/5 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="bg-surface border border-white/5 rounded-xl p-12 text-center border-2 border-dashed">
                            <FileText size={48} className="mx-auto mb-4 text-slate-700 opacity-20" />
                            <p className="text-slate-500">No hay pedidos {filterStatus !== 'ALL' ? 'con estado ' + filterStatus : ''}</p>
                        </div>
                    ) : (
                        <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {orders.map(order => (
                                <div
                                    key={order.id}
                                    onClick={() => setSelectedOrder(order)}
                                    className={`p-4 bg-surface border rounded-xl cursor-pointer transition-all hover:border-indigo-500/50 group ${selectedOrder?.id === order.id
                                        ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/20'
                                        : 'border-white/5 hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-mono text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                                            {order.orderNumber}
                                        </span>
                                        <div className={`w-2 h-2 rounded-full ${order.status === 'DRAFT' ? 'bg-orange-500' :
                                            order.status === 'APPROVED' ? 'bg-emerald-500' :
                                                order.status === 'ORDERED' ? 'bg-blue-500' : 'bg-slate-500'
                                            }`} />
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-xs text-slate-500 uppercase tracking-wider">{order.supplierId}</p>
                                            <p className="text-xs text-slate-400">{new Date(order.date).toLocaleDateString()}</p>
                                        </div>
                                        <p className="text-lg font-bold text-white">{order.totalCost.toFixed(2)}€</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Order Details Panel */}
                <div className="lg:col-span-8">
                    {selectedOrder ? (
                        <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full border-t-indigo-500/20 shadow-indigo-500/5">
                            {/* Panel Header */}
                            <div className="p-6 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
                                        <span>Pedido {selectedOrder.type === 'AUTOMATIC' ? 'Automático' : 'Manual'}</span>
                                        <span className="text-white/10">|</span>
                                        <span className={selectedOrder.status === 'DRAFT' ? 'text-orange-400' : 'text-emerald-400'}>
                                            {selectedOrder.status}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">{selectedOrder.orderNumber}</h3>
                                </div>
                                <div className="flex gap-2">
                                    {selectedOrder.status === 'DRAFT' && (
                                        <>
                                            <button
                                                onClick={() => handleReject(selectedOrder)}
                                                className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500/20 border border-rose-500/20 transition-all font-medium flex items-center gap-2"
                                            >
                                                <X size={20} /> <span className="hidden sm:inline">Descartar</span>
                                            </button>
                                            <button
                                                onClick={() => handleApprove(selectedOrder)}
                                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                                            >
                                                <Check size={20} /> Aprobar Pedido
                                            </button>
                                        </>
                                    )}
                                    {selectedOrder.status === 'APPROVED' && (
                                        <button
                                            onClick={() => handleSend(selectedOrder)}
                                            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-all font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-2"
                                        >
                                            <Send size={20} /> Enviar al Proveedor
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Panel Content */}
                            <div className="p-6 space-y-8 overflow-y-auto flex-1">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                                        <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Proveedor</p>
                                        <p className="text-white font-bold">{selectedOrder.supplierId || 'Sin asignar'}</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                                        <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Fecha Generación</p>
                                        <p className="text-white font-bold">{new Date(selectedOrder.date).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                                        <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Total Estimado</p>
                                        <p className="text-indigo-400 text-xl font-black">{selectedOrder.totalCost.toFixed(2)} €</p>
                                    </div>
                                </div>

                                {selectedOrder.notes && (
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
                                        <FileText className="text-amber-500 shrink-0" size={20} />
                                        <div>
                                            <p className="text-xs font-bold text-amber-500 uppercase mb-1">Notas del sistema</p>
                                            <p className="text-sm text-amber-200/80 leading-relaxed">{selectedOrder.notes}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Logistics Configuration */}
                                {(selectedOrder.status === 'DRAFT' || selectedOrder.status === 'APPROVED') && (
                                    <div className="bg-white/5 border border-white/5 p-6 rounded-2xl space-y-4">
                                        <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                            Logística de Entrega
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Requerida</label>
                                                <input
                                                    type="date"
                                                    value={deliveryDate}
                                                    onChange={(e) => setDeliveryDate(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Instrucciones / Notas</label>
                                                <input
                                                    type="text"
                                                    value={deliveryNotes}
                                                    onChange={(e) => setDeliveryNotes(e.target.value)}
                                                    placeholder="Ej: Entrar por muelle 2..."
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Items Table */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                        Detalle del Pedido ({selectedOrder.items.length} líneas)
                                    </h4>
                                    <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/2">
                                        <table className="min-w-full divide-y divide-white/5">
                                            <thead className="bg-white/5">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Producto</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Pedido</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Costo</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {selectedOrder.items.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                                                                {item.tempDescription || 'Ingrediente Desconocido'}
                                                            </div>
                                                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.ingredientId}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-white font-bold">{item.quantity}</span>{' '}
                                                            <span className="text-slate-500 text-xs">{item.unit}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-slate-400 text-sm">
                                                            {item.costPerUnit.toFixed(2)}€
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-mono font-bold text-white">
                                                            {(item.quantity * item.costPerUnit).toFixed(2)}€
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Audit History */}
                                {selectedOrder.history && selectedOrder.history.length > 0 && (
                                    <div className="space-y-4 pt-6 border-t border-white/5">
                                        <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                            Historial y Auditoría
                                        </h4>
                                        <div className="space-y-3">
                                            {selectedOrder.history.map((entry, idx) => (
                                                <div key={idx} className="flex gap-4 items-start p-3 bg-white/2 rounded-xl border border-white/5">
                                                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${entry.status === 'APPROVED' ? 'bg-emerald-500' :
                                                        entry.status === 'REJECTED' ? 'bg-rose-500' :
                                                            entry.status === 'ORDERED' ? 'bg-blue-500' :
                                                                'bg-slate-500'
                                                        }`} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-xs font-bold text-white uppercase">{entry.status}</span>
                                                            <span className="text-[10px] text-slate-500">{new Date(entry.date).toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-400">
                                                            Por: <span className="text-indigo-400 font-medium">{entry.userId}</span>
                                                        </p>
                                                        {entry.notes && (
                                                            <p className="mt-1 text-xs text-slate-500 italic">"{entry.notes}"</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/10 bg-white/2 rounded-3xl p-12">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                                <ShoppingCart size={32} className="opacity-20" />
                            </div>
                            <h3 className="text-xl font-semibold text-white/50 mb-2">Panel de Detalles</h3>
                            <p className="text-balance text-center max-w-xs text-sm">Selecciona una propuesta de pedido de la lista para revisar el contenido y autorizarla.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
