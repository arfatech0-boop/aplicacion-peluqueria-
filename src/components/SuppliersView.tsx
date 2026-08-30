import React, { useState } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Users, 
  Building2, 
  CheckCircle, 
  Percent, 
  Calculator, 
  History, 
  AlertCircle,
  Edit,
  Phone,
  Mail,
  X
} from 'lucide-react';
import { AppState, Supplier, GlobalPriceIncreaseLog } from '../types';
import { DataService } from '../services/dataService';

interface SuppliersViewProps {
  appState: AppState;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({ appState }) => {
  const [activeSubTab, setActiveSubTab] = useState<'increase_tool' | 'suppliers_list' | 'increase_history'>('increase_tool');

  // Global Price Increase Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [increasePercentage, setIncreasePercentage] = useState<number>(10);
  const [applyToCost, setApplyToCost] = useState(true);
  const [applyToSale, setApplyToSale] = useState(true);
  const [recalculateMargin, setRecalculateMargin] = useState(true);

  // Simulation preview state
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Supplier modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);

  const categories = Array.from(new Set(appState.products.map(p => p.category)));

  // Affected products preview calculation
  const getAffectedProductsPreview = () => {
    const factor = 1 + (increasePercentage || 0) / 100;
    return appState.products
      .filter(p => {
        let match = true;
        if (selectedSupplierId !== 'ALL' && p.supplierId !== selectedSupplierId) match = false;
        if (selectedCategoryFilter !== 'ALL' && p.category !== selectedCategoryFilter) match = false;
        return match;
      })
      .map(p => {
        let newCost = p.costPrice;
        let newSale = p.salePrice;

        if (applyToCost) newCost = Math.round(p.costPrice * factor);

        if (applyToSale) {
          if (recalculateMargin && applyToCost) {
            const marginRatio = p.salePrice / (p.costPrice || 1);
            newSale = Math.round(newCost * marginRatio);
          } else {
            newSale = Math.round(p.salePrice * factor);
          }
        }

        return {
          id: p.id,
          code: p.code,
          name: p.name,
          category: p.category,
          currentCost: p.costPrice,
          newCost,
          currentSale: p.salePrice,
          newSale
        };
      });
  };

  const previewItems = getAffectedProductsPreview();

  const handleApplyGlobalIncrease = async () => {
    if (!increasePercentage || increasePercentage <= 0) {
      alert('Por favor ingrese un porcentaje de aumento válido.');
      return;
    }

    if (previewItems.length === 0) {
      alert('No hay productos que coincidan con el proveedor y categoría seleccionados.');
      return;
    }

    const res = await DataService.applyGlobalPriceIncrease({
      supplierId: selectedSupplierId,
      categoryFilter: selectedCategoryFilter,
      percentage: increasePercentage,
      applyToCost,
      applyToSale,
      recalculateMargin
    });

    setIsPreviewModalOpen(false);
    alert(`¡Aumento aplicado con éxito a ${res.affectedCount} productos!`);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier?.name) return;

    const supToSave: Supplier = {
      id: editingSupplier.id || `sup-${Date.now()}`,
      name: editingSupplier.name,
      cuit: editingSupplier.cuit || '',
      phone: editingSupplier.phone || '',
      email: editingSupplier.email || '',
      contact: editingSupplier.contact || '',
      notes: editingSupplier.notes || ''
    };

