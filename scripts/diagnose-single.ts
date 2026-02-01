
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_ID = '01f0b84d-c345-46a7-b2ec-d321df601c8c';

async function main() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', TARGET_ID)
        .single();

    if (error) {
        console.error(error);
    } else {
        console.log(JSON.stringify(data, null, 2));

        // Explicit checks
        console.log('Price type:', typeof data.price);
        console.log('Price value:', data.price);
        console.log('CJ Product ID:', data.cj_product_id);
        console.log('Active:', data.is_active);
        console.log('Images:', data.images?.length);
    }
}

main();
