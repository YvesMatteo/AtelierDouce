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

// Fixes based on image inspection:
// ProductID -> { correct name, price, category }
const productFixes: Record<string, { name: string; price: number; category: string }> = {
    // "Soft Cashmere Touch Scarf" (shows coat) -> "Soft Fit Knit Coat"
    'a4ff2c89-d821-434f-8578-817075daccf8': { name: 'Soft Fit Knit Coat', price: 49, category: 'Tops & Bottoms' },

    // "Pearl Minimal Necklace" (shows white bag) -> "Clean White Mini Bag"
    '3d14c42c-ac8e-459f-89d3-caa11e50f76f': { name: 'Clean White Mini Bag', price: 29, category: 'Bags' },

    // "Vintage Metal Hoop Earrings" (shows slouchy boots) -> "Elegant Slouch Heel Boots"
    'a6af7fe9-3f00-4dd4-94d0-68852f46f7ae': { name: 'Elegant Slouch Heel Boots', price: 49, category: 'Shoes' },

    // "Lightweight Puffer Jacket" (shows plush slippers) -> "Plush Winter Boots"
    'df0e4c82-0bc5-449a-9408-9f6ef091613e': { name: 'Plush Winter Boots', price: 29, category: 'Shoes' },

    // "Oversized Puffer Down Jacket" (shows hoop earrings) -> "Vintage Metal Hoop Earrings"
    'a6d7d176-ea9e-4070-b0d1-11cc05ef283d': { name: 'Vintage Metal Hoop Earrings', price: 9, category: 'Jewelry' },

    // "Cozy Handle Mini Bag" (shows ankle boots) -> "Soft Suede Ankle Boots"
    '43972b9d-a19f-468c-955b-85ef0b7c568c': { name: 'Soft Suede Ankle Boots', price: 49, category: 'Shoes' },

    // "Plush Winter Boots" (shows pink puffer jacket) -> "Pink Cloud Puffer Jacket"
    '9dae65a1-e8c2-454d-b9a7-6032bf7936ee': { name: 'Pink Cloud Puffer Jacket', price: 79, category: 'Tops & Bottoms' },

    // "Soft Suede Ankle Boots" (shows gold necklace) -> "Star Charm Necklace"
    '45d45b35-4747-4584-8f5b-9b576e8e3d6f': { name: 'Star Charm Necklace', price: 19, category: 'Jewelry' },
};

async function main() {
    console.log('🔧 Fixing mismatched product names...\n');

    let fixedCount = 0;

    for (const [productId, fix] of Object.entries(productFixes)) {
        // Get current product info
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('name, price, category, stripe_product_id, stripe_price_id')
            .eq('id', productId)
            .single();

        if (fetchError || !product) {
            console.error(`❌ Could not find product ${productId}`);
            continue;
        }

        console.log(`\n🔄 Fixing: "${product.name}" → "${fix.name}"`);
        console.log(`   Price: €${product.price} → €${fix.price}`);
        console.log(`   Category: ${product.category} → ${fix.category}`);

        // 1. Update Supabase
        const { error: updateError } = await supabase
            .from('products')
            .update({
                name: fix.name,
                price: fix.price,
                category: fix.category,
            })
            .eq('id', productId);

        if (updateError) {
            console.error(`   ❌ Supabase update failed: ${updateError.message}`);
            continue;
        }
        console.log(`   ✅ Supabase updated`);

        // 2. Update Stripe product name
        if (product.stripe_product_id) {
            try {
                await stripe.products.update(product.stripe_product_id, {
                    name: fix.name,
                });
                console.log(`   ✅ Stripe product name updated`);
            } catch (err: any) {
                console.error(`   ⚠️ Stripe product update failed: ${err.message}`);
            }
        }

        // 3. Update Stripe price if changed
        if (product.stripe_product_id && product.price !== fix.price) {
            try {
                const newPrice = await stripe.prices.create({
                    product: product.stripe_product_id,
                    unit_amount: Math.round(fix.price * 100),
                    currency: 'eur',
                });

                await stripe.products.update(product.stripe_product_id, {
                    default_price: newPrice.id,
                });

                if (product.stripe_price_id) {
                    await stripe.prices.update(product.stripe_price_id, {
                        active: false,
                    });
                }

                await supabase
                    .from('products')
                    .update({ stripe_price_id: newPrice.id })
                    .eq('id', productId);

                console.log(`   ✅ Stripe price updated`);
            } catch (err: any) {
                console.error(`   ⚠️ Stripe price update failed: ${err.message}`);
            }
        }

        fixedCount++;
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✨ Fixed ${fixedCount}/${Object.keys(productFixes).length} products`);
}

main().catch(console.error);
