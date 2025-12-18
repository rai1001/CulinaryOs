import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Edit2, Trash2, Briefcase, Loader2 } from 'lucide-react';
import type { Employee, Role } from '../types';
import { getRoleLabel } from '../utils/labels';
import { addDocument, updateDocument, deleteDocument } from '../services/firestoreService';
import { collections } from '../firebase/collections';

export const StaffView: React.FC = () => {
    const { staff, addEmployee, updateEmployee, deleteEmployee, activeOutletId } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Employee>>({
        name: '',
        role: 'COOK_ROTATING',
        vacationDaysTotal: 30,
        consecutiveWorkDays: 0,
        daysOffInLast28Days: 0,
        vacationDates: []
    });

    const handleOpenModal = (employee?: Employee) => {
        if (employee) {
            setEditingEmployee(employee);
            setFormData(employee);
        } else {
            setEditingEmployee(null);
            setFormData({
                name: '',
                role: 'COOK_ROTATING',
                vacationDaysTotal: 30,
                consecutiveWorkDays: 0,
                daysOffInLast28Days: 0,
                vacationDates: []
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEmployee(null);
        setIsSubmitting(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeOutletId) {
            alert("Por favor, selecciona una cocina activa.");
            return;
        }

        setIsSubmitting(true);
        try {
            const employeeData = {
                ...formData,
                outletId: activeOutletId
            };

            if (editingEmployee) {
                // Update
                await updateDocument('staff', editingEmployee.id, employeeData);
                updateEmployee({ ...editingEmployee, ...employeeData } as Employee);
            } else {
                // Create
                const newId = await addDocument(collections.staff, employeeData);
                const newEmployee: Employee = {
                    id: newId,
                    ...employeeData as Omit<Employee, 'id'>
                } as Employee;
                addEmployee(newEmployee);
            }
            handleCloseModal();
        } catch (error) {
            console.error("Error saving employee:", error);
            alert("Error al guardar el empleado.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Estás seguro de eliminar a ${name}?`)) return;

        try {
            await deleteDocument('staff', id);
            deleteEmployee(id);
        } catch (error) {
            console.error("Error deleting employee:", error);
            alert("Error al eliminar el empleado.");
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Personal</h2>
                    <p className="text-gray-600">Gestión de empleados y roles</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    Nuevo Empleado
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-6 py-3">Nombre</th>
                            <th className="px-6 py-3">Rol</th>
                            <th className="px-6 py-3 text-center">Vacaciones</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {staff.map(emp => (
                            <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                            {emp.name[0]}
                                        </div>
                                        {emp.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        <Briefcase size={12} />
                                        {getRoleLabel(emp.role)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-sm text-gray-600">
                                        {emp.vacationDates?.length || 0} / {emp.vacationDaysTotal} días
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleOpenModal(emp)}
                                            className="text-gray-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(emp.id, emp.name)}
                                            className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {staff.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">
                                    No hay empleados registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full animate-in fade-in zoom-in duration-200">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">
                            {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                                >
                                    <option value="HEAD_CHEF">Jefe de Cocina</option>
                                    <option value="COOK_MORNING">Cocinero Mañanas</option>
                                    <option value="COOK_ROTATING">Cocinero Rotativo</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Días Vacaciones (Anual)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.vacationDaysTotal}
                                    onChange={e => setFormData({ ...formData, vacationDaysTotal: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingEmployee ? 'Guardar Cambios' : 'Crear Empleado'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
