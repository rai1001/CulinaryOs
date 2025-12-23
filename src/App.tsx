import React, { Suspense } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import {
  LayoutDashboard, Calendar, ShoppingCart, Database, CalendarDays, ChefHat,
  Package, Truck, ClipboardList, ShoppingBag, Trash2, ShieldCheck,
  TrendingUp, Search, BookOpen, Sparkles, Coffee, Menu as MenuIcon,
  X, Briefcase, Settings, LogOut, FileText, ChevronDown, Layers, Zap
} from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { useStore } from './store/useStore';
import { OutletSelector } from './components/OutletSelector';

import { PrintManager } from './components/printing/PrintManager';
import { ShiftEndReminder } from './components/haccp/ShiftEndReminder';
import { InstallPrompt } from './components/ui';
import { CommandPalette } from './components/CommandPalette';
import { useCommandPalette } from './hooks/useCommandPalette';
import { useNotificationSubscription } from './hooks/useNotificationSubscription';
import { KitchenCopilot } from './components/ai/KitchenCopilot';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ChefInsights } from './components/ai/ChefInsights';
import { GoogleFont } from './components/ui';

// Lazy load views for better initial load performance
const ScheduleView = React.lazy(() => import('./components/ScheduleView').then(m => ({ default: m.ScheduleView })));
const ProductionView = React.lazy(() => import('./components/ProductionView').then(m => ({ default: m.ProductionView })));
const DataView = React.lazy(() => import('./components/DataView').then(m => ({ default: m.DataView })));
const EventsView = React.lazy(() => import('./components/EventsView').then(m => ({ default: m.EventsView })));
const RecipesView = React.lazy(() => import('./components/RecipesView').then(m => ({ default: m.RecipesView })));
const IngredientsView = React.lazy(() => import('./components/IngredientsView').then(m => ({ default: m.IngredientsView })));
const SupplierView = React.lazy(() => import('./components/SupplierView').then(m => ({ default: m.SupplierView })));
const InventoryView = React.lazy(() => import('./components/InventoryView').then(m => ({ default: m.InventoryView })));
const PurchasingView = React.lazy(() => import('./components/PurchasingView').then(m => ({ default: m.PurchasingView })));
const WasteView = React.lazy(() => import('./components/WasteView').then(m => ({ default: m.WasteView })));
const HACCPView = React.lazy(() => import('./components/HACCPView').then(m => ({ default: m.HACCPView })));
const MenuAnalyticsView = React.lazy(() => import('./components/MenuAnalyticsView').then(m => ({ default: m.MenuAnalyticsView })));
const KitchenDisplayView = React.lazy(() => import('./components/KitchenDisplayView').then(m => ({ default: m.KitchenDisplayView })));
const AIMenuView = React.lazy(() => import('./components/AIFeatures').then(m => ({ default: m.AIMenuGenerator })));
const AISearchView = React.lazy(() => import('./components/AIFeatures').then(m => ({ default: m.AIChefAssistant }))); // Search/Assistant
const MenuView = React.lazy(() => import('./components/MenuView').then(m => ({ default: m.MenuView }))); // New Manual Menu View
const HospitalityLogisticsView = React.lazy(() => import('./components/HospitalityLogisticsView').then(m => ({ default: m.HospitalityLogisticsView })));
const StaffView = React.lazy(() => import('./components/StaffView').then(m => ({ default: m.StaffView })));
const IntegrationsView = React.lazy(() => import('./components/IntegrationsView').then(m => ({ default: m.IntegrationsView })));
const FichasTecnicasDashboard = React.lazy(() => import('./pages/FichasTecnicasDashboard').then(m => ({ default: m.FichasTecnicasDashboard })));

