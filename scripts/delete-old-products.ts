/**
 * Delete Old Products Script
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize clients
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
});

const PRODUCTS_TO_DELETE_NAMES = [
    'Women Winter Boots Mid-calf Snow Boots',
    'Fashion Ankle Boots With Side Zipper',
    'Fashion Boots With Buckle Chunky Heel',
    'Snow Boots Winter Warm Hook And',
    'Fashion Lace-up Chunky Heels Boots Winter',
    'Cosy Warm Fluffy Slippers - Khaki',
    'Cosy Warm Fluffy Slippers - White',
    'Cosy Warm Fluffy Slippers - Gray',
    'Cosy Warm Fluffy Slippers - Pink'
];

async function deleteProducts() {
    console.log('🗑️  Starting cleanup...');

    // 1. Get products from Supabase
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .in('name', PRODUCTS_TO_DELETE_NAMES);

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log(`Found ${products.length} products to delete.`);

    for (const product of products) {
        console.log(`\nProcessing: ${product.name} (${product.id})`);

        // 2. Archive/Delete in Stripe
        if (product.stripe_product_id) {
            try {
                // Try to delete, if fails (due to transactions), archive it.
                // However, usually archiving is safer and sufficient.
                await stripe.products.update(product.stripe_product_id, { active: false });
                console.log(`   ✅ Archived in Stripe: ${product.stripe_product_id}`);
            } catch (err: any) {
                console.error(`   ❌ Stripe Error: ${err.message}`);
            }
        }

        // 3. Delete from Supabase
        const { error: delError } = await supabase
            .from('products')
            .delete()
            .eq('id', product.id);

        if (delError) {
            console.error(`   ❌ Supabase Delete Error: ${delError.message}`);
        } else {
            console.log('   ✅ Deleted from Supabase');
        }
    }

    console.log('\n✨ Cleanup complete!');
}

deleteProducts();
