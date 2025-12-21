import React from 'react';
import { Edit2, Trash2, Phone, Mail, Truck, History } from 'lucide-react';
import type { Supplier } from '../../types/suppliers';

interface ProveedoresListProps {
    suppliers: Supplier[];
    onEdit: (supplier: Supplier) => void;
    onDelete: (id: string, name: string) => void;
    onViewIngredients: (supplier: Supplier) => void;
}

export const ProveedoresList: React.FC<ProveedoresListProps> = ({ suppliers, onEdit, onDelete, onViewIngredients }) => {
    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map(supplier => (
                <div key={supplier.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative group">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold text-gray-800">{supplier.name}</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onEdit(supplier)}
                                className="text-gray-400 hover:text-indigo-600 p-1 rounded-md hover:bg-indigo-50 transition-colors"
                                title="Editar"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => onDelete(supplier.id, supplier.name)}
                                className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                                title="Eliminar"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3 text-gray-600">
                        {supplier.contactName && (
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700">{supplier.contactName}</span>
                            </div>
                        )}
                        {supplier.phone && (
                            <div className="flex items-center gap-2">
                                <Phone size={16} />
                                <span>{supplier.phone}</span>
                            </div>
                        )}
                        {supplier.email && (
                            <div className="flex items-center gap-2">
                                <Mail size={16} />
                                <span>{supplier.email}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Truck size={16} />
                            <span>Entrega: {supplier.leadTime} días • Min: {supplier.minimumOrderValue || 0}€</span>
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Días de Pedido</span>
                            <div className="flex gap-1 mt-1">
                                {daysOfWeek.map((day, index) => (
                                    <span
                                        key={day}
                                        className={`text-xs px-2 py-1 rounded ${supplier.orderDays?.includes(index)
                                            ? 'bg-green-100 text-green-700 font-medium'
                                            : 'bg-gray-100 text-gray-400'
                                            } `}
                                    >
                                        {day[0]}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Ingredients List Button */}
                        <div className="pt-4 mt-2 border-t border-gray-100 text-center">
                            <button
                                onClick={() => onViewIngredients(supplier)}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors flex items-center justify-center gap-2 mx-auto"
                            >
                                <History size={16} />
                                Ver Ingredientes & Histórico
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
