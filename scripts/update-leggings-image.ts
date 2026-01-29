/**
 * Update Leggings Product - Add main image
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const PRODUCT_ID = '996BA858-DC7C-4405-9A62-9BF17218E6BE';

// The main image URL - after deployment this will be accessible
const MAIN_IMAGE = 'https://atelierdouce.shop/images/products/brushed-leggings-main.png';

// QkSource images
const QKSOURCE_IMAGES = [
    'https://cf.cjdropshipping.com/16008768/991098103420.jpg',
    'https://cf.cjdropshipping.com/20200924/7085839286614.jpg',
    'https://cf.cjdropshipping.com/20200924/919808308746.jpg'
];

// Final images: main first, then QkSource
const FINAL_IMAGES = [MAIN_IMAGE, ...QKSOURCE_IMAGES];

// Initialize clients
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function updateProduct() {
    console.log(`🚀 Updating product images for Brushed Fleece Leggings`);

    try {
        // 1. Get the product to find Stripe product ID
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('cj_product_id', PRODUCT_ID)
            .single();

        if (fetchError || !product) {
            throw new Error(`Product not found: ${fetchError?.message}`);
        }

        console.log(`   Found product: ${product.name}`);
        console.log(`   Current images: ${product.images?.length || 0}`);

        // 2. Update Supabase
        const { error } = await supabase
            .from('products')
            .update({
                images: FINAL_IMAGES,
                updated_at: new Date().toISOString()
            })
            .eq('cj_product_id', PRODUCT_ID);

        if (error) throw error;
        console.log(`   ✅ Updated Supabase images`);

        // 3. Update Stripe if product ID exists
        if (product.stripe_product_id) {
            console.log(`   💳 Updating Stripe product...`);
            await stripe.products.update(product.stripe_product_id, {
                images: FINAL_IMAGES.slice(0, 8) // Stripe max 8 images
            });
            console.log(`   ✅ Updated Stripe images`);
        }

        console.log(`\n✨ Product images updated successfully!`);
        console.log(`   Main image: ${MAIN_IMAGE}`);
        console.log(`   Additional images: ${QKSOURCE_IMAGES.length} from QkSource`);

    } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
    }
}

updateProduct().catch(console.error);
