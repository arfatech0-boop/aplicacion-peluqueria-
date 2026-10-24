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
  "authorizedBy" text,
  "saleId" text,
  "invoiceNumber" text,
  "paidAmount" numeric DEFAULT 0,
  "remainingAmount" numeric
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

-- ==========================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_products_store_code ON "products" ("storeId", "code");
CREATE INDEX IF NOT EXISTS idx_products_store_category ON "products" ("storeId", "category");
CREATE INDEX IF NOT EXISTS idx_products_store_name ON "products" ("storeId", "name");

CREATE INDEX IF NOT EXISTS idx_sales_store_date ON "sales" ("storeId", "date");
CREATE INDEX IF NOT EXISTS idx_sales_store_customer ON "sales" ("storeId", "customerId");
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON "sales" ("invoiceNumber");

CREATE INDEX IF NOT EXISTS idx_customers_store_dni ON "customers" ("storeId", "dniCuit");
CREATE INDEX IF NOT EXISTS idx_customers_store_name ON "customers" ("storeId", "name");

CREATE INDEX IF NOT EXISTS idx_customer_tx_store_cust ON "customerTransactions" ("storeId", "customerId");
CREATE INDEX IF NOT EXISTS idx_customer_tx_sale ON "customerTransactions" ("saleId");

CREATE INDEX IF NOT EXISTS idx_withdrawals_store_cust ON "withdrawals" ("storeId", "customerId");
CREATE INDEX IF NOT EXISTS idx_withdrawals_sale ON "withdrawals" ("saleId");
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON "withdrawals" ("status");

CREATE INDEX IF NOT EXISTS idx_cash_registers_store_status ON "cashRegisters" ("storeId", "status");

CREATE INDEX IF NOT EXISTS idx_stock_movements_prod_date ON "stockMovements" ("productId", "date");
CREATE INDEX IF NOT EXISTS idx_stock_movements_store ON "stockMovements" ("storeId");

-- ==========================================
-- ATOMIC STORED PROCEDURES (ACID TRANSACTIONS)
-- ==========================================

