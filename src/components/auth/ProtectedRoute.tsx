import React from 'react';
import { Outlet } from 'react-router-dom';
import { SyncProvider } from '../SyncProvider';
import type { Role } from '../../types';

interface ProtectedRouteProps {
    allowedRoles?: Role[];
    redirectPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = () => {
    // In a real app, you would check auth status here.
    // For now, we just passthrough because auth logic is mocked nicely in Sidebar.

    return (
        <SyncProvider>
            <Outlet />
        </SyncProvider>
    );
};
