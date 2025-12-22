import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Edit, Copy, Trash2, Download, ChefHat } from 'lucide-react';
import type { FichaTecnica } from '../../types/fichasTecnicas';

interface FichasListProps {
    fichas: FichaTecnica[];
    onDelete?: (id: string) => void;
    onDuplicate?: (id: string) => void;
    onDownload?: (id: string) => void;
}

export const FichasList: React.FC<FichasListProps> = ({ fichas, onDelete, onDuplicate, onDownload }) => {
    const navigate = useNavigate();

    const getMarginColor = (margin: number = 0) => {
        if (margin >= 70) return 'text-green-600 font-medium';
        if (margin >= 50) return 'text-yellow-600 font-medium';
        return 'text-red-600 font-medium';
    };

    if (fichas.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">No se encontraron fichas técnicas.</p>
                <p className="text-gray-400 text-sm mt-1">Intenta ajustar los filtros o crea una nueva.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4 w-16">Foto</th>
                            <th className="px-6 py-4">Nombre</th>
                            <th className="px-6 py-4">Categoría</th>
                            <th className="px-6 py-4 text-center">Porciones</th>
                            <th className="px-6 py-4 text-right">Costo/U</th>
                            <th className="px-6 py-4 text-right">P. Venta</th>
                            <th className="px-6 py-4 text-right">Margen</th>
                            <th className="px-6 py-4 text-right w-24">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {fichas.map((ficha) => (
                            <tr key={ficha.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                        {ficha.foto ? (
                                            <img src={ficha.foto} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <ChefHat className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-3 font-medium text-gray-900 cursor-pointer hover:text-blue-600" onClick={() => navigate(`/fichas-tecnicas/${ficha.id}`)}>
                                    {ficha.nombre}
                                </td>
                                <td className="px-6 py-3">
                                    <span className="capitalize px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                                        {ficha.categoria}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-center text-gray-600">
                                    {ficha.porciones}
                                </td>
                                <td className="px-6 py-3 text-right text-gray-600">
                                    €{ficha.costos.porPorcion?.toFixed(2) ?? '0.00'}
                                </td>
                                <td className="px-6 py-3 text-right text-gray-600">
                                    €{ficha.pricing.precioVentaSugerido?.toFixed(2) ?? '0.00'}
                                </td>
                                <td className={`px-6 py-3 text-right ${getMarginColor(ficha.pricing.margenBruto)}`}>
                                    {ficha.pricing.margenBruto?.toFixed(0) ?? 0}%
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => navigate(`/fichas-tecnicas/${ficha.id}/editar`)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>

                                        <div className="relative group/menu">
                                            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded shadow-lg border border-gray-100 hidden group-hover/menu:block z-10 text-left">
                                                <button onClick={() => onDuplicate?.(ficha.id)} className="w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                                    <Copy className="w-3 h-3" /> Duplicar
                                                </button>
                                                <button onClick={() => onDownload?.(ficha.id)} className="w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                                    <Download className="w-3 h-3" /> PDF
                                                </button>
                                                <div className="border-t border-gray-100 my-1"></div>
                                                <button onClick={() => onDelete?.(ficha.id)} className="w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
                                                    <Trash2 className="w-3 h-3" /> Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
