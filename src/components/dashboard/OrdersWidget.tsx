import React, { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Truck, ShoppingBag, AlertCircle, FileText, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ManualPurchaseModal } from './ManualPurchaseModal';

export const OrdersWidget: React.FC = () => {
    const { purchaseOrders, suppliers } = useStore();
    const navigate = useNavigate();
    const [tab, setTab] = useState<'incoming' | 'pending'>('incoming');
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    const incomingOrders = useMemo(() => {
        return purchaseOrders.filter(po => {
            if (po.status !== 'ORDERED') return false;
            // Assuming deliveryDate exists, otherwise check creation date + lead time?
            // Use deliveryDate if available
            if (po.deliveryDate) {
                return isWithinInterval(parseISO(po.deliveryDate), { start: weekStart, end: weekEnd });
            }
            return false;
        }).sort((a, b) => new Date(a.deliveryDate!).getTime() - new Date(b.deliveryDate!).getTime());
    }, [purchaseOrders, weekStart, weekEnd]);

    const pendingOrders = useMemo(() => {
        // Show DRAFTS
        return purchaseOrders
            .filter(po => po.status === 'DRAFT')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [purchaseOrders]);

    const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || 'Proveedor Desconocido';

    return (
        <div className="glass-card p-0 flex flex-col h-full">
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setTab('incoming')}
                    className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative
                        ${tab === 'incoming' ? 'text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
                    `}
                >
                    <Truck className="w-4 h-4" />
                    Llegadas
                    {tab === 'incoming' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
                <button
                    onClick={() => setTab('pending')}
                    className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative
                        ${tab === 'pending' ? 'text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
                    `}
                >
                    <ShoppingBag className="w-4 h-4" />
                    Borradores
                    {pendingOrders.length > 0 && (
                        <span className="bg-amber-500 text-black text-[10px] font-bold px-1.5 rounded-full">{pendingOrders.length}</span>
                    )}
                    {tab === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
                </button>
                <button
                    onClick={() => setIsManualModalOpen(true)}
                    className="p-3 text-primary hover:bg-white/5 transition-colors border-l border-white/10"
                    title="Añadir Compra Manual (A)"
                >
                    <div className="flex items-center gap-1 font-bold">
                        <Plus className="w-4 h-4" />
                        <span className="text-xs">A</span>
                    </div>
                </button>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar p-2">
                {tab === 'incoming' ? (
                    incomingOrders.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                            <Truck className="w-8 h-8 opacity-20" />
                            <p className="text-sm">Sin entregas previstas</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {incomingOrders.map(po => (
                                <div key={po.id} className="p-3 rounded-lg bg-surface border border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
                                    <div className="flex justify-between">
                                        <span className="font-bold text-slate-200">{getSupplierName(po.supplierId)}</span>
                                        <span className="text-emerald-400 font-mono font-bold">{po.totalCost.toFixed(2)}€</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                                        <span>{po.items.length} ítems</span>
                                        <div className="flex items-center gap-1 text-emerald-300">
                                            <Truck className="w-3 h-3" />
                                            {format(parseISO(po.deliveryDate!), 'EEE d', { locale: es })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    pendingOrders.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                            <FileText className="w-8 h-8 opacity-20" />
                            <p className="text-sm">No hay borradores</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {pendingOrders.map(po => (
                                <div key={po.id} className="p-3 rounded-lg bg-surface border border-amber-500/20 hover:border-amber-500/40 transition-colors cursor-pointer" onClick={() => navigate('/purchasing')}>
                                    <div className="flex justify-between">
                                        <span className="font-bold text-slate-200">{getSupplierName(po.supplierId)}</span>
                                        <span className="text-slate-400 font-mono">{po.totalCost.toFixed(2)}€</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                                        <span>{po.items.length} ítems</span>
                                        <div className="flex items-center gap-1 text-amber-300">
                                            <AlertCircle className="w-3 h-3" />
                                            Borrador
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
            <div className="p-3 border-t border-white/10 bg-surface/30">
                <button onClick={() => navigate('/purchasing')} className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors">
                    Ir a Compras →
                </button>
            </div>

            <ManualPurchaseModal
                isOpen={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
            />
        </div>
    );
};
