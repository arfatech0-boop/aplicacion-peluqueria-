import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { AppState, CashRegister, Cheque, Customer, CustomerTransaction, CustomerWithdrawal, GlobalPriceIncreaseLog, Product, Sale, StockMovement, StoreAccount, StoreInfo, Supplier, SystemUser } from '../types';
import { initialAppData } from '../data/mockData';
import { SUPABASE_URL, SUPABASE_KEY } from '../config';

interface OfflineSyncItem {
  id: string;
  table: string;
  action: 'upsert' | 'delete';
  data: any;
  timestamp: number;
}

export class DataService {
  private static listeners: ((state: AppState) => void)[] = [];
  
  // Use the same SUPABASE_URL and SUPABASE_KEY from Vite env vars
  private static supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;
  private static supabaseKey = import.meta.env.VITE_SUPABASE_KEY || SUPABASE_KEY;
  public static supabase: SupabaseClient = createClient(this.supabaseUrl, this.supabaseKey);

  private static currentStoreId: string = localStorage.getItem('gc_store_id') || 'store-demo-a';
  private static currentUserId: string = localStorage.getItem('gc_user_id') || '';

  private static state: AppState = {
    stores: [],
    storeInfo: {} as StoreInfo,
    users: [],
    products: [],
    suppliers: [],
    priceIncreaseLogs: [],
    customers: [],
    customerTransactions: [],
    withdrawals: [],
    sales: [],
    cheques: [],
    cashRegisters: [],
    stockMovements: []
  };

  private static rawStoreInfos: any[] = [];
  private static isInitialized = false;
  private static isOnline = navigator.onLine;
  private static isSyncing = false;
  private static offlineQueue: OfflineSyncItem[] = [];

  public static async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    // 1. Cargar caché offline inmediatamente desde localStorage para arrancar al instante (sin esperar internet)
    this.loadFromLocalCache();

    // 2. Cargar cola de sincronización offline
    this.loadOfflineQueue();

    // 3. Configurar listeners de red (cuando vuelve o se va el WiFi)
    this.setupNetworkListeners();

    // 4. Suscribirse a cambios en tiempo real
    this.setupRealtimeSubscription();

