import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { v4 as uuidv4 } from 'uuid';
import type { Event, EventType } from '../types';
import { Calendar, Users, FileText, X } from 'lucide-react';

interface EventFormProps {
    initialDate?: string;
    onClose: () => void;
}

const EVENT_TYPES: EventType[] = [
    'Comida', 'Cena', 'Empresa', 'Coctel', 'Mediodia', 'Noche', 'Equipo Deportivo', 'Coffee Break'
];

export const EventForm: React.FC<EventFormProps> = ({ initialDate, onClose }) => {
    const { addEvent, menus } = useStore();
    const [formData, setFormData] = useState({
        name: '',
        date: initialDate || new Date().toISOString().split('T')[0],
        pax: 0,
        type: 'Comida' as EventType,
        menuId: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newEvent: Event = {
            id: uuidv4(),
            name: formData.name,
            date: formData.date,
            pax: formData.pax,
            type: formData.type,
            menuId: formData.menuId,
            menu: menus.find(m => m.id === formData.menuId) // Hydrate if needed for simple access
        };

        addEvent(newEvent);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-surface p-6 rounded-xl border border-white/5 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Nuevo Evento</h3>
                <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            <div className="space-y-1">
                <label className="text-sm text-slate-400">Nombre del Evento</label>
                <input
                    required
                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white focus:border-primary"
                    placeholder="Ej: Boda Familia Smith"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm text-slate-400">Fecha</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                            type="date"
                            required
                            className="w-full bg-black/20 border border-white/10 rounded pl-9 pr-3 py-2 text-white"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm text-slate-400">PAX (Personas)</label>
                    <div className="relative">
                        <Users className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                            type="number"
                            min="1"
                            required
                            className="w-full bg-black/20 border border-white/10 rounded pl-9 pr-3 py-2 text-white"
                            value={formData.pax}
                            onChange={e => setFormData({ ...formData, pax: Number(e.target.value) })}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm text-slate-400">Tipo de Evento</label>
                <select
                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white outline-none"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as EventType })}
                >
                    {EVENT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-sm text-slate-400">Menú (Opcional)</label>
                <div className="relative">
                    <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <select
                        className="w-full bg-black/20 border border-white/10 rounded pl-9 pr-3 py-2 text-white outline-none appearance-none"
                        value={formData.menuId}
                        onChange={e => setFormData({ ...formData, menuId: e.target.value })}
                    >
                        <option value="">Seleccionar Menú...</option>
                        {menus.map(menu => (
                            <option key={menu.id} value={menu.id}>{menu.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <button
                type="submit"
                className="w-full bg-primary hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors mt-2"
            >
                Crear Evento
            </button>
        </form>
    );
};
