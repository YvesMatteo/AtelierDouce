/**
 * Bulk Import Script
 * Syncs multiple products from CJ Dropshipping with categories
 */

import 'dotenv/config';
import { getCJClient, CJVariant } from '../lib/cjdropshipping';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { cleanProductDescription } from './utils';

// Initialize clients
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

const PRODUCTS_TO_ADD = [
    { id: '1626869424990990336', name: 'High Grade Short Autumn Coat', category: 'Clothing', gender: 'Woman' },
    { id: '1381486068892831744', name: 'Minimalist Hoop Circle Earrings', category: 'Jewelry', gender: 'Woman' },
    { id: '1578244934304542720', name: 'Simple Pearl Single Layer Necklace', category: 'Jewelry', gender: 'Woman' },
    { id: '516732AB-1D5F-49F7-BE3F-17BD08B6945A', name: 'Star and Diamond Tag Bracelet', category: 'Jewelry', gender: 'Woman' },
    { id: '1550458464835743744', name: 'Warm Casual Knitted Octagonal Hat', category: 'Accessories', gender: 'Woman' },
    { id: '1749986964654272512', name: 'Thickened Warm Wool Socks', category: 'Accessories', gender: 'Woman' },
    { id: '7FE80359-83EB-412E-BB50-F8C4DB86E1AA', name: 'Warm Hooded Jacket', category: 'Clothing', gender: 'Woman' },
    { id: '2411190554561614400', name: 'Casual Hooded Cotton Puffer Jacket', category: 'Clothing', gender: 'Woman' },
    { id: '2512020833381633000', name: 'Thick Puffer Warm Cotton Coat', category: 'Clothing', gender: 'Woman' },
    { id: '2508241410251629900', name: 'Gray Woolen Padded Shoulder Jacket', category: 'Clothing', gender: 'Woman' },
    { id: '1746094682741936128', name: 'Niche Plaid Cloud Bag', category: 'Bags', gender: 'Woman' },
    { id: '1672132490384904192', name: 'Simple Pocket Coin Purse', category: 'Bags', gender: 'Woman' },
    { id: '1405411242029486080', name: 'Casual Shoulder Tote Bag', category: 'Bags', gender: 'Woman' },
    { id: '1544965318324531200', name: 'Lapel Single Breasted Knit Cardigan', category: 'Clothing', gender: 'Woman' },
];

