import React from 'react';
import { useStore } from './store/useStore';
import { Dashboard } from './components/Dashboard';
import { ScheduleView } from './components/ScheduleView';
import { ProductionView } from './components/ProductionView';
import { DataView } from './components/DataView';
import { EventsView } from './components/EventsView';
import { RecipesView } from './components/RecipesView';
import { IngredientsView } from './components/IngredientsView';
import { SupplierView } from './components/SupplierView';
import { InventoryView } from './components/InventoryView';
import { PurchasingView } from './components/PurchasingView';
import { WasteView } from './components/WasteView';
import { HACCPView } from './components/HACCPView';
import { LayoutDashboard, Calendar, ShoppingCart, Database, CalendarDays, ChefHat, Package, Truck, ClipboardList, ShoppingBag, Trash2, ShieldCheck } from 'lucide-react';

import { PrintManager } from './components/printing/PrintManager';
import { ShiftEndReminder } from './components/haccp/ShiftEndReminder';
import { InstallPrompt } from './components/ui';

function App() {
  const { currentView, setCurrentView } = useStore();

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
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-slate-100 overflow-hidden selection:bg-primary/30">
      <PrintManager />
      <ShiftEndReminder />
      <InstallPrompt />
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
            onClick={() => setCurrentView('dashboard')}
          />
          <NavItem
            icon={<Calendar />}
            label="Horario"
            active={currentView === 'schedule'}
            onClick={() => setCurrentView('schedule')}
          />
          <NavItem
            icon={<CalendarDays />}
            label="Eventos"
            active={currentView === 'events'}
            onClick={() => setCurrentView('events')}
          />
          <NavItem
            icon={<ShoppingBag />}
            label="Compras Auto"
            active={currentView === 'purchasing'}
            onClick={() => setCurrentView('purchasing')}
          />
          <NavItem
            icon={<Trash2 />}
            label="Mermas"
            active={currentView === 'waste'}
            onClick={() => setCurrentView('waste')}
          />
          <NavItem
            icon={<ShieldCheck />}
            label="HACCP Digital"
            active={currentView === 'haccp'}
            onClick={() => setCurrentView('haccp')}
          />

          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gestión</p>
          </div>

          <NavItem
            icon={<Package />}
            label="Ingredientes"
            active={currentView === 'ingredients'}
            onClick={() => setCurrentView('ingredients')}
          />
          <NavItem
            icon={<ClipboardList />}
            label="Inventario"
            active={currentView === 'inventory'}
            onClick={() => setCurrentView('inventory')}
          />
          <NavItem
            icon={<ChefHat />}
            label="Recetas"
            active={currentView === 'recipes'}
            onClick={() => setCurrentView('recipes')}
          />
          <NavItem
            icon={<Truck />}
            label="Proveedores"
            active={currentView === 'suppliers'}
            onClick={() => setCurrentView('suppliers')}
          />

          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Producción</p>
          </div>

          <NavItem
            icon={<ShoppingCart />}
            label="Producción"
            active={currentView === 'production'}
            onClick={() => setCurrentView('production')}
          />
          <NavItem
            icon={<Database />}
            label="Datos"
            active={currentView === 'data'}
            onClick={() => setCurrentView('data')}
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
        {renderContent()}
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
