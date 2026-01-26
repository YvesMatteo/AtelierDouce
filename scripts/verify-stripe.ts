import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkStripeIds() {
    const { data: products, error } = await supabase
        .from('products')
        .select('name, stripe_product_id, stripe_price_id, category')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error(error);
        return;
    }

    console.table(products);

    const missingStripe = products.filter(p => !p.stripe_price_id);
    if (missingStripe.length > 0) {
        console.error('❌ Some active products are missing Stripe Price IDs:', missingStripe.map(p => p.name));
    } else {
        console.log('✅ All checked products have Stripe Price IDs.');
    }
}

checkStripeIds();
