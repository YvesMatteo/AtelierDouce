
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import fs from 'fs';

// Read extracted images
const IMAGES = [
    '/product-images/luxe-ear-warmers/01-light-brown.png',
    '/product-images/luxe-ear-warmers/02.png',
    '/product-images/luxe-ear-warmers/03.png',
    '/product-images/luxe-ear-warmers/04.png'
];

// Product Data
const PRODUCT = {
    cj_id: '2512230236071631600',
    name: 'Luxe Fox Fur Ear Warmers',
    description: 'Experience ultimate warmth and elegance with our Luxe Fox Fur Ear Warmers. Soft, fluffy, and designed to protect against the harshest frost while adding a touch of sophisticated style to your winter ensemble.',
    price: 24.00,
    category: 'Accessories',
    gender: 'Woman',
    supplier: 'Qksource',
    colors: ['Beige', 'Light Yellow', 'Turquoise Blue', 'Gray', 'Black', 'Dark Coffee', 'Light Coffee', 'Pink']
};

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function main() {
    console.log(`🚀 Adding Product: ${PRODUCT.name}`);

    try {
        // 1. Stripe Setup
        let stripeProductId: string | undefined;
        let stripePriceId: string | undefined;

        // Check if exists
        const { data: existingProduct } = await supabase
            .from('products')
            .select('stripe_product_id, stripe_price_id')
            .eq('cj_product_id', PRODUCT.cj_id)
            .single();

        if (existingProduct?.stripe_product_id) {
            console.log('   ✅ Stripe product already exists in DB');
            stripeProductId = existingProduct.stripe_product_id;
            stripePriceId = existingProduct.stripe_price_id;
        } else {
            console.log('   💳 Creating Stripe product...');
            const sProd = await stripe.products.create({
                name: PRODUCT.name,
                description: PRODUCT.description,
                images: IMAGES.slice(0, 8),
                metadata: {
                    cj_product_id: PRODUCT.cj_id,
                    category: PRODUCT.category,
                    gender: PRODUCT.gender,
                    supplier: PRODUCT.supplier
                }
            });
            stripeProductId = sProd.id;

            const sPrice = await stripe.prices.create({
                product: stripeProductId,
                unit_amount: Math.round(PRODUCT.price * 100),
                currency: 'usd',
            });
            stripePriceId = sPrice.id;
            console.log(`   💵 Stripe Price Created: $${PRODUCT.price}`);
        }

        // 2. Prepare Variants
        // We will create one variants entries per color to be safe, or just one main one? 
        // Existing logic often uses a single variant object in the array for the main display, 
        // and the 'options' JSONB column for the selectors.
        // Let's stick to that pattern unless we want specific SKUs for each.
        // Given "add all variants", usually means make them selectable.

        const mainVariant = {
            id: PRODUCT.cj_id, // Main ID
            sku: `QK-${PRODUCT.cj_id}`,
            price: PRODUCT.price,
            image: IMAGES[0],
            options: { Color: PRODUCT.colors[0], Size: 'One Size' }
        };

        // 3. Upsert to Supabase
        const { error } = await supabase
            .from('products')
            .upsert({
                cj_product_id: PRODUCT.cj_id,
                name: PRODUCT.name,
                description: PRODUCT.description,
                price: PRODUCT.price,
                images: IMAGES,
                cj_sku: `QK-${PRODUCT.cj_id}`,
                stripe_product_id: stripeProductId,
                stripe_price_id: stripePriceId,
                options: [
                    { name: 'Color', values: PRODUCT.colors },
                    { name: 'Size', values: ['One Size'] }
                ],
                variants: [mainVariant],
                inventory: 100,
                is_active: true,
                category: PRODUCT.category,
                gender: PRODUCT.gender,
                supplier: PRODUCT.supplier,
                updated_at: new Date().toISOString()
            }, { onConflict: 'cj_product_id' });

        if (error) throw error;
        console.log(`   ✅ Successfully added to Supabase in category ${PRODUCT.category}`);

    } catch (e: any) {
        console.error(`   ❌ Error:`, e.message);
    }
}

main().catch(console.error);
