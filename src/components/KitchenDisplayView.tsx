import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Check, Clock, ChefHat, ArrowLeft } from 'lucide-react';

export const KitchenDisplayView: React.FC = () => {
    const { events, recipes, ingredients } = useStore();
    const navigate = useNavigate();
    const [selectedStation, setSelectedStation] = useState<'all' | 'hot' | 'cold' | 'dessert'>('all');
    const [completedTasks, setCompletedTasks] = useState<string[]>([]);

    // Get today's production needs
    const today = new Date().toISOString().split('T')[0];

    // Find today's events or upcoming events within 2 days
    const activeEvents = useMemo(() => {
        const nextTwoDays = new Date();
        nextTwoDays.setDate(nextTwoDays.getDate() + 2);
        const nextTwoDaysStr = nextTwoDays.toISOString().split('T')[0];

        return events.filter(e => e.date >= today && e.date <= nextTwoDaysStr).sort((a, b) => a.date.localeCompare(b.date));
    }, [events, today]);

    // Aggregate production tasks
    const productionTasks = useMemo(() => {
        const tasks: {
            id: string;
            recipeId: string;
            recipeName: string;
            quantity: number;
            station: string;
            eventTime: string;
            eventName: string;
            ingredients: { name: string; quantity: number; unit: string }[];
        }[] = [];

        activeEvents.forEach(event => {
            // Placeholder: Assume logic to get tasks from event menus
            // For now, we'll mock it based on available recipes if no menu assigned
            // In a real app, we'd pull from event.menu.recipes

            // This is a simplification for the KDS MVP to show *something* even if data is sparse
            if (activeEvents.length > 0 && recipes.length > 0) {
                recipes.forEach(recipe => {
                    // Filter by station if selected
                    if (selectedStation !== 'all' && recipe.station !== selectedStation) return;

                    // Mock task for demo purposes if no real menu data
                    tasks.push({
                        id: `${event.id}-${recipe.id}`,
                        recipeId: recipe.id,
                        recipeName: recipe.name,
                        quantity: event.pax,
                        station: recipe.station,
                        eventTime: event.date, // Use date as time proxy
                        eventName: event.name,
                        ingredients: recipe.ingredients.map(ri => {
                            const ing = ingredients.find(i => i.id === ri.ingredientId);
                            return {
                                name: ing?.name || 'Ingrediente desconocido',
                                quantity: ri.quantity * event.pax,
                                unit: ing?.unit || 'un'
                            };
                        })
                    });
                });
            }
        });

        // If no events, show a placeholder list from recipes for demo
        if (tasks.length === 0 && recipes.length > 0) {
            recipes.forEach(recipe => {
                if (selectedStation !== 'all' && recipe.station !== selectedStation) return;
                tasks.push({
                    id: `demo-${recipe.id}`,
                    recipeId: recipe.id,
                    recipeName: recipe.name,
                    quantity: 50,
                    station: recipe.station,
                    eventTime: today,
                    eventName: 'Producción General',
                    ingredients: recipe.ingredients.map(ri => {
                        const ing = ingredients.find(i => i.id === ri.ingredientId);
                        return {
                            name: ing?.name || 'Unknown',
                            quantity: ri.quantity * 50,
                            unit: ing?.unit || 'un'
                        };
                    })
                });
            });
        }

        return tasks;
    }, [activeEvents, recipes, ingredients, selectedStation]);

    const handleToggleComplete = (taskId: string) => {
        setCompletedTasks(prev =>
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
    };

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-slate-100">
            {/* Header - Optimized for Touch */}
            <div className="flex items-center justify-between p-6 bg-slate-800 border-b border-white/5">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/production')}
                        className="p-4 bg-white/5 rounded-xl active:bg-white/10"
                    >
                        <ArrowLeft size={32} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold">Kitchen Display</h1>
                        <p className="text-xl text-slate-400">
                            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                </div>

                {/* Station Filter - Large Targets */}
                <div className="flex gap-4">
                    {(['all', 'hot', 'cold', 'dessert'] as const).map(station => (
                        <button
                            key={station}
                            onClick={() => setSelectedStation(station)}
                            className={`px-8 py-4 rounded-xl text-xl font-bold capitalize transition-all ${selectedStation === station
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                                : 'bg-white/5 text-slate-400'
                                }`}
                        >
                            {station === 'all' ? 'Todas' :
                                station === 'hot' ? 'Caliente' :
                                    station === 'cold' ? 'Frío' : 'Postres'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content - Grid of Tickets */}
            <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {productionTasks.map(task => {
                        const isCompleted = completedTasks.includes(task.id);

                        return (
                            <div
                                key={task.id}
                                className={`flex flex-col h-full rounded-2xl border-2 transition-all duration-300 ${isCompleted
                                    ? 'bg-green-900/20 border-green-900/50 opacity-60'
                                    : 'bg-slate-800 border-white/5'
                                    }`}
                            >
                                {/* Ticket Header */}
                                <div className={`p-6 border-b ${isCompleted ? 'border-green-900/30' : 'border-white/5'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${task.station === 'hot' ? 'bg-orange-500/20 text-orange-400' :
                                            task.station === 'cold' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-pink-500/20 text-pink-400'
                                            }`}>
                                            {task.station}
                                        </span>
                                        <div className="flex items-center gap-2 text-slate-400 font-mono text-lg">
                                            <Clock size={20} />
                                            <span>{task.eventTime}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold leading-tight mb-2">{task.recipeName}</h3>
                                    <p className="text-lg text-slate-400">{task.eventName} · <span className="text-white font-bold">{task.quantity} PAX</span></p>
                                </div>

                                {/* Ingredients / Steps */}
                                <div className="flex-1 p-6 space-y-4">
                                    {task.ingredients.slice(0, 5).map((ing, idx) => (
                                        <div key={idx} className="flex justify-between items-baseline text-lg">
                                            <span className="text-slate-300">{ing.name}</span>
                                            <span className="font-mono font-bold text-slate-500">
                                                {ing.quantity.toFixed(1)} {ing.unit}
                                            </span>
                                        </div>
                                    ))}
                                    {task.ingredients.length > 5 && (
                                        <p className="text-center text-slate-500 italic pt-2">
                                            ... y {task.ingredients.length - 5} más
                                        </p>
                                    )}
                                </div>

                                {/* Action Button */}
                                <div className="p-4 mt-auto">
                                    <button
                                        onClick={() => handleToggleComplete(task.id)}
                                        className={`w-full py-6 rounded-xl text-2xl font-bold flex items-center justify-center gap-4 transition-all active:scale-95 ${isCompleted
                                            ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                                            : 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90'
                                            }`}
                                    >
                                        {isCompleted ? (
                                            <>
                                                <Check size={32} />
                                                <span>COMPLETADO</span>
                                            </>
                                        ) : (
                                            <>
                                                <ChefHat size={32} />
                                                <span>MARCAR HECHO</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
