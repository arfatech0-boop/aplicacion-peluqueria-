import React, { useState } from 'react';
import { AppState, SystemUser, UserRole } from '../types';
import { DataService } from '../services/dataService';
import { 
  Users, 
  Plus, 
  X, 
  Pencil, 
  Trash2, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  ShoppingCart,
  Wallet,
  Package,
  PackageMinus,
  TrendingUp,
  CreditCard,
  BarChart3,
  Search,
  LayoutDashboard,
  Settings,
  Eye,
  EyeOff,
  Check,
  Lock
} from 'lucide-react';
import { Pagination } from './Pagination';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
  currentUser: SystemUser | null;
}

export interface PermissionModuleDef {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const MODULE_PERMISSIONS: PermissionModuleDef[] = [
  {
    id: 'pos',
    name: 'Ventas & Facturación (POS)',
    shortLabel: 'POS',
    description: 'Cobro en mostrador, emisión de tickets y comprobantes',
    icon: ShoppingCart,
    color: 'emerald'
  },
  {
    id: 'cash',
    name: 'Control de Caja Diaria',
    shortLabel: 'Caja',
    description: 'Aperturas, movimientos de dinero, arqueos y cierres',
    icon: Wallet,
    color: 'blue'
  },
  {
    id: 'stock',
    name: 'Stock & Inventario',
    shortLabel: 'Stock',
    description: 'Artículos, costos, precios de venta y control de stock',
    icon: Package,
    color: 'amber'
  },
  {
    id: 'customers',
    name: 'Cuentas Corrientes',
    shortLabel: 'Cuentas Ctes.',
    description: 'Fichas de clientes, saldos, límites y cobranzas',
    icon: Users,
    color: 'indigo'
  },
  {
    id: 'withdrawals',
    name: 'Mercadería Retirada (Remitos)',
    shortLabel: 'Remitos',
    description: 'Emisión de remitos y comprobantes de entrega',
    icon: PackageMinus,
    color: 'orange'
  },
  {
    id: 'suppliers',
    name: 'Proveedores & Aumento',
    shortLabel: 'Proveedores',
    description: 'Listas de costos y aumentos masivos de precios',
    icon: TrendingUp,
    color: 'teal'
  },
  {
    id: 'cheques',
    name: 'Cartera de Cheques',
    shortLabel: 'Cheques',
    description: 'Registro, fechas de cobro y depósito de cheques',
    icon: CreditCard,
    color: 'purple'
  },
  {
    id: 'reports',
    name: 'Reportes & Exportaciones',
    shortLabel: 'Reportes',
    description: 'Estadísticas de ventas, ganancias y balance PDF/Excel',
    icon: BarChart3,
    color: 'cyan'
  },
  {
    id: 'search',
    name: 'Buscador Avanzado',
    shortLabel: 'Buscador',
    description: 'Búsqueda global multicriterio de operaciones',
    icon: Search,
    color: 'slate'
  },
  {
    id: 'dashboard',
    name: 'Dashboard General',
    shortLabel: 'Dashboard',
    description: 'Métricas generales, gráficos e indicadores clave',
    icon: LayoutDashboard,
    color: 'violet'
  },
  {
    id: 'settings',
    name: 'Ajustes del Comercio & AFIP',
    shortLabel: 'Configuración',
    description: 'Datos fiscales, facturación electrónica y parámetros',
    icon: Settings,
    color: 'rose'
  }
];

export const ROLE_PRESET_PERMISSIONS: Record<string, string[]> = {
  admin: ['pos', 'cash', 'stock', 'customers', 'withdrawals', 'suppliers', 'cheques', 'reports', 'search', 'dashboard', 'settings'],
  superadmin: ['pos', 'cash', 'stock', 'customers', 'withdrawals', 'suppliers', 'cheques', 'reports', 'search', 'dashboard', 'settings'],
  manager: ['pos', 'cash', 'stock', 'customers', 'withdrawals', 'suppliers', 'cheques', 'reports', 'search', 'dashboard'],
  cashier: ['pos', 'cash']
};

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  appState,
  currentUser
}) => {
  const [editingUser, setEditingUser] = useState<Partial<SystemUser> | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [rolePreset, setRolePreset] = useState<string>('cashier');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(6);

  if (!isOpen) return null;

  const filteredUsers = appState.users.filter(u => {
    if (!filterSearch) return true;
    const q = filterSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const paginatedUsers = filteredUsers.slice(
    (userPage - 1) * userPageSize,
    userPage * userPageSize
  );

  const handleOpenCreate = () => {
    const defaultPerms = [...ROLE_PRESET_PERMISSIONS.cashier];
    setEditingUser({
      id: `user-${Date.now()}`,
      name: '',
      username: '',
      password: '',
      role: 'cashier',
      active: true,
      permissions: defaultPerms,
      createdAt: new Date().toISOString()
    });
    setSelectedPermissions(defaultPerms);
    setRolePreset('cashier');
    setShowPassword(false);
    setErrorMsg('');
    setSuccessMsg('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: SystemUser) => {
    const storedPerms = DataService.getUserPermissions(user.id, user.username);
    const userPerms = Array.isArray(user.permissions) && user.permissions.length > 0
      ? [...user.permissions]
      : Array.isArray(storedPerms) && storedPerms.length > 0
        ? [...storedPerms]
        : user.role === 'admin' || user.role === 'superadmin'
          ? [...ROLE_PRESET_PERMISSIONS.admin]
          : user.role === 'manager'
            ? [...ROLE_PRESET_PERMISSIONS.manager]
            : [...ROLE_PRESET_PERMISSIONS.cashier];

    setEditingUser({ ...user, permissions: userPerms });
    setSelectedPermissions(userPerms);

    const isAll = userPerms.length >= MODULE_PERMISSIONS.length;
    const isManager = JSON.stringify([...userPerms].sort()) === JSON.stringify([...ROLE_PRESET_PERMISSIONS.manager].sort());
    const isCashier = JSON.stringify([...userPerms].sort()) === JSON.stringify([...ROLE_PRESET_PERMISSIONS.cashier].sort());
    const detectedPreset = isAll ? 'admin' : isManager ? 'manager' : isCashier ? 'cashier' : 'custom';
    setRolePreset(detectedPreset);

    setShowPassword(false);
    setErrorMsg('');
    setSuccessMsg('');
    setIsFormOpen(true);
  };

  const handleRolePresetChange = (newRole: string) => {
    setRolePreset(newRole);
    if (newRole in ROLE_PRESET_PERMISSIONS) {
      const perms = [...ROLE_PRESET_PERMISSIONS[newRole]];
      setSelectedPermissions(perms);
      if (editingUser) {
        setEditingUser({
          ...editingUser,
          role: (newRole === 'custom' ? 'cashier' : newRole) as UserRole,
          permissions: perms
        });
      }
    } else {
      if (editingUser) {
        setEditingUser({
          ...editingUser,
          role: 'cashier' as UserRole
        });
      }
    }
  };

  const togglePermission = (moduleId: string) => {
    let updated: string[];
    if (selectedPermissions.includes(moduleId)) {
      updated = selectedPermissions.filter(id => id !== moduleId);
    } else {
      updated = [...selectedPermissions, moduleId];
    }
    setSelectedPermissions(updated);
    setRolePreset('custom');
    if (editingUser) {
      setEditingUser({
        ...editingUser,
        permissions: updated
      });
    }
  };

  const handleSelectAllPermissions = () => {
    const allIds = MODULE_PERMISSIONS.map(m => m.id);
    setSelectedPermissions(allIds);
    setRolePreset('admin');
    if (editingUser) {
      setEditingUser({
        ...editingUser,
        role: 'admin',
        permissions: allIds
      });
    }
  };

  const handleDeselectAllPermissions = () => {
    setSelectedPermissions([]);
    setRolePreset('custom');
    if (editingUser) {
      setEditingUser({
        ...editingUser,
        permissions: []
      });
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.name || !editingUser.username) {
      setErrorMsg('Por favor complete todos los campos obligatorios (Nombre y Usuario).');
      return;
    }

    if (!editingUser.id && !editingUser.password) {
      setErrorMsg('Debe asignar una contraseña para el nuevo usuario.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');

    const finalRole: UserRole = rolePreset === 'admin' 
      ? 'admin' 
      : rolePreset === 'manager' 
        ? 'manager' 
        : rolePreset === 'superadmin' 
          ? 'superadmin' 
          : 'cashier';

    const userToSave: SystemUser = {
      ...editingUser,
      role: finalRole,
      permissions: selectedPermissions,
      name: editingUser.name.trim(),
      username: editingUser.username.trim().toLowerCase(),
      active: editingUser.active ?? true,
      createdAt: editingUser.createdAt || new Date().toISOString()
    } as SystemUser;
    
    // Assign storeId if isolated client or fallback to current store
    if (!userToSave.storeId) {
      if ((editingUser as any).isIsolatedClient) {
        userToSave.storeId = `store-${Date.now()}`;
      } else {
        userToSave.storeId = DataService.getCurrentStoreId() || `store-${Date.now()}`;
      }
    }

    DataService.setUserPermissions(userToSave.id, userToSave.username, selectedPermissions);
    const res = await DataService.saveUser(userToSave);

    if (res.success) {
      setSuccessMsg(`¡Usuario "${userToSave.name}" (${userToSave.username}) guardado con sus permisos exitosamente!`);
      setIsFormOpen(false);
      setEditingUser(null);
    } else {
      setErrorMsg(res.error || 'Error al guardar el usuario en el sistema.');
    }
  };

  const handleDeleteUser = async (user: SystemUser) => {
    if (user.id === currentUser?.id) {
      alert('No puede eliminar su propio usuario mientras está con la sesión iniciada.');
      return;
    }

    if (window.confirm(`¿Está seguro de eliminar definitivamente al usuario "${user.name}" (@${user.username})? Esta acción no se puede deshacer.`)) {
      const res = await DataService.deleteUser(user.id);
      if (res.success) {
        setSuccessMsg(`Usuario "${user.name}" eliminado correctamente.`);
      } else {
        alert(res.error || 'Error al eliminar el usuario.');
      }
    }
  };

  const handleApprovePermanent = async (user: SystemUser) => {
    const updated: SystemUser = {
      ...user,
      isDemo: false,
      trialExpiresAt: undefined,
      active: true
    };
    const res = await DataService.saveUser(updated);
    if (res.success) {
      setSuccessMsg(`¡Cuenta de "${user.name}" activada como definitiva sin vencimiento!`);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-indigo-800 rounded-xl text-white shadow-md shadow-indigo-600/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight">
                  Gestión Unificada de Usuarios & Permisos
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold uppercase">
                  Panel Administrador
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Cree nuevos usuarios, configure credenciales y asigne los permisos de cada módulo del sistema en un solo lugar.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl font-semibold text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Users Table View */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2 flex-1 max-w-sm">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, usuario o rol..."
                  value={filterSearch}
                  onChange={e => {
                    setFilterSearch(e.target.value);
                    setUserPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Crear Nuevo Usuario & Asignar Permisos</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Nombre & Usuario</th>
                    <th className="p-3">Rol Asignado</th>
                    <th className="p-3">Módulos & Permisos Habilitados</th>
                    <th className="p-3">Modalidad / Estado</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No se encontraron usuarios que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map(user => {
                      const isTrial = user.isDemo && user.trialExpiresAt;
                      const trialExpired = isTrial && new Date().getTime() > new Date(user.trialExpiresAt!).getTime();
                      const daysLeft = isTrial && !trialExpired
                        ? Math.max(0, Math.ceil((new Date(user.trialExpiresAt!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                        : 0;

                      const storedPerms = DataService.getUserPermissions(user.id, user.username);
                      const activePerms = Array.isArray(user.permissions) && user.permissions.length > 0
                        ? user.permissions
                        : Array.isArray(storedPerms) && storedPerms.length > 0
                          ? storedPerms
                          : user.role === 'admin' || user.role === 'superadmin'
                            ? ROLE_PRESET_PERMISSIONS.admin
                            : user.role === 'manager'
                              ? ROLE_PRESET_PERMISSIONS.manager
                              : ROLE_PRESET_PERMISSIONS.cashier;

                      const isAllPerms = activePerms.length >= MODULE_PERMISSIONS.length;

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block leading-tight">
                                  {user.name}
                                  {user.id === currentUser?.id && (
                                    <span className="ml-1.5 px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[9px] font-black">
                                      (Sesión Actual)
                                    </span>
                                  )}
                                </span>
                                <span className="font-mono text-[11px] text-slate-500 block leading-tight">
                                  @{user.username}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              user.role === 'superadmin'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                                  : user.role === 'manager'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {user.role === 'superadmin' 
                                ? '👑 Superadmin' 
                                : user.role === 'admin' 
                                  ? '🛡️ Administrador' 
                                  : user.role === 'manager' 
                                    ? '👔 Encargado' 
                                    : '🛒 Cajero / Vendedor'}
                            </span>
                          </td>

                          <td className="p-3 max-w-xs sm:max-w-md">
                            {isAllPerms ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-[10px]">
                                <Check className="w-3 h-3 mr-1 text-emerald-600" />
                                Acceso Total ({MODULE_PERMISSIONS.length} Módulos)
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {activePerms.map(pid => {
                                  const mod = MODULE_PERMISSIONS.find(m => m.id === pid);
                                  if (!mod) return null;
                                  return (
                                    <span
                                      key={pid}
                                      className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200"
                                      title={mod.name}
                                    >
                                      {mod.shortLabel}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </td>

                          <td className="p-3">
                            {!user.active ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800">
                                🔴 Inactivo
                              </span>
                            ) : trialExpired ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 animate-pulse">
                                🔴 Demo Vencida
                              </span>
                            ) : isTrial ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                                ⏳ Demo ({daysLeft} d)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                🟢 Activo Permanente
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {(isTrial || trialExpired) && (
                                <button
                                  onClick={() => handleApprovePermanent(user)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] shadow-xs transition-colors"
                                  title="Aprobar plan permanente sin vencimiento"
                                >
                                  Activar Plan
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEdit(user)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 flex items-center space-x-1 transition-colors"
                                title="Editar datos, contraseña y permisos"
                              >
                                <Pencil className="w-3 h-3 text-indigo-600" />
                                <span>Editar</span>
                              </button>
                              {user.id !== currentUser?.id && (
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Eliminar usuario"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={userPage}
              totalItems={filteredUsers.length}
              pageSize={userPageSize}
              onPageChange={setUserPage}
              onPageSizeChange={setUserPageSize}
              pageSizeOptions={[6, 12, 24]}
              itemLabel="usuarios"
            />
          </div>
        </div>

        {/* Unified Create / Edit Modal Form */}
        {isFormOpen && editingUser && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[92vh] overflow-y-auto">
              
              {/* Form Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-base">
                      {editingUser.id && appState.users.some(u => u.id === editingUser.id)
                        ? `Editar Usuario & Permisos: ${editingUser.name || editingUser.username}`
                        : 'Crear Nuevo Usuario & Asignar Permisos'}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Configure las credenciales de inicio de sesión y defina a qué secciones del sistema tendrá acceso.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsFormOpen(false)} 
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl font-semibold text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveUser} className="space-y-4">
                
                {/* Section 1: User Account & Identification */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-600 block border-b border-slate-200 pb-1">
                    1. Datos de Identificación y Acceso
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Nombre Completo de la Persona *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Juan Pérez"
                        value={editingUser.name || ''}
                        onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Nombre de Usuario para Login *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. juanperez o cajero1"
                        value={editingUser.username || ''}
                        onChange={e => setEditingUser({ ...editingUser, username: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                        <span>Contraseña de Acceso *</span>
                        {editingUser.password && editingUser.password.startsWith('$2') && (
                          <span className="text-[10px] text-emerald-600 font-bold">🔒 Clave encriptada</span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required={!editingUser.id || !editingUser.password}
                          placeholder={editingUser.password && editingUser.password.startsWith('$2') ? 'Dejar vacío para conservar o escribir nueva' : 'Escriba la clave de acceso'}
                          value={editingUser.password && editingUser.password.startsWith('$2') ? '' : (editingUser.password || '')}
                          onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                          className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                          title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Modalidad / Plan de la Cuenta
                      </label>
                      <select
                        value={editingUser.isDemo ? 'demo' : 'permanent'}
                        onChange={e => {
                          const isDemo = e.target.value === 'demo';
                          setEditingUser({
                            ...editingUser,
                            isDemo,
                            trialExpiresAt: isDemo ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="permanent">🟢 Cuenta Permanente (Sin Vencimiento)</option>
                        <option value="demo">⏳ Cuenta Demo de Prueba (7 Días Gratis)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-slate-200">
                    <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-800 text-xs">
                      <input
                        type="checkbox"
                        checked={editingUser.active ?? true}
                        onChange={e => setEditingUser({ ...editingUser, active: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>Usuario Habilitado para Ingresar</span>
                    </label>

                    {!editingUser.storeId && (
                      <label className="flex items-center space-x-2 cursor-pointer font-bold text-indigo-900 text-xs">
                        <input
                          type="checkbox"
                          checked={(editingUser as any).isIsolatedClient || false}
                          onChange={e => setEditingUser({ ...editingUser, isIsolatedClient: e.target.checked } as any)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>Crear como Base de Datos Aislada (Cliente SaaS Nuevo)</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Section 2: Role Preset & Permissions Configuration */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                        2. Rol & Permisos de Acceso a Módulos
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Seleccione un rol base o marque/desmarque módulos individualmente.
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleSelectAllPermissions}
                        className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        ⚡ Habilitar Todos
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAllPermissions}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        🧹 Desmarcar Todos
                      </button>
                    </div>
                  </div>

                  {/* Preset Selector */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'admin', label: '🛡️ Administrador', sub: 'Acceso Total + Ajustes' },
                      { id: 'manager', label: '👔 Encargado', sub: 'Operaciones + Reportes' },
                      { id: 'cashier', label: '🛒 Cajero / POS', sub: 'Solo Ventas y Caja' },
                      { id: 'custom', label: '⚙️ Personalizado', sub: 'Módulos a medida' },
                    ].map(preset => {
                      const isSelected = rolePreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleRolePresetChange(preset.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          <span className="font-extrabold text-xs block leading-tight">{preset.label}</span>
                          <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                            {preset.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Permissions Checkbox Grid */}
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-700 block mb-2">
                      Módulos Habilitados ({selectedPermissions.length} de {MODULE_PERMISSIONS.length}):
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                      {MODULE_PERMISSIONS.map(mod => {
                        const isChecked = selectedPermissions.includes(mod.id);
                        const Icon = mod.icon;

                        return (
                          <div
                            key={mod.id}
                            onClick={() => togglePermission(mod.id)}
                            className={`p-2.5 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-500 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by div onClick
                              className="w-4 h-4 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer pointer-events-none"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-1.5">
                                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isChecked ? 'text-indigo-600' : 'text-slate-400'}`} />
                                <span className={`font-black text-xs truncate ${isChecked ? 'text-indigo-950' : 'text-slate-700'}`}>
                                  {mod.name}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                                {mod.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Form Footer Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">
                    * El usuario solo podrá ver los módulos que tenga tildados.
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center space-x-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Guardar Usuario y Permisos</span>
                    </button>
                  </div>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
