import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://fviljkfepzpciqwyulpi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2aWxqa2ZlcHpwY2lxd3l1bHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzOTkxMjIsImV4cCI6MjEwMTk3NTEyMn0.KHiTY5e87esJkNGxUlfqAWM7fglvYxgwpXLXS9A1SyE');

async function run() {
  const { error } = await supabase.from('users').update({ storeId: 'store-kioscomate' }).eq('id', 'user-1790355544015');
  console.log('Updated error:', error);
}

run();
