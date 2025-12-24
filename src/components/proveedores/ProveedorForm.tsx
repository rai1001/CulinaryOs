import React, { useState, useEffect } from 'react';
import type { Supplier } from '../../types/suppliers';

interface ProveedorFormProps {
    initialData?: Partial<Supplier> | null;
    onSubmit: (data: Omit<Supplier, 'id'>) => Promise<void>;
    onCancel: () => void;
    isSubmitting?: boolean;
}

export const ProveedorForm: React.FC<ProveedorFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting = false }) => {
    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const [formData, setFormData] = useState<Partial<Supplier>>({
        name: '',
        contactName: '',
        email: '',
        phone: '',
        leadTime: 1,
        orderDays: [],
        minimumOrderValue: 0,
        address: '',
        taxId: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                name: '',
                contactName: '',
                email: '',
                phone: '',
                leadTime: 1,
                orderDays: [],
                minimumOrderValue: 0
            });
        }
    }, [initialData]);

    const toggleDay = (day: number) => {
        const currentDays = formData.orderDays || [];
        if (currentDays.includes(day)) {
            setFormData({ ...formData, orderDays: currentDays.filter(d => d !== day) });
        } else {
            setFormData({ ...formData, orderDays: [...currentDays, day].sort() });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onSubmit(formData as Omit<Supplier, 'id'>);
        } catch (error) {
            console.error("Form submission error", error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nombre Empresa</label>
                <input
                    type="text"
                    required
                    data-testid="supplier-name-input"
                    className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/50 text-white placeholder-slate-600 transition-all font-medium"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contacto</label>
                    <input
                        type="text"
                        className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/50 text-white placeholder-slate-600 transition-all font-medium"
                        value={formData.contactName || ''}
                        onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Teléfono</label>
                    <input
                        type="tel"
                        className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/50 text-white placeholder-slate-600 transition-all font-medium"
                        value={formData.phone || ''}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
                <input
                    type="email"
                    data-testid="supplier-email-input"
                    className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/50 text-white placeholder-slate-600 transition-all font-medium"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">NIF/CIF</label>
                    <input
                        type="text"
                        className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/50 text-white placeholder-slate-600 transition-all font-medium"
                        value={formData.taxId || ''}
                        onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Dirección</label>
                    <input
                        type="text"
                        className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/50 text-white placeholder-slate-600 transition-all font-medium"
                        value={formData.address || ''}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Lead Time (Días)</label>
                    <input
                        type="number"
                        min="0"
                        className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/50 text-white placeholder-slate-600 transition-all font-mono font-medium"
                        value={formData.leadTime || 0}
                        onChange={e => setFormData({ ...formData, leadTime: parseInt(e.target.value) })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Pedido Mínimo (€)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/50 text-white placeholder-slate-600 transition-all font-mono font-medium"
                        value={formData.minimumOrderValue || 0}
                        onChange={e => setFormData({ ...formData, minimumOrderValue: parseFloat(e.target.value) })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Días de Pedido</label>
                <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day, index) => (
                        <button
                            type="button"
                            key={day}
                            onClick={() => toggleDay(index)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${formData.orderDays?.includes(index)
                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                : 'bg-black/20 text-slate-500 border-white/5 hover:bg-white/10'
                                } `}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/5">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 rounded-xl text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    data-testid="supplier-submit-btn"
                    disabled={isSubmitting}
                    className={`px-8 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isSubmitting ? '...' : 'Guardar Proveedor'}
                </button>
            </div>
        </form>
    );
};
