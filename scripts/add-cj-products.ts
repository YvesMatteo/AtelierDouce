/**
 * Add Specific CJ Products Script
 * 
 * Usage: npx tsx scripts/add-cj-products.ts
 */

import 'dotenv/config';
import { getCJClient, CJVariant } from '../lib/cjdropshipping';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { cleanProductDescription } from './utils';

const PRODUCTS_TO_ADD = [
    {
        id: '1839114473198997504', // Boots
        type: 'boots',
        name: 'Winter Snow Boots with Bowknot',
        limitVariants: false
    },
    {
        id: '2510140745261632700', // Coat
        type: 'coat',
        name: 'Women\'s Autumn and Winter Casual Coat',
        limitVariants: false
    },
    {
        id: '2412070355501627400', // Scarf
        type: 'scarf',
        name: 'Solid Color Winter Tassel Scarf',
        limitVariants: true // Limit to 5
    }
];

// Initialize clients
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function addProducts() {
    console.log('🚀 Starting product sync...\n');
    const cj = getCJClient();

    for (const item of PRODUCTS_TO_ADD) {
        try {
            console.log(`\n📌 Processing: ${item.name} (${item.id})`);

            // 1. Get Product Details & Variants
            const details = await cj.getProductDetails(item.id);
            if (!details) {
                console.error(`   ❌ Could not find product ${item.id}`);
                continue;
            }

            // Use variants from details if available
            let variants = details.variants || [];
            if (variants.length === 0) {
                try {
                    variants = await cj.getProductVariants(item.id);
                } catch (e) {
                    console.log('   ⚠️ Could not fetch variants independenty');
                }
            }
            console.log(`   Found ${variants.length} raw variants`);

            if (variants.length === 0) {
                console.error('   ❌ No variants found, skipping');
                continue;
            }

            // 2. Filter Variants (for Scarf)
            if (item.limitVariants) {
                // Determine unique colors and pick top 5
                const colors = new Set<string>();
                const filteredVariants: CJVariant[] = [];

                for (const v of variants) {
                    const opts = parseVariantOptions(v);
                    const color = opts['Color'] || opts['Style'] || 'Default';

                    if (!colors.has(color) && colors.size < 5) {
                        colors.add(color);
                        filteredVariants.push(v);
                    } else if (colors.has(color)) {
                        // Keep variants of known top 5 colors
                        filteredVariants.push(v);
                    }
                }

                // If we grabbed variants for 5 colors, use them.
                if (filteredVariants.length > 0) {
                    variants = filteredVariants;
                } else {
                    // Fallback if parsing failed
                    variants = variants.slice(0, 5);
                }
                console.log(`   Filtered to ${variants.length} variants (Top 5 Colors)`);
            }

            // 3. Process Variants & Options
            const processedVariants = variants.map(v => ({
                id: v.vid,
                sku: v.variantSku,
                price: parseFloat(v.variantSellPrice.toString()),
                image: v.variantImage || details.productImage,
                options: parseVariantOptions(v)
            }));

            // Extract global options (e.g. Size: [S, M], Color: [Red, Blue])
            const optionsMap: Record<string, Set<string>> = {};
            processedVariants.forEach(v => {
                Object.entries(v.options).forEach(([key, val]) => {
                    if (!optionsMap[key]) optionsMap[key] = new Set();
                    optionsMap[key].add(val);
                });
            });

            const options = Object.entries(optionsMap).map(([name, values]) => ({
                name,
                values: Array.from(values).sort() // Sort values consistently
            }));

            // 4. Calculate Price
            // Base price on max variant price * 3 (standard markup)
            const maxCost = Math.max(...processedVariants.map(v => v.price));
            const retailPrice = Math.max(15, Math.ceil(maxCost * 3)); // Minimum $15, round up to integer

            // 5. Create/Get Stripe Product
            let stripeProductId: string | undefined;
            let stripePriceId: string | undefined;

            // Check DB first
            const { data: existingProduct } = await supabase
                .from('products')
                .select('stripe_product_id, stripe_price_id')
                .eq('cj_product_id', item.id)
                .single();

            if (existingProduct?.stripe_product_id) {
                console.log('   ✅ Stripe product already exists');
                stripeProductId = existingProduct.stripe_product_id;
                stripePriceId = existingProduct.stripe_price_id;
            } else {
                console.log('   💳 Creating Stripe product...');
                try {
                    const cleanDesc = cleanProductDescription(details.description);
                    const productDesc = cleanDesc.length > 20 ? cleanDesc : `Premium ${item.name}. Quality materials and stylish design.`;

                    const sProd = await stripe.products.create({
                        name: item.name,
                        description: productDesc,
                        images: [details.productImage].filter(img => isValidUrl(img)),
                        metadata: { cj_product_id: item.id }
                    });
                    stripeProductId = sProd.id;

                    const sPrice = await stripe.prices.create({
                        product: stripeProductId,
                        unit_amount: Math.round(retailPrice * 100),
                        currency: 'usd',
                    });
                    stripePriceId = sPrice.id;
                    console.log(`   💵 Stripe Price Created: $${retailPrice} (${stripePriceId})`);
                } catch (stripeError: any) {
                    console.error('   ❌ Stripe Error:', stripeError.message);
                    // Continue to save to DB even if Stripe fails? Better to skip or ensure consistency.
                    // For now, let's proceed but logged.
                }
            }

            // 6. Save to Supabase
            // Note: If 'variants' column doesn't exist, this will throw.
            const { error } = await supabase
                .from('products')
                .upsert({
                    cj_product_id: item.id,
                    name: item.name,
                    description: cleanProductDescription(details.description) || item.name,
                    price: retailPrice,
                    images: [details.productImage, ...(details.productImageSet || [])].filter(img => isValidUrl(img)).slice(0, 5),
                    cj_sku: details.productSku,
                    stripe_product_id: stripeProductId,
                    stripe_price_id: stripePriceId,
                    options: options,
                    variants: processedVariants,
                    inventory: 100,
                    is_active: true,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'cj_product_id' });

            if (error) {
                if (error.message.includes('column "variants" of relation "products" does not exist')) {
                    console.error('   ❌ CRITICAL: Migration missing. Please run scripts/migration.sql in Supabase.');
                    return; // Stop processing as this is critical
                }
                throw error;
            }
            console.log(`   ✅ Saved to Supabase: ${item.name}`);

        } catch (error: any) {
            console.error(`   ❌ Error processing ${item.name}:`, error.message);
        }
    }
    console.log('\n✨ Sync complete!');
}

