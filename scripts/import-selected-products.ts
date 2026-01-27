
import 'dotenv/config';
import { getCJClient } from '../lib/cjdropshipping';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// ==========================================
// 1. CONFIGURATION
// ==========================================

const TARGET_PRODUCT_IDS = [
    '2511300843381609000', // 1. Detachable Hooded Zip-up Cotton Coat
    '2000862978889248769', // 2. Down Jacket AG1-1105
    '2511050858251614900', // 3. Autumn Western Pleated Short Boots
    '2511150813301617800', // 4. Fleece-lined Warm Ankle Boots
    '2512050318251608500', // 5. Womens Short-tube Snow Boots
    '2601140940251636900', // 6. Suede Stiletto Pointed Boots
    '1735282529143365632', // 7. Chessboard Plaid Knitted Hat
    '2511010923041613300', // 8. Casual Cotton Slippers
    '1760130972168761344', // 9. Fashion Plaid Scarf
    '2501070601131628700', // 10. Winter Coat Warm Lapel Faux Fur
    '2512110858151626600', // 11. Large-sized Cotton Slippers
    '2512240513531625200', // 12. Fashionable Platform Snow Boots
];

// ==========================================
// 2. IMPORT LOGIC
// ==========================================

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function main() {
    console.log('🚀 Starting automated product import...\n');
    const cj = getCJClient();

    console.log(`📋 Found ${TARGET_PRODUCT_IDS.length} products to import.`);

    for (const cjProductId of TARGET_PRODUCT_IDS) {
        try {
            console.log(`\n📌 Processing CJ ID: ${cjProductId}`);

            // 1. Fetch Product Details
            const details = await cj.getProductDetails(cjProductId);
            if (!details) {
                console.error(`   ❌ Could not find product details for ${cjProductId}`);
                continue;
            }

            // 2. Process Variants & Images
            const imagesSet = new Set<string>();
            if (details.productImage) imagesSet.add(details.productImage);
            if (details.productImageSet) details.productImageSet.forEach(img => imagesSet.add(img));

            const variantValues: Record<string, Set<string>> = {
                'Color': new Set(),
                'Size': new Set(),
                'Style': new Set()
            };

            details.variants?.forEach((v: any) => {
                if (v.variantImage) imagesSet.add(v.variantImage);

                // Parse options from variantKey (e.g. "Beige-XS" or "Red-40")
                if (v.variantKey) {
                    const parts = v.variantKey.split('-');

                    if (parts.length === 2) {
                        // Guessing Strategy: Check if one part looks like a Size
                        const p1 = parts[0].trim();
                        const p2 = parts[1].trim();

                        const isSize = (str: string) => /^(XS|S|M|L|XL|XXL|[0-9.]+|One Size)$/i.test(str) || !isNaN(parseFloat(str));

                        if (isSize(p2)) {
                            variantValues['Color'].add(p1);
                            variantValues['Size'].add(p2);
                        } else if (isSize(p1)) {
                            variantValues['Size'].add(p1);
                            variantValues['Color'].add(p2);
                        } else {
                            // Default to Style-Option?
                            variantValues['Style'].add(p1);
                            // variantValues['Option'].add(p2); // Option not init in predefined
                            if (!variantValues['Option']) variantValues['Option'] = new Set();
                            variantValues['Option'].add(p2);
                        }
                    } else if (parts.length === 1) {
                        // Likely just Color or Style
                        variantValues['Color'].add(parts[0].trim());
                    } else {
                        // 3+ parts? Just add whole thing as 'Standard'
                        if (!variantValues['Standard']) variantValues['Standard'] = new Set();
                        variantValues['Standard'].add(v.variantKey);
                    }
                }
            });

            // Convert Set to Array for product.images
            const finalImages = Array.from(imagesSet)
                .filter(url => !!url && url.startsWith('http'))
                .map(url => url.replace(/["\[\]]/g, ''));

            // Construct Options
            const options = Object.keys(variantValues)
                .filter(key => variantValues[key] && variantValues[key].size > 0)
                .map(key => ({
                    name: key,
                    values: Array.from(variantValues[key])
                }));

            // If no options found, default
            if (options.length === 0) {
                options.push({ name: 'Standard', values: ['One Size'] });
            }

            // Calculate Price (Handle string range like "58.05-60.00")
            const sellPriceStr = String(details.sellPrice).split('-')[0].trim();
            const costPrice = parseFloat(sellPriceStr) || 20;
            const retailPrice = Math.ceil(costPrice * 3);

            const productName = formatProductName(details.productName);
            const productDesc = details.description || `Premium ${productName}. Quality materials and stylish design.`;

            const productData = {
                cjProductId: details.pid,
                name: productName,
                description: productDesc,
                price: retailPrice,
                images: finalImages,
                cjSku: details.productSku,
                options: options
            };

            console.log(`   🎨 Colors/Options found: ${options.map(o => `${o.name}: ${o.values.length}`).join(', ')}`);
            console.log(`   📸 Images count: ${finalImages.length}`);

            // Clean images for Stripe (Must be valid URLs)
            const stripeImages = productData.images
                .slice(0, 8)
                .filter(url => url.startsWith('http'));

            if (stripeImages.length === 0) {
                console.warn(`   ⚠️ No valid http images for Stripe for ${cjProductId}.`);
            }

            // ------------------------------------------
            // Stripe Integration
            // ------------------------------------------

            // Check existing
            const { data: existingProduct } = await supabase
                .from('products')
                .select('id, stripe_product_id, stripe_price_id')
                .eq('cj_product_id', cjProductId)
                .single();

            let stripeProductId: string = '';
            let stripePriceId: string = '';

            try {
                if (existingProduct?.stripe_product_id) {
                    console.log('   ✅ Already exists in Supabase, updating...');
                    stripeProductId = existingProduct.stripe_product_id;

                    if (stripeImages.length > 0) {
                        try {
                            await stripe.products.update(stripeProductId, {
                                images: stripeImages,
                                description: productData.description,
                                name: productData.name
                            });
                        } catch (stripeErr: any) {
                            console.error(`   ⚠️ Stripe update failed: ${stripeErr.message}`);
                        }
                    }

                    stripePriceId = existingProduct.stripe_price_id;
                } else if (stripeImages.length > 0) {
                    console.log('   💳 Creating Stripe product...');
                    const stripeProduct = await stripe.products.create({
                        name: productData.name,
                        description: productData.description,
                        images: stripeImages,
                        metadata: {
                            cj_product_id: cjProductId,
                            cj_sku: productData.cjSku,
                        },
                    });
                    stripeProductId = stripeProduct.id;

                    const stripePrice = await stripe.prices.create({
                        product: stripeProductId,
                        unit_amount: Math.round(productData.price * 100),
                        currency: 'usd',
                    });
                    stripePriceId = stripePrice.id;
                    console.log(`   💵 Stripe price: $${productData.price} (${stripePriceId})`);
                }
            } catch (stripeError: any) {
                console.error(`   ❌ Stripe Error: ${stripeError.message}`);
            }

            // ------------------------------------------
            // Supabase Upsert
            // ------------------------------------------
            // Use warehouseInventoryNum from variant (checked via debug output, though type def might be missing)
            // or inventoryNum
            const totalInventory = (details.variants || []).reduce((acc: number, v: any) => acc + (v.inventoryNum || v.warehouseInventoryNum || 100), 0) || 100;

            const { error: upsertError } = await supabase
                .from('products')
                .upsert({
                    cj_product_id: cjProductId,
                    name: productData.name,
                    description: productData.description,
                    price: productData.price,
                    images: productData.images,
                    cj_sku: productData.cjSku,
                    stripe_product_id: stripeProductId,
                    stripe_price_id: stripePriceId,
                    options: productData.options,
                    inventory: totalInventory,
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

        } catch (err: any) {
            console.error(`   ❌ Error processing ${cjProductId}: ${err.message}`);
        }

        // Rate Limit Delay
        console.log('   ⏳ Waiting 1.5s...');
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    console.log('\n✨ Import process finished.');
}

function formatProductName(name: string): string {
    return name
        .replace(/\s+/g, ' ')
        .split(' ')
        .slice(0, 8)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

main().catch(console.error);
