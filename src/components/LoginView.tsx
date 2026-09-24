import React, { useState } from 'react';
import bcrypt from 'bcryptjs';
import { 
  Lock, 
  User, 
  ArrowRight, 
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { AppState, SystemUser } from '../types';
import { DataService } from '../services/dataService';

interface LoginViewProps {
  appState: AppState;
  onLogin: (user: SystemUser, storeId: string) => void;
  onCreateStore?: any; // Ignored for now
}

export const LoginView: React.FC<LoginViewProps> = ({ appState, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Por favor ingrese su usuario o correo.');
      return;
    }

    let foundUser = DataService.getUserByUsername(username);

    // Search user globally first
    if (!foundUser) {
      foundUser = (appState.users || []).find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    }

    // Direct database fallback if state hasn't loaded yet
    if (!foundUser) {
      try {
        const { data, error } = await DataService.supabase.from('users').select('*').eq('username', username.trim().toLowerCase());
        
        if (error) {
          console.error('Supabase query error:', error);
        }
        if (data && data.length > 0) {
          foundUser = data[0];
        }
      } catch (e) {
        console.error('Error fetching user fallback:', e);
      }
    }

    if (foundUser) {
      if (!foundUser.active) {
        setErrorMessage('🛑 Este usuario ha sido desactivado por administración.');
        return;
      }

      // Check user trial expiration
      if (foundUser.isDemo && foundUser.trialExpiresAt) {
        if (new Date().getTime() > new Date(foundUser.trialExpiresAt).getTime()) {
          setErrorMessage('🛑 El período de prueba ha vencido. Póngase en contacto con administración.');
          return;
        }
      }

      let isPasswordValid = false;
      if (!foundUser.password) {
        isPasswordValid = true;
      } else if (foundUser.password === password) {
        isPasswordValid = true;
      } else if (foundUser.password.startsWith('$2a$') || foundUser.password.startsWith('$2b$')) {
        try {
          isPasswordValid = bcrypt.compareSync(password, foundUser.password);
        } catch (e) {
          isPasswordValid = false;
        }
      }

      if (!isPasswordValid) {
        setErrorMessage('Contraseña incorrecta. Por favor intente nuevamente.');
        return;
      }
      onLogin(foundUser, foundUser.storeId || 'store-demo-a');
    } else {
      setErrorMessage('Usuario no encontrado. Pida al administrador que le cree una cuenta.');
      return;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans relative overflow-hidden">
      {/* Background Animated Glow Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[140px] pointer-events-none" />

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

          <form onSubmit={handleLogin} className="space-y-4">
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
        ArFaTech &copy; 2026 - Aisle de datos por `storeId` para venta comercial.
      </footer>
    </div>
  );
};
