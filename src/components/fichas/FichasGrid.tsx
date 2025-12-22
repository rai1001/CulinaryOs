import React from 'react';
import { FichaCard } from './FichaCard';
import type { FichaTecnica } from '../../types/fichasTecnicas';

interface FichasGridProps {
    fichas: FichaTecnica[];
    onDelete?: (id: string) => void;
    onDuplicate?: (id: string) => void;
    onDownload?: (id: string) => void;
}

export const FichasGrid: React.FC<FichasGridProps> = ({ fichas, onDelete, onDuplicate, onDownload }) => {
    if (fichas.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">No se encontraron fichas técnicas.</p>
                <p className="text-gray-400 text-sm mt-1">Intenta ajustar los filtros o crea una nueva.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lx:grid-cols-4 gap-6">
            {fichas.map(ficha => (
                <FichaCard
                    key={ficha.id}
                    ficha={ficha}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                    onDownload={onDownload}
                />
            ))}
        </div>
    );
};
