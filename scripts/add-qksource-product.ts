/**
 * Add QKSource Slipper Product
 */

import 'dotenv/config';
import { getCJClient, CJVariant } from '../lib/cjdropshipping';
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

async function addProduct() {
    console.log('🚀 Starting single product sync...\n');
    const cj = getCJClient();

    const item = {
        id: '2511280758221607400',
        name: 'Cozy Anti-Slip Cotton Slippers',
        description: 'Warm, thick-soled, anti-slip cotton slippers perfect for indoor comfort. Features breathable and deodorant materials.'
    };

    try {
        console.log(`\n📌 Processing: ${item.name} (${item.id})`);

        // 1. Get Product Details & Variants
        const details = await cj.getProductDetails(item.id);
        if (!details) {
            console.error(`   ❌ Could not find product ${item.id}`);
            return;
        }

        let variants = details.variants || [];
        console.log(`   Found ${variants.length} raw variants`);

        // 3. Process Variants & Options
        const processedVariants = variants.map(v => ({
            id: v.vid,
            sku: v.variantSku,
            price: parseFloat(v.variantSellPrice.toString()),
            image: v.variantImage || details.productImage,
            options: parseVariantOptions(v)
        }));

        // Extract global options
        const optionsMap: Record<string, Set<string>> = {};
        processedVariants.forEach(v => {
            Object.entries(v.options).forEach(([key, val]) => {
                if (!optionsMap[key]) optionsMap[key] = new Set();
                optionsMap[key].add(val);
            });
        });

        const options = Object.entries(optionsMap).map(([name, values]) => ({
            name,
            values: Array.from(values).sort()
        }));

        // 4. Calculate Price
        const maxCost = Math.max(...processedVariants.map(v => v.price));
        const retailPrice = Math.max(19, Math.ceil(maxCost * 3)); // Minimum $19

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

            // Ensure images is an array of strings, properly falling back
            let mainImage = Array.isArray(details.productImage)
                ? details.productImage[0]
                : details.productImage;

            if (!isValidUrl(mainImage) && variants.length > 0) {
                mainImage = variants[0].variantImage;
            }

            const sProd = await stripe.products.create({
                name: item.name,
                description: item.description,
                images: isValidUrl(mainImage) ? [mainImage] : [],
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
        }

        // 6. Save to Supabase

        // Handle images array properly
        let productImages: string[] = [];
        if (Array.isArray(details.productImage)) {
            productImages = details.productImage;
        } else if (typeof details.productImage === 'string') {
            productImages = [details.productImage];
        }

        if (details.productImageSet && Array.isArray(details.productImageSet)) {
            productImages = [...productImages, ...details.productImageSet];
        }

        const { error } = await supabase
            .from('products')
            .upsert({
                cj_product_id: item.id,
                name: item.name,
                description: item.description,
                price: retailPrice,
                images: productImages.filter(img => isValidUrl(img)).slice(0, 5),
                cj_sku: details.productSku,
                stripe_product_id: stripeProductId,
                stripe_price_id: stripePriceId,
                options: options,
                variants: processedVariants,
                inventory: 100,
                is_active: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'cj_product_id' });

        if (error) throw error;
        console.log(`   ✅ Saved to Supabase: ${item.name}`);

    } catch (error: any) {
        console.error(`   ❌ Error processing ${item.name}:`, error.message);
    }

    console.log('\n✨ Sync complete!');
}

function parseVariantOptions(variant: CJVariant): Record<string, string> {
    const opts: Record<string, string> = {};

    // Strategy 1: Parse variantKey "Color-Size"
    if (variant.variantKey) {
        const parts = variant.variantKey.split('-');
        parts.forEach(part => {
            if (part.toLowerCase().includes('size') || /^\d+$/.test(part) || /^\d+\/\d+$/.test(part)) {
                // Classic shoe size patterns: "Size40", "40", "36/37"
                let val = part.replace(/size/i, '').trim();
                val = val.replace(/^[:]/, '');
                opts['Size'] = val;
            } else {
                if (!opts['Color']) {
                    opts['Color'] = part.trim();
                }
            }
        });
        if (Object.keys(opts).length > 0) return opts;
    }

    // Fallback
    if (variant.variantKey) {
        opts['Style'] = variant.variantKey;
    }
    return opts;
}

function isValidUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

addProduct().catch(console.error);
