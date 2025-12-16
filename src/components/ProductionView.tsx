import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import type { EventType } from '../types';
import { calculateShoppingList } from '../utils/production';
import { ShoppingCart, Calendar, Users, Euro, Plus, Printer, Download, Tag } from 'lucide-react';
import { printLabel, formatLabelData } from './printing/PrintService';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ProductionKanbanBoard } from './production/ProductionKanbanBoard';

export const ProductionView: React.FC = () => {
    const { menus, events, setEvents, selectedProductionEventId, setSelectedProductionEventId } = useStore();
    const [newEvent, setNewEvent] = useState({ name: '', date: format(new Date(), 'yyyy-MM-dd'), pax: 10, menuId: '' });
    const [activeTab, setActiveTab] = useState<'shopping' | 'mise-en-place' | 'kanban'>('shopping');

    const handleCreateEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEvent.menuId) return;

        const menu = menus.find(m => m.id === newEvent.menuId);
        if (!menu) return;

        const event = {
            id: crypto.randomUUID(),
            name: newEvent.name || `Evento ${events.length + 1}`,
            date: newEvent.date,
            pax: newEvent.pax,
            type: 'Comida' as EventType,
            menuId: newEvent.menuId,
            menu: menu
        };

        setEvents([...events, event]);
        setSelectedProductionEventId(event.id);
        setNewEvent({ name: '', date: format(new Date(), 'yyyy-MM-dd'), pax: 10, menuId: '' });
    };

    const selectedEvent = events.find(e => e.id === selectedProductionEventId);

    const shoppingList = useMemo(() => {
        if (!selectedEvent || !selectedEvent.menu) return [];
        return calculateShoppingList(selectedEvent.menu, selectedEvent.pax);
    }, [selectedEvent]);

    const totalCost = shoppingList.reduce((sum, item) => sum + item.totalCost, 0);

    const handlePrint = () => {
        // Default browser print for the whole page (Production Sheet)
        window.print();
    };

    const handleExport = () => {
        if (!selectedEvent) return;

        const rows = shoppingList.map(item => ({
            Ingrediente: item.ingredientName,
            Cantidad: item.totalQuantity,
            Unidad: item.unit,
            CosteUnitario: item.totalQuantity > 0 ? (item.totalCost / item.totalQuantity) : 0,
            CosteTotal: item.totalCost
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Lista de Compra");
        XLSX.writeFile(wb, `Produccion_${selectedEvent.name.replace(/\s+/g, '_')}.xlsx`);
    };

    return (
        <div className="flex h-full bg-background">
            {/* Event List / Sidebar */}
            <div className="w-80 border-r border-white/5 bg-surface/30 p-4 flex flex-col">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" /> Eventos
                </h3>

                {/* New Event Form */}
                <form onSubmit={handleCreateEvent} className="bg-surface/50 p-4 rounded-xl border border-white/5 space-y-3 mb-6">
                    <input
                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary placeholder:text-slate-500"
                        placeholder="Nombre del Evento"
                        value={newEvent.name}
                        onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                    />
                    <div className="flex gap-2">
                        <input
                            type="date"
                            className="flex-1 bg-black/20 border border-white/10 rounded px-2 py-2 text-sm text-white"
                            value={newEvent.date}
                            onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                        />
                        <input
                            type="number"
                            className="w-20 bg-black/20 border border-white/10 rounded px-2 py-2 text-sm text-white"
                            placeholder="PAX"
                            value={newEvent.pax}
                            onChange={e => setNewEvent({ ...newEvent, pax: Number(e.target.value) })}
                        />
                    </div>
                    <select
                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white"
                        value={newEvent.menuId}
                        onChange={e => setNewEvent({ ...newEvent, menuId: e.target.value })}
                        required
                    >
                        <option value="">Seleccionar Menú...</option>
                        {menus.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                    <button type="submit" className="w-full bg-primary hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Crear Evento
                    </button>
                </form>

                <div className="flex-1 overflow-auto space-y-2">
                    {events.length === 0 && <p className="text-center text-slate-500 text-sm py-4">No hay eventos todavía.</p>}
                    {events.map(event => (
                        <div
                            key={event.id}
                            onClick={() => setSelectedProductionEventId(event.id)}
                            className={`p-3 rounded-lg cursor-pointer border transition-all ${selectedProductionEventId === event.id
                                ? 'bg-primary/10 border-primary/50 text-blue-100'
                                : 'bg-surface/40 border-transparent hover:bg-surface/60 text-slate-300'
                                }`}
                        >
                            <div className="font-medium">{event.name}</div>
                            <div className="text-xs opacity-70 flex justify-between mt-1">
                                <span>{event.date}</span>
                                <span>{event.pax} PAX</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content: Production Sheet */}
            <div className="flex-1 p-8 overflow-auto">
                {selectedEvent ? (
                    <div className="max-w-4xl mx-auto space-y-8">
                        <header className="flex items-start justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-white">{selectedEvent.name}</h1>
                                <p className="text-lg text-slate-400 mt-1 flex items-center gap-2">
                                    <span className="bg-white/10 px-2 py-1 rounded text-sm">{selectedEvent.menu?.name}</span>
                                    <span>•</span>
                                    <Users className="w-4 h-4" /> {selectedEvent.pax} Invitados
                                </p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                                <div className="flex gap-2 mb-2 print:hidden">
                                    <button
                                        onClick={handleExport}
                                        className="bg-surface hover:bg-white/10 text-slate-300 p-2 rounded-lg transition-colors border border-white/5"
                                        title="Exportar Excel"
                                    >
                                        <Download className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handlePrint}
                                        className="bg-surface hover:bg-white/10 text-slate-300 p-2 rounded-lg transition-colors border border-white/5"
                                        title="Imprimir"
                                    >
                                        <Printer className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-sm text-slate-400">Coste Estimado</p>
                                <p className="text-3xl font-bold text-emerald-400 flex items-center justify-end gap-1">
                                    <Euro className="w-6 h-6" /> {totalCost.toFixed(2)}
                                </p>
                            </div>
                        </header>

                        {/* Tabs */}
                        <div className="flex border-b border-white/10 space-x-4 print:hidden">
                            <button
                                onClick={() => setActiveTab('shopping')}
                                className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'shopping' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                Lista de la Compra
                            </button>
                            <button
                                onClick={() => setActiveTab('mise-en-place')}
                                className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'mise-en-place' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                Mise en Place (Por Partida)
                            </button>
                            <button
                                onClick={() => setActiveTab('kanban')}
                                className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'kanban' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                Tablero Kanban
                            </button>
                        </div>

                        {activeTab === 'shopping' ? (
                            <div className="bg-surface border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                                <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-2 font-semibold">
                                    <ShoppingCart className="w-5 h-5 text-primary" /> Lista de la Compra
                                </div>
                                <table className="w-full text-left text-slate-300">
                                    <thead className="text-xs uppercase bg-black/20 text-slate-500">
                                        <tr>
                                            <th className="p-4">Ingrediente</th>
                                            <th className="p-4 text-right">Cant. Necesaria</th>
                                            <th className="p-4 text-right">Coste Est.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {shoppingList.map(item => (
                                            <tr key={item.ingredientId} className="hover:bg-white/[0.02]">
                                                <td className="p-4 font-medium text-white">{item.ingredientName}</td>
                                                <td className="p-4 text-right text-mono">
                                                    {item.totalQuantity.toFixed(2)} <span className="text-slate-500 text-xs">{item.unit}</span>
                                                </td>
                                                <td className="p-4 text-right font-mono text-emerald-300">
                                                    {item.totalCost.toFixed(2)}€
                                                </td>
                                            </tr>
                                        ))}
                                        {shoppingList.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="p-8 text-center text-slate-500">
                                                    No hay ingredientes para este menú.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : activeTab === 'kanban' ? (
                            <div className="h-[600px]">
                                <ProductionKanbanBoard />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Mise en Place by Station */}
                                {['hot', 'cold', 'dessert'].map(station => {
                                    const stationRecipes = selectedEvent.menu?.recipes?.filter(r => r.station === station) || [];
                                    if (stationRecipes.length === 0) return null;

                                    const stationLabels: Record<string, string> = { hot: 'Partida Caliente', cold: 'Partida Fría', dessert: 'Postres' };
                                    const stationColors: Record<string, string> = { hot: 'border-red-500/50', cold: 'border-blue-500/50', dessert: 'border-purple-500/50' };
                                    const stationBg: Record<string, string> = { hot: 'bg-red-500/10', cold: 'bg-blue-500/10', dessert: 'bg-purple-500/10' };

                                    return (
                                        <div key={station} className={`bg-surface border ${stationColors[station]} rounded-xl overflow-hidden shadow-lg flex flex-col`}>
                                            <div className={`p-3 font-bold text-white flex items-center justify-between ${stationBg[station]}`}>
                                                <span>{stationLabels[station]}</span>
                                                <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full">{stationRecipes.length} recetas</span>
                                            </div>
                                            <div className="p-4 space-y-4 flex-1">
                                                {stationRecipes.map(recipe => (
                                                    <div key={recipe.id} className="flex flex-col border-b border-white/5 last:border-0 pb-3 last:pb-0">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-slate-300 font-medium">{recipe.name}</span>
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={() => printLabel(formatLabelData(recipe, 'PREP', selectedEvent.pax))}
                                                                    className="text-slate-500 hover:text-white transition-colors"
                                                                    title="Imprimir Etiqueta Producción"
                                                                >
                                                                    <Tag size={16} />
                                                                </button>
                                                                <span className="text-xl font-bold text-white bg-white/5 px-3 py-1 rounded-lg min-w-[3rem] text-center">
                                                                    {selectedEvent.pax}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {/* Ingredients List */}
                                                        <div className="bg-black/20 rounded-lg p-2 space-y-1">
                                                            {recipe.ingredients.map((ri, idx) => (
                                                                <div key={idx} className="flex justify-between text-xs text-slate-400">
                                                                    <span>{ri.ingredient?.name || 'Unknown Ingredient'}</span>
                                                                    <span className="font-mono text-slate-300">
                                                                        {(ri.quantity * selectedEvent.pax).toFixed(2)} {ri.ingredient?.unit}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!selectedEvent.menu?.recipes || selectedEvent.menu.recipes.length === 0) && (
                                    <div className="col-span-full text-center text-slate-500 py-12">
                                        No hay recetas configuradas en este menú.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <ShoppingCart className="w-16 h-16 opacity-20 mb-4" />
                        <p>Selecciona un evento para ver la hoja de producción.</p>
                    </div>
                )
                }
            </div >
        </div >
    );
};
