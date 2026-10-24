import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Printer, 
  User, 
  CheckCircle,
  FileText,
  DollarSign,
  ArrowUpDown,
  CornerDownLeft,
  Keyboard,
  RotateCcw,
  Scale
} from 'lucide-react';
import { AppState, Product, Customer, PaymentMethod, SaleItem, Sale, InvoiceType, TaxCondition } from '../types';
import { DataService } from '../services/dataService';
import { generateSaleInvoicePDF, generateThermalTicketPDF, printThermalTicketDirect, generateQuotationPDF } from '../utils/pdfGenerator';
import { Pagination } from './Pagination';

interface POSViewProps {
  appState: AppState;
  onOpenCardRates?: () => void;
}

export const POSView: React.FC<POSViewProps> = ({ appState, onOpenCardRates }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [amountPaidCash, setAmountPaidCash] = useState<number | ''>('');
  const [saleNotes, setSaleNotes] = useState('');
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mixed Payment Breakdown State
  const [mixedCash, setMixedCash] = useState<number | ''>('');
  const [mixedCard, setMixedCard] = useState<number | ''>('');
  const [mixedTransfer, setMixedTransfer] = useState<number | ''>('');
  const [mixedCurrentAccount, setMixedCurrentAccount] = useState<number | ''>('');

  // Card & Bank Surcharge State
  const [cardSurchargePercent, setCardSurchargePercent] = useState<number>(
    appState.storeInfo.cardSurchargePercent || 10
  );
  const [selectedBankName, setSelectedBankName] = useState<string>('Visa / Mastercard (10%)');

  // AFIP Invoice Type & Custom CUIT
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<InvoiceType>(
    appState.storeInfo.defaultCounterInvoiceType || 'FACTURA_B'
  );
  const [isManualInvoiceType, setIsManualInvoiceType] = useState<boolean>(false);
  const [customCuitDni, setCustomCuitDni] = useState<string>('');

  // Auto-suggest document type when changing payment mode or customer, unless manually changed by user
  useEffect(() => {
    if (isManualInvoiceType) return; // Respect cashier's manual choice

    if (paymentMethod === 'current_account') {
      setSelectedInvoiceType(appState.storeInfo.defaultCurrentAccountInvoiceType || 'REMITO');
    } else if (selectedCustomer && selectedCustomer.dniCuit && selectedCustomer.dniCuit.length >= 10) {
      setSelectedInvoiceType(appState.storeInfo.defaultRespInscriptoInvoiceType || 'FACTURA_A');
    } else {
      setSelectedInvoiceType(appState.storeInfo.defaultCounterInvoiceType || 'FACTURA_B');
    }
  }, [paymentMethod, selectedCustomer, isManualInvoiceType, appState.storeInfo.defaultCounterInvoiceType, appState.storeInfo.defaultCurrentAccountInvoiceType, appState.storeInfo.defaultRespInscriptoInvoiceType]);

  // Keyboard navigation states
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const productRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Weight & Scale modal state (Venta por peso / fraccionamiento / gramos)
  const [isWeightModalOpen, setIsWeightModalOpen] = useState<boolean>(false);
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [isEditingCartItem, setIsEditingCartItem] = useState<boolean>(false);
  const [weightMode, setWeightMode] = useState<'grams' | 'kilos' | 'money'>('grams');
  const [weightGramsInput, setWeightGramsInput] = useState<string>('250');
  const [weightKilosInput, setWeightKilosInput] = useState<string>('0.250');
  const [weightMoneyInput, setWeightMoneyInput] = useState<string>('');
  const weightInputRef = useRef<HTMLInputElement>(null);

  const categories = Array.from(
    new Set(appState.products.map(p => p.category).filter(Boolean))
  );

  // Filter products
  const filteredProducts = appState.products.filter(p => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(query) || 
      p.code.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      (p.size && p.size.toLowerCase().includes(query)) ||
      (p.color && p.color.toLowerCase().includes(query)) ||
      (p.brand && p.brand.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  // Catalog pagination state
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPageSize, setCatalogPageSize] = useState(8);

  const totalCatalogPages = Math.ceil(filteredProducts.length / catalogPageSize) || 1;

  const paginatedProducts = filteredProducts.slice(
    (catalogPage - 1) * catalogPageSize,
    catalogPage * catalogPageSize
  );

  const modalOpenedTimeRef = useRef<number>(0);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Global POS Keyboard Shortcuts (F1, F2, F4, ESC)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0 && !isSubmitting) {
          handleCompleteSale();
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0 && window.confirm('¿Limpiar y vaciar el carrito actual?')) {
          setCart([]);
        }
      } else if (e.key === 'Escape') {
        if (!lastCompletedSale) {
          setSearchQuery('');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [cart, lastCompletedSale]);

  // Reset keyboard selection whenever search query or category changes
  useEffect(() => {
    setSelectedIndex(0);
    setCatalogPage(1);
  }, [searchQuery, selectedCategory]);

  // Scroll active product into view
  useEffect(() => {
    if (paginatedProducts.length > 0 && selectedIndex >= 0 && selectedIndex < paginatedProducts.length) {
      productRefs.current[selectedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedIndex, paginatedProducts.length]);

  // Open Weight / Fraccionamiento Modal
  const openWeightModal = (product: Product, isCartEdit: boolean = false, existingQty?: number) => {
    setWeightModalProduct(product);
    setIsEditingCartItem(isCartEdit);

    const initialQty = existingQty && existingQty > 0 ? existingQty : (product.unit === 'gr' ? 100 : 0.25);
    const initialGrams = product.unit === 'gr' ? initialQty : Math.round(initialQty * 1000);
    const initialKilos = product.unit === 'gr' ? Math.round((initialQty / 1000) * 1000) / 1000 : initialQty;
    const initialMoney = Math.round(initialQty * product.salePrice);

    setWeightGramsInput(initialGrams.toString());
    setWeightKilosInput(initialKilos.toString());
    setWeightMoneyInput(initialMoney.toString());
    setWeightMode(product.unit === 'gr' ? 'grams' : (initialQty < 1 ? 'grams' : 'kilos'));
    setIsWeightModalOpen(true);

    setTimeout(() => {
      weightInputRef.current?.focus();
      weightInputRef.current?.select();
    }, 80);
  };

  // Compute live values for weight fraccionamiento
  const getWeightCalculations = () => {
    if (!weightModalProduct) return { qty: 0, subtotal: 0, grams: 0, kilos: 0 };
    const price = weightModalProduct.salePrice || 0;
    const isGrProduct = weightModalProduct.unit === 'gr';

    let finalQty = 0;
    let finalGrams = 0;
    let finalKilos = 0;
    let finalSubtotal = 0;

    if (weightMode === 'grams') {
      const g = parseFloat(weightGramsInput) || 0;
      finalGrams = g;
      finalKilos = Math.round((g / 1000) * 1000) / 1000;
      finalQty = isGrProduct ? g : finalKilos;
      finalSubtotal = Math.round(finalQty * price * 100) / 100;
    } else if (weightMode === 'kilos') {
      const k = parseFloat(weightKilosInput) || 0;
      finalKilos = k;
      finalGrams = Math.round(k * 1000);
      finalQty = isGrProduct ? finalGrams : k;
      finalSubtotal = Math.round(finalQty * price * 100) / 100;
    } else if (weightMode === 'money') {
      const m = parseFloat(weightMoneyInput) || 0;
      finalSubtotal = m;
      if (price > 0) {
        if (isGrProduct) {
          finalQty = Math.round((m / price) * 10) / 10;
          finalGrams = finalQty;
          finalKilos = Math.round((finalGrams / 1000) * 1000) / 1000;
        } else {
          finalQty = Math.round((m / price) * 1000) / 1000;
          finalKilos = finalQty;
          finalGrams = Math.round(finalKilos * 1000);
        }
      }
    }

    return { qty: finalQty, subtotal: finalSubtotal, grams: finalGrams, kilos: finalKilos };
  };

  const handleConfirmWeight = () => {
    if (!weightModalProduct) return;
    const { qty, subtotal } = getWeightCalculations();
    if (qty <= 0) return;

    addToCart(weightModalProduct, qty, subtotal, isEditingCartItem);
    setIsWeightModalOpen(false);
    setWeightModalProduct(null);
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const addToCart = (product: Product, customQty?: number, customSubtotal?: number, replaceQty: boolean = false) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.productId === product.id);
      const qtyToAdd = customQty !== undefined ? customQty : 1;
      const subtotalToAdd = customSubtotal !== undefined ? customSubtotal : (qtyToAdd * product.salePrice);

      if (existing) {
        const newQty = replaceQty
          ? Math.round(qtyToAdd * 1000) / 1000
          : Math.round((existing.quantity + qtyToAdd) * 1000) / 1000;
        const newSubtotal = replaceQty
          ? Math.round(subtotalToAdd * 100) / 100
          : Math.round((existing.subtotal + subtotalToAdd) * 100) / 100;
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: newQty, subtotal: newSubtotal, unit: product.unit || item.unit || 'un' }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            productId: product.id,
            code: product.code,
            productName: product.name,
            quantity: Math.round(qtyToAdd * 1000) / 1000,
            unitPrice: product.salePrice,
            costPrice: product.costPrice,
            subtotal: Math.round(subtotalToAdd * 100) / 100,
            unit: product.unit || 'un'
          }
        ];
      }
    });
  };

  const handleSelectProduct = (product: Product, index: number) => {
    setSelectedIndex(index);
    if (product.unit === 'kg' || product.unit === 'gr') {
      openWeightModal(product, false);
    } else {
      addToCart(product);
      setRecentlyAddedId(product.id);
      setTimeout(() => setRecentlyAddedId(null), 800);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedQuery = searchQuery.trim().toLowerCase();

      // 1. First check for EXACT barcode / code match in all products
      const exactMatch = appState.products.find(
        p => p.code.toLowerCase() === trimmedQuery
      );

      if (exactMatch) {
        if (exactMatch.unit === 'kg' || exactMatch.unit === 'gr') {
          openWeightModal(exactMatch, false);
        } else {
          addToCart(exactMatch);
          setRecentlyAddedId(exactMatch.id);
          setTimeout(() => setRecentlyAddedId(null), 800);
          setSearchQuery('');
        }
        return;
      }

      // 2. Balanza / Scale EAN-13 Barcode parsing (e.g. 2000101137754)
      if (trimmedQuery.length === 13 && /^(20|21|22|28)/.test(trimmedQuery)) {
        const pluPart = trimmedQuery.substring(2, 7); // e.g. "00101"
        const pluNumeric = parseInt(pluPart, 10).toString(); // e.g. "101"
        const valuePart = parseInt(trimmedQuery.substring(7, 12), 10); // e.g. 13775

        const scaleProduct = appState.products.find(p => {
          const c = p.code.toLowerCase();
          return c === pluPart || c === pluNumeric || c === `0${pluNumeric}` || c === `00${pluNumeric}`;
        });

        if (scaleProduct) {
          let totalCalculated = valuePart / 100;
          if (scaleProduct.salePrice > 0 && totalCalculated < (scaleProduct.salePrice / 10)) {
            // Scale configured in integer pesos
            totalCalculated = valuePart;
          }

          let calculatedQty = 1;
          if (scaleProduct.salePrice > 0) {
            calculatedQty = Math.round((totalCalculated / scaleProduct.salePrice) * 1000) / 1000;
          }

          addToCart(scaleProduct, calculatedQty, totalCalculated);
          setRecentlyAddedId(scaleProduct.id);
          setTimeout(() => setRecentlyAddedId(null), 800);
          setSearchQuery('');
          return;
        }
      }

      // 3. Otherwise add selected product from paginated list
      if (paginatedProducts.length > 0) {
        const targetProduct = paginatedProducts[selectedIndex] || paginatedProducts[0];
        if (targetProduct) {
          if (targetProduct.unit === 'kg' || targetProduct.unit === 'gr') {
            openWeightModal(targetProduct, false);
          } else {
            addToCart(targetProduct);
            setRecentlyAddedId(targetProduct.id);
            setTimeout(() => setRecentlyAddedId(null), 800);
            setSearchQuery('');
          }
        }
      }
      return;
    }

    if (paginatedProducts.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, paginatedProducts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Escape') {
      setSearchQuery('');
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.productId === productId) {
            const isWeight = item.unit === 'kg' || item.unit === 'gr';
            const effectiveDelta = (isWeight && Math.abs(delta) === 1)
              ? (delta > 0 ? 0.1 : -0.1)
              : delta;
            const newQty = Math.round((item.quantity + effectiveDelta) * 1000) / 1000;
            return newQty > 0
              ? { ...item, quantity: newQty, subtotal: Math.round(newQty * item.unitPrice * 100) / 100 }
              : null;
          }
          return item;
        })
        .filter(Boolean) as SaleItem[]
    );
  };

  const setCartQuantity = (productId: string, newQty: number) => {
    if (isNaN(newQty) || newQty <= 0) return;
    const roundedQty = Math.round(newQty * 1000) / 1000;
    setCart(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          return {
            ...item,
            quantity: roundedQty,
            subtotal: Math.round(roundedQty * item.unitPrice * 100) / 100
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const cardSurchargeAmount = paymentMethod === 'card'
    ? Math.round((cartSubtotal * (cardSurchargePercent || 0)) / 100)
    : 0;

  const totalAmount = Math.max(0, cartSubtotal - discountAmount + cardSurchargeAmount);

  const changeDue = typeof amountPaidCash === 'number' && amountPaidCash > totalAmount
    ? amountPaidCash - totalAmount
    : 0;

  const handleEmitQuotation = () => {
    if (cart.length === 0) return;

    const quoteItems = cart.map(item => ({
      code: item.code,
      quantity: item.quantity,
      description: item.productName,
      unitPrice: item.unitPrice,
      discountPercent: 0,
      totalPrice: item.subtotal
    }));

    generateQuotationPDF({
      quotationNumber: `${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toISOString(),
      customerName: selectedCustomer?.name || 'Consumidor Final',
      customerAddress: selectedCustomer?.address || 'A confirmar',
      customerCuitDni: selectedCustomer?.dniCuit || '',
      sellerName: 'Mostrador',
      items: quoteItems,
      subtotal: cartSubtotal,
      discount: discountAmount,
      totalAmount,
      notes: saleNotes || 'Los precios incluyen IVA. La validez de esta cotización es de 7 días.'
    }, appState.storeInfo);
  };

  const closeModalSafely = () => {
    // Require at least 600ms to have passed since modal opened to prevent double-click / click-through dismissal
    if (Date.now() - modalOpenedTimeRef.current < 600) {
      return;
    }
    setLastCompletedSale(null);
  };

  const handleCompleteSale = async () => {
    if (isSubmitting || cart.length === 0) return;

    let paymentsBreakdown: { method: PaymentMethod; amount: number }[] | undefined = undefined;

    if (paymentMethod === 'mixed') {
      const cashAmt = Number(mixedCash) || 0;
      const cardAmt = Number(mixedCard) || 0;
      const transferAmt = Number(mixedTransfer) || 0;
      const ccAmt = Number(mixedCurrentAccount) || 0;
      const totalParts = cashAmt + cardAmt + transferAmt + ccAmt;

      if (Math.abs(totalParts - totalAmount) > 0.01) {
        alert(`¡Atención! La suma de las partes ($${totalParts.toLocaleString('es-AR')}) no coincide con el total a cobrar ($${totalAmount.toLocaleString('es-AR')}). Revisa los montos asignados.`);
        return;
      }

      if (ccAmt > 0 && !selectedCustomer) {
        alert('Para incluir una porción a Cuenta Corriente debe seleccionar un cliente registrado.');
        return;
      }

      paymentsBreakdown = [
        { method: 'cash' as PaymentMethod, amount: cashAmt },
        { method: 'card' as PaymentMethod, amount: cardAmt },
        { method: 'transfer' as PaymentMethod, amount: transferAmt },
        { method: 'current_account' as PaymentMethod, amount: ccAmt }
      ].filter(p => p.amount > 0);
    }

    const effectivePaymentMethod = (selectedInvoiceType === 'REMITO' && paymentMethod !== 'mixed')
      ? 'current_account'
      : paymentMethod;

    if ((effectivePaymentMethod === 'current_account' || selectedInvoiceType === 'REMITO') && !selectedCustomer) {
      alert('Para emitir un Remito o Venta a Cuenta Corriente debe seleccionar obligatoriamente un cliente registrado.');
      return;
    }

    if (selectedInvoiceType === 'FACTURA_A') {
      const cuitToUse = selectedCustomer?.dniCuit || customCuitDni;
      if (!cuitToUse || cuitToUse.trim().length < 8) {
        alert('Para emitir Factura A se requiere ingresar el CUIT del cliente (Responsable Inscripto). Por favor complete el campo CUIT / DNI.');
        return;
      }
    }

    if ((paymentMethod === 'current_account' || (paymentsBreakdown && paymentsBreakdown.some(p => p.method === 'current_account'))) && selectedCustomer) {
      const ccPortion = paymentsBreakdown
        ? (paymentsBreakdown.find(p => p.method === 'current_account')?.amount || 0)
        : totalAmount;
      const prospectiveBalance = selectedCustomer.currentBalance + ccPortion;
      if (prospectiveBalance > selectedCustomer.creditLimit) {
        const confirmExceed = window.confirm(
          `¡Atención! La compra supera el límite de crédito del cliente ($${selectedCustomer.creditLimit.toLocaleString('es-AR')}). Saldo resultante: $${prospectiveBalance.toLocaleString('es-AR')}. ¿Desea autorizar la venta de todas formas?`
        );
        if (!confirmExceed) return;
      }
    }

    setIsSubmitting(true);
    try {
      const prefix = appState.storeInfo?.invoicePrefix || '0001';
      const nextInvoiceNum = `FC-${prefix}-${(appState.sales.length + 1052).toString().padStart(8, '0')}`;
      const generatedCae = `743${Math.floor(10000000000 + Math.random() * 90000000000)}`;
      const caeDueDate = new Date(Date.now() + 10 * 86400000).toLocaleDateString('es-AR');

      const cuitOrDni = selectedCustomer?.dniCuit || customCuitDni || '20-00000000-0';
      const taxCond: TaxCondition = selectedInvoiceType === 'FACTURA_A' ? 'Responsable Inscripto' : 'Consumidor Final / General';

      const cardSurchargeVal = (paymentMethod === 'card' || (paymentsBreakdown && paymentsBreakdown.some(p => p.method === 'card'))) ? cardSurchargeAmount : 0;

      const newSale: Sale = {
        id: `sale-${Date.now()}`,
        invoiceNumber: nextInvoiceNum,
        invoiceType: selectedInvoiceType,
        cae: generatedCae,
        caeDueDate,
        customerCuitDni: cuitOrDni,
        customerTaxCondition: taxCond,
        date: new Date().toISOString(),
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name || (selectedInvoiceType === 'FACTURA_A' ? 'Cliente Resp. Inscripto' : 'Consumidor Final'),
        items: [...cart],
        subtotal: cartSubtotal,
        discount: discountAmount,
        surcharge: cardSurchargeVal,
        cardBankName: paymentMethod === 'card' ? selectedBankName : undefined,
        totalAmount,
        paymentMethod: effectivePaymentMethod,
        paymentsBreakdown,
        notes: saleNotes,
        status: 'completed',
        amountPaidCash: typeof amountPaidCash === 'number' ? amountPaidCash : undefined,
        changeDue: changeDue > 0 ? changeDue : undefined
      };

      // 1. Record modal open time to prevent key repetition closing modal
      modalOpenedTimeRef.current = Date.now();

      // 2. Instantly trigger print modal and clear cart for immediate UI feedback
      setLastCompletedSale(newSale);
      setCart([]);
      setDiscountAmount(0);
      setAmountPaidCash('');
      setMixedCash('');
      setMixedCard('');
      setMixedTransfer('');
      setMixedCurrentAccount('');
      setSaleNotes('');
      setCustomCuitDni('');
      setIsManualInvoiceType(false);
      setSelectedCustomer(null);

      // 3. Process sale in data service / cloud database
      await DataService.processSale(newSale);
    } catch (err) {
      console.error('[POSView] Error saving sale to server:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndoLastSale = async () => {
    if (!lastCompletedSale) return;
    if (window.confirm(`¿Está seguro de deshacer y anular la venta ${lastCompletedSale.invoiceNumber}?\n\nLos productos volverán a cargarse automáticamente en el carrito.`)) {
      const res = await DataService.annulSale(lastCompletedSale.id);
      if (res.success) {
        setCart(lastCompletedSale.items);

        if (lastCompletedSale.customerId) {
          const cust = appState.customers.find(c => c.id === lastCompletedSale.customerId);
          if (cust) setSelectedCustomer(cust);
        }

        setLastCompletedSale(null);
        alert('¡Venta deshecha con éxito! Los productos han vuelto a estar cargados en el carrito para que puedas corregir los datos.');
      } else {
        alert(res.error || 'Error al anular la venta.');
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Punto de Venta (POS)</span>
            <span className="text-[11px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">Venta Rápida</span>
          </h1>
          <p className="text-xs text-slate-500">Seleccione productos, cliente y registre comprobantes de venta al instante.</p>
        </div>

        {/* Keyboard Shortcuts Badges */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 text-white p-2 rounded-xl text-[11px] font-mono shadow-sm">
          <Keyboard className="w-3.5 h-3.5 text-indigo-400 ml-1 mr-0.5" />
          <span className="bg-slate-800 text-indigo-300 font-bold px-1.5 py-0.5 rounded">F1</span>
          <span className="text-slate-300 mr-1.5">Buscar</span>
          <span className="bg-slate-800 text-emerald-400 font-bold px-1.5 py-0.5 rounded">F2</span>
          <span className="text-slate-300 mr-1.5">Cobrar</span>
          <span className="bg-slate-800 text-amber-400 font-bold px-1.5 py-0.5 rounded">F4</span>
          <span className="text-slate-300 mr-1.5">Vaciar</span>
          <span className="bg-slate-800 text-slate-300 font-bold px-1.5 py-0.5 rounded">ESC</span>
          <span className="text-slate-300 pr-1">Limpiar</span>
        </div>
      </div>

      {/* Mobile Screen Navigation Tabs (Only visible on lg:hidden) */}
      <div className="flex lg:hidden bg-slate-200/80 p-1.5 rounded-2xl gap-1.5 border border-slate-300/60 shadow-inner">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-2 ${
            mobileTab === 'catalog'
              ? 'bg-white text-indigo-700 shadow-md border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📦 Catálogo de Productos</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-2 ${
            mobileTab === 'cart'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Carrito ({cart.length})</span>
          {cart.length > 0 && (
            <span className="ml-1 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
              ${totalAmount.toLocaleString('es-AR')}
            </span>
          )}
        </button>
      </div>

      {/* Main POS Layout (Left: Product Catalog & Search | Right: Active Cart & Checkout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-16 lg:pb-0">
        {/* Left Column (Catalog): 7 cols */}
        <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'catalog' ? 'block' : 'hidden lg:block'}`}>
          {/* Search & Shortcuts Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-indigo-500 absolute left-3.5 top-3.5" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar por código de barras, SKU o nombre..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-28 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-800"
              />
              <div className="absolute right-2.5 top-2.5 flex items-center space-x-1 text-[10px] text-slate-400 font-mono pointer-events-none">
                <span className="bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md font-bold shadow-2xs">↑↓ Navegar</span>
                <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md font-bold shadow-2xs">↵ ENTER</span>
              </div>
            </div>

            {/* Keyboard Shortcuts Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-0.5 px-0.5">
              <div className="flex items-center space-x-2">
                <span className="flex items-center space-x-1 text-slate-600 font-mono font-medium text-[11px]">
                  <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600 mr-0.5" />
                  <span>Usa flechas para navegar</span>
                </span>
              </div>
              {filteredProducts.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    Prod. <strong className="text-indigo-700 font-mono font-black">{selectedIndex + 1}</strong> de {paginatedProducts.length}
                  </span>

                  {/* Quick Mini Page Switcher */}
                  <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-2xs">
                    <button
                      type="button"
                      disabled={catalogPage <= 1}
                      onClick={() => {
                        setCatalogPage(prev => Math.max(1, prev - 1));
                        setSelectedIndex(0);
                      }}
                      className="px-1 text-slate-600 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed font-black text-xs"
                      title="Página anterior"
                    >
                      ‹
                    </button>
                    <span className="text-[11px] font-bold text-slate-700">
                      Pág. {catalogPage} / {totalCatalogPages}
                    </span>
                    <button
                      type="button"
                      disabled={catalogPage >= totalCatalogPages}
                      onClick={() => {
                        setCatalogPage(prev => Math.min(totalCatalogPages, prev + 1));
                        setSelectedIndex(0);
                      }}
                      className="px-1 text-slate-600 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed font-black text-xs"
                      title="Página siguiente"
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[580px] overflow-y-auto px-1 pt-2 pb-3">
            {paginatedProducts.length === 0 ? (
              <div className="col-span-1 sm:col-span-2 py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
                No se encontraron productos coincidentes con la búsqueda.
              </div>
            ) : (
              paginatedProducts.map((product, idx) => {
              const isSelected = idx === selectedIndex;
              const isLow = product.stock <= product.minStock;
              const isOut = product.stock <= 0;
              const isJustAdded = recentlyAddedId === product.id;

              return (
                <div
                  key={product.id}
                  ref={el => (productRefs.current[idx] = el)}
                  onClick={() => handleSelectProduct(product, idx)}
                  className={`relative bg-white p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-lg ${
                    isSelected
                      ? 'border-2 border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-600/20'
                      : isOut
                      ? 'border-red-200 bg-red-50/20 hover:border-red-300 shadow-xs'
                      : 'border-slate-200/80 hover:border-indigo-300 shadow-xs'
                  }`}
                >
                  {isJustAdded && (
                    <div className="absolute inset-0 bg-emerald-500/20 border-2 border-emerald-500 rounded-2xl flex items-center justify-center backdrop-blur-3xs z-20 animate-fade-in">
                      <span className="bg-emerald-600 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-full shadow-lg flex items-center space-x-1.5">
                        <CheckCircle className="w-4 h-4" />
                        <span>¡Agregado al Carrito!</span>
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">{product.code}</span>
                        {isSelected && (
                          <span className="bg-indigo-600 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center space-x-1 animate-pulse">
                            <CornerDownLeft className="w-2.5 h-2.5" />
                            <span>[ENTER]</span>
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isOut ? 'bg-red-100 text-red-700 border border-red-200' : isLow ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                        Stock: {product.stock} {product.unit}
                      </span>
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{product.name}</h4>
                      
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        {product.brand && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-slate-900 text-white uppercase tracking-wider">
                            {product.brand}
                          </span>
                        )}
                        {product.category && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {product.category}
                          </span>
                        )}
                      </div>

                      {(product.size || product.color) && (
                        <div className="flex items-center space-x-1 mt-1 flex-wrap gap-y-1">
                          {product.size && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                              Talle: {product.size}
                            </span>
                          )}
                          {product.color && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              Color: {product.color}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-black text-indigo-600 tracking-tight">${(product.salePrice || 0).toLocaleString('es-AR')}</span>
                      <span className="text-[10px] font-bold text-slate-400 ml-1">/{product.unit || 'un'}</span>
                    </div>

                    {product.unit === 'kg' || product.unit === 'gr' ? (
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          disabled={isOut}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIndex(idx);
                            openWeightModal(product, false);
                          }}
                          className="px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 shadow-xs bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                          title="Vender por gramos, balanza o monto en dinero"
                        >
                          <Scale className="w-3.5 h-3.5" />
                          <span>Pesar / Gramos</span>
                        </button>
                        <button
                          type="button"
                          disabled={isOut}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product, 1);
                            setRecentlyAddedId(product.id);
                            setTimeout(() => setRecentlyAddedId(null), 800);
                          }}
                          className="px-2 py-1.5 rounded-xl font-black text-[11px] transition-all bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                          title="Agregar 1 kg directo"
                        >
                          +1 {product.unit}
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled={isOut}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 shadow-xs ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            }))}
          </div>

          {filteredProducts.length > 0 && (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
              <Pagination
                currentPage={catalogPage}
                totalItems={filteredProducts.length}
                pageSize={catalogPageSize}
                onPageChange={p => {
                  setCatalogPage(p);
                  setSelectedIndex(0);
                }}
                onPageSizeChange={s => {
                  setCatalogPageSize(s);
                  setCatalogPage(1);
                  setSelectedIndex(0);
                }}
                pageSizeOptions={[6, 8, 12, 24]}
                itemLabel="productos"
              />
            </div>
          )}
        </div>

        {/* Right Column (Cart & Checkout): 5 cols */}
        <div className={`lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 flex flex-col justify-between space-y-4 ${mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'}`}>
          <div>
            {/* Header Cart */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-900 text-base tracking-tight">Carrito de Venta</h3>
              </div>
              <span className="text-xs text-indigo-600 font-extrabold bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                {cart.length} productos
              </span>
            </div>

            {/* Customer Selector */}
            <div className="mt-3.5 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>Cliente Asignado</span>
              </label>
              <select
                value={selectedCustomer?.id || 'FINAL'}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'FINAL') setSelectedCustomer(null);
                  else {
                    const found = appState.customers.find(c => c.id === val);
                    setSelectedCustomer(found || null);
                  }
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="FINAL">Consumidor Final (Venta Contado)</option>
                {appState.customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Saldo: ${c.currentBalance.toLocaleString('es-AR')})
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items List */}
            <div className="mt-3.5 space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-1.5">
                  <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 opacity-60" />
                  <p className="text-xs font-medium">El carrito está vacío. Haga clic en un producto para agregarlo.</p>
                </div>
              ) : (
                cart.map(item => {
                  const linkedProd = appState.products.find(p => p.id === item.productId);
                  const isWeightItem = item.unit === 'kg' || item.unit === 'gr';
                  return (
                    <div key={item.productId} className="flex items-center justify-between p-3 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl text-xs border border-slate-200/80 transition-colors">
                      <div className="flex-1 pr-2">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900 truncate">{item.productName}</span>
                          {isWeightItem && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-100 text-indigo-700">
                              {item.quantity < 1 && item.unit === 'kg' ? `${Math.round(item.quantity * 1000)}g` : `${item.quantity} ${item.unit || 'kg'}`}
                            </span>
                          )}
                        </div>
                        {(linkedProd?.size || linkedProd?.color) && (
                          <span className="text-[10px] text-indigo-700 font-bold block">
                            {linkedProd.size ? `Talle: ${linkedProd.size}` : ''} {linkedProd.color ? `| Color: ${linkedProd.color}` : ''}
                          </span>
                        )}
                        <span className="text-slate-500 text-[11px] font-medium">
                          ${item.unitPrice.toLocaleString('es-AR')} {isWeightItem ? `/${item.unit || 'kg'}` : 'c/u'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, -1)}
                            className="p-1 text-slate-600 hover:bg-slate-100 transition-colors"
                            title={isWeightItem ? 'Restar 100g (0.1 kg)' : 'Restar 1'}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            step={isWeightItem ? '0.001' : '1'}
                            min="0.001"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val > 0) {
                                setCartQuantity(item.productId, val);
                              }
                            }}
                            className="w-14 font-extrabold px-1 text-center text-slate-900 text-xs focus:bg-indigo-50 focus:outline-none"
                            title="Editar cantidad directamente (ej: 0.25 para 250g)"
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="p-1 text-slate-600 hover:bg-slate-100 transition-colors"
                            title={isWeightItem ? 'Sumar 100g (0.1 kg)' : 'Sumar 1'}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {isWeightItem ? (
                          <button
                            type="button"
                            onClick={() => {
                              const prod = appState.products.find(p => p.id === item.productId);
                              if (prod) openWeightModal(prod, true, item.quantity);
                            }}
                            className="p-1 px-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-black flex items-center space-x-0.5 transition-colors"
                            title="Abrir calculadora de balanza, gramos y dinero"
                          >
                            <Scale className="w-3 h-3" />
                            <span>{item.unit || 'kg'}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 uppercase px-1">
                            {item.unit || 'un'}
                          </span>
                        )}

                        <span className="font-black text-indigo-700 min-w-[64px] text-right text-xs">
                          ${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar del carrito"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Checkout Controls */}
          <div className="pt-3 border-t border-slate-200/80 space-y-3">
            {/* Tipo de Comprobante / Factura AFIP */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">Tipo de Comprobante / Facturación</label>
              <div className="grid grid-cols-5 gap-1.5 text-[11px]">
                {[
                  { id: 'FACTURA_B', label: 'Factura B', sub: 'Cons. Final' },
                  { id: 'FACTURA_A', label: 'Factura A', sub: 'Resp. Insc.' },
                  { id: 'FACTURA_C', label: 'Factura C', sub: 'Monotrib.' },
                  { id: 'TICKET_X', label: 'Ticket X', sub: 'Interno' },
                  { id: 'REMITO', label: 'Remito', sub: 'Entrega' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedInvoiceType(item.id as InvoiceType);
                      setIsManualInvoiceType(true);
                      if (item.id === 'REMITO') {
                        setPaymentMethod('current_account');
                      }
                    }}
                    className={`py-1.5 px-1 rounded-xl border text-center font-semibold transition-all ${
                      selectedInvoiceType === item.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="leading-tight text-[11px]">{item.label}</div>
                    <div className={`text-[9px] ${selectedInvoiceType === item.id ? 'text-indigo-300' : 'text-slate-400'}`}>{item.sub}</div>
                  </button>
                ))}
              </div>

              {/* CUIT / DNI Input for Factura A or manual customer identification */}
              {(selectedInvoiceType === 'FACTURA_A' || selectedInvoiceType === 'FACTURA_B') && (
                <div className="mt-2">
                  <label className="text-[10px] font-bold text-slate-600 block">
                    {selectedInvoiceType === 'FACTURA_A' ? 'CUIT Cliente (Requerido para Factura A)' : 'DNI / CUIT Cliente (Opcional)'}
                  </label>
                  <input
                    type="text"
                    value={selectedCustomer ? selectedCustomer.dniCuit : customCuitDni}
                    onChange={e => setCustomCuitDni(e.target.value)}
                    disabled={!!selectedCustomer}
                    placeholder="Ej: 30-71234567-8"
                    className="w-full mt-0.5 px-3 py-1.5 border border-slate-300 rounded-xl bg-slate-50 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 block">Forma de Pago</label>
                {paymentMethod === 'cash' && (appState.storeInfo.cashDiscountPercent || 0) > 0 && (
                  <button
                    onClick={() => {
                      const disc = Math.round((cartSubtotal * (appState.storeInfo.cashDiscountPercent || 0)) / 100);
                      setDiscountAmount(disc);
                    }}
                    className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full transition-colors"
                  >
                    Aplicar Dcto. Efectivo (-{appState.storeInfo.cashDiscountPercent}%)
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { id: 'cash', label: 'Efectivo' },
                  { id: 'card', label: 'Tarjeta' },
                  { id: 'transfer', label: 'Transferencia' },
                  { id: 'cheque', label: 'Cheque' },
                  { id: 'current_account', label: 'Cuenta Cte.' },
                  { id: 'mixed', label: '🔀 Cobro Mixto' }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                    className={`py-2 px-2 rounded-xl border font-bold transition-all text-[11px] ${
                      paymentMethod === m.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mixed Payment Breakdown Panel */}
            {paymentMethod === 'mixed' && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-bold text-amber-950">
                  <span>Desglose de Cobro Combinado / Mixto</span>
                  <span className="text-[10px] text-amber-800 font-mono">Total a cubrir: ${totalAmount.toLocaleString('es-AR')}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-700 block">Efectivo ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={mixedCash}
                      onChange={e => setMixedCash(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-2 py-1 border rounded bg-white font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-700 block">Tarjeta / Mercado Pago ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={mixedCard}
                      onChange={e => setMixedCard(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-2 py-1 border rounded bg-white font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-700 block">Transferencia ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={mixedTransfer}
                      onChange={e => setMixedTransfer(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-2 py-1 border rounded bg-white font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-700 block">A Cuenta Corriente ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={mixedCurrentAccount}
                      onChange={e => setMixedCurrentAccount(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-2 py-1 border rounded bg-white font-bold text-red-600"
                    />
                  </div>
                </div>

                {(() => {
                  const currentSum = (Number(mixedCash) || 0) + (Number(mixedCard) || 0) + (Number(mixedTransfer) || 0) + (Number(mixedCurrentAccount) || 0);
                  const diff = totalAmount - currentSum;
                  return (
                    <div className="flex justify-between items-center pt-2 border-t border-amber-200 text-[11px]">
                      <span className="font-bold text-slate-800">
                        Suma ingresada: <strong className="text-amber-900">${currentSum.toLocaleString('es-AR')}</strong>
                      </span>
                      {Math.abs(diff) < 0.01 ? (
                        <span className="text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                          ✓ Monto Cubierto Totalmente
                        </span>
                      ) : diff > 0 ? (
                        <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded">
                          Falta asignar: ${diff.toLocaleString('es-AR')}
                        </span>
                      ) : (
                        <span className="text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded">
                          Exceso de asignación: ${Math.abs(diff).toLocaleString('es-AR')}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Configuración de Recargo por Tarjeta y Banco */}
            {paymentMethod === 'card' && (
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-extrabold text-xs text-indigo-950">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span>Pago con Tarjeta - Recargo por Banco / Cuotas</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {onOpenCardRates && (
                      <button
                        type="button"
                        onClick={onOpenCardRates}
                        className="text-[10px] font-bold text-indigo-700 bg-white hover:bg-indigo-100 border border-indigo-300 px-2 py-0.5 rounded-md transition-colors shadow-2xs"
                        title="Modificar tasas de interés o agregar cuotas"
                      >
                        ⚙️ Editar Cuotas / Tasas
                      </button>
                    )}
                    <span className="text-[10px] font-mono font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full">
                      +{cardSurchargePercent}% Recargo
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-indigo-900 leading-snug">
                  Seleccione el plan de cuotas/banco del cliente o ingrese un % personalizado:
                </p>

                {/* Quick Presets from Configured Plans */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px]">
                  {(appState.storeInfo.cardInterestPlans?.length
                    ? appState.storeInfo.cardInterestPlans
                    : [
                        { id: 'p1', name: 'Débito / 1 Pago', surchargePercent: 0 },
                        { id: 'p2', name: 'Visa/Master 1 Pago', surchargePercent: 5 },
                        { id: 'p3', name: 'Mercado Pago / QR', surchargePercent: 8 },
                        { id: 'p4', name: '3 Cuotas (Cuota Simple)', surchargePercent: 15 },
                        { id: 'p5', name: '6 Cuotas Financiamiento', surchargePercent: 28 },
                        { id: 'p6', name: '12 Cuotas Larga Duración', surchargePercent: 42 },
                      ]
                  ).map(preset => {
                    const labelText = `${preset.name} (${preset.surchargePercent}%)`;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setCardSurchargePercent(preset.surchargePercent);
                          setSelectedBankName(preset.name);
                        }}
                        className={`py-1.5 px-2 rounded-lg border text-left font-bold transition-all ${
                          cardSurchargePercent === preset.surchargePercent && selectedBankName === preset.name
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="truncate">{preset.name}</div>
                        <div className={`text-[9px] font-mono ${cardSurchargePercent === preset.surchargePercent && selectedBankName === preset.name ? 'text-indigo-100' : 'text-indigo-700'}`}>
                          +{preset.surchargePercent}% recargo
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Surcharge % and Bank Name Input */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-indigo-100">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block">% Recargo Personalizado</label>
                    <div className="relative mt-0.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={cardSurchargePercent}
                        onChange={e => {
                          const val = Math.max(0, Number(e.target.value));
                          setCardSurchargePercent(val);
                          setSelectedBankName(`Personalizado (${val}%)`);
                        }}
                        className="w-full px-2.5 py-1 border border-indigo-300 rounded bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="absolute right-2 top-1 text-slate-400 font-bold text-xs">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block">Banco / Entidad Emisora</label>
                    <input
                      type="text"
                      value={selectedBankName}
                      onChange={e => setSelectedBankName(e.target.value)}
                      placeholder="Ej: Galicia, Santander, MP"
                      className="w-full mt-0.5 px-2.5 py-1 border border-indigo-300 rounded bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Surcharge Live Calculation Breakdown */}
                <div className="bg-white p-2 rounded-lg border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs">
                  <span className="text-slate-600">
                    Subtotal: <strong className="text-slate-900">${cartSubtotal.toLocaleString('es-AR')}</strong> + Recargo Tarjeta: <strong className="text-amber-800 font-bold">+${cardSurchargeAmount.toLocaleString('es-AR')}</strong>
                  </span>
                  <span className="text-indigo-900 font-black text-xs bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    Total a Cobrar en Posnet: ${(cartSubtotal + cardSurchargeAmount - discountAmount).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            )}

            {/* Discount & Cash Change calculation */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] text-slate-500 block">Descuento ($)</label>
                <input
                  type="number"
                  min="0"
                  value={discountAmount || ''}
                  onChange={e => setDiscountAmount(Number(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded bg-slate-50 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>

              {paymentMethod === 'cash' && (
                <div>
                  <label className="text-[11px] text-slate-500 block">Efectivo Recibido ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={amountPaidCash}
                    onChange={e => setAmountPaidCash(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-2 py-1 border rounded bg-slate-50 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Monto entregado"
                  />
                </div>
              )}
            </div>

            {/* Totals Summary */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 shadow-md space-y-2 border border-slate-800">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Subtotal:</span>
                <span className="font-semibold text-white">${cartSubtotal.toLocaleString('es-AR')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-400 font-bold">
                  <span>Descuento Aplicado:</span>
                  <span>-${discountAmount.toLocaleString('es-AR')}</span>
                </div>
              )}
              {cardSurchargeAmount > 0 && paymentMethod === 'card' && (
                <div className="flex justify-between text-xs text-amber-300 font-bold">
                  <span>Recargo Tarjeta ({cardSurchargePercent}%):</span>
                  <span>+${cardSurchargeAmount.toLocaleString('es-AR')}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-black text-white pt-2 border-t border-slate-800">
                <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">TOTAL A PAGAR:</span>
                <span className="text-2xl font-black text-emerald-400 tracking-tight">${totalAmount.toLocaleString('es-AR')}</span>
              </div>
              {paymentMethod === 'cash' && changeDue > 0 && (
                <div className="flex justify-between text-xs font-bold text-amber-300 pt-1 border-t border-slate-800/60">
                  <span>VUELTO A ENTREGAR:</span>
                  <span className="text-sm font-extrabold text-amber-300">${changeDue.toLocaleString('es-AR')}</span>
                </div>
              )}
            </div>

            {/* Action Buttons: Emit Quote or Complete Sale */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={handleEmitQuotation}
                className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-2 border ${
                  cart.length > 0
                    ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700 active:scale-[0.99]'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                }`}
              >
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>📋 EMITIR PRESUPUESTO / COTIZACIÓN (A4)</span>
              </button>

              <button
                type="button"
                disabled={cart.length === 0 || isSubmitting}
                onClick={handleCompleteSale}
                className={`w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all flex items-center justify-center space-x-2 ${
                  cart.length > 0 && !isSubmitting
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/30 active:scale-[0.99]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle className={`w-5 h-5 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>{isSubmitting ? 'PROCESANDO VENTA...' : 'FINALIZAR VENTA Y EMITIR COMPROBANTE'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Mobile Cart Bar (Only visible on mobile screens when products are in cart and viewing catalog) */}
      {cart.length > 0 && mobileTab === 'catalog' && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-slate-900 text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between border border-slate-800 animate-in slide-in-from-bottom-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-md">
              {cart.length}
            </div>
            <div>
              <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Total en Carrito</div>
              <div className="text-sm font-black text-emerald-400">${totalAmount.toLocaleString('es-AR')}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileTab('cart')}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-black rounded-xl shadow-lg flex items-center space-x-1.5 active:scale-95 transition-all"
          >
            <span>Ver Carrito / Cobrar</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Completed Sale Ticket Modal / Print Choice */}
      {lastCompletedSale && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div 
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 text-center border border-slate-200 animate-in zoom-in-95 duration-150"
          >
            {/* Header Icon */}
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">¡Venta Registrada Exitosamente!</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">El comprobante ha sido procesado y guardado en el sistema.</p>
            </div>

            {/* Change Due Card (If applicable) */}
            {lastCompletedSale.changeDue && lastCompletedSale.changeDue > 0 ? (
              <div className="bg-amber-500 text-white p-3.5 rounded-2xl shadow-md space-y-0.5">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-100">💵 Vuelvo a Entregar al Cliente:</div>
                <div className="text-3xl font-black tracking-tight">${lastCompletedSale.changeDue.toLocaleString('es-AR')}</div>
              </div>
            ) : null}

            {/* Sale Summary Box */}
            <div className="bg-slate-50 p-4 rounded-2xl text-left text-xs space-y-2 border border-slate-200/80">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Comprobante:</span>
                <span className="font-bold text-indigo-700">{lastCompletedSale.invoiceType?.replace('_', ' ') || 'FACTURA B'} N° {lastCompletedSale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cliente:</span>
                <span className="font-semibold text-slate-900">{lastCompletedSale.customerName || 'Consumidor Final'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Medio de Pago:</span>
                <span className="font-bold text-slate-900">
                  {lastCompletedSale.paymentMethod === 'card'
                    ? `Tarjeta (${lastCompletedSale.cardBankName || 'Crédito/Débito'})`
                    : lastCompletedSale.paymentMethod === 'cash'
                    ? 'Efectivo'
                    : lastCompletedSale.paymentMethod === 'current_account'
                    ? 'Cuenta Corriente (A Crédito)'
                    : lastCompletedSale.paymentMethod === 'transfer'
                    ? 'Transferencia Bancaria'
                    : lastCompletedSale.paymentMethod === 'cheque'
                    ? 'Cheque'
                    : 'Cobro Mixto'}
                </span>
              </div>
              {lastCompletedSale.paymentMethod === 'current_account' && (
                <div className="bg-amber-100 text-amber-900 font-bold p-2.5 rounded-xl border border-amber-300 text-xs flex items-center justify-between">
                  <span>Saldo cargado a Cta Cte:</span>
                  <span className="text-red-700 font-black text-sm">+${lastCompletedSale.totalAmount.toLocaleString('es-AR')}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-800">Total Venta:</span>
                <span className="font-black text-emerald-600 text-base">${lastCompletedSale.totalAmount.toLocaleString('es-AR')}</span>
              </div>
            </div>

            {/* Decision Banner */}
            <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-2xl text-center">
              <span className="text-xs font-bold text-indigo-900">¿Desea imprimir o descargar el comprobante para el cliente?</span>
            </div>

            {/* Print & Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => generateSaleInvoicePDF(lastCompletedSale, appState.storeInfo)}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99]"
              >
                <FileText className="w-4 h-4" />
                <span>🖨️ Imprimir / Descargar Factura AFIP (A4)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => printThermalTicketDirect(lastCompletedSale, appState.storeInfo)}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ticket 80mm</span>
                </button>

                <button
                  type="button"
                  onClick={() => generateThermalTicketPDF(lastCompletedSale, appState.storeInfo)}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors border border-slate-300"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>PDF Ticket 80mm</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={closeModalSafely}
                  className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs transition-all border border-slate-300 flex items-center justify-center space-x-1.5"
                >
                  <span>✖️ NO IMPRIMIR COMPROBANTE / NUEVA VENTA</span>
                </button>

                <button
                  type="button"
                  onClick={handleUndoLastSale}
                  className="w-full py-2 text-amber-700 hover:text-amber-800 font-extrabold text-[11px] flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Deshacer esta venta y volver al carrito</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Balanza / Fraccionamiento / Venta por Peso */}
      {isWeightModalOpen && weightModalProduct && (() => {
        const calcs = getWeightCalculations();
        const pricePerUnit = weightModalProduct.salePrice || 0;

        return (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsWeightModalOpen(false);
              }
            }}
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden transform transition-all">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
                      <Scale className="w-5 h-5 text-indigo-200" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200 block">
                        Balanza & Fraccionamiento
                      </span>
                      <h3 className="text-lg font-black tracking-tight leading-tight">
                        {weightModalProduct.name}
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsWeightModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs bg-black/20 rounded-xl px-3 py-2 border border-white/10">
                  <span className="text-indigo-200 font-medium">Precio de Lista:</span>
                  <span className="font-black text-white text-sm">
                    ${pricePerUnit.toLocaleString('es-AR')} / {weightModalProduct.unit || 'kg'}
                  </span>
                </div>
              </div>

              {/* Mode Tabs */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setWeightMode('grams');
                      setTimeout(() => weightInputRef.current?.select(), 50);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1 ${
                      weightMode === 'grams'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>⚖️ En Gramos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWeightMode('money');
                      setTimeout(() => weightInputRef.current?.select(), 50);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1 ${
                      weightMode === 'money'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>💵 Por Dinero ($)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWeightMode('kilos');
                      setTimeout(() => weightInputRef.current?.select(), 50);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1 ${
                      weightMode === 'kilos'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>📦 En Kilos</span>
                  </button>
                </div>

                {/* Input Area */}
                <div>
                  {weightMode === 'grams' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          Cantidad en Gramos (gr):
                        </label>
                        <div className="relative">
                          <input
                            ref={weightInputRef}
                            type="number"
                            step="1"
                            min="1"
                            value={weightGramsInput}
                            onChange={(e) => setWeightGramsInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleConfirmWeight();
                              } else if (e.key === 'Escape') {
                                setIsWeightModalOpen(false);
                              }
                            }}
                            className="w-full text-2xl font-black text-slate-900 bg-slate-50 border-2 border-indigo-200 focus:border-indigo-600 focus:bg-white rounded-2xl px-4 py-3 pr-12 focus:outline-none transition-all shadow-inner"
                            placeholder="Ej: 250"
                            autoFocus
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                            gr
                          </span>
                        </div>
                      </div>

                      {/* Quick Gram Preset Chips */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Atajos Rápidos:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: '100g', g: 100 },
                            { label: '150g', g: 150 },
                            { label: '200g', g: 200 },
                            { label: '250g (1/4 kg)', g: 250 },
                            { label: '500g (1/2 kg)', g: 500 },
                            { label: '750g (3/4 kg)', g: 750 },
                            { label: '1000g (1 kg)', g: 1000 },
                            { label: '1500g', g: 1500 }
                          ].map(chip => (
                            <button
                              key={chip.g}
                              type="button"
                              onClick={() => {
                                setWeightGramsInput(chip.g.toString());
                                weightInputRef.current?.focus();
                              }}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                                weightGramsInput === chip.g.toString()
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                  : 'bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border-slate-200'
                              }`}
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {weightMode === 'money' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          Monto en Pesos que pide el cliente ($):
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400">
                            $
                          </span>
                          <input
                            ref={weightInputRef}
                            type="number"
                            step="10"
                            min="1"
                            value={weightMoneyInput}
                            onChange={(e) => setWeightMoneyInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleConfirmWeight();
                              } else if (e.key === 'Escape') {
                                setIsWeightModalOpen(false);
                              }
                            }}
                            className="w-full text-2xl font-black text-slate-900 bg-slate-50 border-2 border-indigo-200 focus:border-indigo-600 focus:bg-white rounded-2xl pl-9 pr-4 py-3 focus:outline-none transition-all shadow-inner"
                            placeholder="Ej: 2000"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Quick Money Preset Chips */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Montos Frecuentes:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[500, 1000, 1500, 2000, 2500, 3000, 5000].map(m => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setWeightMoneyInput(m.toString());
                                weightInputRef.current?.focus();
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                                weightMoneyInput === m.toString()
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                  : 'bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border-slate-200'
                              }`}
                            >
                              ${m.toLocaleString('es-AR')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {weightMode === 'kilos' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          Peso en Kilos (ej. de balanza digital):
                        </label>
                        <div className="relative">
                          <input
                            ref={weightInputRef}
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={weightKilosInput}
                            onChange={(e) => setWeightKilosInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleConfirmWeight();
                              } else if (e.key === 'Escape') {
                                setIsWeightModalOpen(false);
                              }
                            }}
                            className="w-full text-2xl font-black text-slate-900 bg-slate-50 border-2 border-indigo-200 focus:border-indigo-600 focus:bg-white rounded-2xl px-4 py-3 pr-12 focus:outline-none transition-all shadow-inner"
                            placeholder="Ej: 1.350"
                            autoFocus
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                            kg
                          </span>
                        </div>
                      </div>

                      {/* Quick Kilo Preset Chips */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Kilos Frecuentes:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: '0.25 kg', k: 0.25 },
                            { label: '0.50 kg', k: 0.5 },
                            { label: '0.75 kg', k: 0.75 },
                            { label: '1.00 kg', k: 1 },
                            { label: '1.50 kg', k: 1.5 },
                            { label: '2.00 kg', k: 2 },
                            { label: '3.00 kg', k: 3 }
                          ].map(chip => (
                            <button
                              key={chip.k}
                              type="button"
                              onClick={() => {
                                setWeightKilosInput(chip.k.toString());
                                weightInputRef.current?.focus();
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                                weightKilosInput === chip.k.toString()
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                  : 'bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border-slate-200'
                              }`}
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Calculation Result Summary Card */}
                <div className="bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 p-4 rounded-2xl border border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold">Peso equivalente:</span>
                    <span className="font-extrabold text-slate-900">
                      {calcs.grams.toLocaleString('es-AR')} gr ({calcs.kilos} kg)
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-indigo-100/60">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Total a Cobrar:</span>
                    <span className="text-xl font-black text-indigo-600 tracking-tight">
                      ${calcs.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsWeightModalOpen(false)}
                    className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors"
                  >
                    Cancelar (ESC)
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmWeight}
                    className="flex-[2] py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99]"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{isEditingCartItem ? 'Actualizar en Carrito (ENTER)' : 'Llevar al Carrito (ENTER)'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
