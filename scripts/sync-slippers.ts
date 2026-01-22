/**
 * Sync Specific Product Script
 * Syncs the fluffy slippers from CJDropshipping with all color variations
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

// Product data from CJDropshipping
const CJ_PRODUCT = {
    pid: '2410310614501625200',
    name: 'Cosy Warm Fluffy Slippers',
    sku: 'CJNS2177456',
    description: `Premium fluffy cotton slippers with non-slip soles. Perfect for indoor comfort during winter. Features soft, warm lining and durable PVC sole. Suitable for both men and women.

• Non-slip, warm, wear-resistant
• Soft cloth upper with plush lining
• Durable PVC sole
• Unisex design`,
    basePrice: 1.76,
    colors: [
        {
            name: 'Pink',
            image: 'https://oss-cf.cjdropshipping.com/product/2024/10/31/06/e6585d43-a9b9-4cc6-be26-b19ba9dc3520_trans.jpeg',
            variantPrefix: 'CJNS217745601',
        },
        {
            name: 'Khaki',
            image: 'https://oss-cf.cjdropshipping.com/product/2024/10/31/06/93afeeb7-bed5-4ca7-85d1-5c52eecd3dff_trans.jpeg',
            variantPrefix: 'CJNS217745605',
        },
        {
            name: 'White',
            image: 'https://oss-cf.cjdropshipping.com/product/2024/10/31/06/f13cd3ea-bed0-4484-94ef-e5a33b6f122f_trans.jpeg',
            variantPrefix: 'CJNS217745609',
        },
        {
            name: 'Gray',
            image: 'https://oss-cf.cjdropshipping.com/product/2024/10/31/06/754b1f6e-1c2a-4b06-b939-892c83c4f2c5_trans.jpeg',
            variantPrefix: 'CJNS217745612',
        },
    ],
    sizes: ['36-37', '38-39', '40-41', '42-43', '44-45'],
    additionalImages: [
        'https://oss-cf.cjdropshipping.com/product/2024/11/11/05/79e21674-1383-4a21-a91d-41fe28be29a3.jpg',
        'https://oss-cf.cjdropshipping.com/product/2024/11/11/05/67f27a44-e819-4d02-b2a5-acd41b1296d4.jpg',
        'https://oss-cf.cjdropshipping.com/product/2024/11/11/05/74c4e14d-fa22-4069-8973-b81ddc17c5bd.jpg',
    ],
};

// Retail markup (3.5x for profit + shipping buffer)
const MARKUP = 12;
const RETAIL_PRICE = Math.round(CJ_PRODUCT.basePrice * MARKUP * 100) / 100;

async function syncProducts() {
    console.log('🚀 Starting product sync...\n');

    // Step 1: Delete existing products from Supabase
    console.log('🗑️  Clearing existing products...');
    const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
        console.error('   ❌ Error deleting products:', deleteError.message);
    } else {
        console.log('   ✅ Existing products cleared\n');
    }

    // Step 2: Create products for each color variation
    for (const color of CJ_PRODUCT.colors) {
        console.log(`\n📌 Creating: ${CJ_PRODUCT.name} - ${color.name}`);

        try {
            // Create Stripe product
            console.log('   💳 Creating Stripe product...');
            const stripeProduct = await stripe.products.create({
                name: `${CJ_PRODUCT.name} - ${color.name}`,
                description: CJ_PRODUCT.description,
                images: [color.image, ...CJ_PRODUCT.additionalImages.slice(0, 2)],
                metadata: {
                    cj_product_id: CJ_PRODUCT.pid,
                    cj_sku: CJ_PRODUCT.sku,
                    color: color.name,
                },
            });

            // Create Stripe price
            const stripePrice = await stripe.prices.create({
                product: stripeProduct.id,
                unit_amount: Math.round(RETAIL_PRICE * 100),
                currency: 'usd',
            });
            console.log(`   💵 Stripe price: $${RETAIL_PRICE} (${stripePrice.id})`);

            // Insert to Supabase
            const { error: insertError } = await supabase.from('products').insert({
                name: `${CJ_PRODUCT.name} - ${color.name}`,
                description: CJ_PRODUCT.description,
                price: RETAIL_PRICE,
                images: [color.image, ...CJ_PRODUCT.additionalImages],
                cj_product_id: `${CJ_PRODUCT.pid}-${color.name.toLowerCase()}`,
                cj_sku: `${CJ_PRODUCT.sku}-${color.name}`,
                stripe_product_id: stripeProduct.id,
                stripe_price_id: stripePrice.id,
                options: [
                    { name: 'Size', values: CJ_PRODUCT.sizes },
                ],
                inventory: 10000,
                is_active: true,
            });

            if (insertError) {
                console.error('   ❌ Supabase error:', insertError.message);
            } else {
                console.log('   ✅ Synced to Supabase');
            }

        } catch (error: any) {
            console.error(`   ❌ Error: ${error.message}`);
        }
    }

    console.log('\n✨ Sync complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Products created: ${CJ_PRODUCT.colors.length}`);
    console.log(`   - Colors: ${CJ_PRODUCT.colors.map(c => c.name).join(', ')}`);
    console.log(`   - Sizes per product: ${CJ_PRODUCT.sizes.length}`);
    console.log(`   - Retail price: $${RETAIL_PRICE}`);
}

syncProducts().catch(console.error);
