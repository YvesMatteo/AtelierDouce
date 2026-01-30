import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, price, category, images, description');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log('\n=== ALL PRODUCTS WITH IMAGES ===\n');

    products?.forEach((p, i) => {
        console.log(`--- Product ${i + 1} ---`);
        console.log(`ID: ${p.id}`);
        console.log(`Name: ${p.name}`);
        console.log(`Price: €${p.price}`);
        console.log(`Category: ${p.category}`);
        console.log(`Main Image: ${p.images?.[0] || 'No image'}`);
        console.log(`Description: ${p.description?.substring(0, 100) || 'No description'}...`);
        console.log(`Link: https://www.atelierdouce.shop/product/${p.id}`);
        console.log('');
    });
}

main();
