
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_ID = '01f0b84d-c345-46a7-b2ec-d321df601c8c'; // Luxe Fox Fur Ear Warmers

async function main() {
    console.log('--- Diagnosing Product: Luxe Fox Fur Ear Warmers ---');

    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', TARGET_ID)
        .single();

    if (error) {
        console.error('Error fetching product:', error);
        return;
    }

    console.log('Product Data:', JSON.stringify(product, null, 2));

    // Check if price is valid number
    if (typeof product.price !== 'number') {
        console.error('CRITICAL: Price is not a number:', product.price);
    }

    // Check Stripe/CJ IDs
    console.log('CJ Product ID:', product.cj_product_id);

    console.log('--- Fetching All Active Products ---');
    const { data: allActive, error: allError } = await supabase
        .from('products')
        .select('id, name')
        .eq('is_active', true);

    if (allError) console.error(allError);
    else {
        console.log(`Found ${allActive.length} active products.`);
        allActive.forEach(p => console.log(`- ${p.name} (${p.id})`));
    }
}

main();
