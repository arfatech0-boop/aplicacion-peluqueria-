import React from 'react';
import { 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  Users, 
  PackageMinus, 
  CreditCard, 
  Wallet, 
  AlertTriangle, 
  ArrowUpRight,
  DollarSign,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { AppState } from '../types';
import { ActiveTab } from './Navbar';

interface DashboardViewProps {
  appState: AppState;
  setActiveTab: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ appState, setActiveTab }) => {
  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    try {
      const saleDate = new Date(dateStr);
      const now = new Date();
      return (
        saleDate.getFullYear() === now.getFullYear() &&
        saleDate.getMonth() === now.getMonth() &&
        saleDate.getDate() === now.getDate()
      );
    } catch (e) {
      return false;
    }
  };

  // Stats Calculations
  const todaySales = appState.sales.filter(s => s.status === 'completed' && isToday(s.date));
  const totalSalesTodayAmount = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);

  const totalCustomerDebt = appState.customers.reduce((acc, c) => acc + c.currentBalance, 0);
  const lowStockProducts = appState.products.filter(p => p.stock <= p.minStock);
  const walletCheques = appState.cheques.filter(c => c.status === 'in_wallet' || c.status === 'pending');
  const walletChequesTotal = walletCheques.reduce((acc, c) => acc + c.amount, 0);

  const pendingWithdrawals = appState.withdrawals.filter(w => w.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="z-10">
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {appState.storeInfo.businessType || 'Comercio & Indumentaria'}
            </span>
            <span className="text-slate-400 text-xs font-mono">CUIT {appState.storeInfo.cuit}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {appState.storeInfo.name}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Control integral de caja, facturación con códigos de barras, gestión de talle/color, cuentas corrientes y aumentos por proveedor.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto z-10">
          <button
            onClick={() => setActiveTab('pos')}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 font-bold text-white shadow-lg shadow-emerald-900/30 transition-all text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>+ Nueva Venta (POS)</span>
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-slate-200 border border-slate-700 shadow-sm transition-all text-sm"
          >
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>Aumento Proveedor</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Today */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ventas de Hoy</span>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">${totalSalesTodayAmount.toLocaleString('es-AR')}</span>
            <span className="text-xs text-slate-500 block mt-0.5">{todaySales.length} comprobantes emitidos</span>
          </div>
          <button
            onClick={() => setActiveTab('reports')}
            className="mt-4 flex items-center space-x-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
          >
            <span>Ver detalle de ventas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Customer Debt (Cuenta Corriente) */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Saldo Cuentas Corrientes</span>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">${totalCustomerDebt.toLocaleString('es-AR')}</span>
            <span className="text-xs text-slate-500 block mt-0.5">Deuda acumulada de clientes</span>
          </div>
          <button
            onClick={() => setActiveTab('customers')}
            className="mt-4 flex items-center space-x-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            <span>Gestionar cuentas y cobros</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Alertas Bajo Stock</span>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-600">{lowStockProducts.length}</span>
            <span className="text-xs text-slate-500 block mt-0.5">Productos requieren reposición</span>
          </div>
          <button
            onClick={() => setActiveTab('stock')}
            className="mt-4 flex items-center space-x-1 text-xs font-medium text-amber-600 hover:text-amber-700"
          >
            <span>Ver inventario crítico</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Cheques en cartera */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cheques en Cartera</span>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">${walletChequesTotal.toLocaleString('es-AR')}</span>
            <span className="text-xs text-slate-500 block mt-0.5">{walletCheques.length} cheques por cobro/depósito</span>
          </div>
          <button
            onClick={() => setActiveTab('cheques')}
            className="mt-4 flex items-center space-x-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            <span>Ver cartera de cheques</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Two-Column Detail Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Low Stock Alert Banner & Recent Sales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Low Stock Highlight List */}
          {lowStockProducts.length > 0 && (
            <div className="bg-amber-50/70 rounded-xl p-5 border border-amber-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Atención: Productos con Bajo Stock</h3>
                </div>
                <button
                  onClick={() => setActiveTab('stock')}
                  className="text-xs font-semibold text-amber-700 hover:underline"
                >
                  Ver Todos ({lowStockProducts.length})
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lowStockProducts.slice(0, 4).map(prod => (
                  <div key={prod.id} className="bg-white p-3 rounded-lg border border-amber-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 block truncate max-w-[180px]">{prod.name}</span>
                      <span className="text-slate-500">Mínimo: {prod.minStock} {prod.unit}</span>
                    </div>
                    <span className="px-2 py-1 rounded bg-red-100 text-red-700 font-bold">
                      {prod.stock} {prod.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Sales Activity Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Últimas Ventas Emitidas</h3>
              <button
                onClick={() => setActiveTab('search')}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                Buscador Avanzado
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3">Comprobante</th>
                    <th className="px-6 py-3">Fecha</th>
                    <th className="px-6 py-3">Cliente</th>
                    <th className="px-6 py-3">Pago</th>
                    <th className="px-6 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appState.sales.slice(0, 5).map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5 font-semibold text-slate-900">{sale.invoiceNumber}</td>
                      <td className="px-6 py-3.5 text-slate-500">{new Date(sale.date).toLocaleString('es-AR')}</td>
                      <td className="px-6 py-3.5 text-slate-700">{sale.customerName || 'Consumidor Final'}</td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 capitalize">
                          {sale.paymentMethod === 'current_account' ? 'Cuenta Corriente' : sale.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-slate-900">${sale.totalAmount.toLocaleString('es-AR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Pending Withdrawals & Quick Module Access */}
        <div className="space-y-6">
          {/* Mercadería Retirada Pending Card */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <PackageMinus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Retiros por Facturar</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                {pendingWithdrawals.length}
              </span>
            </div>

            {pendingWithdrawals.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No hay mercadería retirada pendiente de facturar.</p>
            ) : (
              <div className="space-y-3">
                {pendingWithdrawals.slice(0, 3).map(w => (
                  <div key={w.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{w.withdrawalNumber}</span>
                      <span className="text-slate-500">{new Date(w.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-700 font-medium">{w.customerName}</p>
                    <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>{w.items.length} artículos</span>
                      <span className="font-bold text-indigo-600">${w.totalAmount.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setActiveTab('withdrawals')}
              className="mt-4 w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Ver todos los retiros
            </button>
          </div>

          {/* Business Modules Shortcuts */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Módulos de Gestión</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setActiveTab('suppliers')}
                className="p-3 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-left font-medium transition-colors"
              >
                Aumento Global %
              </button>
              <button
                onClick={() => setActiveTab('cash')}
                className="p-3 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-left font-medium transition-colors"
              >
                Arqueo de Caja
              </button>
              <button
                onClick={() => setActiveTab('cheques')}
                className="p-3 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-left font-medium transition-colors"
              >
                Ingreso de Cheques
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className="p-3 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-left font-medium transition-colors"
              >
                Reporte Mensual
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
