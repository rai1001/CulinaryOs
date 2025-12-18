import React from 'react';
import { useIngredientsSync } from '../hooks/sync/useIngredientsSync';
import { useRecipesSync } from '../hooks/sync/useRecipesSync';
import { useMenusSync } from '../hooks/sync/useMenusSync';
import { useSuppliersSync } from '../hooks/sync/useSuppliersSync';
import { useStaffSync } from '../hooks/sync/useStaffSync';
import { useProductionSync } from '../hooks/sync/useProductionSync';

interface SyncProviderProps {
    children: React.ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
    // Mount sync hooks here
    // These hooks will automatically subscribe/unsubscribe based on activeOutletId

    useIngredientsSync();
    useRecipesSync();
    useMenusSync();
    useSuppliersSync();
    useStaffSync();
    useProductionSync();

    return <>{children}</>;
};
