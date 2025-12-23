import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    message: string;
    icon?: LucideIcon;
    action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    message,
    icon: Icon = Inbox,
    action
}) => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-12 text-center animate-in fade-in zoom-in duration-300">
            <div className="bg-primary/10 p-6 rounded-full mb-6 ring-1 ring-primary/20 shadow-lg shadow-primary/5">
                <Icon className="w-16 h-16 text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="max-w-sm text-slate-400 mb-8 leading-relaxed">{message}</p>
            {action && (
                <div className="transform hover:scale-105 transition-transform duration-200">
                    {action}
                </div>
            )}
        </div>
    );
};
