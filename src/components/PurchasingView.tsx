import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { ShoppingCart, FileText, CheckCircle, Truck, PackageCheck, LayoutDashboard, Settings, BarChart3 } from 'lucide-react';
import { AutoPurchaseSettingsModal } from './purchasing/AutoPurchaseSettings';
import { AprobacionPedido } from './purchasing/AprobacionPedido';
import { RecepcionPedido } from './purchasing/RecepcionPedido';
import { SupplierView } from './SupplierView';
import { SupplierPerformance } from './purchasing/SupplierPerformance';
import { AIPurchaseAdvisor } from './purchasing/AIPurchaseAdvisor';

// Sub-components
// Sub-components

// Dashboard Tab Content
const DashboardTab: React.FC = () => {
    const { purchaseOrders, activeOutletId, fetchPurchaseOrders } = useStore();

    useEffect(() => {
        if (activeOutletId) fetchPurchaseOrders({ reset: true });
    }, [activeOutletId]);

    const stats = [
        { label: 'Borradores', count: purchaseOrders.filter(o => o.status === 'DRAFT').length, color: 'bg-orange-500/20 text-orange-400', icon: FileText },
        { label: 'Pendientes', count: purchaseOrders.filter(o => o.status === 'APPROVED' || o.status === 'ORDERED').length, color: 'bg-blue-500/20 text-blue-400', icon: ShoppingCart },
        { label: 'Recibidos', count: purchaseOrders.filter(o => o.status === 'RECEIVED').length, color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-surface border border-white/5 p-6 rounded-xl flex items-center gap-4">
                        <div className={`p-3 rounded-full ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">{stat.label}</p>
                            <p className="text-2xl font-bold text-white">{stat.count}</p>
                        </div>
                    </div>
                ))}
            </div>
            {/* Alerts for Auto-Purchasing */}
            {purchaseOrders.some(o => o.status === 'DRAFT' && o.type === 'AUTOMATIC') && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                            <FileText size={20} />
                        </div>
                        <div>
                            <p className="text-white font-bold">Nuevas sugerencias de compra</p>
                            <p className="text-slate-400 text-sm">El sistema ha generado borradores basados en tu stock actual.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Advisor Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <AIPurchaseAdvisor />
                </div>
                <div className="space-y-6">
                    {/* Recent Activity or aggregate chart could go here */}
                    <div className="bg-surface border border-white/5 rounded-xl p-6 h-full flex items-center justify-center text-slate-500">
                        <p>Resumen de actividad reciente (Próximamente)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PurchasingView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'approval' | 'receiving' | 'performance' | 'suppliers'>('dashboard');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { activeOutletId } = useStore();

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'approval', label: 'Aprobación', icon: CheckCircle },
        { id: 'receiving', label: 'Recepción', icon: PackageCheck },
        { id: 'performance', label: 'Rendimiento', icon: BarChart3 },
        { id: 'suppliers', label: 'Proveedores', icon: Truck },
    ];

    return (
        <div className="p-6 md:p-8 space-y-6 min-h-screen bg-background text-slate-100">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ShoppingCart className="text-indigo-400" /> Gestion de Compras
                    </h1>
                    <p className="text-slate-400 text-sm">Control integral de aprovisionamiento</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <Settings />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 space-x-1 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                            ? 'border-indigo-500 text-indigo-400'
                            : 'border-transparent text-slate-400 hover:text-white hover:border-white/20'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="animate-in fade-in duration-300">
                {activeTab === 'dashboard' && <DashboardTab />}
                {activeTab === 'approval' && <AprobacionPedido outletId={activeOutletId || ''} />}
                {activeTab === 'receiving' && <RecepcionPedido outletId={activeOutletId || ''} />}
                {activeTab === 'performance' && <SupplierPerformance />}
                {activeTab === 'suppliers' && <SupplierView />}
            </div>

            <AutoPurchaseSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
};
