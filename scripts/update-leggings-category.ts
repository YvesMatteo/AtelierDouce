/**
 * Update Leggings Product - Change Category to Bottoms
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const PRODUCT_ID = '996BA858-DC7C-4405-9A62-9BF17218E6BE';
const NEW_CATEGORY = 'Bottoms';

// Initialize clients
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

async function updateCategory() {
    console.log(`🚀 Updating category for Brushed Fleece Leggings to ${NEW_CATEGORY}`);

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
        console.log(`   Current category: ${product.category}`);

        // 2. Update Supabase
        const { error } = await supabase
            .from('products')
            .update({
                category: NEW_CATEGORY,
                updated_at: new Date().toISOString()
            })
            .eq('cj_product_id', PRODUCT_ID);

        if (error) throw error;
        console.log(`   ✅ Updated Supabase category`);

        // 3. Update Stripe if product ID exists (Metadata update)
        if (product.stripe_product_id) {
            console.log(`   💳 Updating Stripe product metadata...`);
            await stripe.products.update(product.stripe_product_id, {
                metadata: {
                    ...product.metadata,
                    category: NEW_CATEGORY
                }
            });
            console.log(`   ✅ Updated Stripe metadata`);
        }

        console.log(`\n✨ Product category updated successfully!`);

    } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
    }
}

updateCategory().catch(console.error);
