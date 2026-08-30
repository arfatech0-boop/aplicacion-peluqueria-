import { createClient } from '@supabase/supabase-js';
import { AppState, Product, Supplier, Customer, Sale, CustomerWithdrawal, Cheque, CashRegister, CustomerTransaction, StockMovement, GlobalPriceIncreaseLog, StoreInfo, SystemUser } from '../types';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fviljkfepzpciqwyulpi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export class SupabaseService {
  public static async fetchAppState(): Promise<AppState | null> {
    try {
      const [
        storeInfoRes,
        usersRes,
        suppliersRes,
        productsRes,
        customersRes,
        customerTxsRes,
        withdrawalsRes,
        salesRes,
        chequesRes,
        cashRes,
        stockMovementsRes,
        logsRes
      ] = await Promise.all([
        supabase.from('store_info').select('*').single(),
        supabase.from('users').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('products').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('customer_transactions').select('*'),
        supabase.from('withdrawals').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('cheques').select('*'),
        supabase.from('cash_registers').select('*'),
        supabase.from('stock_movements').select('*'),
        supabase.from('price_increase_logs').select('*')
      ]);

      if (storeInfoRes.error && storeInfoRes.error.code === 'PGRST205') {
        // Tables not created yet
        return null;
      }

      const storeInfoData = storeInfoRes.data;
      const storeInfo: StoreInfo = storeInfoData ? {
        name: storeInfoData.name,
        cuit: storeInfoData.cuit || '',
        taxCondition: storeInfoData.tax_condition || 'Responsable Inscripto',
        businessType: storeInfoData.business_type || 'Comercio General / Multirrubro',
        address: storeInfoData.address || '',
        phone: storeInfoData.phone || '',
        email: storeInfoData.email || '',
        invoicePrefix: storeInfoData.invoice_prefix || '0001',
        currencySymbol: storeInfoData.currency_symbol || '$',
        defaultTaxRate: Number(storeInfoData.default_tax_rate) || 21,
        cashDiscountPercent: Number(storeInfoData.cash_discount_percent) || 5,
        cardSurchargePercent: Number(storeInfoData.card_surcharge_percent) || 10,
        receiptHeaderMessage: storeInfoData.receipt_header_message || '',
        customCategories: storeInfoData.custom_categories || [],
        cardInterestPlans: storeInfoData.card_interest_plans || [],
        defaultCounterInvoiceType: storeInfoData.default_counter_invoice_type,
        defaultCurrentAccountInvoiceType: storeInfoData.default_current_account_invoice_type,
        defaultRespInscriptoInvoiceType: storeInfoData.default_resp_inscripto_invoice_type,
        afipPointOfSale: storeInfoData.afip_point_of_sale
      } : ({} as StoreInfo);

      const users: SystemUser[] = (usersRes.data || []).map((u: any) => ({
        id: u.id,
        username: u.username,
        password: u.password,
        name: u.name,
        role: u.role,
        active: u.active,
        createdAt: u.created_at,
        lastLogin: u.last_login
      }));

      const suppliers: Supplier[] = (suppliersRes.data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        cuit: s.cuit || '',
        phone: s.phone || '',
        email: s.email || '',
        contact: s.contact || '',
        notes: s.notes
      }));

      const products: Product[] = (productsRes.data || []).map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        category: p.category,
        supplierId: p.supplier_id || '',
        costPrice: Number(p.cost_price) || 0,
        salePrice: Number(p.sale_price) || 0,
        stock: Number(p.stock) || 0,
        minStock: Number(p.min_stock) || 5,
        unit: p.unit || 'un',
        size: p.size || '',
        color: p.color || '',
        brand: p.brand || '',
        description: p.description || '',
        updatedAt: p.updated_at
      }));

      const customers: Customer[] = (customersRes.data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        dniCuit: c.dni_cuit || '',
        phone: c.phone || '',
        email: c.email || '',
        address: c.address || '',
        creditLimit: Number(c.credit_limit) || 0,
        currentBalance: Number(c.current_balance) || 0,
        notes: c.notes,
        updatedAt: c.updated_at
      }));

      const customerTransactions: CustomerTransaction[] = (customerTxsRes.data || []).map((t: any) => ({
        id: t.id,
        customerId: t.customer_id,
        type: t.type,
        amount: Number(t.amount) || 0,
        balanceAfter: Number(t.balance_after) || 0,
        date: t.date,
        description: t.description || '',
        receiptNumber: t.receipt_number,
        saleId: t.sale_id,
        itemsSummary: t.items_summary,
        paymentMethod: t.payment_method
      }));

      const withdrawals: CustomerWithdrawal[] = (withdrawalsRes.data || []).map((w: any) => ({
        id: w.id,
        withdrawalNumber: w.withdrawal_number,
        customerId: w.customer_id,
        customerName: w.customer_name,
        date: w.date,
        items: w.items || [],
        totalAmount: Number(w.total_amount) || 0,
        status: w.status,
        notes: w.notes,
        authorizedBy: w.authorized_by
      }));

      const sales: Sale[] = (salesRes.data || []).map((s: any) => ({
        id: s.id,
        invoiceNumber: s.invoice_number,
        invoiceType: s.invoice_type,
        cae: s.cae,
        caeDueDate: s.cae_due_date,
        customerCuitDni: s.customer_cuit_dni,
        customerTaxCondition: s.customer_tax_condition,
        date: s.date,
        customerId: s.customer_id,
        customerName: s.customer_name,
        items: s.items || [],
        subtotal: Number(s.subtotal) || 0,
        discount: Number(s.discount) || 0,
        surcharge: Number(s.surcharge) || 0,
        totalAmount: Number(s.total_amount) || 0,
        paymentMethod: s.payment_method || 'cash',
        notes: s.notes,
        status: s.status
      }));

      const cheques: Cheque[] = (chequesRes.data || []).map((c: any) => ({
        id: c.id,
        number: c.number,
        bank: c.bank,
        issuerName: c.issuer_name,
        issuerCuit: c.issuer_cuit,
        customerId: c.customer_id,
        customerName: c.customer_name,
        amount: Number(c.amount) || 0,
        issueDate: c.issue_date,
        dueDate: c.due_date,
        status: c.status,
        notes: c.notes
      }));

      const cashRegisters: CashRegister[] = (cashRes.data || []).map((c: any) => ({
        id: c.id,
        openDate: c.open_date,
        closeDate: c.close_date,
        initialAmount: Number(c.initial_amount) || 0,
        cashSales: Number(c.cash_sales) || 0,
        accountPayments: Number(c.account_payments) || 0,
        cashExpenses: Number(c.cash_expenses) || 0,
        expectedTotal: Number(c.expected_total) || 0,
        actualTotal: c.actual_total ? Number(c.actual_total) : undefined,
        difference: c.difference ? Number(c.difference) : undefined,
        status: c.status,
        movements: c.movements || [],
        notes: c.notes
      }));

      const stockMovements: StockMovement[] = (stockMovementsRes.data || []).map((sm: any) => ({
        id: sm.id,
        productId: sm.product_id,
        productName: sm.product_name,
        type: sm.type,
        quantity: Number(sm.quantity) || 0,
        previousStock: Number(sm.previous_stock) || 0,
        newStock: Number(sm.new_stock) || 0,
        date: sm.date,
        reason: sm.reason || ''
      }));

      const priceIncreaseLogs: GlobalPriceIncreaseLog[] = (logsRes.data || []).map((l: any) => ({
        id: l.id,
        supplierId: l.supplier_id,
        supplierName: l.supplier_name,
        categoryFilter: l.category_filter,
        percentage: Number(l.percentage) || 0,
        applyToCost: l.apply_to_cost,
        applyToSale: l.apply_to_sale,
        recalculateMargin: l.recalculate_margin,
        affectedProductsCount: l.affected_products_count || 0,
        date: l.date
      }));

      return {
        storeInfo,
        users,
        suppliers,
        products,
        customers,
        customerTransactions,
        withdrawals,
        sales,
        cheques,
        cashRegisters,
        stockMovements,
        priceIncreaseLogs
      };
    } catch (e) {
      console.warn('[SupabaseService] Fetch failed:', e);
      return null;
    }
  }

  public static async saveProducts(products: Product[]): Promise<void> {
    try {
      const records = products.map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        category: p.category,
        supplier_id: p.supplierId || null,
        cost_price: p.costPrice,
        sale_price: p.salePrice,
        stock: p.stock,
        min_stock: p.minStock,
        unit: p.unit || 'un',
        size: p.size || '',
        color: p.color || '',
        brand: p.brand || '',
        description: p.description || '',
        updated_at: p.updatedAt || new Date().toISOString()
      }));

      await supabase.from('products').upsert(records);
    } catch (err) {
      console.error('[SupabaseService] Failed to upsert products:', err);
    }
  }

  public static async savePriceIncreaseLog(log: GlobalPriceIncreaseLog): Promise<void> {
    try {
      await supabase.from('price_increase_logs').insert({
        id: log.id,
        supplier_id: log.supplierId,
        supplier_name: log.supplierName,
        category_filter: log.categoryFilter,
        percentage: log.percentage,
        apply_to_cost: log.applyToCost,
        apply_to_sale: log.applyToSale,
        recalculate_margin: log.recalculateMargin,
        affected_products_count: log.affectedProductsCount,
        date: log.date
      });
    } catch (err) {
      console.error('[SupabaseService] Failed to save price increase log:', err);
    }
  }

  public static async saveCustomer(customer: Customer): Promise<void> {
    try {
      await supabase.from('customers').upsert({
        id: customer.id,
        name: customer.name,
        dni_cuit: customer.dniCuit || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        credit_limit: customer.creditLimit || 0,
        current_balance: customer.currentBalance || 0,
        notes: customer.notes || '',
        updated_at: customer.updatedAt || new Date().toISOString()
      });
    } catch (err) {
      console.error('[SupabaseService] Failed to save customer:', err);
    }
  }

  public static async deleteCustomer(id: string): Promise<void> {
    try {
      await supabase.from('customers').delete().eq('id', id);
    } catch (err) {
      console.error('[SupabaseService] Failed to delete customer:', err);
    }
  }

  public static async saveSale(sale: Sale): Promise<void> {
    try {
      await supabase.from('sales').upsert({
        id: sale.id,
        invoice_number: sale.invoiceNumber,
        invoice_type: sale.invoiceType,
        cae: sale.cae,
        cae_due_date: sale.caeDueDate,
        customer_cuit_dni: sale.customerCuitDni,
        customer_tax_condition: sale.customerTaxCondition,
        date: sale.date,
        customer_id: sale.customerId || null,
        customer_name: sale.customerName || null,
        items: sale.items || [],
        subtotal: sale.subtotal,
        discount: sale.discount,
        surcharge: sale.surcharge,
        total_amount: sale.totalAmount,
        payment_method: sale.paymentMethod,
        notes: sale.notes || '',
        status: sale.status
      });
    } catch (err) {
      console.error('[SupabaseService] Failed to save sale:', err);
    }
  }
}