function parseVariantOptions(variant: CJVariant): Record<string, string> {
    const opts: Record<string, string> = {};

    // Strategy 1: Parse variantKey "Color-Size" or "Value-Value"
    // Example: "Beige-Size40"
    if (variant.variantKey) {
        const parts = variant.variantKey.split('-');
        // Heuristic: If part contains "Size", it's size.
        // If it doesn't, it might be Color.

        parts.forEach(part => {
            if (part.toLowerCase().includes('size')) {
                // "Size40" -> Size: 40
                // Or "Size:40"
                const val = part.replace(/size/i, '').trim();
                // If val starts with :, remove it
                opts['Size'] = val.replace(/^[:]/, '');
            } else {
                // Assume Color? But what if it's "EU40"?
                // Usually the first part is Color/Style if not specified.
                // If we haven't assigned Color yet, assign it.
                if (!opts['Color']) {
                    opts['Color'] = part.trim();
                } else {
                    // Already have color, maybe it's another attribute?
                    // Just ignore for now or append?
                }
            }
        });

        // If we found options, return them
        if (Object.keys(opts).length > 0) return opts;
    }

    // Strategy 2: Parse variantStandard "Color:Red,Size:M"
    if (variant.variantStandard && variant.variantStandard.includes(':')) {
        const parts = variant.variantStandard.split(/[;,]/);
        parts.forEach(p => {
            const [key, val] = p.split(':');
            if (key && val && !key.includes('=')) { // Ignore "long=300"
                opts[key.trim()] = val.trim();
            }
        });
        if (Object.keys(opts).length > 0) return opts;
    }

    // Fallback: Use variantKey as "Style" if nothing else
    if (variant.variantKey) {
        opts['Style'] = variant.variantKey;
    }

    return opts;
}

function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

addProducts().catch(console.error);
