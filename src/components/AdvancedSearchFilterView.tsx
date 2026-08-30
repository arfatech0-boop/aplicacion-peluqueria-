import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  Filter, 
  FileSpreadsheet, 
  FileText, 
  ShoppingCart, 
  Users, 
  PackageMinus,
  RefreshCw,
  RotateCcw
} from 'lucide-react';
import { AppState, Sale, CustomerTransaction, CustomerWithdrawal } from '../types';
import { DataService } from '../services/dataService';
import { exportSalesExcel } from '../utils/excelExporter';
import { generateSaleInvoicePDF, generateThermalTicketPDF } from '../utils/pdfGenerator';

interface AdvancedSearchFilterViewProps {
  appState: AppState;
}

export const AdvancedSearchFilterView: React.FC<AdvancedSearchFilterViewProps> = ({ appState }) => {
  const [moduleFilter, setModuleFilter] = useState<'sales' | 'customer_tx' | 'withdrawals'>('sales');
  const [textSearch, setTextSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [dateRange, setDateRange] = useState<'ALL' | 'today' | 'week' | 'month' | 'custom'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');

  const categories = Array.from(new Set(appState.products.map(p => p.category)));

  // Filter Sales logic
  const filteredSales = appState.sales.filter(sale => {
    // 1. Text Search
    const q = textSearch.toLowerCase();
    const matchesText = 
      sale.invoiceNumber.toLowerCase().includes(q) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(q)) ||
      sale.items.some(i => i.productName.toLowerCase().includes(q));

    if (!matchesText) return false;

    // 2. Category filter (check if sale contains product of selected category)
    if (selectedCategory !== 'ALL') {
      const containsCat = sale.items.some(item => {
        const prod = appState.products.find(p => p.id === item.productId);
        return prod && prod.category === selectedCategory;
      });
      if (!containsCat) return false;
    }

    // 3. Payment Method
    if (paymentMethodFilter !== 'ALL' && sale.paymentMethod !== paymentMethodFilter) return false;

    // 4. Date Range
    if (dateRange !== 'ALL') {
      const saleDate = new Date(sale.date);
      const now = new Date();

      if (dateRange === 'today') {
        if (saleDate.toISOString().slice(0, 10) !== now.toISOString().slice(0, 10)) return false;
      } else if (dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 86400000);
        if (saleDate < weekAgo) return false;
      } else if (dateRange === 'month') {
        if (saleDate.getMonth() !== now.getMonth() || saleDate.getFullYear() !== now.getFullYear()) return false;
      } else if (dateRange === 'custom') {
        if (startDate && saleDate < new Date(startDate)) return false;
        if (endDate && saleDate > new Date(endDate + 'T23:59:59')) return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Buscador Avanzado & Consulta con Filtros</h1>
          <p className="text-xs text-slate-500">Consulte comprobantes de venta, movimientos de cuenta corriente y retiros por rango de fecha o categoría.</p>
        </div>

        <button
          onClick={() => exportSalesExcel(filteredSales)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar Resultados Excel</span>
        </button>
      </div>

      {/* Multi-Filter Card */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
          <Filter className="w-4 h-4" />
          <span>Filtros de Búsqueda Combinables</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Text Input */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Palabra Clave / Cliente / N°</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Nombre, producto, comprobante..."
                value={textSearch}
                onChange={e => setTextSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Filtrar por Categoría</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 border rounded bg-slate-50 font-medium"
            >
              <option value="ALL">Todas las Categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Medio de Pago</label>
            <select
              value={paymentMethodFilter}
              onChange={e => setPaymentMethodFilter(e.target.value)}
              className="w-full px-3 py-1.5 border rounded bg-slate-50 font-medium"
            >
              <option value="ALL">Todos los Medios</option>
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
              <option value="cheque">Cheque</option>
              <option value="current_account">Cuenta Corriente</option>
            </select>
          </div>

          {/* Date Range Preset */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Rango de Fecha</label>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as any)}
              className="w-full px-3 py-1.5 border rounded bg-slate-50 font-medium"
            >
              <option value="ALL">Histórico Completo</option>
              <option value="today">Ventas de Hoy</option>
              <option value="week">Últimos 7 Días</option>
              <option value="month">Este Mes</option>
              <option value="custom">Rango Personalizado</option>
            </select>
          </div>
        </div>

        {/* Custom Date Inputs if custom selected */}
        {dateRange === 'custom' && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t text-xs max-w-md">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Desde Fecha</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 border rounded bg-slate-50"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Hasta Fecha</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 border rounded bg-slate-50"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-xs flex justify-between items-center">
          <span>Resultados de la Búsqueda ({filteredSales.length} comprobantes encontrados)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Comprobante</th>
                <th className="px-4 py-3">Fecha y Hora</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Forma de Pago</th>
                <th className="px-4 py-3">Detalle Ítems</th>
                <th className="px-4 py-3 text-right">Monto Total</th>
                <th className="px-4 py-3 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No se encontraron registros que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => {
                  const isAnnulled = sale.status === 'annulled';
                  const handleAnnulSaleFromHistory = async () => {
                    if (window.confirm(`¿Está seguro de anular la venta ${sale.invoiceNumber} ($${sale.totalAmount.toLocaleString('es-AR')})?\n\nEsta acción devolverá los productos al stock y revertirá los saldos/caja.`)) {
                      const res = await DataService.annulSale(sale.id);
                      if (res.success) {
                        alert(`Venta ${sale.invoiceNumber} anulada con éxito.`);
                      } else {
                        alert(res.error || 'Error al anular la venta.');
                      }
                    }
                  };

                  return (
                    <tr key={sale.id} className={`hover:bg-slate-50 transition-colors ${isAnnulled ? 'opacity-60 bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3 font-bold font-mono text-slate-900">
                        {sale.invoiceNumber}
                        {isAnnulled && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-red-100 text-red-700 border border-red-300">
                            ANULADA
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{new Date(sale.date).toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{sale.customerName || 'Consumidor Final'}</td>
                      <td className="px-4 py-3 capitalize text-slate-600">
                        {sale.paymentMethod === 'current_account' ? 'Cuenta Corriente' : sale.paymentMethod}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                        {sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                      </td>
                      <td className={`px-4 py-3 text-right font-extrabold ${isAnnulled ? 'line-through text-red-500' : 'text-slate-900'}`}>
                        ${sale.totalAmount.toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => generateSaleInvoicePDF(sale, appState.storeInfo)}
                            className="p-1.5 rounded text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Descargar Factura Oficial AFIP (PDF A4)"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => generateThermalTicketPDF(sale, appState.storeInfo)}
                            className="p-1.5 rounded text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Imprimir Ticket Térmico de Caja (80mm)"
                          >
                            <ShoppingCart className="w-4 h-4 text-emerald-600" />
                          </button>
                          {!isAnnulled && (
                            <button
                              onClick={handleAnnulSaleFromHistory}
                              className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                              title="Anular Venta / Nota de Crédito (Devuelve Stock y Revierte Saldos)"
                            >
                              <RotateCcw className="w-4 h-4" />
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
      </div>
    </div>
  );
};
