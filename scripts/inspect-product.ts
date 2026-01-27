
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
    // Search for the product
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('cj_product_id', '1626869424990990336');

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!products || products.length === 0) {
        console.log('No product found.');
        return;
    }

    const p = products[0];
    console.log(`Product Found: ${p.name}`);
    console.log(`Supabase ID: ${p.id}`);
    console.log(`CJ Product ID: ${p.cj_product_id}`);
    console.log('Images:');
    p.images.forEach((img: string, i: number) => {
        console.log(`[${i}] ${img}`);
    });
}

main().catch(console.error);