const AnalisisRentabilidad = React.lazy(() => import('./pages/AnalisisRentabilidad').then(m => ({ default: m.AnalisisRentabilidad })));
const HospitalityDashboard = React.lazy(() => import('./pages/HospitalityDashboard').then(m => ({ default: m.HospitalityDashboard })));

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
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { currentUser } = useStore();
  const location = useLocation();

  // Subscribe to AI Notifications
  useNotificationSubscription();

  // Close sidebar on route change (mobile)
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Command Palette keyboard shortcut (Cmd+K / Ctrl+K)
  useCommandPalette(() => setIsCommandPaletteOpen(prev => !prev));

  return (
    <div className="flex h-screen bg-background text-slate-100 overflow-hidden selection:bg-primary/30 font-sans">
      <GoogleFont family="Outfit" />

      <PrintManager />
      <ShiftEndReminder />
      <InstallPrompt />
      <KitchenCopilot />
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-white/5 flex flex-col overflow-y-auto
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:bg-transparent md:border-r md:border-white/5
      `}>
        <div className="p-6 flex justify-between items-center md:block">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Chef<span className="text-primary">OS</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">Gestión de Cocina Premium</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="px-4 mb-4">
          <ChefInsights />
        </div>

        <OutletSelector />

        <nav className="flex-1 px-4 space-y-4 py-4">
          <NavGroup
            label="Logística / Operaciones"
            icon={<Layers />}
            activePaths={['/dashboard', '/schedule', '/events', '/hospitality', '/breakfast', '/purchasing', '/waste', '/haccp', '/analytics']}
          >
            <NavItem to="/dashboard" icon={<LayoutDashboard />} label="Inicio" />
            <NavItem to="/schedule" icon={<Calendar />} label="Horario" />
            <NavItem to="/events" icon={<CalendarDays />} label="Eventos" />
            <NavItem to="/hospitality" icon={<Coffee />} label="Logística Hotel" />
            <NavItem to="/breakfast" icon={<Coffee />} label="Servicio Diario" />
            <NavItem to="/purchasing" icon={<ShoppingBag />} label="Compras Auto" />
            <NavItem to="/waste" icon={<Trash2 />} label="Mermas" />
            <NavItem to="/haccp" icon={<ShieldCheck />} label="HACCP Digital" />
            <NavItem to="/analytics" icon={<TrendingUp />} label="Ingeniería Menú" />
          </NavGroup>

          <NavGroup
            label="Estrategia Menús"
            icon={<BookOpen />}
            activePaths={['/menus', '/fichas-tecnicas', '/ai-menu']}
          >
            <NavItem to="/menus" icon={<BookOpen />} label="Mis Menús" />
            <NavItem to="/fichas-tecnicas" icon={<FileText />} label="Fichas Técnicas" />
            <NavItem to="/ai-menu" icon={<Sparkles />} label="Generador IA" />
          </NavGroup>

          <NavGroup
            label="Inteligencia AI"
            icon={<Sparkles />}
            activePaths={['/ai-search']}
          >
            <NavItem to="/ai-search" icon={<Search />} label="Asistente Chef" />
          </NavGroup>

          <NavGroup
            label="Gestión Base"
            icon={<Database />}
            activePaths={['/ingredients', '/inventory', '/recipes', '/suppliers', '/staff']}
          >
            <NavItem to="/ingredients" icon={<Package />} label="Ingredientes" />
            <NavItem to="/inventory" icon={<ClipboardList />} label="Inventario" />
            <NavItem to="/recipes" icon={<ChefHat />} label="Recetas" />
            <NavItem to="/suppliers" icon={<Truck />} label="Proveedores" />
            <NavItem to="/staff" icon={<Briefcase />} label="Personal" />
          </NavGroup>

          <NavGroup
            label="Producción / Modo KDS"
            icon={<Zap />}
            activePaths={['/production', '/kds', '/data']}
          >
            <NavItem to="/production" icon={<ShoppingCart />} label="Producción" />
            <NavItem to="/kds" icon={<ChefHat />} label="Modo KDS (Tablet)" />
            <NavItem to="/data" icon={<Database />} label="Datos" />
          </NavGroup>

          <div className="pt-4 border-t border-white/5">
            <NavItem to="/integrations" icon={<Settings />} label="Integraciones" />
          </div>
        </nav>

        <div className="p-4 border-t border-white/5 mx-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent overflow-hidden">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                  {currentUser?.name?.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium truncate max-w-[100px]">{currentUser?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{currentUser?.role}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              const auth = getAuth();
              await auth.signOut();
              window.location.href = '/';
            }}
            className="p-2 text-slate-500 hover:text-red-400 transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden bg-surface border-b border-white/5 p-4 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-300">
            <MenuIcon size={24} />
          </button>
          <h1 className="text-lg font-bold text-white">Chef<span className="text-primary">OS</span></h1>
          <div className="w-6" />
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
        <div className="flex-1 overflow-auto p-4 md:p-0">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public/Protected Routes Container can go here if needed. For now all are accessible or we use ProtectedRoute wrapper */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/schedule" element={<ScheduleView />} />
                <Route path="/production" element={<ProductionView />} />
                <Route path="/data" element={<DataView />} />
                <Route path="/events" element={<EventsView />} />
                <Route path="/recipes" element={<RecipesView />} />
                <Route path="/ingredients" element={<IngredientsView />} />
                <Route path="/suppliers" element={<SupplierView />} />
                <Route path="/staff" element={<StaffView />} />
                <Route path="/inventory" element={<InventoryView />} />
                <Route path="/purchasing" element={<PurchasingView />} />
                <Route path="/waste" element={<WasteView />} />
                <Route path="/haccp" element={<HACCPView />} />
                <Route path="/analytics" element={<MenuAnalyticsView />} />
                <Route path="/kds" element={<KitchenDisplayView />} />
                <Route path="/ai-scanner" element={<Navigate to="/purchasing" replace />} />
                <Route path="/ai-menu" element={<AIMenuView />} />
                <Route path="/ai-search" element={<AISearchView />} />
                <Route path="/menus" element={<MenuView />} />
                <Route path="/fichas-tecnicas" element={<FichasTecnicasDashboard />} />
                <Route path="/analytics/fichas" element={<AnalisisRentabilidad />} />
                <Route path="/breakfast" element={<HospitalityLogisticsView />} />
                <Route path="/hospitality" element={<HospitalityDashboard />} />
                <Route path="/integrations" element={<IntegrationsView />} />
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactElement<{ size?: number }>;
  label: string;
  to: string;
}

const NavItem = ({ icon, label, to }: NavItemProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isActive
        ? 'bg-primary text-white shadow-lg shadow-primary/20'
        : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }`}
    >
      {React.cloneElement(icon, { size: 18 })}
      <span className="font-medium text-sm">{label}</span>
    </NavLink>
  );
};

