import React, { useState } from 'react';
import { 
  PackageMinus, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  Trash2, 
  X,
  User,
  PlusCircle,
  Clock,
  Package,
  FileCheck
} from 'lucide-react';
import { AppState, CustomerWithdrawal, WithdrawalItem, Customer } from '../types';
import { DataService } from '../services/dataService';
import { exportWithdrawalsExcel } from '../utils/excelExporter';
import { generateWithdrawalReceiptPDF, generateDebtDetailPDF } from '../utils/pdfGenerator';

interface WithdrawalsViewProps {
  appState: AppState;
}

export const WithdrawalsView: React.FC<WithdrawalsViewProps> = ({ appState }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'pending' | 'billed' | 'returned'>('ALL');

  // Bulk Billing Selection State
  const [selectedWithdrawalIds, setSelectedWithdrawalIds] = useState<string[]>([]);

  // Modal to add new withdrawal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [addQuantity, setAddQuantity] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [authorizedBy, setAuthorizedBy] = useState('');

  const filteredWithdrawals = appState.withdrawals.filter(w => {
    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      w.customerName.toLowerCase().includes(q) ||
      w.withdrawalNumber.toLowerCase().includes(q) ||
      w.items.some(i => i.productName.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const pendingFilteredWithdrawals = filteredWithdrawals.filter(w => w.status === 'pending');

  const toggleSelectWithdrawal = (id: string) => {
    setSelectedWithdrawalIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAllPending = () => {
    const pendingIds = pendingFilteredWithdrawals.map(w => w.id);
    const allSelected = pendingIds.every(id => selectedWithdrawalIds.includes(id));
    if (allSelected) {
      setSelectedWithdrawalIds(prev => prev.filter(id => !pendingIds.includes(id)));
    } else {
      setSelectedWithdrawalIds(prev => Array.from(new Set([...prev, ...pendingIds])));
    }
  };

  const handleBillSelectedWithdrawals = async () => {
    if (selectedWithdrawalIds.length === 0) return;

    const selectedWithdrawals = appState.withdrawals.filter(w => selectedWithdrawalIds.includes(w.id));
    const totalSelectedAmount = selectedWithdrawals.reduce((sum, w) => sum + w.totalAmount, 0);

    if (!window.confirm(`¿Confirmar facturación unificada de ${selectedWithdrawalIds.length} remito(s) seleccionado(s) por un total de $${totalSelectedAmount.toLocaleString('es-AR')}?`)) {
      return;
    }

    for (const w of selectedWithdrawals) {
      await DataService.updateWithdrawalStatus(w.id, 'billed');
    }

    setSelectedWithdrawalIds([]);
    alert(`¡Se facturaron exitosamente ${selectedWithdrawals.length} remitos por un valor total de $${totalSelectedAmount.toLocaleString('es-AR')}!`);
  };

  const handleAddItemToWithdrawal = () => {
    if (!selectedProductId) return;
    const prod = appState.products.find(p => p.id === selectedProductId);
    if (!prod) return;

    setItems(prev => {
      const existing = prev.find(i => i.productId === prod.id);
      if (existing) {
        return prev.map(i =>
          i.productId === prod.id
            ? { ...i, quantity: i.quantity + addQuantity, totalPrice: (i.quantity + addQuantity) * i.unitPrice }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: prod.id,
          productCode: prod.code,
          productName: prod.name,
          quantity: addQuantity,
          unitPrice: prod.salePrice,
          totalPrice: addQuantity * prod.salePrice
        }
      ];
    });

    setSelectedProductId('');
    setAddQuantity(1);
  };

  const handleRemoveItem = (prodId: string) => {
    setItems(prev => prev.filter(i => i.productId !== prodId));
  };

  const totalWithdrawalAmount = items.reduce((acc, i) => acc + i.totalPrice, 0);

  const handleSaveWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert('Debe seleccionar un cliente para registrar el retiro de mercadería.');
      return;
    }
    if (items.length === 0) {
      alert('Debe agregar al menos un producto al retiro.');
      return;
    }

    const nextNumber = `RET-${appState.storeInfo.invoicePrefix}-${(appState.withdrawals.length + 46).toString().padStart(5, '0')}`;

    const newWithdrawal: CustomerWithdrawal = {
      id: `with-${Date.now()}`,
      withdrawalNumber: nextNumber,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      date: new Date().toISOString(),
      items: [...items],
      totalAmount: totalWithdrawalAmount,
      status: 'pending',
      notes,
      authorizedBy
    };

    await DataService.registerWithdrawal(newWithdrawal);

    setIsModalOpen(false);
    setItems([]);
    setSelectedCustomer(null);
    setNotes('');
    setAuthorizedBy('');

    alert('¡Retiro de mercadería registrado con éxito y stock descontado!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mercadería Retirada por Cliente (Remitos)</h1>
          <p className="text-xs text-slate-500">Historial completo de retiros y entregas parciales pendientes de facturación.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportWithdrawalsExcel(appState.withdrawals)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={() => {
              setSelectedCustomer(appState.customers[0] || null);
              setItems([]);
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Nuevo Retiro</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por cliente, N° remito o producto..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 font-semibold">Estado:</span>
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'pending', label: 'Pendiente Facturar' },
            { id: 'billed', label: 'Facturados' }
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === st.id ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Billing Action Bar */}
      {pendingFilteredWithdrawals.length > 0 && (
        <div className="bg-indigo-900 text-white p-3.5 rounded-xl shadow-md flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={
                pendingFilteredWithdrawals.length > 0 &&
                pendingFilteredWithdrawals.every(w => selectedWithdrawalIds.includes(w.id))
              }
              onChange={toggleSelectAllPending}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="font-semibold">
              {selectedWithdrawalIds.length > 0
                ? `${selectedWithdrawalIds.length} remito(s) seleccionado(s) para facturar (Total: $${appState.withdrawals.filter(w => selectedWithdrawalIds.includes(w.id)).reduce((sum, w) => sum + w.totalAmount, 0).toLocaleString('es-AR')})`
                : 'Seleccionar todos los remitos pendientes'}
            </span>
          </div>

          {selectedWithdrawalIds.length > 0 && (
            <button
              onClick={handleBillSelectedWithdrawals}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold shadow flex items-center space-x-1.5 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>🧾 Facturar Remitos Seleccionados ({selectedWithdrawalIds.length})</span>
            </button>
          )}
        </div>
      )}

      {/* Withdrawals List */}
      <div className="space-y-4">
        {filteredWithdrawals.map(withdrawal => {
          const isSelected = selectedWithdrawalIds.includes(withdrawal.id);
          const isPending = withdrawal.status === 'pending';

          return (
            <div
              key={withdrawal.id}
              className={`bg-white rounded-xl shadow-sm border transition-all p-5 space-y-3 ${
                isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-3 gap-2">
                <div className="flex items-center space-x-3">
                  {isPending && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectWithdrawal(withdrawal.id)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-900 text-base">{withdrawal.withdrawalNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        isPending ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isPending ? 'Pendiente Facturar' : 'Facturado'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Fecha: <span className="font-medium text-slate-800">{new Date(withdrawal.date).toLocaleString('es-AR')}</span> | Cliente: <span className="font-bold text-slate-900">{withdrawal.customerName}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isPending && (
                    <button
                      onClick={async () => {
                        if (window.confirm(`¿Marcar remito ${withdrawal.withdrawalNumber} como facturado?`)) {
                          await DataService.updateWithdrawalStatus(withdrawal.id, 'billed');
                        }
                      }}
                      className="px-3 py-1.5 rounded bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold text-xs flex items-center space-x-1 border border-emerald-200 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Facturar Remito</span>
                    </button>
                  )}
                  <button
                    onClick={() => generateWithdrawalReceiptPDF(withdrawal, appState.storeInfo)}
                    className="px-3 py-1.5 rounded bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 font-bold text-xs flex items-center space-x-1 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Remito PDF</span>
                  </button>

                  <button
                    onClick={() => {
                      const cust = appState.customers.find(c => c.id === withdrawal.customerId) || {
                        id: withdrawal.customerId,
                        name: withdrawal.customerName,
                        dniCuit: 'Sin registrar',
                        phone: '',
                        email: '',
                        address: 'A confirmar',
                        creditLimit: 0,
                        currentBalance: withdrawal.totalAmount,
                        updatedAt: new Date().toISOString()
                      };
                      const itemsForDebt = withdrawal.items.map(i => ({
                        code: i.productCode || '001',
                        description: i.productName,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                        discount: 0,
                        total: i.totalPrice,
                        remitoNumber: withdrawal.withdrawalNumber
                      }));
                      generateDebtDetailPDF(cust, itemsForDebt, appState.storeInfo);
                    }}
                    className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-1 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Detalle Deuda PDF</span>
                  </button>
                </div>
              </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2">Código</th>
                    <th className="px-3 py-2">Producto Retirado</th>
                    <th className="px-3 py-2 text-center">Cantidad</th>
                    <th className="px-3 py-2 text-right">Precio Est. ($)</th>
                    <th className="px-3 py-2 text-right">Subtotal ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawal.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-slate-500">{item.productCode}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{item.productName}</td>
                      <td className="px-3 py-2 text-center font-bold text-slate-900">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-slate-600">${item.unitPrice.toLocaleString('es-AR')}</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">${item.totalPrice.toLocaleString('es-AR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 border-t text-xs text-slate-600">
              <span className="italic">{withdrawal.notes ? `Notas: ${withdrawal.notes}` : ''}</span>
              <span className="font-extrabold text-slate-900 text-sm">
                Total Estimado Retirado: ${withdrawal.totalAmount.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        );
      })}
      </div>

      {/* New Withdrawal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-xs border border-slate-100 animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Registrar Nuevo Retiro de Mercadería</h3>
                  <p className="text-[11px] text-slate-500">Genere un remito oficial de entrega parcial o retiro a cuenta corriente.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWithdrawal} className="space-y-4">
              {/* Customer Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Cliente que retira *</label>
                <select
                  value={selectedCustomer?.id || ''}
                  onChange={e => {
                    const c = appState.customers.find(cust => cust.id === e.target.value);
                    setSelectedCustomer(c || null);
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-xs"
                >
                  <option value="">Seleccionar Cliente del Padrón</option>
                  {appState.customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.dniCuit || 'Sin CUIT'}) - Saldo: ${c.currentBalance.toLocaleString('es-AR')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Product Selector Box */}
              <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100/80 space-y-3">
                <span className="font-bold text-xs text-indigo-950 flex items-center space-x-1.5">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span>Agregar Productos a la Entrega</span>
                </span>
                
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    className="w-full sm:flex-1 min-w-0 px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="">Seleccionar Producto del Inventario...</option>
                    {appState.products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.stock} {p.unit}) - ${p.salePrice.toLocaleString('es-AR')}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <input
                      type="number"
                      min="1"
                      value={addQuantity}
                      onChange={e => setAddQuantity(Number(e.target.value))}
                      className="w-20 px-3 py-2 border border-slate-300 rounded-xl bg-white text-center font-extrabold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
                      placeholder="Cant."
                    />
                    <button
                      type="button"
                      onClick={handleAddItemToWithdrawal}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm flex items-center justify-center space-x-1 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Añadir</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Added Items List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100/80 border-b border-slate-200 font-bold text-slate-700 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Producto</th>
                      <th className="py-2.5 px-3 text-center">Cant.</th>
                      <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                      <th className="py-2.5 px-3 text-right">Subtotal ($)</th>
                      <th className="py-2.5 px-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 font-medium text-xs">
                          No hay productos agregados a este retiro. Seleccione arriba y presione "+ Añadir".
                        </td>
                      </tr>
                    ) : (
                      items.map(item => (
                        <tr key={item.productId} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{item.productName}</td>
                          <td className="py-2.5 px-3 text-center font-extrabold text-slate-900 bg-slate-50/50">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">${item.unitPrice.toLocaleString('es-AR')}</td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-indigo-700">${item.totalPrice.toLocaleString('es-AR')}</td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.productId)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Quitar ítem"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Authorized By & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Autorizado por / Empleado</label>
                  <input
                    type="text"
                    value={authorizedBy}
                    onChange={e => setAuthorizedBy(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                    placeholder="Ej. Carlos Gómez (Encargado)"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Notas / Observaciones</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                    placeholder="Ej. Retirado por chofer de la obra en camioneta"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100">
                <div className="bg-emerald-50 text-emerald-800 px-4 py-2 rounded-xl border border-emerald-200/80 font-extrabold text-sm w-full sm:w-auto flex items-center justify-between sm:justify-start space-x-2">
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Total Estimado:</span>
                  <span className="text-base text-emerald-700 font-black">${totalWithdrawalAmount.toLocaleString('es-AR')}</span>
                </div>
                
                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Guardar y Emitir Remito</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
