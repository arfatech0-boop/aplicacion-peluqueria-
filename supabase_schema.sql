-- Script para crear las tablas de la base de datos en Supabase
-- MODO SEGURO: Creación idempotente con IF NOT EXISTS (sin destrucción de datos existentes)

-- Table: stores
CREATE TABLE IF NOT EXISTS "stores" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "cuit" text,
  "businessType" text,
  "address" text,
  "phone" text,
  "email" text,
  "active" boolean DEFAULT true,
  "isDemo" boolean DEFAULT false,
  "trialExpiresAt" text,
  "status" text,
  "createdAt" text
);

-- Table: storeInfo
CREATE TABLE IF NOT EXISTS "storeInfo" (
  "storeId" text PRIMARY KEY,
  "name" text,
  "cuit" text,
  "taxCondition" text,
  "businessType" text,
  "address" text,
  "phone" text,
  "email" text,
  "logoUrl" text,
  "invoicePrefix" text,
  "currencySymbol" text,
  "defaultTaxRate" numeric,
  "cashDiscountPercent" numeric,
  "cardSurchargePercent" numeric,
  "receiptHeaderMessage" text,
  "customCategories" jsonb,
  "defaultCounterInvoiceType" text,
  "defaultCurrentAccountInvoiceType" text,
  "defaultRespInscriptoInvoiceType" text,
  "afipPointOfSale" text,
  "cardInterestPlans" jsonb
);

-- Table: users
CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY,
  "storeId" text,
  "username" text NOT NULL,
  "password" text NOT NULL,
  "name" text NOT NULL,
  "role" text NOT NULL,
  "active" boolean DEFAULT true,
  "isDemo" boolean DEFAULT false,
  "trialExpiresAt" text,
  "createdAt" text,
  "lastLogin" text
);

-- Table: products
CREATE TABLE IF NOT EXISTS "products" (
  "id" text PRIMARY KEY,
  "storeId" text,
  "code" text,
  "name" text NOT NULL,
  "category" text,
  "supplierId" text,
  "costPrice" numeric,
  "salePrice" numeric,
  "stock" numeric,
  "minStock" numeric,
  "unit" text,
  "size" text,
  "color" text,
  "brand" text,
  "description" text,
  "updatedAt" text
);

-- Table: suppliers
CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" text PRIMARY KEY,
  "storeId" text,
  "name" text NOT NULL,
  "cuit" text,
  "phone" text,
  "email" text,
  "contact" text,
  "notes" text
);

-- Table: priceIncreaseLogs
CREATE TABLE IF NOT EXISTS "priceIncreaseLogs" (
  "id" text PRIMARY KEY,
  "storeId" text,
  "supplierId" text,
  "supplierName" text,
  "categoryFilter" text,
  "percentage" numeric,
  "applyToCost" boolean,
  "applyToSale" boolean,
  "recalculateMargin" boolean,
  "affectedProductsCount" numeric,
  "date" text
);

-- Table: customers
CREATE TABLE IF NOT EXISTS "customers" (
  "id" text PRIMARY KEY,
  "storeId" text,
  "name" text NOT NULL,
  "dniCuit" text,
  "phone" text,
  "email" text,
  "address" text,
  "creditLimit" numeric,
  "currentBalance" numeric,
  "notes" text,
  "updatedAt" text
);

-- Table: customerTransactions
CREATE TABLE IF NOT EXISTS "customerTransactions" (
  "id" text PRIMARY KEY,
  "storeId" text,
  "customerId" text,
  "customerName" text,
  "type" text,
  "amount" numeric,
  "balanceAfter" numeric,
  "date" text,
  "description" text,
  "saleId" text,
  "withdrawalId" text,
  "receiptNumber" text,
  "reference" text
);

-- Table: withdrawals
CREATE TABLE IF NOT EXISTS "withdrawals" (
  "id" text PRIMARY KEY,
  "storeId" text,
  "withdrawalNumber" text,
  "customerId" text,
  "customerName" text,
  "date" text,
  "items" jsonb,
  "totalAmount" numeric,
  "status" text,
  "notes" text,
  "authorizedBy" text
);

-- Table: sales
CREATE TABLE IF NOT EXISTS "sales" (
  "id" text PRIMARY KEY,
  "storeId" text,
  "invoiceNumber" text,
  "invoiceType" text,
  "cae" text,
  "caeDueDate" text,
  "customerCuitDni" text,
  "customerTaxCondition" text,
  "date" text,
  "customerId" text,
  "customerName" text,
  "items" jsonb,
  "subtotal" numeric,
  "discount" numeric,
  "surcharge" numeric,
  "cardBankName" text,
  "totalAmount" numeric,
  "paymentMethod" text,
  "paymentsBreakdown" jsonb,
  "notes" text,
  "status" text,
  "amountPaidCash" numeric,
  "changeDue" numeric
);

-- Table: cheques
CREATE TABLE IF NOT EXISTS "cheques" (
  "id" text PRIMARY KEY,
  "storeId" text,
  "number" text,
  "bank" text,
  "issuerName" text,
  "issuerCuit" text,
  "customerId" text,
  "customerName" text,
  "amount" numeric,
  "issueDate" text,
  "dueDate" text,
  "status" text,
  "notes" text
);

-- Table: cashRegisters
CREATE TABLE IF NOT EXISTS "cashRegisters" (
  "id" text PRIMARY KEY,
  "storeId" text,
  "openDate" text,
  "closeDate" text,
  "initialAmount" numeric,
  "cashSales" numeric,
  "accountPayments" numeric,
  "cashExpenses" numeric,
  "expectedTotal" numeric,
  "actualTotal" numeric,
  "difference" numeric,
  "status" text,
  "movements" jsonb,
  "notes" text
);

-- Table: stockMovements
CREATE TABLE IF NOT EXISTS "stockMovements" (
  "id" text PRIMARY KEY,
  "storeId" text,
  "productId" text,
  "productName" text,
  "type" text,
  "quantity" numeric,
  "previousStock" numeric,
  "newStock" numeric,
  "date" text,
  "reason" text
);

-- ENABLE REALTIME ON ALL TABLES --
alter publication supabase_realtime add table "stores", "storeInfo", "users", "products", "suppliers", "priceIncreaseLogs", "customers", "customerTransactions", "withdrawals", "sales", "cheques", "cashRegisters", "stockMovements";

