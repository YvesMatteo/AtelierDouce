/**
 * Product Sync Script
 * Syncs products from CJDropshipping to Supabase and creates Stripe products
 * 
 * Usage: npx tsx scripts/sync-products.ts
 */

import 'dotenv/config';
import { getCJClient } from '../lib/cjdropshipping';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize clients
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

interface ProductToSync {
    cjProductId: string;
    name: string;
    description: string;
    price: number; // in USD
    images: string[];
    cjSku: string;
    options: { name: string; values: string[] }[];
}

async function syncProducts() {
    console.log('🚀 Starting product sync...\n');

    const cj = getCJClient();

    // Search for boots/footwear products
    console.log('📦 Fetching products from CJDropshipping...');
    const searchResult = await cj.searchProducts({
        keyWord: 'winter boots women',
        page: 1,
        size: 10,
    });

    const cjProducts = searchResult.content.flatMap(c => c.productList || []);
    console.log(`   Found ${cjProducts.length} products\n`);

    for (const cjProduct of cjProducts.slice(0, 5)) { // Limit to 5 for now
        try {
            console.log(`\n📌 Processing: ${cjProduct.nameEn}`);

            // Get detailed product info
            let variants: any[] = [];
            try {
                variants = await cj.getProductVariants(cjProduct.id);
            } catch (e) {
                console.log('   ⚠️ Could not fetch variants, using defaults');
            }

            // Parse price (CJ returns range like "6.60 -- 6.77")
            const priceStr = cjProduct.sellPrice.split('--')[0].trim();
            const cjPrice = parseFloat(priceStr) || 15;

            // Apply markup (3x for profit)
            const retailPrice = Math.round(cjPrice * 3 * 100) / 100;

            // Prepare product data
            const productData: ProductToSync = {
                cjProductId: cjProduct.id,
                name: formatProductName(cjProduct.nameEn),
                description: `Premium quality ${cjProduct.nameEn.toLowerCase()}. Warm and stylish for the winter season.`,
                price: retailPrice,
                images: [cjProduct.bigImage],
                cjSku: cjProduct.sku,
                options: [
                    { name: 'Size', values: ['US 6', 'US 7', 'US 8', 'US 9', 'US 10'] },
                ],
            };

            // Check if product already exists in Supabase
            const { data: existingProduct } = await supabase
                .from('products')
                .select('id, stripe_product_id, stripe_price_id')
                .eq('cj_product_id', cjProduct.id)
                .single();

            let stripeProductId: string;
            let stripePriceId: string;

            if (existingProduct?.stripe_product_id) {
                console.log('   ✅ Already exists in Supabase, updating...');
                stripeProductId = existingProduct.stripe_product_id;
                stripePriceId = existingProduct.stripe_price_id;
            } else {
                // Create Stripe product
                console.log('   💳 Creating Stripe product...');
                const stripeProduct = await stripe.products.create({
                    name: productData.name,
                    description: productData.description,
                    images: productData.images,
                    metadata: {
                        cj_product_id: cjProduct.id,
                        cj_sku: cjProduct.sku,
                    },
                });
                stripeProductId = stripeProduct.id;

                // Create Stripe price
                const stripePrice = await stripe.prices.create({
                    product: stripeProductId,
                    unit_amount: Math.round(productData.price * 100), // in cents
                    currency: 'usd',
                });
                stripePriceId = stripePrice.id;
                console.log(`   💵 Stripe price: $${productData.price} (${stripePriceId})`);
            }

            // Upsert to Supabase
            const { error: upsertError } = await supabase
                .from('products')
                .upsert({
                    cj_product_id: cjProduct.id,
                    name: productData.name,
                    description: productData.description,
                    price: productData.price,
                    images: productData.images,
                    cj_sku: cjProduct.sku,
                    stripe_product_id: stripeProductId,
                    stripe_price_id: stripePriceId,
                    options: productData.options,
                    inventory: cjProduct.warehouseInventoryNum || 100,
                    is_active: true,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'cj_product_id',
                });

            if (upsertError) {
                console.error('   ❌ Supabase error:', upsertError.message);
            } else {
                console.log('   ✅ Synced to Supabase');
            }

        } catch (error: any) {
            console.error(`   ❌ Error: ${error.message}`);
        }
    }

    console.log('\n✨ Sync complete!');
}

function formatProductName(name: string): string {
    // Clean up CJ product names
    return name
        .replace(/\s+/g, ' ')
        .split(' ')
        .slice(0, 6) // Limit to first 6 words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// Run the sync
syncProducts().catch(console.error);
