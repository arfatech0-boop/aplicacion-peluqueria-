import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from './src/config.ts';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data, error } = await supabase.from('users').select('*');
  console.log('Users:', data);
  console.log('Error:', error);
}

run();
