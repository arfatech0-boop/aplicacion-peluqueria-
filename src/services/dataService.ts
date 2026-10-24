import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { AppState, CashRegister, Cheque, Customer, CustomerTransaction, CustomerWithdrawal, GlobalPriceIncreaseLog, Product, Sale, StockMovement, StoreAccount, StoreInfo, Supplier, SystemUser, WithdrawalStatus } from '../types';
import { initialAppData } from '../data/mockData';
import { SUPABASE_URL, SUPABASE_KEY } from '../config';
import { getCatalogForRubro, DEFAULT_KIOSCO_SUPPLIERS } from '../data/rubroCatalogs';
import bcrypt from 'bcryptjs';

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

  private static setupRealtimeSubscription() {
    try {
      if (!this.supabase || typeof this.supabase.channel !== 'function') return;
      this.supabase
        .channel('public-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          this.fetchAllData().catch(err => console.warn('[DataService] Error on realtime update:', err));
        })
        .subscribe();
    } catch (e) {
      console.warn('[DataService] Realtime subscription notice:', e);
    }
  }

  private static loadFromLocalCache() {
    try {
      const cached = localStorage.getItem('gc_offline_state_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          const cachedUsers = parsed.users || [];
          const initialUsers = initialAppData.users || [];
          const mergedUsers = [...cachedUsers];
          for (const iu of initialUsers) {
            if (!mergedUsers.some(u => u.username.toLowerCase() === iu.username.toLowerCase())) {
              mergedUsers.push(iu);
            }
          }

          const cachedStores = parsed.stores || [];
          const mergedStores = [...cachedStores];
          if (!mergedStores.some(s => s.id === 'store-kioscomate')) {
            mergedStores.push({
              id: 'store-kioscomate',
              name: 'Kiosco Mate',
              cuit: '20-12345678-9',
              businessType: 'Kiosco / Minimarket',
              active: true,
              isDemo: false,
              createdAt: new Date().toISOString()
            });
          }
          if (!mergedStores.some(s => s.id === 'store-lafinca')) {
            mergedStores.push({
              id: 'store-lafinca',
              name: 'La Finca',
              cuit: '30-98765432-1',
              businessType: 'Comercio General / Campo',
              active: true,
              isDemo: false,
              createdAt: new Date().toISOString()
            });
          }

          const cachedProducts: Product[] = parsed.products || [];
          const mergedProducts = [...cachedProducts];
          const cachedSuppliers: Supplier[] = parsed.suppliers || [];
          const mergedSuppliers = [...cachedSuppliers];

          // Auto-recover/populate Kiosco Mate products if missing
          if (!mergedProducts.some(p => p.storeId === 'store-kioscomate')) {
            const kioscoCatalog = getCatalogForRubro('Kiosco / Drugstore');
            kioscoCatalog.forEach((p, idx) => {
              mergedProducts.push({
                ...p,
                id: `prod-kio-mate-${idx + 1}`,
                storeId: 'store-kioscomate'
              });
            });
          }

          // Auto-recover/populate Kiosco Mate suppliers if missing
          if (!mergedSuppliers.some(s => s.storeId === 'store-kioscomate')) {
            DEFAULT_KIOSCO_SUPPLIERS.forEach(s => {
              mergedSuppliers.push({
                ...s,
                id: `${s.id}-kioscomate`,
                storeId: 'store-kioscomate'
              });
            });
          }

          this.state = {
            stores: mergedStores,
            storeInfo: parsed.storeInfo || {} as StoreInfo,
            users: mergedUsers,
            products: mergedProducts,
            suppliers: mergedSuppliers,
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
        const initialProducts = (initialAppData.products || []).map(p => ({ ...p, storeId: 'store-demo-a' }));
        const initialSuppliers = (initialAppData.suppliers || []).map(s => ({ ...s, storeId: 'store-demo-a' }));

        // Cargar catálogo inicial de Kiosco Mate y sus proveedores
        const kioscoCatalog = getCatalogForRubro('Kiosco / Drugstore');
        kioscoCatalog.forEach((p, idx) => {
          initialProducts.push({
            ...p,
            id: `prod-kio-mate-${idx + 1}`,
            storeId: 'store-kioscomate'
          });
        });
        DEFAULT_KIOSCO_SUPPLIERS.forEach(s => {
          initialSuppliers.push({
            ...s,
            id: `${s.id}-kioscomate`,
            storeId: 'store-kioscomate'
          });
        });

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
            },
            {
              id: 'store-kioscomate',
              name: 'Kiosco Mate',
              cuit: '20-12345678-9',
              businessType: 'Kiosco / Minimarket',
              active: true,
              isDemo: false,
              createdAt: new Date().toISOString()
            }
          ],
          storeInfo: initialAppData.storeInfo,
          users: initialAppData.users || [],
          products: initialProducts,
          suppliers: initialSuppliers,
          priceIncreaseLogs: (initialAppData.priceIncreaseLogs || []).map(l => ({ ...l, storeId: 'store-demo-a' })),
          customers: (initialAppData.customers || []).map(c => ({ ...c, storeId: 'store-demo-a' })),
          customerTransactions: (initialAppData.customerTransactions || []).map(t => ({ ...t, storeId: 'store-demo-a' })),
          withdrawals: (initialAppData.withdrawals || []).map(w => ({ ...w, storeId: 'store-demo-a' })),
          sales: (initialAppData.sales || []).map(s => ({ ...s, storeId: 'store-demo-a' })),
          cheques: (initialAppData.cheques || []).map(c => ({ ...c, storeId: 'store-demo-a' })),
          cashRegisters: (initialAppData.cashRegisters || []).map(r => ({ ...r, storeId: 'store-demo-a' })),
          stockMovements: (initialAppData.stockMovements || []).map(m => ({ ...m, storeId: 'store-demo-a' }))
        };
        this.rawStoreInfos = [
          { ...initialAppData.storeInfo, storeId: 'store-demo-a' },
          { 
            storeId: 'store-kioscomate',
            name: 'Kiosco Mate',
            cuit: '20-12345678-9',
            businessType: 'Kiosco / Minimarket',
            customCategories: ['Golosinas & Chocolates', 'Cigarrillos & Tabaco', 'Bebidas & Energizantes', 'Galletitas & Snacks', 'Artículos de Kiosco']
          }
        ];
        this.saveToLocalCache();
        this.notify();
      }
    } catch (e) {
      console.warn('[DataService] Error loading local cache:', e);
    }
  }

  private static saveToLocalCache() {
    try {
      // Guard: Si el estado actual tuviera 0 productos por un fallo de carga,
      // no pisar el caché del localStorage si antes tenía productos
      const existing = localStorage.getItem('gc_offline_state_v1');
      if (existing && (!this.state.products || this.state.products.length === 0)) {
        try {
          const parsed = JSON.parse(existing);
          if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) {
            console.warn('[DataService] Protegiendo caché: evitando sobreescritura con lista vacía.');
            this.state.products = parsed.products;
          }
        } catch {}
      }

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
      const sId = this.currentStoreId || 'store-demo-a';
      const currentUser = this.state.users?.find(u => u.id === this.currentUserId);
      const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.username === 'admin' || currentUser?.username === 'facu123';

      const results = await Promise.allSettled([
        isSuperAdmin ? this.supabase.from('stores').select('*') : this.supabase.from('stores').select('*').or(`id.eq.${sId},id.eq.store-demo-a`),
        this.supabase.from('storeInfo').select('*').or(`storeId.eq.${sId},storeId.is.null,storeId.eq.store-demo-a`),
        isSuperAdmin ? this.supabase.from('users').select('*') : this.supabase.from('users').select('*').or(`storeId.eq.${sId},role.eq.superadmin`),
        this.supabase.from('products').select('*').or(`storeId.eq.${sId},storeId.is.null,storeId.eq.store-demo-a`),
        this.supabase.from('suppliers').select('*').or(`storeId.eq.${sId},storeId.is.null,storeId.eq.store-demo-a`),
        this.supabase.from('priceIncreaseLogs').select('*').or(`storeId.eq.${sId},storeId.eq.store-demo-a`),
        this.supabase.from('customers').select('*').or(`storeId.eq.${sId},storeId.eq.store-demo-a`),
        this.supabase.from('customerTransactions').select('*').or(`storeId.eq.${sId},storeId.eq.store-demo-a`),
        this.supabase.from('withdrawals').select('*').or(`storeId.eq.${sId},storeId.eq.store-demo-a`),
        this.supabase.from('sales').select('*').or(`storeId.eq.${sId},storeId.eq.store-demo-a`),
        this.supabase.from('cheques').select('*').or(`storeId.eq.${sId},storeId.eq.store-demo-a`),
        this.supabase.from('cashRegisters').select('*').or(`storeId.eq.${sId},storeId.eq.store-demo-a`),
        this.supabase.from('stockMovements').select('*').or(`storeId.eq.${sId},storeId.eq.store-demo-a`)
      ]);

      const [
        storesRes,
        storeInfoRes,
        usersRes,
        productsRes,
        suppliersRes,
        priceIncreaseLogsRes,
        customersRes,
        customerTransactionsRes,
        withdrawalsRes,
        salesRes,
        chequesRes,
        cashRegistersRes,
        stockMovementsRes
      ] = results.map(r => r.status === 'fulfilled' ? r.value : { data: null, error: r.reason });

      // Si Supabase no responde o falla la red, NO destruir los datos locales
      const anyError = results.some(r => r.status === 'rejected' || (r.status === 'fulfilled' && (r.value as any)?.error));
      if (anyError) {
        console.warn('⚠️ [DataService] Supabase no disponible o con errores. Conservando datos de caché local intactos.');
      }

      let hasAnySuccess = false;
      const updatedState = { ...this.state };

      if (!storesRes?.error && Array.isArray(storesRes?.data) && storesRes.data.length > 0) {
        updatedState.stores = storesRes.data;
        hasAnySuccess = true;
      }
      if (!storeInfoRes?.error && Array.isArray(storeInfoRes?.data) && storeInfoRes.data.length > 0) {
        this.rawStoreInfos = storeInfoRes.data;
        hasAnySuccess = true;
      }
      if (!usersRes?.error && Array.isArray(usersRes?.data) && usersRes.data.length > 0) {
        const mergedUsers = [...usersRes.data];
        for (const iu of initialAppData.users || []) {
          if (!mergedUsers.some(u => u.username.toLowerCase() === iu.username.toLowerCase())) {
            mergedUsers.push(iu);
          }
        }
        updatedState.users = mergedUsers;
        hasAnySuccess = true;
      }
      if (!productsRes?.error && Array.isArray(productsRes?.data) && productsRes.data.length > 0) {
        updatedState.products = productsRes.data;
        hasAnySuccess = true;
      }
      if (!suppliersRes?.error && Array.isArray(suppliersRes?.data) && suppliersRes.data.length > 0) {
        updatedState.suppliers = suppliersRes.data;
        hasAnySuccess = true;
      }
      if (!priceIncreaseLogsRes?.error && Array.isArray(priceIncreaseLogsRes?.data)) {
        updatedState.priceIncreaseLogs = priceIncreaseLogsRes.data;
      }
      if (!customersRes?.error && Array.isArray(customersRes?.data) && customersRes.data.length > 0) {
        updatedState.customers = customersRes.data;
        hasAnySuccess = true;
      }
      if (!customerTransactionsRes?.error && Array.isArray(customerTransactionsRes?.data)) {
        updatedState.customerTransactions = customerTransactionsRes.data;
      }
      if (!withdrawalsRes?.error && Array.isArray(withdrawalsRes?.data)) {
        updatedState.withdrawals = withdrawalsRes.data;
      }
      if (!salesRes?.error && Array.isArray(salesRes?.data) && salesRes.data.length > 0) {
        updatedState.sales = salesRes.data;
        hasAnySuccess = true;
      }
      if (!chequesRes?.error && Array.isArray(chequesRes?.data)) {
        updatedState.cheques = chequesRes.data;
      }
      if (!cashRegistersRes?.error && Array.isArray(cashRegistersRes?.data)) {
        updatedState.cashRegisters = cashRegistersRes.data;
      }
      if (!stockMovementsRes?.error && Array.isArray(stockMovementsRes?.data)) {
        updatedState.stockMovements = stockMovementsRes.data;
      }

      this.state = updatedState;
      if (hasAnySuccess) {
        this.saveToLocalCache();
      }
      this.notify();
    } catch (err) {
      console.warn('[DataService] Error en fetchAllData, manteniendo datos locales intactos:', err);
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
    const sId = storeId || this.currentStoreId || 'store-demo-a';
    const currentUser = this.state.users?.find(u => u.id === this.currentUserId || u.username === 'admin' || u.username === 'facu123');
    const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.username === 'admin' || currentUser?.username === 'facu123';
    
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

  public static async setCurrentStoreId(storeId: string) {
    this.currentStoreId = storeId;
    localStorage.setItem('gc_store_id', storeId);
    this.notify();
    if (navigator.onLine) {
      await this.fetchAllData();
    }
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
    // Ensure storeId is present on local data so filterByStore doesn't drop it
    if (!data.storeId && this.currentStoreId) {
      data.storeId = this.currentStoreId;
    }

    // 1. Update local memory optimistically
    const list = (this.state as any)[table];
    if (Array.isArray(list)) {
      const idx = list.findIndex((item: any) => item.id === data.id);
      if (idx >= 0) list[idx] = data;
      else list.push(data);
      this.saveToLocalCache();
      this.notify();
    }

    // Prepare payload matching Supabase table columns exactly
    let supabasePayload = { ...data };
    if (table === 'customerTransactions') {
      supabasePayload = {
        id: data.id,
        storeId: data.storeId || this.currentStoreId,
        customerId: data.customerId,
        type: data.type,
        amount: Number(data.amount) || 0,
        balanceAfter: Number(data.balanceAfter) || 0,
        date: data.date,
        description: data.description || '',
        saleId: data.saleId || null,
        withdrawalId: data.withdrawalId || null,
        receiptNumber: data.receiptNumber || data.reference || null
      };
    } else if (table === 'customers') {
      supabasePayload = {
        id: data.id,
        storeId: data.storeId || this.currentStoreId,
        name: data.name,
        dniCuit: data.dniCuit || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        creditLimit: Number(data.creditLimit) || 0,
        currentBalance: Number(data.currentBalance) || 0,
        notes: data.notes || '',
        updatedAt: data.updatedAt || new Date().toISOString()
      };
    }

    // 2. If offline or Supabase fails, save to offlineQueue
    if (!navigator.onLine) {
      this.enqueueOfflineAction({
        id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        table,
        action: 'upsert',
        data: supabasePayload,
        timestamp: Date.now()
      });
      return;
    }

    try {
      const { error } = await this.supabase.from(table).upsert(supabasePayload);
      if (error) throw error;
    } catch (err) {
      console.warn(`[DataService] Supabase network error on ${table}, queueing offline:`, err);
      this.enqueueOfflineAction({
        id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        table,
        action: 'upsert',
        data: supabasePayload,
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
    await this.saveToSupabase('products', { ...product, storeId: product.storeId || this.currentStoreId });
  }

  public static async replaceProducts(newProducts: Product[], targetStoreId?: string) {
    const storeId = targetStoreId || this.currentStoreId;
    if (!storeId || storeId.trim() === '') {
      console.error('[DataService] Error de seguridad: replaceProducts abortado porque storeId no está definido.');
      return;
    }
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

    // 1. Descuento de stock en memoria local
    for (const item of sale.items) {
      const prod = this.state.products.find(p => p.id === item.productId);
      if (prod) {
        const prevStock = prod.stock;
        prod.stock -= item.quantity;
        this.state.stockMovements.unshift({
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

    // 2. Afectación de Cuenta Corriente y Remitos en memoria local
    let ccAmount = 0;
    let customerObj: Customer | undefined;
    let withdrawalObj: CustomerWithdrawal | undefined;
    let txObj: CustomerTransaction | undefined;

    if (sale.customerId) {
      if (sale.paymentMethod === 'current_account' || sale.invoiceType === 'REMITO') {
        ccAmount = sale.totalAmount;
      } else if (sale.paymentsBreakdown && sale.paymentsBreakdown.length > 0) {
        const ccPart = sale.paymentsBreakdown.find(p => p.method === 'current_account');
        if (ccPart) ccAmount = ccPart.amount;
      }

      if (ccAmount > 0) {
        customerObj = this.state.customers.find(c => c.id === sale.customerId);
        if (customerObj) {
          const prevBalance = Number(customerObj.currentBalance) || 0;
          const newBalance = prevBalance + ccAmount;
          customerObj.currentBalance = newBalance;
          customerObj.updatedAt = new Date().toISOString();
          customerObj.storeId = customerObj.storeId || this.currentStoreId;

          const retNumber = sale.invoiceType === 'REMITO'
            ? sale.invoiceNumber.replace(/^FC-/, 'REM-')
            : `REM-${sale.invoiceNumber.replace(/^(FC-|TK-|REM-)/, '')}`;
          const withdrawalId = `with-sale-${sale.id}`;

          withdrawalObj = {
            id: withdrawalId,
            withdrawalNumber: retNumber,
            customerId: customerObj.id,
            customerName: customerObj.name,
            date: sale.date || new Date().toISOString(),
            items: sale.items.map(i => ({
              productId: i.productId,
              productCode: i.code,
              productName: i.productName,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.subtotal
            })),
            totalAmount: ccAmount,
            status: 'pending',
            notes: sale.notes ? `${sale.notes} (Venta ${sale.invoiceNumber})` : `Generado automáticamente desde Venta ${sale.invoiceNumber}`,
            authorizedBy: 'Venta Mostrador',
            storeId: this.currentStoreId,
            saleId: sale.id,
            invoiceNumber: sale.invoiceNumber,
            paidAmount: 0,
            remainingAmount: ccAmount
          };
          this.state.withdrawals.unshift(withdrawalObj);

          const itemsSummary = (sale.items || []).map(i => `${i.quantity}x ${i.productName}`).join(', ');
          txObj = {
            id: `tx-sale-${sale.id}`,
            storeId: this.currentStoreId,
            customerId: sale.customerId,
            customerName: customerObj.name,
            type: 'sale',
            amount: ccAmount,
            balanceAfter: newBalance,
            date: sale.date || new Date().toISOString(),
            description: `Venta ${sale.invoiceType === 'REMITO' ? 'Remito' : 'Cta. Cte.'} #${sale.invoiceNumber}${itemsSummary ? ' (' + itemsSummary + ')' : ''}`,
            saleId: sale.id,
            withdrawalId: withdrawalObj.id
          };
          this.state.customerTransactions.unshift(txObj);
        }
      }
    }

    // 3. Impactar en la Caja abierta en memoria local
    let cashPortion = 0;
    if (sale.paymentMethod === 'cash') {
      cashPortion = Number(sale.totalAmount) || 0;
    } else if (sale.paymentMethod === 'mixed' && Array.isArray(sale.paymentsBreakdown)) {
      const cashPart = sale.paymentsBreakdown.find(p => p.method === 'cash');
      if (cashPart) cashPortion = Number(cashPart.amount) || 0;
    }

    let openRegister = this.state.cashRegisters.find(
      c => c.status === 'open' && (!c.storeId || c.storeId === this.currentStoreId)
    );
    if (cashPortion > 0 && openRegister) {
      openRegister.cashSales = (Number(openRegister.cashSales) || 0) + cashPortion;
      openRegister.expectedTotal = (Number(openRegister.expectedTotal) || 0) + cashPortion;
      if (!Array.isArray(openRegister.movements)) {
        openRegister.movements = [];
      }
      openRegister.movements.unshift({
        id: `mov-sale-${sale.id}`,
        type: 'in',
        amount: cashPortion,
        description: `Venta contado #${sale.invoiceNumber}`,
        category: 'sale',
        date: sale.date || new Date().toISOString(),
        paymentMethod: 'cash'
      });
    }

    // Guardar estado local optimista de inmediato
    this.state.sales.unshift(saleWithStore);
    this.saveToLocalCache();
    this.notify();

    // 4. Persistencia en la nube (Transaccional Atómica vía Supabase RPC con Fallback)
    let rpcSuccessful = false;
    if (navigator.onLine) {
      try {
        const { error: rpcError } = await this.supabase.rpc('process_sale_transaction', {
          p_sale: saleWithStore,
          p_items: sale.items,
          p_store_id: this.currentStoreId
        });
        if (!rpcError) {
          rpcSuccessful = true;
        } else {
          console.warn('[DataService] RPC process_sale_transaction no disponible o con error, usando fallback:', rpcError.message);
        }
      } catch (rpcErr) {
        console.warn('[DataService] Excepción al invocar RPC process_sale_transaction:', rpcErr);
      }
    }

    // Si el RPC no se ejecutó (offline o fallback), sincronizar individualmente
    if (!rpcSuccessful) {
      await this.saveToSupabase('sales', saleWithStore);
      for (const item of sale.items) {
        const prod = this.state.products.find(p => p.id === item.productId);
        if (prod) {
          await this.saveToSupabase('products', prod);
        }
      }
      if (customerObj) {
        await this.saveCustomer(customerObj);
      }
      if (withdrawalObj) {
        await this.saveToSupabase('withdrawals', withdrawalObj);
      }
      if (txObj) {
        await this.saveCustomerTransaction(txObj);
      }
      if (cashPortion > 0 && openRegister) {
        await this.saveCashRegister(openRegister);
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

  public static async registerCustomerCharge(params: {
    customerId: string;
    amount: number;
    description: string;
    date?: string;
    reference?: string;
  }) {
    const customer = this.state.customers.find(c => c.id === params.customerId);
    if (!customer) return;

    const previousBalance = Number(customer.currentBalance) || 0;
    const newBalance = previousBalance + Number(params.amount);
    customer.currentBalance = newBalance;
    customer.updatedAt = new Date().toISOString();

    await this.saveToSupabase('customers', customer);

    const transaction: CustomerTransaction = {
      id: `tx-chg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      customerId: params.customerId,
      customerName: customer.name,
      date: params.date || new Date().toISOString(),
      type: 'charge',
      amount: Number(params.amount),
      description: params.description || 'Cargo a Cuenta Corriente / Mercadería Retirada',
      balanceAfter: newBalance,
      reference: params.reference
    };

    await this.saveToSupabase('customerTransactions', transaction);
    return transaction;
  }

  public static async registerCustomerPayment(params: {
    customerId: string;
    amount: number;
    paymentMethod: string;
    notes?: string;
    isPartial?: boolean;
    nextPromiseDate?: string;
    date?: string;
    paidWithdrawalIds?: string[];
  }) {
    const customer = this.state.customers.find(c => c.id === params.customerId);
    if (!customer) return;

    const previousBalance = Number(customer.currentBalance) || 0;
    const paymentAmt = Number(params.amount) || 0;
    const newBalance = Math.round((previousBalance - paymentAmt) * 100) / 100;
    customer.currentBalance = newBalance;
    customer.lastPaymentDate = params.date || new Date().toISOString();
    customer.lastPaymentAmount = paymentAmt;
    customer.updatedAt = new Date().toISOString();

    if (params.nextPromiseDate) {
      customer.nextPaymentPromiseDate = params.nextPromiseDate;
    } else if (newBalance <= 0) {
      customer.nextPaymentPromiseDate = undefined;
    }

    await this.saveCustomer(customer);

    // Imputar pago a los remitos seleccionados
    const updatedWithdrawals: CustomerWithdrawal[] = [];
    if (params.paidWithdrawalIds && params.paidWithdrawalIds.length > 0) {
      let remainingMoney = paymentAmt;
      for (const wId of params.paidWithdrawalIds) {
        const w = this.state.withdrawals.find(item => item.id === wId);
        if (!w || remainingMoney <= 0) continue;

        const prevPaid = Number(w.paidAmount) || 0;
        const currentRemaining = w.remainingAmount !== undefined 
          ? Number(w.remainingAmount) 
          : Math.max(0, Number(w.totalAmount) - prevPaid);

        if (currentRemaining <= 0) continue;

        const paymentForThis = Math.min(remainingMoney, currentRemaining);
        const newPaid = Math.round((prevPaid + paymentForThis) * 100) / 100;
        const newRemaining = Math.max(0, Math.round((Number(w.totalAmount) - newPaid) * 100) / 100);

        w.paidAmount = newPaid;
        w.remainingAmount = newRemaining;
        w.status = newRemaining <= 0 ? 'paid' : 'partial';

        await this.saveToSupabase('withdrawals', w);
        updatedWithdrawals.push(w);
        remainingMoney -= paymentForThis;
      }
    }

    const isPartialPayment = params.isPartial !== undefined ? params.isPartial : newBalance > 0;
    
    let defaultDesc = '';
    if (updatedWithdrawals.length > 0) {
      const remitoNums = updatedWithdrawals.map(w => w.withdrawalNumber).join(', ');
      defaultDesc = `Pago de Remito(s) ${remitoNums} (${params.paymentMethod})`;
      if (newBalance < 0) {
        defaultDesc += ` - Saldo a favor resultante: +$${Math.abs(newBalance).toLocaleString('es-AR')}`;
      } else if (newBalance > 0) {
        defaultDesc += ` - Resta saldo total: $${newBalance.toLocaleString('es-AR')}`;
      }
    } else {
      if (newBalance < 0) {
        defaultDesc = `Entrega a cuenta (${params.paymentMethod}) - Saldo a favor: +$${Math.abs(newBalance).toLocaleString('es-AR')}`;
      } else if (isPartialPayment) {
        defaultDesc = `Pago Parcial / Entrega a cuenta (${params.paymentMethod}) - Resta: $${newBalance.toLocaleString('es-AR')}`;
      } else {
        defaultDesc = `Cancelación Total de Saldo (${params.paymentMethod})`;
      }
    }

    const transaction: CustomerTransaction = {
      id: `tx-pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      storeId: this.currentStoreId,
      customerId: params.customerId,
      customerName: customer.name,
      date: params.date || new Date().toISOString(),
      type: 'payment',
      amount: paymentAmt,
      description: params.notes ? params.notes : defaultDesc,
      balanceAfter: newBalance,
      reference: `REC-${Date.now().toString().slice(-6)}`,
      paymentMethod: params.paymentMethod,
      isPartial: isPartialPayment,
      remainingBalance: newBalance,
      nextPromiseDate: params.nextPromiseDate,
      paidWithdrawalIds: params.paidWithdrawalIds
    };

    await this.saveCustomerTransaction(transaction);

    // Impactar en la Caja si el pago de cuenta corriente fue en efectivo
    if (params.paymentMethod === 'cash') {
      const openRegister = this.state.cashRegisters.find(
        c => c.status === 'open' && (!c.storeId || c.storeId === this.currentStoreId)
      );
      if (openRegister) {
        openRegister.accountPayments = (Number(openRegister.accountPayments) || 0) + paymentAmt;
        openRegister.expectedTotal = (Number(openRegister.expectedTotal) || 0) + paymentAmt;
        if (!Array.isArray(openRegister.movements)) {
          openRegister.movements = [];
        }
        openRegister.movements.unshift({
          id: `mov-pay-${transaction.id}`,
          type: 'in',
          amount: paymentAmt,
          description: `Cobro Cta. Cte. ${customer.name}`,
          category: 'customer_payment',
          date: transaction.date,
          paymentMethod: 'cash'
        });
        await this.saveCashRegister(openRegister);
      }
    }

    return transaction;
  }

  public static async registerWithdrawal(withdrawal: CustomerWithdrawal) {
    const withStore: CustomerWithdrawal = {
      ...withdrawal,
      paidAmount: withdrawal.paidAmount || 0,
      remainingAmount: withdrawal.remainingAmount !== undefined ? withdrawal.remainingAmount : withdrawal.totalAmount,
      storeId: this.currentStoreId
    };
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

    // Impactar en la cuenta corriente del cliente como mercadería retirada
    if (withdrawal.customerId && withdrawal.totalAmount > 0) {
      const customer = this.state.customers.find(c => c.id === withdrawal.customerId);
      if (customer) {
        const prevBalance = Number(customer.currentBalance) || 0;
        const newBalance = prevBalance + withdrawal.totalAmount;
        customer.currentBalance = newBalance;
        customer.updatedAt = new Date().toISOString();
        await this.saveCustomer(customer);

        const itemsSummary = (withdrawal.items || []).map(i => `${i.quantity}x ${i.productName}`).join(', ');
        const tx: CustomerTransaction = {
          id: `tx-with-${withdrawal.id}`,
          storeId: this.currentStoreId,
          customerId: withdrawal.customerId,
          customerName: customer.name,
          type: 'withdrawal_billing',
          amount: withdrawal.totalAmount,
          balanceAfter: newBalance,
          date: withdrawal.date || new Date().toISOString(),
          description: `Retiro de Mercadería #${withdrawal.withdrawalNumber}${itemsSummary ? ' (' + itemsSummary + ')' : ''}`,
          withdrawalId: withdrawal.id
        };
        await this.saveCustomerTransaction(tx);
      }
    }
  }

  public static async updateWithdrawalStatus(withdrawalId: string, status: WithdrawalStatus) {
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
      if (!sale) return { success: false, error: 'Venta no encontrada' };
      if (sale.status === 'cancelled') return { success: false, error: 'La venta ya fue anulada previamente' };

      const updatedSale = { ...sale, status: 'cancelled' as const };
      sale.status = 'cancelled';

      // 1. Restituir el stock de cada producto en la memoria local
      if (Array.isArray(sale.items)) {
        for (const item of sale.items) {
          const prod = this.state.products.find(p => p.id === item.productId);
          if (prod) {
            const prevStock = prod.stock;
            prod.stock += item.quantity;
            this.state.stockMovements.unshift({
              id: `sm-annul-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              storeId: this.currentStoreId,
              productId: prod.id,
              productName: prod.name,
              type: 'adjust',
              quantity: item.quantity,
              previousStock: prevStock,
              newStock: prod.stock,
              date: new Date().toISOString(),
              reason: `Anulación Venta ${sale.invoiceNumber}`
            });
          }
        }
      }

      // 2. Anular remito si se generó para esta venta en memoria local
      const relatedWithdrawal = this.state.withdrawals.find(w => w.saleId === saleId || w.id === `with-sale-${saleId}`);
      if (relatedWithdrawal) {
        relatedWithdrawal.status = 'cancelled';
      }

      // 3. Revertir saldo de cuenta corriente si aplicaba
      let ccAmount = 0;
      let customerObj: Customer | undefined;
      let txObj: CustomerTransaction | undefined;

      if (sale.customerId) {
        if (sale.paymentMethod === 'current_account' || sale.invoiceType === 'REMITO') {
          ccAmount = sale.totalAmount;
        } else if (sale.paymentsBreakdown) {
          const ccPart = sale.paymentsBreakdown.find(p => p.method === 'current_account');
          if (ccPart) ccAmount = ccPart.amount;
        }

        if (ccAmount > 0) {
          customerObj = this.state.customers.find(c => c.id === sale.customerId);
          if (customerObj) {
            const newBal = Math.round(((customerObj.currentBalance || 0) - ccAmount) * 100) / 100;
            customerObj.currentBalance = newBal;
            customerObj.updatedAt = new Date().toISOString();

            txObj = {
              id: `tx-annul-${Date.now()}`,
              storeId: this.currentStoreId,
              customerId: sale.customerId,
              customerName: customerObj.name,
              type: 'adjustment',
              amount: ccAmount,
              balanceAfter: newBal,
              date: new Date().toISOString(),
              description: `Anulación Venta #${sale.invoiceNumber} (-$${ccAmount.toLocaleString('es-AR')})`,
              saleId: sale.id
            };
            this.state.customerTransactions.unshift(txObj);
          }
        }
      }

      // 4. Revertir efectivo de caja en memoria local si aplicaba
      let cashPortion = 0;
      if (sale.paymentMethod === 'cash') {
        cashPortion = Number(sale.totalAmount) || 0;
      } else if (sale.paymentMethod === 'mixed' && Array.isArray(sale.paymentsBreakdown)) {
        const cashPart = sale.paymentsBreakdown.find(p => p.method === 'cash');
        if (cashPart) cashPortion = Number(cashPart.amount) || 0;
      }

      let openRegister = this.state.cashRegisters.find(
        c => c.status === 'open' && (!c.storeId || c.storeId === this.currentStoreId)
      );
      if (cashPortion > 0 && openRegister) {
        openRegister.cashSales = Math.max(0, (Number(openRegister.cashSales) || 0) - cashPortion);
        openRegister.expectedTotal = (Number(openRegister.expectedTotal) || 0) - cashPortion;
        if (!Array.isArray(openRegister.movements)) openRegister.movements = [];
        openRegister.movements.unshift({
          id: `mov-annul-${sale.id}`,
          type: 'out',
          amount: cashPortion,
          description: `Anulación Venta #${sale.invoiceNumber}`,
          category: 'annulment',
          date: new Date().toISOString(),
          paymentMethod: 'cash'
        });
      }

      this.saveToLocalCache();
      this.notify();

      // 5. Persistencia en la nube (Transaccional Atómica vía Supabase RPC con Fallback)
      let rpcSuccessful = false;
      if (navigator.onLine) {
        try {
          const { error: rpcError } = await this.supabase.rpc('annul_sale_transaction', {
            p_sale_id: saleId,
            p_store_id: this.currentStoreId
          });
          if (!rpcError) {
            rpcSuccessful = true;
          } else {
            console.warn('[DataService] RPC annul_sale_transaction no disponible o con error, usando fallback:', rpcError.message);
          }
        } catch (rpcErr) {
          console.warn('[DataService] Excepción al invocar RPC annul_sale_transaction:', rpcErr);
        }
      }

      if (!rpcSuccessful) {
        await this.saveToSupabase('sales', updatedSale);
        if (Array.isArray(sale.items)) {
          for (const item of sale.items) {
            const prod = this.state.products.find(p => p.id === item.productId);
            if (prod) await this.saveToSupabase('products', prod);
          }
        }
        if (relatedWithdrawal) await this.saveToSupabase('withdrawals', relatedWithdrawal);
        if (customerObj) await this.saveCustomer(customerObj);
        if (txObj) await this.saveCustomerTransaction(txObj);
        if (cashPortion > 0 && openRegister) await this.saveCashRegister(openRegister);
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
      const secureUser = { ...user };
      if (secureUser.password && !secureUser.password.startsWith('$2a$') && !secureUser.password.startsWith('$2b$')) {
        secureUser.password = bcrypt.hashSync(secureUser.password, 10);
      }
      await this.saveToSupabase('users', secureUser);
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
