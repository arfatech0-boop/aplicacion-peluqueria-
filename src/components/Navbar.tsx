import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  Users, 
  PackageMinus, 
  CreditCard, 
  Wallet, 
  Search, 
  BarChart3, 
  Wifi, 
  WifiOff,
  AlertTriangle,
  Store,
  RefreshCw,
  Menu,
  X,
  ChevronRight,
  Settings,
  Building2,
  BookOpen,
  LogOut
} from 'lucide-react';
import { AppState, SystemUser } from '../types';
import { DataService } from '../services/dataService';

export type ActiveTab = 
  | 'dashboard' 
  | 'pos' 
  | 'stock' 
  | 'suppliers' 
  | 'customers' 
  | 'withdrawals' 
  | 'cheques' 
  | 'cash' 
  | 'search' 
  | 'reports'
  | 'guide';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  appState: AppState;
  currentUser?: SystemUser | null;
  onOpenSettings?: () => void;
  onOpenCardRates?: () => void;
  onOpenUserManagement?: () => void;
  onLogout?: () => void;
  quickSearchText?: string;
  setQuickSearchText?: (text: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  appState,
  currentUser,
  onOpenSettings,
  onOpenCardRates,
  onOpenUserManagement,
  onLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const lowStockCount = appState.products.filter(p => p.stock <= p.minStock).length;
  const isConnected = DataService.isRealtimeConnected();
  const pendingOfflineCount = DataService.getOfflinePendingCount();

  const handleForceSync = async () => {
    setIsSyncing(true);
    const res = await DataService.forceSyncNow();
    setIsSyncing(false);
    if (!res.success) {
      alert(res.error || 'No se pudo sincronizar');
    } else {
      alert('¡Sincronización completada con éxito!');
    }
  };

  const handleResetDemo = () => {
    if (window.confirm('¿Desea restaurar los datos de demostración iniciales?')) {
      DataService.resetDemo();
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard General', icon: LayoutDashboard },
    { id: 'pos', label: 'Ventas & Facturación (POS)', icon: ShoppingCart, highlight: true },
    { id: 'stock', label: 'Stock & Inventario', icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { id: 'suppliers', label: 'Proveedores & Aumento', icon: TrendingUp },
    { id: 'customers', label: 'Cuentas Corrientes', icon: Users },
    { id: 'withdrawals', label: 'Mercadería Retirada', icon: PackageMinus },
    { id: 'cheques', label: 'Caja & Cheques', icon: CreditCard },
    { id: 'cash', label: 'Control de Caja Diaria', icon: Wallet },
    { id: 'search', label: 'Buscador Avanzado', icon: Search },
    { id: 'reports', label: 'Reportes PDF / Excel', icon: BarChart3 },
    { id: 'guide', label: 'Guía & Manual de Uso', icon: BookOpen },
  ];

  const allowedTabs: string[] = React.useMemo(() => {
    if (!currentUser) return ['pos', 'guide'];
    // Superadmin always has access to all modules
    if (currentUser.role === 'superadmin') {
      return ['dashboard', 'pos', 'stock', 'suppliers', 'customers', 'withdrawals', 'cheques', 'cash', 'search', 'reports', 'guide'];
    }

    // Check if user has explicit granular permissions (from object or persistent storage)
    const storedPerms = DataService.getUserPermissions(currentUser.id, currentUser.username);
    const activePerms = (Array.isArray(currentUser.permissions) && currentUser.permissions.length > 0)
      ? currentUser.permissions
      : storedPerms;

    if (Array.isArray(activePerms) && activePerms.length > 0) {
      return [...activePerms, 'guide'];
    }

    if (currentUser.role === 'admin' || currentUser.role === 'manager') {
      return ['dashboard', 'pos', 'stock', 'suppliers', 'customers', 'withdrawals', 'cheques', 'cash', 'search', 'reports', 'guide'];
    }
    // Default cashier
    return ['pos', 'cash', 'guide'];
  }, [currentUser]);

  const visibleNavItems = navItems.filter(item => allowedTabs.includes(item.id));

  return (
    <>
      {/* Mobile Header Topbar (visible only on lg:hidden) */}
      <header className="lg:hidden bg-slate-900 text-white border-b border-slate-800 p-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <Store className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          <span className="font-bold text-sm tracking-tight text-indigo-400 uppercase truncate max-w-[130px]">
            {appState.storeInfo.name}
          </span>
          {!isConnected && (
            <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-[10px] text-amber-300 font-bold">
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1.5">
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded text-indigo-300 hover:text-white bg-indigo-900/40 hover:bg-indigo-800 border border-indigo-700/50"
              title="Configurar Comercio / Rubro"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setActiveTab('pos')}
            className="px-2.5 py-1 bg-indigo-600 text-white rounded text-xs font-bold"
          >
            + POS
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 text-white border-b border-slate-800 px-4 py-3 space-y-1 sticky top-12 z-30">
          {onOpenUserManagement && (currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
            <button
              onClick={() => {
                onOpenUserManagement();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-bold bg-purple-950/70 text-purple-200 border border-purple-700/60 mb-1.5"
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Usuarios & Permisos</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-purple-300" />
            </button>
          )}

          {onOpenCardRates && (
            <button
              onClick={() => {
                onOpenCardRates();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-bold bg-indigo-900/50 text-amber-300 border border-indigo-500/40 mb-1.5"
            >
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Intereses & Cuotas Tarjetas</span>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-300" />
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={() => {
                onOpenSettings();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-bold bg-indigo-900/30 text-indigo-300 border border-indigo-500/30 mb-2"
            >
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>Configurar Comercio ({appState.storeInfo.businessType || 'Multirrubro'})</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as ActiveTab);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {onLogout && (
            <button
              onClick={() => {
                onLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-bold bg-red-950/60 text-red-300 border border-red-800/50 mt-2"
            >
              <div className="flex items-center space-x-2">
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Cerrar Sesión / Salir</span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Desktop Sidebar Navigation (visible on lg:flex) */}
      <aside className="hidden lg:flex w-64 bg-slate-900 flex-shrink-0 flex-col h-screen sticky top-0 border-r border-slate-800 text-white select-none shadow-xl z-20">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 flex-shrink-0 shadow-xs">
                <Store className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-white font-extrabold text-sm tracking-tight leading-tight truncate">
                  {appState.storeInfo.name}
                </h1>
                <span className="inline-block text-indigo-400 text-[10px] font-semibold bg-indigo-950/80 border border-indigo-800/50 px-1.5 py-0.2 rounded truncate mt-0.5 max-w-[140px]">
                  {appState.storeInfo.businessType || 'Indumentaria / Boutique'}
                </span>
              </div>
            </div>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
                title="Configurar Comercio / Rubro"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>CUIT: {appState.storeInfo.cuit}</span>
            <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">AFIP OK</span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-thin">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Navegación
          </div>

          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-900/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive ? 'bg-white shadow-sm shadow-white' : 'bg-slate-700 group-hover:bg-indigo-400'}`} />
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 shadow-xs">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 text-indigo-200' : 'text-slate-600'}`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Sync & Settings Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
          {onOpenUserManagement && (currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
            <button
              onClick={onOpenUserManagement}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-700/60 text-purple-200 hover:text-white text-xs font-bold transition-all shadow-xs"
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Usuarios & Permisos</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-purple-300" />
            </button>
          )}

          {onOpenCardRates && (
            <button
              onClick={onOpenCardRates}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-indigo-900/60 to-purple-900/60 hover:from-indigo-800 hover:to-purple-800 border border-indigo-500/40 text-amber-300 hover:text-white text-xs font-bold transition-all shadow-xs"
            >
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Intereses & Cuotas Tarjetas</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-amber-300" />
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-bold transition-all"
            >
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>Ajustes, Datos & AFIP</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}

          <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
            !isConnected 
              ? 'bg-amber-950/60 border-amber-500/50 text-amber-200' 
              : pendingOfflineCount > 0 
                ? 'bg-indigo-950/70 border-indigo-500/50 text-indigo-200' 
                : 'bg-emerald-950/40 border-emerald-900/50 text-emerald-300'
          }`}>
            <div className="flex items-center space-x-2 min-w-0">
              {isConnected ? (
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              ) : (
                <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
              )}
              <div className="min-w-0">
                <span className="text-[11px] font-bold block truncate">
                  {isConnected ? 'En Línea' : 'Modo Sin Wi-Fi'}
                </span>
                {pendingOfflineCount > 0 && (
                  <span className="text-[9px] text-amber-300 block">
                    {pendingOfflineCount} pendiente{pendingOfflineCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {pendingOfflineCount > 0 && isConnected && (
                <button
                  onClick={handleForceSync}
                  disabled={isSyncing}
                  className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded transition-colors"
                  title="Sincronizar cambios pendientes"
                >
                  {isSyncing ? '...' : 'Subir'}
                </button>
              )}
              {(currentUser?.role === 'superadmin' || currentUser?.username === 'admin') && (
                <button
                  onClick={handleResetDemo}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800"
                  title="Restaurar datos demo (Solo Administrador Principal)"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

