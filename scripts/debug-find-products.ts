
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for full access
);

async function main() {
    console.log('Searching for products...');
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .in('name', ['Elegant Collection Piece', 'Stylish Outerwear', 'Hood Warm Jacket Brown']);

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    if (!products || products.length === 0) {
        console.log('No products found with those names.');
        return;
    }

    console.log(`Found ${products.length} products.`);

    products.forEach(p => {
        console.log(`--------------------------------------------------`);
        console.log(`ID: ${p.id}`);
        console.log(`Name: ${p.name}`);
        console.log(`CJ ID: ${p.cj_product_id}`);
        console.log(`Created At: ${p.created_at}`);
        console.log(`Images Count: ${p.images ? p.images.length : 0}`);
        if (p.images && p.images.length > 0) {
            console.log('Images:');
            p.images.forEach((img: string, index: number) => {
                console.log(`  [${index}] ${img}`);
            });
        } else {
            console.log('Images: NONE');
        }
    });
}

main().catch(console.error);
