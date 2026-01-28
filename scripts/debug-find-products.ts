
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
    const { data: products } = await supabase
        .from('products')
        .select('id, cj_product_id, name, images')
        .or('name.ilike.*hat*,name.ilike.*puffer*,name.ilike.*coat*,name.ilike.*jacket*');

    if (!products) {
        console.log('No products found');
        return;
    }

    products.forEach(p => {
        console.log(`\nID: ${p.id}`);
        console.log(`CJ ID: ${p.cj_product_id}`);
        console.log(`Name: ${p.name}`);
        console.log(`Images[0]: ${p.images?.[0]}`);
    });
}

main().catch(console.error);
