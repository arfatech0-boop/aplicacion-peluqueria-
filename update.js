import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from './src/config.ts';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { error } = await supabase.from('users').update({ storeId: 'store-kioscomate' }).eq('id', 'user-1790355544015');
  console.log('Updated error:', error);
}

run();