    // 5. Si hay internet, traer datos actualizados y procesar pendientes
    if (navigator.onLine) {
      await this.fetchAllData();
      await this.syncOfflineQueue();
    }
  }

  private static loadFromLocalCache() {
    try {
      const cached = localStorage.getItem('gc_offline_state_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          this.state = {
            stores: parsed.stores || [],
            storeInfo: parsed.storeInfo || {} as StoreInfo,
            users: parsed.users || [],
            products: parsed.products || [],
            suppliers: parsed.suppliers || [],
            priceIncreaseLogs: parsed.priceIncreaseLogs || [],
            customers: parsed.customers || [],
            customerTransactions: parsed.customerTransactions || [],
            withdrawals: parsed.withdrawals || [],
            sales: parsed.sales || [],
            cheques: parsed.cheques || [],
            cashRegisters: parsed.cashRegisters || [],
            stockMovements: parsed.stockMovements || []
          };
          this.rawStoreInfos = parsed.rawStoreInfos || [];
          this.notify();
          return;
        }
      }
      
      // Si no hay nada guardado aún, cargar mockData por defecto
      if (!this.state.products || this.state.products.length === 0) {
        this.state = {
          stores: [
            {
              id: 'store-demo-a',
              name: initialAppData.storeInfo.name,
              cuit: initialAppData.storeInfo.cuit,
              businessType: initialAppData.storeInfo.businessType,
              active: true,
              isDemo: true,
              createdAt: new Date().toISOString()
            }
          ],
          storeInfo: initialAppData.storeInfo,
          users: initialAppData.users || [],
          products: (initialAppData.products || []).map(p => ({ ...p, storeId: 'store-demo-a' })),
          suppliers: (initialAppData.suppliers || []).map(s => ({ ...s, storeId: 'store-demo-a' })),
          priceIncreaseLogs: (initialAppData.priceIncreaseLogs || []).map(l => ({ ...l, storeId: 'store-demo-a' })),
          customers: (initialAppData.customers || []).map(c => ({ ...c, storeId: 'store-demo-a' })),
          customerTransactions: (initialAppData.customerTransactions || []).map(t => ({ ...t, storeId: 'store-demo-a' })),
          withdrawals: (initialAppData.withdrawals || []).map(w => ({ ...w, storeId: 'store-demo-a' })),
          sales: (initialAppData.sales || []).map(s => ({ ...s, storeId: 'store-demo-a' })),
          cheques: (initialAppData.cheques || []).map(c => ({ ...c, storeId: 'store-demo-a' })),
          cashRegisters: (initialAppData.cashRegisters || []).map(r => ({ ...r, storeId: 'store-demo-a' })),
          stockMovements: (initialAppData.stockMovements || []).map(m => ({ ...m, storeId: 'store-demo-a' }))
        };
        this.rawStoreInfos = [{ ...initialAppData.storeInfo, storeId: 'store-demo-a' }];
        this.saveToLocalCache();
        this.notify();
      }
    } catch (e) {
      console.warn('[DataService] Error loading local cache:', e);
    }
  }

  private static saveToLocalCache() {
    try {
      const dataToSave = {
        ...this.state,
        rawStoreInfos: this.rawStoreInfos
      };
      localStorage.setItem('gc_offline_state_v1', JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('[DataService] LocalStorage quota exceeded or unavailable:', e);
    }
  }

  private static loadOfflineQueue() {
    try {
      const saved = localStorage.getItem('gc_offline_queue');
      this.offlineQueue = saved ? JSON.parse(saved) : [];
    } catch {
      this.offlineQueue = [];
    }
  }

  private static saveOfflineQueue() {
    try {
      localStorage.setItem('gc_offline_queue', JSON.stringify(this.offlineQueue));
    } catch (e) {
      console.warn('[DataService] Error saving offline queue:', e);
    }
  }

  public static getOfflinePendingCount(): number {
    return this.offlineQueue.length;
  }

  public static isRealtimeConnected(): boolean {
    return this.isOnline;
  }

  private static setupNetworkListeners() {
    window.addEventListener('online', async () => {
      console.log('📶 [DataService] Internet restablecido - Modo Online');
      this.isOnline = true;
      this.notify();
      await this.syncOfflineQueue();
      await this.fetchAllData();
    });

    window.addEventListener('offline', () => {
      console.log('📵 [DataService] Sin conexión - Modo Offline activo');
      this.isOnline = false;
      this.notify();
    });
  }

  private static async syncOfflineQueue() {
    if (this.isSyncing || this.offlineQueue.length === 0 || !navigator.onLine) return;
    this.isSyncing = true;
    console.log(`🔄 [DataService] Sincronizando ${this.offlineQueue.length} acciones pendientes con Supabase...`);

    const remainingQueue: OfflineSyncItem[] = [];

    for (const item of this.offlineQueue) {
      try {
        if (item.action === 'upsert') {
          const { error } = await this.supabase.from(item.table).upsert(item.data);
          if (error) throw error;
        } else if (item.action === 'delete') {
          const { error } = await this.supabase.from(item.table).delete().eq('id', item.data.id);
          if (error) throw error;
        }
      } catch (err) {
        console.warn(`[DataService] Error syncing item ${item.table} ${item.id}:`, err);
        remainingQueue.push(item);
      }
    }

    this.offlineQueue = remainingQueue;
    this.saveOfflineQueue();
    this.isSyncing = false;
    this.notify();
  }

  private static async fetchAllData() {
    try {
      const [
        { data: stores },
        { data: storeInfo },
        { data: users },
        { data: products },
        { data: suppliers },
        { data: priceIncreaseLogs },
        { data: customers },
        { data: customerTransactions },
        { data: withdrawals },
        { data: sales },
        { data: cheques },
        { data: cashRegisters },
        { data: stockMovements }
      ] = await Promise.all([
        this.supabase.from('stores').select('*'),
        this.supabase.from('storeInfo').select('*'),
        this.supabase.from('users').select('*'),
        this.supabase.from('products').select('*'),
        this.supabase.from('suppliers').select('*'),
        this.supabase.from('priceIncreaseLogs').select('*'),
        this.supabase.from('customers').select('*'),
        this.supabase.from('customerTransactions').select('*'),
        this.supabase.from('withdrawals').select('*'),
        this.supabase.from('sales').select('*'),
        this.supabase.from('cheques').select('*'),
        this.supabase.from('cashRegisters').select('*'),
        this.supabase.from('stockMovements').select('*')
      ]);

      this.rawStoreInfos = storeInfo || [];

      this.state = {
        stores: stores || [],
        storeInfo: {} as StoreInfo,
        users: users || [],
        products: products || [],
        suppliers: suppliers || [],
        priceIncreaseLogs: priceIncreaseLogs || [],
        customers: customers || [],
        customerTransactions: customerTransactions || [],
        withdrawals: withdrawals || [],
        sales: sales || [],
        cheques: cheques || [],
        cashRegisters: cashRegisters || [],
        stockMovements: stockMovements || []
      };

      this.notify();
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    }
  }

  private static notify() {
    const scopedState = this.getStoreScopedState(this.currentStoreId);
    this.listeners.forEach(listener => listener(scopedState));
  }

  public static getState(): AppState {
    if (!this.state.stores || this.state.stores.length === 0) {
      // If we haven't loaded data yet, return empty structured state
      return this.getStoreScopedState(this.currentStoreId);
    }
    return this.getStoreScopedState(this.currentStoreId);
  }

  public static getStoreScopedState(storeId: string): AppState {
    const sId = storeId;
    const isSuperAdmin = this.state.users?.find(u => u.id === this.currentUserId)?.role === 'superadmin';
    
    // Filter by storeId
    const filterByStore = (arr: any[]) => arr?.filter(item => {
      if (!sId) return false;
      if (item.storeId === sId) return true;
      if (!item.storeId && sId === 'store-demo-a') return true;
      return false;
    }) || [];

    const products = filterByStore(this.state.products);
    const sales = filterByStore(this.state.sales);
    const customers = filterByStore(this.state.customers);
    const customerTransactions = filterByStore(this.state.customerTransactions);
    const suppliers = filterByStore(this.state.suppliers);
    const cheques = filterByStore(this.state.cheques);
    const cashRegisters = filterByStore(this.state.cashRegisters);
    const withdrawals = filterByStore(this.state.withdrawals);
    const priceIncreaseLogs = filterByStore(this.state.priceIncreaseLogs);
    const stockMovements = filterByStore(this.state.stockMovements);

    const currentStore = (this.state.stores || []).find(st => st.id === sId);
    const matchedStoreInfo = (this.rawStoreInfos || []).find((si: any) => si.storeId === sId)
      || (this.rawStoreInfos || []).find((si: any) => !si.storeId && sId === 'store-demo-a')
      || ({} as any);

    const storeInfo: StoreInfo = {
      ...matchedStoreInfo,
      name: currentStore ? currentStore.name : (matchedStoreInfo.name || ''),
      cuit: currentStore ? currentStore.cuit : (matchedStoreInfo.cuit || ''),
      businessType: currentStore ? currentStore.businessType : (matchedStoreInfo.businessType || 'Comercio General / Multirrubro')
    };

    return {
      ...this.state,
      stores: isSuperAdmin ? this.state.stores : currentStore ? [currentStore] : [],
      currentStoreId: sId,
      currentUserId: this.currentUserId,
      storeInfo,
      products,
      sales,
      customers,
      customerTransactions,
      suppliers,
      cheques,
      cashRegisters,
      withdrawals,
      priceIncreaseLogs,
      stockMovements,
      users: isSuperAdmin ? this.state.users : (this.state.users || []).filter(u => 
        (sId && u.storeId === sId) || (!u.storeId && sId === 'store-demo-a') || u.role === 'superadmin'
      )
    };
  }

  public static getUserByUsername(username: string): SystemUser | undefined {
    return this.state.users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() || 
      u.email?.toLowerCase() === username.toLowerCase()
    );
  }

  public static subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public static setCurrentStoreId(storeId: string) {
    this.currentStoreId = storeId;
    localStorage.setItem('gc_store_id', storeId);
    this.notify();
  }

  public static getCurrentStoreId(): string {
    return this.currentStoreId;
  }

  public static setCurrentUserId(userId: string) {
    this.currentUserId = userId;
    if (userId) {
      localStorage.setItem('gc_user_id', userId);
    } else {
      localStorage.removeItem('gc_user_id');
    }
    this.notify();
  }

  public static getCurrentUserId(): string {
    return this.currentUserId;
  }

  public static setCurrentSession(storeId: string, userId: string) {
    this.setCurrentStoreId(storeId);
    this.setCurrentUserId(userId);
  }

  public static clearSession() {
    this.setCurrentStoreId('store-demo-a');
    this.setCurrentUserId('');
  }

  // Generic save/upsert function with Offline Queue support
  private static async saveToSupabase(table: string, data: any) {
    // 1. Update local memory optimistically
    const list = (this.state as any)[table];
    if (Array.isArray(list)) {
      const idx = list.findIndex((item: any) => item.id === data.id);
      if (idx >= 0) list[idx] = data;
      else list.push(data);
      this.saveToLocalCache();
      this.notify();
    }

    // 2. If offline or Supabase fails, save to offlineQueue
    if (!navigator.onLine) {
      this.enqueueOfflineAction({
        id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        table,
        action: 'upsert',
        data,
        timestamp: Date.now()
      });
      return;
    }

    try {
      const { error } = await this.supabase.from(table).upsert(data);
      if (error) throw error;
    } catch (err) {
      console.warn(`[DataService] Supabase network error on ${table}, queueing offline:`, err);
      this.enqueueOfflineAction({
        id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        table,
        action: 'upsert',
        data,
        timestamp: Date.now()
      });
    }
  }

  // Generic delete function with Offline Queue support
  private static async deleteFromSupabase(table: string, id: string) {
    // 1. Update local memory optimistically
    const list = (this.state as any)[table];
    if (Array.isArray(list)) {
      (this.state as any)[table] = list.filter((item: any) => item.id !== id);
      this.saveToLocalCache();
      this.notify();
    }

    // 2. If offline or Supabase fails, queue action
    if (!navigator.onLine) {
      this.enqueueOfflineAction({
        id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        table,
        action: 'delete',
        data: { id },
        timestamp: Date.now()
      });
      return;
    }

    try {
      const { error } = await this.supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn(`[DataService] Supabase network error on delete ${table}, queueing offline:`, err);
      this.enqueueOfflineAction({
        id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        table,
        action: 'delete',
        data: { id },
        timestamp: Date.now()
      });
    }
  }

  private static enqueueOfflineAction(item: OfflineSyncItem) {
    this.offlineQueue.push(item);
    this.saveOfflineQueue();
    this.notify();
  }

  public static async forceSyncNow(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    if (!navigator.onLine) {
      return { success: false, syncedCount: 0, error: 'Sin conexión a Internet' };
    }
    const initialCount = this.offlineQueue.length;
    await this.syncOfflineQueue();
    await this.fetchAllData();
    return { success: true, syncedCount: initialCount - this.offlineQueue.length };
  }

  public static async saveProduct(product: Product) {
    await this.saveToSupabase('products', { ...product, storeId: this.currentStoreId });
  }

  public static async replaceProducts(newProducts: Product[]) {
    const storeId = this.currentStoreId;
    const productsWithStore = newProducts.map(p => ({ ...p, storeId }));

    // Update local state and cache
    this.state.products = [
      ...this.state.products.filter(p => p.storeId !== storeId),
      ...productsWithStore
    ];
    this.saveToLocalCache();
    this.notify();

    if (navigator.onLine) {
      try {
        await this.supabase.from('products').delete().eq('storeId', storeId);
        if (productsWithStore.length > 0) {
          await this.supabase.from('products').insert(productsWithStore);
        }
      } catch (err) {
        console.warn('[DataService] Error syncing replaceProducts to Supabase:', err);
        for (const prod of productsWithStore) {
          this.enqueueOfflineAction({
            id: `offline-prod-${prod.id}`,
            table: 'products',
            action: 'upsert',
            data: prod,
            timestamp: Date.now()
          });
        }
      }
    } else {
      for (const prod of productsWithStore) {
        this.enqueueOfflineAction({
          id: `offline-prod-${prod.id}`,
          table: 'products',
          action: 'upsert',
          data: prod,
          timestamp: Date.now()
        });
      }
    }
  }

  public static async deleteProduct(productId: string) {
    await this.deleteFromSupabase('products', productId);
  }

  public static async saveSale(sale: Sale) {
    const saleWithStore = { ...sale, storeId: this.currentStoreId };
    await this.saveToSupabase('sales', saleWithStore);

    // Also deduct stock for items
    for (const item of sale.items) {
      const prod = this.state.products.find(p => p.id === item.productId);
      if (prod) {
        const prevStock = prod.stock;
        prod.stock -= item.quantity;
        await this.saveToSupabase('products', prod);
        
        await this.saveToSupabase('stockMovements', {
          id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          storeId: this.currentStoreId,
          productId: prod.id,
          productName: prod.name,
          type: 'sale',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock: prod.stock,
          date: sale.date,
          reason: `Venta ${sale.invoiceNumber}`
        });
      }
    }
  }

  public static async saveCustomer(customer: Customer) {
    await this.saveToSupabase('customers', { ...customer, storeId: this.currentStoreId });
  }

  public static async deleteCustomer(customerId: string) {
    await this.deleteFromSupabase('customers', customerId);
  }

  public static async saveCustomerTransaction(tx: CustomerTransaction) {
    await this.saveToSupabase('customerTransactions', { ...tx, storeId: this.currentStoreId });
  }

  public static async registerCustomerPayment(params: {
    customerId: string;
    amount: number;
    paymentMethod: string;
    notes?: string;
  }) {
    const customer = this.state.customers.find(c => c.id === params.customerId);
    if (!customer) return;

    const previousBalance = customer.currentBalance;
    const newBalance = previousBalance - params.amount;
    customer.currentBalance = newBalance;

    await this.saveToSupabase('customers', customer);

    const transaction: CustomerTransaction = {
      id: `tx-${Date.now()}`,
      customerId: params.customerId,
      customerName: customer.name,
      date: new Date().toISOString(),
      type: 'payment',
      amount: params.amount,
      description: params.notes || `Cobranza / Pago recibido (${params.paymentMethod})`,
      balanceAfter: newBalance,
      reference: `REC-${Date.now().toString().slice(-6)}`
    };

    await this.saveToSupabase('customerTransactions', transaction);
  }

  public static async registerWithdrawal(withdrawal: CustomerWithdrawal) {
    const withStore = { ...withdrawal, storeId: this.currentStoreId };
    await this.saveToSupabase('withdrawals', withStore);

    // Deduct stock for withdrawn items
    for (const item of withdrawal.items) {
      const prod = this.state.products.find(p => p.id === item.productId);
      if (prod) {
        const prevStock = prod.stock;
        prod.stock -= item.quantity;
        await this.saveToSupabase('products', prod);

        await this.saveToSupabase('stockMovements', {
          id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          storeId: this.currentStoreId,
          productId: prod.id,
          productName: prod.name,
          type: 'adjustment',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock: prod.stock,
          date: withdrawal.date,
          reason: `Retiro de mercadería #${withdrawal.withdrawalNumber}`
        });
      }
    }
  }

  public static async updateWithdrawalStatus(withdrawalId: string, status: 'pending' | 'billed' | 'cancelled') {
    const withdrawal = this.state.withdrawals.find(w => w.id === withdrawalId);
    if (withdrawal) {
      withdrawal.status = status;
      await this.saveToSupabase('withdrawals', withdrawal);
    }
  }

  public static async applyGlobalPriceIncrease(params: {
    supplierId?: string;
    categoryFilter?: string;
    percentage: number;
    applyToCost: boolean;
    applyToSale: boolean;
    recalculateMargin: boolean;
  }): Promise<{ affectedCount: number }> {
    const storeId = this.currentStoreId;
    let affectedCount = 0;

    const updatedProducts = this.state.products.map(product => {
      if (product.storeId && product.storeId !== storeId) return product;

      // Filter by supplier if provided
      if (params.supplierId && product.supplierId !== params.supplierId) return product;

      // Filter by category if provided
      if (params.categoryFilter && product.category !== params.categoryFilter) return product;

      affectedCount++;
      const multiplier = 1 + params.percentage / 100;
      let newCostPrice = product.costPrice;
      let newSalePrice = product.price;

      if (params.applyToCost) {
        newCostPrice = Math.round(product.costPrice * multiplier * 100) / 100;
      }

      if (params.applyToSale) {
        newSalePrice = Math.round(product.price * multiplier * 100) / 100;
      } else if (params.applyToCost && params.recalculateMargin) {
        newSalePrice = Math.round(newCostPrice * (1 + (product.margin || 30) / 100) * 100) / 100;
      }

      const updatedProd: Product = {
        ...product,
        costPrice: newCostPrice,
        price: newSalePrice,
        updatedAt: new Date().toISOString()
      };

      this.saveToSupabase('products', updatedProd);
      return updatedProd;
    });

    this.state.products = updatedProducts;
    this.saveToLocalCache();
    this.notify();

    // Log the price increase
    const log: GlobalPriceIncreaseLog = {
      id: `log-${Date.now()}`,
      storeId,
      date: new Date().toISOString(),
      percentage: params.percentage,
      supplierId: params.supplierId,
      supplierName: params.supplierId ? this.state.suppliers.find(s => s.id === params.supplierId)?.name : undefined,
      category: params.categoryFilter,
      affectedProductsCount: affectedCount,
      appliedTo: params.applyToCost && params.applyToSale ? 'both' : params.applyToCost ? 'cost' : 'sale'
    };

    await this.saveToSupabase('priceIncreaseLogs', log);
    return { affectedCount };
  }

  public static async saveWithdrawal(withdrawal: CustomerWithdrawal) {
    await this.saveToSupabase('withdrawals', { ...withdrawal, storeId: this.currentStoreId });
  }

  public static async saveCheque(cheque: Cheque) {
    await this.saveToSupabase('cheques', { ...cheque, storeId: this.currentStoreId });
  }

  public static async saveSupplier(supplier: Supplier) {
    await this.saveToSupabase('suppliers', { ...supplier, storeId: this.currentStoreId });
  }

  public static async updateStoreInfo(info: Partial<StoreInfo>) {
    await this.saveStoreInfo(info as StoreInfo);
  }

  public static async saveStoreInfo(info: Partial<StoreInfo>) {
    try {
      const storeId = this.currentStoreId;
      const fullStoreInfo = {
        ...this.state.storeInfo,
        ...info,
        storeId
      };

      // Sync in rawStoreInfos memory cache
      const siIdx = this.rawStoreInfos.findIndex((si: any) => si.storeId === storeId);
      if (siIdx >= 0) {
        this.rawStoreInfos[siIdx] = fullStoreInfo;
      } else {
        this.rawStoreInfos.push(fullStoreInfo);
      }

      // Also sync current store name / data in stores table if exists
      const storeIdx = this.state.stores.findIndex(s => s.id === storeId);
      if (storeIdx >= 0) {
        const updatedStore = {
          ...this.state.stores[storeIdx],
          name: info.name !== undefined ? info.name : this.state.stores[storeIdx].name,
          cuit: info.cuit !== undefined ? info.cuit : this.state.stores[storeIdx].cuit,
          businessType: info.businessType !== undefined ? info.businessType : this.state.stores[storeIdx].businessType,
          address: info.address !== undefined ? info.address : this.state.stores[storeIdx].address,
          phone: info.phone !== undefined ? info.phone : this.state.stores[storeIdx].phone,
          email: info.email !== undefined ? info.email : this.state.stores[storeIdx].email,
        };
        this.state.stores[storeIdx] = updatedStore;
      }

      this.state.storeInfo = fullStoreInfo as StoreInfo;
      this.saveToLocalCache();
      this.notify();

      // Upsert into Supabase storeInfo table
      await this.saveToSupabase('storeInfo', fullStoreInfo);
      if (storeIdx >= 0) {
        await this.saveToSupabase('stores', this.state.stores[storeIdx]);
      }
    } catch (err) {
      console.error('Error saving store info:', err);
      this.state.storeInfo = { ...this.state.storeInfo, ...info, storeId: this.currentStoreId } as StoreInfo;
      this.saveToLocalCache();
      this.notify();
    }
  }

  public static async saveStore(store: StoreAccount) {
    await this.saveToSupabase('stores', store);
  }

  public static async processSale(sale: Sale) {
    await this.saveSale(sale);
  }

  public static async annulSale(saleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const sale = this.state.sales.find(s => s.id === saleId);
      if (sale) {
        const updatedSale = { ...sale, status: 'cancelled' as const };
        await this.saveToSupabase('sales', updatedSale);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al anular venta' };
    }
  }

  public static async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.deleteFromSupabase('users', userId);
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting user:', err);
      return { success: false, error: err?.message || 'Error al eliminar usuario' };
    }
  }

  public static async saveUser(user: SystemUser): Promise<{ success: boolean; error?: string }> {
    try {
      await this.saveToSupabase('users', user);
      return { success: true };
    } catch (err: any) {
      console.error('Error saving user:', err);
      return { success: false, error: err?.message || 'Error al guardar usuario' };
    }
  }

  public static async saveCashRegister(register: CashRegister) {
    await this.saveToSupabase('cashRegisters', { ...register, storeId: this.currentStoreId });
  }

  public static resetDemo() {
    this.state = {
      stores: [
        {
          id: 'store-demo-a',
          name: initialAppData.storeInfo.name,
          cuit: initialAppData.storeInfo.cuit,
          businessType: initialAppData.storeInfo.businessType,
          active: true,
          isDemo: true,
          createdAt: new Date().toISOString()
        }
      ],
      storeInfo: initialAppData.storeInfo,
      users: initialAppData.users || [],
      products: (initialAppData.products || []).map(p => ({ ...p, storeId: 'store-demo-a' })),
      suppliers: (initialAppData.suppliers || []).map(s => ({ ...s, storeId: 'store-demo-a' })),
      priceIncreaseLogs: (initialAppData.priceIncreaseLogs || []).map(l => ({ ...l, storeId: 'store-demo-a' })),
      customers: (initialAppData.customers || []).map(c => ({ ...c, storeId: 'store-demo-a' })),
      customerTransactions: (initialAppData.customerTransactions || []).map(t => ({ ...t, storeId: 'store-demo-a' })),
      withdrawals: (initialAppData.withdrawals || []).map(w => ({ ...w, storeId: 'store-demo-a' })),
      sales: (initialAppData.sales || []).map(s => ({ ...s, storeId: 'store-demo-a' })),
      cheques: (initialAppData.cheques || []).map(c => ({ ...c, storeId: 'store-demo-a' })),
      cashRegisters: (initialAppData.cashRegisters || []).map(r => ({ ...r, storeId: 'store-demo-a' })),
      stockMovements: (initialAppData.stockMovements || []).map(m => ({ ...m, storeId: 'store-demo-a' }))
    };
    this.rawStoreInfos = [{ ...initialAppData.storeInfo, storeId: 'store-demo-a' }];
    this.saveToLocalCache();
    this.notify();
  }
}
