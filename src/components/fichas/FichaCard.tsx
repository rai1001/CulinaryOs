import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Users, DollarSign, Activity, FileText, MoreVertical, Edit, Copy, Trash2, Download } from 'lucide-react';
import type { FichaTecnica } from '../../types/fichasTecnicas';

interface FichaCardProps {
    ficha: FichaTecnica;
    onDelete?: (id: string) => void;
    onDuplicate?: (id: string) => void;
    onDownload?: (id: string) => void;
}

export const FichaCard: React.FC<FichaCardProps> = ({ ficha, onDelete, onDuplicate, onDownload }) => {
    const navigate = useNavigate();

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'comida': return 'bg-orange-100 text-orange-700';
            case 'bebida': return 'bg-blue-100 text-blue-700';
            case 'postre': return 'bg-pink-100 text-pink-700';
            case 'ingrediente-preparado': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getDifficultyColor = (diff: string) => {
        switch (diff) {
            case 'baja': return 'text-green-600';
            case 'media': return 'text-yellow-600';
            case 'alta': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const getMarginColor = (margin: number = 0) => {
        if (margin >= 70) return 'text-green-600';
        if (margin >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 overflow-hidden group">
            {/* Header Image/Icon */}
            <div className="relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                {ficha.foto ? (
                    <img
                        src={ficha.foto}
                        alt={ficha.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <ChefHat className="w-16 h-16 text-gray-300" />
                )}

                {/* Badges */}
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full shadow-sm capitalize ${getCategoryColor(ficha.categoria)}`}>
                        {ficha.categoria}
                    </span>
                    {!ficha.activa && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-600 shadow-sm">
                            Inactiva
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3
                        onClick={() => navigate(`/fichas-tecnicas/${ficha.id}`)}
                        className="text-lg font-bold text-gray-800 line-clamp-1 hover:text-blue-600 cursor-pointer"
                        title={ficha.nombre}
                    >
                        {ficha.nombre}
                    </h3>
                    <div className="relative group/menu">
                        <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        {/* Dropdown Menu - Simple implementation */}
                        <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 hidden group-hover/menu:block z-10">
                            <button onClick={() => navigate(`/fichas-tecnicas/${ficha.id}/editar`)} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Edit className="w-3 h-3" /> Editar
                            </button>
                            <button onClick={() => onDuplicate?.(ficha.id)} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Copy className="w-3 h-3" /> Duplicar
                            </button>
                            <button onClick={() => onDelete?.(ficha.id)} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                <Trash2 className="w-3 h-3" /> Eliminar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1" title="Porciones">
                        <Users className="w-4 h-4" />
                        {ficha.porciones}
                    </span>
                    <span className={`flex items-center gap-1 capitalize font-medium ${getDifficultyColor(ficha.dificultad)}`} title="Dificultad">
                        <Activity className="w-4 h-4" />
                        {ficha.dificultad}
                    </span>
                    <span className="flex items-center gap-1" title="Versión">
                        <FileText className="w-4 h-4" />
                        v{ficha.version}
                    </span>
                </div>

                {/* Financials */}
                <div className="space-y-2 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Costo/U</span>
                        <span className="font-semibold text-gray-700">
                            €{ficha.costos.porPorcion?.toFixed(2) ?? '0.00'}
                        </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">P. Venta</span>
                        <span className="font-semibold text-gray-700">
                            €{ficha.pricing.precioVentaSugerido?.toFixed(2) ?? '0.00'}
                        </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Margen</span>
                        <span className={`font-bold ${getMarginColor(ficha.pricing.margenBruto)}`}>
                            {ficha.pricing.margenBruto?.toFixed(0) ?? 0}%
                        </span>
                    </div>
                </div>

                {/* Action Footer */}
                <div className="mt-4 flex gap-2">
                    <button
                        onClick={() => navigate(`/fichas-tecnicas/${ficha.id}`)}
                        className="flex-1 py-1.5 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        Ver Detalles
                    </button>
                    <button
                        onClick={() => onDownload?.(ficha.id)}
                        className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Descargar PDF"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>

            </div>
        </div>
    );
};
