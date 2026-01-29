/**
 * Add Single Product from QkSource
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Product Details from Scraping
const PRODUCT = {
    id: '2501070601131628700', // QkSource ID
    name: 'Winter Coat Warm Lapel Long Fluffy Faux Fur Coat',
    description: 'Winter Coat Warm Lapel Long Fluffy Faux Fur Coat Women Loose Long Sleeve Jacket Outerwear Clothing. Available in Dark Brown, Dark Gray, Leopard Print.',
    categoryId: 'Outerwear', // Mapping to our categories
    gender: 'Woman',
    retailPrice: 49.95,
    supplierPrice: 16.42,
    images: [
        'https://oss.yesourcing.com/operation-center/file_202512290928012005571498424934400.png' // Main image
    ],
    supplier: 'Qksource' // New field support
};

// Initialize clients
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function addProduct() {
    console.log(`🚀 Starting single product add for: ${PRODUCT.name}`);

    try {
        // 1. Stripe Integration
        let stripeProductId: string | undefined;
        let stripePriceId: string | undefined;

        // Check if exists in DB first to avoid duplicates
        const { data: existingProduct } = await supabase
            .from('products')
            .select('stripe_product_id, stripe_price_id')
            .eq('cj_product_id', PRODUCT.id) // We use cj_product_id col for ALL IDs currently
            .single();

        if (existingProduct?.stripe_product_id) {
            console.log('   ✅ Stripe product already exists in DB record');
            stripeProductId = existingProduct.stripe_product_id;
            stripePriceId = existingProduct.stripe_price_id;
        } else {
            console.log('   💳 Creating Stripe product...');
            const sProd = await stripe.products.create({
                name: PRODUCT.name,
                description: PRODUCT.description,
                images: PRODUCT.images,
                metadata: {
                    cj_product_id: PRODUCT.id,
                    category: PRODUCT.categoryId,
                    gender: PRODUCT.gender,
                    supplier: PRODUCT.supplier
                }
            });
            stripeProductId = sProd.id;

            const sPrice = await stripe.prices.create({
                product: stripeProductId,
                unit_amount: Math.round(PRODUCT.retailPrice * 100),
                currency: 'usd',
            });
            stripePriceId = sPrice.id;
            console.log(`   💵 Stripe Price Created: $${PRODUCT.retailPrice} (${sPrice.id})`);
        }

        // 2. Supabase Upsert
        // We need to create a "Default" variant since we don't have the full variant list scraped dynamically here
        // But for a single product add, a Main variant is usually enough to start
        const variant = {
            id: PRODUCT.id,
            sku: `QK-${PRODUCT.id}`,
            price: PRODUCT.retailPrice,
            image: PRODUCT.images[0],
            options: { Color: 'Picture Color', Size: 'M' } // Default stub
        };

        const { error } = await supabase
            .from('products')
            .upsert({
                cj_product_id: PRODUCT.id, // Using this column for ID
                name: PRODUCT.name,
                description: PRODUCT.description,
                price: PRODUCT.retailPrice,
                images: PRODUCT.images,
                cj_sku: `QK-${PRODUCT.id}`,
                stripe_product_id: stripeProductId,
                stripe_price_id: stripePriceId,
                options: [{ name: 'Size', values: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'] }, { name: 'Color', values: ['Dark Brown', 'Dark Gray', 'Leopard Print', 'Picture Color'] }], // Manual entry from page
                variants: [variant], // Minimal variant
                inventory: 100,
                is_active: true,
                category: PRODUCT.categoryId,
                gender: PRODUCT.gender,
                supplier: PRODUCT.supplier,
                updated_at: new Date().toISOString()
            }, { onConflict: 'cj_product_id' });

        if (error) throw error;
        console.log(`   ✅ Synced to DB!`);

    } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
    }
}

addProduct().catch(console.error);
