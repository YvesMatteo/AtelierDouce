
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CJ_ID = '2412070355501627400';

async function checkProduct() {
    console.log(`Checking product: ${CJ_ID}`);
    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('cj_product_id', CJ_ID)
        .single();

    if (error) {
        console.error('Error fetching product:', error.message);
        return;
    }

    if (!product) {
        console.log('❌ Product NOT found in database.');
    } else {
        console.log('✅ Product found:');
        console.log(`   ID: ${product.id}`);
        console.log(`   Name: ${product.name}`);
        console.log(`   Active: ${product.is_active}`);
        console.log(`   Price: ${product.price}`);
        console.log(`   Stripe Product ID: ${product.stripe_product_id}`);
        console.log(`   Stripe Price ID: ${product.stripe_price_id}`);
        console.log(`   Images:`, product.images);
        console.log(`   Category: ${product.category}`);
    }
}

checkProduct().catch(console.error);
