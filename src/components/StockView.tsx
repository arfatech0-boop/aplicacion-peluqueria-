import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  FileSpreadsheet, 
  FileText, 
  Edit, 
  Trash2, 
  ArrowDownRight, 
  ArrowUpRight,
  History,
  X,
  Check,
  Barcode,
  RefreshCw,
  Printer,
  Tag
} from 'lucide-react';
import { AppState, Product, ProductUnit } from '../types';
import { DataService } from '../services/dataService';
import { exportProductsExcel } from '../utils/excelExporter';
import { BarcodeLabelModal } from './BarcodeLabelModal';
import { BarcodeRenderer } from './BarcodeRenderer';
import { getCatalogForRubro } from '../data/rubroCatalogs';

interface StockViewProps {
  appState: AppState;
}

export const StockView: React.FC<StockViewProps> = ({ appState }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodeModalProduct, setBarcodeModalProduct] = useState<Product | null>(null);

  const [isStockAdjustModalOpen, setIsStockAdjustModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'adjust'>('in');
  const [adjustReason, setAdjustReason] = useState('');

  const categories = Array.from(
    new Set(appState.products.map(p => p.category).filter(Boolean))
  );
  const supplierMap = new Map(appState.suppliers.map(s => [s.id, s.name]));

  // Filter products
  const filteredProducts = appState.products.filter(p => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesLowStock = !onlyLowStock || p.stock <= p.minStock;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(q) || 
      p.code.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.size && p.size.toLowerCase().includes(q)) ||
      (p.color && p.color.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q));
    return matchesCategory && matchesLowStock && matchesSearch;
  });

  const handleOpenNewProduct = () => {
    setEditingProduct({
      id: `prod-${Date.now()}`,
      code: `779${Math.floor(100000000 + Math.random() * 900000000)}`,
      name: '',
      category: categories[0] || 'Indumentaria',
      supplierId: appState.suppliers[0]?.id || '',
      costPrice: 0,
      salePrice: 0,
      stock: 0,
      minStock: 5,
      unit: 'un',
      size: '',
      color: '',
      brand: '',
      description: '',
      updatedAt: new Date().toISOString()
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.code) {
      alert('El nombre y el código de producto son obligatorios.');
      return;
    }

    const prodToSave: Product = {
      id: editingProduct.id || `prod-${Date.now()}`,
      code: editingProduct.code,
      name: editingProduct.name,
      category: editingProduct.category || 'General',
      supplierId: editingProduct.supplierId || '',
      costPrice: Number(editingProduct.costPrice) || 0,
      salePrice: Number(editingProduct.salePrice) || 0,
      stock: Number(editingProduct.stock) || 0,
      minStock: Number(editingProduct.minStock) || 0,
      unit: (editingProduct.unit as ProductUnit) || 'un',
      size: editingProduct.size || '',
      color: editingProduct.color || '',
      brand: editingProduct.brand || '',
      description: editingProduct.description || '',
      updatedAt: new Date().toISOString()
    };

    await DataService.saveProduct(prodToSave);
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`¿Desea eliminar el producto "${name}"?`)) {
      await DataService.deleteProduct(id);
    }
  };

  const handleSaveStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || adjustQuantity <= 0) return;

    let newStock = adjustingProduct.stock;
    if (adjustType === 'in') newStock += adjustQuantity;
    else if (adjustType === 'out') newStock = Math.max(0, newStock - adjustQuantity);
    else if (adjustType === 'adjust') newStock = adjustQuantity;

    const updated: Product = {
      ...adjustingProduct,
      stock: newStock,
      updatedAt: new Date().toISOString()
    };

    await DataService.saveProduct(updated);

    // Also record movement in appState
    appState.stockMovements.unshift({
      id: `sm-${Date.now()}`,
      productId: adjustingProduct.id,
      productName: adjustingProduct.name,
      type: adjustType,
      quantity: adjustQuantity,
      previousStock: adjustingProduct.stock,
      newStock,
      date: new Date().toISOString(),
      reason: adjustReason || (adjustType === 'in' ? 'Ingreso de compra' : 'Ajuste manual')
    });

    setIsStockAdjustModalOpen(false);
    setAdjustingProduct(null);
    setAdjustReason('');
    setAdjustQuantity(0);
  };

  const handleLoadRubroCatalog = async () => {
    const rubroName = appState.storeInfo.businessType || 'Indumentaria / Calzado';
    if (window.confirm(`¿Desea cargar el catálogo de productos de ejemplo para el rubro "${rubroName}"?\n\nEsto reemplazará la lista actual con productos característicos de ${rubroName} (talles, colores, categorías y marcas).`)) {
      const catalog = getCatalogForRubro(rubroName);
      await DataService.replaceProducts(catalog);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Control de Stock e Inventario</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
              {appState.storeInfo.businessType || 'Comercio General'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Gestione catálogo, alertas de bajo stock y movimientos de mercadería.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadRubroCatalog}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs transition-colors"
            title={`Cargar catálogo de ejemplo para ${appState.storeInfo.businessType || 'el rubro seleccionado'}`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cargar Catálogo ({appState.storeInfo.businessType?.split('/')[0] || 'Rubro'})</span>
          </button>
          <button
            onClick={() => {
              setBarcodeModalProduct(appState.products[0] || null);
              setIsBarcodeModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs shadow transition-colors"
            title="Generar e imprimir etiquetas adhesivas con código de barras"
          >
            <Barcode className="w-4 h-4 text-indigo-400" />
            <span>Imprimir Barcode</span>
          </button>
          <button
            onClick={() => exportProductsExcel(appState.products, appState.suppliers)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={handleOpenNewProduct}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Tabs (Inventario | Historial de Movimientos) */}
      <div className="flex items-center space-x-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-2.5 px-3 transition-colors border-b-2 ${
            activeTab === 'inventory' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Catálogo & Stock ({appState.products.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 px-3 transition-colors border-b-2 ${
            activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Historial Movimientos ({appState.stockMovements.length})
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <div className="space-y-4">
          {/* Search & Filter Controls */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por código SKU, nombre de producto o categoría..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              {/* Filter Category */}
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Todas las Categorías</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Toggle Low Stock */}
              <button
                onClick={() => setOnlyLowStock(!onlyLowStock)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                  onlyLowStock
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Solo Bajo Stock</span>
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Código/SKU</th>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Proveedor</th>
                    <th className="px-4 py-3 text-right">Costo ($)</th>
                    <th className="px-4 py-3 text-right">Venta ($)</th>
                    <th className="px-4 py-3 text-center">Margen</th>
                    <th className="px-4 py-3 text-center">Stock</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400">
                        No se encontraron productos coincidentes.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(prod => {
                      const isLow = prod.stock <= prod.minStock;
                      const marginPct = prod.costPrice > 0
                        ? (((prod.salePrice - prod.costPrice) / prod.costPrice) * 100).toFixed(1)
                        : '0.0';

                      return (
                        <tr key={prod.id} className={`hover:bg-slate-50 transition-colors ${isLow ? 'bg-amber-50/40' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-1.5">
                              <Barcode className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-mono font-bold text-slate-700">{prod.code}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-1.5 flex-wrap">
                              <span className="font-bold text-slate-900">{prod.name}</span>
                              {prod.brand && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-800 text-white">
                                  {prod.brand}
                                </span>
                              )}
                            </div>
                            {(prod.size || prod.color) && (
                              <div className="flex items-center space-x-1 mt-1 flex-wrap gap-y-1">
                                {prod.size && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    Talle: {prod.size}
                                  </span>
                                )}
                                {prod.color && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                    Color: {prod.color}
                                  </span>
                                )}
                              </div>
                            )}
                            {prod.description && <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{prod.description}</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {prod.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{supplierMap.get(prod.supplierId) || '-'}</td>
                          <td className="px-4 py-3 text-right text-slate-600">${prod.costPrice.toLocaleString('es-AR')}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">${prod.salePrice.toLocaleString('es-AR')}</td>
                          <td className="px-4 py-3 text-center font-medium text-emerald-600">+{marginPct}%</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-extrabold inline-block min-w-[60px] ${
                              isLow ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {prod.stock} {prod.unit}
                            </span>
                            {isLow && (
                              <span className="block text-[10px] text-amber-600 font-bold mt-0.5">Mín: {prod.minStock}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setBarcodeModalProduct(prod);
                                setIsBarcodeModalOpen(true);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                              title="Imprimir etiqueta con código de barras"
                            >
                              <Barcode className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setAdjustingProduct(prod);
                                setAdjustQuantity(0);
                                setIsStockAdjustModalOpen(true);
                              }}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] transition-colors"
                              title="Ingreso / Ajuste de stock"
                            >
                              Ajustar Stock
                            </button>
                            <button
                              onClick={() => {
                                setEditingProduct(prod);
                                setIsProductModalOpen(true);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                              title="Editar producto"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
      ) : (
        /* Movement History Table */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Tipo Movimiento</th>
                <th className="px-4 py-3 text-center">Cantidad</th>
                <th className="px-4 py-3 text-center">Stock Ant. &rarr; Nuevo</th>
                <th className="px-4 py-3">Motivo / Referencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appState.stockMovements.map(sm => (
                <tr key={sm.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-500">{new Date(sm.date).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{sm.productName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      sm.type === 'in' ? 'bg-emerald-100 text-emerald-800' :
                      sm.type === 'sale' ? 'bg-indigo-100 text-indigo-800' :
                      sm.type === 'withdrawal' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {sm.type === 'in' ? 'Entrada' : sm.type === 'out' ? 'Salida' : sm.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold">{sm.quantity}</td>
                  <td className="px-4 py-3 text-center text-slate-600">
                    {sm.previousStock} &rarr; <span className="font-bold text-slate-900">{sm.newStock}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{sm.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Create/Edit Modal */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingProduct.name ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 block">Código / Barcode *</label>
                    <button
                      type="button"
                      onClick={() => {
                        const randomCode = `779${Math.floor(100000000 + Math.random() * 900000000)}`;
                        setEditingProduct({ ...editingProduct, code: randomCode });
                      }}
                      className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center space-x-1"
                      title="Generar código de barras aleatorio EAN-13"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Auto Gen</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={editingProduct.code || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, code: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded bg-slate-50 text-xs font-mono font-bold focus:ring-1 focus:ring-indigo-500"
                    placeholder="Escanear o ingresar código..."
                  />
                  {editingProduct.code && (
                    <div className="mt-1.5 p-1 bg-slate-50 border rounded flex flex-col items-center justify-center">
                      <BarcodeRenderer value={editingProduct.code} width={1.2} height={26} fontSize={10} margin={2} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Categoría</label>
                  <input
                    type="text"
                    required
                    list="category-options"
                    value={editingProduct.category || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded bg-slate-50 text-xs focus:ring-1 focus:ring-indigo-500"
                    placeholder="Ej. Almacén, Ferretería, etc."
                  />
                  <datalist id="category-options">
                    {Array.from(new Set([
                      ...(appState.storeInfo.customCategories || []),
                      ...categories
                    ])).map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded bg-slate-50 text-xs focus:ring-1 focus:ring-indigo-500 font-medium"
                  placeholder="Ej. Remera Algodón, Jean Slim Fit, Cemento 50kg, etc."
                />
              </div>

              {/* Adaptable Variants Section according to Business Rubro */}
              {(() => {
                const bType = (appState.storeInfo.businessType || '').toLowerCase();
                const isClothing = bType.includes('indumentaria') || bType.includes('ropa') || bType.includes('calzado');

                return (
                  <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-indigo-900 flex items-center space-x-1">
                        <Tag className="w-3.5 h-3.5 text-indigo-600" />
                        <span>
                          {isClothing ? 'Talle, Color & Marca (Indumentaria)' : 'Marca & Presentación (Opcional)'}
                        </span>
                      </span>
                      <span className="text-[10px] text-indigo-600 font-semibold">
                        {isClothing ? 'Opcional para prendas o calzado' : 'Opcional para especificar presentación'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Size / Presentación */}
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          {isClothing ? 'Talle / Medida' : 'Presentación / Medida'}
                        </label>
                        <input
                          type="text"
                          value={editingProduct.size || ''}
                          onChange={e => setEditingProduct({ ...editingProduct, size: e.target.value })}
                          className="w-full px-2.5 py-1.5 border rounded bg-white text-xs font-bold focus:ring-1 focus:ring-indigo-500"
                          placeholder={isClothing ? 'Ej. M, L, XL, 42...' : 'Ej. 1.5 Litros, 500g, 50kg...'}
                        />
                        {/* Quick Talle Chips only for clothing */}
                        {isClothing && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '40', '42', '44'].map(talle => (
                              <button
                                key={talle}
                                type="button"
                                onClick={() => setEditingProduct({ ...editingProduct, size: talle })}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                                  editingProduct.size === talle
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-indigo-100'
                                }`}
                              >
                                {talle}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Color / Variante / Sabor */}
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          {isClothing ? 'Color / Variante' : 'Variante / Sabor / Color'}
                        </label>
                        <input
                          type="text"
                          value={editingProduct.color || ''}
                          onChange={e => setEditingProduct({ ...editingProduct, color: e.target.value })}
                          className="w-full px-2.5 py-1.5 border rounded bg-white text-xs font-bold focus:ring-1 focus:ring-indigo-500"
                          placeholder={isClothing ? 'Ej. Negro, Blanco, Azul...' : 'Ej. Descremada, Sin Azúcar, Original...'}
                        />
                        {/* Quick Color Chips only for clothing */}
                        {isClothing && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {['Negro', 'Blanco', 'Azul', 'Rojo', 'Verde', 'Gris'].map(col => (
                              <button
                                key={col}
                                type="button"
                                onClick={() => setEditingProduct({ ...editingProduct, color: col })}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                                  editingProduct.color === col
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                {col}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Brand / Marca */}
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Marca / Fabricante</label>
                        <input
                          type="text"
                          value={editingProduct.brand || ''}
                          onChange={e => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                          className="w-full px-2.5 py-1.5 border rounded bg-white text-xs font-bold focus:ring-1 focus:ring-indigo-500"
                          placeholder={isClothing ? "Ej. Nike, Levi's..." : "Ej. La Serenísima, Coca-Cola, Arcor..."}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Proveedor</label>
                  <select
                    value={editingProduct.supplierId || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, supplierId: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded bg-slate-50 text-xs focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Seleccionar Proveedor</option>
                    {appState.suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Unidad de Medida</label>
                  <select
                    value={editingProduct.unit || 'un'}
                    onChange={e => setEditingProduct({ ...editingProduct, unit: e.target.value as ProductUnit })}
                    className="w-full px-3 py-1.5 border rounded bg-slate-50 text-xs focus:ring-1 focus:ring-indigo-500 font-bold text-indigo-900"
                  >
                    {(() => {
                      const b = (appState.storeInfo.businessType || '').toLowerCase();
                      if (b.includes('carniceria') || b.includes('carnicería') || b.includes('fiambre') || b.includes('granja')) {
                        return (
                          <>
                            <optgroup label="⭐ RECOMENDADAS PARA CARNICERÍA / FIAMBRERÍA">
                              <option value="kg">Kilogramos (kg)</option>
                              <option value="gr">Gramos (gr)</option>
                              <option value="horma">Horma (queso / fiambre)</option>
                              <option value="un">Unidad (un)</option>
                            </optgroup>
                            <optgroup label="OTRAS UNIDADES">
                              <option value="caja">Caja</option>
                              <option value="pack">Pack / Paquete</option>
                              <option value="lt">Litros (lt)</option>
                              <option value="docena">Docena (12 un)</option>
                            </optgroup>
                          </>
                        );
                      }
                      if (b.includes('verduleria') || b.includes('verdulería') || b.includes('fruta')) {
                        return (
                          <>
                            <optgroup label="⭐ RECOMENDADAS PARA VERDULERÍA">
                              <option value="kg">Kilogramos (kg)</option>
                              <option value="atado">Atado (verduras)</option>
                              <option value="cajón">Cajón</option>
                              <option value="gr">Gramos (gr)</option>
                              <option value="un">Unidad (un)</option>
                            </optgroup>
                            <optgroup label="OTRAS UNIDADES">
                              <option value="caja">Caja</option>
                              <option value="pack">Pack / Paquete</option>
                            </optgroup>
                          </>
                        );
                      }
                      if (b.includes('gastronomia') || b.includes('panaderia') || b.includes('panadería')) {
                        return (
                          <>
                            <optgroup label="⭐ RECOMENDADAS PARA PANADERÍA / GASTRONOMÍA">
                              <option value="docena">Docena (12 un)</option>
                              <option value="kg">Kilogramos (kg)</option>
                              <option value="un">Unidad (un)</option>
                            </optgroup>
                            <optgroup label="OTRAS UNIDADES">
                              <option value="caja">Caja</option>
                              <option value="pack">Pack / Paquete</option>
                              <option value="lt">Litros (lt)</option>
                            </optgroup>
                          </>
                        );
                      }
                      return (
                        <>
                          <option value="un">Unidad (un)</option>
                          <option value="kg">Kilogramos (kg)</option>
                          <option value="gr">Gramos (gr)</option>
                          <option value="horma">Horma</option>
                          <option value="atado">Atado</option>
                          <option value="cajón">Cajón</option>
                          <option value="lt">Litros (lt)</option>
                          <option value="mt">Metros (mt)</option>
                          <option value="m2">Metros Cuadrados (m²)</option>
                          <option value="caja">Caja</option>
                          <option value="pack">Pack / Paquete</option>
                          <option value="docena">Docena (12 un)</option>
                          <option value="hs">Horas (hs)</option>
                          <option value="serv">Servicio</option>
                          <option value="juego">Juego / Set</option>
                        </>
                      );
                    })()}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Precio de Costo ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editingProduct.costPrice || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, costPrice: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border rounded bg-white text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Precio de Venta ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editingProduct.salePrice || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, salePrice: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border rounded bg-white text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Stock Actual</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.stock ?? 0}
                    onChange={e => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border rounded bg-slate-50 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Stock Mínimo Alerta</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.minStock ?? 5}
                    onChange={e => setEditingProduct({ ...editingProduct, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border rounded bg-slate-50 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Stock Adjust Modal */}
      {isStockAdjustModalOpen && adjustingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-base">Ajuste Manual de Stock</h3>
            <p className="text-slate-600 font-semibold">{adjustingProduct.name}</p>

            <form onSubmit={handleSaveStockAdjust} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tipo de Ajuste</label>
                <select
                  value={adjustType}
                  onChange={e => setAdjustType(e.target.value as any)}
                  className="w-full px-3 py-1.5 border rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="in">Entrada (+ Ingreso de stock)</option>
                  <option value="out">Salida (- Egreso / Rotura)</option>
                  <option value="adjust">Establecer Stock Exacto</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQuantity || ''}
                  onChange={e => setAdjustQuantity(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Motivo / Observación</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Ej. Ingreso según Remito N°445"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsStockAdjustModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Label Modal */}
      <BarcodeLabelModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        products={appState.products}
        selectedProduct={barcodeModalProduct}
        storeInfo={appState.storeInfo}
      />
    </div>
  );
};
