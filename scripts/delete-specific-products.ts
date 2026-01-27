
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

// IDs mapped from list-products output based on user request names
const PRODUCTS_TO_DELETE = [
    'f28a6426-9b30-4995-9bc4-e04ffea420dc', // Fashion Individual Casual Cotton Slippers Women Bear Logo
    'fd5689f1-7a84-44b3-8820-660fca6bb692', // Women's Short-tube Snow Boots With Latex Insoles Pink
    'df0e4c82-0bc5-449a-9408-9f6ef0b91613e',// Large-sized Cotton Slippers... Note: Checking ID from list
    // 'df0e4c82-0bc5-449a-9408-9f6ef091613e'? List says 'df0e4c82-0bc5-449a-9408-9f6ef091613e'
    'df0e4c82-0bc5-449a-9408-9f6ef091613e',
    'c2e29d66-6cb4-421d-a188-a96c1a5aa762', // Fashionable And Versatile Fleece-lined...
    'e52381a7-795d-4d3c-8b77-5fa735745f3b', // Women's Warm Casual Knitted Octagonal Black
];

async function deleteProducts() {
    console.log(`🗑️  Starting deletion of ${PRODUCTS_TO_DELETE.length} specific products...\n`);

    for (const id of PRODUCTS_TO_DELETE) {
        // 1. Get Product Details (to get Stripe ID)
        const { data: product } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (!product) {
            console.log(`❌ Product ${id} not found in DB.`);
            continue;
        }

        console.log(`📌 Deleting: ${product.name} (${id})`);

        // 2. Delete from Stripe
        if (product.stripe_product_id) {
            try {
                // Delete Product (Prices are deleted automatically usually, or we archive)
                // Actually Stripe API: Delete product requires deleting prices first usually unless we just archive.
                // Let's Archive to be safe or Delete if no transactions?
                // User said "delete completely".
                // Try delete.
                await stripe.products.del(product.stripe_product_id);
                console.log('   ✅ Deleted from Stripe');
            } catch (err: any) {
                console.log(`   ⚠️ Stripe delete failed (might have txns): ${err.message}`);
                // Try archive if delete fails?
                try {
                    await stripe.products.update(product.stripe_product_id, { active: false });
                    console.log('   ✅ Archived in Stripe instead');
                } catch (e) { }
            }
        }

        // 3. Delete from Supabase
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.log(`   ❌ Supabase delete failed: ${error.message}`);
        } else {
            console.log('   ✅ Deleted from Supabase');
        }
    }

    console.log('\n✨ Deletion complete.');
}

deleteProducts().catch(console.error);
