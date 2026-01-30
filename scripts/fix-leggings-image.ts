/**
 * Fix Leggings Product - Remove broken local image
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const PRODUCT_ID = '996BA858-DC7C-4405-9A62-9BF17218E6BE';

// The broken image
const BROKEN_IMAGE = 'https://atelierdouce.shop/images/products/brushed-leggings-main.png';

// QkSource images (from existing script)
const QKSOURCE_IMAGES = [
    'https://cf.cjdropshipping.com/16008768/991098103420.jpg',
    'https://cf.cjdropshipping.com/20200924/7085839286614.jpg',
    'https://cf.cjdropshipping.com/20200924/919808308746.jpg'
];

// Initialize clients
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function fixLeggings() {
    console.log(`🚀 Fixing images for Brushed Fleece Leggings...`);

    try {
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('cj_product_id', PRODUCT_ID)
            .single();

        if (fetchError || !product) {
            throw new Error(`Product not found: ${fetchError?.message}`);
        }

        console.log(`   Found product: ${product.name}`);

        // Remove broken image and ensure QkSource images are present
        const currentImages = product.images || [];
        const cleanImages = currentImages.filter((img: string) => img !== BROKEN_IMAGE);

        // Merge with QKSOURCE_IMAGES, avoiding duplicates
        const finalImagesSet = new Set([...cleanImages, ...QKSOURCE_IMAGES]);
        const finalImages = Array.from(finalImagesSet).slice(0, 8); // Limit to 8

        console.log(`   Updating to ${finalImages.length} images.`);

        // Update Supabase
        const { error } = await supabase
            .from('products')
            .update({
                images: finalImages,
                updated_at: new Date().toISOString()
            })
            .eq('cj_product_id', PRODUCT_ID);

        if (error) throw error;
        console.log(`   ✅ Updated Supabase`);

        // Update Stripe
        if (product.stripe_product_id) {
            await stripe.products.update(product.stripe_product_id, {
                images: finalImages
            });
            console.log(`   ✅ Updated Stripe`);
        }

    } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
    }
}

fixLeggings();
