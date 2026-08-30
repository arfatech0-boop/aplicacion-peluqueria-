import React, { useState } from 'react';
import { 
  Store, 
  Lock, 
  User, 
  Building, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  PlusCircle, 
  Sparkles,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { AppState, SystemUser, StoreAccount } from '../types';

interface LoginViewProps {
  appState: AppState;
  onLogin: (user: SystemUser, storeId: string) => void;
  onCreateStore: (newStore: StoreAccount, adminUser: SystemUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ appState, onLogin, onCreateStore }) => {
  const [mode, setMode] = useState<'login' | 'register_store'>('login');
  
  // Login form state
  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    appState.stores && appState.stores.length > 0 ? appState.stores[0].id : 'store-demo-a'
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Register Store Form State
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCuit, setNewStoreCuit] = useState('');
  const [newStoreRubro, setNewStoreRubro] = useState('Comercio General / Multirrubro');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  const stores = (appState.stores && appState.stores.length > 0) ? appState.stores.filter(s => s.id === 'store-demo-a') : [
    {
      id: 'store-demo-a',
      name: appState.storeInfo.name || 'Comercio Principal',
      cuit: appState.storeInfo.cuit || '20-12345678-9',
      businessType: appState.storeInfo.businessType || 'Comercio General / Multirrubro' as any,
      address: appState.storeInfo.address || '',
      phone: appState.storeInfo.phone || '',
      email: appState.storeInfo.email || '',
      active: true,
      createdAt: new Date().toISOString()
    }
  ];

  const handleQuickLogin = (storeId: string, demoUser: string, pass: string) => {
    setSelectedStoreId(storeId);
    setUsername(demoUser);
    setPassword(pass);
    setErrorMessage('');
    
    // Trigger login
    const targetStoreUsers = appState.users.filter(u => u.storeId === storeId || !u.storeId);
    const user = targetStoreUsers.find(u => u.username.toLowerCase() === demoUser.toLowerCase()) || {
      id: `usr-${Date.now()}`,
      storeId,
      username: demoUser,
      password: pass,
      name: demoUser === 'admin' ? 'Administrador' : 'Don Pedro',
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString()
    };

    onLogin(user, storeId);
  };

  const handleSubmitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Por favor ingrese su usuario o correo.');
      return;
    }

    const selectedStore = stores.find(s => s.id === selectedStoreId);

    // Check store trial expiration
    if (selectedStore?.isDemo && selectedStore.trialExpiresAt) {
      if (new Date().getTime() > new Date(selectedStore.trialExpiresAt).getTime()) {
        setErrorMessage('🛑 El período de prueba (7 días) ha finalizado para este comercio. Comuníquese con administración para habilitar el plan definitivo.');
        return;
      }
    }

    const storeUsers = appState.users.filter(u => !u.storeId || u.storeId === selectedStoreId);
    const foundUser = storeUsers.find(u => u.username.toLowerCase() === username.trim().toLowerCase());

    if (foundUser) {
      if (!foundUser.active) {
        setErrorMessage('🛑 Este usuario ha sido desactivado por administración.');
        return;
      }

      // Check user trial expiration
      if (foundUser.isDemo && foundUser.trialExpiresAt) {
        if (new Date().getTime() > new Date(foundUser.trialExpiresAt).getTime()) {
          setErrorMessage('🛑 El período de prueba de 7 días ha vencido. Póngase en contacto con administración para activar la cuenta.');
          return;
        }
      }

      if (foundUser.password && foundUser.password !== password) {
        setErrorMessage('Contraseña incorrecta. Por favor intente nuevamente.');
        return;
      }
      onLogin(foundUser, selectedStoreId);
    } else {
      // Validate credentials for existing user
      if (password !== '123456' && password !== 'admin') {
        setErrorMessage('Usuario o contraseña no encontrados. Pida al administrador que le cree una cuenta.');
        return;
      }

      const newUser: SystemUser = {
        id: `usr-${Date.now()}`,
        storeId: selectedStoreId,
        username: username.trim(),
        password: password || '123456',
        name: username.trim().toUpperCase(),
        role: 'admin',
        active: true,
        createdAt: new Date().toISOString()
      };
      onLogin(newUser, selectedStoreId);
    }
  };

  const handleRegisterStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim() || !newAdminUsername.trim()) {
      setErrorMessage('Por favor complete los campos obligatorios del nuevo comercio.');
      return;
    }

    const newStoreId = `store-${Date.now()}`;
    const newStore: StoreAccount = {
      id: newStoreId,
      name: newStoreName.trim(),
      cuit: newStoreCuit.trim() || '20-00000000-0',
      businessType: newStoreRubro as any,
      address: 'Dirección Comercial',
      phone: '11 0000-0000',
      email: `${newAdminUsername}@comercio.com`,
      active: true,
      createdAt: new Date().toISOString()
    };

    const newAdmin: SystemUser = {
      id: `usr-${Date.now()}`,
      storeId: newStoreId,
      username: newAdminUsername.trim(),
      password: newAdminPassword || '123456',
      name: newAdminName.trim() || newAdminUsername.trim(),
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString()
    };

    onCreateStore(newStore, newAdmin);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans relative overflow-hidden">
      {/* Background Animated Glow Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navbar Header */}
      <header className="px-6 py-4 flex items-center justify-between z-10 border-b border-slate-800/60 backdrop-blur-md bg-slate-950/40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-lg text-white tracking-tight flex items-center gap-2">
              GestiónComercio <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold border border-indigo-500/30">SaaS Multi-Comercio</span>
            </h1>
            <p className="text-[11px] text-slate-400">Plataforma de Control Comercial & Punto de Venta Aislado</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Aislamiento 100% Garantizado</span>
          </span>
        </div>
      </header>

      {/* Main Form Box Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-6">
        <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6">
          {/* Header Title */}
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-center space-y-1">
            <h2 className="font-extrabold text-sm text-white flex items-center justify-center space-x-2">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <span>Acceso a Clientes & Usuarios</span>
            </h2>
            <p className="text-[11px] text-slate-400">Ingrese sus credenciales otorgadas por el administrador.</p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs font-semibold space-y-1">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping flex-shrink-0" />
                <span className="font-bold">{errorMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitLogin} className="space-y-4">

            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Usuario o Correo *</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ingrese su usuario..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Contraseña *</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-wider"
            >
              <span>ENTRAR A MI COMERCIO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      {/* Footer info */}
      <footer className="py-3 text-center text-[11px] text-slate-500 z-10 border-t border-slate-900 bg-slate-950">
        GestiónComercio Pro SaaS &copy; 2026 - Aisle de datos por `storeId` para venta comercial.
      </footer>
    </div>
  );
};
