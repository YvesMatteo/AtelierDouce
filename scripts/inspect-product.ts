
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars:', { url: !!supabaseUrl, key: !!supabaseServiceKey });
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectProduct() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', 'd9e478e7-2e72-4b34-987f-7fed63572326')
        .single();

    if (error) {
        console.error('Error fetching product:', error);
        return;
    }

    console.log('Product Data:', JSON.stringify(data, null, 2));
}

inspectProduct();
