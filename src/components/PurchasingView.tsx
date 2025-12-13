import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { calculateRequirements, generateDraftOrders } from '../utils/purchasing';
import { ShoppingCart, RefreshCw, CheckCircle, FileText } from 'lucide-react';
import type { PurchaseOrder } from '../types';
import { useToast, ConfirmModal } from './ui';

interface StatusCardProps {
    title: string;
    count: number;
    icon: React.ReactNode;
    color: string;
}

const StatusCard = ({ title, count, icon, color }: StatusCardProps) => (
    <div className="bg-surface border border-white/5 p-6 rounded-xl cursor-pointer hover:bg-white/5 transition-all">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${color}`}>
            {icon}
        </div>
        <h3 className="text-3xl font-bold text-white mb-1">{count}</h3>
        <p className="text-slate-400 font-medium">{title}</p>
    </div>
);

const statusLabels: Record<string, string> = {
    'DRAFT': 'Borrador',
    'ORDERED': 'Pedido',
    'RECEIVED': 'Recibido',
    'CANCELLED': 'Cancelado'
};

export const PurchasingView: React.FC = () => {
    const { ingredients, events, purchaseOrders, suppliers, addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder } = useStore();

    const { addToast } = useToast();
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; orderId: string | null }>({
        isOpen: false,
        orderId: null
    });

    const handleGenerateOrders = () => {
        const requirements = calculateRequirements(events);
        const { orders: drafts, warnings } = generateDraftOrders(requirements, ingredients, suppliers);

        drafts.forEach(draft => addPurchaseOrder(draft));

        if (warnings.length > 0) {
            addToast(`Generados con ${warnings.length} advertencia(s)`, 'warning');
        } else if (drafts.length > 0) {
            addToast(`${drafts.length} borrador(es) generados correctamente`, 'success');
        } else {
            addToast('No hay pedidos que generar', 'info');
        }
    };

    const handleDeleteOrder = (orderId: string) => {
        setDeleteConfirm({ isOpen: true, orderId });
    };

    const confirmDelete = () => {
        if (deleteConfirm.orderId) {
            deletePurchaseOrder(deleteConfirm.orderId);
            addToast('Pedido eliminado', 'success');
        }
        setDeleteConfirm({ isOpen: false, orderId: null });
    };

    const handleUpdateStatus = (order: PurchaseOrder, status: PurchaseOrder['status']) => {
        updatePurchaseOrder({ ...order, status });
    };

    const draftCount = purchaseOrders.filter(p => p.status === 'DRAFT').length;
    const orderedCount = purchaseOrders.filter(p => p.status === 'ORDERED').length;
    const receivedCount = purchaseOrders.filter(p => p.status === 'RECEIVED').length;

    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
                        <ShoppingCart className="text-indigo-400" size={28} />
                        Compras Automáticas
                    </h2>
                    <p className="text-slate-400 mt-1">Gestión de pedidos y reabastecimiento</p>
                </div>
                <button
                    onClick={handleGenerateOrders}
                    className="flex items-center gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-primary/25"
                >
                    <RefreshCw size={20} />
                    Generar Pedidos
                </button>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatusCard
                    title="Borradores"
                    count={draftCount}
                    icon={<FileText size={24} className="text-orange-400" />}
                    color="bg-orange-500/20"
                />
                <StatusCard
                    title="Enviados"
                    count={orderedCount}
                    icon={<ShoppingCart size={24} className="text-blue-400" />}
                    color="bg-blue-500/20"
                />
                <StatusCard
                    title="Recibidos"
                    count={receivedCount}
                    icon={<CheckCircle size={24} className="text-emerald-400" />}
                    color="bg-emerald-500/20"
                />
            </div>

            {/* Orders List */}
            <div className="bg-surface border border-white/5 rounded-xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-white/10 bg-white/5">
                    <h3 className="text-lg font-bold text-white">Pedidos Recientes</h3>
                </div>
                <div className="divide-y divide-white/5">
                    {purchaseOrders.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            No hay pedidos registrados. Genera pedidos automáticos para comenzar.
                        </div>
                    ) : (
                        purchaseOrders.map(order => {
                            const supplier = suppliers.find(s => s.id === order.supplierId);
                            return (
                                <div key={order.id} className="p-6 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                                                <ShoppingCart size={24} className="text-slate-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white">{supplier?.name || 'Desconocido'}</h4>
                                                <p className="text-sm text-slate-400">
                                                    {order.items.length} ítems • Total: <span className="text-emerald-400 font-mono">${order.totalCost.toFixed(2)}</span>
                                                    {order.orderDeadline && (
                                                        <span className="ml-2 text-orange-400 font-medium">
                                                            • Pedir antes de: {order.orderDeadline}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${order.status === 'DRAFT' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                                            order.status === 'ORDERED' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                                'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            }`}>
                                            {statusLabels[order.status] || order.status}
                                        </span>
                                    </div>

                                    {/* Items Preview */}
                                    <div className="ml-16 mb-4 space-y-1">
                                        {order.items.map((item, idx) => {
                                            const ingName = ingredients.find(i => i.id === item.ingredientId)?.name || item.ingredientId;
                                            return (
                                                <div key={idx} className="text-sm text-slate-400 flex justify-between max-w-md">
                                                    <span>{ingName}</span>
                                                    <span className="font-mono text-slate-300">{item.quantity} {item.unit}</span>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-3 ml-16">
                                        {order.status === 'DRAFT' && (
                                            <>
                                                <button
                                                    onClick={() => handleDeleteOrder(order.id)}
                                                    className="text-red-400 text-sm font-medium hover:text-red-300 transition-colors"
                                                >
                                                    Eliminar
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(order, 'ORDERED')}
                                                    className="bg-primary hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Confirmar Pedido
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'ORDERED' && (
                                            <button
                                                onClick={() => handleUpdateStatus(order, 'RECEIVED')}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Marcar como Recibido
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="¿Eliminar pedido?"
                message="Esta acción no se puede deshacer. El borrador será eliminado permanentemente."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm({ isOpen: false, orderId: null })}
            />
        </div>
    );
};