async function addProducts() {
    console.log(`🚀 Starting bulk sync for ${PRODUCTS_TO_ADD.length} products...\n`);
    const cj = getCJClient();

    for (const [index, item] of PRODUCTS_TO_ADD.entries()) {
        try {
            console.log(`\n📌 [${index + 1}/${PRODUCTS_TO_ADD.length}] Processing: ${item.name} (${item.id})`);

            // Rate limit delay (1.5s)
            if (index > 0) await new Promise(r => setTimeout(r, 1500));

            // 1. Get Product Details
            let details = null;
            try {
                details = await cj.getProductDetails(item.id);
            } catch (e: any) {
                console.error(`   ⚠️ API Error fetching details: ${e.message}`);
                continue;
            }

            if (!details) {
                console.error(`   ❌ Could not find product details`);
                continue;
            }

            // Get variants (use details.variants if available, or fetch)
            let variants = details.variants || [];
            if (variants.length === 0) {
                try {
                    // Wait a bit before secondary call
                    await new Promise(r => setTimeout(r, 1000));
                    variants = await cj.getProductVariants(item.id);
                } catch (e) {
                    console.log('   ⚠️ Could not fetch variants independently');
                }
            }
            console.log(`   Found ${variants.length} raw variants`);

            if (variants.length === 0) {
                // If it's a jewelry/single item, maybe no variants? or API issue.
                // We'll proceed if we have main data, but warn.
                console.warn('   ⚠️ No variants found. Creating a default single variant.');
                variants = [{
                    vid: item.id,
                    variantSku: details.productSku,
                    variantSellPrice: details.sellPrice,
                    variantImage: typeof details.productImage === 'string' ? details.productImage : (details.productImage[0] || ''),
                    variantStandard: '',
                    variantKey: 'Default'
                } as any];
            }

            // 2. Process Variants
            const processedVariants = variants.map(v => ({
                id: v.vid,
                sku: v.variantSku,
                price: parseFloat(v.variantSellPrice?.toString() || details.sellPrice?.toString() || '0'),
                image: v.variantImage || (Array.isArray(details.productImage) ? details.productImage[0] : details.productImage),
                options: parseVariantOptions(v)
            }));

            // Extract Options
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

            // 3. Price Calculation
            const maxCost = Math.max(...processedVariants.map(v => v.price));
            // Jewelry might be cheap, ensure min price logic makes sense.
            // e.g. Min $19 for clothes, maybe less for small accessories?
            // Let's stick to a robust markup.
            let retailPrice = Math.max(19, Math.ceil(maxCost * 3));

            // Adjust min price based on category?
            if (item.category === 'Accessories' || item.category === 'Jewelry') {
                retailPrice = Math.max(15, Math.ceil(maxCost * 3));
            }

            // 4. Stripe Integration
            let stripeProductId: string | undefined;
            let stripePriceId: string | undefined;

            const { data: existingProduct } = await supabase
                .from('products')
                .select('stripe_product_id, stripe_price_id')
                .eq('cj_product_id', item.id)
                .single();

            if (existingProduct?.stripe_product_id) {
                console.log('   ✅ Stripe product already exists');
                stripeProductId = existingProduct.stripe_product_id;
                stripePriceId = existingProduct.stripe_price_id;
                // Update stripe metadata?
                if (stripeProductId && existingProduct) {
                    await stripe.products.update(stripeProductId, {
                        metadata: { cj_product_id: item.id, category: item.category, gender: item.gender }
                    });
                    console.log('   ✅ Stripe metadata updated');
                }

            } else {
                console.log('   💳 Creating Stripe product...');
                const mainImg = isValidUrl(processedVariants[0]?.image) ? processedVariants[0].image : (Array.isArray(details.productImage) ? details.productImage[0] : details.productImage);

                try {
                    const cleanDesc = cleanProductDescription(details.description);
                    const productDesc = cleanDesc.length > 20 ? cleanDesc : `Premium ${item.name}. Quality materials and stylish design.`;

                    const sProd = await stripe.products.create({
                        name: item.name,
                        description: productDesc,
                        images: isValidUrl(mainImg) ? [mainImg] : [],
                        metadata: { cj_product_id: item.id, category: item.category, gender: item.gender }
                    });
                    stripeProductId = sProd.id;

                    const sPrice = await stripe.prices.create({
                        product: stripeProductId,
                        unit_amount: Math.round(retailPrice * 100),
                        currency: 'usd',
                    });
                    stripePriceId = sPrice.id;
                    console.log(`   💵 Stripe Price: $${retailPrice}`);
                } catch (stripeErr: any) {
                    console.error('   ❌ Stripe Error:', stripeErr.message);
                }
            }

            // 5. Supabase Upsert
            let imgs: string[] = [];
            if (Array.isArray(details.productImage)) imgs = details.productImage;
            else if (typeof details.productImage === 'string') imgs = [details.productImage];
            if (details.productImageSet) imgs = [...imgs, ...details.productImageSet];

            // Ensure unique and valid
            imgs = Array.from(new Set(imgs)).filter(url => isValidUrl(url)).slice(0, 5);

            const { error } = await supabase
                .from('products')
                .upsert({
                    cj_product_id: item.id,
                    name: item.name,
                    description: cleanProductDescription(details.description) || item.name,
                    price: retailPrice,
                    images: imgs,
                    cj_sku: details.productSku,
                    stripe_product_id: stripeProductId,
                    stripe_price_id: stripePriceId,
                    options: options,
                    variants: processedVariants,
                    inventory: 100,
                    is_active: true,
                    category: item.category,
                    gender: item.gender, // NEW COLUMN
                    updated_at: new Date().toISOString()
                }, { onConflict: 'cj_product_id' });

            if (error) throw error;
            console.log(`   ✅ Synced to DB with Category: ${item.category}, Gender: ${item.gender}`);


        } catch (error: any) {
            console.error(`   ❌ General Error: ${error.message}`);
        }
    }
    console.log('\n✨ Bulk sync complete!');
}

function parseVariantOptions(variant: CJVariant): Record<string, string> {
    const opts: Record<string, string> = {};
    if (variant.variantKey) {
        const parts = variant.variantKey.split('-');
        parts.forEach(part => {
            if (part.toLowerCase().includes('size') || /^[XSMLXLXXL]+$/.test(part) || /^\d+$/.test(part)) {
                let val = part.replace(/size/i, '').trim();
                val = val.replace(/^[:]/, '');
                opts['Size'] = val;
            } else {
                if (!opts['Color']) opts['Color'] = part.trim();
            }
        });
        if (Object.keys(opts).length > 0) return opts;
    }
    // Fallback
    if (variant.variantKey) opts['Style'] = variant.variantKey;
    return opts;
}

function isValidUrl(url: string | undefined): boolean {
    if (!url || typeof url !== 'string') return false;
    try { new URL(url); return true; } catch { return false; }
}



addProducts().catch(console.error);
