-- ==============================================================================
-- FASE 5: UNIFICACIÓN DE GESTIÓN DE USUARIOS Y PERMISOS MODULARES
-- ==============================================================================
-- Agrega columna granular de permisos en formato JSONB a la tabla users
-- Idempotente y seguro para entornos existentes
-- ==============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'permissions'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "permissions" jsonb DEFAULT '[]'::jsonb;
    END IF;
END $$;

COMMENT ON COLUMN "users"."permissions" IS 'Lista de IDs de módulos habilitados para el usuario (pos, cash, stock, customers, withdrawals, suppliers, cheques, reports, search, dashboard, settings)';
