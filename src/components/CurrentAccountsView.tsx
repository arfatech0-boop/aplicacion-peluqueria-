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
  Package,
  Calendar,
  PlusCircle,
  FileCheck2,
  Check
} from 'lucide-react';
import { AppState, Customer, CustomerTransaction, CustomerWithdrawal, Sale, InvoiceType, PaymentMethod, TaxCondition, Cheque } from '../types';
import { DataService } from '../services/dataService';
import { exportCustomersExcel } from '../utils/excelExporter';
import { generateCustomerAccountStatementPDF, generateSaleInvoicePDF, generateCustomerPaymentReceiptPDF, generateDebtDetailPDF, generateWithdrawalReceiptPDF } from '../utils/pdfGenerator';
import { Pagination } from './Pagination';

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
  const [paymentMode, setPaymentMode] = useState<'partial' | 'total'>('partial');
  const [paymentNextPromiseDate, setPaymentNextPromiseDate] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'cheque'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentEmitInvoice, setPaymentEmitInvoice] = useState(false);
  const [paymentInvoiceType, setPaymentInvoiceType] = useState<InvoiceType>('FACTURA_B');
  const [selectedWithdrawalIdsToPay, setSelectedWithdrawalIdsToPay] = useState<string[]>([]);

  // Customer History Modal Tab
  const [historyTab, setHistoryTab] = useState<'payments' | 'all' | 'debts'>('debts');

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

  // Charge Modal State (Cargar deuda / mercadería retirada a Cuenta Corriente)
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [chargingCustomer, setChargingCustomer] = useState<Customer | null>(null);
  const [chargeAmount, setChargeAmount] = useState<number | ''>('');
  const [chargeDate, setChargeDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [chargeDescription, setChargeDescription] = useState('');
  const [chargeReference, setChargeReference] = useState('');

  // Initial / Adjusted Debt State in Customer Create/Edit modal
  const [initialDebtDate, setInitialDebtDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [initialDebtDescription, setInitialDebtDescription] = useState('');

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

  // Pagination states for Customers
  const [customerPage, setCustomerPage] = useState(1);
  const [customerPageSize, setCustomerPageSize] = useState(12);

  // Pagination states for Modal Statement / Transactions
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);

  // Reset customer page on search
  React.useEffect(() => {
    setCustomerPage(1);
  }, [searchQuery]);

  // Reset modal history page on customer selection or tab change
  React.useEffect(() => {
    setHistoryPage(1);
  }, [selectedCustomer?.id, historyTab]);

  const openPaymentModal = (customer: Customer, initialMode: 'partial' | 'total' = 'partial', specificWithdrawalId?: string) => {
    setPayingCustomer(customer);
    const debt = customer.currentBalance > 0 ? customer.currentBalance : 0;
    setPaymentMode(initialMode);

    // Get pending/partial withdrawals of this customer
    const custWithdrawals = appState.withdrawals.filter(w => 
      w.customerId === customer.id && 
      w.status !== 'cancelled' && 
      w.status !== 'returned'
    );
    const pendingWithdrawals = custWithdrawals.filter(w => {
      const rem = w.remainingAmount !== undefined ? w.remainingAmount : Math.max(0, w.totalAmount - (w.paidAmount || 0));
      return rem > 0 && w.status !== 'paid';
    });

    if (specificWithdrawalId) {
      setSelectedWithdrawalIdsToPay([specificWithdrawalId]);
      const targetW = custWithdrawals.find(w => w.id === specificWithdrawalId);
      const rem = targetW 
        ? (targetW.remainingAmount !== undefined ? targetW.remainingAmount : Math.max(0, targetW.totalAmount - (targetW.paidAmount || 0)))
        : debt;
      setPaymentAmount(rem > 0 ? rem : (debt > 0 ? debt : ''));
      setPaymentNotes(`Pago de Remito #${targetW?.withdrawalNumber || specificWithdrawalId}`);
    } else if (initialMode === 'total') {
      setSelectedWithdrawalIdsToPay(pendingWithdrawals.map(w => w.id));
      setPaymentAmount(debt);
      setPaymentNotes('Cancelación total de saldo');
    } else {
      setSelectedWithdrawalIdsToPay([]);
      setPaymentAmount(debt > 0 ? Math.round(debt / 2) : '');
      setPaymentNotes(debt > 0 ? 'Pago parcial / Entrega a cuenta' : '');
    }

    setPaymentMethod('cash');
    setPaymentNextPromiseDate('');
    setPaymentDate(new Date().toISOString().slice(0, 16));
    setPaymentEmitInvoice(false);
    setIsPaymentModalOpen(true);
  };

  const paginatedCustomers = filteredCustomers.slice(
    (customerPage - 1) * customerPageSize,
    customerPage * customerPageSize
  );

  const totalDebt = appState.customers.reduce((acc, c) => acc + (c.currentBalance > 0 ? c.currentBalance : 0), 0);
  const totalCreditInFavor = appState.customers.reduce((acc, c) => acc + (c.currentBalance < 0 ? Math.abs(c.currentBalance) : 0), 0);

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer?.name) return;

    const existingCustomer = editingCustomer.id
      ? appState.customers.find(c => c.id === editingCustomer.id)
      : null;

    const newBalance = Number(editingCustomer.currentBalance) || 0;
    const isNew = !existingCustomer;

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

    await DataService.saveCustomer(custToSave);

    // Si es un nuevo cliente con saldo inicial deudor, registrar la transacción con la fecha de retiro
    if (isNew && newBalance > 0) {
      const txDate = initialDebtDate ? new Date(initialDebtDate).toISOString() : new Date().toISOString();
      const initialTx: CustomerTransaction = {
        id: `tx-init-${Date.now()}`,
        customerId: custToSave.id,
        customerName: custToSave.name,
        type: 'charge',
        amount: newBalance,
        balanceAfter: newBalance,
        date: txDate,
        description: initialDebtDescription.trim() || 'Saldo inicial / Mercadería retirada previa'
      };
      await DataService.saveCustomerTransaction(initialTx);
    } else if (existingCustomer && existingCustomer.currentBalance !== newBalance) {
      // Si se modificó manualmente el saldo en un cliente existente, registrar y guardar transacción de auditoría
      const diff = newBalance - existingCustomer.currentBalance;
      const txDate = initialDebtDate ? new Date(initialDebtDate).toISOString() : new Date().toISOString();
      const auditTx: CustomerTransaction = {
        id: `tx-adj-${Date.now()}`,
        customerId: custToSave.id,
        customerName: custToSave.name,
        type: diff > 0 ? 'charge' : 'adjustment',
        amount: Math.abs(diff),
        balanceAfter: newBalance,
        date: txDate,
        description: initialDebtDescription.trim() || `Ajuste de Saldo (${diff > 0 ? 'Aumento Deuda +' : 'Reducción Deuda -'}$${Math.abs(diff).toLocaleString('es-AR')})`
      };
      await DataService.saveCustomerTransaction(auditTx);
    }

    setIsCustomerModalOpen(false);
    setEditingCustomer(null);
    setInitialDebtDescription('');
    setInitialDebtDate(new Date().toISOString().slice(0, 16));
  };

  const handleRegisterCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargingCustomer || !chargeAmount || Number(chargeAmount) <= 0) return;

    const amt = Number(chargeAmount);
    const formattedDate = chargeDate ? new Date(chargeDate).toISOString() : new Date().toISOString();

    await DataService.registerCustomerCharge({
      customerId: chargingCustomer.id,
      amount: amt,
      description: chargeDescription.trim() || 'Cargo a Cuenta Corriente / Mercadería Retirada',
      date: formattedDate,
      reference: chargeReference.trim() || undefined
    });

    setIsChargeModalOpen(false);
    setChargingCustomer(null);
    setChargeAmount('');
    setChargeDescription('');
    setChargeReference('');
    setChargeDate(new Date().toISOString().slice(0, 16));

    alert(`¡$${amt.toLocaleString('es-AR')} cargados con éxito a la cuenta corriente del cliente!`);
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
    const debt = payingCustomer.currentBalance || 0;
    const isPartialPayment = paymentMode === 'partial' || (amt < debt);

    let effectiveNotes = paymentNotes.trim();
    if (!effectiveNotes) {
      if (debt - amt < 0) {
        effectiveNotes = `Entrega de dinero - Saldo a favor resultante: +$${Math.abs(debt - amt).toLocaleString('es-AR')}`;
      } else {
        effectiveNotes = isPartialPayment
          ? `Pago Parcial / Entrega a cuenta - Resta: $${Math.max(0, debt - amt).toLocaleString('es-AR')}`
          : 'Cancelación total de saldo';
      }
    }

    if (paymentNextPromiseDate && (debt - amt > 0)) {
      effectiveNotes += ` (Compromiso saldo resto: ${new Date(paymentNextPromiseDate).toLocaleDateString('es-AR')})`;
    }

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
      effectiveNotes = `Cheque N° ${chequeNumber} (${chequeBank}) ${effectiveNotes ? '- ' + effectiveNotes : ''}`;
    }

    const createdTx = await DataService.registerCustomerPayment({
      customerId: payingCustomer.id,
      amount: amt,
      paymentMethod,
      notes: effectiveNotes,
      isPartial: isPartialPayment,
      nextPromiseDate: (debt - amt > 0 && paymentNextPromiseDate) ? paymentNextPromiseDate : undefined,
      date: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
      paidWithdrawalIds: selectedWithdrawalIdsToPay.length > 0 ? selectedWithdrawalIdsToPay : undefined
    });

    if (shouldEmitPDF || paymentEmitInvoice) {
      if (paymentEmitInvoice) {
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
              productName: isPartialPayment ? `Entrega / Pago Parcial a Cuenta (${payingCustomer.name})` : `Cancelación Total Saldo (${payingCustomer.name})`,
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
      } else if (createdTx) {
        generateCustomerPaymentReceiptPDF(createdTx, payingCustomer, appState.storeInfo);
      }
    }

    setIsPaymentModalOpen(false);
    setPayingCustomer(null);
    setPaymentAmount('');
    setPaymentNotes('');
    setPaymentNextPromiseDate('');
    setPaymentEmitInvoice(false);
    setSelectedWithdrawalIdsToPay([]);
    setChequeNumber('');
    setChequeBank('Banco Galicia');
    setChequeIssuerName('');
    setChequeIssuerCuit('');
    setChequeDueDate('');
    setChequeNotes('');

    const remaining = debt - amt;
    const successMsg = remaining < 0
      ? `¡Cobro de $${amt.toLocaleString('es-AR')} registrado con éxito! El cliente canceló su saldo y le quedan $${Math.abs(remaining).toLocaleString('es-AR')} de Saldo a Favor${(shouldEmitPDF || paymentEmitInvoice) ? ' (Comprobante impreso en PDF)' : ''}.`
      : isPartialPayment && remaining > 0
      ? `¡Pago parcial de $${amt.toLocaleString('es-AR')} registrado! Quedan $${remaining.toLocaleString('es-AR')} pendientes para abonar luego${(shouldEmitPDF || paymentEmitInvoice) ? ' (Comprobante impreso en PDF)' : ''}.`
      : `¡Cobro de $${amt.toLocaleString('es-AR')} registrado con éxito! Cuenta al día ($0)${(shouldEmitPDF || paymentEmitInvoice) ? ' (Comprobante impreso en PDF)' : ''}.`;

    alert(successMsg);
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
              setInitialDebtDate(new Date().toISOString().slice(0, 16));
              setInitialDebtDescription('');
              setIsCustomerModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* KPI Total Debt & Credit Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-blue-300 tracking-wider">Total Deuda Acumulada Cuentas Corrientes</span>
            <div className="text-3xl font-extrabold text-white mt-1">
              ${totalDebt.toLocaleString('es-AR')}
            </div>
          </div>
          <div className="text-xs text-blue-200 mt-2">
            <span className="font-bold text-white">{appState.customers.filter(c => c.currentBalance > 0).length} clientes</span> con saldo pendiente a cobrar
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-emerald-300 tracking-wider">Total Saldo a Favor de Clientes</span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-1">
              +${totalCreditInFavor.toLocaleString('es-AR')}
            </div>
          </div>
          <div className="text-xs text-emerald-200 mt-2">
            <span className="font-bold text-white">{appState.customers.filter(c => c.currentBalance < 0).length} clientes</span> con saldo a favor por entregas o cheques
          </div>
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
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-400 text-xs">
            No se encontraron clientes que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedCustomers.map(customer => {
              const isOverLimit = customer.currentBalance > customer.creditLimit;
              const hasDebt = customer.currentBalance > 0;
              const hasCreditInFavor = customer.currentBalance < 0;

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
                              setInitialDebtDate(new Date().toISOString().slice(0, 16));
                              setInitialDebtDescription('');
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
                        hasCreditInFavor ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs' :
                        hasDebt ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isOverLimit ? 'Límite Excedido' : hasCreditInFavor ? `Saldo a Favor: +$${Math.abs(customer.currentBalance).toLocaleString('es-AR')}` : hasDebt ? 'Con Deuda' : 'Al Día ($0)'}
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
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Límite de Crédito:</span>
                        <span className="font-semibold">${customer.creditLimit.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                        <span>{hasCreditInFavor ? 'Saldo a Favor del Cliente:' : 'Saldo Deuda Actual:'}</span>
                        <span className={hasDebt ? 'text-red-600 font-extrabold text-sm' : hasCreditInFavor ? 'text-emerald-600 font-extrabold text-sm' : 'text-slate-700 font-bold text-sm'}>
                          {hasCreditInFavor ? `+$${Math.abs(customer.currentBalance).toLocaleString('es-AR')}` : `$${customer.currentBalance.toLocaleString('es-AR')}`}
                        </span>
                      </div>
                      {customer.lastPaymentAmount && customer.lastPaymentDate && (
                        <div className="flex justify-between items-center text-[10px] text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded border border-emerald-100 font-medium">
                          <span>Última entrega:</span>
                          <span className="font-bold">
                            +${customer.lastPaymentAmount.toLocaleString('es-AR')} ({new Date(customer.lastPaymentDate).toLocaleDateString('es-AR')})
                          </span>
                        </div>
                      )}
                      {customer.nextPaymentPromiseDate && customer.currentBalance > 0 && (
                        <div className="flex justify-between items-center text-[10px] text-amber-800 bg-amber-50/80 px-2 py-1 rounded border border-amber-200 font-medium">
                          <span>Compromiso resto:</span>
                          <span className="font-bold">
                            {new Date(customer.nextPaymentPromiseDate).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center space-x-1.5 border-t border-slate-100 flex-wrap gap-y-1.5">
                    <button
                      onClick={() => {
                        setChargingCustomer(customer);
                        setChargeAmount('');
                        setChargeDate(new Date().toISOString().slice(0, 16));
                        setChargeDescription('');
                        setChargeReference('');
                        setIsChargeModalOpen(true);
                      }}
                      className="py-2 px-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center space-x-1 transition-colors shadow-xs"
                      title="Cargar deuda / mercadería retirada a cuenta corriente"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Cargar</span>
                    </button>
                    <button
                      onClick={() => openPaymentModal(customer, 'partial')}
                      className="flex-1 min-w-[130px] py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1 transition-colors shadow-xs"
                      title="Registrar entrega a cuenta o cancelación total"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Cobrar / Pago Parcial</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setHistoryTab('payments');
                      }}
                      className="py-2 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center space-x-1 transition-colors"
                      title="Ver Historial de Pagos y Entregas"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pagos</span>
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
                        setInitialDebtDate(new Date().toISOString().slice(0, 16));
                        setInitialDebtDescription('');
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
        )}

        {/* Pagination for Customers */}
        {filteredCustomers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <Pagination
              currentPage={customerPage}
              totalItems={filteredCustomers.length}
              pageSize={customerPageSize}
              onPageChange={setCustomerPage}
              onPageSizeChange={setCustomerPageSize}
              pageSizeOptions={[6, 12, 24, 48]}
              itemLabel="clientes"
            />
          </div>
        )}
      </div>

      {/* Account Statement History Modal */}
      {selectedCustomer && (() => {
        const activeCustomer = appState.customers.find(c => c.id === selectedCustomer.id) || selectedCustomer;
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Estado de Cuenta Corriente e Historial Detallado</h3>
                  <span className="text-xs text-slate-500 font-semibold">{activeCustomer.name} (DNI/CUIT: {activeCustomer.dniCuit || 'Sin registrar'})</span>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border text-xs">
                <div>
                  <span className="text-slate-500">Límite Crédito:</span> <span className="font-bold">${activeCustomer.creditLimit.toLocaleString('es-AR')}</span>
                </div>
                <div>
                  <span className="text-slate-500">Saldo Deuda Actual:</span> <span className="font-extrabold text-red-600 text-sm">${activeCustomer.currentBalance.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openPaymentModal(activeCustomer, 'partial')}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-500 flex items-center space-x-1 shadow-xs text-[11px]"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Cobrar / Pago Parcial</span>
                  </button>

                  <button
                    onClick={() => {
                      setChargingCustomer(activeCustomer);
                      setChargeAmount('');
                      setChargeDate(new Date().toISOString().slice(0, 16));
                      setChargeDescription('');
                      setChargeReference('');
                      setIsChargeModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-500 flex items-center space-x-1 shadow-xs text-[11px]"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Cargar Deuda / Retiro</span>
                  </button>

                  <button
                    onClick={() => {
                      const txs = appState.customerTransactions.filter(t => t.customerId === activeCustomer.id);
                      generateCustomerAccountStatementPDF(activeCustomer, txs, appState.storeInfo);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-500 flex items-center space-x-1 shadow-xs text-[11px]"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Resumen Cta Cte PDF</span>
                  </button>

                  <button
                    onClick={() => {
                      const custTxs = appState.customerTransactions.filter(t => t.customerId === activeCustomer.id && (t.type === 'sale' || t.type === 'withdrawal_billing' || t.type === 'charge'));
                      const itemsForDebt: { code: string; description: string; quantity: number; unitPrice: number; discount: number; total: number; remitoNumber: string }[] = [];

                      custTxs.forEach(t => {
                        const relSale = t.saleId ? appState.sales.find(s => s.id === t.saleId) : null;
                        const relW = t.withdrawalId ? appState.withdrawals.find(w => w.id === t.withdrawalId) : null;

                        if (relSale) {
                          relSale.items.forEach(i => {
                            itemsForDebt.push({
                              code: i.code || '001',
                              description: i.productName,
                              quantity: i.quantity,
                              unitPrice: i.unitPrice,
                              discount: 0,
                              total: i.subtotal,
                              remitoNumber: relSale.invoiceNumber.replace(/^FC-/, '')
                            });
                          });
                        } else if (relW) {
                          relW.items.forEach(i => {
                            itemsForDebt.push({
                              code: i.productCode || '001',
                              description: i.productName,
                              quantity: i.quantity,
                              unitPrice: i.unitPrice,
                              discount: 0,
                              total: i.totalPrice,
                              remitoNumber: relW.withdrawalNumber
                            });
                          });
                        } else if (t.type === 'charge') {
                          itemsForDebt.push({
                            code: t.reference || 'RET-01',
                            description: t.description || 'Mercadería retirada a cuenta corriente',
                            quantity: 1,
                            unitPrice: t.amount,
                            discount: 0,
                            total: t.amount,
                            remitoNumber: t.reference || new Date(t.date).toLocaleDateString('es-AR')
                          });
                        }
                      });

                      if (itemsForDebt.length === 0) {
                        itemsForDebt.push({
                          code: '001',
                          description: 'Saldo Deuda Pendiente en Cuenta Corriente',
                          quantity: 1,
                          unitPrice: activeCustomer.currentBalance,
                          discount: 0,
                          total: activeCustomer.currentBalance,
                          remitoNumber: 'CC-01'
                        });
                      }

                      generateDebtDetailPDF(activeCustomer, itemsForDebt, appState.storeInfo);
                    }}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 flex items-center space-x-1 shadow-xs text-[11px]"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>📋 Detalle de Deuda (Remitos)</span>
                  </button>
                </div>
              </div>

              {(() => {
                const custTransactions = appState.customerTransactions.filter(t => t.customerId === activeCustomer.id);
                const custPayments = custTransactions.filter(t => t.type === 'payment');
                const custDebts = custTransactions.filter(t => t.type === 'sale' || t.type === 'withdrawal_billing' || t.type === 'charge');

                const totalPaid = custPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

                const displayedTxs = historyTab === 'payments'
                  ? custPayments
                  : historyTab === 'debts'
                  ? custDebts
                  : custTransactions;

                const paginatedCustTransactions = displayedTxs.slice(
                  (historyPage - 1) * historyPageSize,
                  historyPage * historyPageSize
                );

                return (
                  <div className="space-y-3">
                    {/* Navigation Tabs */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                      <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                        <button
                          onClick={() => setHistoryTab('payments')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                            historyTab === 'payments'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                          }`}
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Historial de Pagos y Entregas</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                            historyTab === 'payments' ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {custPayments.length}
                          </span>
                        </button>

                        <button
                          onClick={() => setHistoryTab('all')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                            historyTab === 'all'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                          }`}
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Todos los Movimientos</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                            historyTab === 'all' ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {custTransactions.length}
                          </span>
                        </button>

                        <button
                          onClick={() => setHistoryTab('debts')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                            historyTab === 'debts'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                          }`}
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>Compras & Deudas</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                            historyTab === 'debts' ? 'bg-amber-800 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {custDebts.length}
                          </span>
                        </button>
                      </div>

                      {activeCustomer.currentBalance > 0 && (
                        <button
                          onClick={() => openPaymentModal(activeCustomer, 'partial')}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors shadow-xs"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>+ Registrar Pago Parcial / Entrega</span>
                        </button>
                      )}
                    </div>

                    {/* KPI Cards when in payments tab */}
                    {historyTab === 'payments' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                        <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Pagado Histórico</span>
                          <span className="text-base font-black text-emerald-700 mt-0.5 block">
                            +${totalPaid.toLocaleString('es-AR')}
                          </span>
                          <span className="text-[10px] text-emerald-600/80">
                            {custPayments.length} pago{custPayments.length === 1 ? '' : 's'} / entrega{custPayments.length === 1 ? '' : 's'}
                          </span>
                        </div>

                        <div className="bg-red-50 border border-red-200/80 rounded-xl p-2.5">
                          <span className="text-[10px] uppercase font-bold text-red-700 block">Saldo Restante Deudor</span>
                          <span className="text-base font-black text-red-600 mt-0.5 block">
                            ${activeCustomer.currentBalance.toLocaleString('es-AR')}
                          </span>
                          <span className="text-[10px] text-red-600/80">
                            {activeCustomer.currentBalance <= 0 ? 'Sin saldo pendiente' : 'Deuda actual a saldar'}
                          </span>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                          <span className="text-[10px] uppercase font-bold text-slate-600 block">Último Pago Registrado</span>
                          <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                            {activeCustomer.lastPaymentAmount ? `+$${activeCustomer.lastPaymentAmount.toLocaleString('es-AR')}` : 'Sin pagos recientes'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {activeCustomer.lastPaymentDate ? new Date(activeCustomer.lastPaymentDate).toLocaleDateString('es-AR') : '—'}
                          </span>
                        </div>

                        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-2.5">
                          <span className="text-[10px] uppercase font-bold text-amber-800 block">Compromiso Resto</span>
                          <span className="text-xs font-bold text-amber-900 mt-0.5 block flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>
                              {activeCustomer.nextPaymentPromiseDate 
                                ? new Date(activeCustomer.nextPaymentPromiseDate + 'T00:00:00').toLocaleDateString('es-AR') 
                                : 'Sin fecha prometida'}
                            </span>
                          </span>
                          <span className="text-[10px] text-amber-700/80">
                            {activeCustomer.nextPaymentPromiseDate ? 'Próximo vencimiento pactado' : 'Acuerdo flexible'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="border rounded-xl shadow-xs overflow-hidden bg-white">
                      <div className="max-h-80 overflow-y-auto">
                        {/* Table for Payments Tab */}
                        {historyTab === 'payments' ? (
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[10px] sticky top-0 z-10">
                              <tr>
                                <th className="p-2.5">Fecha y Hora</th>
                                <th className="p-2.5">N° Recibo</th>
                                <th className="p-2.5">Concepto & Medio</th>
                                <th className="p-2.5">Modalidad de Pago</th>
                                <th className="p-2.5 text-right">Monto Abonado</th>
                                <th className="p-2.5 text-right">Saldo Restante</th>
                                <th className="p-2.5 text-center">Recibo PDF</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {custPayments.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="text-center py-8 text-slate-400">
                                    <DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="font-medium text-slate-500">No se registran pagos o entregas para este cliente aún.</p>
                                    <p className="text-[11px] text-slate-400 mt-1">Utilice el botón "Cobrar / Pago Parcial" para asentar una entrega a cuenta.</p>
                                  </td>
                                </tr>
                              ) : (
                                paginatedCustTransactions.map(tx => {
                                  const formattedDate = new Date(tx.date).toLocaleString('es-AR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  });

                                  const remBalance = tx.remainingBalance !== undefined ? tx.remainingBalance : tx.balanceAfter;

                                  return (
                                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                                      <td className="p-2.5 text-slate-700 font-mono text-[11px] whitespace-nowrap font-medium">
                                        <div className="flex items-center space-x-1.5">
                                          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                          <span>{formattedDate}</span>
                                        </div>
                                      </td>
                                      <td className="p-2.5 font-mono text-slate-700 text-[11px] whitespace-nowrap">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded font-bold border border-slate-200">
                                          {tx.reference || `REC-${tx.id.slice(-6)}`}
                                        </span>
                                      </td>
                                      <td className="p-2.5 font-medium text-slate-800 space-y-0.5">
                                        <div className="font-semibold text-slate-900">{tx.description}</div>
                                        <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                                          <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-semibold text-slate-700">
                                            {tx.paymentMethod === 'cash' ? '💵 Efectivo' :
                                             tx.paymentMethod === 'transfer' ? '🏦 Transferencia' :
                                             tx.paymentMethod === 'cheque' ? '🧾 Cheque' : '💳 Pago'}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="p-2.5 whitespace-nowrap">
                                        {tx.isPartial ? (
                                          <div>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                                              Entrega Parcial
                                            </span>
                                            {tx.nextPromiseDate && (
                                              <div className="text-[10px] text-amber-700 font-medium mt-0.5 flex items-center space-x-1">
                                                <Calendar className="w-3 h-3 text-amber-600 shrink-0" />
                                                <span>Promesa: {new Date(tx.nextPromiseDate + 'T00:00:00').toLocaleDateString('es-AR')}</span>
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                            Cancelación Total
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-2.5 text-right font-extrabold text-emerald-600 whitespace-nowrap text-sm">
                                        +${tx.amount.toLocaleString('es-AR')}
                                      </td>
                                      <td className="p-2.5 text-right font-extrabold whitespace-nowrap">
                                        {remBalance > 0 ? (
                                          <span className="text-red-600">${remBalance.toLocaleString('es-AR')}</span>
                                        ) : (
                                          <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                                            Saldado $0
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-2.5 text-center whitespace-nowrap">
                                        <button
                                          onClick={() => generateCustomerPaymentReceiptPDF(tx, activeCustomer, appState.storeInfo)}
                                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs flex items-center space-x-1 transition-colors mx-auto border border-emerald-200"
                                          title="Reimprimir Recibo de Pago"
                                        >
                                          <Printer className="w-3.5 h-3.5" />
                                          <span className="text-[10px]">Recibo</span>
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        ) : historyTab === 'debts' ? (
                          /* Detailed Remitos & Products Withdrawn View */
                          <div className="p-3 space-y-3">
                            {(() => {
                              const custWithdrawals = appState.withdrawals.filter(w => 
                                w.customerId === activeCustomer.id &&
                                w.status !== 'cancelled' &&
                                w.status !== 'returned'
                              );

                              const otherDebtTxs = custDebts.filter(t => 
                                !custWithdrawals.some(w => w.id === t.withdrawalId || (t.saleId && w.saleId === t.saleId))
                              );

                              if (custWithdrawals.length === 0 && otherDebtTxs.length === 0) {
                                return (
                                  <div className="text-center py-10 text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="font-semibold text-slate-600">No hay remitos ni compras a crédito registradas para este cliente.</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Cuando retire mercadería o compre a cuenta corriente, aparecerá aquí con todo su detalle.</p>
                                  </div>
                                );
                              }

                              return (
                                <div className="space-y-3">
                                  {custWithdrawals.map(w => {
                                    const prevPaid = Number(w.paidAmount) || 0;
                                    const remaining = w.remainingAmount !== undefined 
                                      ? Number(w.remainingAmount) 
                                      : Math.max(0, Number(w.totalAmount) - prevPaid);
                                    const isFullyPaid = remaining <= 0 || w.status === 'paid';
                                    const isPartial = prevPaid > 0 && remaining > 0;

                                    return (
                                      <div
                                        key={w.id}
                                        className={`border rounded-xl p-3.5 transition-all ${
                                          isFullyPaid 
                                            ? 'bg-slate-50/70 border-slate-200' 
                                            : isPartial 
                                            ? 'bg-amber-50/40 border-amber-300 shadow-xs' 
                                            : 'bg-white border-slate-200 shadow-xs'
                                        }`}
                                      >
                                        {/* Remito Header */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                          <div className="flex items-center space-x-2">
                                            <span className="font-extrabold text-slate-900 text-xs font-mono">{w.withdrawalNumber}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                              isFullyPaid ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                              isPartial ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                              'bg-rose-100 text-rose-800 border border-rose-300'
                                            }`}>
                                              {isFullyPaid ? '✓ Pagado Totalmente' : isPartial ? '⚠️ Pago Parcial' : '⏳ Pendiente de Pago'}
                                            </span>
                                            {w.saleId && (
                                              <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-semibold border border-indigo-200">
                                                🛒 Venta Mostrador
                                              </span>
                                            )}
                                          </div>

                                          <div className="text-[11px] text-slate-500 font-medium flex items-center space-x-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                            <span>
                                              {new Date(w.date).toLocaleString('es-AR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Products Table - Lo que sacó ese día */}
                                        <div className="mt-2.5 overflow-x-auto">
                                          <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-100/80 text-slate-600 font-semibold uppercase text-[10px]">
                                              <tr>
                                                <th className="px-2.5 py-1 rounded-l">Código</th>
                                                <th className="px-2.5 py-1">Artículo Retirado ese día</th>
                                                <th className="px-2.5 py-1 text-center">Cantidad</th>
                                                <th className="px-2.5 py-1 text-right">Precio Unit. ($)</th>
                                                <th className="px-2.5 py-1 text-right rounded-r">Subtotal ($)</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-xs">
                                              {(w.items || []).map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/60">
                                                  <td className="px-2.5 py-1 font-mono text-slate-500 text-[11px]">{item.productCode || '-'}</td>
                                                  <td className="px-2.5 py-1 font-medium text-slate-900">{item.productName}</td>
                                                  <td className="px-2.5 py-1 text-center font-bold text-slate-800">{item.quantity}</td>
                                                  <td className="px-2.5 py-1 text-right font-mono text-slate-600">${item.unitPrice.toLocaleString('es-AR')}</td>
                                                  <td className="px-2.5 py-1 text-right font-bold text-slate-900 font-mono">${item.totalPrice.toLocaleString('es-AR')}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>

                                        {/* Remito Footer with Financials & Quick Action */}
                                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-slate-50/80 p-2 rounded-lg text-xs">
                                          <div className="flex flex-wrap items-center gap-3">
                                            <div>
                                              <span className="text-slate-500 text-[11px]">Total: </span>
                                              <span className="font-extrabold text-slate-900 font-mono">${w.totalAmount.toLocaleString('es-AR')}</span>
                                            </div>
                                            {prevPaid > 0 && (
                                              <div>
                                                <span className="text-emerald-700 text-[11px]">Abonado: </span>
                                                <span className="font-bold text-emerald-700 font-mono">+${prevPaid.toLocaleString('es-AR')}</span>
                                              </div>
                                            )}
                                            <div>
                                              <span className="text-slate-500 text-[11px]">Resta Abonar: </span>
                                              <span className={`font-black font-mono text-sm ${remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                ${remaining.toLocaleString('es-AR')}
                                              </span>
                                            </div>
                                          </div>

                                          <div className="flex items-center space-x-1.5">
                                            <button
                                              onClick={() => generateWithdrawalReceiptPDF(w, appState.storeInfo)}
                                              className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs flex items-center space-x-1 transition-colors"
                                              title="Imprimir Remito Oficial PDF"
                                            >
                                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                                              <span>Remito PDF</span>
                                            </button>

                                            {!isFullyPaid && (
                                              <button
                                                onClick={() => openPaymentModal(activeCustomer, 'partial', w.id)}
                                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center space-x-1 shadow-xs transition-colors"
                                                title="Cobrar o abonar este remito específicamente"
                                              >
                                                <DollarSign className="w-3.5 h-3.5" />
                                                <span>Pagar este Remito</span>
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* Other debt transactions if any */}
                                  {otherDebtTxs.map(tx => (
                                    <div key={tx.id} className="border border-slate-200 rounded-xl p-3 bg-white flex items-center justify-between text-xs">
                                      <div>
                                        <span className="font-bold text-slate-900">{tx.description}</span>
                                        <p className="text-[10px] text-slate-500">
                                          Fecha: {new Date(tx.date).toLocaleDateString('es-AR')} {tx.reference ? `| Ref: ${tx.reference}` : ''}
                                        </p>
                                      </div>
                                      <div className="flex items-center space-x-3">
                                        <span className="font-black text-rose-600 font-mono text-sm">
                                          ${tx.amount.toLocaleString('es-AR')}
                                        </span>
                                        <button
                                          onClick={() => openPaymentModal(activeCustomer, 'partial')}
                                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                                        >
                                          Abonar
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          /* General Ledger Table */
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[10px] sticky top-0 z-10">
                              <tr>
                                <th className="p-2.5">Fecha y Hora</th>
                                <th className="p-2.5">Concepto & Mercadería</th>
                                <th className="p-2.5">Tipo Movimiento</th>
                                <th className="p-2.5 text-right">Monto ($)</th>
                                <th className="p-2.5 text-right">Saldo Deudor</th>
                                <th className="p-2.5 text-center">Comprobante</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {displayedTxs.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="text-center py-6 text-slate-400">
                                    No hay registros para mostrar en esta sección.
                                  </td>
                                </tr>
                              ) : (
                                paginatedCustTransactions.map(tx => {
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
                                      generateCustomerPaymentReceiptPDF(tx, activeCustomer, appState.storeInfo);
                                    }
                                  };

                                  return (
                                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                                      <td className="p-2.5 text-slate-700 font-mono text-[11px] whitespace-nowrap font-medium">
                                        <div className="flex items-center space-x-1.5">
                                          <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                          <span>{formattedDate}</span>
                                        </div>
                                      </td>
                                      <td className="p-2.5 font-medium text-slate-800 space-y-1">
                                        <div className="font-semibold text-slate-900">{tx.description}</div>
                                        {tx.reference && (
                                          <div className="text-[10px] text-slate-500 font-mono">
                                            Ref / Comprobante: <span className="font-bold text-slate-700">{tx.reference}</span>
                                          </div>
                                        )}
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
                                          tx.type === 'withdrawal_billing' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                                          tx.type === 'charge' ? 'bg-red-100 text-red-800 border border-red-300' :
                                          tx.type === 'payment' ? (tx.isPartial ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300') :
                                          'bg-purple-100 text-purple-800 border border-purple-200'
                                        }`}>
                                          {tx.type === 'sale' ? 'Venta Cta Cte' :
                                           tx.type === 'withdrawal_billing' ? 'Retiro Mercadería' :
                                           tx.type === 'charge' ? 'Retiro / Cargo Deuda' :
                                           tx.type === 'payment' ? (tx.isPartial ? 'Entrega Parcial' : 'Cancelación Total') : 'Ajuste Manual'}
                                        </span>
                                      </td>
                                      <td className={`p-2.5 text-right font-extrabold whitespace-nowrap ${
                                        tx.type === 'payment' ? 'text-emerald-600' :
                                        tx.type === 'adjustment' ? 'text-purple-700' :
                                        (tx.type === 'charge' || tx.type === 'withdrawal_billing') ? 'text-red-600 font-black' : 'text-slate-900'
                                      }`}>
                                        {tx.type === 'payment' ? `-$${tx.amount.toLocaleString('es-AR')}` : `+$${tx.amount.toLocaleString('es-AR')}`}
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
                                })
                              )}
                            </tbody>
                          </table>
                        )}
                      </div>

                      <Pagination
                        currentPage={historyPage}
                        totalItems={displayedTxs.length}
                        pageSize={historyPageSize}
                        onPageChange={setHistoryPage}
                        onPageSizeChange={setHistoryPageSize}
                        pageSizeOptions={[5, 10, 20, 50]}
                        itemLabel={historyTab === 'payments' ? "pagos" : historyTab === 'debts' ? "deudas" : "movimientos"}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}

      {/* Payment Entry Modal */}
      {isPaymentModalOpen && payingCustomer && (() => {
        const debt = payingCustomer.currentBalance || 0;
        const currentPayment = typeof paymentAmount === 'number' ? paymentAmount : 0;
        const remainingBalance = Math.round((debt - currentPayment) * 100) / 100;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs max-h-[92vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-black text-slate-900 text-base">Registrar Cobro / Entrega a Cuenta</h3>
                  <p className="text-xs text-slate-500 font-semibold">{payingCustomer.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Debt Overview Banner */}
              <div className={`p-3.5 rounded-xl flex items-center justify-between shadow-xs ${
                debt > 0 ? 'bg-slate-900 text-white' : debt < 0 ? 'bg-emerald-900 text-white' : 'bg-slate-800 text-white'
              }`}>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                    {debt > 0 ? 'Deuda Actual en Cuenta Corriente' : debt < 0 ? 'Saldo a Favor Actual del Cliente' : 'Estado de Cuenta Corriente'}
                  </span>
                  <div className={`text-xl font-black mt-0.5 ${debt < 0 ? 'text-emerald-300' : 'text-white'}`}>
                    {debt > 0 ? `$${debt.toLocaleString('es-AR')}` : debt < 0 ? `+$${Math.abs(debt).toLocaleString('es-AR')} (A Favor)` : 'Al Día ($0)'}
                  </div>
                </div>
                {payingCustomer.creditLimit > 0 && (
                  <div className="text-right text-[11px] text-slate-300">
                    <span className="block text-[10px] text-slate-400">Límite disponible:</span>
                    <span className="font-bold text-indigo-300">
                      ${Math.max(0, payingCustomer.creditLimit - debt).toLocaleString('es-AR')}
                    </span>
                  </div>
                )}
              </div>

              {/* Selector de Remitos / Compras específicas a imputar */}
              {(() => {
                const customerWithdrawals = (appState.withdrawals || []).filter(w =>
                  w.customerId === payingCustomer.id &&
                  w.status !== 'cancelled' &&
                  w.status !== 'returned' &&
                  w.status !== 'paid' &&
                  ((w.remainingAmount !== undefined ? w.remainingAmount : w.totalAmount) > 0)
                );

                if (customerWithdrawals.length === 0) return null;

                return (
                  <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-200/90 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-indigo-950 flex items-center space-x-1.5 text-xs">
                        <Package className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>Seleccionar Remitos / Compras a Pagar:</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            const allIds = customerWithdrawals.map(w => w.id);
                            setSelectedWithdrawalIdsToPay(allIds);
                            const sum = customerWithdrawals.reduce((acc, w) => acc + (w.remainingAmount !== undefined ? w.remainingAmount : w.totalAmount), 0);
                            setPaymentAmount(sum);
                            setPaymentNotes(`Cancelación de ${allIds.length} remito(s) seleccionados`);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-extrabold underline cursor-pointer"
                        >
                          Marcar Todos
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedWithdrawalIdsToPay([]);
                          }}
                          className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                        >
                          Desmarcar
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-600">
                      Seleccione las compras específicas que el cliente abona hoy. Si entrega más dinero o cheque, le quedará dinero a favor:
                    </p>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {customerWithdrawals.map(w => {
                        const isSelected = selectedWithdrawalIdsToPay.includes(w.id);
                        const rem = w.remainingAmount !== undefined ? w.remainingAmount : w.totalAmount;
                        const paid = w.paidAmount || 0;
                        const remitoNum = w.withdrawalNumber || (w.id.startsWith('with-sale-') ? `REM-${w.id.replace('with-sale-', '').slice(0, 8)}` : w.id);
                        const itemsSummary = w.items?.map(i => `${i.productName} (x${i.quantity})`).join(', ') || 'Sin detalle de items';

                        return (
                          <div
                            key={w.id}
                            onClick={() => {
                              let next: string[];
                              if (isSelected) {
                                next = selectedWithdrawalIdsToPay.filter(id => id !== w.id);
                              } else {
                                next = [...selectedWithdrawalIdsToPay, w.id];
                              }
                              setSelectedWithdrawalIdsToPay(next);
                              if (next.length > 0) {
                                const totalRem = customerWithdrawals
                                  .filter(pw => next.includes(pw.id))
                                  .reduce((acc, pw) => acc + (pw.remainingAmount !== undefined ? pw.remainingAmount : pw.totalAmount), 0);
                                setPaymentAmount(totalRem);
                                setPaymentNotes(`Pago remito(s): ${next.map(id => {
                                  const item = customerWithdrawals.find(x => x.id === id);
                                  return item?.withdrawalNumber || id.slice(0, 10);
                                }).join(', ')}`);
                              }
                            }}
                            className={`p-2.5 rounded-lg border text-[11px] cursor-pointer transition-all flex items-start space-x-2.5 ${
                              isSelected
                                ? 'bg-indigo-100/80 border-indigo-500 shadow-xs ring-1 ring-indigo-400'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer pointer-events-none shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between font-bold">
                                <span className="text-slate-900 font-mono text-xs">{remitoNum}</span>
                                <span className="text-indigo-700 font-extrabold font-mono text-xs">
                                  Resta: ${rem.toLocaleString('es-AR')}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center space-x-2 mt-0.5">
                                <span>{new Date(w.date).toLocaleDateString('es-AR')}</span>
                                <span>•</span>
                                <span>Total: ${w.totalAmount.toLocaleString('es-AR')}</span>
                                {paid > 0 && <span className="text-emerald-600 font-semibold">• Pagado: ${paid.toLocaleString('es-AR')}</span>}
                              </div>
                              <div className="text-[10px] text-slate-700 truncate mt-1 bg-white/70 px-2 py-0.5 rounded border border-slate-200/60">
                                <span className="font-bold text-slate-900">Salió ese día:</span> {itemsSummary}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <form onSubmit={e => handleRegisterPayment(e, false)} className="space-y-3.5">
                {/* Modalidad de Cobro: Parcial vs Total */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 block text-xs">Modalidad de Cobro:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMode('partial');
                        const amt = debt > 0 ? Math.round(debt / 2) : '';
                        setPaymentAmount(amt);
                        setPaymentNotes('Pago parcial / Entrega a cuenta');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        paymentMode === 'partial'
                          ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs ring-1 ring-amber-500'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-extrabold text-xs flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <span>Pago Parcial / Entrega</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Abona una parte y deja el resto pendiente.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMode('total');
                        setPaymentAmount(debt > 0 ? debt : 0);
                        setPaymentNotes('Cancelación total de saldo');
                        setPaymentNextPromiseDate('');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        paymentMode === 'total'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs ring-1 ring-emerald-500'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-extrabold text-xs flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span>Cancelación Total</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Cancela el 100% de la deuda al instante.</p>
                    </button>
                  </div>
                </div>

                {/* Quick Presets for Partial Payment */}
                {debt > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Asignar Monto Rápido:
                    </span>
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      {[
                        { label: '25%', factor: 0.25 },
                        { label: '50%', factor: 0.50 },
                        { label: '75%', factor: 0.75 },
                        { label: '100% Total', factor: 1.00 }
                      ].map(preset => {
                        const calculatedAmt = Math.round(debt * preset.factor);
                        const isSelected = paymentAmount === calculatedAmt;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setPaymentAmount(calculatedAmt);
                              if (preset.factor === 1) {
                                setPaymentMode('total');
                                setPaymentNotes('Cancelación total de saldo');
                                setPaymentNextPromiseDate('');
                              } else {
                                setPaymentMode('partial');
                                setPaymentNotes(`Pago parcial / Entrega a cuenta (${preset.label})`);
                              }
                            }}
                            className={`py-1.5 px-1 rounded-lg border font-extrabold text-[11px] transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700'
                            }`}
                          >
                            <div>{preset.label}</div>
                            <div className="text-[9px] font-mono opacity-80">${calculatedAmt.toLocaleString('es-AR')}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Amount Input */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monto que Entrega / Paga Ahora ($) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-black text-slate-400">$</span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={paymentAmount}
                      onChange={e => {
                        const val = e.target.value ? Number(e.target.value) : '';
                        setPaymentAmount(val);
                        if (typeof val === 'number') {
                          if (val >= debt && debt > 0) {
                            setPaymentMode('total');
                          } else {
                            setPaymentMode('partial');
                          }
                        }
                      }}
                      className="w-full pl-8 pr-3 py-2.5 border rounded-xl bg-slate-50 font-black text-slate-900 text-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-inner"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Real-Time Live Calculation Preview */}
                <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                  remainingBalance > 0
                    ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                    : remainingBalance === 0
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                }`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-medium">Deuda total actual:</span>
                    <span className="font-bold font-mono text-slate-800">${debt.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-700 font-semibold">Entrega que abona ahora:</span>
                    <span className="font-black font-mono text-emerald-700">-${currentPayment.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs">
                    <span className="font-bold">
                      {remainingBalance > 0 ? 'Saldo Restante que Deberá Abonar:' : remainingBalance === 0 ? 'Saldo Restante:' : 'Saldo a Favor que le Quedará al Cliente:'}
                    </span>
                    <span className={`font-black font-mono text-base ${
                      remainingBalance > 0 ? 'text-amber-700' : remainingBalance === 0 ? 'text-emerald-600' : 'text-emerald-700'
                    }`}>
                      {remainingBalance < 0 ? `+$${Math.abs(remainingBalance).toLocaleString('es-AR')} (A Favor)` : `$${remainingBalance.toLocaleString('es-AR')}`}
                    </span>
                  </div>

                  {remainingBalance > 0 && (
                    <div className="text-[11px] font-semibold text-amber-900 bg-amber-100/70 p-2 rounded-lg flex items-center space-x-1.5">
                      <span>⚠️ El cliente abona una parte ahora. Le quedará un saldo de <strong>${remainingBalance.toLocaleString('es-AR')}</strong> para abonar luego.</span>
                    </div>
                  )}

                  {remainingBalance === 0 && debt > 0 && (
                    <div className="text-[11px] font-bold text-emerald-900 bg-emerald-100/70 p-2 rounded-lg flex items-center space-x-1.5">
                      <span>✅ ¡Cancelación completa! La cuenta corriente de este cliente quedará al día ($0).</span>
                    </div>
                  )}

                  {remainingBalance < 0 && (
                    <div className="text-[11px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 p-2.5 rounded-xl flex items-start space-x-2">
                      <span className="text-base">🎉</span>
                      <div>
                        <div className="font-extrabold text-emerald-950">¡Pago Mayor a la Deuda / Saldo a Favor!</div>
                        <div>El cliente entrega más dinero o un cheque mayor. Le quedará un <strong>Saldo a Favor de +${Math.abs(remainingBalance).toLocaleString('es-AR')}</strong> acreditado en su cuenta corriente para descontar en futuras compras o retiros.</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Next Payment Promise Date (if remaining debt) */}
                {remainingBalance > 0 && (
                  <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/80 space-y-1">
                    <label className="font-bold text-amber-900 block text-[11px] flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-700" />
                      <span>Fecha pactada para abonar el saldo restante (Opcional):</span>
                    </label>
                    <input
                      type="date"
                      value={paymentNextPromiseDate}
                      onChange={e => setPaymentNextPromiseDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-slate-900"
                    />
                    <p className="text-[10px] text-amber-800">
                      Se agendará como recordatorio en la ficha del cliente y en el recibo de cobro.
                    </p>
                  </div>
                )}

                {/* Payment Method */}
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
                  <label className="font-semibold text-slate-700 block mb-1">Observaciones / Concepto del Recibo</label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg bg-slate-50 font-medium"
                    placeholder="Ej. Pago parcial acordado en el mostrador"
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
                    <span>🧾 Emitir e Imprimir Factura AFIP Electrónica</span>
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

                  <div className="flex items-center space-x-2">
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      Confirmar Cobro
                    </button>
                    <button
                      type="button"
                      onClick={e => handleRegisterPayment(e, true)}
                      className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md flex items-center space-x-1.5 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{paymentEmitInvoice ? 'Confirmar y Facturar AFIP' : 'Confirmar e Imprimir Recibo PDF'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

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

              {(Number(editingCustomer.currentBalance) || 0) > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-2">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Detalle y Fecha del Retiro / Deuda Inicial a Asentar
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-amber-900 block text-[11px] mb-0.5">
                        Fecha y Hora en que se retiró *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={initialDebtDate}
                        onChange={e => setInitialDebtDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-amber-300 rounded-md bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-amber-900 block text-[11px] mb-0.5">
                        Detalle de Mercadería Retirada / Concepto
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: 2 bolsas cemento, remito 01..."
                        value={initialDebtDescription}
                        onChange={e => setInitialDebtDescription(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-amber-300 rounded-md bg-white text-xs font-medium focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-700">
                    ℹ️ Esta fecha y detalle quedarán registrados en el Estado de Cuenta e Historial de Cuenta Corriente del cliente.
                  </p>
                </div>
              )}

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

      {/* Charge Modal (Cargar Deuda / Retiro de Mercadería a Cuenta Corriente) */}
      {isChargeModalOpen && chargingCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                  <PlusCircle className="w-5 h-5 text-amber-600" />
                  <span>Cargar a Cuenta Corriente</span>
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  Cliente: <span className="text-slate-800 font-bold">{chargingCustomer.name}</span> (Saldo actual: ${chargingCustomer.currentBalance.toLocaleString('es-AR')})
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsChargeModalOpen(false);
                  setChargingCustomer(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterCharge} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Monto a Cargar / Valor de lo Retirado ($) *
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  placeholder="0.00"
                  value={chargeAmount}
                  onChange={e => setChargeAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-black text-red-600 text-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Fecha y Hora en que se retiró *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={chargeDate}
                  onChange={e => setChargeDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Esta fecha quedará asentada en el historial como el momento exacto en que se retiró la mercadería.
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Detalle de la Mercadería Retirada / Concepto *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ej: 3 bolsas de cal, 1 lata de fijador 10L, perfiles de chapa..."
                  value={chargeDescription}
                  onChange={e => setChargeDescription(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  N° de Remito / Comprobante de Referencia (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: REM-00459"
                  value={chargeReference}
                  onChange={e => setChargeReference(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 flex items-center justify-between">
                <span>Nuevo saldo estimado:</span>
                <span className="font-bold text-red-600 text-sm">
                  ${((Number(chargingCustomer.currentBalance) || 0) + (Number(chargeAmount) || 0)).toLocaleString('es-AR')}
                </span>
              </div>

              <div className="flex items-center space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsChargeModalOpen(false);
                    setChargingCustomer(null);
                  }}
                  className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-extrabold shadow-md flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Confirmar Carga</span>
                </button>
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
