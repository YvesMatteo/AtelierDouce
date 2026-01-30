/**
 * Add Single Product from QkSource
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Product Details from Scraping
const BASE_PRODUCT = {
    id: '2510040808101612300', // QkSource ID
    name: "Women's New Professional Double-board Waterproof Ski Suit",
    description: "Women's New Professional Double-board Waterproof Ski Suit. Features breathable, waterproof fabric (coefficient 20000). Available in multiple colors: Black, White, Red, Pink, Rose Red, Orange Red.",
    gender: 'Woman',
    retailPrice: 399.00,
    supplierPrice: 100.00, // Placeholder
    images: [
        "https://cf.cjdropshipping.com/quick/product/f7ef2a28-9ea5-4840-88f2-7d9f1f53cee8.jpg",
        "https://cf.cjdropshipping.com/quick/product/27ff6a0f-4ace-4428-9c14-719f43fc98c4.jpg",
        "https://cf.cjdropshipping.com/quick/product/2a7b53b6-fce7-4aae-8c3e-1c037aa826ac.jpg",
        "https://cf.cjdropshipping.com/quick/product/13bb6d9e-f98a-4870-9f4e-b300cf625b84.jpg",
        "https://cf.cjdropshipping.com/quick/product/873bc308-e0a5-4bb1-a250-78277fb9a0df.jpg",
        "https://cf.cjdropshipping.com/quick/product/238db90d-b3ed-4c1f-adce-a27cfff78e39.jpg",
        "https://cf.cjdropshipping.com/quick/product/c8aa22b6-b983-46a3-a985-0c8e306ff3f5.jpg",
        "https://cf.cjdropshipping.com/quick/product/137b5911-8dd8-446c-bb9e-a346f2ab26de.jpg"
    ],
    supplier: 'Qksource',
    options: [
        { name: 'Size', values: ['XS', 'S', 'M', 'L', 'XL'] },
        { name: 'Color', values: ['Black', 'White', 'Red', 'Pink', 'Rose Red', 'Orange Red'] }
    ]
};

const TARGET_CATEGORIES = ['Tops', 'Bottoms'];

// Initialize clients
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function addProductForCategory(category: string) {
    const listId = `${BASE_PRODUCT.id}-${category.toLowerCase()}`;
    console.log(`🚀 Starting product add for: ${BASE_PRODUCT.name} [${category}]`);

    try {
        // 1. Stripe Integration
        let stripeProductId: string | undefined;
        let stripePriceId: string | undefined;

        // Check if exists in DB first to avoid duplicates
        const { data: existingProduct } = await supabase
            .from('products')
            .select('stripe_product_id, stripe_price_id')
            .eq('cj_product_id', listId)
            .single();

        if (existingProduct?.stripe_product_id) {
            console.log('   ✅ Stripe product already exists in DB record');
            stripeProductId = existingProduct.stripe_product_id;
            stripePriceId = existingProduct.stripe_price_id;
        } else {
            console.log('   💳 Creating Stripe product...');
            const sProd = await stripe.products.create({
                name: `${BASE_PRODUCT.name} (${category})`, // Unique name for Stripe to avoid confusion if looking at dashboard
                description: BASE_PRODUCT.description,
                images: BASE_PRODUCT.images.slice(0, 8), // Stripe limit
                metadata: {
                    cj_product_id: listId,
                    category: category,
                    gender: BASE_PRODUCT.gender,
                    supplier: BASE_PRODUCT.supplier
                }
            });
            stripeProductId = sProd.id;

            const sPrice = await stripe.prices.create({
                product: stripeProductId,
                unit_amount: Math.round(BASE_PRODUCT.retailPrice * 100),
                currency: 'usd',
            });
            stripePriceId = sPrice.id;
            console.log(`   💵 Stripe Price Created: $${BASE_PRODUCT.retailPrice} (${sPrice.id})`);
        }

        // 2. Supabase Upsert
        const variant = {
            id: listId,
            sku: `QK-${BASE_PRODUCT.id}-${category.substring(0, 1)}`,
            price: BASE_PRODUCT.retailPrice,
            image: BASE_PRODUCT.images[0],
            options: { Color: 'Black', Size: 'M' } // Default stub
        };

        const { error } = await supabase
            .from('products')
            .upsert({
                cj_product_id: listId,
                name: BASE_PRODUCT.name,
                description: BASE_PRODUCT.description,
                price: BASE_PRODUCT.retailPrice,
                images: BASE_PRODUCT.images,
                cj_sku: `QK-${BASE_PRODUCT.id}`,
                stripe_product_id: stripeProductId,
                stripe_price_id: stripePriceId,
                options: BASE_PRODUCT.options,
                variants: [variant],
                inventory: 100,
                is_active: true,
                category: category,
                gender: BASE_PRODUCT.gender,
                supplier: BASE_PRODUCT.supplier,
                updated_at: new Date().toISOString()
            }, { onConflict: 'cj_product_id' });

        if (error) throw error;
        console.log(`   ✅ Synced to DB for category ${category}!`);

    } catch (error: any) {
        console.error(`   ❌ Error for ${category}: ${error.message}`);
    }
}

async function main() {
    for (const cat of TARGET_CATEGORIES) {
        await addProductForCategory(cat);
    }
}

main().catch(console.error);
