
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getProductIds() {
    const { data: products, error } = await supabase
        .from('products')
        .select('cj_product_id, name')
        .not('cj_product_id', 'is', null);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Product CJ IDs to import:\n');
    products.forEach(p => {
        console.log(`    '${p.cj_product_id}', // ${p.name.substring(0, 40)}`);
    });
    console.log(`\nTotal: ${products.length} products`);
}

getProductIds();
