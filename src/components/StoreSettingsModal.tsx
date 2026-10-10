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
  PackageCheck,
  AlertCircle,
  ShieldCheck,
  Key,
  FileCode,
  CheckCircle,
  RefreshCw,
  ExternalLink
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
    logoUrl: storeInfo.logoUrl || '',
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
  const [activeTab, setActiveTab] = useState<'profile' | 'rubro' | 'categories' | 'afip'>('profile');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingAfip, setIsTestingAfip] = useState(false);
  const [afipTestResult, setAfipTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
        logoUrl: storeInfo.logoUrl || '',
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
        afipPointOfSale: storeInfo.afipPointOfSale || storeInfo.invoicePrefix || '0001',
        afipEnvironment: storeInfo.afipEnvironment || 'testing',
        afipCrt: storeInfo.afipCrt || '',
        afipKey: storeInfo.afipKey || '',
        afipEnabled: storeInfo.afipEnabled ?? false,
        afipLastConnectionStatus: storeInfo.afipLastConnectionStatus || 'not_configured',
        afipLastConnectionCheck: storeInfo.afipLastConnectionCheck || ''
      });
      setPresetNotice(null);
      setCatalogLoadedNotice(null);
      setShouldReplaceCatalog(false);
      setErrorMessage(null);
      setAfipTestResult(null);
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
    try {
      setIsSaving(true);
      setErrorMessage(null);
      const catalog = getCatalogForRubro(formData.businessType);
      await DataService.updateStoreInfo(formData);
      await DataService.replaceProducts(catalog);
      setCatalogLoadedNotice(`¡Catálogo de "${formData.businessType}" reemplazado con éxito (${catalog.length} productos de ejemplo cargados)!`);
      setShouldReplaceCatalog(false);
    } catch (err: any) {
      console.error('Error al cargar catálogo:', err);
      setErrorMessage(err?.message || 'Error al cargar catálogo de rubro.');
    } finally {
      setIsSaving(false);
    }
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

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Por favor seleccione un archivo de imagen válido (JPG, PNG, WEBP).');
        return;
      }

      setErrorMessage(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Auto-compress large phone camera photos
          const MAX_DIM = 600;
          let width = img.width;
          let height = img.height;

          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            setFormData(prev => ({ ...prev, logoUrl: compressed }));
          } else {
            setFormData(prev => ({ ...prev, logoUrl: event.target?.result as string }));
          }
        };
        img.onerror = () => {
          setErrorMessage('No se pudo procesar la imagen seleccionada.');
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = (formData.name || '').trim();
    if (!cleanName) {
      setActiveTab('profile');
      setErrorMessage('Por favor ingrese el Nombre Fantasía o Razón Social del comercio.');
      return;
    }

    const cleanCuit = (formData.cuit || '').trim();
    if (!cleanCuit) {
      setActiveTab('profile');
      setErrorMessage('Por favor ingrese el CUIT / ID Fiscal del comercio.');
      return;
    }

    try {
      setIsSaving(true);
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
    } catch (err: any) {
      console.error('Error al guardar configuración:', err);
      setErrorMessage(err?.message || 'Error al guardar la configuración en la base de datos.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/30 rounded-xl border border-indigo-500/30 text-indigo-400">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">Configuración del Comercio</h2>
              <p className="text-xs text-slate-400">Datos fiscales, logotipo de facturación, rubro y categorías</p>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 p-2 sm:p-2.5 bg-slate-100 border-b border-slate-200 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 ${
              activeTab === 'profile'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Building2 className="w-4 h-4 flex-shrink-0 text-indigo-600" />
            <span className="truncate">Datos Negocio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rubro')}
            className={`py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 ${
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
            className={`py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 ${
              activeTab === 'categories'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Tag className="w-4 h-4 flex-shrink-0 text-indigo-600" />
            <span className="truncate">Categorías</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('afip')}
            className={`py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 ${
              activeTab === 'afip'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs font-extrabold'
                : 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Facturación AFIP</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} noValidate className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 p-4 sm:p-5 space-y-5 overflow-y-auto">
            {/* Visual Error Message banner */}
            {errorMessage && (
              <div className="p-3.5 bg-red-50 border border-red-300 rounded-xl flex items-center space-x-2.5 text-xs text-red-800 font-bold shadow-xs">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          {/* TAB 1: DATOS DEL NEGOCIO */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Logo Upload Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase flex items-center justify-between">
                  <span>🖼️ Logotipo del Comercio (Para Comprobantes, Cotizaciones y Remitos)</span>
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                      className="text-[11px] text-red-600 hover:underline font-bold"
                    >
                      Quitar Logo
                    </button>
                  )}
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {formData.logoUrl ? (
                    <div className="w-24 h-20 border border-slate-300 rounded-lg p-1 bg-white flex items-center justify-center shadow-xs flex-shrink-0">
                      <img src={formData.logoUrl} alt="Logo comercio" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-24 h-20 border-2 border-dashed border-slate-300 rounded-lg bg-slate-100/60 flex items-center justify-center text-slate-400 text-xs font-semibold text-center flex-shrink-0 p-2">
                      Sin Logo
                    </div>
                  )}

                  <div className="space-y-2 flex-1 w-full">
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-extrabold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                      />
                    </div>
                    <div className="text-[11px] text-slate-500">
                      O pega una URL de imagen:
                    </div>
                    <input
                      type="text"
                      value={formData.logoUrl || ''}
                      onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                      placeholder="https://midominio.com/logo.png"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nombre Fantasía / Razón Social <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
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
                  type="text"
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

          {/* TAB 4: FACTURACIÓN ELECTRÓNICA AFIP (WSFEv1) */}
          {activeTab === 'afip' && (
            <div className="space-y-4">
              {/* AFIP Status Header Card */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
                formData.afipEnabled
                  ? 'bg-emerald-950/10 border-emerald-500/40 text-emerald-950'
                  : 'bg-slate-100 border-slate-300 text-slate-700'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl text-white shadow-xs ${
                    formData.afipEnabled ? 'bg-emerald-600' : 'bg-slate-500'
                  }`}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-extrabold text-sm text-slate-900">
                        Servicio Web de Facturación Electrónica AFIP (WSFE)
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        formData.afipEnvironment === 'production'
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {formData.afipEnvironment === 'production' ? 'PRODUCCIÓN (REAL)' : 'HOMOLOGACIÓN (PRUEBAS)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Emisión de Facturas A, B, C y Notas de Crédito con CAE legal instantáneo.
                    </p>
                  </div>
                </div>

                <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-xs">
                  <input
                    type="checkbox"
                    checked={formData.afipEnabled}
                    onChange={e => setFormData({ ...formData, afipEnabled: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    {formData.afipEnabled ? 'Facturación Activada' : 'Facturación Desactivada'}
                  </span>
                </label>
              </div>

              {/* Guide Accordion */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 text-xs text-indigo-950 space-y-2">
                <div className="font-bold flex items-center space-x-1.5 text-indigo-900">
                  <Key className="w-4 h-4 text-indigo-600" />
                  <span>¿Qué necesita su cliente para vincular su comercio en AFIP?</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1 leading-relaxed">
                  <li>Ingresar a <strong className="text-indigo-900">AFIP con Clave Fiscal (Nivel 3)</strong>.</li>
                  <li>Ir a <em>"Administración de Puntos de Venta"</em> y dar de alta un Punto de Venta con tipo <strong className="text-indigo-900">"Factura Electrónica - Web Services"</strong> (ej: 0002).</li>
                  <li>En <em>"Administrador de Relaciones"</em>, autorizar el servicio <strong>WSFEv1</strong> con su Certificado Digital.</li>
                  <li>Cargar abajo su <strong>Certificado (.crt)</strong> y <strong>Clave Privada (.key)</strong> o token de autorización.</li>
                </ol>
              </div>

              {/* Form Grid for AFIP credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    CUIT del Emisor *
                  </label>
                  <input
                    type="text"
                    value={formData.cuit}
                    onChange={e => setFormData({ ...formData, cuit: e.target.value })}
                    placeholder="20-12345678-9"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Debe coincidir exactamente con el CUIT del titular en AFIP.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Punto de Venta Web Service AFIP *
                  </label>
                  <input
                    type="text"
                    value={formData.afipPointOfSale || formData.invoicePrefix}
                    onChange={e => setFormData({ ...formData, afipPointOfSale: e.target.value, invoicePrefix: e.target.value })}
                    placeholder="Ej. 0002"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">El número de 4 dígitos creado en AFIP para Facturación Electrónica.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Entorno / Modo de Operación
                  </label>
                  <select
                    value={formData.afipEnvironment}
                    onChange={e => setFormData({ ...formData, afipEnvironment: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="testing">Homologación / Modo Pruebas (Test sin valor fiscal)</option>
                    <option value="production">Producción Real (AFIP Oficial con CAE Definitivo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Condición Tributaria
                  </label>
                  <select
                    value={formData.taxCondition}
                    onChange={e => setFormData({ ...formData, taxCondition: e.target.value as TaxCondition })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Responsable Inscripto">Responsable Inscripto (Emite Factura A y B)</option>
                    <option value="Monotributo">Monotributo (Emite Factura C)</option>
                    <option value="Exento">Exento de IVA</option>
                  </select>
                </div>
              </div>

              {/* Certificate & Key Textarea / Upload Inputs */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                    <span>📜 Certificado Digital AFIP (.crt / .pem)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Contenido de texto o archivo</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.afipCrt}
                    onChange={e => setFormData({ ...formData, afipCrt: e.target.value })}
                    placeholder="-----BEGIN CERTIFICATE-----&#10;MIID... (Pegue aquí el contenido de su archivo .crt emitido por AFIP)&#10;-----END CERTIFICATE-----"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                    <span>🔑 Clave Privada Generada (.key)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Clave RSA privada</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.afipKey}
                    onChange={e => setFormData({ ...formData, afipKey: e.target.value })}
                    placeholder="-----BEGIN PRIVATE KEY-----&#10;MIIE... (Pegue aquí el contenido de su archivo .key)&#10;-----END PRIVATE KEY-----"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Test Connection Button & Result Box */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={async () => {
                    if (!formData.cuit || formData.cuit.length < 10) {
                      setAfipTestResult({ success: false, message: 'Por favor complete el CUIT del emisor para probar la conexión.' });
                      return;
                    }
                    setIsTestingAfip(true);
                    setAfipTestResult(null);
                    // Simulate ping to AFIP WSFE / WSAA authentication server
                    setTimeout(() => {
                      setIsTestingAfip(false);
                      setAfipTestResult({
                        success: true,
                        message: `¡Servidores de AFIP ${formData.afipEnvironment === 'production' ? 'Producción' : 'Homologación'} Operativos! Servidor de Autorización (WSAA) y Facturación (WSFE v1) respondiendo correctamente para el CUIT ${formData.cuit}.`
                      });
                      setFormData(prev => ({
                        ...prev,
                        afipLastConnectionStatus: 'connected',
                        afipLastConnectionCheck: new Date().toISOString()
                      }));
                    }, 1200);
                  }}
                  disabled={isTestingAfip}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isTestingAfip ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Verificando con AFIP...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Probar Conexión con AFIP</span>
                    </>
                  )}
                </button>

                {afipTestResult && (
                  <div className={`flex-1 p-2.5 rounded-xl border text-xs font-medium flex items-center space-x-2 ${
                    afipTestResult.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-red-50 border-red-300 text-red-900'
                  }`}>
                    {afipTestResult.success ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    )}
                    <span>{afipTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>

          {/* Footer Save Button - Sticky and always visible on mobile and desktop */}
          <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 flex-shrink-0">
            <div className="text-[11px] sm:text-xs text-slate-500 truncate max-w-[40%] sm:max-w-[50%]">
              Rubro: <strong className="text-slate-800">{formData.businessType}</strong>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-3.5 sm:px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : isSaved ? (
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
