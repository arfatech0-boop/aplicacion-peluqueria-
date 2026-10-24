-- Migration: 20261024_phase2_row_level_security.sql
-- Description: Multi-tenant Row Level Security (RLS) policies and store isolation

-- 1. Helper function to extract store_id from JWT or request headers
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

-- 2. ENABLE ROW LEVEL SECURITY ON ALL APPLICATION TABLES
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

-- 3. DROP EXISTING POLICIES IF PRESENT TO PREVENT DUPLICATES
DO $$
DECLARE
  tbl text;
  pol text;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
    'stores', 'storeInfo', 'users', 'products', 'suppliers', 'priceIncreaseLogs',
    'customers', 'customerTransactions', 'withdrawals', 'sales', 'cheques', 'cashRegisters', 'stockMovements'
  )
  LOOP
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol, tbl);
    END LOOP;
  END LOOP;
END $$;

-- 4. POLICIES: stores & storeInfo
CREATE POLICY "stores_policy" ON "stores"
FOR ALL
USING (
  current_app_store_id() IS NULL
  OR "id" = current_app_store_id()
  OR "id" = 'store-demo-a'
)
WITH CHECK (
  current_app_store_id() IS NULL
  OR "id" = current_app_store_id()
);

CREATE POLICY "storeInfo_policy" ON "storeInfo"
FOR ALL
USING (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
  OR "storeId" IS NULL
  OR "storeId" = 'store-demo-a'
)
WITH CHECK (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
);

-- 5. POLICIES: users
CREATE POLICY "users_policy" ON "users"
FOR ALL
USING (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
  OR "role" = 'superadmin'
  OR "storeId" IS NULL
)
WITH CHECK (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
  OR "role" = 'superadmin'
);

-- 6. POLICIES: products
CREATE POLICY "products_policy" ON "products"
FOR ALL
USING (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
  OR "storeId" IS NULL
  OR "storeId" = 'store-demo-a'
)
WITH CHECK (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
);

-- 7. POLICIES: suppliers & priceIncreaseLogs
CREATE POLICY "suppliers_policy" ON "suppliers"
FOR ALL
USING (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
  OR "storeId" IS NULL
  OR "storeId" = 'store-demo-a'
)
WITH CHECK (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
);

CREATE POLICY "priceIncreaseLogs_policy" ON "priceIncreaseLogs"
FOR ALL
USING (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
)
WITH CHECK (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
);

-- 8. POLICIES: customers & customerTransactions
CREATE POLICY "customers_policy" ON "customers"
FOR ALL
USING (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
  OR "storeId" IS NULL
)
WITH CHECK (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
);

CREATE POLICY "customerTransactions_policy" ON "customerTransactions"
FOR ALL
USING (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
)
WITH CHECK (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
);

-- 9. POLICIES: withdrawals (remitos) & sales
CREATE POLICY "withdrawals_policy" ON "withdrawals"
FOR ALL
USING (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
)
WITH CHECK (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
);

CREATE POLICY "sales_policy" ON "sales"
FOR ALL
USING (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
)
WITH CHECK (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
);

-- 10. POLICIES: cheques, cashRegisters & stockMovements
CREATE POLICY "cheques_policy" ON "cheques"
FOR ALL
USING (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
)
WITH CHECK (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
);

CREATE POLICY "cashRegisters_policy" ON "cashRegisters"
FOR ALL
USING (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
  OR "storeId" IS NULL
)
WITH CHECK (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
);

CREATE POLICY "stockMovements_policy" ON "stockMovements"
FOR ALL
USING (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
)
WITH CHECK (
  current_app_store_id() IS NULL
  OR "storeId" = current_app_store_id()
);
