import { AppState, Product, Supplier, Customer, Sale, CustomerWithdrawal, Cheque, CashRegister, CustomerTransaction, StockMovement, GlobalPriceIncreaseLog, StoreInfo, SystemUser } from '../types';
import { initialAppData } from '../data/mockData';

export class DataService {
  private static state: AppState = { ...initialAppData };
  private static listeners: Array<(state: AppState) => void> = [];
  private static isConnected: boolean = false;
  private static eventSource: EventSource | null = null;

  private static currentStoreId: string = localStorage.getItem('gc_store_id') || '';
  private static currentUserId: string = localStorage.getItem('gc_user_id') || '';

  public static getCurrentStoreId(): string {
    return this.currentStoreId;
  }

  public static getCurrentUserId(): string {
    return this.currentUserId;
  }

  public static setCurrentSession(storeId: string, userId: string) {
    this.currentStoreId = storeId;
    this.currentUserId = userId;
    localStorage.setItem('gc_store_id', storeId);
    localStorage.setItem('gc_user_id', userId);
    this.fetchLatest();
  }

  public static clearSession() {
    this.currentStoreId = '';
    this.currentUserId = '';
    localStorage.removeItem('gc_store_id');
    localStorage.removeItem('gc_user_id');
    this.notify();
  }

  public static getState(): AppState {
    if (!this.currentStoreId) {
      return this.state;
    }
    return this.getStoreScopedState(this.currentStoreId);
  }

  public static getStoreScopedState(storeId: string): AppState {
    const sId = storeId;
    
    // Filter products
    const products = this.state.products.filter(p => (p as any).storeId === sId || (! (p as any).storeId && sId === 'store-demo-a'));
    const sales = this.state.sales.filter(s => (s as any).storeId === sId || (! (s as any).storeId && sId === 'store-demo-a'));
    const customers = this.state.customers.filter(c => (c as any).storeId === sId || (! (c as any).storeId && sId === 'store-demo-a'));
    const suppliers = this.state.suppliers.filter(sup => (sup as any).storeId === sId || (! (sup as any).storeId && sId === 'store-demo-a'));
    const cheques = this.state.cheques.filter(chq => (chq as any).storeId === sId || (! (chq as any).storeId && sId === 'store-demo-a'));
    const cashRegisters = this.state.cashRegisters.filter(cr => (cr as any).storeId === sId || (! (cr as any).storeId && sId === 'store-demo-a'));
    const withdrawals = this.state.withdrawals.filter(w => (w as any).storeId === sId || (! (w as any).storeId && sId === 'store-demo-a'));
    const priceIncreaseLogs = this.state.priceIncreaseLogs.filter(log => (log as any).storeId === sId || (! (log as any).storeId && sId === 'store-demo-a'));

    const currentStore = (this.state.stores || []).find(st => st.id === sId);

    const storeInfo: StoreInfo = {
      ...this.state.storeInfo,
      name: currentStore ? currentStore.name : this.state.storeInfo.name,
      cuit: currentStore ? currentStore.cuit : this.state.storeInfo.cuit,
      businessType: currentStore ? currentStore.businessType : this.state.storeInfo.businessType
    };

    return {
      ...this.state,
      currentStoreId: sId,
      currentUserId: this.currentUserId,
      storeInfo,
      products,
      sales,
      customers,
      suppliers,
      cheques,
      cashRegisters,
      withdrawals,
      priceIncreaseLogs
    };
  }

  public static subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.push(listener);
    // Initial call
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notify() {
    this.listeners.forEach(l => l(this.getState()));
  }

  public static isRealtimeConnected(): boolean {
    return this.isConnected;
  }

