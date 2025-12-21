import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { SyncProvider } from '../SyncProvider';
import { useStore } from '../../store/useStore';
import type { Role } from '../../types';

interface ProtectedRouteProps {
    allowedRoles?: Role[];
    redirectPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, redirectPath = '/login' }) => {
    const { currentUser } = useStore();
    const location = useLocation();

    // 1. Check Authentication
    // Note: Use 'currentUser' from store which should be hydrated from Auth listener
    // 1. Check Authentication
    // Note: Use 'currentUser' from store which should be hydrated from Auth listener
    if (!currentUser) {
        // Redirect to login, saving the location they were trying to go to
        return <Navigate to={redirectPath} state={{ from: location }} replace />;
    }

    // 2. Check Roles
    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // 3. Render Protected Content
    return (
        <SyncProvider>
            <Outlet />
        </SyncProvider>
    );
};
