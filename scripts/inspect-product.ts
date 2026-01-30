
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const id = process.argv[2];
    if (!id) {
        console.log('Please provide an ID or CJ ID');
        return;
    }

    console.log(`Searching for: ${id}`);

    // Check if UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = supabase.from('products').select('*');
    if (isUUID) {
        query = query.eq('id', id);
    } else {
        query = query.eq('cj_product_id', id);
    }

    const { data: products, error } = await query;

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!products || products.length === 0) {
        console.log('No product found.');
        return;
    }

    for (const p of products) {
        console.log(`\nProduct Found: ${p.name}`);
        console.log(`Supabase ID: ${p.id}`);
        console.log(`CJ Product ID: ${p.cj_product_id}`);
        console.log(`Stripe ID: ${p.stripe_product_id}`);
        console.log('Images:');
        if (p.images) {
            p.images.forEach((img: string, i: number) => {
                console.log(`[${i}] ${img}`);
            });
        } else {
            console.log('No images.');
        }
    }
}

main().catch(console.error);