  public static async init() {
    // 1. Fetch initial state from server
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.state = json.data;
          this.notify();
        }
      }
    } catch (err) {
      console.warn('[DataService] Server API unavailable, using local fallback state.', err);
    }

    // 2. Connect to SSE for real-time multi-device sync
    this.connectSSE();
  }

  private static connectSSE() {
    if (typeof EventSource === 'undefined') return;

    try {
      this.eventSource = new EventSource('/api/events');

      this.eventSource.onopen = () => {
        this.isConnected = true;
        console.log('[Realtime] Connected to SSE server.');
        this.notify();
      };

      this.eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'FULL_SYNC' && payload.payload) {
            this.state = payload.payload;
          } else if (payload.type === 'STORE_INFO_UPDATED' && payload.payload) {
            this.state = { ...this.state, storeInfo: payload.payload };
          } else if (payload.type === 'PRODUCTS_UPDATED' && payload.payload) {
            this.state = { ...this.state, products: payload.payload };
          } else if (payload.type === 'CUSTOMERS_UPDATED' && payload.payload) {
            this.state = { ...this.state, customers: payload.payload };
          } else if (payload.payload && payload.payload.state) {
            this.state = payload.payload.state;
          } else if (payload.payload && payload.payload.data) {
            this.state = payload.payload.data;
          } else {
            // Re-fetch state
            this.fetchLatest();
          }
          this.notify();
        } catch (e) {
          console.error('[Realtime] Parse error:', e);
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.notify();
        // EventSource handles automatic reconnection
      };
    } catch (e) {
      console.warn('[Realtime] Failed to initialize SSE stream:', e);
    }
  }

  public static async fetchLatest() {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.state = json.data;
          this.notify();
        }
      }
    } catch (err) {
      console.error('[DataService] Fetch latest error:', err);
    }
  }

  // --- ACTIONS ---

  public static async saveProduct(product: Product): Promise<void> {
    const itemWithStore = { ...product, storeId: (product as any).storeId || this.currentStoreId || 'store-demo-a' };
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemWithStore)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          await this.fetchLatest();
          return;
        }
      }
    } catch (e) {
      console.warn('[DataService] Fallback to client state edit');
    }

    const index = this.state.products.findIndex(p => p.id === itemWithStore.id);
    if (index >= 0) {
      this.state.products[index] = itemWithStore;
    } else {
      this.state.products.unshift(itemWithStore);
    }
    this.notify();
  }

  public static async deleteProduct(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await this.fetchLatest();
        return;
      }
    } catch (e) {}

    this.state.products = this.state.products.filter(p => p.id !== id);
    this.notify();
  }

  public static async applyGlobalPriceIncrease(params: {
    supplierId: string;
    categoryFilter?: string;
    percentage: number;
    applyToCost: boolean;
    applyToSale: boolean;
    recalculateMargin: boolean;
  }): Promise<{ affectedCount: number }> {
    try {
      const res = await fetch('/api/suppliers/increase-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          this.state = json.data;
          this.notify();
          return { affectedCount: json.affectedCount };
        }
      }
    } catch (e) {}

    // Fallback client side implementation
    const factor = 1 + params.percentage / 100;
    let count = 0;
    this.state.products = this.state.products.map(p => {
      let match = true;
      if (params.supplierId && params.supplierId !== 'ALL' && p.supplierId !== params.supplierId) match = false;
      if (params.categoryFilter && params.categoryFilter !== 'ALL' && p.category !== params.categoryFilter) match = false;

      if (match) {
        count++;
        let newCost = p.costPrice;
        let newSale = p.salePrice;
        if (params.applyToCost) newCost = Math.round(p.costPrice * factor);
        if (params.applyToSale) {
          if (params.recalculateMargin && params.applyToCost) {
            const marginRatio = p.salePrice / (p.costPrice || 1);
            newSale = Math.round(newCost * marginRatio);
          } else {
            newSale = Math.round(p.salePrice * factor);
          }
        }
        return { ...p, costPrice: newCost, salePrice: newSale, updatedAt: new Date().toISOString() };
      }
      return p;
    });

    const supplierObj = this.state.suppliers.find(s => s.id === params.supplierId);
    this.state.priceIncreaseLogs.unshift({
      id: `inc-${Date.now()}`,
      supplierId: params.supplierId,
      supplierName: params.supplierId === 'ALL' ? 'Todos los Proveedores' : (supplierObj?.name || 'Proveedor'),
      categoryFilter: params.categoryFilter,
      percentage: params.percentage,
      applyToCost: params.applyToCost,
      applyToSale: params.applyToSale,
      recalculateMargin: params.recalculateMargin,
      affectedProductsCount: count,
      date: new Date().toISOString()
    });

    this.notify();
    return { affectedCount: count };
  }

  public static async processSale(sale: Sale): Promise<void> {
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          this.state = json.data;
          this.notify();
          return;
        }
      }
    } catch (e) {}

    // Client fallback
    sale.items.forEach(item => {
      const prod = this.state.products.find(p => p.id === item.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
      }
    });
    this.state.sales.unshift(sale);

    if (sale.paymentMethod === 'current_account' && sale.customerId) {
      const customer = this.state.customers.find(c => c.id === sale.customerId);
      if (customer) {
        customer.currentBalance += sale.totalAmount;
        this.state.customerTransactions.unshift({
          id: `tx-${Date.now()}`,
          customerId: customer.id,
          type: 'sale',
          amount: sale.totalAmount,
          balanceAfter: customer.currentBalance,
          date: sale.date,
          description: `Venta ${sale.invoiceNumber} a Cta Cte`
        });
      }
    }

    this.notify();
  }

  public static async annulSale(saleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/sales/${saleId}/annul`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          this.state = json.data;
          this.notify();
          return { success: true };
        }
        return { success: false, error: json.error || 'Error al anular la venta' };
      }
    } catch (e) {}

    // Fallback client-side
    const sale = this.state.sales.find(s => s.id === saleId);
    if (!sale) return { success: false, error: 'Venta no encontrada' };
    if (sale.status === 'annulled') return { success: false, error: 'La venta ya se encuentra anulada' };

    sale.status = 'annulled';

    sale.items.forEach(item => {
      const prod = this.state.products.find(p => p.id === item.productId);
      if (prod) {
        prod.stock += item.quantity;
      }
    });

    if (sale.paymentMethod === 'current_account' && sale.customerId) {
      const customer = this.state.customers.find(c => c.id === sale.customerId);
      if (customer) {
        customer.currentBalance = Math.max(0, customer.currentBalance - sale.totalAmount);
        this.state.customerTransactions.unshift({
          id: `tx-annul-${Date.now()}`,
          customerId: customer.id,
          type: 'adjustment',
          amount: sale.totalAmount,
          balanceAfter: customer.currentBalance,
          date: new Date().toISOString(),
          description: `ANULACIÓN Venta ${sale.invoiceNumber}`,
          saleId: sale.id
        });
      }
    }

    this.notify();
    return { success: true };
  }

  public static async registerCustomerPayment(params: {
    customerId: string;
    amount: number;
    paymentMethod: string;
    notes?: string;
  }): Promise<void> {
    try {
      const res = await fetch('/api/customers/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          this.state = json.data;
          this.notify();
          return;
        }
      }
    } catch (e) {}

    const customer = this.state.customers.find(c => c.id === params.customerId);
    if (customer) {
      customer.currentBalance = Math.max(0, customer.currentBalance - params.amount);
      this.state.customerTransactions.unshift({
        id: `tx-${Date.now()}`,
        customerId: customer.id,
        type: 'payment',
        amount: params.amount,
        balanceAfter: customer.currentBalance,
        date: new Date().toISOString(),
        description: `Pago a Cta Cte (${params.paymentMethod}) ${params.notes || ''}`
      });
      this.notify();
    }
  }

  public static async registerWithdrawal(withdrawal: CustomerWithdrawal): Promise<void> {
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withdrawal)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          this.state = json.data;
          this.notify();
          return;
        }
      }
    } catch (e) {}

    withdrawal.items.forEach(item => {
      const prod = this.state.products.find(p => p.id === item.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
      }
    });
    this.state.withdrawals.unshift(withdrawal);
    this.notify();
  }

  public static async updateWithdrawalStatus(id: string, status: 'pending' | 'billed' | 'returned'): Promise<void> {
    try {
      const res = await fetch(`/api/withdrawals/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          await this.fetchLatest();
          return;
        }
      }
    } catch (e) {}

    const item = this.state.withdrawals.find(w => w.id === id);
    if (item) {
      item.status = status;
      this.notify();
    }
  }

  public static async saveCheque(cheque: Cheque): Promise<void> {
    try {
      const res = await fetch('/api/cheques', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cheque)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          this.state = json.data;
          this.notify();
          return;
        }
      }
    } catch (e) {}

    const index = this.state.cheques.findIndex(c => c.id === cheque.id);
    if (index >= 0) {
      this.state.cheques[index] = cheque;
    } else {
      this.state.cheques.unshift(cheque);
    }
    this.notify();
  }

  public static async saveCustomer(customer: Customer): Promise<void> {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          await this.fetchLatest();
          return;
        }
      }
    } catch (e) {}

    const index = this.state.customers.findIndex(c => c.id === customer.id);
    if (index >= 0) {
      this.state.customers[index] = customer;
    } else {
      this.state.customers.unshift(customer);
    }
    this.notify();
  }

  public static async deleteCustomer(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await this.fetchLatest();
        return;
      }
    } catch (e) {}

    this.state.customers = this.state.customers.filter(c => c.id !== id);
    this.notify();
  }

  public static async saveSupplier(supplier: Supplier): Promise<void> {
    const index = this.state.suppliers.findIndex(s => s.id === supplier.id);
    if (index >= 0) {
      this.state.suppliers[index] = supplier;
    } else {
      this.state.suppliers.unshift(supplier);
    }
    this.notify();
  }

  public static async updateStoreInfo(info: Partial<AppState['storeInfo']>): Promise<void> {
    this.state.storeInfo = { ...this.state.storeInfo, ...info };
    this.notify();
    try {
      await fetch('/api/store-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info)
      });
    } catch (e) {
      console.warn('Failed to persist store info on server, updated locally.', e);
    }
  }

  public static async replaceProducts(products: Product[]): Promise<void> {
    this.state.products = products;
    this.notify();
    try {
      await fetch('/api/products/replace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products })
      });
    } catch (e) {
      console.warn('Failed to persist replaced products on server, updated locally.', e);
    }
  }

  public static async resetDemo(): Promise<void> {
    try {
      const res = await fetch('/api/reset-demo', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          this.state = json.data;
          this.notify();
          return;
        }
      }
    } catch (e) {}
    this.state = JSON.parse(JSON.stringify(initialAppData));
    this.notify();
  }

  public static async saveUser(user: SystemUser): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      const json = await res.json();
      if (res.ok && json.success) {
        this.state.users = json.data;
        this.notify();
        return { success: true };
      }
      return { success: false, error: json.error || 'Error al guardar el usuario' };
    } catch (e) {
      const index = this.state.users.findIndex(u => u.id === user.id);
      if (index >= 0) {
        this.state.users[index] = user;
      } else {
        this.state.users.unshift(user);
      }
      this.notify();
      return { success: true };
    }
  }

  public static async deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        this.state.users = json.data;
        this.notify();
        return { success: true };
      }
      return { success: false, error: json.error || 'Error al eliminar el usuario' };
    } catch (e) {
      this.state.users = this.state.users.filter(u => u.id !== id);
      this.notify();
      return { success: true };
    }
  }
}
