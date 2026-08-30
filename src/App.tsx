import React, { useEffect, useState, useRef } from 'react';
import { AppState, SystemUser } from './types';
import { DataService } from './services/dataService';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { POSView } from './components/POSView';
import { StockView } from './components/StockView';
import { SuppliersView } from './components/SuppliersView';
import { CurrentAccountsView } from './components/CurrentAccountsView';
import { WithdrawalsView } from './components/WithdrawalsView';
import { ChequesView } from './components/ChequesView';
import { CashRegisterView } from './components/CashRegisterView';
import { AdvancedSearchFilterView } from './components/AdvancedSearchFilterView';
import { ReportsView } from './components/ReportsView';
import { UserGuideView } from './components/UserGuideView';
import { StoreSettingsModal } from './components/StoreSettingsModal';
import { CardRatesModal } from './components/CardRatesModal';
import { LoginView } from './components/LoginView';
import { UserManagementModal } from './components/UserManagementModal';
import { Search, Plus, AlertTriangle, ShieldCheck, User, Settings, Store, CreditCard, BookOpen, Users, LogOut, Key } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState>(DataService.getState());
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => {
    try {
      const saved = localStorage.getItem('gc_active_tab');
      return (saved as ActiveTab) || 'pos';
    } catch (e) {
      return 'pos';
    }
  });

  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('gc_active_tab', tab);
    } catch (e) {}
  };
  const [quickSearch, setQuickSearch] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cardRatesOpen, setCardRatesOpen] = useState(false);
  const [usersModalOpen, setUsersModalOpen] = useState(false);

  // Active Authenticated User Session
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(() => {
    try {
      const saved = localStorage.getItem('gc_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const currentUserRef = useRef<SystemUser | null>(currentUser);
  currentUserRef.current = currentUser;

  const handleLogout = () => {
    currentUserRef.current = null;
    localStorage.removeItem('gc_current_user');
    setCurrentUser(null);
    DataService.clearSession();
  };

  useEffect(() => {
    // Initialize data service & real-time SSE listener
    DataService.init();

    const unsubscribe = DataService.subscribe(newState => {
      setAppState(newState);
      // Synchronize currentUser state if updated
      const activeUser = currentUserRef.current;
      const stored = localStorage.getItem('gc_current_user');
      if (activeUser && stored) {
        const updated = newState.users?.find(u => u.id === activeUser.id);
        if (updated) {
          if (!updated.active) {
            handleLogout();
          } else if (updated.name !== activeUser.name || updated.role !== activeUser.role) {
            setCurrentUser(updated);
            localStorage.setItem('gc_current_user', JSON.stringify(updated));
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (user: SystemUser, storeId: string) => {
    currentUserRef.current = user;
    setCurrentUser(user);
    DataService.setCurrentSession(storeId, user.id);
    localStorage.setItem('gc_current_user', JSON.stringify(user));
  };

  const handleCreateStore = (newStore: any, adminUser: SystemUser) => {
    const updatedStores = [...(appState.stores || []), newStore];
    const updatedUsers = [...(appState.users || []), adminUser];
    setAppState(prev => ({
      ...prev,
      stores: updatedStores,
      users: updatedUsers
    }));
    handleLogin(adminUser, newStore.id);
  };

  const lowStockCount = appState.products.filter(p => p.stock <= p.minStock).length;

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      setActiveTab('search');
    }
  };

  if (!currentUser) {
    return (
      <LoginView 
        appState={appState} 
        onLogin={handleLogin}
        onCreateStore={handleCreateStore}
      />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-slate-100 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        appState={appState} 
        currentUser={currentUser}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenCardRates={() => setCardRatesOpen(true)}
        onOpenUserManagement={() => setUsersModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-10 shadow-xs">
          <form onSubmit={handleQuickSearchSubmit} className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por talle, color, código de barras, cliente, producto..."
                value={quickSearch}
                onChange={e => setQuickSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-100/80 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </form>

          <div className="flex items-center space-x-2 sm:space-x-3 ml-3">
            {/* User Management Button (Admin only) */}
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setUsersModalOpen(true)}
                className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors text-xs font-bold shadow-xs"
                title="Gestión de Usuarios y Contraseñas"
              >
                <Users className="w-3.5 h-3.5 text-purple-600" />
                <span>Usuarios</span>
              </button>
            )}

            {/* Rubro Badge */}
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setSettingsOpen(true)}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all text-xs font-bold border border-slate-700 shadow-xs"
                title="Ajustar Rubro o Tipo de Comercio"
              >
                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                <span>{appState.storeInfo.businessType || 'Boutique & Indumentaria'}</span>
              </button>
            )}

            {lowStockCount > 0 && (
              <button
                onClick={() => setActiveTab('stock')}
                className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors text-xs font-extrabold"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                <span>{lowStockCount} Bajo Stock</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('guide')}
              className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors text-xs font-bold"
              title="Manual & Guía Explicativa"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Manual</span>
            </button>

            <button
              onClick={() => setActiveTab('pos')}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nueva Venta</span>
            </button>

            {/* Active User Badge & Logout */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 text-xs">
              <div className="hidden sm:flex flex-col text-right">
                <span className="font-black text-slate-800 block text-[11px] leading-tight truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-indigo-600 block font-bold capitalize">
                  {currentUser.role === 'admin' ? 'Administrador' : 'Cajero / Vendedor'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs flex items-center space-x-1 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard / View Content Canvas */}
        <main className="flex-1 p-4 sm:p-5 lg:p-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView appState={appState} setActiveTab={setActiveTab} />
          )}

          {activeTab === 'pos' && (
            <POSView appState={appState} onOpenCardRates={() => setCardRatesOpen(true)} />
          )}

          {activeTab === 'stock' && (
            <StockView appState={appState} />
          )}

          {activeTab === 'suppliers' && (
            <SuppliersView appState={appState} />
          )}

          {activeTab === 'customers' && (
            <CurrentAccountsView appState={appState} setActiveTab={setActiveTab} />
          )}

          {activeTab === 'withdrawals' && (
            <WithdrawalsView appState={appState} />
          )}

          {activeTab === 'cheques' && (
            <ChequesView appState={appState} />
          )}

          {activeTab === 'cash' && (
            <CashRegisterView appState={appState} />
          )}

          {activeTab === 'search' && (
            <AdvancedSearchFilterView appState={appState} />
          )}

          {activeTab === 'reports' && (
            <ReportsView appState={appState} />
          )}

          {activeTab === 'guide' && (
            <UserGuideView appState={appState} setActiveTab={setActiveTab} />
          )}
        </main>

        {/* Footer Status Bar */}
        <footer className="h-8 bg-slate-900 text-slate-400 px-4 sm:px-6 flex items-center justify-between text-[10px] flex-shrink-0 border-t border-slate-800 select-none">
          <div className="flex items-center space-x-4 sm:space-x-6">
            <span className="font-mono">DB: v2.4.1 (Multi-User Active)</span>
            <span className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              <span className="text-slate-300 font-semibold">Sesión: {currentUser.username} ({currentUser.role})</span>
            </span>
            <span className="hidden md:inline">Terminal ID: PX-99</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline text-indigo-300 font-mono font-bold">MULTI_USER_AUTH: ACTIVE</span>
            <span className="text-slate-400 uppercase font-mono">{new Date().toLocaleDateString('es-AR')}</span>
          </div>
        </footer>
      </div>

      {/* Store Settings Modal */}
      <StoreSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        storeInfo={appState.storeInfo}
      />

      {/* Card Interest & Surcharges Modal */}
      <CardRatesModal
        isOpen={cardRatesOpen}
        onClose={() => setCardRatesOpen(false)}
        storeInfo={appState.storeInfo}
      />

      {/* User Management & Password Reset Modal */}
      <UserManagementModal
        isOpen={usersModalOpen}
        onClose={() => setUsersModalOpen(false)}
        appState={appState}
        currentUser={currentUser}
      />
    </div>
  );
}

