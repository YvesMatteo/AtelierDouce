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

    // Fetch all products from database that are active
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, description, price, stripe_product_id, stripe_price_id, is_active')
        .eq('is_active', true)
        .order('name');

    if (error || !products) {
        console.error('❌ Failed to fetch products:', error);
        return;
    }

    let fixedCount = 0;

    for (const product of products) {
        // Handle missing Stripe Product
        if (!product.stripe_product_id) {
            console.log(`🆕 ${product.name}: Creating new Stripe product...`);
            const stripeProduct = await stripe.products.create({
                name: product.name,
                description: product.description || undefined,
            });

            await supabase.from('products').update({ stripe_product_id: stripeProduct.id }).eq('id', product.id);
            product.stripe_product_id = stripeProduct.id;
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

            // Fix description mismatch (optional but good)
            if (product.description && stripeProduct.description !== product.description) {
                needsUpdate.description = product.description;
                console.log(`🔄 ${product.name}: Updating description...`);
            }

            if (Object.keys(needsUpdate).length > 0) {
                await stripe.products.update(product.stripe_product_id, needsUpdate);
                console.log(`   ✅ Fixed Product Metadata: ${product.name}`);
                fixedCount++;
            }

            // --- PRICE CHECK ---
            const targetAmount = Math.round(product.price * 100);
            let priceValid = false;
            let currentPriceId = product.stripe_price_id;

            if (currentPriceId) {
                try {
                    const stripePrice = await stripe.prices.retrieve(currentPriceId);
                    if (
                        stripePrice.active &&
                        stripePrice.currency === 'usd' &&
                        stripePrice.unit_amount === targetAmount
                    ) {
                        priceValid = true;
                    } else {
                        console.log(`   ⚠️ Price mismatch for ${product.name}. Expected: $${product.price} (usd), Found: ${stripePrice.unit_amount ? stripePrice.unit_amount / 100 : 'null'} (${stripePrice.currency}) [Active: ${stripePrice.active}]`);
                    }
                } catch (e) {
                    console.log(`   ⚠️ Could not retrieve price ${currentPriceId}, assuming invalid.`);
                }
            } else {
                console.log(`   ⚠️ No Stripe Price ID for ${product.name}`);
            }

            if (!priceValid) {
                console.log(`🔄 ${product.name}: Creating correct price of $${product.price}...`);
                const newPrice = await stripe.prices.create({
                    product: product.stripe_product_id,
                    unit_amount: targetAmount,
                    currency: 'usd',
                });

                await stripe.products.update(product.stripe_product_id, {
                    default_price: newPrice.id,
                });

                await supabase
                    .from('products')
                    .update({ stripe_price_id: newPrice.id })
                    .eq('id', product.id);

                console.log(`   ✅ New price created: ${newPrice.id}`);
                fixedCount++;
            }

        } catch (err: any) {
            console.error(`❌ Error processing ${product.name}: ${err.message}`);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✨ Fixed/Updated ${fixedCount} items (products or prices)`);
}

main().catch(console.error);