    await DataService.saveSupplier(supToSave);
    setIsSupplierModalOpen(false);
    setEditingSupplier(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Proveedores y Aumento Global de Precios</h1>
          <p className="text-xs text-slate-500">Actualice masivamente precios por proveedor o lista de productos con un solo clic.</p>
        </div>

        <button
          onClick={() => {
            setEditingSupplier({ name: '', cuit: '', phone: '', email: '', contact: '' });
            setIsSupplierModalOpen(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Proveedor</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('increase_tool')}
          className={`pb-2.5 px-3 flex items-center space-x-2 transition-colors border-b-2 ${
            activeSubTab === 'increase_tool' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Herramienta de Aumento Global %</span>
        </button>
        <button
          onClick={() => setActiveSubTab('suppliers_list')}
          className={`pb-2.5 px-3 flex items-center space-x-2 transition-colors border-b-2 ${
            activeSubTab === 'suppliers_list' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Directorio de Proveedores ({appState.suppliers.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('increase_history')}
          className={`pb-2.5 px-3 flex items-center space-x-2 transition-colors border-b-2 ${
            activeSubTab === 'increase_history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historial de Aumentos ({appState.priceIncreaseLogs.length})</span>
        </button>
      </div>

      {activeSubTab === 'increase_tool' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Card (5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-indigo-700 font-bold border-b pb-3 text-sm">
              <Calculator className="w-5 h-5" />
              <span>Configuración del Aumento Porcentual</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Seleccionar Proveedor</label>
                <select
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Todos los Proveedores</option>
                  {appState.suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Filtrar por Categoría (Opcional)</label>
                <select
                  value={selectedCategoryFilter}
                  onChange={e => setSelectedCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Todas las Categorías</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Porcentaje de Aumento (%) *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={increasePercentage || ''}
                    onChange={e => setIncreasePercentage(Number(e.target.value))}
                    className="w-full pl-3 pr-8 py-2 border rounded-lg bg-slate-50 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej. 15"
                  />
                  <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">Opciones de Impacto</span>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyToCost}
                    onChange={e => setApplyToCost(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700">Actualizar Precio de Costo</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyToSale}
                    onChange={e => setApplyToSale(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700">Actualizar Precio de Venta Público</span>
                </label>

                {applyToCost && applyToSale && (
                  <label className="flex items-center space-x-2 cursor-pointer pl-4 pt-1 border-t border-slate-200">
                    <input
                      type="checkbox"
                      checked={recalculateMargin}
                      onChange={e => setRecalculateMargin(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-600 text-[11px]">Mantener el % de margen de ganancia original</span>
                  </label>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsPreviewModalOpen(true)}
                disabled={previewItems.length === 0}
                className={`w-full py-3 rounded-lg font-bold text-sm shadow flex items-center justify-center space-x-2 transition-all ${
                  previewItems.length > 0
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Simular y Revisar ({previewItems.length} productos)</span>
              </button>
            </div>
          </div>

          {/* Impact Summary & Live Preview Table (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-xl p-5 shadow-sm space-y-2">
              <h3 className="font-bold text-base">Resumen del Aumento Proyectado</h3>
              <p className="text-xs text-slate-300">
                Se ajustarán los precios de <span className="font-extrabold text-indigo-300">{previewItems.length} productos</span> un <span className="font-extrabold text-emerald-400">+{increasePercentage}%</span>.
              </p>
            </div>

            {/* Live comparison table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-xs">
                Vista Previa de Precios Afectados
              </div>

              <div className="max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-500 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="px-4 py-2">Producto</th>
                      <th className="px-4 py-2 text-right">Costo Actual &rarr; Nuevo</th>
                      <th className="px-4 py-2 text-right">Venta Actual &rarr; Nuevo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewItems.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-6 text-slate-400">
                          Sin productos para la selección actual.
                        </td>
                      </tr>
                    ) : (
                      previewItems.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5">
                            <span className="font-bold text-slate-900 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400">{item.category}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono">
                            <span className="text-slate-500">${item.currentCost.toLocaleString('es-AR')}</span>
                            <span className="text-slate-400 font-normal mx-1">&rarr;</span>
                            <span className="font-bold text-slate-900">${item.newCost.toLocaleString('es-AR')}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono">
                            <span className="text-slate-500">${item.currentSale.toLocaleString('es-AR')}</span>
                            <span className="text-slate-400 font-normal mx-1">&rarr;</span>
                            <span className="font-extrabold text-emerald-600">${item.newSale.toLocaleString('es-AR')}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suppliers Directory List */}
      {activeSubTab === 'suppliers_list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appState.suppliers.map(supplier => {
            const productCount = appState.products.filter(p => p.supplierId === supplier.id).length;

            return (
              <div key={supplier.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-slate-900 text-base">{supplier.name}</h3>
                    <button
                      onClick={() => {
                        setEditingSupplier(supplier);
                        setIsSupplierModalOpen(true);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">CUIT: {supplier.cuit || 'Sin registrar'}</span>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{supplier.phone || '-'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{supplier.email || '-'}</span>
                    </div>
                    {supplier.contact && (
                      <p className="text-[11px] text-slate-500 italic pt-1">Contacto: {supplier.contact}</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{productCount} productos provistos</span>
                  <button
                    onClick={() => {
                      setSelectedSupplierId(supplier.id);
                      setActiveSubTab('increase_tool');
                    }}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Aumentar Precios %
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Increase History */}
      {activeSubTab === 'increase_history' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3 text-center">Aumento %</th>
                <th className="px-4 py-3 text-center">Productos Afectados</th>
                <th className="px-4 py-3">Detalle Configuración</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appState.priceIncreaseLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{new Date(log.date).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{log.supplierName}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                      +{log.percentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-800">{log.affectedProductsCount}</td>
                  <td className="px-4 py-3 text-slate-600">
                    Costo: {log.applyToCost ? 'Sí' : 'No'} | Venta: {log.applyToSale ? 'Sí' : 'No'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Confirmar Aumento Global de Precios</h3>
              <button onClick={() => setIsPreviewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Está a punto de aplicar un incremento de <span className="font-bold text-emerald-600">+{increasePercentage}%</span> a <span className="font-bold text-slate-900">{previewItems.length} productos</span>.
            </p>

            <div className="max-h-60 overflow-y-auto border rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="p-2">Producto</th>
                    <th className="p-2 text-right">Precio Costo Nuevo</th>
                    <th className="p-2 text-right">Precio Venta Nuevo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewItems.slice(0, 15).map(i => (
                    <tr key={i.id}>
                      <td className="p-2 font-medium text-slate-800">{i.name}</td>
                      <td className="p-2 text-right text-slate-600">${i.newCost.toLocaleString('es-AR')}</td>
                      <td className="p-2 text-right font-bold text-emerald-600">${i.newSale.toLocaleString('es-AR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewItems.length > 15 && (
                <div className="p-2 text-center text-slate-400 text-[11px] bg-slate-50">
                  ...y {previewItems.length - 15} productos más.
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-3">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyGlobalIncrease}
                className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
              >
                ¡Aplicar Aumento Ahora!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {isSupplierModalOpen && editingSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-base">Registrar / Editar Proveedor</h3>

            <form onSubmit={handleSaveSupplier} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre Proveedor *</label>
                <input
                  type="text"
                  required
                  value={editingSupplier.name || ''}
                  onChange={e => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">CUIT</label>
                  <input
                    type="text"
                    value={editingSupplier.cuit || ''}
                    onChange={e => setEditingSupplier({ ...editingSupplier, cuit: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={editingSupplier.phone || ''}
                    onChange={e => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={editingSupplier.email || ''}
                  onChange={e => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded bg-slate-50"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre de Contacto</label>
                <input
                  type="text"
                  value={editingSupplier.contact || ''}
                  onChange={e => setEditingSupplier({ ...editingSupplier, contact: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded bg-slate-50"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
