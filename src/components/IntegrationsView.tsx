import React from 'react';
import { Mail, Calendar, CheckCircle, XCircle, ExternalLink, Shield } from 'lucide-react';
import { useStore } from '../store/useStore';

export const IntegrationsView = () => {
    const { integrations, connectIntegration, disconnectIntegration } = useStore();

    const providerIcons = {
        google: Mail,
        microsoft: Calendar
    };

    const handleConnect = async (id: string) => {
        await connectIntegration(id);
    };

    const handleDisconnect = async (id: string) => {
        await disconnectIntegration(id);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Integraciones</h1>
                    <p className="text-slate-400">
                        Conecta tus herramientas externas para potenciar la automatización de ChefOS.
                    </p>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {integrations.map((integration) => (
                    <div
                        key={integration.id}
                        className={`
              relative overflow-hidden rounded-2xl border transition-all duration-300
              ${integration.status === 'connected'
                                ? 'bg-surface border-green-500/30 shadow-lg shadow-green-500/10'
                                : 'bg-surface border-white/5 hover:border-white/10'
                            }
            `}
                    >
                        {/* Status Badge */}
                        <div className="absolute top-4 right-4">
                            {integration.status === 'connected' && (
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold border border-green-500/20">
                                    <CheckCircle size={12} />
                                    Conectado
                                </span>
                            )}
                            {integration.status === 'disconnected' && (
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-400 text-xs font-semibold border border-white/5">
                                    <XCircle size={12} />
                                    Desconectado
                                </span>
                            )}
                        </div>

                        <div className="p-6">
                            {/* Icon & Title */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`p-3 rounded-xl ${integration.provider === 'google' ? 'bg-blue-500/10 text-blue-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                    {React.createElement(providerIcons[integration.provider] || Mail, { size: 28 })}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{integration.name}</h3>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{integration.provider}</p>
                                </div>
                            </div>

                            <p className="text-slate-400 text-sm mb-6 h-10">
                                {integration.description}
                            </p>

                            {/* Features List */}
                            <div className="space-y-2 mb-8">
                                {integration.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                {integration.status === 'connected' ? (
                                    <button
                                        onClick={() => handleDisconnect(integration.id)}
                                        className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                                    >
                                        Desconectar
                                    </button>
                                ) : (
                                    <div className="text-xs text-slate-500">
                                        Requiere permisos de acceso
                                    </div>
                                )}

                                <button
                                    onClick={() => integration.status === 'connected' ? {} : handleConnect(integration.id)}
                                    className={`
                     flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                     ${integration.status === 'connected'
                                            ? 'bg-white/5 text-slate-400 cursor-default'
                                            : 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/25'
                                        }
                   `}
                                >
                                    {integration.status === 'connected' ? (
                                        <>
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            Sincronizando
                                        </>
                                    ) : (
                                        <>
                                            Conectar
                                            <ExternalLink size={16} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Info Section */}
            <div className="bg-blue-500/5 rounded-2xl p-6 border border-blue-500/10 flex gap-4">
                <div className="text-blue-400 shrink-0">
                    <Shield size={24} />
                </div>
                <div>
                    <h4 className="text-lg font-semibold text-blue-100 mb-1">Privacidad y Seguridad</h4>
                    <p className="text-sm text-blue-200/70">
                        ChefOS solo accede a los datos necesarios para la gestión de eventos.
                        Tus correos son procesados por la IA en tiempo real y no se almacenan permanentemente,
                        salvo aquellos convertidos en eventos confirmados.
                    </p>
                </div>
            </div>
        </div>
    );
};
