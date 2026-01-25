import { supabase } from './lib/supabase'; async function check() { const { data } = await supabase.from('products').select('*').limit(1); console.log(JSON.stringify(data[0].images)); } check();
