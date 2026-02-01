
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const productName = "Women's New Professional Double-board Waterproof Ski Suit";
    console.log(`Searching for duplicates of: ${productName}`);

    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, price, created_at, cj_product_id')
        .eq('name', productName);

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    if (!products || products.length === 0) {
        console.log('No products found.');
    } else {
        console.log(`Found ${products.length} products:`);
        products.forEach(p => {
            console.log(`- ID: ${p.id}, CJ ID: ${p.cj_product_id}, Price: ${p.price}, Created: ${p.created_at}`);
        });
    }
}

main().catch(console.error);
