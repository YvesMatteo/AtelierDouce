
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

// Mapping: index (1-22) → { name, price, category }
// Based on Produkt Liste.csv
// Items 7, 10, 17 are empty in CSV and will be skipped
const productUpdates: Record<number, { name: string; price: number; category: string }> = {
    1: { name: 'Luxe Long Down Coat', price: 129, category: 'Tops & Bottoms' },
    2: { name: 'Soft Fit Knit Coat', price: 49, category: 'Tops & Bottoms' },
    3: { name: 'Soft Cashmere Touch Scarf', price: 24, category: 'Accessories' },
    4: { name: 'Timeless Camel Wool Coat', price: 29, category: 'Tops & Bottoms' },
    5: { name: 'Classic Soft Hobo Bag', price: 39, category: 'Bags' },
    6: { name: 'Paris Short Elegant Coat', price: 39, category: 'Tops & Bottoms' },
    // 7: Empty in CSV - skip
    8: { name: 'Pearl Minimal Necklace', price: 14, category: 'Jewelry' },
    9: { name: 'Clean White Mini Bag', price: 29, category: 'Bags' },
    // 10: Empty in CSV - skip
    11: { name: 'Oversized Puffer Down Jacket', price: 149, category: 'Tops & Bottoms' },
    12: { name: 'Vintage Metal Hoop Earrings', price: 9, category: 'Jewelry' },
    13: { name: 'Fur Hood Winter Jacket', price: 79, category: 'Tops & Bottoms' },
    14: { name: 'Elegant Slouch Heel Boots', price: 49, category: 'Shoes' },
    15: { name: 'Lightweight Puffer Jacket', price: 69, category: 'Tops & Bottoms' },
    16: { name: 'Cozy Handle Mini Bag', price: 29, category: 'Bags' },
    // 17: Empty in CSV - skip
    18: { name: 'Urban Winter Sneakers', price: 29, category: 'Shoes' },
    19: { name: 'Soft Suede Ankle Boots', price: 49, category: 'Shoes' },
    20: { name: 'Plush Winter Boots', price: 29, category: 'Shoes' },
    21: { name: 'Star Charm Necklace', price: 19, category: 'Jewelry' },
    22: { name: 'Pink Cloud Puffer Jacket', price: 79, category: 'Tops & Bottoms' },
};

async function main() {
    console.log('🚀 Starting product details update...\n');

    // Fetch all products in the same order as the pricing report
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, price, category, stripe_product_id, stripe_price_id');

    if (error || !products) {
        console.error('❌ Failed to fetch products:', error?.message);
        return;
    }

    console.log(`📦 Found ${products.length} products in database.\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < products.length; i++) {
        const index = i + 1; // 1-indexed
        const product = products[i];
        const update = productUpdates[index];

        if (!update) {
            console.log(`⏭️  [${index}] "${product.name}" - Skipped (no mapping in CSV)`);
            skippedCount++;
            continue;
        }

        console.log(`\n🔄 [${index}] Updating "${product.name}":`);
        console.log(`   Name: "${product.name}" → "${update.name}"`);
        console.log(`   Price: €${product.price} → €${update.price}`);
        console.log(`   Category: "${product.category || 'NULL'}" → "${update.category}"`);

        // 1. Update Supabase
        const { error: updateError } = await supabase
            .from('products')
            .update({
                name: update.name,
                price: update.price,
                category: update.category,
            })
            .eq('id', product.id);

        if (updateError) {
            console.error(`   ❌ Supabase update failed: ${updateError.message}`);
            continue;
        }
        console.log(`   ✅ Supabase updated`);

        // 2. Update Stripe Product Name
        if (product.stripe_product_id) {
            try {
                await stripe.products.update(product.stripe_product_id, {
                    name: update.name,
                });
                console.log(`   ✅ Stripe product name updated`);
            } catch (stripeErr: any) {
                console.error(`   ⚠️ Stripe product update failed: ${stripeErr.message}`);
            }
        }

        // 3. Update Stripe Price (need to create new price and update product default)
        if (product.stripe_product_id && product.price !== update.price) {
            try {
                // Create new price
                const newPrice = await stripe.prices.create({
                    product: product.stripe_product_id,
                    unit_amount: Math.round(update.price * 100), // Convert to cents
                    currency: 'eur',
                });

                // Update product default price
                await stripe.products.update(product.stripe_product_id, {
                    default_price: newPrice.id,
                });

                // Archive old price if exists
                if (product.stripe_price_id) {
                    await stripe.prices.update(product.stripe_price_id, {
                        active: false,
                    });
                }

                // Update Supabase with new stripe_price_id
                await supabase
                    .from('products')
                    .update({ stripe_price_id: newPrice.id })
                    .eq('id', product.id);

                console.log(`   ✅ Stripe price updated (new price ID: ${newPrice.id})`);
            } catch (priceErr: any) {
                console.error(`   ⚠️ Stripe price update failed: ${priceErr.message}`);
            }
        }

        updatedCount++;
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✨ Update complete!`);
    console.log(`   Updated: ${updatedCount} products`);
    console.log(`   Skipped: ${skippedCount} products`);
}

main().catch(console.error);