interface NavGroupProps {
  label: string;
  icon: React.ReactElement<{ size?: number; className?: string }>;
  children: React.ReactNode;
  activePaths: string[];
}

const NavGroup = ({ label, icon, children, activePaths }: NavGroupProps) => {
  const location = useLocation();
  const isAnyChildActive = activePaths.some(path => location.pathname.startsWith(path));
  const [isOpen, setIsOpen] = React.useState(isAnyChildActive);

  // Auto-expand if a child becomes active
  React.useEffect(() => {
    if (isAnyChildActive) setIsOpen(true);
  }, [isAnyChildActive]);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all hover:bg-white/5 group ${isAnyChildActive ? 'text-white' : 'text-slate-500'
          }`}
      >
        <div className="flex items-center gap-3">
          {React.cloneElement(icon as React.ReactElement<any>, { size: 18, className: isAnyChildActive ? 'text-primary' : '' })}
          <span className={`font-semibold text-[10px] uppercase tracking-[0.1em] ${isAnyChildActive ? 'text-slate-200' : 'text-slate-500'}`}>{label}</span>
        </div>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isAnyChildActive ? 'text-primary' : 'text-slate-600'}`}
        />
      </button>
      {isOpen && (
        <div className="pl-3 space-y-1 mt-1 border-l border-white/5 ml-4 animate-in fade-in slide-in-from-left-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default App;
