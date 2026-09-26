import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://fviljkfepzpciqwyulpi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2aWxqa2ZlcHpwY2lxd3l1bHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzOTkxMjIsImV4cCI6MjEwMTk3NTEyMn0.KHiTY5e87esJkNGxUlfqAWM7fglvYxgwpXLXS9A1SyE');

async function run() {
  const { data: users, error } = await supabase.from('users').select('*');
  console.log('Users:', users.map(u => ({ id: u.id, username: u.username, storeId: u.storeId })));
  
  const { data: products } = await supabase.from('products').select('*');
  console.log('Sample Product storeId:', products[0]?.storeId);
  console.log('Products Count:', products.length);
}

run();
