
import { cleanProductDescription, cleanProductName, removeChinese } from './utils';
import 'dotenv/config';
import { getCJClient } from '../lib/cjdropshipping';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// TARGET ID for "3D Effect Patterned Jacket" (Women's Casual Hooded Cotton Jacket)
const TARGET_PRODUCT_ID = '2411190554561614400';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

// Minimal Category Logic
function determineCategory(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('jacket') || lowerName.includes('coat')) return 'Clothing';
    return 'Clothing'; // Default
}

async function main() {
    console.log(`🚀 Restoring product: ${TARGET_PRODUCT_ID}...`);
    const cj = getCJClient();

    try {
        // 1. Fetch Product Details
        const details = await cj.getProductDetails(TARGET_PRODUCT_ID);
        if (!details) {
            console.error(`❌ Could not find product details for ${TARGET_PRODUCT_ID}`);
            return;
        }

        // 2. Process Images
        const imagesSet = new Set<string>();
        if (details.productImage) imagesSet.add(details.productImage);
        if (details.productImageSet) details.productImageSet.forEach((img: string) => imagesSet.add(img));

        details.variants?.forEach((v: any) => {
            if (v.variantImage) imagesSet.add(v.variantImage);
        });

        const finalImages = Array.from(imagesSet)
            .filter(url => !!url && url.startsWith('http'))
            .map(url => url.replace(/["\[\]]/g, ''));

        // 3. Process Variants
        const variantValues: Record<string, Set<string>> = { 'Color': new Set(), 'Size': new Set(), 'Style': new Set() };
        const variantsData: any[] = [];

        details.variants?.forEach((v: any) => {
            let variantOptions: Record<string, string> = {};
            if (v.variantKey) {
                const parts = v.variantKey.split('-');
                if (parts.length >= 2) {
                    const p1 = parts[0].trim();
                    const p2 = parts[1].trim();
                    const isSize = (str: string) => /^(XS|S|M|L|XL|XXL|[0-9.]+|One Size)$/i.test(str) || !isNaN(parseFloat(str));

                    if (isSize(p2)) {
                        variantValues['Color'].add(p1);
                        variantValues['Size'].add(p2);
                        variantOptions['Color'] = p1;
                        variantOptions['Size'] = p2;
                    } else {
                        variantValues['Color'].add(p1); // Simplified fallback
                        variantOptions['Color'] = p1;
                    }
                } else {
                    variantValues['Color'].add(v.variantKey);
                    variantOptions['Color'] = v.variantKey;
                }
            }

            variantsData.push({
                id: v.vid,
                sku: v.variantSku,
                image: v.variantImage,
                price: v.variantSellPrice,
                options: variantOptions
            });
        });

        const options = Object.keys(variantValues)
            .filter(key => variantValues[key].size > 0)
            .map(key => ({ name: key, values: Array.from(variantValues[key]) }));

        if (options.length === 0) options.push({ name: 'Standard', values: ['One Size'] });

        // 4. Calculate Price
        const sellPriceStr = String(details.sellPrice).split('-')[0].trim();
        const costPrice = parseFloat(sellPriceStr) || 20;
        const retailPrice = Math.ceil(costPrice * 3.5) - 0.05;

        // 5. Name & Desc
        // Force the name used in the report if possible, or clean the CJ name
        // "Women's Casual Hooded Cotton Jacket" -> "3D Effect Patterned Jacket" (based on user request/report)
        // Ideally we use a cleanName function but I will hardcode the preference if it mismatches
        let productName = cleanProductName(details.productName);
        if (productName.includes("Women's Casual Hooded Cotton Jacket")) {
            productName = "3D Effect Patterned Jacket";
        }

        const cleanDesc = cleanProductDescription(details.description);
        const productDesc = cleanDesc.length > 20 ? cleanDesc : `Premium ${productName}. Quality materials.`;
        const category = determineCategory(productName);

        // 6. Stripe Upsert
        const stripeImages = finalImages.slice(0, 8).filter(url => url.startsWith('http'));
        let stripeProductId = '';
        let stripePriceId = '';

        try {
            console.log('   💳 Creating/Updating Stripe product...');
            const stripeProduct = await stripe.products.create({
                name: productName,
                description: productDesc,
                images: stripeImages,
                metadata: { cj_product_id: TARGET_PRODUCT_ID },
            });
            stripeProductId = stripeProduct.id;

            const stripePrice = await stripe.prices.create({
                product: stripeProductId,
                unit_amount: Math.round(retailPrice * 100),
                currency: 'usd',
            });
            stripePriceId = stripePrice.id;
        } catch (e: any) {
            console.log(`   ⚠️ Stripe error (might vary): ${e.message}`);
            // If manual fallback is needed for ID
        }

        // 7. Supabase Upsert
        const { error: upsertError } = await supabase
            .from('products')
            .upsert({
                cj_product_id: TARGET_PRODUCT_ID,
                name: productName,
                description: productDesc,
                price: retailPrice,
                images: finalImages,
                cj_sku: details.productSku,
                stripe_product_id: stripeProductId,
                stripe_price_id: stripePriceId,
                category: category,
                options: options,
                variants: variantsData,
                inventory: 100, // default
                is_active: true,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'cj_product_id' });

        if (upsertError) {
            console.error(`   ❌ Supabase Error: ${upsertError.message}`);
        } else {
            console.log(`   ✅ Successfully restored "${productName}" to Supabase!`);
        }

    } catch (err: any) {
        console.error(`   ❌ Error: ${err.message}`);
    }
}

main();
