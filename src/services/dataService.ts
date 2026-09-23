import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { AppState, CashRegister, Cheque, Customer, CustomerTransaction, CustomerWithdrawal, GlobalPriceIncreaseLog, Product, Sale, StockMovement, StoreAccount, StoreInfo, Supplier, SystemUser } from '../types';

export class DataService {
  private static listeners: ((state: AppState) => void)[] = [];
  
  // Use the same SUPABASE_URL and SUPABASE_KEY from Vite env vars
  private static supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  private static supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';
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

  private static isInitialized = false;

  public static async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    // Subscribe to all changes in Supabase
    this.setupRealtimeSubscription();

    // Fetch initial data
    await this.fetchAllData();
  }

  private static setupRealtimeSubscription() {
    this.supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        // When any table changes, fetch all data again to keep it simple, 
        // or just fetch the specific table. For MVP, we fetch all.
        console.log('Realtime update received:', payload);
        this.fetchAllData();
      })
      .subscribe();
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

      this.state = {
        stores: stores || [],
        storeInfo: storeInfo && storeInfo.length > 0 ? storeInfo[0] : {} as StoreInfo,
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
    const filterByStore = (arr: any[]) => arr?.filter(item => item.storeId === sId || (!item.storeId && sId === 'store-demo-a')) || [];

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

    const storeInfo: StoreInfo = {
      ...this.state.storeInfo,
      name: currentStore ? currentStore.name : this.state.storeInfo.name,
      cuit: currentStore ? currentStore.cuit : this.state.storeInfo.cuit,
      businessType: currentStore ? currentStore.businessType : this.state.storeInfo.businessType
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
        u.storeId === sId || (!u.storeId && sId === 'store-demo-a') || u.role === 'superadmin'
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

  // Generic save function to Supabase
  private static async saveToSupabase(table: string, data: any) {
    try {
      const { error } = await this.supabase.from(table).upsert(data);
      if (error) throw error;
      
      // Update local memory optimistically
      const list = (this.state as any)[table] as any[];
      if (list) {
        const idx = list.findIndex(item => item.id === data.id);
        if (idx >= 0) list[idx] = data;
        else list.push(data);
        this.notify();
      }
    } catch (err) {
      console.error(`Error saving to ${table}:`, err);
      throw err;
    }
  }

  public static async saveProduct(product: Product) {
    await this.saveToSupabase('products', { ...product, storeId: this.currentStoreId });
  }

  public static async deleteProduct(productId: string) {
    await this.supabase.from('products').delete().eq('id', productId);
    this.state.products = this.state.products.filter(p => p.id !== productId);
    this.notify();
  }

  public static async saveSale(sale: Sale) {
    sale = { ...sale, storeId: this.currentStoreId } as any;
    await this.saveToSupabase('sales', sale);

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

  public static async saveCustomerTransaction(tx: CustomerTransaction) {
    await this.saveToSupabase('customerTransactions', { ...tx, storeId: this.currentStoreId });
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

  public static async saveStoreInfo(info: StoreInfo) {
    await this.saveToSupabase('storeInfo', { ...info, storeId: this.currentStoreId });
  }

  public static async saveUser(user: SystemUser) {
    await this.saveToSupabase('users', user);
  }

  public static async saveCashRegister(register: CashRegister) {
    await this.saveToSupabase('cashRegisters', { ...register, storeId: this.currentStoreId });
  }
}
