import React from 'react';

export const LoadingSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`animate-pulse bg-surface/50 rounded-lg ${className}`} />
    );
};

export const EventsSkeleton: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-6 overflow-hidden animate-pulse">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded" />
                    <div className="h-8 w-48 bg-white/10 rounded" />
                </div>
                <div className="h-10 w-32 bg-white/10 rounded-lg" />
                <div className="h-10 w-48 bg-white/10 rounded-lg" />
            </div>

            <div className="flex-1 glass-card p-4 flex flex-col overflow-hidden border border-white/5 rounded-xl">
                <div className="grid grid-cols-7 mb-2 border-b border-white/5 pb-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="flex justify-center">
                            <div className="h-4 w-8 bg-white/10 rounded" />
                        </div>
                    ))}
                </div>
                <div className="flex-1 grid grid-cols-7 auto-rows-fr gap-1 overflow-hidden">
                    {Array.from({ length: 35 }).map((_, i) => (
                        <div key={i} className="bg-white/5 rounded-lg p-2 min-h-[100px]">
                            <div className="h-4 w-4 bg-white/10 rounded-full mb-2" />
                            <div className="space-y-1">
                                <div className="h-3 w-full bg-white/10 rounded" />
                                <div className="h-3 w-2/3 bg-white/10 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const TableSkeleton: React.FC = () => {
    return (
        <div className="w-full bg-surface border border-white/5 rounded-xl overflow-hidden animate-pulse">
            <div className="h-12 bg-white/5 border-b border-white/5 mb-4" />
            <div className="space-y-4 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-4">
                        <div className="h-12 w-12 bg-white/5 rounded-lg" />
                        <div className="flex-1 space-y-2 py-2">
                            <div className="h-4 w-1/3 bg-white/5 rounded" />
                            <div className="h-3 w-1/4 bg-white/5 rounded" />
                        </div>
                        <div className="h-12 w-24 bg-white/5 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export const CardGridSkeleton: React.FC = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-surface border border-white/5 rounded-xl p-6 space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="h-6 w-1/3 bg-white/5 rounded" />
                        <div className="h-8 w-8 bg-white/5 rounded" />
                    </div>
                    <div className="h-4 w-2/3 bg-white/5 rounded" />
                    <div className="pt-4 flex gap-4">
                        <div className="flex-1 h-10 bg-white/5 rounded-lg" />
                        <div className="flex-1 h-10 bg-white/5 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export const ProductionSkeleton: React.FC = () => {
    return (
        <div className="flex h-full bg-background animate-pulse">
            <div className="w-80 border-r border-white/5 bg-surface/30 p-4 flex flex-col gap-4">
                <div className="h-8 w-32 bg-white/10 rounded" />
                <div className="h-48 w-full bg-white/10 rounded-xl" />
                <div className="flex-1 space-y-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-16 w-full bg-white/10 rounded-lg" />
                    ))}
                </div>
            </div>
            <div className="flex-1 p-8 space-y-8">
                <div className="flex justify-between">
                    <div className="space-y-2">
                        <div className="h-10 w-64 bg-white/10 rounded" />
                        <div className="h-6 w-48 bg-white/10 rounded" />
                    </div>
                    <div className="space-y-2 flex flex-col items-end">
                        <div className="flex gap-2">
                            <div className="h-10 w-10 bg-white/10 rounded" />
                            <div className="h-10 w-10 bg-white/10 rounded" />
                        </div>
                        <div className="h-4 w-24 bg-white/10 rounded" />
                        <div className="h-8 w-32 bg-white/10 rounded" />
                    </div>
                </div>
                <div className="h-10 w-96 bg-white/10 rounded" />
                <div className="grid grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-white/10 rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
};
