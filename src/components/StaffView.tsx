import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Edit2, Trash2, Briefcase, Loader2 } from 'lucide-react';
import type { Employee, Role } from '../types';
import { getRoleLabel } from '../utils/labels';
import { addDocument, updateDocument, deleteDocument } from '../services/firestoreService';
import { collections } from '../firebase/collections';
import { ExcelImporter } from './common/ExcelImporter';

export const StaffView: React.FC = () => {
    const { staff, activeOutletId } = useStore();
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
        vacationDates: [],
        status: 'ACTIVE',
        qualificationDocs: []
    });

    const handleImport = async (data: any[]) => {
        if (!activeOutletId) {
            alert("No hay cocina activa seleccionada.");
            return;
        }

        if (!confirm(`Se importarán ${data.length} empleados. ¿Continuar?`)) return;

        let successCount = 0;
        for (const row of data) {
            try {
                const name = row['Nombre'] || row['Name'] || row['nombre'];
                const roleRaw = row['Rol'] || row['Role'] || row['rol'] || 'COOK_ROTATING';
                // Basic mapping, assume default if unknown
                const role: Role = ['HEAD_CHEF', 'COOK_MORNING', 'COOK_ROTATING'].includes(roleRaw)
                    ? roleRaw as Role
                    : 'COOK_ROTATING';

                if (!name) continue;

                const employeeData = {
                    name: String(name),
                    role,
                    vacationDaysTotal: Number(row['Vacaciones'] || 30),
                    consecutiveWorkDays: 0,
                    daysOffInLast28Days: 0,
                    vacationDates: [],
                    outletId: activeOutletId
                };

                await addDocument(collections.staff, employeeData);
                successCount++;
            } catch (error) {
                console.error("Error importing staff row", row, error);
            }
        }
        alert(`Importación completada: ${successCount} empleados añadidos.`);
    };

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
                vacationDates: [],
                status: 'ACTIVE',
                qualificationDocs: []
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

        if (isSubmitting) return; // double check

        setIsSubmitting(true);
        try {
            const employeeData = {
                ...formData,
                outletId: activeOutletId
            };

            if (editingEmployee) {
                // Update
                await updateDocument('staff', editingEmployee.id, employeeData);
            } else {
                // Create
                await addDocument(collections.staff, employeeData);
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
        } catch (error) {
            console.error("Error deleting employee:", error);
            alert("Error al eliminar el empleado.");
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Personal</h2>
                    <p className="text-slate-400">Gestión de empleados y roles</p>
                </div>
                <div className="flex gap-3">
                    <ExcelImporter
                        onImport={handleImport}
                        buttonLabel="Importar Excel"
                        template={{ col1: "Nombre", col2: "Rol" }}
                    />
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Plus size={20} />
                        Nuevo Empleado
                    </button>
                </div>
            </div>

            <div className="bg-surface rounded-xl shadow-sm border border-white/10 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-slate-400 uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-6 py-3">Nombre</th>
                            <th className="px-6 py-3">Rol</th>
                            <th className="px-6 py-3 text-center">Estado</th>
                            <th className="px-6 py-3 text-center">Vacaciones</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {staff.map(emp => (
                            <tr key={emp.id} className="hover:bg-white/5 transition-colors text-slate-300">
                                <td className="px-6 py-4 font-medium text-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                                            {emp.name[0]}
                                        </div>
                                        {emp.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-slate-200">
                                        <Briefcase size={12} />
                                        {getRoleLabel(emp.role)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${emp.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {emp.status === 'ACTIVE' ? 'Activo' : 'Baja'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-sm text-slate-400">
                                        {emp.vacationDates?.length || 0} / {emp.vacationDaysTotal} días
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleOpenModal(emp)}
                                            className="text-slate-400 hover:text-primary p-1 rounded hover:bg-white/10 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(emp.id, emp.name)}
                                            className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-white/10 transition-colors"
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
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">
                                    No hay empleados registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Qualifications Summary Section */}
            <div className="mt-8 bg-surface/30 border border-white/5 rounded-xl p-6 backdrop-blur-sm shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                    Documentación y Títulos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {staff.map(emp => (
                        <div key={emp.id} className="bg-black/20 rounded-lg p-4 border border-white/5">
                            <div className="font-bold text-slate-200 mb-2">{emp.name}</div>
                            {emp.qualificationDocs && emp.qualificationDocs.length > 0 ? (
                                <div className="space-y-2">
                                    {emp.qualificationDocs.map((doc, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs bg-white/5 p-2 rounded">
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate mr-2">
                                                {doc.name}
                                            </a>
                                            {doc.expiryDate && (
                                                <span className={`px-1.5 py-0.5 rounded ${new Date(doc.expiryDate) < new Date() ? 'bg-red-500/20 text-red-300' : 'text-slate-500 font-mono italic'}`}>
                                                    Exp: {doc.expiryDate}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-slate-600 italic">Sin documentos registrados</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>


            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-surface rounded-xl shadow-xl p-8 max-w-md w-full animate-in fade-in zoom-in duration-200 border border-white/10">
                        <h3 className="text-2xl font-bold text-white mb-6">
                            {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-white placeholder-slate-500"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Rol</label>
                                <select
                                    className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-white"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                                >
                                    <option value="HEAD_CHEF">Jefe de Cocina</option>
                                    <option value="COOK_MORNING">Cocinero Mañanas</option>
                                    <option value="COOK_ROTATING">Cocinero Rotativo</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Días Vacaciones (Anual)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-white"
                                    value={formData.vacationDaysTotal}
                                    onChange={e => setFormData({ ...formData, vacationDaysTotal: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Estado</label>
                                <select
                                    className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-white"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                                >
                                    <option value="ACTIVE">Activo</option>
                                    <option value="INACTIVE">Baja / Inactivo</option>
                                </select>
                            </div>

                            <div className="pt-2">
                                <label className="block text-sm font-medium text-slate-300 mb-2">Títulos y Documentos (Enlaces)</label>
                                <div className="space-y-2">
                                    {(formData.qualificationDocs || []).map((doc, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                placeholder="Nombre (ej. Manipulador)"
                                                className="flex-1 px-2 py-1.5 bg-black/30 border border-white/5 rounded text-xs text-white"
                                                value={doc.name}
                                                onChange={e => {
                                                    const newDocs = [...(formData.qualificationDocs || [])];
                                                    newDocs[idx].name = e.target.value;
                                                    setFormData({ ...formData, qualificationDocs: newDocs });
                                                }}
                                            />
                                            <input
                                                type="text"
                                                placeholder="URL"
                                                className="flex-1 px-2 py-1.5 bg-black/30 border border-white/5 rounded text-xs text-white"
                                                value={doc.url}
                                                onChange={e => {
                                                    const newDocs = [...(formData.qualificationDocs || [])];
                                                    newDocs[idx].url = e.target.value;
                                                    setFormData({ ...formData, qualificationDocs: newDocs });
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newDocs = (formData.qualificationDocs || []).filter((_, i) => i !== idx);
                                                    setFormData({ ...formData, qualificationDocs: newDocs });
                                                }}
                                                className="text-red-400 hover:text-red-300 p-1"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setFormData({
                                            ...formData,
                                            qualificationDocs: [...(formData.qualificationDocs || []), { name: '', url: '' }]
                                        })}
                                        className="text-primary hover:text-blue-400 text-xs font-bold flex items-center gap-1 mt-1"
                                    >
                                        <Plus size={14} /> Añadir Documento
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
