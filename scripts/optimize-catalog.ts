
import 'dotenv/config';
import { getCJClient } from '../lib/cjdropshipping';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// ==========================================
// CONFIGURATION
// ==========================================

// We will fetch all products currently in our DB to optimize them
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function main() {
    console.log('🚀 Starting catalog optimization (English Names + Strict Image/Variant Sync)...\n');

    // 1. Get all products from Supabase
    const { data: products, error } = await supabase
        .from('products')
        .select('*');

    if (error || !products) {
        console.error('❌ Failed to fetch products:', error?.message);
        return;
    }

    console.log(`📋 Found ${products.length} products to optimize.`);
    const cj = getCJClient();

    for (const product of products) {
        const cjProductId = product.cj_product_id;
        console.log(`\n📌 Optimizing: ${product.name} (${cjProductId})`);

        try {
            // 2. Fetch fresh details
            const details = await cj.getProductDetails(cjProductId);
            if (!details) {
                console.error(`   ❌ CJ Details not found. Skipping.`);
                continue;
            }

            // 3. Name Fix (Force English)
            let englishName = '';

            // Strategy A: Search for the product to get 'nameEn' (Search API usually yields English names)
            try {
                const searchRes = await cj.searchProducts({ keyWord: cjProductId });
                const found = searchRes.content[0]?.productList?.find(p => p.id === cjProductId);
                if (found && found.nameEn) {
                    englishName = found.nameEn;
                }
            } catch (e) {
                // Ignore search error
            }

            // Strategy B: Use Variant Name (Prefix)
            if (!englishName && details.variants && details.variants.length > 0) {
                const vName = details.variants[0].variantNameEn;
                if (vName) {
                    // Heuristic: Use the part before the first Option Value?
                    // For now, let's just use it as is and format it.
                    englishName = vName;
                }
            }

            // Strategy C: Absolute Fallback
            if (!englishName) {
                englishName = details.productNameEn || String(details.productName).replace(/[^\x00-\x7F]/g, "") || "New Product";
            }

            englishName = formatProductName(englishName);

            // 4. Variant/Image Sync Logic
            // Goal: Only keep variants that have a distinct image.

            const validVariants: any[] = [];
            const imagesSet = new Set<string>();

            // Let's iterate variants.
            (details.variants || []).forEach((v: any) => {
                if (v.variantImage && v.variantImage.startsWith('http')) {
                    validVariants.push(v);
                    imagesSet.add(v.variantImage);
                }
            });

            if (validVariants.length === 0) {
                console.warn(`   ⚠️ No valid variants with images found! parsing everything instead.`);
                // Fallback: keep all variants, use main image
                (details.variants || []).forEach((v: any) => validVariants.push(v));
                if (details.productImage) imagesSet.add(details.productImage);
            }

            // 5. Build Options from VALID variants only
            const variantValues: Record<string, Set<string>> = {
                'Color': new Set(),
                'Size': new Set(),
                'Style': new Set() // Temporary bucket
            };

            validVariants.forEach(v => {
                // Parse options
                if (v.variantKey) {
                    const parts = v.variantKey.split('-');
                    if (parts.length === 2) {
                        const p1 = parts[0].trim();
                        const p2 = parts[1].trim();
                        const isSize = (str: string) => /^(XS|S|M|L|XL|XXL|XXXL|[0-9.]+|One Size)$/i.test(str) || !isNaN(parseFloat(str));

                        if (isSize(p2)) {
                            variantValues['Color'].add(p1);
                            variantValues['Size'].add(p2);
                        } else if (isSize(p1)) {
                            variantValues['Size'].add(p1);
                            variantValues['Color'].add(p2);
                        } else {
                            // If Style and Color are redundant?
                            // e.g. "Black-Black"
                            if (p1 === p2) {
                                variantValues['Color'].add(p1);
                            } else {
                                variantValues['Style'].add(p1);
                                if (!variantValues['Option']) variantValues['Option'] = new Set();
                                variantValues['Option'].add(p2);
                            }
                        }
                    } else if (parts.length === 1) {
                        variantValues['Color'].add(parts[0].trim());
                    } else {
                        if (!variantValues['Standard']) variantValues['Standard'] = new Set();
                        variantValues['Standard'].add(v.variantKey);
                    }
                }
            });

            // 6. Final Clean of Options
            const finalOptions = Object.keys(variantValues)
                .filter(key => variantValues[key] && variantValues[key].size > 0)
                .map(key => ({
                    name: key,
                    values: Array.from(variantValues[key])
                }));

            // 7. Final Images List
            const productDefinedImages = (details.productImageSet || []).filter((img: string) => !!img);
            const variantImages = Array.from(imagesSet);

            // Combine: Main Image + Variant Images (Unique)
            // HEURISTIC: Use the first variant image as the main image? 
            let finalImagesList = [...variantImages];
            productDefinedImages.forEach(img => {
                if (!imagesSet.has(img) && img.startsWith('http')) {
                    finalImagesList.push(img);
                }
            });

            finalImagesList = finalImagesList.map(u => u.replace(/["\[\]]/g, ''));

            // 8. Update Supabase
            // Recalculate inventory based on valid variants
            const totalInventory = validVariants.reduce((acc, v) => acc + (v.inventoryNum || v.warehouseInventoryNum || 100), 0);

            const { error: upError } = await supabase
                .from('products')
                .update({
                    name: englishName,
                    images: finalImagesList,
                    options: finalOptions,
                    inventory: totalInventory,
                    updated_at: new Date().toISOString()
                })
                .eq('id', product.id);

            if (upError) {
                console.error(`   ❌ Supabase Update Failed: ${upError.message}`);
            } else {
                console.log(`   ✅ Supabase: Updated Sync (Name: ${englishName}, Images: ${finalImagesList.length}, Variants: ${validVariants.length})`);
            }

            // 9. Update Stripe
            if (product.stripe_product_id && englishName.length > 3) { // Only update if name is valid
                const stripeImages = finalImagesList.slice(0, 8); // Max 8
                try {
                    await stripe.products.update(product.stripe_product_id, {
                        name: englishName,
                        images: stripeImages
                    });
                    console.log(`   ✅ Stripe: Updated Images & Name`);
                } catch (sErr: any) {
                    console.error(`   ⚠️ Stripe Update Failed: ${sErr.message}`);
                }
            }

        } catch (err: any) {
            console.error(`   ❌ Error: ${err.message}`);
        }

        // Rate Limit
        console.log('   ⏳ Waiting 1s...');
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

function formatProductName(name: string): string {
    return name
        .replace(/[^\x00-\x7F]/g, "") // Remove non-ASCII (often Chinese chars)
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .slice(0, 8)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

main().catch(console.error);
