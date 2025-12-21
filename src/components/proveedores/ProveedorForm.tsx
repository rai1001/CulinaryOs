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
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                    type="text"
                    required
                    data-testid="supplier-name-input"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={formData.contactName || ''}
                        onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={formData.phone || ''}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                    type="email"
                    data-testid="supplier-email-input"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIF/CIF</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={formData.taxId || ''}
                        onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={formData.address || ''}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Días de Entrega (Lead Time)</label>
                    <input
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={formData.leadTime || 0}
                        onChange={e => setFormData({ ...formData, leadTime: parseInt(e.target.value) })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pedido Mínimo (€)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={formData.minimumOrderValue || 0}
                        onChange={e => setFormData({ ...formData, minimumOrderValue: parseFloat(e.target.value) })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Días de Pedido</label>
                <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day, index) => (
                        <button
                            type="button"
                            key={day}
                            onClick={() => toggleDay(index)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${formData.orderDays?.includes(index)
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                } `}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    data-testid="supplier-submit-btn"
                    disabled={isSubmitting}
                    className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </form>
    );
};
