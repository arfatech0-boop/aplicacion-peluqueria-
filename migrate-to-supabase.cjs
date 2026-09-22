require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan las credenciales de Supabase en el archivo .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
  console.log("Iniciando migración de datos hacia Supabase...");

  const rawData = fs.readFileSync('./app-data.json', 'utf-8');
  const appData = JSON.parse(rawData);

  const tables = [
    { name: 'stores', data: appData.stores },
    { name: 'storeInfo', data: appData.storeInfo ? [{...appData.storeInfo, storeId: 'store-demo-a'}] : [] },
    { name: 'users', data: appData.users },
    { name: 'products', data: appData.products },
    { name: 'suppliers', data: appData.suppliers },
    { name: 'priceIncreaseLogs', data: appData.priceIncreaseLogs },
    { name: 'customers', data: appData.customers },
    { name: 'customerTransactions', data: appData.customerTransactions },
    { name: 'withdrawals', data: appData.withdrawals },
    { name: 'sales', data: appData.sales },
    { name: 'cheques', data: appData.cheques },
    { name: 'cashRegisters', data: appData.cashRegisters },
    { name: 'stockMovements', data: appData.stockMovements }
  ];

  for (const table of tables) {
    if (!table.data || table.data.length === 0) {
      console.log(`- Tabla ${table.name}: Sin datos para migrar.`);
      continue;
    }

    console.log(`- Migrando tabla ${table.name} (${table.data.length} registros)...`);
    
    // We insert in batches of 100 to avoid request limits
    for (let i = 0; i < table.data.length; i += 100) {
      const batch = table.data.slice(i, i + 100);
      const { error } = await supabase.from(table.name).upsert(batch);
      
      if (error) {
        console.error(`Error al insertar en ${table.name}:`, error);
      }
    }
  }

  console.log("¡Migración completada con éxito!");
}

migrateData().catch(console.error);
