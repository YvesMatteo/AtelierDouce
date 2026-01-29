import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function cleanupStripeProducts() {
    console.log('🚀 Starting Stripe cleanup...');

    // 1. Get all active Stripe Product IDs from Supabase
    const { data: activeProducts, error } = await supabase
        .from('products')
        .select('stripe_product_id')
        .eq('is_active', true)
        .not('stripe_product_id', 'is', null);

    if (error) {
        console.error('❌ Error fetching from Supabase:', error);
        return;
    }

    const validStripeIds = new Set(activeProducts.map(p => p.stripe_product_id));
    console.log(`✅ Found ${validStripeIds.size} active products in Supabase.`);

    // 2. Iterate through all Stripe products
    let hasMore = true;
    let startingAfter: string | undefined;
    let archivedCount = 0;
    let scannedCount = 0;

    console.log('📦 Scanning Stripe products...');

    while (hasMore) {
        const stripeProducts = await stripe.products.list({
            limit: 100,
            active: true, // Only fetch currently active Stripe products
            starting_after: startingAfter,
        });

        for (const product of stripeProducts.data) {
            scannedCount++;

            // If this Stripe product is NOT in our valid list, archive it
            if (!validStripeIds.has(product.id)) {
                console.log(`   🗑️ Archiving: ${product.name} (${product.id})`);

                await stripe.products.update(product.id, { active: false });
                archivedCount++;
            }
        }

        if (stripeProducts.has_more) {
            startingAfter = stripeProducts.data[stripeProducts.data.length - 1].id;
        } else {
            hasMore = false;
        }
    }

    console.log('\n✨ Cleanup complete!');
    console.log(`   Scanned: ${scannedCount}`);
    console.log(`   Archived: ${archivedCount}`);
}

cleanupStripeProducts().catch(console.error);
