import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  DollarSign, 
  FileSpreadsheet, 
  FileText, 
  CreditCard, 
  History, 
  AlertTriangle,
  X,
  CheckCircle,
  Phone,
  Mail,
  Edit,
  Pencil,
  Trash2,
  MapPin,
  MessageSquare,
  Receipt,
  FileCheck,
  Printer,
  Package
} from 'lucide-react';
import { AppState, Customer, CustomerTransaction, Sale, InvoiceType, PaymentMethod, TaxCondition, Cheque } from '../types';
import { DataService } from '../services/dataService';
import { exportCustomersExcel } from '../utils/excelExporter';
import { generateCustomerAccountStatementPDF, generateSaleInvoicePDF, generateCustomerPaymentReceiptPDF } from '../utils/pdfGenerator';

interface CurrentAccountsViewProps {
  appState: AppState;
  setActiveTab?: (tab: any) => void;
}

export const CurrentAccountsView: React.FC<CurrentAccountsViewProps> = ({ appState, setActiveTab }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'cheque'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentEmitInvoice, setPaymentEmitInvoice] = useState(false);
  const [paymentInvoiceType, setPaymentInvoiceType] = useState<InvoiceType>('FACTURA_B');

  // Cheque Form State (para registrar en Cartera de Cheques)
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeBank, setChequeBank] = useState('Banco Galicia');
  const [chequeIssuerName, setChequeIssuerName] = useState('');
  const [chequeIssuerCuit, setChequeIssuerCuit] = useState('');
  const [chequeDueDate, setChequeDueDate] = useState('');
  const [chequeNotes, setChequeNotes] = useState('');

  // Billing Modal State (Facturar directamente desde Cuentas Corrientes)
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [billingCustomer, setBillingCustomer] = useState<Customer | null>(null);
  const [billingInvoiceType, setBillingInvoiceType] = useState<InvoiceType>('FACTURA_B');
  const [billingAmount, setBillingAmount] = useState<number | ''>('');
  const [billingConcept, setBillingConcept] = useState('Facturación de saldo en cuenta corriente');
  const [billingPaymentMethod, setBillingPaymentMethod] = useState<PaymentMethod>('current_account');

  const handleEmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingCustomer || !billingAmount || Number(billingAmount) <= 0) return;

    if (billingInvoiceType === 'FACTURA_A') {
      if (!billingCustomer.dniCuit || billingCustomer.dniCuit.trim().length < 8) {
        alert('Para emitir Factura A se requiere registrar el CUIT del cliente. Por favor edite los datos del cliente primero.');
        return;
      }
    }

    const amt = Number(billingAmount);
    const nextInvoiceNum = `FC-${appState.storeInfo.invoicePrefix}-${(appState.sales.length + 1052).toString().padStart(8, '0')}`;
    const generatedCae = `743${Math.floor(10000000000 + Math.random() * 90000000000)}`;
    const caeDueDate = new Date(Date.now() + 10 * 86400000).toLocaleDateString('es-AR');

    const taxCond: TaxCondition = billingInvoiceType === 'FACTURA_A' ? 'Responsable Inscripto' : 'Consumidor Final / General';

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      invoiceNumber: nextInvoiceNum,
      invoiceType: billingInvoiceType,
      cae: generatedCae,
      caeDueDate,
      customerCuitDni: billingCustomer.dniCuit || '20-00000000-0',
      customerTaxCondition: taxCond,
      date: new Date().toISOString(),
      customerId: billingCustomer.id,
      customerName: billingCustomer.name,
      items: [
        {
          productId: `billing-${Date.now()}`,
          code: 'SERV-01',
          productName: billingConcept || 'Servicio de Facturación Cta Cte',
          quantity: 1,
          unitPrice: amt,
          costPrice: 0,
          subtotal: amt
        }
      ],
      subtotal: amt,
      discount: 0,
      surcharge: 0,
      totalAmount: amt,
      paymentMethod: billingPaymentMethod,
      notes: `Facturado desde Cuentas Corrientes (${billingConcept})`,
      status: 'completed'
    };

    await DataService.processSale(newSale);

    // Emit and download official PDF
    generateSaleInvoicePDF(newSale, appState.storeInfo);

    setIsBillingModalOpen(false);
    setBillingCustomer(null);
    setBillingAmount('');

    alert(`¡Factura ${newSale.invoiceNumber} emitida e impresa con éxito!`);
  };

  const filteredCustomers = appState.customers.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.dniCuit.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
    );
  });

  const totalDebt = appState.customers.reduce((acc, c) => acc + c.currentBalance, 0);

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer?.name) return;

    const existingCustomer = editingCustomer.id
      ? appState.customers.find(c => c.id === editingCustomer.id)
      : null;

    const newBalance = Number(editingCustomer.currentBalance) || 0;

    const custToSave: Customer = {
      id: editingCustomer.id || `cust-${Date.now()}`,
      name: editingCustomer.name,
      dniCuit: editingCustomer.dniCuit || '',
      phone: editingCustomer.phone || '',
      email: editingCustomer.email || '',
      address: editingCustomer.address || '',
      creditLimit: editingCustomer.creditLimit || 999999999,
      currentBalance: newBalance,
      notes: editingCustomer.notes || '',
      updatedAt: new Date().toISOString()
    };

    // If balance was modified manually on an existing customer, log an audit transaction
    if (existingCustomer && existingCustomer.currentBalance !== newBalance) {
      const diff = newBalance - existingCustomer.currentBalance;
      const auditTx: CustomerTransaction = {
        id: `tx-adj-${Date.now()}`,
        customerId: custToSave.id,
        type: 'adjustment',
        amount: Math.abs(diff),
        balanceAfter: newBalance,
        date: new Date().toISOString(),
        description: `Ajuste Manual de Saldo (${diff > 0 ? 'Aumento Deuda +' : 'Reducción Deuda -'}$${Math.abs(diff).toLocaleString('es-AR')})${custToSave.notes ? ' - ' + custToSave.notes : ''}`
      };
      appState.customerTransactions.unshift(auditTx);
    }

    await DataService.saveCustomer(custToSave);
    setIsCustomerModalOpen(false);
    setEditingCustomer(null);
  };

  const handleSendWhatsApp = (customer: Customer) => {
    if (!customer.phone) {
      alert('El cliente no posee un número de teléfono registrado.');
      return;
    }
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const storeName = appState.storeInfo.name;
    const debtStr = customer.currentBalance.toLocaleString('es-AR');
    const availableCredit = Math.max(0, customer.creditLimit - customer.currentBalance).toLocaleString('es-AR');
    const message = encodeURIComponent(
      `Hola *${customer.name}*, le saludamos de *${storeName}*.\n\nLe recordamos que posee un saldo pendiente en cuenta corriente de *$${debtStr}*.\nLímite de crédito disponible: *$${availableCredit}*.\n\nCualquier duda o consulta estamos a su disposición. ¡Muchas gracias!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleDeleteCustomer = async (customerId: string, customerName: string) => {
    if (window.confirm(`¿Está seguro de eliminar el cliente "${customerName}"?`)) {
      await DataService.deleteCustomer(customerId);
      if (selectedCustomer?.id === customerId) setSelectedCustomer(null);
      if (editingCustomer?.id === customerId) {
        setIsCustomerModalOpen(false);
        setEditingCustomer(null);
      }
    }
  };

  const handleRegisterPayment = async (e: React.FormEvent, shouldEmitPDF: boolean = false) => {
    if (e) e.preventDefault();
    if (!payingCustomer || !paymentAmount || Number(paymentAmount) <= 0) return;

    const amt = Number(paymentAmount);
    let effectiveNotes = paymentNotes;

    // Si el medio de pago es cheque, se guarda en la Cartera de Cheques
    if (paymentMethod === 'cheque') {
      if (!chequeNumber || !chequeBank) {
        alert('Debe ingresar al menos el Número de Cheque y el Banco Emisor.');
        return;
      }

      const newCheque: Cheque = {
        id: `chq-${Date.now()}`,
        number: chequeNumber,
        bank: chequeBank,
        issuerName: chequeIssuerName || payingCustomer.name,
        issuerCuit: chequeIssuerCuit || payingCustomer.dniCuit,
        customerId: payingCustomer.id,
        customerName: payingCustomer.name,
        amount: amt,
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: chequeDueDate || new Date().toISOString().slice(0, 10),
        status: 'in_wallet',
        notes: chequeNotes || `Recibido de ${payingCustomer.name}`
      };

      await DataService.saveCheque(newCheque);
      effectiveNotes = `Cheque N° ${chequeNumber} (${chequeBank}) ${paymentNotes ? '- ' + paymentNotes : ''}`;
    }

    await DataService.registerCustomerPayment({
      customerId: payingCustomer.id,
      amount: amt,
      paymentMethod,
      notes: effectiveNotes
    });

    if (shouldEmitPDF || paymentEmitInvoice) {
      const nextInvoiceNum = `FC-${appState.storeInfo.invoicePrefix}-${(appState.sales.length + 1052).toString().padStart(8, '0')}`;
      const generatedCae = `743${Math.floor(10000000000 + Math.random() * 90000000000)}`;
      const caeDueDate = new Date(Date.now() + 10 * 86400000).toLocaleDateString('es-AR');
      const taxCond: TaxCondition = paymentInvoiceType === 'FACTURA_A' ? 'Responsable Inscripto' : 'Consumidor Final / General';

      const invoiceSale: Sale = {
        id: `sale-pay-${Date.now()}`,
        invoiceNumber: nextInvoiceNum,
        invoiceType: paymentInvoiceType,
        cae: generatedCae,
        caeDueDate,
        customerCuitDni: payingCustomer.dniCuit || '20-00000000-0',
        customerTaxCondition: taxCond,
        date: new Date().toISOString(),
        customerId: payingCustomer.id,
        customerName: payingCustomer.name,
        items: [
          {
            productId: `pay-item-${Date.now()}`,
            code: 'REC-01',
            productName: `Cobro / Entrega a Cuenta (${payingCustomer.name})`,
            quantity: 1,
            unitPrice: amt,
            costPrice: 0,
            subtotal: amt
          }
        ],
        subtotal: amt,
        discount: 0,
        surcharge: 0,
        totalAmount: amt,
        paymentMethod: paymentMethod === 'cheque' ? 'cheque' : paymentMethod,
        notes: `Recibo de Cobranza Cta Cte: ${effectiveNotes}`,
        status: 'completed'
      };

      generateSaleInvoicePDF(invoiceSale, appState.storeInfo);
    }

    setIsPaymentModalOpen(false);
    setPayingCustomer(null);
    setPaymentAmount('');
    setPaymentNotes('');
    setPaymentEmitInvoice(false);
    setChequeNumber('');
    setChequeBank('Banco Galicia');
    setChequeIssuerName('');
    setChequeIssuerCuit('');
    setChequeDueDate('');
    setChequeNotes('');

    alert(`¡Entrega de dinero ${paymentMethod === 'cheque' ? 'y Cheque cargado en Cartera' : ''} registrada con éxito${(shouldEmitPDF || paymentEmitInvoice) ? ' e impresa en PDF' : ''}!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Gestión de Cuentas Corrientes y Deudores</h1>
          <p className="text-xs text-slate-500">Administre saldos a crédito, entregas de dinero y estados de cuenta.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportCustomersExcel(appState.customers)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={() => {
              setEditingCustomer({ name: '', dniCuit: '', creditLimit: 150000, currentBalance: 0 });
              setIsCustomerModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* KPI Total Debt Summary */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-semibold text-blue-300 tracking-wider">Total Deuda Acumulada Cuentas Corrientes</span>
          <div className="text-3xl font-extrabold text-white mt-1">
            ${totalDebt.toLocaleString('es-AR')}
          </div>
        </div>
        <div className="text-xs text-blue-200">
          <span className="font-bold text-white">{appState.customers.filter(c => c.currentBalance > 0).length} clientes</span> con saldo pendiente
        </div>
      </div>

      {/* Search & Customer Grid */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por nombre de cliente, CUIT/DNI o teléfono..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Customer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => {
            const isOverLimit = customer.currentBalance > customer.creditLimit;
            const hasDebt = customer.currentBalance > 0;

            const transactions = appState.customerTransactions.filter(t => t.customerId === customer.id);

            return (
              <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-900 text-base">{customer.name}</h3>
                        <button
                          onClick={() => {
                            setEditingCustomer(customer);
                            setIsCustomerModalOpen(true);
                          }}
                          className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar Cliente"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">DNI/CUIT: {customer.dniCuit || '-'}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${
                      isOverLimit ? 'bg-red-100 text-red-700 border border-red-300' :
                      hasDebt ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isOverLimit ? 'Límite Excedido' : hasDebt ? 'Con Deuda' : 'Al Día'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    {customer.phone && (
                      <p className="flex items-center justify-between">
                        <span className="flex items-center space-x-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{customer.phone}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(customer)}
                          className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center space-x-1 border border-emerald-200 transition-colors"
                          title="Enviar recordatorio de deuda por WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>
                      </p>
                    )}
                    {customer.email && <p className="flex items-center space-x-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /><span>{customer.email}</span></p>}
                    {customer.address && <p className="flex items-center space-x-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /><span>{customer.address}</span></p>}
                  </div>

                  {/* Financial Metrics */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Límite de Crédito:</span>
                      <span className="font-semibold">${customer.creditLimit.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                      <span>Saldo Deuda Actual:</span>
                      <span className={hasDebt ? 'text-red-600 font-extrabold text-sm' : 'text-emerald-600 font-extrabold text-sm'}>
                        ${customer.currentBalance.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center space-x-1.5 border-t border-slate-100 flex-wrap gap-y-1.5">
                  <button
                    onClick={() => {
                      setPayingCustomer(customer);
                      setPaymentAmount(customer.currentBalance > 0 ? customer.currentBalance : '');
                      setIsPaymentModalOpen(true);
                    }}
                    className="flex-1 min-w-[120px] py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1 transition-colors shadow-xs"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Cobrar Entrega</span>
                  </button>
                  <button
                    onClick={() => {
                      setBillingCustomer(customer);
                      setBillingAmount(customer.currentBalance > 0 ? customer.currentBalance : '');
                      setBillingConcept(`Facturación de saldo en Cta. Cte. (${customer.name})`);
                      setIsBillingModalOpen(true);
                    }}
                    className="py-2 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1 transition-colors shadow-xs"
                    title="Emitir e imprimir Factura A/B/C para este cliente"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Facturar</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingCustomer(customer);
                      setIsCustomerModalOpen(true);
                    }}
                    className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center space-x-1 transition-colors"
                    title="Editar Cliente"
                  >
                    <Pencil className="w-4 h-4" />
                    <span className="hidden sm:inline">Editar</span>
                  </button>
                  <button
                    onClick={() => setSelectedCustomer(customer)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1 transition-colors"
                    title="Ver Estado de Cuenta"
                  >
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline">Historial</span>
                  </button>
                  <button
                    onClick={() => {
                      generateCustomerAccountStatementPDF(customer, transactions, appState.storeInfo);
                    }}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Imprimir Resumen PDF"
                  >
                    <FileText className="w-4 h-4 text-indigo-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                    title="Eliminar Cliente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Account Statement History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Estado de Cuenta Corriente e Historial Detallado</h3>
                <span className="text-xs text-slate-500 font-semibold">{selectedCustomer.name} (DNI/CUIT: {selectedCustomer.dniCuit || 'Sin registrar'})</span>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border text-xs">
              <div>
                <span className="text-slate-500">Límite Crédito:</span> <span className="font-bold">${selectedCustomer.creditLimit.toLocaleString('es-AR')}</span>
              </div>
              <div>
                <span className="text-slate-500">Saldo Deuda Actual:</span> <span className="font-extrabold text-red-600 text-sm">${selectedCustomer.currentBalance.toLocaleString('es-AR')}</span>
              </div>
              <button
                onClick={() => {
                  const txs = appState.customerTransactions.filter(t => t.customerId === selectedCustomer.id);
                  generateCustomerAccountStatementPDF(selectedCustomer, txs, appState.storeInfo);
                }}
                className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-500 flex items-center space-x-1 shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Exportar Resumen PDF</span>
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto border rounded-xl shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[10px] sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5">Fecha y Hora</th>
                    <th className="p-2.5">Concepto & Productos Retirados</th>
                    <th className="p-2.5">Tipo Movimiento</th>
                    <th className="p-2.5 text-right">Monto ($)</th>
                    <th className="p-2.5 text-right">Saldo Deudor</th>
                    <th className="p-2.5 text-center">Comprobante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appState.customerTransactions
                    .filter(t => t.customerId === selectedCustomer.id)
                    .map(tx => {
                      // Lookup related items if sale or withdrawal
                      const relatedSale = tx.saleId ? appState.sales.find(s => s.id === tx.saleId) : null;
                      const relatedWithdrawal = tx.withdrawalId ? appState.withdrawals.find(w => w.id === tx.withdrawalId) : null;

                      const itemsList = relatedSale
                        ? relatedSale.items.map(i => `${i.quantity}x ${i.productName} ($${i.unitPrice.toLocaleString('es-AR')})`).join(' • ')
                        : (relatedWithdrawal
                          ? relatedWithdrawal.items.map(i => `${i.quantity}x ${i.productName}`).join(' • ')
                          : null);

                      const formattedDate = new Date(tx.date).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      const handlePrintTxPDF = () => {
                        if (relatedSale) {
                          generateSaleInvoicePDF(relatedSale, appState.storeInfo);
                        } else {
                          generateCustomerPaymentReceiptPDF(tx, selectedCustomer, appState.storeInfo);
                        }
                      };

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-2.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">{formattedDate}</td>
                          <td className="p-2.5 font-medium text-slate-800 space-y-1">
                            <div>{tx.description}</div>
                            {itemsList && (
                              <div className="text-[10px] text-slate-600 bg-slate-100/90 px-2 py-1 rounded border border-slate-200/80 flex items-center space-x-1 mt-0.5">
                                <Package className="w-3 h-3 text-indigo-600 shrink-0" />
                                <span className="font-semibold text-slate-700">Artículos:</span>
                                <span className="text-slate-600">{itemsList}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              tx.type === 'sale' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              tx.type === 'payment' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              'bg-purple-100 text-purple-800 border border-purple-200'
                            }`}>
                              {tx.type === 'sale' ? 'Venta Cta Cte' : tx.type === 'payment' ? 'Pago / Entrega' : 'Ajuste Manual'}
                            </span>
                          </td>
                          <td className={`p-2.5 text-right font-extrabold whitespace-nowrap ${
                            tx.type === 'payment' ? 'text-emerald-600' :
                            tx.type === 'adjustment' ? 'text-purple-700' : 'text-slate-900'
                          }`}>
                            {tx.type === 'payment' ? `-$${tx.amount.toLocaleString('es-AR')}` : `${tx.type === 'adjustment' ? '⚙️ ' : '+'}$${tx.amount.toLocaleString('es-AR')}`}
                          </td>
                          <td className="p-2.5 text-right font-extrabold text-slate-900 whitespace-nowrap">${tx.balanceAfter.toLocaleString('es-AR')}</td>
                          <td className="p-2.5 text-center whitespace-nowrap">
                            <button
                              onClick={handlePrintTxPDF}
                              className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center space-x-1 transition-colors mx-auto"
                              title="Imprimir Comprobante PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span className="text-[10px]">PDF</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payment Entry Modal */}
      {isPaymentModalOpen && payingCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Registrar Cobro / Entrega a Cuenta</h3>
                <p className="text-xs text-slate-500 font-semibold">{payingCustomer.name} (Saldo actual: ${payingCustomer.currentBalance.toLocaleString('es-AR')})</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={e => handleRegisterPayment(e, false)} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Monto de Entrega / Pago ($) *</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-extrabold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Medio de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={e => {
                    const m = e.target.value as any;
                    setPaymentMethod(m);
                    if (m === 'cheque') {
                      if (!chequeIssuerName) setChequeIssuerName(payingCustomer.name);
                      if (!chequeIssuerCuit) setChequeIssuerCuit(payingCustomer.dniCuit);
                      if (!chequeDueDate) setChequeDueDate(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
                    }
                  }}
                  className="w-full px-3 py-1.5 border rounded-lg bg-slate-50 font-semibold"
                >
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia Bancaria</option>
                  <option value="cheque">Cheque (Carga en Cartera)</option>
                </select>
              </div>

              {/* Cheque Detailed Form Panel */}
              {paymentMethod === 'cheque' && (
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 space-y-2 text-xs">
                  <div className="flex items-center space-x-1.5 text-amber-900 font-extrabold pb-1 border-b border-amber-200/60">
                    <CreditCard className="w-4 h-4 text-amber-700" />
                    <span>Datos del Cheque a Ingresar en Cartera</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-amber-900 block mb-0.5 text-[10px]">N° de Cheque *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. 00849201"
                        value={chequeNumber}
                        onChange={e => setChequeNumber(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-amber-300 rounded font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-amber-900 block mb-0.5 text-[10px]">Banco Emisor *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Banco Galicia / Santander"
                        value={chequeBank}
                        onChange={e => setChequeBank(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-amber-300 rounded font-semibold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-amber-900 block mb-0.5 text-[10px]">Librador / Titular</label>
                      <input
                        type="text"
                        placeholder={payingCustomer.name}
                        value={chequeIssuerName}
                        onChange={e => setChequeIssuerName(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-amber-300 rounded text-slate-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-amber-900 block mb-0.5 text-[10px]">CUIT Librador</label>
                      <input
                        type="text"
                        placeholder="20-12345678-9"
                        value={chequeIssuerCuit}
                        onChange={e => setChequeIssuerCuit(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-amber-300 rounded text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-amber-900 block mb-0.5 text-[10px]">Fecha de Cobro / Vencimiento *</label>
                    <input
                      type="date"
                      required
                      value={chequeDueDate}
                      onChange={e => setChequeDueDate(e.target.value)}
                      className="w-full px-2.5 py-1 bg-white border border-amber-300 rounded font-bold text-slate-900"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Observaciones / Recibo</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-slate-50"
                  placeholder="Ej. Entregado en mano por el cliente"
                />
              </div>

              {/* Invoicing Section inside Payment Modal */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={paymentEmitInvoice}
                    onChange={e => setPaymentEmitInvoice(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>🧾 Emitir e Imprimir Factura / Comprobante PDF</span>
                </label>

                {paymentEmitInvoice && (
                  <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 space-y-2">
                    <label className="font-bold text-indigo-900 block text-[11px]">Tipo de Comprobante AFIP:</label>
                    <div className="grid grid-cols-4 gap-1 text-center text-xs">
                      {[
                        { id: 'FACTURA_B', label: 'Factura B' },
                        { id: 'FACTURA_A', label: 'Factura A' },
                        { id: 'FACTURA_C', label: 'Factura C' },
                        { id: 'TICKET_X', label: 'Ticket X' }
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setPaymentInvoiceType(t.id as InvoiceType)}
                          className={`py-1.5 px-1 rounded-md border font-bold text-[10px] transition-all ${
                            paymentInvoiceType === t.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancelar
                </button>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    Confirmar Cobro
                  </button>
                  <button
                    type="button"
                    onClick={e => handleRegisterPayment(e, true)}
                    className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md flex items-center space-x-1 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Confirmar y Facturar PDF</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Customer Modal */}
      {isCustomerModalOpen && editingCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingCustomer.id ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCustomerModalOpen(false);
                  setEditingCustomer(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre Completo / Razón Social *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Carlos Pérez / Construcciones S.A."
                  value={editingCustomer.name || ''}
                  onChange={e => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">DNI / CUIT</label>
                  <input
                    type="text"
                    placeholder="20-12345678-9"
                    value={editingCustomer.dniCuit || ''}
                    onChange={e => setEditingCustomer({ ...editingCustomer, dniCuit: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Teléfono de Contacto</label>
                  <input
                    type="text"
                    placeholder="011 15-1234-5678"
                    value={editingCustomer.phone || ''}
                    onChange={e => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="cliente@ejemplo.com"
                    value={editingCustomer.email || ''}
                    onChange={e => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Dirección / Domicilio</label>
                  <input
                    type="text"
                    placeholder="Av. Corrientes 1234"
                    value={editingCustomer.address || ''}
                    onChange={e => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Saldo Deuda Inicial / Actual ($)</label>
                <input
                  type="number"
                  step="any"
                  value={editingCustomer.currentBalance ?? 0}
                  onChange={e => setEditingCustomer({ ...editingCustomer, currentBalance: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-bold text-red-600"
                  placeholder="0 (o saldo deudor previo)"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Observaciones / Notas internas</label>
                <textarea
                  rows={2}
                  value={editingCustomer.notes || ''}
                  onChange={e => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
                  placeholder="Detalles sobre entregas, condiciones especiales, etc."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {editingCustomer.id ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomer(editingCustomer.id!, editingCustomer.name || 'Cliente')}
                    className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold flex items-center space-x-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>
                ) : <div />}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomerModalOpen(false);
                      setEditingCustomer(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md transition-colors"
                  >
                    {editingCustomer.id ? 'Guardar Cambios' : 'Crear Cliente'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Billing Modal (Emitir e Imprimir Factura A/B/C) */}
      {isBillingModalOpen && billingCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Emitir e Imprimir Factura</h3>
                <p className="text-xs text-slate-500 font-semibold">{billingCustomer.name} (CUIT/DNI: {billingCustomer.dniCuit || 'Sin registrar'})</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsBillingModalOpen(false);
                  setBillingCustomer(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEmitInvoice} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tipo de Comprobante AFIP *</label>
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                  {[
                    { id: 'FACTURA_B', label: 'Factura B' },
                    { id: 'FACTURA_A', label: 'Factura A' },
                    { id: 'FACTURA_C', label: 'Factura C' },
                    { id: 'TICKET_X', label: 'Ticket X' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setBillingInvoiceType(t.id as InvoiceType)}
                      className={`py-2 px-1 rounded-lg border font-bold text-[11px] transition-all ${
                        billingInvoiceType === t.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Monto a Facturar ($) *</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={billingAmount}
                  onChange={e => setBillingAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-extrabold text-slate-900 text-base focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-500 italic block mt-0.5">
                  Saldo de deuda actual del cliente: ${billingCustomer.currentBalance.toLocaleString('es-AR')}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Concepto / Detalle de la Factura *</label>
                <input
                  type="text"
                  required
                  value={billingConcept}
                  onChange={e => setBillingConcept(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-slate-50 text-xs font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Condición de Pago / Medio</label>
                <select
                  value={billingPaymentMethod}
                  onChange={e => setBillingPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-slate-50 font-semibold"
                >
                  <option value="current_account">Cuenta Corriente (A Crédito)</option>
                  <option value="cash">Efectivo (Contado)</option>
                  <option value="transfer">Transferencia Bancaria</option>
                  <option value="card">Tarjeta de Débito / Crédito</option>
                </select>
              </div>

              <div className="flex flex-col space-y-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold shadow-md flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Emitir e Imprimir Factura PDF</span>
                </button>

                {setActiveTab && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsBillingModalOpen(false);
                      setActiveTab('pos');
                    }}
                    className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center space-x-1"
                  >
                    <span>Ir a Punto de Venta (POS) para Venta Detallada por Artículo</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
