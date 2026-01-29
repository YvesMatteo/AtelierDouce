
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkProduct() {
    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('cj_product_id', '2501070601131628700')
        .single();

    if (error) {
        console.error('Check failed:', error.message);
    } else {
        console.log('✅ Product found in DB:');
        console.log(`   ID: ${product.id}`);
        console.log(`   Name: ${product.name}`);
        console.log(`   Stripe Product ID: ${product.stripe_product_id}`);
        console.log(`   Stripe Price ID: ${product.stripe_price_id}`);
        console.log(`   Supplier: ${product.supplier}`);
    }
}

checkProduct();
