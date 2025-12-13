import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Plus, Trash2, Edit2, ClipboardCheck, Save, Clock, CalendarDays, CalendarClock } from 'lucide-react';
import type { HACCPTask, HACCPTaskFrequency } from '../../types';

const frequencyOptions: { value: HACCPTaskFrequency; label: string; icon: React.ReactNode }[] = [
    { value: 'DAILY', label: 'Diario', icon: <Clock className="w-4 h-4" /> },
    { value: 'WEEKLY', label: 'Semanal', icon: <CalendarDays className="w-4 h-4" /> },
    { value: 'MONTHLY', label: 'Mensual', icon: <CalendarClock className="w-4 h-4" /> },
];

export const TaskManager: React.FC = () => {
    const { haccpTasks, addHACCPTask, updateHACCPTask, deleteHACCPTask } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<HACCPTask>>({
        frequency: 'DAILY',
        isActive: true
    });

    const resetForm = () => {
        setFormData({ frequency: 'DAILY', isActive: true, name: '', description: '' });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        if (editingId) {
            updateHACCPTask({ ...formData, id: editingId } as HACCPTask);
        } else {
            addHACCPTask({
                ...formData,
                id: crypto.randomUUID(),
                isActive: true
            } as HACCPTask);
        }
        resetForm();
    };

    const handleEdit = (task: HACCPTask) => {
        setFormData(task);
        setEditingId(task.id);
        setIsAdding(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('¿Eliminar esta tarea HACCP?')) {
            deleteHACCPTask(id);
        }
    };

    const groupedTasks = {
        DAILY: haccpTasks.filter(t => t.frequency === 'DAILY'),
        WEEKLY: haccpTasks.filter(t => t.frequency === 'WEEKLY'),
        MONTHLY: haccpTasks.filter(t => t.frequency === 'MONTHLY'),
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Tareas HACCP Programadas
                </h2>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Tarea
                    </button>
                )}
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
                        {editingId ? 'Editar Tarea' : 'Nueva Tarea HACCP'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nombre de la Tarea
                            </label>
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                                placeholder="Ej: Control Temperatura Neveras"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Frecuencia
                            </label>
                            <div className="flex gap-2">
                                {frequencyOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, frequency: opt.value })}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${formData.frequency === opt.value
                                                ? 'bg-indigo-100 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {opt.icon}
                                        <span className="text-sm">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Descripción
                            </label>
                            <input
                                type="text"
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                                placeholder="Detalles adicionales..."
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            Cancelar
                        </button>
                        <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                            <Save className="w-4 h-4" />
                            {editingId ? 'Guardar' : 'Crear Tarea'}
                        </button>
                    </div>
                </form>
            )}

            {/* Task Groups */}
            <div className="space-y-8">
                {Object.entries(groupedTasks).map(([freq, tasks]) => (
                    <div key={freq}>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            {frequencyOptions.find(o => o.value === freq)?.icon}
                            {frequencyOptions.find(o => o.value === freq)?.label}
                            <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
                                {tasks.length}
                            </span>
                        </h3>
                        <div className="space-y-2">
                            {tasks.map(task => (
                                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                            <ClipboardCheck className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">{task.name}</h4>
                                            {task.description && (
                                                <p className="text-sm text-gray-500">{task.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleEdit(task)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(task.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {tasks.length === 0 && (
                                <p className="text-sm text-gray-400 italic pl-2">Sin tareas configuradas</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
