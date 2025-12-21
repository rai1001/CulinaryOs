import React from 'react';
import type { LabelData } from './PrintService';

interface Props {
    data: LabelData | null;
}

export const LabelTemplate: React.FC<Props> = ({ data }) => {
    if (!data) return null;

    return (
        <div className="print-only w-full h-full flex flex-col justify-between p-2 bg-white text-black font-sans box-border" style={{ width: '50mm', height: '30mm', overflow: 'hidden' }}>
            <div className="flex flex-col gap-1">
                <div className="font-bold text-sm leading-tight uppercase truncate">
                    {data.title}
                </div>
                <div className="flex justify-between items-baseline text-xs">
                    <span className="font-mono">{data.date.toLocaleDateString()}</span>
                    {data.quantity && <span className="font-semibold">{data.quantity}</span>}
                </div>
            </div>

            <div className="text-[10px] leading-tight">
                {data.expiryDate && (
                    <div className="flex gap-1">
                        <span className="font-bold">CAD:</span>
                        <span>{data.expiryDate.toLocaleDateString()}</span>
                    </div>
                )}
                {data.allergens && data.allergens.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-0.5">
                        {data.allergens.map(a => (
                            <span key={a} className="border border-black px-0.5 rounded-[2px] font-bold text-[8px] uppercase">
                                {a}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
