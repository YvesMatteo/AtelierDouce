import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function archiveOldPrices() {
    console.log('🗑️ Archiving old Stripe prices...\n');

    // 1. Get all active products and their CURRENT valid price ID from Supabase
    const { data: products, error } = await supabase
        .from('products')
        .select('name, stripe_product_id, stripe_price_id')
        .eq('is_active', true)
        .not('stripe_product_id', 'is', null)
        .not('stripe_price_id', 'is', null);

    if (error || !products) {
        console.error('❌ Failed to fetch products:', error);
        return;
    }

    let archivedCount = 0;

    for (const product of products) {
        if (!product.stripe_product_id || !product.stripe_price_id) continue;

        try {
            // 2. List all prices for this product on Stripe
            const prices = await stripe.prices.list({
                product: product.stripe_product_id,
                active: true, // Only look at currently active prices
                limit: 100,
            });

            for (const price of prices.data) {
                // 3. Keep the current active price, archive the rest
                if (price.id !== product.stripe_price_id) {
                    console.log(`   🔻 Archiving old price for ${product.name}: ${price.unit_amount ? price.unit_amount / 100 : 'null'} ${price.currency.toUpperCase()} (${price.id})`);

                    await stripe.prices.update(price.id, { active: false });
                    archivedCount++;
                }
            }

        } catch (err: any) {
            console.error(`❌ Error processing ${product.name}: ${err.message}`);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✨ Archived ${archivedCount} old prices.`);
}

archiveOldPrices().catch(console.error);
