
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAll() {
    const { data, error } = await supabase.from('products').select('id, name, created_at').order('created_at', { ascending: false }).limit(50);
    if (error) console.error(error);
    else console.table(data);
}

listAll();
