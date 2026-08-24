import React, { useState } from 'react';
import { 
  Store, 
  X, 
  Save, 
  Building2, 
  Plus, 
  Trash2, 
  RotateCcw,
  CheckCircle2,
  Receipt,
  Tag,
  Briefcase,
  PackageCheck
} from 'lucide-react';
import { StoreInfo, BusinessRubro, TaxCondition, InvoiceType } from '../types';
import { DataService } from '../services/dataService';
import { getCatalogForRubro } from '../data/rubroCatalogs';

interface StoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeInfo: StoreInfo;
}

interface PresetRubro {
  id: BusinessRubro;
  name: string;
  description: string;
  icon: string;
  categories: string[];
}

const RUBRO_PRESETS: PresetRubro[] = [
  {
    id: 'Carnicería / Fiambrería & Granja',
    name: 'Carnicería, Fiambrería & Granja',
    description: 'Venta de cortes vacunos, cerdo, pollo, achuras, fiambres feteados y quesos por Kg',
    icon: '🍖',
    categories: ['Cortes Vacunos', 'Carnes de Cerdo', 'Aves & Granja', 'Fiambres & Fiambrería', 'Quesos x Kg', 'Embutidos & Achuras', 'Preparados & Milanesas']
  },
  {
    id: 'Verdulería / Frutería',
    name: 'Verdulería & Frutería',
    description: 'Venta de hortalizas, verduras de hoja, frutas de estación por Kg, atado o cajón',
    icon: '🥬',
    categories: ['Verduras de Hoja', 'Hortalizas & Tubérculos', 'Frutas de Estación', 'Cítricos', 'Frutos Secos & Semillas', 'Ofertas x Bolsa/Cajón']
  },
  {
    id: 'Supermercado / Almacén',
    name: 'Supermercado / Almacén',
    description: 'Venta de alimentos, fiambre, bebidas, frescos y limpieza',
    icon: '🛒',
    categories: ['Almacén', 'Bebidas & Gaseosas', 'Lácteos & Quesos', 'Fiambres & Embutidos', 'Frescos & Frutas', 'Limpieza & Hogar', 'Golosinas', 'Perfumería']
  },
  {
    id: 'Kiosco / Drugstore',
    name: 'Kiosco & Drugstore 24hs',
    description: 'Golosinas, cigarrillos, bebidas frías, galletitas, snacks y cargas',
    icon: '🍫',
    categories: ['Golosinas & Chocolates', 'Cigarrillos & Tabaco', 'Bebidas & Energizantes', 'Galletitas & Snacks', 'Artículos de Kiosco', 'Cargas']
  },
  {
    id: 'Farmacia / Perfumería',
    name: 'Farmacia & Perfumería',
    description: 'Medicamentos venta libre, dermocosmética, perfumes y cuidado personal',
    icon: '💊',
    categories: ['Medicamentos Venta Libre', 'Perfumería & Fragancias', 'Dermocosmética', 'Cuidado Personal', 'Bebés & Maternidad', 'Higiene & Cuidado']
  },
  {
    id: 'Ferretería / Corralón',
    name: 'Ferretería / Corralón',
    description: 'Materiales de construcción, pintura, electricidad y sanitarios',
    icon: '🛠️',
    categories: ['Ferretería General', 'Pinturería & Revestimientos', 'Materiales de Construcción', 'Herramientas Eléctricas', 'Electricidad & Iluminación', 'Plomería & Sanitarios', 'Tornillería']
  },
  {
    id: 'Indumentaria / Calzado',
    name: 'Indumentaria & Calzado',
    description: 'Locales de ropa, calzado, marroquinería y accesorios de moda',
    icon: '👕',
    categories: ['Remeras & Tops', 'Pantalones & Jeans', 'Calzado & Zapatillas', 'Buzos & Abrigos', 'Accesorios & Bolsos', 'Ropa Interior', 'Deportivo']
  },
  {
    id: 'Electrónica / Computación',
    name: 'Electrónica & Informática',
    description: 'Venta de gadgets, celulares, notebooks y repuestos técnicos',
    icon: '💻',
    categories: ['Celulares & Tablets', 'Laptops & Computadoras', 'Periféricos & Teclados', 'Audio & Auriculares', 'Cables & Cargadores', 'Soporte & Reparaciones', 'Juegos']
  },
  {
    id: 'Gastronomía / Panadería',
    name: 'Gastronomía & Panadería',
    description: 'Panaderías, confiterías, rotiserías, cafeterías y delivery',
    icon: '🥖',
    categories: ['Panificados & Harinas', 'Facturas & Dulces', 'Repostería & Tortas', 'Cafetería & Infusiones', 'Bebidas Frías', 'Platos Elaborados', 'Catering']
  },
  {
    id: 'Autopartes / Repuestos',
    name: 'Autopartes & Taller',
    description: 'Repuestos automotrices, aceites, lubricantes y servicios mecánicos',
    icon: '🚗',
    categories: ['Frenos & Embragues', 'Motor & Encendido', 'Suspensión & Dirección', 'Filtros & Aceites', 'Electricidad & Baterías', 'Accesorios Vehículo', 'Mano de Obra']
  },
  {
    id: 'Servicios / Profesional',
    name: 'Servicios & Profesionales',
    description: 'Oficios, consultoría, reparaciones, mantenimiento y abonos',
    icon: '💼',
    categories: ['Consultoría & Asesoría', 'Mantenimiento & Reparaciones', 'Instalaciones', 'Mano de Obra', 'Abonos Mensuales', 'Licencias & Software']
  },
  {
    id: 'Comercio General / Multirrubro',
    name: 'Comercio General',
    description: 'Bazar, multirrubro, regaleria, kiosco o tienda minorista variada',
    icon: '🛍️',
    categories: ['Almacén', 'Bebidas', 'Bazar & Hogar', 'Regalería', 'Electrónica', 'Kiosco', 'Librería', 'Servicios']
  }
];