-- 1. process_sale_transaction
CREATE OR REPLACE FUNCTION process_sale_transaction(
  p_sale jsonb,
  p_items jsonb,
  p_store_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale_id text;
  v_store_id text;
  v_customer_id text;
  v_item jsonb;
  v_prod_id text;
  v_qty numeric;
  v_current_stock numeric;
  v_new_stock numeric;
  v_prod_name text;
  v_cc_amount numeric := 0;
  v_cash_amount numeric := 0;
  v_withdrawal_id text;
  v_remito_number text;
  v_customer_balance numeric;
  v_customer_name text;
  v_open_register_id text;
  v_new_movement jsonb;
BEGIN
  v_sale_id := p_sale->>'id';
  IF v_sale_id IS NULL OR v_sale_id = '' THEN
    v_sale_id := 'sale-' || round(extract(epoch from now()) * 1000)::text;
  END IF;

  v_store_id := COALESCE(p_store_id, p_sale->>'storeId');

  INSERT INTO "sales" (
    "id", "storeId", "invoiceNumber", "invoiceType", "cae", "caeDueDate",
    "customerCuitDni", "customerTaxCondition", "date", "customerId", "customerName",
    "items", "subtotal", "discount", "surcharge", "cardBankName", "totalAmount",
    "paymentMethod", "paymentsBreakdown", "notes", "status", "amountPaidCash", "changeDue"
  ) VALUES (
    v_sale_id,
    v_store_id,
    p_sale->>'invoiceNumber',
    p_sale->>'invoiceType',
    p_sale->>'cae',
    p_sale->>'caeDueDate',
    p_sale->>'customerCuitDni',
    p_sale->>'customerTaxCondition',
    COALESCE(p_sale->>'date', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
    p_sale->>'customerId',
    p_sale->>'customerName',
    p_items,
    (p_sale->>'subtotal')::numeric,
    COALESCE((p_sale->>'discount')::numeric, 0),
    COALESCE((p_sale->>'surcharge')::numeric, 0),
    p_sale->>'cardBankName',
    (p_sale->>'totalAmount')::numeric,
    p_sale->>'paymentMethod',
    p_sale->'paymentsBreakdown',
    p_sale->>'notes',
    COALESCE(p_sale->>'status', 'completed'),
    (p_sale->>'amountPaidCash')::numeric,
    (p_sale->>'changeDue')::numeric
  )
  ON CONFLICT ("id") DO UPDATE SET
    "status" = EXCLUDED."status",
    "totalAmount" = EXCLUDED."totalAmount";

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_prod_id := v_item->>'productId';
    v_qty := (v_item->>'quantity')::numeric;

    SELECT "stock", "name" INTO v_current_stock, v_prod_name
    FROM "products"
    WHERE "id" = v_prod_id
    FOR UPDATE;

    IF FOUND THEN
      v_new_stock := v_current_stock - v_qty;

      UPDATE "products"
      SET "stock" = v_new_stock,
          "updatedAt" = to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      WHERE "id" = v_prod_id;

      INSERT INTO "stockMovements" (
        "id", "storeId", "productId", "productName", "type",
        "quantity", "previousStock", "newStock", "date", "reason"
      ) VALUES (
        'sm-' || round(extract(epoch from now()) * 1000)::text || '-' || floor(random() * 1000)::text,
        v_store_id,
        v_prod_id,
        COALESCE(v_prod_name, v_item->>'productName', 'Producto'),
        'sale',
        v_qty,
        v_current_stock,
        v_new_stock,
        COALESCE(p_sale->>'date', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
        'Venta ' || COALESCE(p_sale->>'invoiceNumber', v_sale_id)
      );
    END IF;
  END LOOP;

  v_customer_id := p_sale->>'customerId';
  IF v_customer_id IS NOT NULL AND v_customer_id <> '' THEN
    IF p_sale->>'paymentMethod' = 'current_account' OR p_sale->>'invoiceType' = 'REMITO' THEN
      v_cc_amount := (p_sale->>'totalAmount')::numeric;
    ELSIF p_sale->'paymentsBreakdown' IS NOT NULL THEN
      SELECT COALESCE(SUM((val->>'amount')::numeric), 0) INTO v_cc_amount
      FROM jsonb_array_elements(p_sale->'paymentsBreakdown') AS val
      WHERE val->>'method' = 'current_account';
    END IF;

    IF v_cc_amount > 0 THEN
      SELECT "currentBalance", "name" INTO v_customer_balance, v_customer_name
      FROM "customers"
      WHERE "id" = v_customer_id
      FOR UPDATE;

      IF FOUND THEN
        v_customer_balance := COALESCE(v_customer_balance, 0) + v_cc_amount;

        UPDATE "customers"
        SET "currentBalance" = v_customer_balance,
            "updatedAt" = to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        WHERE "id" = v_customer_id;

        v_withdrawal_id := 'with-sale-' || v_sale_id;
        v_remito_number := CASE 
          WHEN p_sale->>'invoiceType' = 'REMITO' THEN regexp_replace(COALESCE(p_sale->>'invoiceNumber', ''), '^FC-', 'REM-')
          ELSE 'REM-' || regexp_replace(COALESCE(p_sale->>'invoiceNumber', ''), '^(FC-|TK-|REM-)', '')
        END;

        INSERT INTO "withdrawals" (
          "id", "storeId", "withdrawalNumber", "customerId", "customerName",
          "date", "items", "totalAmount", "status", "notes", "authorizedBy",
          "saleId", "invoiceNumber", "paidAmount", "remainingAmount"
        ) VALUES (
          v_withdrawal_id,
          v_store_id,
          v_remito_number,
          v_customer_id,
          v_customer_name,
          COALESCE(p_sale->>'date', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
          p_items,
          v_cc_amount,
          'pending',
          'Generado automáticamente desde Venta ' || COALESCE(p_sale->>'invoiceNumber', ''),
          'Venta Mostrador',
          v_sale_id,
          p_sale->>'invoiceNumber',
          0,
          v_cc_amount
        )
        ON CONFLICT ("id") DO NOTHING;

        INSERT INTO "customerTransactions" (
          "id", "storeId", "customerId", "customerName", "type",
          "amount", "balanceAfter", "date", "description", "saleId", "withdrawalId"
        ) VALUES (
          'tx-sale-' || v_sale_id,
          v_store_id,
          v_customer_id,
          v_customer_name,
          'sale',
          v_cc_amount,
          v_customer_balance,
          COALESCE(p_sale->>'date', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
          'Venta ' || CASE WHEN p_sale->>'invoiceType' = 'REMITO' THEN 'Remito' ELSE 'Cta. Cte.' END || ' #' || COALESCE(p_sale->>'invoiceNumber', ''),
          v_sale_id,
          v_withdrawal_id
        )
        ON CONFLICT ("id") DO NOTHING;
      END IF;
    END IF;
  END IF;

  IF p_sale->>'paymentMethod' = 'cash' THEN
    v_cash_amount := (p_sale->>'totalAmount')::numeric;
  ELSIF p_sale->'paymentsBreakdown' IS NOT NULL THEN
    SELECT COALESCE(SUM((val->>'amount')::numeric), 0) INTO v_cash_amount
    FROM jsonb_array_elements(p_sale->'paymentsBreakdown') AS val
    WHERE val->>'method' = 'cash';
  END IF;

  IF v_cash_amount > 0 THEN
    SELECT "id" INTO v_open_register_id
    FROM "cashRegisters"
    WHERE "status" = 'open' 
      AND ("storeId" = v_store_id OR v_store_id IS NULL OR "storeId" IS NULL)
    ORDER BY "openDate" DESC
    LIMIT 1
    FOR UPDATE;

    IF v_open_register_id IS NOT NULL THEN
      v_new_movement := jsonb_build_object(
        'id', 'mov-sale-' || v_sale_id,
        'type', 'in',
        'amount', v_cash_amount,
        'description', 'Venta contado #' || COALESCE(p_sale->>'invoiceNumber', v_sale_id),
        'category', 'sale',
        'date', COALESCE(p_sale->>'date', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
        'paymentMethod', 'cash'
      );

      UPDATE "cashRegisters"
      SET "cashSales" = COALESCE("cashSales", 0) + v_cash_amount,
          "expectedTotal" = COALESCE("expectedTotal", 0) + v_cash_amount,
          "movements" = jsonb_insert(
            COALESCE("movements", '[]'::jsonb),
            '{0}',
            v_new_movement
          )
      WHERE "id" = v_open_register_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'saleId', v_sale_id,
    'ccAmount', v_cc_amount,
    'cashAmount', v_cash_amount
  );
END;
$$;

-- 2. annul_sale_transaction
CREATE OR REPLACE FUNCTION annul_sale_transaction(
  p_sale_id text,
  p_store_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale RECORD;
  v_item jsonb;
  v_prod_id text;
  v_qty numeric;
  v_current_stock numeric;
  v_new_stock numeric;
  v_prod_name text;
  v_cc_amount numeric := 0;
  v_cash_amount numeric := 0;
  v_customer_balance numeric;
  v_open_register_id text;
  v_reversal_mov jsonb;
BEGIN
  SELECT * INTO v_sale
  FROM "sales"
  WHERE "id" = p_sale_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Venta no encontrada');
  END IF;

  IF v_sale.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'La venta ya fue anulada');
  END IF;

  UPDATE "sales"
  SET "status" = 'cancelled'
  WHERE "id" = p_sale_id;

  IF v_sale.items IS NOT NULL THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_sale.items)
    LOOP
      v_prod_id := v_item->>'productId';
      v_qty := (v_item->>'quantity')::numeric;

      SELECT "stock", "name" INTO v_current_stock, v_prod_name
      FROM "products"
      WHERE "id" = v_prod_id
      FOR UPDATE;

      IF FOUND THEN
        v_new_stock := v_current_stock + v_qty;

        UPDATE "products"
        SET "stock" = v_new_stock,
            "updatedAt" = to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        WHERE "id" = v_prod_id;

        INSERT INTO "stockMovements" (
          "id", "storeId", "productId", "productName", "type",
          "quantity", "previousStock", "newStock", "date", "reason"
        ) VALUES (
          'sm-annul-' || round(extract(epoch from now()) * 1000)::text || '-' || floor(random() * 1000)::text,
          v_sale."storeId",
          v_prod_id,
          COALESCE(v_prod_name, v_item->>'productName', 'Producto'),
          'adjustment',
          v_qty,
          v_current_stock,
          v_new_stock,
          to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'Anulacion Venta ' || COALESCE(v_sale."invoiceNumber", p_sale_id)
        );
      END IF;
    END LOOP;
  END IF;

  UPDATE "withdrawals"
  SET "status" = 'cancelled'
  WHERE "saleId" = p_sale_id OR "id" = 'with-sale-' || p_sale_id;

  IF v_sale."customerId" IS NOT NULL AND v_sale."customerId" <> '' THEN
    IF v_sale."paymentMethod" = 'current_account' OR v_sale."invoiceType" = 'REMITO' THEN
      v_cc_amount := COALESCE(v_sale."totalAmount", 0);
    ELSIF v_sale."paymentsBreakdown" IS NOT NULL THEN
      SELECT COALESCE(SUM((val->>'amount')::numeric), 0) INTO v_cc_amount
      FROM jsonb_array_elements(v_sale."paymentsBreakdown") AS val
      WHERE val->>'method' = 'current_account';
    END IF;

    IF v_cc_amount > 0 THEN
      SELECT "currentBalance" INTO v_customer_balance
      FROM "customers"
      WHERE "id" = v_sale."customerId"
      FOR UPDATE;

      IF FOUND THEN
        v_customer_balance := COALESCE(v_customer_balance, 0) - v_cc_amount;

        UPDATE "customers"
        SET "currentBalance" = v_customer_balance,
            "updatedAt" = to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        WHERE "id" = v_sale."customerId";

        INSERT INTO "customerTransactions" (
          "id", "storeId", "customerId", "customerName", "type",
          "amount", "balanceAfter", "date", "description", "saleId"
        ) VALUES (
          'tx-annul-' || round(extract(epoch from now()) * 1000)::text,
          v_sale."storeId",
          v_sale."customerId",
          v_sale."customerName",
          'adjustment',
          v_cc_amount,
          v_customer_balance,
          to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'Anulacion Venta #' || COALESCE(v_sale."invoiceNumber", p_sale_id),
          p_sale_id
        );
      END IF;
    END IF;
  END IF;

  IF v_sale."paymentMethod" = 'cash' THEN
    v_cash_amount := COALESCE(v_sale."totalAmount", 0);
  ELSIF v_sale."paymentsBreakdown" IS NOT NULL THEN
    SELECT COALESCE(SUM((val->>'amount')::numeric), 0) INTO v_cash_amount
    FROM jsonb_array_elements(v_sale."paymentsBreakdown") AS val
    WHERE val->>'method' = 'cash';
  END IF;

  IF v_cash_amount > 0 THEN
    SELECT "id" INTO v_open_register_id
    FROM "cashRegisters"
    WHERE "status" = 'open' 
      AND ("storeId" = v_sale."storeId" OR v_sale."storeId" IS NULL OR "storeId" IS NULL)
    ORDER BY "openDate" DESC
    LIMIT 1
    FOR UPDATE;

    IF v_open_register_id IS NOT NULL THEN
      v_reversal_mov := jsonb_build_object(
        'id', 'mov-annul-' || p_sale_id,
        'type', 'out',
        'amount', v_cash_amount,
        'description', 'Anulacion Venta #' || COALESCE(v_sale."invoiceNumber", p_sale_id),
        'category', 'annulment',
        'date', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'paymentMethod', 'cash'
      );

      UPDATE "cashRegisters"
      SET "cashSales" = GREATEST(0, COALESCE("cashSales", 0) - v_cash_amount),
          "expectedTotal" = COALESCE("expectedTotal", 0) - v_cash_amount,
          "movements" = jsonb_insert(
            COALESCE("movements", '[]'::jsonb),
            '{0}',
            v_reversal_mov
          )
      WHERE "id" = v_open_register_id;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) & TENANT ISOLATION
-- ==========================================

-- Helper function to extract store_id from JWT or headers
CREATE OR REPLACE FUNCTION current_app_store_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claims', true)::jsonb->>'store_id', ''),
    nullif(current_setting('request.headers', true)::jsonb->>'x-store-id', ''),
    nullif(current_setting('app.current_store_id', true), '')
  );
$$;

ALTER TABLE IF EXISTS "stores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "storeInfo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "priceIncreaseLogs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "customerTransactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "withdrawals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "sales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "cheques" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "cashRegisters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "stockMovements" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stores_policy" ON "stores" FOR ALL USING (current_app_store_id() IS NULL OR "id" = current_app_store_id() OR "id" = 'store-demo-a') WITH CHECK (current_app_store_id() IS NULL OR "id" = current_app_store_id());
CREATE POLICY "storeInfo_policy" ON "storeInfo" FOR ALL USING (current_app_store_id() IS NULL OR "storeId" = current_app_store_id() OR "storeId" IS NULL OR "storeId" = 'store-demo-a') WITH CHECK (current_app_store_id() IS NULL OR "storeId" = current_app_store_id());
CREATE POLICY "users_policy" ON "users" FOR ALL USING (current_app_store_id() IS NULL OR "storeId" = current_app_store_id() OR "role" = 'superadmin' OR "storeId" IS NULL) WITH CHECK (current_app_store_id() IS NULL OR "storeId" = current_app_store_id() OR "role" = 'superadmin');
CREATE POLICY "products_policy" ON "products" FOR ALL USING (current_app_store_id() IS NULL OR "storeId" = current_app_store_id() OR "storeId" IS NULL OR "storeId" = 'store-demo-a') WITH CHECK (current_app_store_id() IS NULL OR "storeId" = current_app_store_id());
CREATE POLICY "suppliers_policy" ON "suppliers" FOR ALL USING (current_app_store_id() IS NULL OR "storeId" = current_app_store_id() OR "storeId" IS NULL OR "storeId" = 'store-demo-a') WITH CHECK (current_app_store_id() IS NULL OR "storeId" = current_app_store_id());
CREATE POLICY "priceIncreaseLogs_policy" ON "priceIncreaseLogs" FOR ALL USING (current_app_store_id() IS NULL OR "storeId" = current_app_store_id()) WITH CHECK (current_app_store_id() IS NULL OR "storeId" = current_app_store_id());
CREATE POLICY "customers_policy" ON "customers" FOR ALL USING (current_app_store_id() IS NULL OR "storeId" = current_app_store_id() OR "storeId" IS NULL) WITH CHECK (current_app_store_id() IS NULL OR "storeId" = current_app_store_id());
CREATE POLICY "customerTransactions_policy" ON "customerTransactions" FOR ALL USING (current_app_store_id() IS NULL OR "storeId" = current_app_store_id()) WITH CHECK (current_app_store_id() IS NULL OR "storeId" = current_app_store_id());
CREATE POLICY "withdrawals_policy" ON "withdrawals" FOR ALL USING (current_app_store_id() IS NULL OR "storeId" = current_app_store_id()) WITH CHECK (current_app_store_id() IS NULL OR "storeId" = current_app_store_id());
CREATE POLICY "sales_policy" ON "sales" FOR ALL USING (current_app_store_id() IS NULL OR "storeId" = current_app_store_id()) WITH CHECK (current_app_store_id() IS NULL OR "storeId" = current_app_store_id());
CREATE POLICY "cheques_policy" ON "cheques" FOR ALL USING (current_app_store_id() IS NULL OR "storeId" = current_app_store_id()) WITH CHECK (current_app_store_id() IS NULL OR "storeId" = current_app_store_id());
CREATE POLICY "cashRegisters_policy" ON "cashRegisters" FOR ALL USING (current_app_store_id() IS NULL OR "storeId" = current_app_store_id() OR "storeId" IS NULL) WITH CHECK (current_app_store_id() IS NULL OR "storeId" = current_app_store_id());
CREATE POLICY "stockMovements_policy" ON "stockMovements" FOR ALL USING (current_app_store_id() IS NULL OR "storeId" = current_app_store_id()) WITH CHECK (current_app_store_id() IS NULL OR "storeId" = current_app_store_id());



