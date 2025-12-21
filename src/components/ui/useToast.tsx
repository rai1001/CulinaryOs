import { useState, useCallback } from 'react';

type ToastProps = {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
};

export const useToast = () => {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const toast = useCallback((title: string, variant: 'default' | 'destructive' | 'success' | 'error' = 'default') => {
        // Basic mock implementation: just log it or maybe show a native alert if critical?
        // ideally this would hook into a context. For now, to fix build:
        console.log(`Toast: ${title} (${variant})`);

        // Optional: add to state if we rendered them somewhere
        setToasts(prev => [...prev, { title, variant: variant as any }]);
    }, []);

    return { toast, addToast: toast, toasts };
};
