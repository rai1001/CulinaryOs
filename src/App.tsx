import React, { lazy, Suspense, useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import { Dashboard } from './components/Dashboard';
import { LayoutDashboard, Calendar, ShoppingCart, Database, CalendarDays, ChefHat, Package, Truck, ClipboardList, ShoppingBag, Trash2, ShieldCheck, TrendingUp } from 'lucide-react';

import { PrintManager } from './components/printing/PrintManager';
import { ShiftEndReminder } from './components/haccp/ShiftEndReminder';
import { InstallPrompt } from './components/ui';
import { CommandPalette } from './components/CommandPalette';
import { useCommandPalette } from './hooks/useCommandPalette';

// Lazy load views for better initial load performance
const ScheduleView = lazy(() => import('./components/ScheduleView').then(m => ({ default: m.ScheduleView })));
const ProductionView = lazy(() => import('./components/ProductionView').then(m => ({ default: m.ProductionView })));
const DataView = lazy(() => import('./components/DataView').then(m => ({ default: m.DataView })));
const EventsView = lazy(() => import('./components/EventsView').then(m => ({ default: m.EventsView })));
const RecipesView = lazy(() => import('./components/RecipesView').then(m => ({ default: m.RecipesView })));
const IngredientsView = lazy(() => import('./components/IngredientsView').then(m => ({ default: m.IngredientsView })));
const SupplierView = lazy(() => import('./components/SupplierView').then(m => ({ default: m.SupplierView })));
const InventoryView = lazy(() => import('./components/InventoryView').then(m => ({ default: m.InventoryView })));
const PurchasingView = lazy(() => import('./components/PurchasingView').then(m => ({ default: m.PurchasingView })));
const WasteView = lazy(() => import('./components/WasteView').then(m => ({ default: m.WasteView })));
const HACCPView = lazy(() => import('./components/HACCPView').then(m => ({ default: m.HACCPView })));
const MenuAnalyticsView = lazy(() => import('./components/MenuAnalyticsView').then(m => ({ default: m.MenuAnalyticsView })));
const KitchenDisplayView = lazy(() => import('./components/KitchenDisplayView').then(m => ({ default: m.KitchenDisplayView })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-400">Cargando...</p>
    </div>
  </div>
);

function App() {
  const { currentView, setCurrentView } = useStore();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Sync state with hash on mount and hashchange
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\//, '');
      if (hash) {
        setCurrentView(hash as any);
      } else {
        window.location.hash = `#/${currentView}`;
      }
    };

    // Initial check
    handleHashChange();

    // Listen for changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setCurrentView]);

  const handleNavigation = (view: typeof currentView) => {
    setCurrentView(view);
    window.location.hash = `#/${view}`;
  };

  // Command Palette keyboard shortcut (Cmd+K / Ctrl+K)
  useCommandPalette(() => setIsCommandPaletteOpen(prev => !prev));

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'schedule': return <ScheduleView />;
      case 'production': return <ProductionView />;
      case 'data': return <DataView />;
      case 'events': return <EventsView />;
      case 'recipes': return <RecipesView />;
      case 'ingredients': return <IngredientsView />;
      case 'suppliers': return <SupplierView />;
      case 'inventory': return <InventoryView />;
      case 'purchasing': return <PurchasingView />;
      case 'waste': return <WasteView />;
      case 'haccp': return <HACCPView />;
      case 'analytics': return <MenuAnalyticsView />;
      case 'kds': return <KitchenDisplayView />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-slate-100 overflow-hidden selection:bg-primary/30">
      <PrintManager />
      <ShiftEndReminder />
      <InstallPrompt />
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-white/5 flex flex-col overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Chef<span className="text-primary">OS</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Gestión de Cocina Premium</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 py-4">
          <NavItem
            icon={<LayoutDashboard />}
            label="Inicio"
            active={currentView === 'dashboard'}
            onClick={() => handleNavigation('dashboard')}
          />
          <NavItem
            icon={<Calendar />}
            label="Horario"
            active={currentView === 'schedule'}
            onClick={() => handleNavigation('schedule')}
          />
          <NavItem
            icon={<CalendarDays />}
            label="Eventos"
            active={currentView === 'events'}
            onClick={() => handleNavigation('events')}
          />
          <NavItem
            icon={<ShoppingBag />}
            label="Compras Auto"
            active={currentView === 'purchasing'}
            onClick={() => handleNavigation('purchasing')}
          />
          <NavItem
            icon={<Trash2 />}
            label="Mermas"
            active={currentView === 'waste'}
            onClick={() => handleNavigation('waste')}
          />
          <NavItem
            icon={<ShieldCheck />}
            label="HACCP Digital"
            active={currentView === 'haccp'}
            onClick={() => handleNavigation('haccp')}
          />
          <NavItem
            icon={<TrendingUp />}
            label="Ingeniería Menú"
            active={currentView === 'analytics'}
            onClick={() => handleNavigation('analytics')}
          />

          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gestión</p>
          </div>

          <NavItem
            icon={<Package />}
            label="Ingredientes"
            active={currentView === 'ingredients'}
            onClick={() => handleNavigation('ingredients')}
          />
          <NavItem
            icon={<ClipboardList />}
            label="Inventario"
            active={currentView === 'inventory'}
            onClick={() => handleNavigation('inventory')}
          />
          <NavItem
            icon={<ChefHat />}
            label="Recetas"
            active={currentView === 'recipes'}
            onClick={() => handleNavigation('recipes')}
          />
          <NavItem
            icon={<Truck />}
            label="Proveedores"
            active={currentView === 'suppliers'}
            onClick={() => handleNavigation('suppliers')}
          />

          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Producción</p>
          </div>

          <NavItem
            icon={<ShoppingCart />}
            label="Producción"
            active={currentView === 'production'}
            onClick={() => handleNavigation('production')}
          />
          <NavItem
            icon={<ChefHat />}
            label="Modo KDS (Tablet)"
            active={currentView === 'kds'}
            onClick={() => handleNavigation('kds')}
          />
          <NavItem
            icon={<Database />}
            label="Datos"
            active={currentView === 'data'}
            onClick={() => handleNavigation('data')}
          />
        </nav>

        <div className="p-4 border-t border-white/5 mx-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent" />
            <div>
              <p className="text-sm font-medium">Head Chef</p>
              <p className="text-xs text-slate-500">Israel</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
        <Suspense fallback={<LoadingFallback />}>
          {renderContent()}
        </Suspense>
      </main>
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactElement<{ size?: number }>;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem = ({ icon, label, active, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active
      ? 'bg-primary text-white shadow-lg shadow-primary/20'
      : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
  >
    {React.cloneElement(icon, { size: 20 })}
    <span className="font-medium text-sm">{label}</span>
  </button>
);

export default App;
