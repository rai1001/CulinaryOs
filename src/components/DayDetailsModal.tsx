import React from 'react';
import { X, Calendar, Users, Plus, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Event, EventType } from '../types';

interface DayDetailsModalProps {
    date: Date;
    events: Event[];
    onClose: () => void;
    onAddEvent: () => void;
}

const eventColors: Record<EventType, string> = {
    'Comida': 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    'Cena': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50',
    'Coctel': 'bg-pink-500/20 text-pink-300 border-pink-500/50',
    'Empresa': 'bg-blue-500/20 text-blue-300 border-blue-500/50',
    'Mediodia': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
    'Noche': 'bg-purple-500/20 text-purple-300 border-purple-500/50',
    'Equipo Deportivo': 'bg-green-500/20 text-green-300 border-green-500/50',
    'Coffee Break': 'bg-stone-500/20 text-stone-300 border-stone-500/50',
    'Boda': 'bg-rose-500/20 text-rose-300 border-rose-500/50',
    'Otros': 'bg-gray-500/20 text-gray-300 border-gray-500/50',
};

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({ date, events, onClose, onAddEvent }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-surface border border-white/10 rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/20 text-primary p-2 rounded-lg">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white capitalize">
                                {format(date, 'EEEE, d MMMM', { locale: es })}
                            </h3>
                            <p className="text-sm text-slate-400">
                                {events.length} {events.length === 1 ? 'Evento' : 'Eventos'} programados
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Event List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {events.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <Calendar className="w-12 h-12 opacity-20 mb-3" />
                            <p>No hay eventos programados para este día.</p>
                        </div>
                    ) : (
                        events.map(event => (
                            <div
                                key={event.id}
                                className={`p-4 rounded-xl border ${eventColors[event.type] || 'bg-slate-700/50 border-slate-600'} transition-all hover:scale-[1.01]`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg">{event.name}</h4>
                                    <span className="uppercase text-[10px] font-bold tracking-wider opacity-80 border border-current px-2 py-0.5 rounded-full">
                                        {event.type}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm opacity-90">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        <span>{event.pax} PAX</span>
                                    </div>
                                    {event.menu && (
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            <span className="truncate">{event.menu.name}</span>
                                        </div>
                                    )}
                                </div>

                                {event.notes && (
                                    <div className="mt-3 pt-3 border-t border-white/10 text-xs opacity-70 italic line-clamp-3">
                                        "{event.notes}"
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-white/10 bg-white/5 shrink-0">
                    <button
                        onClick={onAddEvent}
                        className="w-full bg-primary hover:bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-5 h-5" /> Añadir Nuevo Evento
                    </button>
                </div>
            </div>
        </div>
    );
};
