import React, { useState } from 'react';
import { Sparkles, Brain, RefreshCw, AlertTriangle, TrendingUp, Info } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { forecastingService } from '../../services/forecastingService';
import { suggestPurchases } from '../../services/geminiService';

export const AIPurchaseAdvisor: React.FC = () => {
    const state = useStore();
    const [status, setStatus] = useState<'idle' | 'analyzing' | 'success' | 'error'>('idle');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [summary, setSummary] = useState('');

    const runAnalysis = async () => {
        setStatus('analyzing');
        try {
            const context = forecastingService.aggregateForecastContext(state);
            const result = await suggestPurchases(context);

            if (result.success && result.data) {
                setSuggestions(result.data.suggestions || []);
                setSummary(result.data.summary || '');
                setStatus('success');
            } else {
                throw new Error(result.error || 'Failed to get recommendations');
            }
        } catch (error) {
            console.error('AI Purchase Analysis Error:', error);
            setStatus('error');
        }
    };

    return (
        <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/20 p-2 rounded-xl">
                        <Brain className="text-indigo-400" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">AI Purchase Advisor</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Previsión de Compras Inteligente</p>
                    </div>
                </div>
                {status !== 'analyzing' && (
                    <button
                        onClick={runAnalysis}
                        className="p-2 hover:bg-white/5 rounded-lg text-indigo-400 transition-colors"
                        title="Refrescar análisis"
                    >
                        <RefreshCw size={18} />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="p-5 min-h-[300px]">
                {status === 'idle' && (
                    <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
                        <Sparkles className="text-indigo-500/20" size={48} />
                        <div className="max-w-xs">
                            <h4 className="text-white font-semibold">Análisis de Demanda Próxima</h4>
                            <p className="text-slate-500 text-xs mt-1">Calcularemos cuánto necesitas comprar basándonos en tus próximos eventos y mermas históricas.</p>
                        </div>
                        <button
                            onClick={runAnalysis}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
                        >
                            Ver Sugerencias
                        </button>
                    </div>
                )}

                {status === 'analyzing' && (
                    <div className="h-64 flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-slate-500 text-xs animate-pulse">Sincronizando PAX y Recetas...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="h-64 flex flex-col items-center justify-center text-center space-y-3">
                        <AlertTriangle className="text-rose-400" size={32} />
                        <p className="text-slate-400 text-sm">Error al conectar con Gemini</p>
                        <button onClick={runAnalysis} className="text-indigo-400 text-xs font-bold underline">Reintentar</button>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                        {summary && (
                            <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl flex gap-3 italic">
                                <Info className="text-indigo-400 shrink-0" size={18} />
                                <p className="text-xs text-indigo-100/70">{summary}</p>
                            </div>
                        )}

                        <div className="grid gap-3">
                            {suggestions.map((item, idx) => (
                                <div key={idx} className="bg-white/2 border border-white/5 p-4 rounded-xl flex justify-between items-center group hover:border-white/10 transition-colors">
                                    <div className="flex gap-4 items-center">
                                        <div className={`p-2 rounded-lg ${item.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {item.priority === 'CRITICAL' ? <AlertTriangle size={16} /> : <TrendingUp size={16} />}
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-bold text-white leading-none mb-1">{item.ingredientName}</h5>
                                            <p className="text-[10px] text-slate-500 italic">{item.reason}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-white tabular-nums">{item.quantityToBuy} <span className="text-xs font-normal text-slate-500">{item.unit}</span></p>
                                        <p className={`text-[10px] font-bold ${item.priority === 'CRITICAL' ? 'text-rose-400' : 'text-blue-400'}`}>
                                            {item.priority === 'CRITICAL' ? 'Stock Crítico' : 'Planificación'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {suggestions.length === 0 && (
                                <div className="h-48 flex items-center justify-center text-slate-600 text-sm italic">
                                    No se detectan necesidades de compra adicionales.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {status === 'success' && (
                <div className="p-4 bg-black/20 border-t border-white/5">
                    <p className="text-[9px] text-slate-600 text-center uppercase tracking-widest">
                        Basado en eventos de las próximas 2 semanas y stock actual
                    </p>
                </div>
            )}
        </div>
    );
};
