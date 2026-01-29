
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('🔍 Fetching one product to inspect schema...');

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error fetching product:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('✅ Sample product keys:', Object.keys(data[0]));
        console.log('Sample data:', data[0]);
    } else {
        console.log('⚠️ No products found locally.');
    }
}

inspectSchema();
