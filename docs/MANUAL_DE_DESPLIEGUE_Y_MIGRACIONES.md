# Manual de Despliegue, Migraciones y Operación Segura
**GestiónComercio Pro / ArFaTech POS**

---

## 1. Resumen de Fases Ejecutadas

| Fase | Alcance | Estado |
| :--- | :--- | :---: |
| **Fase 0** | Respaldo del entorno, neutralización de comandos destructivos (`DROP TABLE`, `delete()`), depuración de dependencias no usadas (`express`) y bloqueo de doble clic en POS. | ✅ Completada |
| **Fase 1** | Transacciones atómicas ACID (`process_sale_transaction`), restitución de stock y caja en anulación (`annul_sale_transaction`) e índices de alto rendimiento. | ✅ Completada |
| **Fase 2** | Seguridad Multi-Tenant, políticas de Row Level Security (RLS) en 13 tablas, aislamiento de consultas por `storeId` y cifrado de contraseñas con `bcrypt`. | ✅ Completada |
| **Fase 3** | Resiliencia Offline en `gc_offline_queue`, ordenamiento topológico de sincronización (maestras antes de transaccionales) y coalescing para evitar registros duplicados. | ✅ Completada |
| **Fase 4** | Verificación End-to-End en navegador, pruebas de flujo comercial (POS, Cuentas Corrientes, Remitos, Caja) y documentación de pase a producción. | ✅ Completada |

---

## 2. Aplicación de Migraciones en Supabase

En la carpeta `supabase/migrations/` disponés de los archivos SQL listos para ejecutar en el **SQL Editor** del panel de Supabase:

### Paso 1: Migración de Transacciones e Índices (Fase 1)
Archivo: `supabase/migrations/20261024_phase1_transactions_and_indexes.sql`
- Ejecuta en el SQL Editor de tu proyecto de Supabase.
- Crea los índices de búsqueda rápida.
- Agrega las columnas de remitos vinculados a la tabla `"withdrawals"`.
- Instala los procedimientos almacenados atómicos:
  - `process_sale_transaction(p_sale, p_items, p_store_id)`
  - `annul_sale_transaction(p_sale_id, p_store_id)`

### Paso 2: Migración de Seguridad y RLS (Fase 2)
Archivo: `supabase/migrations/20261024_phase2_row_level_security.sql`
- Habilita `ROW LEVEL SECURITY` en las 13 tablas.
- Instala la función `current_app_store_id()`.
- Define las políticas de aislamiento estricto para que ningún comercio pueda ver ni modificar datos de otro comercio.

---

## 3. Configuración de Variables de Entorno

En tu entorno local o en tu plataforma de hosting (Vercel, Netlify, Cloudflare Pages o Docker), configurá las siguientes variables:

```bash
# Variables del cliente Vite (Expuestas al frontend)
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_KEY="tu-clave-anon-publica"
```

> **IMPORTANTE**: Nunca utilices la clave `service_role` en las variables con prefijo `VITE_`. La clave `anon` es la única que debe usarse en la aplicación cliente; la seguridad está garantizada por las políticas RLS y los procedimientos RPC en la base de datos.

---

## 4. Fusión a la Rama Principal (`main`)

Una vez que revises y apruebes los cambios, podés incorporar la rama de trabajo a `main` ejecutando en tu terminal:

```bash
# 1. Asegurate de que no hay cambios pendientes
git checkout main

# 2. Fusionar la rama con todas las mejoras
git merge feature/fase-0-preparacion

# 3. Subir los cambios a tu repositorio remoto (GitHub / GitLab)
git push origin main
```

---

## 5. Garantías de Funcionamiento Offline

- **Ventas sin Internet**: Si el comercio se queda sin conexión a internet, las ventas continúan registrándose localmente de forma instantánea.
- **Deducción de Stock Local**: El stock se reduce inmediatamente en la pantalla y en el caché local.
- **Caja y Cuentas Corrientes**: El arqueo de caja y los saldos de clientes se actualizan al instante en el navegador.
- **Sincronización Automática**: Al restablecerse la conexión a internet, el sistema detecta el evento de red y sincroniza las acciones pendientes en orden de prioridad sin duplicar comprobantes.
