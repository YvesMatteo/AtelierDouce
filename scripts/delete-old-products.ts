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
    'Cozy Anti-Slip Cotton Slippers',
    'Winter Snow Boots with Bowknot',
    "Women's Autumn and Winter Casual Coat",
    'Solid Color Winter Tassel Scarf'
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

        // 3. Soft Delete (Hide) in Supabase
        const { error: delError } = await supabase
            .from('products')
            .update({ is_active: false })
            .eq('id', product.id);

        if (delError) {
            console.error(`   ❌ Supabase Update Error: ${delError.message}`);
        } else {
            console.log('   ✅ Deactivated in Supabase (Soft Delete)');
        }
    }

    console.log('\n✨ Cleanup complete!');
}

deleteProducts();
