import React, { useState } from 'react';
import { Plus, Trash2, Edit2, ThermometerSnowflake, Save } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { PCC, PCCType } from '../../types';

export const PCCConfiguration: React.FC = () => {
    const { pccs, addPCC, updatePCC, deletePCC } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<PCC>>({
        type: 'FRIDGE',
        isActive: true,
        minTemp: 0,
        maxTemp: 5
    });

    const resetForm = () => {
        setFormData({
            type: 'FRIDGE',
            isActive: true,
            minTemp: 0,
            maxTemp: 5,
            name: '',
            description: ''
        });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        if (editingId) {
            updatePCC({ ...formData, id: editingId } as PCC);
        } else {
            addPCC({
                ...formData,
                id: crypto.randomUUID(),
                isActive: true
            } as PCC);
        }
        resetForm();
    };

    const handleEdit = (pcc: PCC) => {
        setFormData(pcc);
        setEditingId(pcc.id);
        setIsAdding(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('¿Estás seguro de eliminar este punto crítico?')) {
            deletePCC(id);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Puntos Críticos de Control (PCC)
                </h2>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Añadir PCC
                    </button>
                )}
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
                        {editingId ? 'Editar PCC' : 'Nuevo PCC'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nombre
                            </label>
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white"
                                placeholder="Ej: Nevera 1 - Carnes"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Tipo
                            </label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value as PCCType })}
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                                <option value="FRIDGE">Nevera / Cámara Frigorífica</option>
                                <option value="FREEZER">Congelador</option>
                                <option value="HOT_HOLDING">Mantenimiento en Caliente</option>
                                <option value="COOLING">Abatimiento</option>
                                <option value="OTHER">Otro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Temperatura Mínima (°C)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.minTemp}
                                onChange={e => setFormData({ ...formData, minTemp: parseFloat(e.target.value) })}
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Temperatura Máxima (°C)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.maxTemp}
                                onChange={e => setFormData({ ...formData, maxTemp: parseFloat(e.target.value) })}
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Descripción
                            </label>
                            <input
                                type="text"
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white"
                                placeholder="Ubicación, detalles..."
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                        >
                            <Save className="w-4 h-4" />
                            {editingId ? 'Guardar Cambios' : 'Crear PCC'}
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pccs.map((pcc) => (
                    <div key={pcc.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                    <ThermometerSnowflake className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">{pcc.name}</h3>
                                    <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                        {pcc.type}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleEdit(pcc)}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(pcc.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {pcc.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 ml-11">
                                {pcc.description}
                            </p>
                        )}

                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm">
                            <span className="text-gray-500">Rango Seguro:</span>
                            <span className="font-medium font-mono text-gray-900 dark:text-white">
                                {pcc.minTemp}°C - {pcc.maxTemp}°C
                            </span>
                        </div>
                    </div>
                ))}

                {pccs.length === 0 && !isAdding && (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        <ThermometerSnowflake className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">No hay Puntos Críticos definidos</p>
                        <p className="text-sm">Añade neveras, congeladores o zonas de cocción para empezar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
