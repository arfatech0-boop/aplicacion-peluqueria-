import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY must be provided in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DATA_FILE = path.join(process.cwd(), 'app-data.json');

async function seedData() {
  console.log('🚀 Initiating Supabase Seeding Process...');

  if (!fs.existsSync(DATA_FILE)) {
    console.error('❌ app-data.json file not found!');
    return;
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  const appState = JSON.parse(raw);

  // 1. Store Info
  if (appState.storeInfo) {
    console.log('📌 Seeding store_info...');
    const info = appState.storeInfo;
    const { error } = await supabase.from('store_info').upsert({
      id: 'default',
      name: info.name,
      cuit: info.cuit,
      tax_condition: info.taxCondition,
      business_type: info.businessType,
      address: info.address,
      phone: info.phone,
      email: info.email,
      invoice_prefix: info.invoicePrefix,
      currency_symbol: info.currencySymbol,
      default_tax_rate: info.defaultTaxRate,
      cash_discount_percent: info.cashDiscountPercent,
      card_surcharge_percent: info.cardSurchargePercent,
      receipt_header_message: info.receiptHeaderMessage,
      custom_categories: info.customCategories,
      card_interest_plans: info.cardInterestPlans,
      default_counter_invoice_type: info.defaultCounterInvoiceType,
      default_current_account_invoice_type: info.defaultCurrentAccountInvoiceType,
      default_resp_inscripto_invoice_type: info.defaultRespInscriptoInvoiceType,
      afip_point_of_sale: info.afipPointOfSale
    });
    if (error) console.error('Error store_info:', error);
    else console.log('✅ store_info seeded.');
  }

  // 2. Users
  if (Array.isArray(appState.users) && appState.users.length) {
    console.log(`📌 Seeding ${appState.users.length} users...`);
    const users = appState.users.map((u: any) => ({
      id: u.id,
      username: u.username,
      password: u.password,
      name: u.name,
      role: u.role,
      active: u.active,
      created_at: u.createdAt,
      last_login: u.lastLogin
    }));
    const { error } = await supabase.from('users').upsert(users);
    if (error) console.error('Error users:', error);
    else console.log('✅ users seeded.');
  }

  // 3. Suppliers
  if (Array.isArray(appState.suppliers) && appState.suppliers.length) {
    console.log(`📌 Seeding ${appState.suppliers.length} suppliers...`);
    const suppliers = appState.suppliers.map((s: any) => ({
      id: s.id,
      name: s.name,
      cuit: s.cuit,
      phone: s.phone,
      email: s.email,
      contact: s.contact,
      notes: s.notes
    }));
    const { error } = await supabase.from('suppliers').upsert(suppliers);
    if (error) console.error('Error suppliers:', error);
    else console.log('✅ suppliers seeded.');
  }

  // 4. Products
  if (Array.isArray(appState.products) && appState.products.length) {
    console.log(`📌 Seeding ${appState.products.length} products...`);
    // SEGURIDAD: NO borrar productos ciegamente. Se utiliza upsert por ID.
    // await supabase.from('products').delete().neq('id', 'keep-none');

    const products = appState.products.map((p: any) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      category: p.category,
      supplier_id: p.supplierId,
      cost_price: p.costPrice,
      sale_price: p.salePrice,
      stock: p.stock,
      min_stock: p.minStock,
      unit: p.unit,
      size: p.size,
      color: p.color,
      brand: p.brand,
      description: p.description,
      updated_at: p.updatedAt
    }));
    const { error } = await supabase.from('products').upsert(products);
    if (error) console.error('Error products:', error);
    else console.log('✅ products seeded.');
  }

  // 5. Customers
  if (Array.isArray(appState.customers) && appState.customers.length) {
    console.log(`📌 Seeding ${appState.customers.length} customers...`);
    const customers = appState.customers.map((c: any) => ({
      id: c.id,
      name: c.name,
      dni_cuit: c.dniCuit,
      phone: c.phone,
      email: c.email,
      address: c.address,
      credit_limit: c.creditLimit,
      current_balance: c.currentBalance,
      notes: c.notes,
      updated_at: c.updatedAt
    }));
    const { error } = await supabase.from('customers').upsert(customers);
    if (error) console.error('Error customers:', error);
    else console.log('✅ customers seeded.');
  }

  // 6. Customer Transactions
  if (Array.isArray(appState.customerTransactions) && appState.customerTransactions.length) {
    console.log(`📌 Seeding ${appState.customerTransactions.length} customer transactions...`);
    const txs = appState.customerTransactions.map((t: any) => ({
      id: t.id,
      customer_id: t.customerId,
      type: t.type,
      amount: t.amount,
      balance_after: t.balanceAfter,
      date: t.date,
      description: t.description,
      receipt_number: t.receiptNumber,
      sale_id: t.saleId,
      items_summary: t.itemsSummary,
      payment_method: t.paymentMethod
    }));
    const { error } = await supabase.from('customer_transactions').upsert(txs);
    if (error) console.error('Error customer_transactions:', error);
    else console.log('✅ customer_transactions seeded.');
  }

  // 7. Withdrawals
  if (Array.isArray(appState.withdrawals) && appState.withdrawals.length) {
    console.log(`📌 Seeding ${appState.withdrawals.length} withdrawals...`);
    const withdrawals = appState.withdrawals.map((w: any) => ({
      id: w.id,
      withdrawal_number: w.withdrawalNumber,
      customer_id: w.customerId,
      customer_name: w.customerName,
      date: w.date,
      items: w.items,
      total_amount: w.totalAmount,
      status: w.status,
      notes: w.notes,
      authorized_by: w.authorizedBy
    }));
    const { error } = await supabase.from('withdrawals').upsert(withdrawals);
    if (error) console.error('Error withdrawals:', error);
    else console.log('✅ withdrawals seeded.');
  }

  // 8. Sales
  if (Array.isArray(appState.sales) && appState.sales.length) {
    console.log(`📌 Seeding ${appState.sales.length} sales...`);
    const sales = appState.sales.map((s: any) => ({
      id: s.id,
      invoice_number: s.invoiceNumber,
      invoice_type: s.invoiceType,
      cae: s.cae,
      cae_due_date: s.caeDueDate,
      customer_cuit_dni: s.customerCuitDni,
      customer_tax_condition: s.customerTaxCondition,
      date: s.date,
      customer_id: s.customerId,
      customer_name: s.customerName,
      items: s.items,
      subtotal: s.subtotal,
      discount: s.discount,
      surcharge: s.surcharge,
      total_amount: s.totalAmount,
      payment_method: s.paymentMethod,
      notes: s.notes,
      status: s.status
    }));
    const { error } = await supabase.from('sales').upsert(sales);
    if (error) console.error('Error sales:', error);
    else console.log('✅ sales seeded.');
  }

  // 9. Cheques
  if (Array.isArray(appState.cheques) && appState.cheques.length) {
    console.log(`📌 Seeding ${appState.cheques.length} cheques...`);
    const cheques = appState.cheques.map((c: any) => ({
      id: c.id,
      number: c.number,
      bank: c.bank,
      issuer_name: c.issuerName,
      issuer_cuit: c.issuerCuit,
      customer_id: c.customerId,
      customer_name: c.customerName,
      amount: c.amount,
      issue_date: c.issueDate,
      due_date: c.dueDate,
      status: c.status,
      notes: c.notes
    }));
    const { error } = await supabase.from('cheques').upsert(cheques);
    if (error) console.error('Error cheques:', error);
    else console.log('✅ cheques seeded.');
  }

  // 10. Cash Registers
  if (Array.isArray(appState.cashRegisters) && appState.cashRegisters.length) {
    console.log(`📌 Seeding ${appState.cashRegisters.length} cash registers...`);
    const cash = appState.cashRegisters.map((c: any) => ({
      id: c.id,
      open_date: c.openDate,
      close_date: c.closeDate,
      initial_amount: c.initialAmount,
      cash_sales: c.cashSales,
      account_payments: c.accountPayments,
      cash_expenses: c.cashExpenses,
      expected_total: c.expectedTotal,
      actual_total: c.actualTotal,
      difference: c.difference,
      status: c.status,
      movements: c.movements,
      notes: c.notes
    }));
    const { error } = await supabase.from('cash_registers').upsert(cash);
    if (error) console.error('Error cash_registers:', error);
    else console.log('✅ cash_registers seeded.');
  }

  // 11. Stock Movements
  if (Array.isArray(appState.stockMovements) && appState.stockMovements.length) {
    console.log(`📌 Seeding ${appState.stockMovements.length} stock movements...`);
    const sms = appState.stockMovements.map((sm: any) => ({
      id: sm.id,
      product_id: sm.productId,
      product_name: sm.productName,
      type: sm.type,
      quantity: sm.quantity,
      previous_stock: sm.previousStock,
      new_stock: sm.newStock,
      date: sm.date,
      reason: sm.reason
    }));
    const { error } = await supabase.from('stock_movements').upsert(sms);
    if (error) console.error('Error stock_movements:', error);
    else console.log('✅ stock_movements seeded.');
  }

  console.log('🎉 Seeding finished successfully!');
}

seedData();