export const StoreSettingsModal: React.FC<StoreSettingsModalProps> = ({ isOpen, onClose, storeInfo }) => {
  const [formData, setFormData] = useState<StoreInfo>({
    name: storeInfo.name || '',
    cuit: storeInfo.cuit || '',
    taxCondition: storeInfo.taxCondition || 'Responsable Inscripto',
    businessType: storeInfo.businessType || 'Comercio General / Multirrubro',
    address: storeInfo.address || '',
    phone: storeInfo.phone || '',
    email: storeInfo.email || '',
    invoicePrefix: storeInfo.invoicePrefix || '0001',
    currencySymbol: storeInfo.currencySymbol || '$',
    defaultTaxRate: storeInfo.defaultTaxRate ?? 21,
    cashDiscountPercent: storeInfo.cashDiscountPercent ?? 5,
    cardSurchargePercent: storeInfo.cardSurchargePercent ?? 10,
    receiptHeaderMessage: storeInfo.receiptHeaderMessage || '¡Gracias por su compra!',
    customCategories: storeInfo.customCategories?.length ? [...storeInfo.customCategories] : ['General'],
    defaultCounterInvoiceType: storeInfo.defaultCounterInvoiceType || 'FACTURA_B',
    defaultCurrentAccountInvoiceType: storeInfo.defaultCurrentAccountInvoiceType || 'REMITO',
    defaultRespInscriptoInvoiceType: storeInfo.defaultRespInscriptoInvoiceType || 'FACTURA_A',
    afipPointOfSale: storeInfo.afipPointOfSale || storeInfo.invoicePrefix || '0001'
  });

  const [newCatInput, setNewCatInput] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'rubro' | 'categories'>('profile');
  const [isSaved, setIsSaved] = useState(false);
  const [presetNotice, setPresetNotice] = useState<string | null>(null);
  const [shouldReplaceCatalog, setShouldReplaceCatalog] = useState<boolean>(false);
  const [catalogLoadedNotice, setCatalogLoadedNotice] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: storeInfo.name || '',
        cuit: storeInfo.cuit || '',
        taxCondition: storeInfo.taxCondition || 'Responsable Inscripto',
        businessType: storeInfo.businessType || 'Comercio General / Multirrubro',
        address: storeInfo.address || '',
        phone: storeInfo.phone || '',
        email: storeInfo.email || '',
        invoicePrefix: storeInfo.invoicePrefix || '0001',
        currencySymbol: storeInfo.currencySymbol || '$',
        defaultTaxRate: storeInfo.defaultTaxRate ?? 21,
        cashDiscountPercent: storeInfo.cashDiscountPercent ?? 5,
        cardSurchargePercent: storeInfo.cardSurchargePercent ?? 10,
        receiptHeaderMessage: storeInfo.receiptHeaderMessage || '¡Gracias por su compra!',
        customCategories: storeInfo.customCategories?.length ? [...storeInfo.customCategories] : ['General'],
        defaultCounterInvoiceType: storeInfo.defaultCounterInvoiceType || 'FACTURA_B',
        defaultCurrentAccountInvoiceType: storeInfo.defaultCurrentAccountInvoiceType || 'REMITO',
        defaultRespInscriptoInvoiceType: storeInfo.defaultRespInscriptoInvoiceType || 'FACTURA_A',
        afipPointOfSale: storeInfo.afipPointOfSale || storeInfo.invoicePrefix || '0001'
      });
      setPresetNotice(null);
      setCatalogLoadedNotice(null);
      setShouldReplaceCatalog(false);
    }
  }, [isOpen, storeInfo]);

  if (!isOpen) return null;

  const handleApplyRubroPreset = (preset: PresetRubro) => {
    setFormData(prev => ({
      ...prev,
      businessType: preset.id,
      customCategories: [...preset.categories]
    }));
    setShouldReplaceCatalog(true);
    setPresetNotice(`¡Plantilla de "${preset.name}" seleccionada! Se reemplazará el inventario con el catálogo propio de ${preset.name} al guardar.`);
  };

  const handleLoadCatalogNow = async () => {
    const catalog = getCatalogForRubro(formData.businessType);
    await DataService.updateStoreInfo(formData);
    await DataService.replaceProducts(catalog);
    setCatalogLoadedNotice(`¡Catálogo de "${formData.businessType}" reemplazado con éxito (${catalog.length} productos de ejemplo cargados)!`);
    setShouldReplaceCatalog(false);
  };

  const handleAddCategory = () => {
    if (!newCatInput.trim()) return;
    const clean = newCatInput.trim();
    if (!formData.customCategories.includes(clean)) {
      setFormData(prev => ({
        ...prev,
        customCategories: [...prev.customCategories, clean]
      }));
    }
    setNewCatInput('');
  };

  const handleRemoveCategory = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      customCategories: prev.customCategories.filter(c => c !== cat)
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await DataService.updateStoreInfo(formData);

    if (shouldReplaceCatalog) {
      const catalog = getCatalogForRubro(formData.businessType);
      await DataService.replaceProducts(catalog);
    }

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/30 rounded-lg border border-indigo-500/40 text-indigo-400">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg sm:text-xl text-white tracking-tight">
                Estandarización y Configuración del Comercio
              </h2>
              <p className="text-slate-400 text-xs">
                Adapte el sistema a cualquier tipo de negocio (Supermercados, Ferreterías, Indumentaria, Servicios, etc.)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Nav Tabs */}
        <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-100 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'profile'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Building2 className="w-4 h-4 flex-shrink-0 text-indigo-600" />
            <span className="truncate">Datos del Negocio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rubro')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'rubro'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Briefcase className="w-4 h-4 flex-shrink-0 text-indigo-600" />
            <span className="truncate">Rubro & Plantilla</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'categories'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Tag className="w-4 h-4 flex-shrink-0 text-indigo-600" />
            <span className="truncate">Categorías de Productos</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* TAB 1: DATOS DEL NEGOCIO */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nombre Fantasía / Razón Social <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. Ferretería Central / Supermercado El Sol"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    CUIT / CUIT / ID Fiscal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cuit}
                    onChange={e => setFormData({ ...formData, cuit: e.target.value })}
                    placeholder="Ej. 30-71234567-8"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Condición Frente al IVA / Fiscal
                  </label>
                  <select
                    value={formData.taxCondition}
                    onChange={e => setFormData({ ...formData, taxCondition: e.target.value as TaxCondition })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                    <option value="Monotributo">Monotributo</option>
                    <option value="Exento">Exento</option>
                    <option value="Consumidor Final / General">Consumidor Final / General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Punto de Venta / Prefijo de Factura
                  </label>
                  <input
                    type="text"
                    value={formData.invoicePrefix}
                    onChange={e => setFormData({ ...formData, invoicePrefix: e.target.value })}
                    placeholder="0001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Dirección Comercial
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Calle, Número, Ciudad, Provincia"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="011 4000-0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email de Contacto
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contacto@comercio.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center space-x-1">
                  <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Mensaje al Pie del Ticket o Comprobante</span>
                </label>
                <input
                  type="text"
                  value={formData.receiptHeaderMessage}
                  onChange={e => setFormData({ ...formData, receiptHeaderMessage: e.target.value })}
                  placeholder="Ej. ¡Gracias por elegirnos! Conserve este comprobante para cambios antes de los 30 días."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: RUBRO & PLANTILLA PRESETEADA */}
          {activeTab === 'rubro' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-900 flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold mb-0.5">Estandarización por Rubro Comercial</p>
                  <p>
                    Al cambiar de rubro, el sistema adapta las categorías, los campos de productos (talles, colores, marcas) y permite cargar el inventario de ejemplo correspondiente.
                  </p>
                </div>
              </div>

              {catalogLoadedNotice && (
                <div className="bg-emerald-600 text-white p-3 rounded-xl flex items-center space-x-2 text-xs font-bold shadow-md">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>{catalogLoadedNotice}</span>
                </div>
              )}

              {presetNotice && !catalogLoadedNotice && (
                <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-xl text-xs text-emerald-900 font-medium space-y-2.5 shadow-xs">
                  <div className="flex items-center space-x-2 font-bold text-emerald-950">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span>{presetNotice}</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-emerald-200/60">
                    <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-emerald-900">
                      <input
                        type="checkbox"
                        checked={shouldReplaceCatalog}
                        onChange={e => setShouldReplaceCatalog(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-emerald-400 focus:ring-emerald-500"
                      />
                      <span>Cargar catálogo de productos de {formData.businessType} al Guardar</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleLoadCatalogNow}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center space-x-1"
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>Reemplazar Catálogo AHORA</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {RUBRO_PRESETS.map(preset => {
                  const isSelected = formData.businessType === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleApplyRubroPreset(preset)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{preset.icon}</span>
                          <span className="font-bold text-sm">{preset.name}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-200" />}
                      </div>
                      <p className={`text-xs mt-1.5 leading-relaxed ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {preset.description}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {preset.categories.slice(0, 4).map(cat => (
                          <span
                            key={cat}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              isSelected
                                ? 'bg-indigo-700 text-indigo-100'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {cat}
                          </span>
                        ))}
                        {preset.categories.length > 4 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                            +{preset.categories.length - 4} más
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORÍAS PERSONALIZADAS */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase">
                  Categorías Habilitadas para el Inventario
                </h4>
                <span className="text-xs text-slate-500 font-mono">
                  Total: {formData.customCategories.length} categorías
                </span>
              </div>

              {/* Add category row */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Escriba nueva categoría (ej. Iluminación, Panes, etc.)"
                  value={newCatInput}
                  onChange={e => setNewCatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-bold flex items-center space-x-1 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar</span>
                </button>
              </div>

              {/* Category tags grid */}
              <div className="flex flex-wrap gap-2 pt-2">
                {formData.customCategories.map(cat => (
                  <span
                    key={cat}
                    className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold shadow-2xs group hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors"
                  >
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat)}
                      className="text-slate-400 group-hover:text-red-600 p-0.5 rounded"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer Save Button */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Rubro activo: <strong className="text-slate-800">{formData.businessType}</strong>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-extrabold shadow-md flex items-center space-x-2 transition-colors"
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                    <span>¡Guardado con Éxito!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Configuración</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
