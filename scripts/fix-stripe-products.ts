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

async function main() {
    console.log('🔧 Fixing Stripe Product Issues...\n');

    // Fetch all products from database
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, price, stripe_product_id, stripe_price_id')
        .order('name');

    if (error || !products) {
        console.error('❌ Failed to fetch products:', error);
        return;
    }

    let fixedCount = 0;

    for (const product of products) {
        if (!product.stripe_product_id) {
            console.log(`⏭️ ${product.name}: No Stripe product ID - skipping`);
            continue;
        }

        try {
            const stripeProduct = await stripe.products.retrieve(product.stripe_product_id);

            const needsUpdate: any = {};

            // Fix inactive product
            if (!stripeProduct.active) {
                needsUpdate.active = true;
                console.log(`🔄 ${product.name}: Reactivating product...`);
            }

            // Fix name mismatch
            if (stripeProduct.name !== product.name) {
                needsUpdate.name = product.name;
                console.log(`🔄 ${product.name}: Updating Stripe name from "${stripeProduct.name}"...`);
            }

            if (Object.keys(needsUpdate).length > 0) {
                await stripe.products.update(product.stripe_product_id, needsUpdate);
                console.log(`   ✅ Fixed: ${product.name}`);
                fixedCount++;
            }

            // Check if price is inactive and create new one if needed
            if (product.stripe_price_id) {
                const stripePrice = await stripe.prices.retrieve(product.stripe_price_id);
                if (!stripePrice.active) {
                    console.log(`🔄 ${product.name}: Creating new active price...`);

                    const newPrice = await stripe.prices.create({
                        product: product.stripe_product_id,
                        unit_amount: Math.round(product.price * 100),
                        currency: 'eur',
                    });

                    await stripe.products.update(product.stripe_product_id, {
                        default_price: newPrice.id,
                    });

                    await supabase
                        .from('products')
                        .update({ stripe_price_id: newPrice.id })
                        .eq('id', product.id);

                    console.log(`   ✅ New price created: ${newPrice.id}`);
                }
            }

        } catch (err: any) {
            console.error(`❌ Error processing ${product.name}: ${err.message}`);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✨ Fixed ${fixedCount} products`);
}

main().catch(console.error);
