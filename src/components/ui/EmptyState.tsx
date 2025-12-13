import React, { type ReactNode } from 'react';
import {
    Package,
    ChefHat,
    Calendar,
    ShoppingCart,
    Trash2,
    ClipboardList,
    Plus,
    Upload
} from 'lucide-react';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
}

/**
 * Reusable empty state component with icon, title, description and optional actions
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
    secondaryAction
}) => (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        {icon && (
            <div className="p-4 rounded-2xl bg-white/5 mb-6 text-slate-400">
                {icon}
            </div>
        )}
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        {description && (
            <p className="text-slate-400 text-sm max-w-md mb-6">{description}</p>
        )}
        {(action || secondaryAction) && (
            <div className="flex flex-wrap gap-3 justify-center">
                {action && (
                    <button
                        onClick={action.onClick}
                        className="flex items-center gap-2 bg-primary hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        {action.label}
                    </button>
                )}
                {secondaryAction && (
                    <button
                        onClick={secondaryAction.onClick}
                        className="flex items-center gap-2 bg-surface hover:bg-white/10 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10"
                    >
                        <Upload className="w-4 h-4" />
                        {secondaryAction.label}
                    </button>
                )}
            </div>
        )}
    </div>
);

// Pre-configured empty states for common use cases

export const EmptyIngredients: React.FC<{ onAdd?: () => void }> = ({ onAdd }) => (
    <EmptyState
        icon={<Package size={48} />}
        title="Sin ingredientes"
        description="Añade ingredientes para comenzar a gestionar tu inventario y calcular costes de recetas."
        action={onAdd ? { label: "Añadir Ingrediente", onClick: onAdd } : undefined}
    />
);

export const EmptyRecipes: React.FC<{ onAdd?: () => void }> = ({ onAdd }) => (
    <EmptyState
        icon={<ChefHat size={48} />}
        title="Sin recetas"
        description="Crea recetas para organizar tu producción y calcular costes automáticamente."
        action={onAdd ? { label: "Crear Receta", onClick: onAdd } : undefined}
    />
);

export const EmptyEvents: React.FC<{ onAdd?: () => void }> = ({ onAdd }) => (
    <EmptyState
        icon={<Calendar size={48} />}
        title="Sin eventos programados"
        description="Programa eventos para planificar la producción y generar listas de compra automáticas."
        action={onAdd ? { label: "Crear Evento", onClick: onAdd } : undefined}
    />
);

export const EmptyOrders: React.FC<{ onGenerate?: () => void }> = ({ onGenerate }) => (
    <EmptyState
        icon={<ShoppingCart size={48} />}
        title="Sin pedidos"
        description="Genera pedidos automáticos basados en los eventos programados y tus niveles de stock."
        action={onGenerate ? { label: "Generar Pedidos", onClick: onGenerate } : undefined}
    />
);

export const EmptyWaste: React.FC = () => (
    <EmptyState
        icon={<Trash2 size={48} />}
        title="Sin registros de merma"
        description="Registra las mermas diarias para analizar pérdidas y optimizar costes."
    />
);

export const EmptyHACCP: React.FC = () => (
    <EmptyState
        icon={<ClipboardList size={48} />}
        title="Sin registros HACCP"
        description="Configura puntos de control críticos y comienza a registrar temperaturas y controles."
    />
);
