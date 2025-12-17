import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { calculateRequirements, generateDraftOrders } from '../utils/purchasing';
import { ShoppingCart, RefreshCw, CheckCircle, FileText, Filter } from 'lucide-react';
import type { PurchaseOrder } from '../types';
import { useToast, ConfirmModal } from './ui';
import { InvoiceUploader } from './ai/InvoiceUploader';

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
    const {
        ingredients, events, suppliers, purchaseOrders,
        addPurchaseOrder, deletePurchaseOrder,
        purchaseOrdersLoading, purchaseOrdersHasMore, fetchPurchaseOrders, loadMorePurchaseOrders,
        setPurchaseOrderFilters, purchaseOrdersFilters, activeOutletId
    } = useStore();

    const { addToast } = useToast();
    const [isScanningModalOpen, setIsScanningModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; orderId: string | null }>({
        isOpen: false,
        orderId: null
    });
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

    const draftCount = purchaseOrders.filter(p => p.status === 'DRAFT').length;
    const orderedCount = purchaseOrders.filter(p => p.status === 'ORDERED').length;
    const receivedCount = purchaseOrders.filter(p => p.status === 'RECEIVED').length;

    useEffect(() => {
        if (activeOutletId) {
            fetchPurchaseOrders({ reset: true });
        }
    }, [activeOutletId, fetchPurchaseOrders]);

    // Handlers for filters
    const handleStatusChange = (status: string) => {
        setPurchaseOrderFilters({ ...purchaseOrdersFilters, status });
    };

    const handleSupplierChange = (supplierId: string) => {
        const newId = supplierId === 'SIN_ASIGNAR' ? null : supplierId;
        setPurchaseOrderFilters({ ...purchaseOrdersFilters, supplierId: newId });
    };

    const handleGenerateOrders = () => {
        // Placeholder logic - assuming we want to generate from calculated needs or events
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

    // Alternative calculation logic from stashed changes
    /*
    const handleCalculateNeeds = () => {
        const needs = calculateIngredientNeeds(events, menus, recipes, ingredients, 14);
         if (needs.length === 0) {
            addToast('Stock suficiente para los próximos 14 días', 'success');
            setCalculatedNeeds([]);
            setShowNeeds(false);
        } else {
            setCalculatedNeeds(needs);
            setShowNeeds(true);
            addToast(`Se detectaron ${needs.length} ingredientes con falta de stock`, 'info');
        }
    };
    */

    const handleDeleteOrder = (orderId: string) => {
        setDeleteConfirm({ isOpen: true, orderId });
    };

    const confirmDelete = () => {
        if (deleteConfirm.orderId) {
            deletePurchaseOrder(deleteConfirm.orderId);
            if (selectedOrder?.id === deleteConfirm.orderId) setSelectedOrder(null);
            addToast('Pedido eliminado', 'success');
        }
        setDeleteConfirm({ isOpen: false, orderId: null });
    };



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
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsScanningModalOpen(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/25"
                    >
                        <FileText size={20} />
                        Escanear Factura
                    </button>
                    <button
                        onClick={handleGenerateOrders}
                        className="flex items-center gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-primary/25"
                    >
                        <RefreshCw size={20} />
                        Generar Pedidos
                    </button>
                </div>
            </div>

            {isScanningModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
                        <div className="flex justify-end p-2 absolute top-2 right-2 z-10">
                            <button onClick={() => setIsScanningModalOpen(false)} className="bg-white/50 rounded-full p-1 text-gray-500 hover:text-gray-700 hover:bg-white">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <InvoiceUploader />
                    </div>
                </div>
            )}

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

            {/* Orders Section */}
            <div className="space-y-8">
                {/* Filters */}
                <div className="bg-surface border border-white/5 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Filter size={18} />
                        <span className="text-sm font-medium">Filtros:</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <select
                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-indigo-500 outline-none"
                            value={purchaseOrdersFilters.status || 'ALL'}
                            onChange={(e) => handleStatusChange(e.target.value)}
                        >
                            <option value="ALL">Todos los Estados</option>
                            <option value="DRAFT">Borradores</option>
                            <option value="ORDERED">Enviados</option>
                            <option value="RECEIVED">Recibidos</option>
                        </select>

                        <select
                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-indigo-500 outline-none"
                            value={purchaseOrdersFilters.supplierId === undefined ? 'ALL' : purchaseOrdersFilters.supplierId === null ? 'SIN_ASIGNAR' : purchaseOrdersFilters.supplierId}
                            onChange={(e) => handleSupplierChange(e.target.value)}
                        >
                            <option value="ALL">Todos los Proveedores</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                            <option value="SIN_ASIGNAR">Sin Asignar</option>
                        </select>
                    </div>
                </div>

                {/* Grouped Orders */}
                {Object.entries(
                    purchaseOrders.reduce((groups, order) => {
                        const key = order.eventId || 'general';
                        if (!groups[key]) groups[key] = [];
                        groups[key].push(order);
                        return groups;
                    }, {} as Record<string, typeof purchaseOrders>)
                ).map(([eventId, orders]) => {
                    const event = events.find(e => e.id === eventId);
                    const groupTitle = event ? `${event.name} (${new Date(event.date).toLocaleDateString()})` : 'Pedidos Generales';

                    if (orders.length === 0) return null;

                    return (
                        <div key={eventId} className="bg-surface border border-white/5 rounded-xl overflow-hidden shadow-xl">
                            <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    {event ? <FileText size={20} className="text-indigo-400" /> : <ShoppingCart size={20} className="text-slate-400" />}
                                    {groupTitle}
                                </h3>
                                <span className="text-sm text-slate-400">{orders.length} pedidos</span>
                            </div>
                            <div className="divide-y divide-white/5">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-white/5 text-slate-400 text-sm">
                                            <tr>
                                                <th className="p-4">Pedido ID</th>
                                                <th className="p-4">Proveedor</th>
                                                <th className="p-4">Fecha</th>
                                                <th className="p-4 text-center">Estado</th>
                                                <th className="p-4 text-right">Items</th>
                                                <th className="p-4 text-right">Total</th>
                                                <th className="p-4 text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-white">
                                            {orders.map(order => {
                                                const supplier = suppliers.find(s => s.id === order.supplierId);
                                                const supplierName = supplier ? supplier.name : (order.supplierId === 'SIN_ASIGNAR' ? 'Sin Asignar' : 'Desconocido');

                                                return (
                                                    <tr key={order.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                                        <td className="p-4 font-mono text-slate-400 text-sm">{order.id.slice(0, 8)}...</td>
                                                        <td className="p-4 font-medium">{supplierName}</td>
                                                        <td className="p-4 text-slate-400 text-sm">{new Date(order.date).toLocaleDateString()}</td>
                                                        <td className="p-4 text-center">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${order.status === 'DRAFT' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                                                                order.status === 'ORDERED' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                                                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                                }`}>
                                                                {statusLabels[order.status]}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right text-slate-400">{order.items.length}</td>
                                                        <td className="p-4 text-right font-mono text-emerald-400">{order.totalCost.toFixed(2)}€</td>
                                                        <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                                                            <button
                                                                onClick={() => setSelectedOrder(order)}
                                                                className="text-indigo-400 hover:text-indigo-300 text-sm font-medium px-3 py-1"
                                                            >
                                                                Ver
                                                            </button>
                                                            {/* Quick actions integration */}
                                                            {order.status === 'DRAFT' && (
                                                                <button
                                                                    onClick={() => handleDeleteOrder(order.id)}
                                                                    className="text-red-400 hover:text-red-300 text-sm font-medium px-3 py-1 ml-2"
                                                                >
                                                                    X
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {purchaseOrders.length === 0 && !purchaseOrdersLoading && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-surface border border-white/5 rounded-xl">
                        <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
                        <p>No se encontraron pedidos con los filtros actuales.</p>
                    </div>
                )}

                {purchaseOrdersLoading && (
                    <div className="p-4 text-center text-slate-400">
                        Cargando...
                    </div>
                )}

                {!purchaseOrdersLoading && purchaseOrdersHasMore && (
                    <div className="p-4 text-center">
                        <button
                            onClick={() => loadMorePurchaseOrders()}
                            className="text-indigo-400 hover:text-indigo-300 hover:underline text-sm font-medium"
                        >
                            Cargar más pedidos
                        </button>
                    </div>
                )}
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
