/**
 * Fix Catalog Mismatches and Broken Images
 */

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

// Map of CJ ID -> Correct Details
// derived from visual inspection and import script comments
const CORRECTIONS = [
    {
        cjId: '2512020833381633000', // Pink Puffer
        name: 'Pink Cloud Puffer Jacket',
        category: 'Clothing'
    },
    {
        cjId: '2511300843381609000', // Blue/Black Puffer (was Elegant Beige Black Bag)
        name: 'Detachable Hooded Puffer Coat',
        category: 'Clothing'
    },
    {
        cjId: '1381486068892831744', // Hoop Earrings (was Vintage Metal Style Top)
        name: 'Minimalist Hoop Circle Earrings',
        category: 'Jewelry'
    },
    {
        cjId: '2512240513531625200', // Platform Boots (was Solid Color Premium Bag)
        name: 'Platform Snow Boots',
        category: 'Shoes'
    },
    {
        cjId: '2510140745261632700', // Loose Fit Camel Coat
        // Image looked broken/white. Let's ensure a valid image is used.
        // Known good image from CJ?
        // Using one from import script list if possible, or just ensuring current is valid.
        name: 'Loose Fit Camel Coat',
        checkImage: true
    },
    {
        cjId: 'B4158AAB-B1EE-431B-A468-D1BA8085452B-TOP',
        checkImage: true
    },
    {
        cjId: 'B4158AAB-B1EE-431B-A468-D1BA8085452B-BOT',
        checkImage: true
    }
];

async function fixCatalog() {
    console.log('🚀 Starting Catalog Fix...');

    for (const fix of CORRECTIONS) {
        let product;

        if (fix.cjId) {
            const { data } = await supabase.from('products').select('*').eq('cj_product_id', fix.cjId).single();
            product = data;
        } else if (fix.searchName) {
            const { data } = await supabase.from('products').select('*').ilike('name', `%${fix.searchName}%`).single();
            product = data;
        }

        if (!product) {
            console.log(`⚠️ Product not found: ${fix.cjId || fix.searchName}`);
            continue;
        }

        console.log(`\nProcessing: ${product.name} (${product.cj_product_id})`);

        const updates: any = {};
        let shouldUpdate = false;

        // 1. Name Correct
        if (fix.name && product.name !== fix.name) {
            console.log(`   ✏️ Renaming to: ${fix.name}`);
            updates.name = fix.name;
            shouldUpdate = true;
        }

        // 2. Category Correct
        if (fix.category && product.category !== fix.category) {
            console.log(`   📂 Categorizing as: ${fix.category}`);
            updates.category = fix.category;
            shouldUpdate = true;
        }

        // 3. Image Fixes
        if (fix.checkImage || fix.fixImage) {
            console.log(`   🖼️ Checking images...`);
            // Simple logic: if Main image is bad or missing, try to find a better one from existing array or fallback
            // For Ski Suit (fixImage=true), we know verified good images? 
            // Let's just try to rotate if multiple exist, or verify.

            const currentImages = product.images || [];
            if (currentImages.length > 0) {
                // Check main image reachability
                try {
                    const res = await fetch(currentImages[0], { method: 'HEAD' });
                    if (!res.ok) {
                        console.log(`   ❌ Main image dead: ${currentImages[0]}`);
                        // Remove it
                        const newImages = currentImages.slice(1);
                        if (newImages.length > 0) {
                            updates.images = newImages;
                            shouldUpdate = true;
                            console.log(`   🔄 Promoted next image.`);
                        } else {
                            console.log(`   ⚠️ No spare images!`);
                        }
                    } else {
                        console.log(`   ✅ Main image OK.`);
                    }
                } catch (e) {
                    console.log(`   ❌ Check failed, assuming dead.`);
                    const newImages = currentImages.slice(1);
                    if (newImages.length > 0) {
                        updates.images = newImages;
                        shouldUpdate = true;
                        console.log(`   🔄 Promoted next image.`);
                    }
                }
            } else {
                console.log(`   ⚠️ No images to fix!`);
            }
        }

        if (shouldUpdate) {
            // Supabase
            await supabase.from('products').update(updates).eq('id', product.id);
            console.log(`   ✅ Updated Supabase.`);

            // Stripe
            if (product.stripe_product_id) {
                const stripeUpdates: any = {};
                if (updates.name) stripeUpdates.name = updates.name;
                if (updates.images) stripeUpdates.images = updates.images.slice(0, 8);

                if (Object.keys(stripeUpdates).length > 0) {
                    await stripe.products.update(product.stripe_product_id, stripeUpdates);
                    console.log(`   ✅ Updated Stripe.`);
                }
            }
        } else {
            console.log(`   ✨ No changes needed.`);
        }
    }
}

fixCatalog();
