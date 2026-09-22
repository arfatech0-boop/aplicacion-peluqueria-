import React, { useState } from 'react';
import { AppState, StoreAccount, SystemUser } from '../types';
import { DataService } from '../services/dataService';
import { Building2, Plus, X, Pencil, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

interface ClientManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
}

export const ClientManagementModal: React.FC<ClientManagementModalProps> = ({
  isOpen,
  onClose,
  appState
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCuit, setNewStoreCuit] = useState('20-00000000-0');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('123456');
  const [newStoreBusinessType, setNewStoreBusinessType] = useState('Comercio General / Multirrubro');
  const [isDemoAccount, setIsDemoAccount] = useState(true);

  const RUBROS = [
    'Supermercado / Almacén',
    'Carnicería / Fiambrería & Granja',
    'Verdulería / Frutería',
    'Kiosco / Drugstore',
    'Ferretería / Corralón',
    'Indumentaria / Calzado',
    'Electrónica / Computación',
    'Gastronomía / Panadería',
    'Farmacia / Perfumería',
    'Autopartes / Repuestos',
    'Servicios / Profesional',
    'Comercio General / Multirrubro'
  ];

  // Details State
  const [selectedStore, setSelectedStore] = useState<StoreAccount | null>(null);

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    setNewStoreName('');
    setNewStoreBusinessType('Comercio General / Multirrubro');
    setNewAdminUsername('');
    setNewAdminPassword('123456');
    setIsDemoAccount(true);
    setErrorMsg('');
    setSuccessMsg('');
    setIsFormOpen(true);
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName || !newAdminUsername || !newAdminPassword) {
      setErrorMsg('Por favor complete nombre del comercio, usuario admin y contraseña.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');

    const newStoreId = `store-${Date.now()}`;
    const newStore: StoreAccount = {
      id: newStoreId,
      name: newStoreName.trim(),
      cuit: newStoreCuit,
      businessType: newStoreBusinessType as any,
      address: '',
      phone: '',
      email: `${newAdminUsername.trim()}@comercio.com`,
      active: true,
      createdAt: new Date().toISOString()
    };

    const newUser: SystemUser = {
      id: `usr-${Date.now()}`,
      storeId: newStoreId,
      username: newAdminUsername.trim(),
      password: newAdminPassword,
      name: `Admin ${newStoreName}`,
      role: 'admin',
      active: true,
      isDemo: isDemoAccount,
      trialExpiresAt: isDemoAccount ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      createdAt: new Date().toISOString()
    };

    try {
      await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStore)
      });
      await DataService.saveUser(newUser);
      
      setSuccessMsg(`¡Comercio "${newStoreName}" y su administrador creados exitosamente!`);
      setIsFormOpen(false);
    } catch (err) {
      setErrorMsg('Error al guardar el nuevo comercio.');
    }
  };

  const stores = appState.stores || [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Gestión de Clientes y Comercios (Súper Admin)</h3>
              <p className="text-xs text-slate-500 font-medium">Administra los comercios, da de alta a nuevos clientes y revisa sus estados.</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-semibold flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Stores List Table */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-700 text-xs">
            Comercios Registrados ({stores.length})
          </span>
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1 shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Crear Nuevo Comercio</span>
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto border rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-2.5">Comercio</th>
                <th className="p-2.5">CUIT</th>
                <th className="p-2.5">Estado</th>
                <th className="p-2.5">Fecha Creación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stores.map(store => (
                <tr 
                  key={store.id} 
                  className="hover:bg-indigo-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedStore(store)}
                  title="Haz clic para ver detalles y contraseñas"
                >
                  <td className="p-2.5 font-bold text-slate-900 flex items-center space-x-2">
                    <span>{store.name}</span>
                  </td>
                  <td className="p-2.5 font-mono text-slate-600">{store.cuit}</td>
                  <td className="p-2.5">
                    {store.active ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        🟢 Activo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-800">
                        🔴 Suspendido
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-slate-500">{new Date(store.createdAt).toLocaleDateString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Form Create Store */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 border">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-slate-900 text-sm">Crear Nuevo Comercio</h4>
                <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveStore} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre del Comercio</label>
                  <input
                    type="text"
                    value={newStoreName}
                    onChange={e => setNewStoreName(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded focus:ring-1 focus:ring-indigo-500 font-medium"
                    placeholder="Ej. Kiosco Carlitos"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Rubro / Categoría</label>
                  <select
                    value={newStoreBusinessType}
                    onChange={e => setNewStoreBusinessType(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded focus:ring-1 focus:ring-indigo-500 font-medium bg-white"
                  >
                    {RUBROS.map(rubro => (
                      <option key={rubro} value={rubro}>{rubro}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Usuario del Administrador</label>
                  <input
                    type="text"
                    value={newAdminUsername}
                    onChange={e => setNewAdminUsername(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded focus:ring-1 focus:ring-indigo-500 font-mono"
                    placeholder="Ej. carlos_admin"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Contraseña Temporal</label>
                  <input
                    type="text"
                    value={newAdminPassword}
                    onChange={e => setNewAdminPassword(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Plan</label>
                  <select
                    value={isDemoAccount ? 'demo' : 'full'}
                    onChange={e => setIsDemoAccount(e.target.value === 'demo')}
                    className="w-full px-2 py-1.5 border rounded focus:ring-1 focus:ring-indigo-500 font-medium bg-white"
                  >
                    <option value="demo">Demo Gratuita (7 Días)</option>
                    <option value="full">Plan Completo (Sin Vencimiento)</option>
                  </select>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 px-3 py-2 border rounded-lg text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-500 shadow-md transition-colors"
                  >
                    Crear Comercio
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Store Details */}
        {selectedStore && (() => {
          const storeUsers = appState.users.filter(u => u.storeId === selectedStore.id);
          console.log('Selected Store ID:', selectedStore.id, 'All Users:', appState.users, 'Store Users:', storeUsers);
          const adminUser = storeUsers.find(u => u.role === 'admin') || storeUsers[0];
          
          return (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">{selectedStore.name}</h4>
                    <p className="text-xs text-slate-500">Detalles del comercio y acceso</p>
                  </div>
                  <button onClick={() => setSelectedStore(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <h5 className="font-bold text-slate-700 mb-2 border-b pb-1 text-xs uppercase">Datos del Comercio</h5>
                    <div className="space-y-1.5">
                      <p className="text-xs flex justify-between"><span className="text-slate-500">CUIT:</span> <span className="font-mono font-medium text-slate-900">{selectedStore.cuit}</span></p>
                      <p className="text-xs flex justify-between"><span className="text-slate-500">Rubro:</span> <span className="font-medium text-slate-900">{selectedStore.businessType || 'General'}</span></p>
                      <p className="text-xs flex justify-between"><span className="text-slate-500">Estado:</span> 
                        <span className="font-bold text-emerald-600">{selectedStore.active ? 'Activo' : 'Suspendido'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                    <h5 className="font-bold text-indigo-900 mb-2 border-b border-indigo-200 pb-1 text-xs uppercase">Usuario Administrador</h5>
                    {adminUser ? (
                      <div className="flex flex-col space-y-2 text-sm mt-3">
                        <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                          <span className="text-slate-500 font-bold">Usuario:</span>
                          <span className="font-mono font-bold text-indigo-900 bg-white px-2 py-0.5 rounded shadow-xs">{adminUser.username}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-indigo-100 pb-2 pt-1">
                          <span className="text-slate-500 font-bold">Contraseña:</span>
                          <span className="font-mono font-bold text-indigo-900 bg-white px-2 py-0.5 rounded shadow-xs">
                            {adminUser.password?.startsWith('$2') ? '****** (Oculta)' : (adminUser.password || '******')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-slate-500 font-bold">Plan:</span>
                          {adminUser.isDemo ? (
                            <span className="font-bold text-amber-700">Demo (Vence: {adminUser.trialExpiresAt ? new Date(adminUser.trialExpiresAt).toLocaleDateString() : 'N/A'})</span>
                          ) : (
                            <span className="font-bold text-emerald-700">Completo (Activo)</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-indigo-600 italic">No se encontró un usuario administrador para este comercio.</p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setSelectedStore(null)}
                    className="w-full px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cerrar Detalles
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
